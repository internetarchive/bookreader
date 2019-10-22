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
 * @property {() => void} finish force the sound to 'finish'
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
            this.voice = AbstractTTSEngine.getBestBookVoice(this.getVoices(), this.opts.bookLanguage);
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
        this.events.trigger('start');
    }

    stop() {
        this.activeSound.stop();
        this.playing = false;
        this.chunkStream = null;
        this.activeSound = null;
        this.events.trigger('stop');
    }

    /** @public */
    pause() {
        const fireEvent = !this.paused && this.activeSound;
        this.paused = true;
        if (this.activeSound) this.activeSound.pause();
        if (fireEvent) this.events.trigger('pause');
    }

    /** @public */
    resume() {
        const fireEvent = this.paused && this.activeSound;
        this.paused = false;
        if (this.activeSound) this.activeSound.resume();
        if (fireEvent) this.events.trigger('resume');
    }

    togglePlayPause() {
        if (this.paused) this.resume();
        else this.pause();
    }

    /** @public */
    jumpForward() {
        if (this.activeSound) this.activeSound.finish();
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
                        lineRects: AbstractTTSEngine._fixChunkRects(c.slice(1)),
                    };
                });
            }
        );
    }

    /** Convenience wrapper for {@see AbstractTTSEngine.getBestVoice} */
    getBestVoice() {
        return AbstractTTSEngine.getBestBookVoice(this.getVoices(), this.opts.bookLanguage);
    }

    /**
     * @private
     * Find the best voice to use given the available voices, the book language, and the user's
     * languages.
     * @param {SpeechSynthesisVoice[]} voices
     * @param {ISO6391} bookLanguage
     * @param {string[]} userLanguages languages in BCP47 format (e.g. en-US). Ordered by preference.
     * @return {SpeechSynthesisVoice | undefined}
     */
    static getBestBookVoice(voices, bookLanguage, userLanguages=navigator.languages) {
        const bookLangVoices = voices.filter(v => v.lang.startsWith(bookLanguage));
        // navigator.languages browser support isn't great yet, so get just 1 langauge otherwise
        // Sample navigator.languages: ["en-CA", "fr-CA", "fr", "en-US", "en", "de-DE", "de"]
        userLanguages = userLanguages || (navigator.language ? [navigator.language] : []);

        // user languages that match the book language
        const matchingUserLangs = userLanguages.filter(lang => lang.startsWith(bookLanguage));

        // Try to find voices that intersect these two sets
        return AbstractTTSEngine.getMatchingVoice(matchingUserLangs, bookLangVoices) ||
        // no user languages match the books; let's return the best voice for the book language
        (bookLangVoices.find(v => v.default) || bookLangVoices[0])
        // No voices match the book language? let's find a voice in the user's langauge
        // and ignore book lang
        || AbstractTTSEngine.getMatchingVoice(userLanguages, voices)
        // C'mon! Ok, just read with whatever we got!
        || (voices.find(v => v.default) || voices[0]);
    }

    /**
     * @private
     * Get the best voice that matches one of the BCP47 languages (order by preference)
     * @param {string[]} languages in BCP 47 format (e.g. 'en-US', or 'en'); ordered by preference
     * @param {SpeechSynthesisVoice[]} voices voices to choose from
     * @return {SpeechSynthesisVoice | undefined}
     */
    static getMatchingVoice(languages, voices) {
        for (let lang of languages) {
            // Chrome Android was returning voice languages like `en_US` instead of `en-US`
            const matchingVoices = voices.filter(v => v.lang.replace('_', '-').startsWith(lang));
            if (matchingVoices.length) {
                return matchingVoices.find(v => v.default) || matchingVoices[0];
            }
        }
    }

    /**
     * @private
     * Sometimes the first rectangle will be ridiculously wide/tall. Find those and fix them
     * *NOTE*: Modifies the original array and returns it.
     * *NOTE*: This should probably be fixed on the petabox side, and then removed here
     * Has 2 problems:
     *  - If the rect is the last rect on the page (and hence the only rect in the array),
     *    the rect's size isn't fixed
     * - Because this relies on the second rect, there's a chance it won't be the right
     *   width
     * @param {DJVURect[]} rects 
     * @return {DJVURect[]}
     */
    static _fixChunkRects(rects) {
        if (rects.length < 2) return rects;

        const firstRect = rects[0];
        const secondRect = rects[1];
        const { 0: left, 1: bottom, 2: right, 3: top } = firstRect;
        const width = right - left;
        const secondHeight = secondRect[1] - secondRect[3];
        const secondWidth = secondRect[2] - secondRect[0];
        const secondRight = secondRect[2];

        if (width > secondWidth * 30) {
            // Set the end to be the same
            firstRect[2] = secondRight;
            // And the top to be the same height
            firstRect[3] = bottom - secondHeight;
        }

        return rects;
    }
}
