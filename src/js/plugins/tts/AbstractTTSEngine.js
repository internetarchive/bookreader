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
        /** Events we can bind to */
        this.events = $({});
        /** @type {SpeechSynthesisVoice} */
        this.voice = null;
        // Listen for voice changes (fired by subclasses)
        this.events.on('voiceschanged', () => {
            this.voice = AbstractTTSEngine.getBestVoice(this.getVoices(), this.opts.bookLanguage);
        });
        this.events.trigger('voiceschanged');
    }

    /**
     * @abstract
     * @return {boolean}
     */
    static isSupported() { throw new Error("Unimplemented abstract class"); }

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
            console.log(JSON.stringify(item));
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

    /** Convenience wrapper for {@see AbstractTTSEngine.getBestVoice} */
    getBestVoice() {
        return AbstractTTSEngine.getBestVoice(this.getVoices(), this.opts.bookLanguage);
    }

    /**
     * @private
     * @param {SpeechSynthesisVoice[]} voices
     * @param {ISO6391} bookLanguage
     * @param {string[]} userLanguages languages in BCP47 format (e.g. en-US). Ordered by preference.
     * @return {SpeechSynthesisVoice | undefined}
     */
    static getBestVoice(voices, bookLanguage, userLanguages=navigator.languages) {
        const possibleVoices = voices.filter(v => v.lang.startsWith(bookLanguage));
        // Sample navigator.languages: ["en-CA", "fr-CA", "fr", "en-US", "en", "de-DE", "de"]
        userLanguages = userLanguages || (navigator.language ? [navigator.language] : []);
        const matchingUserLanguages = userLanguages.filter(lang => lang.startsWith(bookLanguage));
        if (matchingUserLanguages.length) {
            const matchingVoice = AbstractTTSEngine.getMatchingVoice(matchingUserLanguages, possibleVoices);
            if (matchingVoice) return matchingVoice;
        }

        // if no matching languages, then we'll return the best possible voice
        if (possibleVoices.length) {
            const matchingVoice = possibleVoices.find(v => v.default) || possibleVoices[0];
            if (matchingVoice) return matchingVoice;
        }

        // Still no luck? then we'll try to find a voice in the user's langauge; ignoring book lang
        const userVoice = AbstractTTSEngine.getMatchingVoice(userLanguages, voices);
        if (userVoice) return userVoice;

        // C'mon! Ok, just read with whatever we got!
        return voices.find(v => v.default) || voices[0];
    }

    /**
     * 
     * @param {string[]} languages in BCP 47 format (e.g. 'en-US', or 'en')
     * @param {SpeechSynthesisVoice[]} voices 
     * @return {SpeechSynthesisVoice | undefined}
     */
    static getMatchingVoice(languages, voices) {
        for (let lang of languages) {
            // Chrome Android was returning languages like `en_US` instead of `en-US`.
            const matchingVoices = voices.filter(v => v.lang.replace('_', '-').startsWith(lang));
            if (matchingVoices.length) {
                return matchingVoices.find(v => v.default) || matchingVoices[0];
            }
        }
    }
}
