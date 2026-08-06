import PcmAudioOutput from './PcmAudioOutput.js';
import { DEFAULT_MODEL_BASE } from '../pocket/modelStore.js';

/**
 * PocketTTS as an audio-reader engine: synthesis in a Web Worker, playback
 * through {@link PcmAudioOutput}.
 *
 * Synthesis is slower than real time (measured around RTFx 1.7x on one wasm
 * thread), which is exactly what the player's lookahead buffer exists for. The
 * engine itself stays simple: `synthesize` returns a promise for PCM, the queue
 * decides what to synthesize and when to give up on it.
 */
export default class PocketTtsEngine {
  /**
   * @param {Object} [opts]
   * @param {string} [opts.workerUrl]
   * @param {string} [opts.modelBase] where the ONNX bundle is served from
   * @param {string} [opts.ortBase] where onnxruntime's wasm files are served from
   * @param {string} [opts.referenceAudioUrl] voice to clone
   * @param {(progress: Object) => void} [opts.onProgress]
   */
  constructor({
    workerUrl = '/BookReader/pocket-tts-worker.js',
    modelBase = DEFAULT_MODEL_BASE,
    ortBase = '/BookReader/ort/',
    referenceAudioUrl = 'https://huggingface.co/KevinAHM/pocket-tts-onnx/resolve/main/reference_sample.wav',
    onProgress,
  } = {}) {
    this.name = 'PocketTTS';
    this.rate = 1;
    this.output = new PcmAudioOutput();

    this.modelBase = modelBase;
    this.ortBase = ortBase;
    this.referenceAudioUrl = referenceAudioUrl;
    this._onProgress = onProgress || (() => {});

    /** Loading state, surfaced in the UI while ~146MB of weights arrive. */
    this.status = 'loading';
    this.progress = { loaded: 0, total: 1, file: null };
    this.sampleRate = null;

    this._worker = new Worker(workerUrl);
    this._worker.addEventListener('message', event => this._onMessage(event.data));
    this._worker.addEventListener('error', event => {
      this.status = 'error';
      this.error = event.message || 'worker failed to start';
      this._readyReject?.(new Error(`PocketTTS: ${this.error}`));
    });

    /** @type {Map<string, {resolve: Function, reject: Function}>} */
    this._pending = new Map();
    this._nextId = 0;

    this.ready = new Promise((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
    });
    // Callers that only poll `status` should not trip an unhandled rejection.
    this.ready.catch(() => {});

    this._worker.postMessage({
      type: 'init',
      modelBase: this.modelBase,
      ortBase: this.ortBase,
      referenceAudioUrl: this.referenceAudioUrl,
    });
  }

  static isSupported() {
    return typeof Worker !== 'undefined'
      && typeof WebAssembly !== 'undefined'
      && !!(typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
  }

  /** @return {{soundsPlayed: number, samplesPlayed: number, peakAmplitude: number}} */
  get stats() {
    return this.output.stats;
  }

  /** @private @param {Object} message */
  _onMessage(message) {
    if (message.type === 'progress') {
      this.progress = { file: message.file, loaded: message.loaded, total: message.total };
      this._onProgress(this.progress);
      return;
    }

    if (message.type === 'ready') {
      this.status = 'ready';
      this.sampleRate = message.sampleRate;
      this.voiceFrames = message.voiceFrames;
      this._readyResolve(this);
      this._onProgress(this.progress);
      return;
    }

    if (message.type === 'audio') {
      this._pending.get(message.id)?.resolve({
        samples: message.samples,
        sampleRate: message.sampleRate,
      });
      this._pending.delete(message.id);
      return;
    }

    if (message.type === 'error') {
      const error = new Error(`PocketTTS: ${message.message}`);
      if (message.id && this._pending.has(message.id)) {
        this._pending.get(message.id).reject(error);
        this._pending.delete(message.id);
        return;
      }
      // An error with no request id is a failure to initialize.
      this.status = 'error';
      this.error = message.message;
      this._readyReject(error);
    }
  }

  /**
   * @param {string} text
   * @param {{signal: AbortSignal}} ctx
   * @return {Promise<{samples: Float32Array, sampleRate: number}>}
   */
  async synthesize(text, { signal }) {
    await this.ready;
    if (signal?.aborted) throw new Error('PocketTTS: synthesis aborted');

    const id = String(this._nextId++);

    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });

      const onAbort = () => {
        // Tell the worker to stop; a stale frame loop would hold the single
        // synthesis slot against work the patron is actually waiting for.
        this._worker.postMessage({ type: 'cancel', id });
        this._pending.delete(id);
        reject(new Error('PocketTTS: synthesis aborted'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });

      this._worker.postMessage({ type: 'synthesize', id, text });
    });
  }

  /**
   * @param {{samples: Float32Array, sampleRate: number}} sound
   * @param {{signal: AbortSignal}} ctx
   * @return {Promise<void>}
   */
  play(sound, ctx) {
    return this.output.play(sound, ctx);
  }

  pause() { this.output.pause(); }
  resume() { this.output.resume(); }
  stop() { this.output.stop(); }

  /** @param {number} rate */
  setRate(rate) {
    this.rate = rate;
    this.output.setRate(rate);
  }

  destroy() {
    this.output.stop();
    this._worker.terminate();
  }
}
