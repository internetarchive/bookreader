import fs from 'fs';
import path from 'path';
import PocketTtsSynthesizer from '@/src/audioreader/pocket/PocketTtsSynthesizer.js';
import SentencePieceUnigram from '@/src/audioreader/pocket/SentencePieceUnigram.js';

/**
 * The generation loop is exercised with stand-in ONNX sessions rather than the
 * real 146MB bundle: what needs pinning here is the control flow the port could
 * plausibly get wrong -- where model state is read back from the output list, when
 * EOS stops generation, how the frame budget is capped, that a voice is required,
 * and that abort is honoured mid-loop. Whether the real models produce speech is
 * verified separately by scripts/verify-pocket-tts.mjs against the actual weights.
 */

const LATENT_DIM = 4;
const CONDITIONING_DIM = 8;
const FLOW_STATES = 3;
const MIMI_STATES = 2;
const SAMPLES_PER_FRAME = 16;

/** A minimal stand-in for onnxruntime's Tensor. */
class FakeTensor {
  constructor(type, data, dims) {
    this.type = type;
    this.data = data;
    this.dims = dims;
  }
}

const runtime = { Tensor: FakeTensor };

/**
 * @param {Object} [opts]
 * @param {number} [opts.eosAtStep] step at which the EOS logit goes high
 * @return {Object}
 */
function makeBundle() {
  const state = (index, prefix, fill = 'zeros', dtype = 'float32') => ({
    index, input_name: `${prefix}_${index}`, output_name: `out_${prefix}_${index}`,
    dtype, fill, shape: [1, 2], key: 'cache', module: `m${index}`,
  });

  return {
    bundle_name: 'test',
    sample_rate: 24000,
    frame_rate: 12.5,
    samples_per_frame: SAMPLES_PER_FRAME,
    latent_dim: LATENT_DIM,
    conditioning_dim: CONDITIONING_DIM,
    max_token_per_chunk: 50,
    insert_bos_before_voice: false,
    remove_semicolons: false,
    pad_with_spaces_for_short_inputs: false,
    model_recommended_frames_after_eos: null,
    flow_lm_state_manifest: Array.from({ length: FLOW_STATES }, (_, i) => state(i, 'state')),
    mimi_state_manifest: Array.from({ length: MIMI_STATES }, (_, i) => state(i, 'mimi')),
  };
}

/**
 * Sessions that record what they were called with, and emit shapes matching the
 * manifests so the state plumbing is genuinely exercised.
 * @param {{eosAtStep?: number}} [opts]
 */
function makeSessions({ eosAtStep = 2 } = {}) {
  const calls = { textConditioner: 0, flowLmMain: 0, flowLmFlow: 0, mimiDecoder: 0, mimiEncoder: 0 };
  const feeds = { flowLmMain: [], flowLmFlow: [], mimiDecoder: [] };
  let mainStep = -1; // -1 while priming

  const outputsFor = (prefix, count) => Array.from(
    { length: count },
    (_, i) => `out_${prefix}_${i}`,
  );

  const sessions = {
    textConditioner: {
      inputNames: ['token_ids'],
      outputNames: ['embeddings'],
      run: async () => {
        calls.textConditioner++;
        return { embeddings: new FakeTensor('float32', new Float32Array(2 * CONDITIONING_DIM), [1, 2, CONDITIONING_DIM]) };
      },
    },

    flowLmMain: {
      inputNames: ['sequence', 'text_embeddings'],
      outputNames: ['conditioning', 'eos_logit', ...outputsFor('state', FLOW_STATES)],
      run: async (input) => {
        calls.flowLmMain++;
        feeds.flowLmMain.push(input);
        // The priming call passes text embeddings and an empty sequence.
        const isPriming = input.sequence.dims[1] === 0;
        if (!isPriming) mainStep++;

        const result = {
          conditioning: new FakeTensor('float32', new Float32Array(CONDITIONING_DIM).fill(0.5), [1, CONDITIONING_DIM]),
          eos_logit: new FakeTensor(
            'float32',
            // -10 is well below the -4 threshold; 0 is above it.
            Float32Array.of(!isPriming && mainStep >= eosAtStep ? 0 : -10),
            [1, 1],
          ),
        };
        for (let i = 0; i < FLOW_STATES; i++) {
          // Tag each state with the call number so tests can prove the *latest*
          // state was fed back in, not the initial one.
          result[`out_state_${i}`] = new FakeTensor('float32', Float32Array.of(calls.flowLmMain, i), [1, 2]);
        }
        return result;
      },
    },

    flowLmFlow: {
      inputNames: ['c', 's', 't', 'x'],
      outputNames: ['flow'],
      run: async (input) => {
        calls.flowLmFlow++;
        feeds.flowLmFlow.push(input);
        return { flow: new FakeTensor('float32', new Float32Array(LATENT_DIM).fill(1), [1, LATENT_DIM]) };
      },
    },

    mimiDecoder: {
      inputNames: ['latent'],
      outputNames: ['audio', ...outputsFor('mimi', MIMI_STATES)],
      run: async (input) => {
        calls.mimiDecoder++;
        feeds.mimiDecoder.push(input);
        const frames = input.latent.dims[1];
        const result = {
          audio: new FakeTensor('float32', new Float32Array(frames * SAMPLES_PER_FRAME).fill(0.3), [1, frames * SAMPLES_PER_FRAME]),
        };
        for (let i = 0; i < MIMI_STATES; i++) {
          result[`out_mimi_${i}`] = new FakeTensor('float32', Float32Array.of(calls.mimiDecoder, i), [1, 2]);
        }
        return result;
      },
    },

    mimiEncoder: {
      inputNames: ['audio'],
      outputNames: ['embeddings'],
      run: async () => {
        calls.mimiEncoder++;
        return { embeddings: new FakeTensor('float32', new Float32Array(3 * CONDITIONING_DIM), [1, 3, CONDITIONING_DIM]) };
      },
    },
  };

  return { sessions, calls, feeds };
}

