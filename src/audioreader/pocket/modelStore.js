/**
 * Fetch and cache the PocketTTS model bundle.
 *
 * The default is kyutai's 18.2M-parameter "small" English model (the Oct 2026
 * `pocket-tts-small` release), int8-quantized to roughly 28MB across four model
 * files -- down from ~146MB for the 2026-04 bundle. Re-downloading that on every
 * page load would be wasteful, so responses go into the Cache API, keyed by URL,
 * and subsequent loads are served from disk.
 *
 * The mimi *encoder* (used only to clone a voice from arbitrary audio) is NOT in
 * the default file list: the two shipped voices are precomputed embeddings (see
 * loadVoice), so the ~20MB encoder never needs to be downloaded.
 *
 * Progress is reported per byte rather than per file, because "3 of 4 files" is
 * useless when one of them is 13MB.
 */

/** Where the ungated small ONNX bundle lives (reward-fine-tuned 18M English). */
export const DEFAULT_MODEL_BASE = 'https://huggingface.co/ken107/pocket-tts-onnx/resolve/main/english_18m_refl_2026-10';

/** Where the precomputed default-voice embeddings are served from. */
export const DEFAULT_VOICES_BASE = '/BookReaderDemo/pocket-tts-voices';

/** Cache name; bumping this invalidates every stored bundle. */
const CACHE_NAME = 'bookreader-pocket-tts-v2';

/**
 * Approximate sizes of the small int8 bundle, so a total can be shown before any
 * response headers arrive. Only used for progress display.
 */
const APPROXIMATE_BYTES = {
  'flow_lm_main_int8.onnx': 13_311_400,
  'text_conditioner_int8.onnx': 8_194_566,
  'mimi_decoder_int8.onnx': 5_516_637,
  'flow_lm_flow_int8.onnx': 915_805,
  'mimi_encoder_int8.onnx': 20_405_732,
  'tokenizer.model': 59_339,
  'bos_before_voice.npy': 2_176,
  'bundle.json': 30_031,
};

/**
 * @typedef {Object} LoadProgress
 * @property {string} file the file currently being fetched
 * @property {number} loaded bytes fetched so far, across all files
 * @property {number} total best estimate of the total
 * @property {boolean} fromCache whether this file came from the cache
 */

/**
 * @return {boolean} whether responses can be cached in this context
 */
function cacheAvailable() {
  return typeof caches !== 'undefined';
}

/**
 * Fetch one file, preferring the cache.
 * @param {string} base
 * @param {string} file
 * @param {Object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @param {(bytes: number) => void} [opts.onBytes] called with each chunk's size
 * @return {Promise<{buffer: ArrayBuffer, fromCache: boolean}>}
 */
async function fetchFile(base, file, { signal, onBytes } = {}) {
  const url = `${base}/${file}`;
  const cache = cacheAvailable() ? await caches.open(CACHE_NAME) : null;

  if (cache) {
    const hit = await cache.match(url);
    if (hit) {
      const buffer = await hit.arrayBuffer();
      onBytes?.(buffer.byteLength);
      return { buffer, fromCache: true };
    }
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`PocketTTS: HTTP ${response.status} fetching ${file}`);
  }

  // Store before consuming the body, so the cache gets an unread clone.
  if (cache) {
    try {
      await cache.put(url, response.clone());
    } catch (error) {
      // A quota failure should slow us down next time, not break this load.
      console.warn(`PocketTTS: could not cache ${file}`, error);
    }
  }

  const buffer = await response.arrayBuffer();
  onBytes?.(buffer.byteLength);
  return { buffer, fromCache: false };
}

/**
 * Load every file of a bundle.
 * @param {Object} [opts]
 * @param {string} [opts.base] where to fetch from; override to serve locally
 * @param {string[]} [opts.files]
 * @param {AbortSignal} [opts.signal]
 * @param {(progress: LoadProgress) => void} [opts.onProgress]
 * @return {Promise<Object<string, ArrayBuffer>>} file name -> contents
 */
export async function loadBundleFiles({
  base = DEFAULT_MODEL_BASE,
  files = [
    'bundle.json',
    'tokenizer.model',
    'bos_before_voice.npy',
    'text_conditioner_int8.onnx',
    'flow_lm_flow_int8.onnx',
    'mimi_decoder_int8.onnx',
    'flow_lm_main_int8.onnx',
  ],
  signal,
  onProgress,
} = {}) {
  const total = files.reduce((sum, file) => sum + (APPROXIMATE_BYTES[file] || 0), 0);
  let loaded = 0;

  /** @type {Object<string, ArrayBuffer>} */
  const result = {};

  // Sequential on purpose: parallel fetches of the bundle compete for bandwidth
  // with the book's own text requests and make progress reporting meaningless.
  for (const file of files) {
    const { buffer, fromCache } = await fetchFile(base, file, {
      signal,
      onBytes: bytes => {
        loaded += bytes;
        onProgress?.({ file, loaded, total: Math.max(total, loaded), fromCache });
      },
    });
    result[file] = buffer;
  }

  return result;
}

/**
 * Load a precomputed voice embedding by id.
 *
 * Voices are shipped as a `voices.json` manifest plus one Float32LE `.f32` per
 * voice (the mimi-encoder output, ~210KB). Loading one is cheap and needs no
 * model: the worker feeds it straight to `setVoiceFromEmbeddings`, which primes
 * the voice through flow_lm_main. This is why the 20MB mimi encoder is not in the
 * default bundle -- the two shipped voices never need to be cloned at runtime.
 *
 * @param {Object} [opts]
 * @param {string} [opts.voicesBase] where voices.json and the `.f32` files live
 * @param {string} [opts.voiceId] which voice; defaults to the first in the manifest
 * @param {AbortSignal} [opts.signal]
 * @return {Promise<{id: string, label: string, data: Float32Array, dims: number[]}>}
 */
export async function loadVoice({ voicesBase = DEFAULT_VOICES_BASE, voiceId, signal } = {}) {
  const manifestResponse = await fetch(`${voicesBase}/voices.json`, { signal });
  if (!manifestResponse.ok) {
    throw new Error(`PocketTTS: HTTP ${manifestResponse.status} fetching voices.json`);
  }
  const manifest = await manifestResponse.json();
  const voice = (voiceId && manifest.voices.find(v => v.id === voiceId)) || manifest.voices[0];
  if (!voice) throw new Error(`PocketTTS: no voice "${voiceId}" in voices.json`);

  const { buffer } = await fetchFile(voicesBase, voice.file, { signal });
  // A Float32Array needs a byte offset that is a multiple of 4; a fresh ArrayBuffer
  // from the Cache/network is aligned, so wrapping it directly is safe.
  return { id: voice.id, label: voice.label, data: new Float32Array(buffer), dims: voice.dims };
}

/**
 * Whether a bundle is already cached, so the UI can say "ready" instead of
 * "download" before the patron commits to it.
 * @param {Object} [opts]
 * @param {string} [opts.base]
 * @param {string[]} [opts.files]
 * @return {Promise<boolean>}
 */
export async function isBundleCached({ base = DEFAULT_MODEL_BASE, files = ['flow_lm_main_int8.onnx'] } = {}) {
  if (!cacheAvailable()) return false;
  const cache = await caches.open(CACHE_NAME);
  for (const file of files) {
    if (!(await cache.match(`${base}/${file}`))) return false;
  }
  return true;
}

/**
 * Drop the cached bundle, for when a patron wants the space back.
 * @return {Promise<boolean>}
 */
export async function clearBundleCache() {
  if (!cacheAvailable()) return false;
  return caches.delete(CACHE_NAME);
}
