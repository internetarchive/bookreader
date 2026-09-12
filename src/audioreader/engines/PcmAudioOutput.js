/**
 * Web Audio playback for engines that produce raw samples.
 *
 * The WebSpeech path hands text to the OS and gets no samples back, so nothing
 * about it is measurable: you cannot ask how long the audio is, whether it is
 * silent, or reliably when it ended. PocketTTS produces PCM, which this plays --
 * and which can be measured, which is what makes "audio actually happened"
 * assertable rather than assumed.
 *
 * Pause/resume is implemented by hand because an AudioBufferSourceNode is
 * single-use: it cannot be restarted, so resuming means creating a new node and
 * starting it at the saved offset.
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
    /** @type {AudioContext|null} created lazily; browsers block one before a gesture */
    this.context = null;
    /** @type {AudioBufferSourceNode|null} */
    this._source = null;
    /** @type {GainNode|null} */
    this._gain = null;
    /** @type {PcmSound|null} */
    this._sound = null;
    this.rate = 1;

    /** Seconds into the current sound that playback has already covered. */
    this._offset = 0;
    /** `context.currentTime` when the current node started. */
    this._startedAt = 0;
    this._paused = false;
    /** @type {(() => void)|null} resolves the promise returned by play() */
    this._onEnded = null;

    /** @type {ReturnType<typeof setTimeout>|null} */
    this._watchdog = null;

    /**
     * Totals, so a test can prove non-silent audio actually reached the device.
     * `watchdogCompletions` counts sounds that had to be completed by the
     * watchdog rather than by a real `ended` event -- see {@link _armWatchdog}.
     */
    this.stats = { soundsPlayed: 0, samplesPlayed: 0, peakAmplitude: 0, watchdogCompletions: 0 };
  }

  /** @private @return {AudioContext} */
  _ensureContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Autoplay policy parks a context created before user interaction.
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  /**
   * @param {PcmSound} sound
   * @return {AudioBuffer}
   */
  _toAudioBuffer(sound) {
    const context = this._ensureContext();
    const buffer = context.createBuffer(1, sound.samples.length, sound.sampleRate);
    buffer.copyToChannel(sound.samples, 0);
    return buffer;
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
    this._offset = 0;
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

      this._startNode(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      });
    });
  }

  /**
   * @private
   * @param {() => void} onFinished
   */
  _startNode(onFinished) {
    const context = this._ensureContext();
    const buffer = this._toAudioBuffer(this._sound);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.rate;

    const gain = context.createGain();
    source.connect(gain);
    gain.connect(context.destination);

    const complete = (viaWatchdog) => {
      // A node also fires `ended` when we stop it for a pause or a seek; only a
      // natural finish should complete the sound.
      if (this._source !== source) return;
      if (this._paused) return;
      this._clearWatchdog();
      this._source = null;
      if (viaWatchdog) this.stats.watchdogCompletions++;
      onFinished();
    };

    source.addEventListener('ended', () => complete(false));

    this._source = source;
    this._gain = gain;
    this._startedAt = context.currentTime;
    source.start(0, this._offset);
    this._armWatchdog(buffer.duration, complete);
  }

  /**
   * @private
   * Complete the sound on a timer if `ended` never arrives.
   *
   * An AudioBufferSourceNode's `ended` event is not guaranteed: if the audio
   * context is interrupted or never renders (a backgrounded tab on mobile, a
   * device that goes away, or an automated browser with no audio device at all --
   * where the context reports `running` but its clock does not advance), the event
   * simply never fires. Since the reader advances when a sound finishes, that
   * would strand playback on one segment for the rest of the book.
   *
   * So fall back to wall-clock: a sound of known duration cannot legitimately
   * outlast it by much. Counted separately in `stats` because a watchdog
   * completion means the audio probably was *not* heard -- it is a recovery, not
   * evidence of playback.
   *
   * @param {number} duration seconds of the whole buffer
   * @param {(viaWatchdog: boolean) => void} complete
   */
  _armWatchdog(duration, complete) {
    this._clearWatchdog();
    const remaining = Math.max(0, duration - this._offset) / (this.rate || 1);
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

  /** @private @return {number} seconds of the current sound already played */
  _elapsed() {
    if (!this.context || !this._startedAt) return this._offset;
    return this._offset + (this.context.currentTime - this._startedAt) * this.rate;
  }

  pause() {
    if (!this._source || this._paused) return;
    this._offset = this._elapsed();
    this._paused = true;
    this._teardownNode();
  }

  resume() {
    if (!this._paused || !this._sound) return;
    this._paused = false;
    const resolve = this._onEnded;
    this._startNode(() => resolve?.());
  }

  stop() {
    this._teardownNode();
    this._sound = null;
    this._offset = 0;
    this._paused = false;
    this._onEnded = null;
  }

  /** @private */
  _teardownNode() {
    this._clearWatchdog();
    const source = this._source;
    this._source = null;
    if (!source) return;
    try {
      source.stop();
    } catch {
      // Already stopped; nothing to do.
    }
    source.disconnect();
    this._gain?.disconnect();
    this._gain = null;
  }

  /** @param {number} rate */
  setRate(rate) {
    this.rate = rate;
    if (this._source) this._source.playbackRate.value = rate;
  }
}
