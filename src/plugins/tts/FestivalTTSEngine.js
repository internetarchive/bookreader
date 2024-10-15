import AbstractTTSEngine from './AbstractTTSEngine.js';
import { promisifyEvent } from '../../BookReader/utils.js';
import 'jquery.browser';

/** @typedef {import("./AbstractTTSEngine.js").TTSEngineOptions} TTSEngineOptions */
/** @typedef {import("./AbstractTTSEngine.js").AbstractTTSSound} AbstractTTSSound */

/**
 * @extends AbstractTTSEngine
 * TTS using Festival endpoint
 **/
export default class FestivalTTSEngine extends AbstractTTSEngine {
  /** @override */
  isSupported() {
    return true; //typeof(soundManager) !== 'undefined' && soundManager.supported();
  }

  /** @param {TTSEngineOptions} options */
  constructor(options) {
    super(options);
    // $.browsers is sometimes undefined on some Android browsers :/
    // Likely related to when $.browser was moved to npm
    /** @type {'mp3' | 'ogg'} format of audio to get */
    this.audioFormat = $.browser?.mozilla ? 'ogg' : 'mp3'; //eslint-disable-line no-jquery/no-browser
  }

  /** @override */
  getVoices() {
    return [
      { default: true, lang: "en-US", localService: false, name: "OpenAI alloy", voiceURI: 'OpenAI - alloy', openaiVoice: 'alloy', openaiModel: 'tts-1' },
      { default: true, lang: "en-US", localService: false, name: "OpenAI echo", voiceURI: 'OpenAI - echo', openaiVoice: 'echo', openaiModel: 'tts-1' },
      { default: true, lang: "en-US", localService: false, name: "OpenAI fable", voiceURI: 'OpenAI - fable', openaiVoice: 'fable', openaiModel: 'tts-1' },
      { default: true, lang: "en-US", localService: false, name: "OpenAI onyx", voiceURI: 'OpenAI - onyx', openaiVoice: 'onyx', openaiModel: 'tts-1' },
      { default: true, lang: "en-US", localService: false, name: "OpenAI nova", voiceURI: 'OpenAI - nova', openaiVoice: 'nova', openaiModel: 'tts-1' },
      { default: true, lang: "en-US", localService: false, name: "OpenAI shimmer", voiceURI: 'OpenAI - shimmer', openaiVoice: 'shimmer', openaiModel: 'tts-1' },
      // { default: true, lang: "en-US", localService: false, name: "OpenAI alloy HD", voiceURI: 'OpenAI - alloy HD', openaiVoice: 'alloy', openaiModel: 'tts-1-hd' },
      // { default: true, lang: "en-US", localService: false, name: "OpenAI echo HD", voiceURI: 'OpenAI - echo HD', openaiVoice: 'echo', openaiModel: 'tts-1-hd' },
      // { default: true, lang: "en-US", localService: false, name: "OpenAI fable HD", voiceURI: 'OpenAI - fable HD', openaiVoice: 'fable', openaiModel: 'tts-1-hd' },
      // { default: true, lang: "en-US", localService: false, name: "OpenAI onyx HD", voiceURI: 'OpenAI - onyx HD', openaiVoice: 'onyx', openaiModel: 'tts-1-hd' },
      // { default: true, lang: "en-US", localService: false, name: "OpenAI nova HD", voiceURI: 'OpenAI - nova HD', openaiVoice: 'nova', openaiModel: 'tts-1-hd' },
      // { default: true, lang: "en-US", localService: false, name: "OpenAI shimmer HD", voiceURI: 'OpenAI - shimmer HD', openaiVoice: 'shimmer', openaiModel: 'tts-1-hd' },
    ];
  }

  /** @override */
  init() {
    super.init();
    // setup sound manager
    // soundManager.setup({
    //   debugMode: false,
    //   useHTML5Audio: true,
    //   //flash 8 version of swf is buggy when calling play() on a sound that is still loading
    //   flashVersion: 9
    // });
  }

