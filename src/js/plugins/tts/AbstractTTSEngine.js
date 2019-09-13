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
 * @property {Function} onLoadingStart
 * @property {Function} onLoadingComplete
 * @property {Function} onDone called when the entire book is done
 * @property {function(PageChunk): PromiseLike} beforeChunkPlay will delay the playing of the chunk
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
        /** Different engines should overwrite this */
        this.isSupported = false;
    }

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
            return this.opts.beforeChunkPlay(item.value).then(() => item)
        })
        .then(item => {
            if (this.playing) {
                return this.playChunk(item.value);
            }
        })
        .then(() => {
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