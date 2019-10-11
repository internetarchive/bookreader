import AsyncStream from './AsyncStream.js';
/** @typedef {import('./utils.js').ISO6391} ISO6391 */

/**
 * @export
 * @typedef {Object} PageChunk
 * @property {Number} leafIndex
 * @property {String} text
 * @property {DJVURect[]} lineRects
 * @property {AbstractTTSSound} sound
 */

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
 * @typedef {[number, number, number, number]} DJVURect
 * coords are in l,b,r,t order
 */

/**
 * @typedef {Object} AbstractTTSSound
 * @property {boolean} loaded
 * @property {number} rate
 * @property {SpeechSynthesisVoice} voice
 * @property {(callback: Function) => void} load
 * @property {() => PromiseLike} play
 * @property {() => void} stop
 * @property {() => void} pause
 * @property {() => void} resume
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
        /** @type {AsyncStream<PageChunk>} */
        this.chunkStream = null;
        /** @type {AbstractTTSSound} */
        this.activeSound = null;
        this.playbackRate = 1;
        /** @type {SpeechSynthesisVoice} */
        this.voice = AbstractTTSEngine.getBestVoice(this.getVoices(), this.opts.bookLanguage);
    }

    /**
     * @abstract
     * @return {boolean}
     */
    static isSupported() { return false; }

    /**
     * @abstract
     * @return {SpeechSynthesisVoice[]}
     */
    getVoices() { throw new Error("Unimplemented abstract class"); }

    /** @abstract */
    init() { return null; }

    /**
     * @param {number} leafIndex
     * @param {number} numLeafs total number of leafs in the current book
     */
    start(leafIndex, numLeafs) {
        this.playing = true;
        this.opts.onLoadingStart();

        /** @type {AsyncStream<PageChunk>} */
        this.chunkStream = AsyncStream.range(leafIndex, numLeafs-1)
        .map(this.fetchPageChunks.bind(this))
        .buffer(2)
        .flatten()
        .map(chunk => {
            this.opts.onLoadingStart();
            chunk.sound = this.createSound(chunk);
            chunk.sound.rate = this.playbackRate;
            chunk.sound.voice = this.voice;
            chunk.sound.load(() => this.opts.onLoadingComplete());
            return chunk;
        });

        this.step();
    }

    stop() {
        this.activeSound.stop();
        this.playing = false;
        this.chunkStream = null;
        this.activeSound = null;
    }

    /** @public */
    pause() {
        this.paused = true;
        if (this.activeSound) this.activeSound.pause();
    }

    /** @public */
    resume() {
        this.paused = false;
        if (this.activeSound) this.activeSound.resume();
    }

    /** @param {number} newRate */
    setPlaybackRate(newRate) {
        this.playbackRate = newRate;
        if (this.activeSound) this.activeSound.setPlaybackRate(newRate);
    }

    /**
     * @private
     */
    step() {
        this.chunkStream.pull()
        .then(item => {
            if (item.done) {
                this.stop();
                this.opts.onDone();
                return;
            }
            this.opts.onLoadingComplete();
            return this.opts.beforeChunkPlay(item.value).then(() => item.value);
        })
        .then(chunk => {
            if (!this.playing) return;

            const playPromise = this.playChunk(chunk)
            .then(() => this.opts.afterChunkPlay(chunk));
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
     */
    createSound(chunk) { throw new Error("Unimplemented abstract class"); }

    /**
     * @param {PageChunk} chunk
     * @return {PromiseLike} promise called once playing finished
     */
    playChunk(chunk) {
        this.activeSound = chunk.sound;
        if (!this.activeSound.loaded) this.opts.onLoadingStart();
        return this.activeSound.play();
    }

    /**
     * @private
     * Gets the text on a page with given index
     * @param {Number} leafIndex
     * @return {PromiseLike<Array<PageChunk>>}
     */
    fetchPageChunks(leafIndex) {
        return $.ajax({
            type: 'GET',
            url: 'https://'+this.opts.server+'/BookReader/BookReaderGetTextWrapper.php',
            dataType:'jsonp',
            data: {
                path: this.opts.bookPath+'_djvu.xml',
                page: leafIndex
            }
        })
        .then(
            /** @param {Array<[String, ...Array<DJVURect>]>} chunks */
            function (chunks) {
                return chunks.map(c => {
                    return {
                        leafIndex,
                        text: c[0],
                        lineRects: c.slice(1)
                    };
                });
            }
        );
    }

    /**
     * @private
     * @param {SpeechSynthesisVoice[]} voices
     * @param {ISO6391} bookLanguage
     * @return {SpeechSynthesisVoice | undefined}
     */
    static getBestVoice(voices, bookLanguage) {
        const possibleVoices = voices.filter(v => v.lang.startsWith(bookLanguage));
        // Sample navigator.languages: ["en-CA", "fr-CA", "fr", "en-US", "en", "de-DE", "de"]
        const userLanguages = navigator.languages || navigator.language ? [navigator.language] : [];
        const matchingUserLanguages = userLanguages.filter(lang => lang.startsWith(bookLanguage));
        if (matchingUserLanguages.length) {
            let voice = null;
            matchingUserLanguages.forEach(userLang => {
                const matchingVoices = possibleVoices.filter(v => v.lang.startsWith(userLang));
                if (matchingVoices.length) {
                    voice = matchingVoices.find(v => v.default) || matchingVoices[0];
                    return;
                }
            });
            if (voice) return voice;
        }
        return possibleVoices.find(v => v.default) || possibleVoices[0];
    }
}
