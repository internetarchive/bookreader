/**
 * Web Worker that runs PocketTTS.
 *
 * Synthesis is a per-frame loop over three ONNX models and takes on the order of
 * seconds; on the main thread it would stall rendering and make the transport
 * controls unresponsive, which is precisely the experience issue #1580 is about.
 *
 * Protocol (main thread -> worker):
 *   {type: 'init', modelBase, ortBase}   -> 'progress'* then 'ready' | 'error'
 *   {type: 'synthesize', id, text}       -> 'audio' | 'error' (with the same id)
 *   {type: 'cancel', id}                 -> aborts it, or drops it unrun if queued
 *
 * Synthesis requests are queued and run strictly one at a time; see `chain`.
 *
 * Worker -> main thread:
 *   {type: 'progress', file, loaded, total, fromCache}
 *   {type: 'ready', sampleRate, voiceFrames}
 *   {type: 'audio', id, samples, sampleRate}   samples transferred, not copied
 *   {type: 'error', id?, message}
 */
import * as ort from 'onnxruntime-web';
import SentencePieceUnigram from './SentencePieceUnigram.js';
import PocketTtsSynthesizer from './PocketTtsSynthesizer.js';
import resample from './resample.js';
import { loadBundleFiles } from './modelStore.js';

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
 * @param {{modelBase?: string, ortBase?: string, referenceAudioUrl?: string}} options
 */
async function init({ modelBase, ortBase, referenceAudioUrl }) {
  if (ortBase) ort.env.wasm.wasmPaths = ortBase;
  // Threads need cross-origin isolation, which the demo page does not have.
  // Single-threaded is slower but works everywhere.
  ort.env.wasm.numThreads = 1;
  ort.env.logLevel = 'error';

  const files = await loadBundleFiles({
    base: modelBase,
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
    mimiEncoder: await session(files['mimi_encoder_int8.onnx']),
  };

  synthesizer = new PocketTtsSynthesizer({
    bundle,
    sessions,
    tokenizer,
    bosBeforeVoice: decodeNpy(files['bos_before_voice.npy']),
    runtime: ort,
  });

  // The named voices are gated (see PocketTtsSynthesizer), so the voice is cloned
  // from a reference clip.
  const referenceResponse = await fetch(referenceAudioUrl);
  if (!referenceResponse.ok) {
    throw new Error(`PocketTTS: HTTP ${referenceResponse.status} fetching reference audio`);
  }
  const reference = decodeWav(await referenceResponse.arrayBuffer());
  const referenceSamples = resample(reference.samples, reference.sampleRate, bundle.sample_rate);

  const embeddings = await synthesizer.encodeVoice(referenceSamples);
  await synthesizer.setVoiceFromEmbeddings(embeddings);

  self.postMessage({
    type: 'ready',
    sampleRate: bundle.sample_rate,
    voiceFrames: embeddings.dims[1],
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
