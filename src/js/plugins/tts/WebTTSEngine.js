
import { isChrome, sleep } from './utils.js';
import AbstractTTSEngine from './AbstractTTSEngine.js';

/** @typedef {import("./AbstractTTSEngine.js").PageChunk} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js").TTSEngineOptions} TTSEngineOptions */

/** @typedef {{utterance: SpeechSynthesisUtterance}} UtteranceMixin */

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
        this._isChrome = isChrome();
    }

    /** @override */
    stop() {
        this.playStream = null;
        window.speechSynthesis.cancel();
        super.stop();
    }

    /** @override */
    getPlayStream() {
        this.playStream = this.playStream || this.chunkStream
        .map(this.addUtterance.bind(this))
        .buffer(2);

        return this.playStream;
    }

    /**
     * @override
     * @param {PageChunk & UtteranceMixin} chunk
     * @return {PromiseLike}
     */
    playChunk(chunk) {
        const endPromise = new Promise(res => chunk.utterance.onend = res);
        window.speechSynthesis.speak(chunk.utterance);

        if (this._isChrome && !chunk.utterance.voice.localService) {
            return this.chromePausingBugFix(endPromise);
        }
        else return endPromise;
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
    chromePausingBugFix(endPromise) {
        const sleepPromise = sleep(14000).then(() => 'timedout');
        return Promise.race([sleepPromise, endPromise])
        .then(result => {
            if (result == 'timedout') {
                window.speechSynthesis.pause();
                return sleep(25)
                .then(() => {
                    window.speechSynthesis.resume();
                    return this.chromePausingBugFix(endPromise);
                });
            }
            else return endPromise;
        });
    }

    /**
     * @private
     * @param {PageChunk & UtteranceMixin} pageChunk
     * @return {PageChunk & UtteranceMixin}
     */
    addUtterance(pageChunk) {
        pageChunk.utterance = new SpeechSynthesisUtterance(pageChunk.text);
        pageChunk.utterance.voice = window.speechSynthesis.getVoices().find(v => v.default);
        return pageChunk;
    }
}
