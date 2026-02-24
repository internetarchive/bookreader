/* global br */
import { isChrome, isFirefox } from '../../util/browserSniffing.js';
import { isAndroid, DEBUG_READ_ALOUD } from './utils.js';
import { promisifyEvent, sleep } from '../../BookReader/utils.js';
import AbstractTTSEngine from './AbstractTTSEngine.js';
/** @typedef {import("./AbstractTTSEngine.js").PageChunk} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js").AbstractTTSSound} AbstractTTSSound */
/** @typedef {import("./AbstractTTSEngine.js").TTSEngineOptions} TTSEngineOptions */

/**
 * @extends AbstractTTSEngine
 * TTS using Web Speech APIs
 **/
export default class WebTTSEngine extends AbstractTTSEngine {
  static isSupported() {
    return typeof(window.speechSynthesis) !== 'undefined';
  }

  /** @param {TTSEngineOptions} options */
  constructor(options) {
    super(options);

    // SAFARI doesn't have addEventListener on speechSynthesis
    if (speechSynthesis.addEventListener) {
      speechSynthesis.addEventListener('voiceschanged', () => this.events.trigger('voiceschanged'));
    }
  }

  /** @override */
  start(leafIndex, numLeafs) {
    // Need to run in this function to capture user intent to start playing audio
    if ('mediaSession' in navigator) {
      /**
       * According to https://developers.google.com/web/updates/2017/02/media-session#implementation_notes , it needs to be at least 5 seconds
       * long to allow usage of the media sessions api
       */
      const audio = new Audio(br.options.imagesBaseURL + '../silence.mp3');
      audio.loop = true;

      this.events.on('pause', () => audio.pause());
      this.events.on('resume', () => audio.play());
      // apparently this is what you need to do to make the media session notification go away
      // See https://developers.google.com/web/updates/2017/02/media-session#implementation_notes
      this.events.on('stop', () => audio.src = '');
      audio.play().then(() => {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: br.bookTitle,
          artist: br.options.metadata.filter(m => m.label == 'Author').map(m => m.value)[0],
          // album: 'The Ultimate Collection (Remastered)',
          artwork: [
            { src: br.options.thumbnail, type: 'image/jpg' },
          ],
        });

        navigator.mediaSession.setPositionState({
          duration: Infinity,
        });

        navigator.mediaSession.setActionHandler('play', () => {
          audio.play();
          this.resume();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          audio.pause();
          this.pause();
        });

        // navigator.mediaSession.setActionHandler('seekbackward', () => this.jumpBackward());
        // navigator.mediaSession.setActionHandler('seekforward', () => this.jumpForward());
        // Some devices only support the previoustrack/nexttrack (e.g. Win10), so show those.
        // Android devices do support the seek actions, but we don't want to show both buttons
        // and have them do the same thing.
        navigator.mediaSession.setActionHandler('previoustrack', () => this.jumpBackward());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.jumpForward());
      });
    }

    return super.start(leafIndex, numLeafs);
  }

  /** @override */
  getVoices() {
    const voices = speechSynthesis.getVoices();
    if (voices.filter(v => v.default).length != 1) {
      // iOS bug where the default system voice is sometimes
      // missing from the list
      voices.unshift({
        voiceURI: 'bookreader.SystemDefault',
        name: 'System Default',
        // Not necessarily true, but very likely
        lang: navigator.language,
        default: true,
        localService: true,
      });
    }
    return voices;
  }

  /** @override */
  createSound(chunk) {
    return new WebTTSSound(chunk.text);
  }
}

/** @extends AbstractTTSSound */
export class WebTTSSound {
  /** @param {string} text **/
  constructor(text) {
    this.text = text;
    this.loaded = false;
    this.paused = false;
    this.started = false;
    /** Whether the audio was stopped with a .stop() call */
    this.stopped = false;
    this.rate = 1;

    /** @type {SpeechSynthesisUtterance} */
    this.utterance = null;

    /** @type {SpeechSynthesisVoice} */
    this.voice = null;

    this._lastEvents = {
      /** @type {SpeechSynthesisEvent} */
      pause: null,
      /** @type {SpeechSynthesisEvent} */
      boundary: null,
      /** @type {SpeechSynthesisEvent} */
      start: null,
    };

    /** Store where we are in the text. Only works on some browsers. */
    this._charIndex = 0;

    /** @type {Function} resolve function called when playback finished */
    this._finishResolver = null;

    /** @type {Promise} promise resolved by _finishResolver */
    this._finishPromise = null;
  }