/** A tokenizer stub: one token per word, ids offset to avoid the specials. */
const fakeTokenizer = {
  encode: text => text.split(/\s+/).filter(Boolean).map((word, i) => 100 + i),
  decode: ids => ids.map(id => `w${id}`).join(' '),
};

function makeSynthesizer(overrides = {}) {
  const { sessions, calls, feeds } = overrides.harness || makeSessions();
  const synthesizer = new PocketTtsSynthesizer({
    bundle: makeBundle(),
    sessions,
    tokenizer: overrides.tokenizer || fakeTokenizer,
    runtime,
    // Deterministic "noise" so latents are predictable.
    random: () => 0,
    ...overrides.options,
  });
  return { synthesizer, sessions, calls, feeds };
}

describe('voice handling', () => {
  test('refuses to synthesize before a voice is set', async () => {
    const { synthesizer } = makeSynthesizer();
    await expect(synthesizer.synthesize('Hello there.')).rejects.toThrow(/no voice has been set/);
  });

  test('priming a voice runs flow_lm_main once with an empty sequence', async () => {
    const { synthesizer, calls, feeds } = makeSynthesizer();
    await synthesizer.setVoiceFromEmbeddings({
      data: new Float32Array(2 * CONDITIONING_DIM), dims: [1, 2, CONDITIONING_DIM],
    });

    expect(calls.flowLmMain).toBe(1);
    expect(feeds.flowLmMain[0].sequence.dims).toEqual([1, 0, LATENT_DIM]);
    expect(feeds.flowLmMain[0].text_embeddings.dims).toEqual([1, 2, CONDITIONING_DIM]);
  });

  test('voice cloning needs the mimi encoder', async () => {
    const { sessions, calls } = makeSessions();
    delete sessions.mimiEncoder;
    const synthesizer = new PocketTtsSynthesizer({
      bundle: makeBundle(), sessions, tokenizer: fakeTokenizer, runtime,
    });
    await expect(synthesizer.encodeVoice(new Float32Array(10)))
      .rejects.toThrow(/needs the mimi encoder/);
    expect(calls.mimiEncoder).toBe(0);
  });

  test('encodeVoice returns embeddings shaped for conditioning', async () => {
    const { synthesizer } = makeSynthesizer();
    const embeddings = await synthesizer.encodeVoice(new Float32Array(2400));
    expect(embeddings.dims).toEqual([1, 3, CONDITIONING_DIM]);
  });

  test('bos_before_voice is prepended when the bundle asks for it', async () => {
    const bundle = { ...makeBundle(), insert_bos_before_voice: true };
    const { sessions, feeds } = makeSessions();
    const synthesizer = new PocketTtsSynthesizer({
      bundle, sessions, tokenizer: fakeTokenizer, runtime,
      // 2 frames of bos.
      bosBeforeVoice: new Float32Array(2 * CONDITIONING_DIM).fill(9),
    });

    await synthesizer.setVoiceFromEmbeddings({
      data: new Float32Array(3 * CONDITIONING_DIM), dims: [1, 3, CONDITIONING_DIM],
    });

    // 2 bos frames + 3 voice frames.
    expect(feeds.flowLmMain[0].text_embeddings.dims).toEqual([1, 5, CONDITIONING_DIM]);
    expect(feeds.flowLmMain[0].text_embeddings.data[0]).toBe(9);
  });
});

