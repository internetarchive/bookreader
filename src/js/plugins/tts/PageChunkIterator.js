import PageChunk from './PageChunk.js';

/**
 * Class that iterates over the page chunks of a book; caching/buffering
 * as much as possible to try to ensure a smooth experience.
 */
export default class PageChunkIterator {
    /**
     * @param {number} pageCount total number of pages
     * @param {number} start page to start on
     * @param {PageChunkIteratorOptions} opts
     */
    constructor(pageCount, start, opts) {
        this.pageCount = pageCount;
        this.currentPage = start;
        this.nextChunkIndex = 0;
        this.opts = Object.assign({}, DEFAULT_OPTS, opts);
        /** @type {Object<number, PageChunk[]>} leaf index -> chunks*/
        this._bufferedPages = {};
        /** @type {Object<number, PromiseLike<PageChunk[]>} leaf index -> chunks*/
        this._bufferingPages = {};
        /**
         * @type {Promise} promise that manages cursor modifications so that they
         * happen in order triggered as opposed to order the server responds
         **/
        this._cursorLock = Promise.resolve();
    }

    /**
     * @return {PromiseLike<"__PageChunkIterator.AT_END__" | PageChunk>}
     */
    next() {
        return this._cursorLock = this._cursorLock
        .then(() => this._nextUncontrolled());
    }

    /** @return {Promise} */
    decrement() {
        return this._cursorLock = this._cursorLock
        .then(() => this._decrementUncontrolled());
    }

    _nextUncontrolled() {
        if (this.currentPage == this.pageCount) {
            return Promise.resolve(PageChunkIterator.AT_END);
        }

        this._recenterBuffer(this.currentPage);

        return this._fetchPage(this.currentPage)
        .then(chunks => {
            if (this.nextChunkIndex == chunks.length) {
                this.currentPage++;
                this.nextChunkIndex = 0;
                return this._nextUncontrolled();
            }
            return chunks[this.nextChunkIndex++];
        });
    }

    /**
     * Decrements without ensuring synchronization
     * @return {Promise}
     */
    _decrementUncontrolled() {
        if (this.currentPage == 0 && this.nextChunkIndex == 0) {
            return this._fetchPage(this.currentPage);
        } else if (this.currentPage > 0 && this.nextChunkIndex == 0) {
            this.currentPage--;
            return this._fetchPage(this.currentPage)
            .then(chunks => {
                if (chunks.length == 0) return this._decrementUncontrolled();
                else this.nextChunkIndex = chunks.length - 1;
            });
        } else {
            this.nextChunkIndex--;
            return this._fetchPage(this.currentPage);
        }
    }

    /**
     * Recenter the buffer around the provided page index
     * @param {number} index
     */
    _recenterBuffer(index) {
        const start = Math.max(0, index - this.opts.pageBufferSize);
        const end = Math.min(this.pageCount, index + this.opts.pageBufferSize + 1);
        for (let i = start; i < end; i++) {
            this._fetchPage(i);
        }

        this._removePageFromBuffer(start - 1);
        this._removePageFromBuffer(end + 1);
    }

    /**
     * @param {number} index 
     */
    _removePageFromBuffer(index) {
        delete this._bufferingPages[index];
        delete this._bufferedPages[index];
    }

    /**
     * @param {number} index
     * @return {PromiseLike<PageChunk[]>}
     */
    _fetchPage(index) {
        if (index in this._bufferingPages) return this._bufferingPages[index];
        if (index in this._bufferedPages) return Promise.resolve(this._bufferedPages[index]);

        this._bufferingPages[index] = this._fetchPageDirect(index)
        .then(chunks => {
            delete this._bufferingPages[index];
            this._bufferedPages[index] = chunks;
            return chunks;
        });

        return this._bufferingPages[index];
    }

    /**
     * Fetches a page without checking buffer
     * @param {number} index
     */
    _fetchPageDirect(index) {
        return PageChunk.fetch(this.opts.server, this.opts.bookPath, index);
    }
}

PageChunkIterator.AT_END = "__PageChunkIterator.AT_END__";

/** @type {PageChunkIteratorOptions} */
const DEFAULT_OPTS = {
    server: null,
    bookPath: null,
    pageBufferSize: 2,
};

/**
 * @typedef {Object} PageChunkIteratorOptions
 * @property {string} server
 * @property {string} bookPath
 * @property {number} [pageBufferSize] number of pages to buffer before/after the current page
 */
