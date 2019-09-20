import 'es6-promise/auto';
import AsyncStream from './AsyncStream.js';

/**
 * @export
 * @typedef {Object} PageChunk
 * @property {Number} leafIndex
 * @property {String} text
 * @property {DJVURect[]} lineRects
 */

/**
 * @export
 * @typedef {Object} TTSEngineOptions 
 * @property {String} server
 * @property {String} bookPath
 * @property {String?} bookLanguage language in ISO 639-1. (PRIVATE: Will also
 * handle language name in English, native name, 639-2/T, or 639-2/B . (archive.org books
 * appear to use 639-2/B ? But I don't think that's a guarantee). See
 * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes )
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
 * @template TSound extra properties added to PageChunk to allow playing
 */
export default class AbstractTTSEngine {
    /**
     * @protected
     * @param {TTSEngineOptions} options 
     */
    constructor(options) {
        this.playing = false;
        this.opts = options;
        /** @type {AsyncStream<PageChunk>} */
        this.chunkStream = null;
    }

    /**
     * @abstract
     * @return {boolean}
     */
    static isSupported() { return false; }

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
        .flatten();

        this.step();
    }

    stop() {
        this.playing = false;
        this.chunkStream = null;
    }

    /**
     * @private
     */
    step() {
        this.getPlayStream().pull()
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
            if (this.playing) {
                return this.playChunk(chunk).then(() => chunk);
            }
        })
        .then(chunk => {
            this.opts.afterChunkPlay(chunk);
            if (this.playing) return this.step();
        });
    }

    /**

     * @abstract
     * @return {AbstractStream<PageChunk & TSound>}
     */
    getPlayStream() { return null; }

    /**
     * @abstract
     * @param {PageChunk & TSound} chunk
     * @return {PromiseLike} promise called once playing finished
     */
    playChunk(chunk) { return null; }

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
}