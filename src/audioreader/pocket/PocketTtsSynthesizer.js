/*
 * int64 ONNX tensors are BigInt64Array, so this file needs BigInt. Every browser
 * that can run onnxruntime-web's wasm backend has it.
 */
/* global BigInt64Array, BigInt */

/** @typedef {import('./SentencePieceUnigram.js').default} SentencePieceUnigram */

/**
 * PocketTTS inference, ported from the reference Python runtime
 * (`pocket_tts_onnx.py` in the ungated `KevinAHM/pocket-tts-onnx` HF repo).
 *
 * There is no JS runtime for this model, so this is a direct port of the
 * flow-matching generation loop:
 *
 *   1. `text_conditioner(token_ids)` -> text embeddings
 *   2. prime `flow_lm_main` with the voice state and those embeddings
 *   3. per audio frame, `flow_lm_main` yields a conditioning vector and an EOS
 *      logit, and advances its own KV caches
 *   4. integrate `flow_lm_flow` over `lsdSteps` from a Gaussian sample to get one
 *      32-dimensional latent per frame
 *   5. `mimi_decoder` turns batches of latents into 24kHz PCM
 *
 * Every piece of model state is an explicit ONNX input/output, described by the
 * manifests in `bundle.json`, so this class threads dictionaries of tensors
 * rather than relying on any hidden session state. That is what makes the port
 * mechanical -- and what makes it safe to run several utterances through one set
 * of sessions.
 *
 * Deliberately runtime-agnostic: it is handed an object that can create ONNX
 * sessions and tensors, so the same code runs under `onnxruntime-web` in a Web
 * Worker and under Node for verification.
 */

/** Sampling temperature; matches the reference default. */
const DEFAULT_TEMPERATURE = 0.7;
/** Flow-matching integration steps. The reference default of 1 is one call per frame. */
const DEFAULT_LSD_STEPS = 1;
/** Above this logit the model is considered to have finished speaking. */
const EOS_LOGIT_THRESHOLD = -4.0;
/** Frame-budget estimate, from the reference implementation. */
const TOKENS_PER_SECOND_ESTIMATE = 3.0;
const GEN_SECONDS_PADDING = 2.0;
/** Latent frames handed to the mimi decoder at once. */
const DECODE_CHUNK_FRAMES = 12;

export default class PocketTtsSynthesizer {
  /**
   * @param {Object} opts
   * @param {Object} opts.bundle parsed bundle.json
   * @param {Object} opts.sessions {textConditioner, flowLmMain, flowLmFlow, mimiDecoder, mimiEncoder?}
   * @param {SentencePieceUnigram} opts.tokenizer
   * @param {Float32Array|null} [opts.bosBeforeVoice] contents of bos_before_voice.npy
   * @param {Object} opts.runtime {Tensor} -- the ONNX runtime's tensor constructor
   * @param {number} [opts.temperature]
   * @param {number} [opts.lsdSteps]
   * @param {() => number} [opts.random] unit-normal source; injectable for tests
   */
  constructor({
    bundle, sessions, tokenizer, bosBeforeVoice = null, runtime,
    temperature = DEFAULT_TEMPERATURE, lsdSteps = DEFAULT_LSD_STEPS, random = gaussian,
  }) {
    this.bundle = bundle;
    this.sessions = sessions;
    this.tokenizer = tokenizer;
    this.runtime = runtime;
    this.temperature = temperature;
    this.lsdSteps = lsdSteps;
    this._random = random;

    this.sampleRate = bundle.sample_rate;
    this.latentDim = bundle.latent_dim;
    this.conditioningDim = bundle.conditioning_dim;
    this.maxTokensPerChunk = bundle.max_token_per_chunk ?? 50;
    this.flowStateManifest = bundle.flow_lm_state_manifest;
    this.mimiStateManifest = bundle.mimi_state_manifest;
    this.insertBosBeforeVoice = !!bundle.insert_bos_before_voice;
    this.removeSemicolons = !!bundle.remove_semicolons;
    this.padShortInputs = !!bundle.pad_with_spaces_for_short_inputs;
    this.recommendedFramesAfterEos = bundle.model_recommended_frames_after_eos ?? null;

    /**
     * `bos_before_voice.npy` holds a single (1, n, conditioningDim) block that is
     * prepended to the voice embeddings.
     * @type {Float32Array|null}
     */
    this.bosBeforeVoice = bosBeforeVoice;

    /** @type {Object<string, {data: Float32Array|BigInt64Array, dims: number[]}>|null} */
    this._voiceState = null;
  }

