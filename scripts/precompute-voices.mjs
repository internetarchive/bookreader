/**
 * Precompute PocketTTS voice embeddings for the audio reader's default voices.
 *
 * The named voices (Stuart Bell, Caro Davy) are published by kyutai only as
 * reference WAV clips in `kyutai/tts-voices/voice-zero/`. Turning one into a
 * voice means running it through the mimi encoder once -- a ~20MB model. Rather
 * than ship that encoder to every patron and encode on every page load, we run
 * the encoder here, once, and commit the resulting embeddings (~215KB each).
 * The browser then only needs `setVoiceFromEmbeddings`, which uses flow_lm_main
 * (already in the bundle) -- so the 20MB encoder never has to be downloaded.
 *
 * Usage:
 *   node scripts/precompute-voices.mjs [modelDir] [outDir]
 *
 * modelDir must hold the small int8 bundle (bundle.json, mimi_encoder_int8.onnx)
 * and the voice clips (stuart_bell.wav, caro_davy.wav). Defaults to the local
 * BookReaderDemo copies. Output is written as one Float32LE `.f32` per voice
 * plus a `voices.json` manifest.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as ort from 'onnxruntime-web';
import PocketTtsSynthesizer from '../src/audioreader/pocket/PocketTtsSynthesizer.js';
import resample from '../src/audioreader/pocket/resample.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = process.argv[2] || path.resolve(here, '../BookReaderDemo/pocket-tts-models-small');
const OUT_DIR = process.argv[3] || path.resolve(here, '../BookReaderDemo/pocket-tts-voices');

/** The two voices shipped as defaults, in menu order. */
const VOICES = [
  { id: 'stuart_bell', label: 'Stuart Bell', gender: 'm', file: 'stuart_bell.wav' },
  { id: 'caro_davy', label: 'Caro Davy', gender: 'f', file: 'caro_davy.wav' },
];

ort.env.wasm.numThreads = 1;
ort.env.logLevel = 'error';

/** Minimal mono 16-bit PCM WAV reader; the browser uses decodeAudioData instead. */
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
  if (!data) throw new Error('WAV has no data chunk');
  if (bitsPerSample !== 16) throw new Error(`expected 16-bit WAV, got ${bitsPerSample}`);
  const frames = Math.floor(data.length / 2 / channels);
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += data.readInt16LE((i * channels + c) * 2);
    samples[i] = sum / channels / 32768;
  }
  return { samples, sampleRate };
}

async function main() {
  const read = name => fs.readFileSync(path.join(MODEL_DIR, name));
  const bundle = JSON.parse(read('bundle.json').toString());

  const synthesizer = new PocketTtsSynthesizer({
    bundle,
    sessions: { mimiEncoder: await ort.InferenceSession.create(read('mimi_encoder_int8.onnx')) },
    tokenizer: null,
    runtime: ort,
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {
    bundle: bundle.bundle_name,
    conditioning_dim: bundle.conditioning_dim,
    sample_rate: bundle.sample_rate,
    voices: [],
  };

  for (const voice of VOICES) {
    const { samples, sampleRate } = decodeWav(read(voice.file));
    const audio = resample(samples, sampleRate, bundle.sample_rate);
    const { data, dims } = await synthesizer.encodeVoice(audio);
    const floats = data instanceof Float32Array ? data : Float32Array.from(data);

    const outFile = `${voice.id}.f32`;
    fs.writeFileSync(path.join(OUT_DIR, outFile), Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength));
    manifest.voices.push({ id: voice.id, label: voice.label, gender: voice.gender, file: outFile, dims });
    console.log(`  ${voice.label.padEnd(12)} ${voice.file} (${sampleRate}Hz) -> ${outFile}  dims ${JSON.stringify(dims)}  ${(floats.byteLength / 1024).toFixed(0)}KB`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'voices.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nwrote ${manifest.voices.length} voices + voices.json to ${OUT_DIR}`);
}

main().catch(error => {
  console.error('FAILED:', error.message);
  process.exit(1);
});
