import 'es6-promise/auto';
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
        return new Promise(res => {
            chunk.utterance.onend = res;
            window.speechSynthesis.speak(chunk.utterance);
        });
    }

    /**
     * @private
     * @param {PageChunk} pageChunk
     * @return {PageChunk & UtteranceMixin}
     */
    addUtterance(pageChunk) {
        pageChunk.utterance = new SpeechSynthesisUtterance(pageChunk.text);
        return pageChunk;
    }
}