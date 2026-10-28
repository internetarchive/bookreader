/**
 * Web Worker that runs PocketTTS.
 *
 * Synthesis is a per-frame loop over three ONNX models and takes on the order of
 * seconds; on the main thread it would stall rendering and make the transport
 * controls unresponsive, which is precisely the experience issue #1580 is about.
 *
 * Protocol (main thread -> worker):
 *   {type: 'init', modelBase, ortBase, voicesBase, voice}
 *                                        -> 'progress'* then 'ready' | 'error'
 *   {type: 'synthesize', id, text}       -> 'audio' | 'error' (with the same id)
 *   {type: 'cancel', id}                 -> aborts it, or drops it unrun if queued
 *
 * Synthesis requests are queued and run strictly one at a time; see `chain`.
 *
 * Worker -> main thread:
 *   {type: 'progress', file, loaded, total, fromCache}
 *   {type: 'ready', sampleRate, voiceFrames, voice}
 *   {type: 'audio', id, samples, sampleRate}   samples transferred, not copied
 *   {type: 'error', id?, message}
 */
import * as ort from 'onnxruntime-web';
import SentencePieceUnigram from './SentencePieceUnigram.js';
import PocketTtsSynthesizer from './PocketTtsSynthesizer.js';
import resample from './resample.js';
import { loadBundleFiles, loadVoice } from './modelStore.js';

/** @type {PocketTtsSynthesizer|null} */
let synthesizer = null;

/**
 * Requests accepted but not yet finished, by id.
 * @type {Map<string, {controller: AbortController, cancelled: boolean}>}
 */
const accepted = new Map();

/**
 * Synthesis runs strictly one request at a time, chained through this promise.
 *
 * A worker message handler is `async`, so without this every queued request
 * would start the moment its message arrived -- a dozen concurrent generation
 * loops sharing one set of ONNX sessions. That defeats the deliberate
 * one-at-a-time discipline (the whole point of a sequential synthesis queue is
 * not to saturate the CPU) and makes every individual request slower, so audio
 * arrives later than it needs to.
 */
let chain = Promise.resolve();

/**
 * Read a 1-D float32 .npy payload.
 * @param {ArrayBuffer} buffer
 * @return {Float32Array}
 */
function decodeNpy(buffer) {
  const bytes = new Uint8Array(buffer);
  const magic = String.fromCharCode(...bytes.subarray(1, 6));
  if (magic !== 'NUMPY') throw new Error('PocketTTS: bos_before_voice is not a .npy file');

  const headerLength = new DataView(buffer).getUint16(8, true);
  const header = new TextDecoder().decode(bytes.subarray(10, 10 + headerLength));
  if (!/'descr': *'[<|]f4'/.test(header)) {
    throw new Error(`PocketTTS: expected float32 in bos_before_voice, got ${header}`);
  }
  return new Float32Array(buffer, 10 + headerLength);
}

/**
 * Decode a WAV file to mono float samples. Only 16-bit PCM, which is what the
 * reference clip is; `AudioContext.decodeAudioData` is unavailable in a worker.
 * @param {ArrayBuffer} buffer
 * @return {{samples: Float32Array, sampleRate: number}}
 */
function decodeWav(buffer) {
  const view = new DataView(buffer);
  const ascii = (offset, length) => String.fromCharCode(
    ...new Uint8Array(buffer, offset, length),
  );
  if (ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WAVE') {
    throw new Error('PocketTTS: reference audio is not a WAV file');
  }

  let offset = 12;
  let sampleRate = 0;
  let channels = 1;
  let bitsPerSample = 16;
  let dataOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= buffer.byteLength) {
    const id = ascii(offset, 4);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === 'data') {
      dataOffset = body;
      dataLength = size;
    }
    offset = body + size + (size % 2);
  }

  if (dataOffset < 0) throw new Error('PocketTTS: reference WAV has no data chunk');
  if (bitsPerSample !== 16) throw new Error(`PocketTTS: expected 16-bit WAV, got ${bitsPerSample}`);

  const frames = Math.floor(dataLength / 2 / channels);
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) {
      sum += view.getInt16(dataOffset + (i * channels + c) * 2, true);
    }
    samples[i] = sum / channels / 32768;
  }
  return { samples, sampleRate };
}

/**
 * @param {Object} options
 * @param {string} [options.modelBase] where the ONNX bundle is served from
 * @param {string} [options.ortBase] where onnxruntime's wasm lives
 * @param {string} [options.voicesBase] where the precomputed voice embeddings live
 * @param {string} [options.voice] which precomputed voice to prime (default: first)
 * @param {string} [options.referenceAudioUrl] clone a voice from this clip instead
 *   of using a precomputed one; this is the only path that needs the mimi encoder
 */