  /**
   * Build the flow-LM state that carries a voice, by running the voice
   * embeddings through `flow_lm_main` once. Later utterances all start from a
   * copy of this, which is why one voice can be reused cheaply.
   * @param {{data: Float32Array, dims: number[]}} embeddings (1, frames, conditioningDim)
   * @return {Promise<void>}
   */
  async setVoiceFromEmbeddings(embeddings) {
    const prepared = this._prependVoiceBos(embeddings);
    const state = this._initState(this.flowStateManifest);

    const outputs = await this._run(this.sessions.flowLmMain, {
      sequence: this._tensor('float32', new Float32Array(0), [1, 0, this.latentDim]),
      text_embeddings: this._tensor('float32', prepared.data, prepared.dims),
      ...state,
    });

    this._updateStateFromOutputs(state, outputs, this.flowStateManifest, 2);
    this._voiceState = state;
  }

  /**
   * Derive voice embeddings from reference audio using the mimi encoder.
   *
   * This is the only voice path available to a browser: the named voices in
   * `bundle.json` live in the gated `kyutai/pocket-tts` repo and cannot be
   * fetched without a token, whereas the mimi encoder and reference audio are
   * both ungated.
   *
   * @param {Float32Array} audio mono samples at this.sampleRate, -1..1
   * @return {Promise<{data: Float32Array, dims: number[]}>}
   */
  async encodeVoice(audio) {
    if (!this.sessions.mimiEncoder) {
      throw new Error('PocketTTS: voice cloning needs the mimi encoder session');
    }
    const outputs = await this._run(this.sessions.mimiEncoder, {
      audio: this._tensor('float32', audio, [1, 1, audio.length]),
    });
    const first = outputs[0];
    // Squeeze any leading batch dims down to (1, frames, dim).
    const dims = first.dims.length > 3 ? first.dims.slice(first.dims.length - 3) : first.dims;
    return { data: first.data, dims: dims.length === 3 ? dims : [1, ...dims] };
  }

  /**
   * Synthesize speech for a piece of text.
   * @param {string} text
   * @param {Object} [opts]
   * @param {AbortSignal} [opts.signal]
   * @param {(progress: {frames: number, chunk: number, chunks: number}) => void} [opts.onProgress]
   * @return {Promise<{samples: Float32Array, sampleRate: number}>}
   */
  async synthesize(text, { signal, onProgress } = {}) {
    if (!this._voiceState) throw new Error('PocketTTS: no voice has been set');

    const chunks = this.splitIntoChunks(text);
    /** @type {Float32Array[]} */
    const latentFrames = [];

    for (const [index, chunk] of chunks.entries()) {
      throwIfAborted(signal);
      const frames = await this._generateLatents(chunk, { signal });
      latentFrames.push(...frames);
      onProgress?.({ frames: latentFrames.length, chunk: index + 1, chunks: chunks.length });
    }

    if (!latentFrames.length) {
      return { samples: new Float32Array(0), sampleRate: this.sampleRate };
    }

    const samples = await this._decodeLatents(latentFrames, { signal });
    return { samples, sampleRate: this.sampleRate };
  }