  /** @override **/
  load(onload) {
    this.loaded = false;
    this.started = false;

    this.utterance = new SpeechSynthesisUtterance(this.text.slice(this._charIndex));
    // iOS bug where the default system voice is sometimes
    // missing from the list
    if (this.voice?.voiceURI !== 'bookreader.SystemDefault') {
      this.utterance.voice = this.voice;
    }
    // Need to also set lang (for some reason); won't set voice on Chrome@Android otherwise
    if (this.voice) this.utterance.lang = this.voice.lang;
    this.utterance.rate = this.rate;

    // Useful for debugging things
    if (DEBUG_READ_ALOUD) {
      this.utterance.addEventListener('pause', () => console.log('pause'));
      this.utterance.addEventListener('resume', () => console.log('resume'));
      this.utterance.addEventListener('start', () => console.log('start'));
      this.utterance.addEventListener('end', () => console.log('end'));
      this.utterance.addEventListener('error', ev => console.log('error', ev));
      this.utterance.addEventListener('boundary', () => console.log('boundary'));
      this.utterance.addEventListener('mark', () => console.log('mark'));
      this.utterance.addEventListener('finish', () => console.log('finish'));
    }

    // Keep track of the speech synthesis events that come in; they have useful info
    // about progress (like charIndex)
    this.utterance.addEventListener('start', ev => this._lastEvents.start = ev);
    this.utterance.addEventListener('boundary', ev => this._lastEvents.boundary = ev);
    this.utterance.addEventListener('pause', ev => this._lastEvents.pause = ev);

    // Update our state
    this.utterance.addEventListener('start', () => {
      this.started = true;
      this.stopped = false;
      this.paused = false;
    });
    this.utterance.addEventListener('pause', () => this.paused = true);
    this.utterance.addEventListener('resume', () => this.paused = false);
    this.utterance.addEventListener('end', ev => {
      if (!this.paused && !this.stopped) {
        // Trigger a new event, finish, which only fires when audio fully completed
        this.utterance.dispatchEvent(new CustomEvent('finish', ev));
      }
    });
    this.loaded = true;
    onload && onload();
  }

  /**
   * Run whenever properties have changed. Tries to restart in the same spot it
   * left off.
   * @return {Promise<void>}
   */
  async reload() {
    // We'll restore the pause state, so copy it here
    const wasPaused = this.paused;
    // Use recent event to determine where we'll restart from
    // Browser support for this is mixed, but it degrades to restarting the chunk
    // and that's ok
    const recentEvent = this._lastEvents.boundary || this._lastEvents.pause;
    if (recentEvent) {
      this._charIndex = this.text.indexOf(recentEvent.target.text) + recentEvent.charIndex;
    }

    // We can't modify the utterance object, so we have to make a new one
    await this.stop();
    this.load();
    // Instead of playing and immediately pausing, we don't start playing. Note
    // this is a requirement because pause doesn't work consistently across
    // browsers.
    if (!wasPaused) this.play();
  }

  play() {
    this._finishPromise = this._finishPromise || new Promise(res => this._finishResolver = res);
    this.utterance.addEventListener('finish', this._finishResolver);

    // clear the queue
    speechSynthesis.cancel();
    // reset pause state
    speechSynthesis.resume();
    // Speak
    speechSynthesis.speak(this.utterance);

    const isLocalVoice = this.utterance.voice && this.utterance.voice.localService;
    if (isChrome() && !isLocalVoice) this._chromePausingBugFix();

    return this._finishPromise;
  }

  /** @return {Promise} */
  stop() {
    // 'end' won't fire if already stopped
    let endPromise = Promise.resolve();
    if (!this.stopped) {
      endPromise = Promise.race([
        promisifyEvent(this.utterance, 'end'),
        // Safari triggers an error when you call cancel mid-sound
        promisifyEvent(this.utterance, 'error'),
      ]);
    }
    this.stopped = true;
    speechSynthesis.cancel();
    return endPromise;
  }

  async finish() {
    await this.stop();
    this.utterance.dispatchEvent(new Event('finish'));
  }