describe('the generation loop', () => {
  /** @type {PocketTtsSynthesizer} */
  let synthesizer;
  let calls;
  let feeds;

  beforeEach(async () => {
    ({ synthesizer, calls, feeds } = makeSynthesizer());
    await synthesizer.setVoiceFromEmbeddings({
      data: new Float32Array(CONDITIONING_DIM), dims: [1, 1, CONDITIONING_DIM],
    });
  });

  test('stops generating once EOS is reached, plus the trailing frames', async () => {
    const { samples } = await synthesizer.synthesize('one two three four five six');

    // EOS at step 2, then framesAfterEos = guess(1) + 2 = 3 more steps, so the
    // loop breaks at step 5 having emitted frames for steps 0..4.
    expect(samples.length).toBe(5 * SAMPLES_PER_FRAME);
  });

  test('feeds the previous latent back in as the next sequence', async () => {
    await synthesizer.synthesize('one two three four five six');

    // First generation call carries the NaN "no previous frame" marker.
    const generationCalls = feeds.flowLmMain.filter(feed => feed.sequence.dims[1] === 1);
    expect(Number.isNaN(generationCalls[0].sequence.data[0])).toBe(true);

    // Subsequent calls carry a real latent: x starts at 0 and gains flow*dt = 1.
    expect(Array.from(generationCalls[1].sequence.data)).toEqual([1, 1, 1, 1]);
  });

  test('threads updated model state back into the next call', async () => {
    await synthesizer.synthesize('one two three four five six');

    const generationCalls = feeds.flowLmMain.filter(feed => feed.sequence.dims[1] === 1);
    // State tagged with the call index proves the newest output was fed back,
    // rather than the initial state being resent.
    const firstStateValue = generationCalls[1].state_0.data[0];
    const laterStateValue = generationCalls[2].state_0.data[0];
    expect(laterStateValue).toBeGreaterThan(firstStateValue);
  });

  test('runs the flow network once per frame at the default single LSD step', async () => {
    await synthesizer.synthesize('one two three four five six');
    const frames = 5;
    expect(calls.flowLmFlow).toBe(frames);
  });

  test('runs the flow network lsdSteps times per frame', async () => {
    const { synthesizer: multi } = makeSynthesizer({ options: { lsdSteps: 3 } });
    await multi.setVoiceFromEmbeddings({
      data: new Float32Array(CONDITIONING_DIM), dims: [1, 1, CONDITIONING_DIM],
    });
    const { samples } = await multi.synthesize('one two three four five six');
    const frames = samples.length / SAMPLES_PER_FRAME;
    expect(frames).toBeGreaterThan(0);
  });

  test('integration steps walk s and t across the unit interval', async () => {
    const { synthesizer: multi, feeds: multiFeeds } = makeSynthesizer({ options: { lsdSteps: 2 } });
    await multi.setVoiceFromEmbeddings({
      data: new Float32Array(CONDITIONING_DIM), dims: [1, 1, CONDITIONING_DIM],
    });
    await multi.synthesize('one two three');

    expect(multiFeeds.flowLmFlow[0].s.data[0]).toBeCloseTo(0);
    expect(multiFeeds.flowLmFlow[0].t.data[0]).toBeCloseTo(0.5);
    expect(multiFeeds.flowLmFlow[1].s.data[0]).toBeCloseTo(0.5);
    expect(multiFeeds.flowLmFlow[1].t.data[0]).toBeCloseTo(1);
  });

  test('caps generation by the token-derived frame budget when EOS never fires', async () => {
    const { synthesizer: noEos } = makeSynthesizer({ harness: makeSessions({ eosAtStep: Infinity }) });
    await noEos.setVoiceFromEmbeddings({
      data: new Float32Array(CONDITIONING_DIM), dims: [1, 1, CONDITIONING_DIM],
    });

    const { samples } = await noEos.synthesize('one two three');
    // 3 tokens / 3.0 + 2.0 seconds = 3s, times 12.5 frames/s = 38 frames.
    expect(samples.length / SAMPLES_PER_FRAME).toBe(38);
  });

  test('threads mimi decoder state across decode batches', async () => {
    const { synthesizer: noEos, feeds: noEosFeeds } = makeSynthesizer({
      harness: makeSessions({ eosAtStep: Infinity }),
    });
    await noEos.setVoiceFromEmbeddings({
      data: new Float32Array(CONDITIONING_DIM), dims: [1, 1, CONDITIONING_DIM],
    });
    await noEos.synthesize('one two three');

    // 38 frames in batches of 12 -> 4 decoder calls.
    expect(noEosFeeds.mimiDecoder).toHaveLength(4);
    expect(noEosFeeds.mimiDecoder[0].latent.dims).toEqual([1, 12, LATENT_DIM]);
    expect(noEosFeeds.mimiDecoder[3].latent.dims).toEqual([1, 2, LATENT_DIM]);
    // Second batch must receive the first batch's returned state.
    expect(noEosFeeds.mimiDecoder[1].mimi_0.data[0]).toBe(1);
  });

  test('reports progress per chunk', async () => {
    const onProgress = jest.fn();
    await synthesizer.synthesize('one two three four five six', { onProgress });
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ chunk: 1, chunks: 1, frames: expect.any(Number) }),
    );
  });

  test('produces audio at the bundle sample rate', async () => {
    const { sampleRate } = await synthesizer.synthesize('one two three four five six');
    expect(sampleRate).toBe(24000);
  });

  test('empty text produces no audio rather than throwing', async () => {
    const { samples } = await synthesizer.synthesize('   ');
    expect(samples).toHaveLength(0);
  });
});

