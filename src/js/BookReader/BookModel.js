// @ts-check
import { clamp } from './utils.js';
/** @typedef {import('./options.js').PageData} PageData */
/** @typedef {import('../BookReader.js').default} BookReader */

// URI to display when a page is not viewable.
// TODO Render configurable html for the user instead.
// FIXME Don't reference files on archive.org
const UNVIEWABLE_PAGE_URI = '/bookreader/static/preview-default.png';

/**
 * Contains information about the Book/Document independent of the way it is
 * being rendering. Nothing here should reference e.g. the mode, zoom, etc.
 * It's just information about the book and its pages (usually as specified
 * in the BookReader data option.)
 */
export class BookModel {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    this.br = br;

    /** @type {{width: number, height: number}} memoize storage */
    this._medianPageSize = null;
    /** @type {[PageData[], number]} */
    this._getDataFlattenedCached = null;
  }

  /**
   * Memoized
   * @return {{width: number, height: number}}
   */
  getMedianPageSize() {
    if (this._medianPageSize) {
      return this._medianPageSize;
    }

    // A little expensive but we just do it once
    const widths = [];
    const heights = [];
    for (let i = 0; i < this.getNumLeafs(); i++) {
      widths.push(this.getPageWidth(i));
      heights.push(this.getPageHeight(i));
    }

    widths.sort();
    heights.sort();

    this._medianPageSize = {
      width: widths[Math.floor(widths.length / 2)],
      height: heights[Math.floor(heights.length / 2)]
    };
    return this._medianPageSize;
  }

  /**
   * Returns the page width for the given index, or first or last page if out of range
   * @deprecated see getPageWidth
   * @param {PageIndex} index
   */
  _getPageWidth(index) {
    // Synthesize a page width for pages not actually present in book.
    // May or may not be the best approach.
    // If index is out of range we return the width of first or last page
    index = clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageWidth(index);
  }

  /**
   * Returns the page height for the given index, or first or last page if out of range
   * @deprecated see getPageHeight
   * @param {PageIndex} index
   */
  _getPageHeight(index) {
    const clampedIndex = clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageHeight(clampedIndex);
  }

  /**
   * Returns the *highest* index the given page number, or undefined
   * @param {PageNumString} pageNum
   * @return {PageIndex|undefined}
   */
  getPageIndex(pageNum) {
    const pageIndices = this.getPageIndices(pageNum);
    return pageIndices.length ? pageIndices[pageIndices.length - 1] : undefined;
  }

  /**
   * Returns an array (possibly empty) of the indices with the given page number
   * @param {PageNumString} pageNum
   * @return {PageIndex[]}
   */
  getPageIndices(pageNum) {
    const indices = [];

    // Check for special "nXX" page number
    if (pageNum.slice(0,1) == 'n') {
      try {
        const pageIntStr = pageNum.slice(1, pageNum.length);
        const pageIndex = parseInt(pageIntStr);
        indices.push(pageIndex);
        return indices;
      } catch (err) {
        // Do nothing... will run through page names and see if one matches
      }
    }

    for (let i = 0; i < this.getNumLeafs(); i++) {
      if (this.getPageNum(i) == pageNum) {
        indices.push(i);
      }
    }

    return indices;
  }

  /**
   * Returns the name of the page as it should be displayed in the user interface
   * @param {PageIndex} index
   * @return {string}
   */
  getPageName(index) {
    return 'Page ' + this.getPageNum(index);
  }

  /**
   * @return {number} the total number of leafs (like an array length)
   */
  getNumLeafs() {
    // For deprecated interface support, if numLeafs is set, use that.
    if (this.br.numLeafs !== undefined)
      return this.br.numLeafs;
    return this._getDataFlattened().length;
  }

  /**
   * @param  {PageIndex} index
   * @return {Number|undefined}
   */
  getPageWidth(index) {
    return this.getPageProp(index, 'width');
  }

  /**
   * @param  {PageIndex} index
   * @return {Number|undefined}
   */
  getPageHeight(index) {
    return this.getPageProp(index, 'height');
  }

  /**
   * @param  {PageIndex} index
   * @param  {number} reduce - not used in default implementation
   * @param  {number} rotate - not used in default implementation
   * @return {string|undefined}
   */
  // eslint-disable-next-line no-unused-vars
  getPageURI(index, reduce, rotate) {
    return !this.getPageProp(index, 'viewable', true) ? UNVIEWABLE_PAGE_URI : this.getPageProp(index, 'uri');
  }

  /**
   * @param {PageIndex} index
   * @return {'L' | 'R'}
   */
  getPageSide(index) {
    return this.getPageProp(index, 'pageSide') || (index % 2 === 0 ? 'R' : 'L');
  }

  /**
   * @param {PageIndex} index
   * @return {PageNumString}
   */
  getPageNum(index) {
    const pageNum = this.getPageProp(index, 'pageNum');
    return pageNum === undefined ? `n${index}` : pageNum;
  }

  /**
   * Generalized property accessor.
   * @param  {PageIndex} index
   * @param {keyof PageData} propName
   * @param {*} [fallbackValue] return if undefined
   * @return {*|undefined}
   */
  getPageProp(index, propName, fallbackValue = undefined) {
    return this._getDataProp(index, propName, fallbackValue);
  }

  /**
   * This function returns the left and right indices for the user-visible
   * spread that contains the given index.
   * @note Can return indices out of range of what's in the book.
   * @param  {PageIndex} pindex
   * @return {[PageIndex, PageIndex]} eg [0, 1]
   */
  getSpreadIndices(pindex) {
    if (this.br.pageProgression == 'rl') {
      return this.getPageSide(pindex) == 'R' ? [pindex + 1, pindex] : [pindex, pindex - 1];
    } else {
      return this.getPageSide(pindex) == 'L' ? [pindex, pindex + 1] : [pindex - 1, pindex];
    }
  }

  /**
   * Single images in the Internet Archive scandata.xml metadata are (somewhat incorrectly)
   * given a "leaf" number.  Some of these images from the scanning process should not
   * be displayed in the BookReader (for example colour calibration cards).  Since some
   * of the scanned images will not be displayed in the BookReader (those marked with
   * addToAccessFormats false in the scandata.xml) leaf numbers and BookReader page
   * indexes are generally not the same.  This function returns the BookReader page
   * index given a scanned leaf number.
   *
   * This function is used, for example, to map between search results (that use the
   * leaf numbers) and the displayed pages in the BookReader.
   * @param {LeafNum} leafNum
   * @return {PageIndex}
   */
  leafNumToIndex(leafNum) {
    const index = this._getDataFlattened()
      .findIndex(d => d.leafNum == leafNum);
    // If no match is found, fall back to the leafNum provide (leafNum == index)
    return index > -1 ? index : leafNum;
  }

  /**
   * Parses the pageString format
   * @param {PageString} pageString
   * @return {PageIndex|undefined}
   */
  parsePageString(pageString) {
    let pageIndex;
    // Check for special "leaf"
    const leafMatch = /^leaf(\d+)/.exec(pageString);
    if (leafMatch) {
      pageIndex = this.leafNumToIndex(parseInt(leafMatch[1], 10));
      if (pageIndex === null) {
        pageIndex = undefined; // to match return type of getPageIndex
      }
    } else {
      pageIndex = this.getPageIndex(pageString);
    }
    return pageIndex;
  }

  /**
   * @param {number} index use negatives to get page relative to end
   */
  getPage(index) {
    const numLeafs = this.getNumLeafs();
    if (index < 0 && index >= -numLeafs) {
      index += numLeafs;
    }
    return new PageModel(this, index);
  }

  /**
   * @param {object} [arg0]
   * @param {number} [arg0.start] inclusive
   * @param {number} [arg0.end] exclusive
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Yield only first unviewable
   * of a chunk of unviewable pages instead of each page
   */
  * pagesIterator({ start = 0, end = Infinity, combineConsecutiveUnviewables = false } = {}) {
    start = Math.max(0, start);
    end = Math.min(end, this.getNumLeafs());

    for (let i = start; i < end; i++) {
      const page = this.getPage(i);
      if (combineConsecutiveUnviewables && page.isConsecutiveUnviewable) continue;

      yield page;
    }
  }

  /**
   * Flatten the nested structure (make 1d array), and also add pageSide prop
   * @return {PageData[]}
   */
  _getDataFlattened() {
    if (this._getDataFlattenedCached && this._getDataFlattenedCached[1] === this.br.data.length)
      return this._getDataFlattenedCached[0];

    let prevPageSide = null;
    /** @type {number|null} */
    let unviewablesChunkStart  = null;
    let index = 0;
    // @ts-ignore TS doesn't know about flatMap for some reason
    const flattend = this.br.data.flatMap(spread => {
      return spread.map(page => {
        if (!page.pageSide) {
          if (prevPageSide === null) {
            page.pageSide = spread.length === 2 ? 'L' : 'R';
          } else {
            page.pageSide = prevPageSide === 'L' ? 'R' : 'L';
          }
        }
        prevPageSide = page.pageSide;

        if (page.viewable === false) {
          if (unviewablesChunkStart === null) {
            page.unviewablesStart = unviewablesChunkStart = index;
          } else {
            page.unviewablesStart = unviewablesChunkStart;
          }
        } else {
          unviewablesChunkStart = null;
        }

        index++;
        return page;
      });
    });

    // length is used as a cache breaker
    this._getDataFlattenedCached = [flattend, this.br.data.length];
    return flattend;
  }

  /**
   * Helper. Return a prop for a given index. Returns `fallbackValue` if index is invalid or
   * property not on page.
   * @param {PageIndex} index
   * @param {keyof PageData} prop
   * @param {*} fallbackValue return if property not on the record
   * @return {*}
   */
  _getDataProp(index, prop, fallbackValue = undefined) {
    const dataf = this._getDataFlattened();
    const invalidIndex = isNaN(index) || index < 0 || index >= dataf.length;
    if (invalidIndex || 'undefined' == typeof(dataf[index][prop]))
      return fallbackValue;
    return dataf[index][prop];
  }
}