  /**
   * Prepare text the way the model was trained to receive it: leading capital,
   * terminal punctuation, no newlines.
   * @param {string} text
   * @return {{text: string, framesAfterEosGuess: number}}
   */
  prepareTextPrompt(text) {
    let prepared = text.replace(/[\n\r]/g, ' ').replace(/ {2}/g, ' ').trim();
    if (this.removeSemicolons) prepared = prepared.replace(/;/g, ',');
    if (!prepared) return { text: '', framesAfterEosGuess: 1 };

    const words = prepared.split(/\s+/).filter(Boolean);
    const framesAfterEosGuess = words.length <= 4 ? 3 : 1;

    if (prepared[0] !== prepared[0].toUpperCase()) {
      prepared = prepared[0].toUpperCase() + prepared.slice(1);
    }
    if (/[\p{L}\p{N}]$/u.test(prepared)) prepared += '.';
    if (this.padShortInputs && words.length < 5) prepared = ' '.repeat(8) + prepared;

    return { text: prepared, framesAfterEosGuess };
  }

  /**
   * Split text so no chunk exceeds the model's token budget, preferring sentence
   * boundaries and falling back to clause punctuation.
   * @param {string} text
   * @return {string[]}
   */
  splitIntoChunks(text) {
    const { text: prepared } = this.prepareTextPrompt(text);
    if (!prepared) return [];

    const tokens = this.tokenizer.encode(prepared);
    if (tokens.length <= this.maxTokensPerChunk) return [prepared];

    const sentenceBoundaries = new Set(this.tokenizer.encode('.!...?').slice(1));
    let segments = this._segmentsFromBoundaries(tokens, sentenceBoundaries);

    // Any sentence still too long is split again on clause punctuation.
    const clauseBoundaries = new Set(this.tokenizer.encode(',;:').slice(1));
    const refined = [];
    for (const segment of segments) {
      if (segment.count <= this.maxTokensPerChunk) {
        refined.push(segment);
        continue;
      }
      const subTokens = this.tokenizer.encode(segment.text.trim());
      const subSegments = this._segmentsFromBoundaries(subTokens, clauseBoundaries);
      if (subSegments.length > 1) refined.push(...subSegments);
      else refined.push(segment);
    }
    segments = refined;

    // Greedily recombine so we make as few passes through the model as the
    // budget allows.
    const chunks = [];
    let current = '';
    let currentCount = 0;
    for (const { count, text: segmentText } of segments) {
      if (!current) {
        current = segmentText;
        currentCount = count;
        continue;
      }
      if (currentCount + count > this.maxTokensPerChunk) {
        chunks.push(current.trim());
        current = segmentText;
        currentCount = count;
      } else {
        current += ` ${segmentText}`;
        currentCount += count;
      }
    }
    if (current) chunks.push(current.trim());
    return chunks.filter(Boolean);
  }

  /**
   * @private
   * Break a token sequence at the positions following runs of boundary tokens.
   * @param {number[]} tokens
   * @param {Set<number>} boundaryTokens
   * @return {Array<{count: number, text: string}>}
   */
  _segmentsFromBoundaries(tokens, boundaryTokens) {
    const indices = [0];
    let previousWasBoundary = false;
    tokens.forEach((token, index) => {
      if (boundaryTokens.has(token)) {
        previousWasBoundary = true;
        return;
      }
      if (previousWasBoundary) indices.push(index);
      previousWasBoundary = false;
    });
    indices.push(tokens.length);

    const segments = [];
    for (let i = 0; i < indices.length - 1; i++) {
      const start = indices[i];
      const end = indices[i + 1];
      if (end <= start) continue;
      segments.push({ count: end - start, text: this.tokenizer.decode(tokens.slice(start, end)) });
    }
    return segments;
  }

