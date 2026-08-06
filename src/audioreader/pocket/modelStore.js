/**
 * Fetch and cache the PocketTTS model bundle.
 *
 * The int8 English bundle is roughly 146MB across five files. Re-downloading that
 * on every page load would be indefensible, so responses go into the Cache API,
 * keyed by bundle name, and subsequent loads are served from disk.
 *
 * Progress is reported per byte rather than per file, because "3 of 5 files" is
 * useless when one of them is 76MB.
 */

/** Where the ungated ONNX bundle lives. */
export const DEFAULT_MODEL_BASE = 'https://huggingface.co/KevinAHM/pocket-tts-onnx/resolve/main/onnx/english_2026-04';

/** Cache name; bumping this invalidates every stored bundle. */
const CACHE_NAME = 'bookreader-pocket-tts-v1';

/**
 * Approximate sizes of the int8 bundle, so a total can be shown before any
 * response headers arrive. Only used for progress display.
 */
const APPROXIMATE_BYTES = {
  'flow_lm_main_int8.onnx': 76_341_079,
  'mimi_decoder_int8.onnx': 22_684_077,
  'mimi_encoder_int8.onnx': 20_779_616,
  'text_conditioner_int8.onnx': 16_388_384,
  'flow_lm_flow_int8.onnx': 9_962_530,
  'tokenizer.model': 59_339,
  'bos_before_voice.npy': 4_224,
  'bundle.json': 40_000,
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
    'mimi_encoder_int8.onnx',
    'flow_lm_main_int8.onnx',
  ],
  signal,
  onProgress,
} = {}) {
  const total = files.reduce((sum, file) => sum + (APPROXIMATE_BYTES[file] || 0), 0);
  let loaded = 0;

  /** @type {Object<string, ArrayBuffer>} */
  const result = {};

  // Sequential on purpose: eight parallel fetches of a 146MB bundle competes for
  // bandwidth with the book's own text requests and makes progress meaningless.
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
 * Whether a bundle is already cached, so the UI can say "ready" instead of
 * "146MB download" before the patron commits to it.
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
