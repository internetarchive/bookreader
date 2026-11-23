/**
 * Playback for engines that produce raw PCM samples (PocketTTS, the PCM test
 * engine).
 *
 * Plays through an `<audio>` media element rather than a Web Audio
 * `AudioBufferSourceNode`, for one decisive reason: **speed changes must not
 * change pitch.** A buffer source's `playbackRate` resamples, so 1.5x makes the
 * narrator sound like a chipmunk; a media element time-stretches with
 * `preservesPitch` (true by default), which is what a "1.5x" control is supposed
 * to do. Pause/resume and end-of-sound detection also come for free from the
 * element rather than being rebuilt by hand around a single-use node.
 *
 * Samples are wrapped in a tiny WAV container and handed to the element as a blob
 * URL. The peak/level stats are still measured straight from the Float32 samples,
 * so "audio actually happened" stays assertable.
 */

/**
 * @typedef {Object} PcmSound
 * @property {Float32Array} samples mono
 * @property {number} sampleRate
 */

/**
 * Grace period past a sound's natural duration before the watchdog steps in.
 * Generous enough not to pre-empt a real `ended` event on a busy machine.
 */
const WATCHDOG_MARGIN_MS = 400;

export default class PcmAudioOutput {
  constructor() {
    /** @type {HTMLAudioElement|null} */
    this._audio = null;
    /** @type {string|null} object URL backing the current element, to revoke */
    this._url = null;
    /** @type {PcmSound|null} */
    this._sound = null;
    this.rate = 1;
    this._paused = false;
    /** @type {(() => void)|null} resolves the promise returned by play() */
    this._onEnded = null;

    /** @type {ReturnType<typeof setTimeout>|null} */
    this._watchdog = null;

    /**
     * Totals, so a test can prove non-silent audio actually reached the device.
     * `watchdogCompletions` counts sounds finished by the watchdog rather than a
     * real `ended` event -- see {@link _armWatchdog}.
     */
    this.stats = { soundsPlayed: 0, samplesPlayed: 0, peakAmplitude: 0, watchdogCompletions: 0 };
  }

  /** @return {boolean} */
  static isSupported() {
    return typeof Audio !== 'undefined' && typeof URL?.createObjectURL === 'function';
  }

  /** @private @return {number} seconds of audio in the current sound */
  get _duration() {
    if (!this._sound?.samples?.length) return 0;
    return this._sound.samples.length / this._sound.sampleRate;
  }

