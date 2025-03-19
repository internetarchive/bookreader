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
    return typeof(window.speechSynthesis) !== 'undefined' && !/samsungbrowser/i.test(navigator.userAgent);
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
      const audio = new Audio(SILENCE_6S_MP3);
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
    if (this._chromeTimedOutWhilePaused) {
      await this.reload();
    }

    if (!this.started) {
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

    this._chromeTimedOutWhilePaused = false;
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
        // We hit Chrome's secret cut off time while paused, note as such
        // so we can reload when the user tries to resume.
        this._chromeTimedOutWhilePaused = true;
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

/**
 * According to https://developers.google.com/web/updates/2017/02/media-session#implementation_notes , it needs to be at least 5 seconds
 * long to allow usage of the media sessions api
 */
const SILENCE_6S_MP3 = 'data:audio/mp3;base64,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';
