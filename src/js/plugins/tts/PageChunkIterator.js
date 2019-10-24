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
        this.currentChunkIndex = 0;
        this.opts = Object.assign({}, DEFAULT_OPTS, opts);
        /** @type {Object<number, PageChunk[]>} leaf index -> chunks*/
        this._bufferedPages = {};
        /** @type {Object<number, PromiseLike<PageChunk[]>} leaf index -> chunks*/
        this._bufferingPages = {};
    }

    /**
     * @return {PromiseLike<"__PageChunkIterator.AT_END__" | PageChunk>}
     */
    next() {
        if (this.currentPage == this.pageCount) return Promise.resolve(PageChunkIterator.AT_END);

        this._recenterBuffer(this.currentPage);

        return this._fetchPage(this.currentPage)
        .then(chunks => {
            if (this.currentChunkIndex == chunks.length) {
                this.currentPage++;
                this.currentChunkIndex = 0;
                return this.next();
            }
            return chunks[this.currentChunkIndex++];
        });
    }

    prev() {
        if (this.currentChunkIndex == 0) {
            this.currentPage = Math.max(0, this.currentPage - 1);
            return this._fetchPage(this.currentPage)
            .then(chunks => {
                this.currentChunkIndex = chunks.length - 1;
                this.next();
            });
        } else {
            this.currentChunkIndex--;
            return this._fetchPage(this.currentPage)
            .then(() => this.next());
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

        this._bufferingPages[index] = PageChunk.fetch(this.opts.server, this.opts.bookPath, index)
        .then(chunks => {
            delete this._bufferingPages[index];
            this._bufferedPages[index] = chunks;
            return chunks;
        });

        return this._bufferingPages[index];
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