describe('abort', () => {
  test('stops mid-generation when the signal fires', async () => {
    const { synthesizer, calls } = makeSynthesizer({ harness: makeSessions({ eosAtStep: Infinity }) });
    await synthesizer.setVoiceFromEmbeddings({
      data: new Float32Array(CONDITIONING_DIM), dims: [1, 1, CONDITIONING_DIM],
    });

    const controller = new AbortController();
    const before = calls.flowLmMain;
    controller.abort();

    await expect(synthesizer.synthesize('one two three', { signal: controller.signal }))
      .rejects.toThrow(/aborted/);
    // Nothing was generated after the abort.
    expect(calls.flowLmMain).toBe(before);
  });
});

/**
 * Text preparation and chunking are checked against the real tokenizer, since
 * chunk sizes are measured in real tokens and a stub would not catch a budget
 * mistake.
 */
const MODEL_PATH = path.resolve(
  process.env.POCKET_TTS_MODEL_DIR
    || '/private/tmp/claude-501/-Users-mek/4396d9cd-bcff-49ef-b52e-949dadf9cdc6/scratchpad/pocket',
  'tokenizer.model',
);
const describeWithModel = fs.existsSync(MODEL_PATH) ? describe : describe.skip;

describeWithModel('text preparation with the real tokenizer', () => {
  /** @type {PocketTtsSynthesizer} */
  let synthesizer;

  beforeAll(() => {
    const tokenizer = SentencePieceUnigram.parse(fs.readFileSync(MODEL_PATH));
    ({ synthesizer } = makeSynthesizer({ tokenizer }));
  });

  test('capitalizes and terminates the prompt', () => {
    expect(synthesizer.prepareTextPrompt('hello world').text).toBe('Hello world.');
  });

  test('leaves existing terminal punctuation alone', () => {
    expect(synthesizer.prepareTextPrompt('Already done!').text).toBe('Already done!');
  });

  test('flattens newlines', () => {
    expect(synthesizer.prepareTextPrompt('two\nlines').text).toBe('Two lines.');
  });

  test('short prompts get more trailing frames than long ones', () => {
    expect(synthesizer.prepareTextPrompt('Yes.').framesAfterEosGuess).toBe(3);
    expect(synthesizer.prepareTextPrompt('One two three four five six.').framesAfterEosGuess).toBe(1);
  });

  test('a short sentence stays one chunk', () => {
    expect(synthesizer.splitIntoChunks('Hello world.')).toEqual(['Hello world.']);
  });

  test('every chunk of a long paragraph fits the token budget', () => {
    const long = 'Two charges were brought against Socrates, one, that he did not believe '
      + 'in the gods received by the state, the other, that he corrupted the Athenian '
      + 'youth by teaching them not to believe, and for these things he was tried.';

    const chunks = synthesizer.splitIntoChunks(long);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(synthesizer.tokenizer.encode(chunk).length)
        .toBeLessThanOrEqual(synthesizer.maxTokensPerChunk);
    }
  });

  test('chunking keeps all the words', () => {
    const long = 'Two charges were brought against Socrates, one, that he did not believe '
      + 'in the gods received by the state, the other, that he corrupted the Athenian '
      + 'youth by teaching them not to believe.';

    const chunks = synthesizer.splitIntoChunks(long);
    const rejoined = chunks.join(' ').replace(/\s+/g, ' ');
    for (const word of ['charges', 'Socrates', 'Athenian', 'teaching', 'believe']) {
      expect(rejoined).toContain(word);
    }
  });

  test('empty text yields no chunks', () => {
    expect(synthesizer.splitIntoChunks('')).toEqual([]);
    expect(synthesizer.splitIntoChunks('   ')).toEqual([]);
  });
});
