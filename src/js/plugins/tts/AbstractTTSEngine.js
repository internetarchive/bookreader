import PageChunkIterator from './PageChunkIterator.js';
/** @typedef {import('./utils.js').ISO6391} ISO6391 */
/** @typedef {import('./PageChunk.js')} PageChunk */

/**
 * @export
 * @typedef {Object} TTSEngineOptions
 * @property {String} server
 * @property {String} bookPath
 * @property {ISO6391} bookLanguage
 * @property {Function} onLoadingStart
 * @property {Function} onLoadingComplete
 * @property {Function} onDone called when the entire book is done
 * @property {function(PageChunk): PromiseLike} beforeChunkPlay will delay the playing of the chunk
 * @property {function(PageChunk): void} afterChunkPlay fires once a chunk has fully finished
 */

/**
 * @typedef {Object} AbstractTTSSound
 * @property {PageChunk} chunk
 * @property {boolean} loaded
 * @property {number} rate
 * @property {SpeechSynthesisVoice} voice
 * @property {(callback: Function) => void} load
 * @property {() => PromiseLike} play
 * @property {() => Promise} stop
 * @property {() => void} pause
 * @property {() => void} resume
 * @property {() => void} finish force the sound to 'finish'
 * @property {number => void} setPlaybackRate
 **/

/** Handling bookreader's text-to-speech */
export default class AbstractTTSEngine {
  /**
   * @protected
   * @param {TTSEngineOptions} options
   */
  constructor(options) {
    this.playing = false;
    this.paused = false;
    this.opts = options;
    /** @type {PageChunkIterator} */
    this._chunkIterator = null;
    /** @type {AbstractTTSSound} */
    this.activeSound = null;
    this.playbackRate = 1;
    /** Events we can bind to */
    this.events = $({});
    /** @type {SpeechSynthesisVoice} */
    this.voice = null;
    // Listen for voice changes (fired by subclasses)
    this.events.on('voiceschanged', () => {
      this.voice = AbstractTTSEngine.getBestBookVoice(this.getVoices(), this.opts.bookLanguage);
    });
    this.events.trigger('voiceschanged');
  }

  /**
   * @abstract
   * @return {boolean}
   */
  static isSupported() { throw new Error("Unimplemented abstract class") }

  /**
   * @abstract
   * @return {SpeechSynthesisVoice[]}
   */
  getVoices() { throw new Error("Unimplemented abstract class") }

  /** @abstract */
  init() { return null }

  /**
   * @param {number} leafIndex
   * @param {number} numLeafs total number of leafs in the current book
   */
  start(leafIndex, numLeafs) {
    this.playing = true;
    this.opts.onLoadingStart();

    this._chunkIterator = new PageChunkIterator(numLeafs, leafIndex, {
      server: this.opts.server,
      bookPath: this.opts.bookPath,
      pageBufferSize: 5,
    });

    this.step();
    this.events.trigger('start');
  }

  stop() {
    if (this.activeSound) this.activeSound.stop();
    this.playing = false;
    this._chunkIterator = null;
    this.activeSound = null;
    this.events.trigger('stop');
  }

  /** @public */
  pause() {
    const fireEvent = !this.paused && this.activeSound;
    this.paused = true;
    if (this.activeSound) this.activeSound.pause();
    if (fireEvent) this.events.trigger('pause');
  }

  /** @public */
  resume() {
    const fireEvent = this.paused && this.activeSound;
    this.paused = false;
    if (this.activeSound) this.activeSound.resume();
    if (fireEvent) this.events.trigger('resume');
  }

  togglePlayPause() {
    if (this.paused) this.resume();
    else this.pause();
  }

  /** @public */
  jumpForward() {
    if (this.activeSound) this.activeSound.finish();
  }

  /** @public */
  jumpBackward() {
    Promise.all([
      this.activeSound.stop(),
      this._chunkIterator.decrement()
        .then(() => this._chunkIterator.decrement())
    ])
      .then(() => this.step());
  }

