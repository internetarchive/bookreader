
import { isChrome, sleep } from './utils.js';
import AbstractTTSEngine from './AbstractTTSEngine.js';

/** @typedef {import("./AbstractTTSEngine.js").PageChunk} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js").AbstractTTSSound} AbstractTTSSound */
/** @typedef {import("./AbstractTTSEngine.js").TTSEngineOptions} TTSEngineOptions */
/** @typedef {import("./AbstractTTSEngine.js").AbstractTTSSound} AbstractTTSSound */

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
    }

    load(onload) {
        this.sound = new SpeechSynthesisUtterance(this.text);
        this.sound.voice = speechSynthesis.getVoices().find(v => v.default);
        onload();
    }

    play() {
        const endPromise = new Promise(res => this.sound.onend = res);
        speechSynthesis.speak(this.sound);

        if (isChrome() && !this.sound.voice.localService) {
            return this._chromePausingBugFix(endPromise);
        }
        else return endPromise;
    }

    stop() { speechSynthesis.cancel(); }
    pause() { speechSynthesis.pause(); }
    resume() { speechSynthesis.resume(); }

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
