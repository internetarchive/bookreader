import { WebTTSSound } from '../../plugins/tts/WebTTSEngine.js';
import AbstractTTSEngine from '../../plugins/tts/AbstractTTSEngine.js';

/**
 * The browser SpeechSynthesis engine, adapted to the audio reader's engine
 * interface (see the `TTSEngine` typedef in AudioReaderPlayer.js).
 *
 * This reuses {@link WebTTSSound} from the existing read-aloud plugin rather than
 * re-deriving it: that class already carries the hard-won browser workarounds
 * (Chrome's 15-second cutoff, pause/resume events that fire inconsistently or not
 * at all across Firefox/Android/Safari).
 *
 * SpeechSynthesis synthesizes and plays in one step, so `synthesize` here is
 * essentially free and the buffer is always instantly hydrated. That is exactly
 * why this engine is the fallback and preview path: it makes the whole UX
 * demonstrable, and later gives PocketTTS something to hide behind while it works.
 */
export default class WebSpeechEngine {
  static isSupported() {
    return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
  }

  /**
   * @param {Object} [opts]
   * @param {string} [opts.bookLanguage] ISO 639-1, used to pick a voice
   */
  constructor({ bookLanguage = 'en' } = {}) {
    this.name = 'WebSpeech';
    this.bookLanguage = bookLanguage;
    this.rate = 1;
    /** @type {SpeechSynthesisVoice|null} */
    this.voice = null;
    /** @type {WebTTSSound|null} */
    this._active = null;

    this._pickVoice();
    // Voices load asynchronously in Chrome; re-pick when they arrive.
    speechSynthesis.addEventListener?.('voiceschanged', () => this._pickVoice());
  }

  /** @private */
  _pickVoice() {
    const voices = speechSynthesis.getVoices() || [];
    if (!voices.length) return;
    this.voice = AbstractTTSEngine.getBestBookVoice(voices, this.bookLanguage);
  }

  /** @return {SpeechSynthesisVoice[]} */
  getVoices() {
    return (speechSynthesis.getVoices() || []).filter(v => v.lang?.startsWith(this.bookLanguage));
  }

  /** @param {string} voiceURI */
  setVoice(voiceURI) {
    const match = (speechSynthesis.getVoices() || []).find(v => v.voiceURI === voiceURI);
    if (match) this.voice = match;
  }

  /**
   * Nothing to precompute -- the browser does synthesis at speak() time. We still
   * build the sound object here so the queue has something to cache and the
   * player's buffering logic is identical for every engine.
   * @param {string} text
   * @return {Promise<WebTTSSound>}
   */
  async synthesize(text) {
    const sound = new WebTTSSound(text);
    sound.voice = this.voice;
    sound.rate = this.rate;
    sound.load();
    return sound;
  }

  /**
   * @param {WebTTSSound} sound
   * @param {{signal: AbortSignal}} ctx
   * @return {Promise<void>} resolves when the sound has finished speaking
   */
  play(sound, { signal }) {
    if (signal.aborted) return Promise.resolve();

    // A sound may be played more than once (the patron seeks back to it), but a
    // WebTTSSound is single-use: its utterance has already ended. Reload it.
    sound.load();
    sound.voice = this.voice;
    sound.rate = this.rate;

    this._active = sound;

    const onAbort = () => sound.stop();
    signal.addEventListener('abort', onAbort);

    return sound.play().finally(() => {
      signal.removeEventListener('abort', onAbort);
      if (this._active === sound) this._active = null;
    });
  }

  pause() {
    this._active?.pause();
  }

  resume() {
    // Resuming a sound that never started would speak it twice; the player calls
    // resume() on every play(), including the first.
    if (this._active?.started) this._active.resume();
  }

  stop() {
    this._active?.stop();
    this._active = null;
    speechSynthesis.cancel();
  }

  /** @param {number} rate */
  setRate(rate) {
    this.rate = rate;
    if (this._active) this._active.setPlaybackRate(rate);
  }
}