  /** @param {number} newRate */
  setPlaybackRate(newRate) {
    this.playbackRate = newRate;
    if (this.activeSound) this.activeSound.setPlaybackRate(newRate);
  }

  /** @private */
  step() {
    this._chunkIterator.next()
      .then(chunk => {
        if (chunk == PageChunkIterator.AT_END) {
          this.stop();
          this.opts.onDone();
          return;
        }

        this.opts.onLoadingStart();
        const sound = this.createSound(chunk);
        sound.chunk = chunk;
        sound.rate = this.playbackRate;
        sound.voice = this.voice;
        sound.load(() => this.opts.onLoadingComplete());

        this.opts.onLoadingComplete();
        return this.opts.beforeChunkPlay(chunk).then(() => sound);
      })
      .then(sound => {
        if (!this.playing) return;

        const playPromise = this.playSound(sound)
          .then(() => this.opts.afterChunkPlay(sound.chunk));
        if (this.paused) this.pause();
        return playPromise;
      })
      .then(() => {
        if (this.playing) return this.step();
      });
  }

  /**
   * @abstract
   * @param {PageChunk} chunk
   * @return {AbstractTTSSound}
   */
  createSound(chunk) { throw new Error("Unimplemented abstract class") }

  /**
   * @param {AbstractTTSSound} sound
   * @return {PromiseLike} promise called once playing finished
   */
  playSound(sound) {
    this.activeSound = sound;
    if (!this.activeSound.loaded) this.opts.onLoadingStart();
    return this.activeSound.play();
  }

  /** Convenience wrapper for {@see AbstractTTSEngine.getBestVoice} */
  getBestVoice() {
    return AbstractTTSEngine.getBestBookVoice(this.getVoices(), this.opts.bookLanguage);
  }

  /**
   * @private
   * Find the best voice to use given the available voices, the book language, and the user's
   * languages.
   * @param {SpeechSynthesisVoice[]} voices
   * @param {ISO6391} bookLanguage
   * @param {string[]} userLanguages languages in BCP47 format (e.g. en-US). Ordered by preference.
   * @return {SpeechSynthesisVoice | undefined}
   */
  static getBestBookVoice(voices, bookLanguage, userLanguages = navigator.languages) {
    const bookLangVoices = voices.filter(v => v.lang.startsWith(bookLanguage));
    // navigator.languages browser support isn't great yet, so get just 1 langauge otherwise
    // Sample navigator.languages: ["en-CA", "fr-CA", "fr", "en-US", "en", "de-DE", "de"]
    userLanguages = userLanguages || (navigator.language ? [navigator.language] : []);

    // user languages that match the book language
    const matchingUserLangs = userLanguages.filter(lang => lang.startsWith(bookLanguage));

    // Try to find voices that intersect these two sets
    return AbstractTTSEngine.getMatchingVoice(matchingUserLangs, bookLangVoices) ||
        // no user languages match the books; let's return the best voice for the book language
        (bookLangVoices.find(v => v.default) || bookLangVoices[0])
        // No voices match the book language? let's find a voice in the user's langauge
        // and ignore book lang
        || AbstractTTSEngine.getMatchingVoice(userLanguages, voices)
        // C'mon! Ok, just read with whatever we got!
        || (voices.find(v => v.default) || voices[0]);
  }

  /**
     * @private
     * Get the best voice that matches one of the BCP47 languages (order by preference)
     * @param {string[]} languages in BCP 47 format (e.g. 'en-US', or 'en'); ordered by preference
     * @param {SpeechSynthesisVoice[]} voices voices to choose from
     * @return {SpeechSynthesisVoice | undefined}
     */
  static getMatchingVoice(languages, voices) {
    for (const lang of languages) {
      // Chrome Android was returning voice languages like `en_US` instead of `en-US`
      const matchingVoices = voices.filter(v => v.lang.replace('_', '-').startsWith(lang));
      if (matchingVoices.length) {
        return matchingVoices.find(v => v.default) || matchingVoices[0];
      }
    }
  }
}
