/**
 * Verify the PocketTTS port against the real ONNX models, outside a browser.
 *
 * onnxruntime-web's wasm backend runs under Node, so the exact same
 * PocketTtsSynthesizer that will run in a Web Worker can be exercised here --
 * where a failure is a stack trace rather than a silent worker death, and where
 * the output can be written to a WAV file and listened to.
 *
 * Usage:
 *   node scripts/verify-pocket-tts.mjs [modelDir] [outputWav] ["text to say"]
 *
 * The model directory must contain the ungated `english_2026-04` int8 bundle:
 * bundle.json, tokenizer.model, bos_before_voice.npy, text_conditioner_int8.onnx,
 * flow_lm_main_int8.onnx, flow_lm_flow_int8.onnx, mimi_decoder_int8.onnx,
 * mimi_encoder_int8.onnx, plus reference_sample.wav for the voice.
 */
import fs from 'fs';
import path from 'path';
import * as ort from 'onnxruntime-web';
import SentencePieceUnigram from '../src/audioreader/pocket/SentencePieceUnigram.js';
import PocketTtsSynthesizer from '../src/audioreader/pocket/PocketTtsSynthesizer.js';
import resample from '../src/audioreader/pocket/resample.js';

const [, , modelDirArg, outputArg, textArg] = process.argv;
const MODEL_DIR = modelDirArg || process.env.POCKET_TTS_MODEL_DIR;
const OUTPUT = outputArg || 'pocket-tts-sample.wav';
const TEXT = textArg || 'Two charges were brought against Socrates.';

if (!MODEL_DIR) {
  console.error('Give a model directory, or set POCKET_TTS_MODEL_DIR.');
  process.exit(2);
}

ort.env.wasm.numThreads = 1;
ort.env.logLevel = 'error';

const read = name => fs.readFileSync(path.join(MODEL_DIR, name));

/**
 * Read a mono 16-bit PCM WAV. Enough of a parser for the reference sample; the
 * browser will use `AudioContext.decodeAudioData` instead.
 * @param {Buffer} buffer
 * @return {{samples: Float32Array, sampleRate: number}}
 */
function decodeWav(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') throw new Error('not a RIFF file');
  let offset = 12;
  let sampleRate = 0;
  let bitsPerSample = 16;
  let channels = 1;
  let data = null;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = buffer.readUInt16LE(body + 2);
      sampleRate = buffer.readUInt32LE(body + 4);
      bitsPerSample = buffer.readUInt16LE(body + 14);
    } else if (id === 'data') {
      data = buffer.subarray(body, body + size);
    }
    offset = body + size + (size % 2);
  }
  if (!data) throw new Error('no data chunk');
  if (bitsPerSample !== 16) throw new Error(`expected 16-bit PCM, got ${bitsPerSample}`);

  const frames = Math.floor(data.length / 2 / channels);
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    // Average channels down to mono.
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += data.readInt16LE((i * channels + c) * 2);
    samples[i] = sum / channels / 32768;
  }
  return { samples, sampleRate };
}

/**
 * Read a 1-D or 2-D float32 .npy file.
 * @param {Buffer} buffer
 * @return {Float32Array}
 */
function decodeNpy(buffer) {
  if (buffer.toString('latin1', 0, 6) !== '\x93NUMPY') throw new Error('not a .npy file');
  const headerLength = buffer.readUInt16LE(8);
  const header = buffer.toString('latin1', 10, 10 + headerLength);
  if (!/'descr': *'[<|]f4'/.test(header)) throw new Error(`expected float32, header: ${header}`);
  const body = buffer.subarray(10 + headerLength);
  return new Float32Array(body.buffer, body.byteOffset, body.length / 4);
}

/**
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @return {Buffer}
 */
function encodeWav(samples, sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVEfmt ', 8, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

async function main() {
  const bundle = JSON.parse(read('bundle.json').toString('utf8'));
  console.log(`bundle ${bundle.bundle_name}: ${bundle.sample_rate}Hz, `
    + `${bundle.frame_rate} frames/s, latent ${bundle.latent_dim}, `
    + `${bundle.flow_lm_state_manifest.length} flow states, `
    + `${bundle.mimi_state_manifest.length} mimi states`);

  const tokenizer = SentencePieceUnigram.parse(read('tokenizer.model'));
  console.log(`tokenizer: ${tokenizer.vocabSize} pieces`);

  const load = async (file) => {
    const started = Date.now();
    const session = await ort.InferenceSession.create(read(file));
    console.log(`  loaded ${file} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return session;
  };

  console.log('loading sessions...');
  const sessions = {
    textConditioner: await load('text_conditioner_int8.onnx'),
    flowLmMain: await load('flow_lm_main_int8.onnx'),
    flowLmFlow: await load('flow_lm_flow_int8.onnx'),
    mimiDecoder: await load('mimi_decoder_int8.onnx'),
    mimiEncoder: await load('mimi_encoder_int8.onnx'),
  };

  console.log('session signatures:');
  for (const [name, session] of Object.entries(sessions)) {
    console.log(`  ${name}: in=${session.inputNames.length} out=${session.outputNames.length}`);
  }

  const synthesizer = new PocketTtsSynthesizer({
    bundle,
    sessions,
    tokenizer,
    bosBeforeVoice: decodeNpy(read('bos_before_voice.npy')),
    runtime: ort,
  });

  console.log('cloning voice from reference_sample.wav...');
  const reference = decodeWav(read('reference_sample.wav'));
  console.log(`  reference: ${(reference.samples.length / reference.sampleRate).toFixed(2)}s `
    + `at ${reference.sampleRate}Hz`);

  const referenceSamples = resample(reference.samples, reference.sampleRate, bundle.sample_rate);
  if (reference.sampleRate !== bundle.sample_rate) {
    console.log(`  resampled to ${bundle.sample_rate}Hz: ${referenceSamples.length} samples`);
  }

  const embeddings = await synthesizer.encodeVoice(referenceSamples);
  console.log(`  voice embeddings: [${embeddings.dims.join(', ')}]`);
  await synthesizer.setVoiceFromEmbeddings(embeddings);
  console.log('  voice state primed');

  console.log(`synthesizing: ${JSON.stringify(TEXT)}`);
  console.log(`  chunks: ${JSON.stringify(synthesizer.splitIntoChunks(TEXT))}`);

  const started = Date.now();
  const { samples, sampleRate } = await synthesizer.synthesize(TEXT, {
    onProgress: p => console.log(`  chunk ${p.chunk}/${p.chunks}, ${p.frames} frames`),
  });
  const elapsed = (Date.now() - started) / 1000;

  const duration = samples.length / sampleRate;
  let peak = 0;
  let sumSquares = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / (samples.length || 1));

  console.log(`\nRESULT: ${samples.length} samples, ${duration.toFixed(2)}s audio `
    + `in ${elapsed.toFixed(1)}s (RTFx ${(duration / elapsed).toFixed(2)}x)`);
  console.log(`  peak ${peak.toFixed(4)}, rms ${rms.toFixed(4)}`);

  if (!samples.length) throw new Error('FAIL: no audio produced');
  if (peak < 0.01) throw new Error(`FAIL: audio is effectively silent (peak ${peak})`);

  fs.writeFileSync(OUTPUT, encodeWav(samples, sampleRate));
  console.log(`  wrote ${OUTPUT}`);
}

main().catch(error => {
  console.error('\nFAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
});