/**
 * A controlled schema for page data.
 */
class PageModel {
  /**
   * @param {BookModel} book
   * @param {PageIndex} index
   */
  constructor(book, index) {
    this.book = book;
    this.index = index;
    this.width = book.getPageWidth(index);
    this.height = book.getPageHeight(index);
    this.pageSide = book.getPageSide(index);
    this.leafNum = book._getDataProp(index, 'leafNum', this.index);

    /** @type {boolean} */
    this.isViewable = book._getDataProp(index, 'viewable', true);
    /** @type {PageIndex} The first in the series of unviewable pages this is in. */
    this.unviewablesStart = book._getDataProp(index, 'unviewablesStart') || null;
    /**
     * Consecutive unviewable pages are pages in an unviewable "chunk" which are not the first
     * of that chunk.
     */
    this.isConsecutiveUnviewable = !this.isViewable && this.unviewablesStart != this.index;

    this._rawData = this.book._getDataFlattened()[this.index];
  }

  /**
   * Updates the page to no longer be unviewable. Assumes the
   * Page's URI is already set/correct.
   */
  makeViewable(newViewableState = true) {
    if (this.isViewable == newViewableState) return;

    if (newViewableState) {
      this._rawData.viewable = true;
      delete this._rawData.unviewablesStart;
      // Update any subsequent page to now point to the right "start"
      for (const page of this.book.pagesIterator({ start: this.index + 1 })) {
        if (page.isViewable) break;
        page._rawData.unviewablesStart = this.index + 1;
      }
    } else {
      this._rawData.viewable = false;
      this._rawData.unviewablesStart = (this.prev && !this.prev.isViewable) ? this.prev.unviewablesStart : this.index;
      // Update any subsequent page to now point to the right "start"
      for (const page of this.book.pagesIterator({ start: this.index + 1 })) {
        if (!page.isViewable) break;
        page._rawData.unviewablesStart = this._rawData.unviewablesStart;
      }
    }
  }