async function init({ modelBase, ortBase, voicesBase, voice, referenceAudioUrl }) {
  if (ortBase) ort.env.wasm.wasmPaths = ortBase;
  // Threads need cross-origin isolation, which the demo page does not have.
  // Single-threaded is slower but works everywhere.
  ort.env.wasm.numThreads = 1;
  ort.env.logLevel = 'error';

  // The mimi encoder (~20MB) is only needed to clone a voice from arbitrary
  // audio. The two shipped voices are precomputed, so by default it is skipped.
  const needEncoder = !!referenceAudioUrl;
  const files = await loadBundleFiles({
    base: modelBase,
    ...(needEncoder ? {
      files: [
        'bundle.json', 'tokenizer.model', 'bos_before_voice.npy',
        'text_conditioner_int8.onnx', 'flow_lm_flow_int8.onnx',
        'mimi_decoder_int8.onnx', 'flow_lm_main_int8.onnx', 'mimi_encoder_int8.onnx',
      ],
    } : {}),
    onProgress: progress => self.postMessage({ type: 'progress', ...progress }),
  });

  const bundle = JSON.parse(new TextDecoder().decode(files['bundle.json']));
  const tokenizer = SentencePieceUnigram.parse(files['tokenizer.model']);

  const session = buffer => ort.InferenceSession.create(buffer);
  const sessions = {
    textConditioner: await session(files['text_conditioner_int8.onnx']),
    flowLmMain: await session(files['flow_lm_main_int8.onnx']),
    flowLmFlow: await session(files['flow_lm_flow_int8.onnx']),
    mimiDecoder: await session(files['mimi_decoder_int8.onnx']),
    ...(needEncoder ? { mimiEncoder: await session(files['mimi_encoder_int8.onnx']) } : {}),
  };

  synthesizer = new PocketTtsSynthesizer({
    bundle,
    sessions,
    tokenizer,
    bosBeforeVoice: decodeNpy(files['bos_before_voice.npy']),
    runtime: ort,
  });

  let voiceId = voice ?? null;
  if (referenceAudioUrl) {
    // Clone a voice from a reference clip (needs the encoder loaded above).
    const referenceResponse = await fetch(referenceAudioUrl);
    if (!referenceResponse.ok) {
      throw new Error(`PocketTTS: HTTP ${referenceResponse.status} fetching reference audio`);
    }
    const reference = decodeWav(await referenceResponse.arrayBuffer());
    const referenceSamples = resample(reference.samples, reference.sampleRate, bundle.sample_rate);
    const embeddings = await synthesizer.encodeVoice(referenceSamples);
    await synthesizer.setVoiceFromEmbeddings(embeddings);
  } else {
    // Prime a precomputed voice embedding -- no encoder, no reference download.
    const picked = await loadVoice({ voicesBase, voiceId: voice });
    await synthesizer.setVoiceFromEmbeddings({ data: picked.data, dims: picked.dims });
    voiceId = picked.id;
  }

  // Warm the ONNX sessions before declaring ready. The first synthesis pays
  // session allocation and wasm JIT -- on the order of a second or two -- and
  // without this that cost lands on the patron's first sentence, which is the
  // worst possible place for it. Doing it here hides it inside the model load.
  try {
    await synthesizer.synthesize('Ready.', {});
  } catch (error) {
    // Warm-up is best-effort: a failure here must not stop the engine coming up.
    console.warn('PocketTTS: warm-up synthesis failed', error);
  }

  self.postMessage({
    type: 'ready',
    sampleRate: bundle.sample_rate,
    voiceFrames: synthesizer.voiceFrames,
    voice: voiceId,
    // Straight from the model's own bundle.json, so the UI can show which model
    // version is in use without anything being hard-coded here.
    model: {
      name: bundle.bundle_name,
      schemaVersion: bundle.schema_version,
      flowType: bundle.flow_type,
      sampleRate: bundle.sample_rate,
      frameRate: bundle.frame_rate,
    },
  });
}

/**
 * Accept a synthesis request and queue it behind any earlier ones.
 * @param {{id: string, text: string}} request
 */
function enqueueSynthesis({ id, text }) {
  if (!synthesizer) throw new Error('PocketTTS: worker is not initialized');

  const entry = { controller: new AbortController(), cancelled: false };
  accepted.set(id, entry);

  chain = chain.then(() => runSynthesis(id, text, entry));
}

/**
 * @param {string} id
 * @param {string} text
 * @param {{controller: AbortController, cancelled: boolean}} entry
 * @return {Promise<void>}
 */
async function runSynthesis(id, text, entry) {
  // Cancelled while it sat in the queue: drop it without spending anything. This
  // is what makes a seek cheap -- the abandoned segments never run at all.
  if (entry.cancelled) {
    accepted.delete(id);
    return;
  }

  try {
    const { samples, sampleRate } = await synthesizer.synthesize(text, {
      signal: entry.controller.signal,
    });
    // Transfer the buffer rather than copying it; these are megabytes.
    self.postMessage({ type: 'audio', id, samples, sampleRate }, [samples.buffer]);
  } catch (error) {
    // An abort is an expected outcome, not a failure worth reporting.
    if (!entry.controller.signal.aborted) {
      self.postMessage({ type: 'error', id, message: error.message });
    }
  } finally {
    accepted.delete(id);
  }
}

self.addEventListener('message', async (event) => {
  const message = event.data;

  if (message.type === 'cancel') {
    const entry = accepted.get(message.id);
    if (entry) {
      // Marks it so it is skipped if still queued, and aborts it if running.
      entry.cancelled = true;
      entry.controller.abort();
    }
    return;
  }

  try {
    if (message.type === 'init') await init(message);
    else if (message.type === 'synthesize') enqueueSynthesis(message);
    else throw new Error(`PocketTTS: unknown message "${message.type}"`);
  } catch (error) {
    self.postMessage({ type: 'error', id: message.id, message: error.message });
  }
});