  /**
   * @override
   * Will fire a pause event unless already paused
   **/
  async pause() {
    if (this.paused) return;

    const pausePromise = promisifyEvent(this.utterance, 'pause');
    speechSynthesis.pause();

    // There are a few awful browser cases:
    // 1. Pause works and fires
    // 2. Pause doesn't work and doesn't fire
    // 3. Pause works but doesn't fire
    const pauseMightNotWork = (isFirefox() && isAndroid());

    // Pause sometimes works, but doesn't fire the event, so wait to see if it fires
    const winner = await Promise.race([pausePromise, sleep(100).then(() => 'timeout')]);

    // We got our pause event; nothing to do!
    if (winner != 'timeout') return;

    if (DEBUG_READ_ALOUD) {
      console.log('TTS: Firing pause event manually');
    }

    this.utterance.dispatchEvent(new CustomEvent('pause', this._lastEvents.start));

    // if pause might not work, then we'll stop entirely and restart later
    if (pauseMightNotWork) this.stop();
  }

  async resume() {
    if (!this.started || this.stopped) {
      this.play();
      return;
    }

    if (!this.paused) return;

    // Browser cases:
    // 1. Resume works + fires
    // 2. Resume works + doesn't fire (Chrome Desktop)
    // 3. Resume doesn't work + doesn't fire (Chrome/FF Android)
    const resumeMightNotWork = (isChrome() && isAndroid()) || (isFirefox() && isAndroid());

    // Try resume
    const resumePromise = promisifyEvent(this.utterance, 'resume');
    speechSynthesis.resume();

    const winner = await Promise.race([resumePromise, sleep(100).then(() => 'timeout')]);
    // We got resume! All is good
    if (winner != 'timeout') return;

    if (DEBUG_READ_ALOUD) {
      console.log('TTS: Firing resume event manually');
    }

    // Fake it
    this.utterance.dispatchEvent(new CustomEvent('resume', {}));
    if (resumeMightNotWork) {
      await this.reload();
      this.play();
    }
  }

  setPlaybackRate(rate) {
    this.rate = rate;
    this.reload();
  }

  /** @param {SpeechSynthesisVoice} voice */
  setVoice(voice) {
    this.voice = voice;
    this.reload();
  }
  /**
   * @private
   * Chrome has a bug where it only plays 15 seconds of TTS and then
   * suddenly stops (see https://bugs.chromium.org/p/chromium/issues/detail?id=679437 )
   * We avoid this (as described here: https://bugs.chromium.org/p/chromium/issues/detail?id=679437#c15 )
   * by pausing after 14 seconds and ~instantly resuming.
   */
  async _chromePausingBugFix() {
    if (DEBUG_READ_ALOUD) {
      console.log('CHROME-PAUSE-HACK: starting');
    }

    const result = await Promise.race([
      sleep(14000).then(() => 'timeout'),
      promisifyEvent(this.utterance, 'pause').then(() => 'pause'),
      promisifyEvent(this.utterance, 'end').then(() => 'end'),
      // Some browsers (Edge) trigger error when the utterance is interrupted/stopped
      promisifyEvent(this.utterance, 'error').then(() => 'error'),
    ]);

    if (DEBUG_READ_ALOUD) {
      console.log(`CHROME-PAUSE-HACK: ${result}`);
    }
    if (result == 'end' || result == 'error') {
      // audio was stopped/finished; nothing to do
      if (DEBUG_READ_ALOUD) {
        console.log('CHROME-PAUSE-HACK: stopped (end/error)');
      }
    } else if (result == 'pause') {
      // audio was paused; wait for resume
      // Chrome won't let you resume the audio if 14s have passed 🤷‍
      // We could do the same as before (but resume+pause instead of pause+resume),
      // but that means we'd _constantly_ be running in the background. So in that
      // case, let's just restart the chunk
      const result2 = await Promise.race([
        promisifyEvent(this.utterance, 'resume').then(() => 'resume'),
        sleep(14000).then(() => 'timeout'),
      ]);
      if (result2 == 'timeout') {
        if (DEBUG_READ_ALOUD) {
          console.log('CHROME-PAUSE-HACK: stopped (timed out while paused)');
        }
        // We hit Chrome's secret cut off time while paused, and
        // won't be able to resume normally, so trigger a stop.
        this.stop();
      } else {
        // The user resumed before the cut off! Continue as normal
        this._chromePausingBugFix();
      }
    } else if (result == 'timeout') {
      // We hit Chrome's secret cut off time while playing.
      // To be able to keep TTS-ing, quickly pause/resume.
      speechSynthesis.pause();
      await sleep(25);
      speechSynthesis.resume();

      // Listen for more
      this._chromePausingBugFix();
    }
  }
}
