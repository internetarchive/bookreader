
import { isChrome, sleep } from './utils.js';
import AbstractTTSEngine from './AbstractTTSEngine.js';

/** @typedef {import("./AbstractTTSEngine.js").PageChunk} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js").TTSEngineOptions} TTSEngineOptions */

/** @typedef {{sound: WebTTSSound}} UtteranceMixin */

/**
 * @extends AbstractTTSEngine<UtteranceMixin>
 * TTS using Web Speech APIs
 **/
export default class WebTTSEngine extends AbstractTTSEngine {
    static isSupported() {
        return typeof(window.speechSynthesis) !== 'undefined';
    }

    /** @param {TTSEngineOptions} options */
    constructor(options) {
        super(options);
        /** @type {WebTTSSound} */
        this.activeSound = null;
    }

    /** @override */
    stop() {
        this.playStream = null;
        this.activeSound.stop();
        super.stop();
    }

    /** @override */
    getPlayStream() {
        this.playStream = this.playStream || this.chunkStream
        .map(chunk => {
            chunk.sound = new WebTTSSound(chunk.text);
            return chunk.sound.load()
            .then(() => chunk);
        })
        .buffer(2);

        return this.playStream;
    }

    /**
     * @override
     * @param {PageChunk & UtteranceMixin} chunk
     * @return {PromiseLike}
     */
    playChunk(chunk) {
        this.activeSound = chunk.sound;
        return this.activeSound.play();
    }
}

class WebTTSSound {
    /** @param {string} text **/
    constructor(text) {
        this.text = text;
        /** @type {SpeechSynthesisUtterance} */
        this.sound = null;
    }

    load() {
        this.sound = new SpeechSynthesisUtterance(this.text);
        this.sound.voice = speechSynthesis.getVoices().find(v => v.default);
        return Promise.resolve(this);
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
