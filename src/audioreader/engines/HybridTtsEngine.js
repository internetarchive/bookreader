/**
 * Two engines, one voice: a fast one that starts instantly and a slow one that
 * sounds better.
 *
 * Issue #1580 floats this directly -- "a hybrid of PocketTTS and
 * WebSpeechSynthesis (much faster) to provide an instant fallback preview while
 * the higher quality voices are loading" -- and it is the answer to the one real
 * weakness of PocketTTS in a browser: at roughly RTFx 1.7 on a single wasm
 * thread, a paragraph the buffer has not reached yet costs seconds of silence.
 *
 * The rule is simple, and it falls out of *when* each decision is made:
 *
 * - **At synthesis time**, give PocketTTS a short grace period. If it finishes
 *   within it -- which is the normal case once the lookahead buffer is warm,
 *   because synthesis started paragraphs ago -- the segment is high quality and
 *   nothing else happens.
 * - **If the grace period expires**, hand back a placeholder carrying a
 *   WebSpeech preview, and leave PocketTTS running.
 * - **At play time**, check again. If PocketTTS landed in the meantime, play
 *   that. Otherwise speak the preview immediately.
 *
 * So a patron reading straight through hears the good voice, and a patron who
 * seeks somewhere cold hears *something* at once and the good voice from the
 * next segment on. Nothing is ever thrown away: PocketTTS audio that arrives
 * late is still cached by the queue for a seek back.
 */

/**
 * How long to let the quality engine try before falling back to a preview.
 * Long enough to cover a buffer that is nearly caught up, short enough that a
 * cold seek still feels immediate.
 */
export const DEFAULT_GRACE_MS = 400;

/** Marks a sound that is waiting on the quality engine. */
const PREVIEW = Symbol('preview');

export default class HybridTtsEngine {
  /**
   * @param {Object} opts
   * @param {Object} opts.fast engine that synthesizes ~instantly (WebSpeech)
   * @param {Object} opts.quality engine that sounds better but is slow (PocketTTS)
   * @param {number} [opts.graceMs]
   */
  constructor({ fast, quality, graceMs = DEFAULT_GRACE_MS }) {
    this.name = `Hybrid(${quality.name} + ${fast.name})`;
    this.fast = fast;
    this.quality = quality;
    this.graceMs = graceMs;
    this.rate = 1;

    /** Which engine is currently producing sound, so pause/stop reach it. */
    this._active = null;

    /** Counters, so the split between quality and preview playback is visible. */
    this.counts = { quality: 0, preview: 0, upgraded: 0 };
  }

  /** @return {string} 'loading' | 'ready' | 'error', taken from the quality engine */
  get status() {
    return this.quality.status ?? 'ready';
  }

  get progress() {
    return this.quality.progress;
  }

  get error() {
    return this.quality.error;
  }

  /** @return {Object} playback stats, summed across both engines */
  get stats() {
    const fast = this.fast.stats || { soundsPlayed: 0, samplesPlayed: 0, peakAmplitude: 0 };
    const quality = this.quality.stats || { soundsPlayed: 0, samplesPlayed: 0, peakAmplitude: 0 };
    return {
      soundsPlayed: fast.soundsPlayed + quality.soundsPlayed,
      samplesPlayed: fast.samplesPlayed + quality.samplesPlayed,
      peakAmplitude: Math.max(fast.peakAmplitude, quality.peakAmplitude),
      qualityPlayed: this.counts.quality,
      previewPlayed: this.counts.preview,
      upgradedBeforePlay: this.counts.upgraded,
    };
  }

  /**
   * @param {string} text
   * @param {{signal: AbortSignal}} ctx
   * @return {Promise<Object>} either a quality sound, or a preview placeholder
   */
  async synthesize(text, ctx) {
    const qualitySound = this.quality.synthesize(text, ctx);
    // Nothing else may await this promise, and an abort rejects it; keep an inert
    // handler so a rejection never surfaces as unhandled.
    qualitySound.catch(() => {});

    const raced = await Promise.race([
      qualitySound.then(sound => ({ sound })).catch(error => ({ error })),
      sleep(this.graceMs).then(() => null),
    ]);

    if (raced?.sound) return raced.sound;

    // The quality engine failed outright: this segment is the fast engine's for
    // good. Still wrapped, so play() routes it to the engine that owns it.
    if (raced?.error) {
      return this._previewHolder(text, await this.fast.synthesize(text, ctx), null);
    }

    return this._previewHolder(text, await this.fast.synthesize(text, ctx), qualitySound);
  }

  /**
   * @private
   * Wrap a fast-engine sound, optionally alongside a still-running quality
   * synthesis that may supersede it.
   *
   * The quality result is recorded onto the holder as soon as it settles rather
   * than being re-raced at play time: "has this promise already resolved?" cannot
   * be answered synchronously, and racing it against an immediate promise always
   * loses by a microtask.
   *
   * @param {string} text
   * @param {any} preview
   * @param {Promise<any>|null} qualityPromise
   * @return {Object}
   */
  _previewHolder(text, preview, qualityPromise) {
    const holder = {
      [PREVIEW]: true,
      text,
      preview,
      qualityPromise,
      qualitySound: null,
    };
    qualityPromise?.then(
      (sound) => { holder.qualitySound = sound; },
      () => {},
    );
    return holder;
  }

  /**
   * @param {Object} sound
   * @param {{signal: AbortSignal}} ctx
   * @return {Promise<void>}
   */
  async play(sound, ctx) {
    if (!sound?.[PREVIEW]) {
      this.counts.quality++;
      this._active = this.quality;
      return this.quality.play(sound, ctx);
    }

    // Between synthesis and playback the buffer may have caught up.
    const upgraded = sound.qualitySound;
    if (upgraded) {
      this.counts.quality++;
      // Count the handover once per segment, not once per replay of it.
      if (!sound.upgradeCounted) {
        sound.upgradeCounted = true;
        this.counts.upgraded++;
      }
      this._active = this.quality;
      return this.quality.play(upgraded, ctx);
    }

    this.counts.preview++;
    this._active = this.fast;
    return this.fast.play(sound.preview, ctx);
  }

  pause() { this._active?.pause(); }

  resume() { this._active?.resume(); }

  stop() {
    // Stop both: a preview and a quality sound can be mid-transition.
    this.fast.stop();
    this.quality.stop();
    this._active = null;
  }

  /** @param {number} rate */
  setRate(rate) {
    this.rate = rate;
    this.fast.setRate?.(rate);
    this.quality.setRate?.(rate);
  }

  destroy() {
    this.fast.destroy?.();
    this.quality.destroy?.();
  }
}

/**
 * @param {number} ms
 * @return {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