  get prev() {
    return this.findPrev();
  }

  get next() {
    return this.findNext();
  }

  /**
   * @param {number} reduce
   * @param {number} rotate
   */
  getURI(reduce, rotate) {
    return this.book.getPageURI(this.index, reduce, rotate);
  }

  /**
   * @param {object} [arg0]
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Whether to only yield the first page
   * of a series of unviewable pages instead of each page
   * @return {PageModel|void}
   */
  findNext({ combineConsecutiveUnviewables = false } = {}) {
    return this.book
      .pagesIterator({ start: this.index + 1, combineConsecutiveUnviewables })
      .next().value;
  }

  /**
   * @param {object} [arg0]
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Whether to only yield the first page
   * of a series of unviewable pages instead of each page
   * @return {PageModel|void}
   */
  findPrev({ combineConsecutiveUnviewables = false } = {}) {
    if (this.index == 0) return undefined;

    if (combineConsecutiveUnviewables) {
      if (this.isConsecutiveUnviewable) {
        return this.book.getPage(this.unviewablesStart);
      } else {
        // Recursively goes backward through the book
        // TODO make a reverse iterator to make it look identical to findNext
        const prev = new PageModel(this.book, this.index - 1);
        return prev.isViewable ? prev : prev.findPrev({ combineConsecutiveUnviewables });
      }
    } else {
      return new PageModel(this.book, this.index - 1);
    }
  }
}

// There are a few main ways we can reference a specific page in a book:
/**
 * @typedef {string} PageNumString
 * Possible values: /^n?\d+$/. Example: 'n7', '18'
 * Not necessarily unique
 */
/**
 * @typedef {number} LeafNum
 * No clue if 0 or 1 indexed or consecutive; generally from IA book info.
 */
/**
 * @typedef {string} PageString
 * Possible values: /^(leaf)?\d+$/ Example: 'leaf7', '18'
 * If leaf-prefixed, then the number is a LeafNum. Otherwise it's a PageNumString
 */
/** @typedef {number} PageIndex 0-based index of all the pages */