  /**
   * @override
   * @param {number} leafIndex
   * @param {number} numLeafs total number of leafs in the current book
   * @param {PageChunkIterator} chunkIterator
   */
  start(leafIndex, numLeafs, chunkIterator = null) {
    let promise = null;

    // Hack for iOS
    if (navigator.userAgent.match(/mobile/i)) {
      promise = this.iOSCaptureUserIntentHack();
    }

    promise = promise || Promise.resolve();
    promise.then(() => super.start(leafIndex, numLeafs, chunkIterator));
  }

  /** @override */
  createSound(chunk) {
    return new FestivalTTSSound(this.getSoundUrl(chunk.text), this.voice);
  }

  /**
   * @private
   * Get URL for audio that says this text
   * @param {String} dataString the thing to say
   * @return {String} url
   */
  getSoundUrl(dataString) {
    return `https://${this.opts.server}/BookReader/BookReaderGetTTS.php?${
      new URLSearchParams({
        string: dataString,
        format: this.audioFormat,
        // voice: this.voice.name,
      })
    }}`;
  }

  /**
   * @private
   * Security restrictions require playback to be triggered
   * by a user click/touch. This intention gets lost in the async calls
   * on iOS, but, for some reason, if we start the audio here, it works.
   * See https://stackoverflow.com/questions/12206631/html5-audio-cant-play-through-javascript-unless-triggered-manually-once
   * @return {PromiseLike}
   */
  async iOSCaptureUserIntentHack() {
    const sound = new Audio(SILENCE_1MS[this.audioFormat]);
    const endedPromise = promisifyEvent(sound, 'ended');
    await sound.play();
    await endedPromise;
  }
}

/** @extends AbstractTTSSound */
class FestivalTTSSound {
  /** @param {string} soundUrl **/
  constructor(soundUrl, voice) {
    this.soundUrl = soundUrl;
    this.voice = voice;
    /** @type {HTMLAudioElement} */
    this.sound = null;
    this.rate = 1;
    /** @type {function} calling this resolves the "play" promise */
    this._finishResolver = null;
  }

  get loaded() {
    return !!this.sound;
  }

  /** @param {SpeechSynthesisVoice} voice */
  async setVoice(voice) {
    if (voice == this.voice) return;
    this.voice = voice;
    if (!this.sound?.paused && !this.sound?.ended) {
      this.sound.pause();
      const timeOffset = this.sound.currentTime;
      const url = await this.fetchBlobUrl();
      this.sound.src = url;
      this.sound.play();
      this.sound.currentTime = Math.max(0, timeOffset - 5);
    }
  }

  async preload() {
    if (!this.sound) await this.load();
  }

  async fetchBlobUrl() {
    const text = new URL(this.soundUrl).searchParams.get('string');
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + (window.OPEN_API_KEY ||= prompt('OPEN_API_KEY')),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.voice.openaiModel,
        input: text,
        voice: this.voice.openaiVoice,
      }),
    });
    // const resp = await fetch(this.soundUrl);
    return URL.createObjectURL(await resp.blob());
  }

  async load(onload) {
    this.sound = new Audio(await this.fetchBlobUrl());
    onload?.();
    return;
  }

  async play() {
    await new Promise(res => {
      this._finishResolver = res;
      this.sound.play();
      promisifyEvent(this.sound, 'ended').then(res);
    });
    // this.sound.destruct();
  }

  /** @override */
  stop() {
    this.sound.pause();
    return Promise.resolve();
  }

  /** @override */
  pause() { this.sound.pause(); }
  /** @override */
  resume() { this.sound.play(); }
  /** @override */
  setPlaybackRate(rate) {
    this.rate = rate;
    this.sound.playbackRate = rate;
  }

  /** @override */
  finish() {
    this.sound.pause();
    this._finishResolver();
  }
}

/** Needed to capture the audio context for iOS hack. Generated using Audacity. */
const SILENCE_1MS = {
  mp3: 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAAAeTEFNRTMuOTlyBJwAAAAAAAAAADUgJAaUQQABrgAAAnHIf8sZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwlwBKGAAACAAAD/AAAAEAAAAH///////////////+UBAMExBTUUzLjk5LjOqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xDEIAPAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==',
  ogg: 'data:audio/ogg;base64,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',
};