  /**
   * @private
   * Run the flow LM for one chunk, yielding one latent frame at a time.
   * @param {string} chunkText
   * @param {{signal?: AbortSignal}} ctx
   * @return {Promise<Float32Array[]>}
   */
  async _generateLatents(chunkText, { signal }) {
    const { text: prepared, framesAfterEosGuess } = this.prepareTextPrompt(chunkText);
    const framesAfterEos = this.recommendedFramesAfterEos ?? (framesAfterEosGuess + 2);
    const tokenIds = this.tokenizer.encode(prepared);
    if (!tokenIds.length) return [];

    // Each utterance starts from a fresh copy of the voice state, so voices do
    // not drift across paragraphs.
    const state = this._cloneState(this._voiceState);

    const conditioned = await this._run(this.sessions.textConditioner, {
      token_ids: this._tensor('int64', BigInt64Array.from(tokenIds, BigInt), [1, tokenIds.length]),
    });
    const textEmbeddings = conditioned[0];
    const embeddingDims = textEmbeddings.dims.length === 2
      ? [1, ...textEmbeddings.dims]
      : textEmbeddings.dims;

    const primed = await this._run(this.sessions.flowLmMain, {
      sequence: this._tensor('float32', new Float32Array(0), [1, 0, this.latentDim]),
      text_embeddings: this._tensor('float32', textEmbeddings.data, embeddingDims),
      ...state,
    });
    this._updateStateFromOutputs(state, primed, this.flowStateManifest, 2);

    const emptyText = this._tensor('float32', new Float32Array(0), [1, 0, this.conditioningDim]);
    // A NaN frame is how the reference signals "no previous latent yet".
    let current = this._tensor('float32', new Float32Array(this.latentDim).fill(NaN), [1, 1, this.latentDim]);

    const frameLimit = this._estimateMaxFrames(tokenIds.length);
    const dt = 1 / this.lsdSteps;
    /** @type {Float32Array[]} */
    const frames = [];
    let eosStep = null;

    for (let step = 0; step < frameLimit; step++) {
      throwIfAborted(signal);

      const outputs = await this._run(this.sessions.flowLmMain, {
        sequence: current,
        text_embeddings: emptyText,
        ...state,
      });
      const conditioning = outputs[0];
      const eosLogit = outputs[1];
      this._updateStateFromOutputs(state, outputs, this.flowStateManifest, 2);

      if (eosLogit.data[0] > EOS_LOGIT_THRESHOLD && eosStep === null) eosStep = step;
      if (eosStep !== null && step >= eosStep + framesAfterEos) break;

      // Integrate the flow field from a Gaussian sample to this frame's latent.
      let x = new Float32Array(this.latentDim);
      if (this.temperature > 0) {
        const deviation = Math.sqrt(this.temperature);
        for (let i = 0; i < x.length; i++) x[i] = this._random() * deviation;
      }

      for (let j = 0; j < this.lsdSteps; j++) {
        const s = j / this.lsdSteps;
        const flowOutputs = await this._run(this.sessions.flowLmFlow, {
          c: conditioning,
          s: this._tensor('float32', Float32Array.of(s), [1, 1]),
          t: this._tensor('float32', Float32Array.of(s + dt), [1, 1]),
          x: this._tensor('float32', x, [1, this.latentDim]),
        });
        const flow = flowOutputs[0].data;
        const next = new Float32Array(this.latentDim);
        for (let i = 0; i < next.length; i++) next[i] = x[i] + flow[i] * dt;
        x = next;
      }

      frames.push(x);
      current = this._tensor('float32', x, [1, 1, this.latentDim]);
    }

    return frames;
  }

