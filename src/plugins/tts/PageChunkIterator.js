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
    this.opts = Object.assign({}, DEFAULT_OPTS, opts);
    /** Position in the chunk sequence */
    this._cursor = { page: start, chunk: 0 };
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
   * Get the next chunk
   * @return {PromiseLike<"__PageChunkIterator.AT_END__" | PageChunk>}
   */
  next() {
    return this._cursorLock = this._cursorLock
      .then(() => this._nextUncontrolled());
  }

  /**
   * Sends the cursor back 1
   * @return {Promise}
   **/
  decrement() {
    return this._cursorLock = this._cursorLock
      .then(() => this._decrementUncontrolled());
  }

  /**
   * Gets without ensuring synchronization. Since this iterator has a lot of async
   * code, calling e.g. "next" twice (before the first call to next has finished)
   * would cause the system to be in a weird state. To avoid that, we make sure calls
   * to next and decrement (functions that modify the cursor) are synchronized,
   * so that regardless how long it takes for one to respond, they'll always be executed
   * in the correct order.
   * @return {PromiseLike<"__PageChunkIterator.AT_END__" | PageChunk>}
   */
  async  _nextUncontrolled() {
    if (this._cursor.page == this.pageCount) {
      return Promise.resolve(PageChunkIterator.AT_END);
    }
    this._recenterBuffer(this._cursor.page);
    const chunks = await this._fetchPageChunks(this._cursor.page);
    if (this._cursor.chunk == chunks.length) {
      this._cursor.page++;
      this._cursor.chunk = 0;
      return this._nextUncontrolled();
    }
    return chunks[this._cursor.chunk++];
  }

  /**
   * Decrements without ensuring synchronization. (See {@link PageChunkIterator._nextUncontrolled});
   * @return {Promise}
   */
  _decrementUncontrolled() {
    let cursorChangePromise = Promise.resolve();

    if (this._cursor.chunk > 0) {
      this._cursor.chunk--;
    } else if (this._cursor.page > 0) {
      this._cursor.page--;
      // Go back possibly multiple pages, because pages can be blank
      cursorChangePromise = this._fetchPageChunks(this._cursor.page)
        .then(prevPageChunks => {
          if (prevPageChunks.length == 0) return this._decrementUncontrolled();
          else this._cursor.chunk = prevPageChunks.length - 1;
        });
    }

    return cursorChangePromise
      .then(() => this._fetchPageChunks(this._cursor.page));
  }

  /**
   * Recenter the buffer around the provided page index
   * @param {number} index
   */
  _recenterBuffer(index) {
    const start = Math.max(0, index - this.opts.pageBufferSize);
    const end = Math.min(this.pageCount, index + this.opts.pageBufferSize + 1);
    for (let i = start; i < end; i++) {
      this._fetchPageChunks(i);
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
   * Fetches the chunks on a page; checks the buffer, so it won't make unnecessary
   * requests if it's called multiple times for the same index.
   * @param {number} index
   * @return {Promise<PageChunk[]>}
   */
  _fetchPageChunks(index) {
    if (index in this._bufferingPages) return this._bufferingPages[index];
    if (index in this._bufferedPages) return Promise.resolve(this._bufferedPages[index]);

    this._bufferingPages[index] = this._fetchPageChunksDirect(index)
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
  _fetchPageChunksDirect(index) {
    return PageChunk.fetch(this.opts.pageChunkUrl, index);
  }
}

PageChunkIterator.AT_END = "__PageChunkIterator.AT_END__";

/** @type {PageChunkIteratorOptions} */
const DEFAULT_OPTS = {
  pageChunkUrl: null,
  pageBufferSize: 2,
};

/**
 * @typedef {Object} PageChunkIteratorOptions
 * @property {import('@/src/util/strings.js').StringWithVars} pageChunkUrl
 * @property {number} [pageBufferSize] number of pages to buffer before/after the current page
 */