  /**
   * Play a sound to completion.
   * @param {PcmSound} sound
   * @param {{signal: AbortSignal}} ctx
   * @return {Promise<void>} resolves when the sound finishes, or is aborted
   */
  play(sound, { signal }) {
    if (signal.aborted) return Promise.resolve();
    if (!sound?.samples?.length) return Promise.resolve();

    this.stop();
    this._sound = sound;
    this._paused = false;

    let peak = 0;
    for (let i = 0; i < sound.samples.length; i++) {
      const magnitude = Math.abs(sound.samples[i]);
      if (magnitude > peak) peak = magnitude;
    }
    this.stats.soundsPlayed++;
    this.stats.samplesPlayed += sound.samples.length;
    this.stats.peakAmplitude = Math.max(this.stats.peakAmplitude, peak);

    return new Promise(resolve => {
      this._onEnded = resolve;

      const onAbort = () => {
        signal.removeEventListener('abort', onAbort);
        this.stop();
        resolve();
      };
      signal.addEventListener('abort', onAbort);

      this._startAudio(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      });
    });
  }

  /**
   * @private
   * @param {() => void} onFinished
   */
  _startAudio(onFinished) {
    const audio = new Audio();
    // Default is already true, but be explicit and cover the legacy prefixes so a
    // speed change never shifts pitch.
    audio.preservesPitch = true;
    audio.mozPreservesPitch = true;
    audio.webkitPreservesPitch = true;

    this._url = URL.createObjectURL(encodeWav(this._sound.samples, this._sound.sampleRate));
    audio.src = this._url;
    audio.playbackRate = this.rate || 1;

    const complete = (viaWatchdog) => {
      // A paused element has not finished; and a stale one has been replaced.
      if (this._audio !== audio || this._paused) return;
      this._clearWatchdog();
      this._teardownAudio();
      if (viaWatchdog) this.stats.watchdogCompletions++;
      onFinished();
    };

    audio.addEventListener('ended', () => complete(false));

    this._audio = audio;
    // Autoplay policy can reject this; playback is driven by the patron's own
    // press, so in practice it is allowed. A rejection is swallowed and the
    // watchdog still advances the reader rather than stranding it.
    audio.play().catch(() => {});
    this._armWatchdog(this._duration, complete);
  }

  /**
   * @private
   * Complete the sound on a timer if `ended` never arrives.
   *
   * A media element's `ended` is normally reliable, but a backgrounded tab, a
   * device that goes away, or an automated browser with no audio output can leave
   * it unfired. Since the reader advances only when a sound finishes, that would
   * strand playback on one segment, so fall back to wall-clock from the current
   * position. Counted separately because a watchdog completion means the audio was
   * probably not heard -- it is a recovery, not evidence of playback.
   *
   * @param {number} duration seconds of the whole sound
   * @param {(viaWatchdog: boolean) => void} complete
   */
  _armWatchdog(duration, complete) {
    this._clearWatchdog();
    const played = this._audio?.currentTime || 0;
    const remaining = Math.max(0, duration - played) / (this.rate || 1);
    this._watchdog = setTimeout(() => {
      this._watchdog = null;
      complete(true);
    }, remaining * 1000 + WATCHDOG_MARGIN_MS);
  }

  /** @private */
  _clearWatchdog() {
    if (this._watchdog) clearTimeout(this._watchdog);
    this._watchdog = null;
  }

  pause() {
    if (!this._audio || this._paused) return;
    this._paused = true;
    this._clearWatchdog();
    this._audio.pause();
  }

  resume() {
    if (!this._paused || !this._audio) return;
    this._paused = false;
    this._audio.play().catch(() => {});
    // Re-arm from the current position; the remaining time just shrank.
    this._rearmWatchdog();
  }

  /**
   * @private
   * Re-arm the watchdog against the live `complete` path. Kept separate so that
   * resume() and setRate() can refresh the timer without duplicating the closure.
   */
  _rearmWatchdog() {
    const audio = this._audio;
    if (!audio) return;
    this._armWatchdog(this._duration, (viaWatchdog) => {
      if (this._audio !== audio || this._paused) return;
      this._clearWatchdog();
      const resolve = this._onEnded;
      this._teardownAudio();
      if (viaWatchdog) this.stats.watchdogCompletions++;
      resolve?.();
    });
  }

  stop() {
    this._clearWatchdog();
    this._teardownAudio();
    this._sound = null;
    this._paused = false;
    this._onEnded = null;
  }

  /** @private */
  _teardownAudio() {
    const audio = this._audio;
    this._audio = null;
    if (audio) {
      try {
        audio.pause();
      } catch {
        // Nothing to do.
      }
      audio.removeAttribute('src');
    }
    if (this._url) {
      URL.revokeObjectURL(this._url);
      this._url = null;
    }
  }

  /** @param {number} rate */
  setRate(rate) {
    this.rate = rate;
    if (this._audio) {
      this._audio.playbackRate = rate;
      // The remaining wall-clock time changed with the rate; refresh the watchdog.
      if (!this._paused) this._rearmWatchdog();
    }
  }
}

/**
 * Wrap mono float samples in a 16-bit PCM WAV container.
 * @param {Float32Array} samples -1..1
 * @param {number} sampleRate
 * @return {Blob}
 */
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM header size
  view.setUint16(20, 1, true);           // audio format: PCM
  view.setUint16(22, 1, true);           // channels: mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, Math.round(clamped * 32767), true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