  /**
   * @private
   * @param {Float32Array[]} frames
   * @param {{signal?: AbortSignal}} ctx
   * @return {Promise<Float32Array>} PCM at this.sampleRate
   */
  async _decodeLatents(frames, { signal }) {
    const state = this._initState(this.mimiStateManifest);
    /** @type {Float32Array[]} */
    const audioChunks = [];

    for (let index = 0; index < frames.length; index += DECODE_CHUNK_FRAMES) {
      throwIfAborted(signal);
      const batch = frames.slice(index, index + DECODE_CHUNK_FRAMES);
      const flat = new Float32Array(batch.length * this.latentDim);
      batch.forEach((frame, i) => flat.set(frame, i * this.latentDim));

      const outputs = await this._run(this.sessions.mimiDecoder, {
        latent: this._tensor('float32', flat, [1, batch.length, this.latentDim]),
        ...state,
      });
      audioChunks.push(Float32Array.from(outputs[0].data));
      this._updateStateFromOutputs(state, outputs, this.mimiStateManifest, 1);
    }

    const total = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const samples = new Float32Array(total);
    let offset = 0;
    for (const chunk of audioChunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    return samples;
  }

  /**
   * @private
   * @param {number} tokenCount
   * @return {number}
   */
  _estimateMaxFrames(tokenCount) {
    const seconds = tokenCount / TOKENS_PER_SECOND_ESTIMATE + GEN_SECONDS_PADDING;
    return Math.ceil(seconds * this.bundle.frame_rate);
  }

  /**
   * @private
   * Prepend `bos_before_voice` to the voice embeddings, if the bundle asks for it.
   * @param {{data: Float32Array, dims: number[]}} embeddings
   * @return {{data: Float32Array, dims: number[]}}
   */
  _prependVoiceBos(embeddings) {
    if (!this.insertBosBeforeVoice || !this.bosBeforeVoice) return embeddings;

    const dim = embeddings.dims[embeddings.dims.length - 1];
    const bosFrames = this.bosBeforeVoice.length / dim;
    const combined = new Float32Array(this.bosBeforeVoice.length + embeddings.data.length);
    combined.set(this.bosBeforeVoice, 0);
    combined.set(embeddings.data, this.bosBeforeVoice.length);

    return { data: combined, dims: [1, bosFrames + embeddings.dims[1], dim] };
  }

  /**
   * @private
   * Build the initial state tensors described by a manifest.
   * @param {Array<Object>} manifest
   * @return {Object<string, any>}
   */
  _initState(manifest) {
    const state = {};
    for (const entry of manifest) {
      state[entry.input_name] = this._filledTensor(entry.shape, entry.dtype, entry.fill);
    }
    return state;
  }

  /**
   * @private
   * @param {number[]} shape
   * @param {string} dtype
   * @param {string} fill one of nan, ones, zeros, empty
   * @return {any} runtime tensor
   */
  _filledTensor(shape, dtype, fill) {
    const size = shape.reduce((product, dimension) => product * dimension, 1);

    if (dtype === 'int64') {
      const data = new BigInt64Array(size);
      if (fill === 'ones') data.fill(1n);
      return this._tensor('int64', data, shape);
    }
    if (dtype === 'bool') {
      const data = new Uint8Array(size);
      if (fill === 'ones') data.fill(1);
      return this._tensor('bool', data, shape);
    }

    const data = new Float32Array(size);
    if (fill === 'nan') data.fill(NaN);
    else if (fill === 'ones') data.fill(1);
    return this._tensor(dtype === 'float16' ? 'float16' : 'float32', data, shape);
  }

  /**
   * @private
   * Copy state tensors so a mutation cannot leak between utterances.
   * @param {Object<string, any>} state
   * @return {Object<string, any>}
   */
  _cloneState(state) {
    const copy = {};
    for (const [name, tensor] of Object.entries(state)) {
      const data = tensor.data.slice();
      copy[name] = this._tensor(tensor.type, data, tensor.dims);
    }
    return copy;
  }

  /**
   * @private
   * The manifests give each state tensor's position in the session's output list,
   * offset past the real outputs.
   * @param {Object<string, any>} state
   * @param {any[]} outputs
   * @param {Array<Object>} manifest
   * @param {number} outputOffset
   */
  _updateStateFromOutputs(state, outputs, manifest, outputOffset) {
    for (const entry of manifest) {
      state[entry.input_name] = outputs[outputOffset + entry.index];
    }
  }

  /**
   * @private
   * @param {string} type
   * @param {ArrayBufferView} data
   * @param {number[]} dims
   * @return {any}
   */
  _tensor(type, data, dims) {
    return new this.runtime.Tensor(type, data, dims);
  }

  /**
   * @private
   * Run a session and return its outputs as a positional array, since the
   * manifests address state by index.
   * @param {Object} session
   * @param {Object<string, any>} feeds
   * @return {Promise<any[]>}
   */
  async _run(session, feeds) {
    const results = await session.run(feeds);
    return session.outputNames.map(name => results[name]);
  }
}

/**
 * Box-Muller unit normal. `Math.random` is fine here: this is sampling noise for
 * a generative model, not anything security-sensitive.
 * @return {number}
 */
function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** @param {AbortSignal} [signal] */
function throwIfAborted(signal) {
  if (signal?.aborted) throw new Error('PocketTTS: synthesis aborted');
}
