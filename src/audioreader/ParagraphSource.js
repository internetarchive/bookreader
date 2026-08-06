/** @typedef {import('../plugins/tts/PageChunk.js').default} PageChunk */

/**
 * A paragraph's position in the book. Paragraphs have no global index we can know
 * up front -- the number of paragraphs on a page is only known once that page's OCR
 * has been fetched -- so a paragraph is addressed by (leaf, chunk) and we walk.
 * @typedef {{leafIndex: number, chunkIndex: number}} ParagraphCursor
 */

/**
 * Supplies paragraphs of OCR text and knows how to walk forward and backward
 * through them, skipping pages that have no text (covers, plates, blanks).
 *
 * Page fetches are cached and de-duplicated, so the lookahead buffer walking the
 * same pages repeatedly costs one request per page.
 *
 * This is deliberately not `PageChunkIterator`: that class owns a single cursor
 * with a promise lock, which suits the linear read-aloud loop but not this
 * prototype, where the buffer needs to look several paragraphs ahead of playback
 * and the patron can seek out from under an in-flight fetch.
 */
export default class ParagraphSource {
  /**
   * @param {Object} opts
   * @param {(leafIndex: number) => Promise<PageChunk[]>} opts.fetchPageChunks
   * @param {number} opts.numLeafs
   */
  constructor({ fetchPageChunks, numLeafs }) {
    this._fetchPageChunks = fetchPageChunks;
    this.numLeafs = numLeafs;
    /** @type {Map<number, PageChunk[]>} */
    this._pages = new Map();
    /** @type {Map<number, Promise<PageChunk[]>>} */
    this._inFlight = new Map();
  }

  /**
   * Fetch (or return cached) the paragraphs of one page.
   * @param {number} leafIndex
   * @return {Promise<PageChunk[]>}
   */
  async page(leafIndex) {
    if (leafIndex < 0 || leafIndex >= this.numLeafs) return [];
    if (this._pages.has(leafIndex)) return this._pages.get(leafIndex);
    if (this._inFlight.has(leafIndex)) return this._inFlight.get(leafIndex);

    const promise = Promise.resolve()
      .then(() => this._fetchPageChunks(leafIndex))
      .then(chunks => {
        const speakable = (chunks || []).filter(c => c.text && c.text.trim());
        this._pages.set(leafIndex, speakable);
        this._inFlight.delete(leafIndex);
        return speakable;
      })
      .catch(error => {
        this._inFlight.delete(leafIndex);
        // A page that fails to load is treated as blank rather than fatal: one bad
        // page should not end the book. The caller sees it as "no paragraphs here".
        console.warn(`AudioReader: could not load text for leaf ${leafIndex}`, error);
        this._pages.set(leafIndex, []);
        return [];
      });

    this._inFlight.set(leafIndex, promise);
    return promise;
  }

  /**
   * @param {ParagraphCursor} cursor
   * @return {Promise<PageChunk|null>} null if the cursor points past the text
   */
  async at(cursor) {
    if (!cursor) return null;
    const chunks = await this.page(cursor.leafIndex);
    return chunks[cursor.chunkIndex] || null;
  }

  /**
   * The first paragraph at or after `leafIndex`. Used to resolve a TOC jump or a
   * start leaf onto real text, since the target page is often a chapter heading
   * page with little or no OCR.
   * @param {number} leafIndex
   * @return {Promise<ParagraphCursor|null>}
   */
  async firstFrom(leafIndex) {
    for (let leaf = Math.max(0, leafIndex); leaf < this.numLeafs; leaf++) {
      const chunks = await this.page(leaf);
      if (chunks.length) return { leafIndex: leaf, chunkIndex: 0 };
    }
    return null;
  }

  /**
   * @param {ParagraphCursor} cursor
   * @return {Promise<ParagraphCursor|null>} null at the end of the book
   */
  async next(cursor) {
    const chunks = await this.page(cursor.leafIndex);
    if (cursor.chunkIndex + 1 < chunks.length) {
      return { leafIndex: cursor.leafIndex, chunkIndex: cursor.chunkIndex + 1 };
    }
    return this.firstFrom(cursor.leafIndex + 1);
  }

  /**
   * @param {ParagraphCursor} cursor
   * @return {Promise<ParagraphCursor|null>} null at the start of the book
   */
  async prev(cursor) {
    if (cursor.chunkIndex > 0) {
      return { leafIndex: cursor.leafIndex, chunkIndex: cursor.chunkIndex - 1 };
    }
    for (let leaf = cursor.leafIndex - 1; leaf >= 0; leaf--) {
      const chunks = await this.page(leaf);
      if (chunks.length) return { leafIndex: leaf, chunkIndex: chunks.length - 1 };
    }
    return null;
  }

  /**
   * The cursor plus up to `count - 1` paragraphs after it. This is what the
   * lookahead buffer hydrates.
   * @param {ParagraphCursor} cursor
   * @param {number} count
   * @return {Promise<ParagraphCursor[]>} shorter than `count` near the end of the book
   */
  async window(cursor, count) {
    const cursors = [];
    let current = cursor;
    while (current && cursors.length < count) {
      cursors.push(current);
      current = await this.next(current);
    }
    return cursors;
  }
}

/**
 * Stable string key for a cursor, for use in caches and DOM ids.
 * @param {ParagraphCursor} cursor
 * @return {string}
 */
export function cursorKey(cursor) {
  return `${cursor.leafIndex}:${cursor.chunkIndex}`;
}

/**
 * @param {ParagraphCursor} a
 * @param {ParagraphCursor} b
 * @return {boolean}
 */
export function cursorsEqual(a, b) {
  return !!a && !!b && a.leafIndex === b.leafIndex && a.chunkIndex === b.chunkIndex;
}
