
import { isChrome, sleep } from './utils.js';
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
    }

    /** @override */
    getVoices() { return speechSynthesis.getVoices(); }

    /** @override */
    createSound(chunk) {
        return new WebTTSSound(chunk.text);
    }
}

/** @extends AbstractTTSSound */
class WebTTSSound {
    /** @param {string} text **/
    constructor(text) {
        this.text = text;
        /** @type {SpeechSynthesisUtterance} */
        this.sound = null;
        this.loaded = true;
        this.rate = 1;
        this._charIndex = 0;
        /** @type {SpeechSynthesisVoice} */
        this.voice = null;
    }

    load(onload) {
        this.sound = new SpeechSynthesisUtterance(this.text.slice(this._charIndex));
        this.sound.voice = this.voice;
        this.sound.rate = this.rate;
        onload && onload();
    }

    play() {
        const endPromise = new Promise(res => this.sound.onend = res);
        this.sound.voice = this.voice;
        this.sound.rate = this.rate;
        speechSynthesis.speak(this.sound);

        if (isChrome() && !this.sound.voice.localService) {
            return this._chromePausingBugFix(endPromise);
        }
        else return endPromise;
    }

    stop() { speechSynthesis.cancel(); }
    pause() { speechSynthesis.pause(); }
    resume() { speechSynthesis.resume(); }

    setPlaybackRate(rate) {
        new Promise(res => {
            this.sound.onpause = res;
            this.pause();
        }).then(/** @param {SpeechSynthesisEvent} ev */ev => {
            // 'steal' the onend event so the promise doesn't resolve
            let onend = this.sound ? this.sound.onend : null;
            if (this.sound) this.sound.onend = null;

            this.stop();
            
            // Reload the audio at the new position
            this.rate = rate;
            // Browser support for this is mixed, but it degrades
            // to restarted the chunk if it doesn't exist, and that's
            // ok
            this._charIndex += ev.charIndex || 0;
            this.load();

            // return the promise resolver
            this.sound.onend = onend;

            speechSynthesis.speak(this.sound);
        })
    }

    /**
     * @private
     * Chrome has a bug where it only plays 15 seconds of TTS and then
     * suddenly stops (see https://bugs.chromium.org/p/chromium/issues/detail?id=679437 )
     * We avoid this (as described here: https://bugs.chromium.org/p/chromium/issues/detail?id=679437#c15 )
     * by pausing after 14 seconds and ~instantly resuming.
     * @param {PromiseLike} endPromise promise that will file once the utterance is done
     * @return {PromiseLike}
     */
    _chromePausingBugFix(endPromise) {
        const sleepPromise = sleep(14000).then(() => 'timedout');
        return Promise.race([sleepPromise, endPromise])
        .then(result => {
            if (result == 'timedout') {
                speechSynthesis.pause();
                return sleep(25)
                .then(() => {
                    speechSynthesis.resume();
                    return this._chromePausingBugFix(endPromise);
                });
            }
            else return endPromise;
        });
    }
}
