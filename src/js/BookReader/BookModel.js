import { clamp } from './utils.js';
/** @typedef {import('./options.js').PageData} PageData */

/**
 * Contains information about the Book/Document independent of the way it is
 * being rendering. Nothing here should reference e.g. the mode, zoom, etc.
 * It's just information about the book and its pages (usually as specified
 * in the BookReader data option.)
 */
export function extendWithBookModel(BookReader) {
  /**
   * Memoized
   * @return {{width: number, height: number}}
   */
  BookReader.prototype.getMedianPageSize = function() {
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
      width: widths[parseInt(widths.length / 2)],
      height: heights[parseInt(heights.length / 2)]
    };
    return this._medianPageSize;
  };

  /**
   * Returns the page width for the given index, or first or last page if out of range
   * @deprecated see getPageWidth
   */
  BookReader.prototype._getPageWidth = function(index) {
    // Synthesize a page width for pages not actually present in book.
    // May or may not be the best approach.
    // If index is out of range we return the width of first or last page
    index = clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageWidth(index);
  };

  /**
   * Returns the page height for the given index, or first or last page if out of range
   * @deprecated see getPageHeight
   */
  BookReader.prototype._getPageHeight = function(index) {
    const clampedIndex = clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageHeight(clampedIndex);
  };

  /**
   * Returns the *highest* index the given page number, or undefined
   * @param {string}
   * @return {Array|undefined}
   */
  BookReader.prototype.getPageIndex = function(pageNum) {
    const pageIndices = this.getPageIndices(pageNum);
    return pageIndices.length ? pageIndices[pageIndices.length - 1] : undefined;
  };

  /**
   * Returns an array (possibly empty) of the indices with the given page number
   * @param {string}
   * @return {Array<number>}
   */
  BookReader.prototype.getPageIndices = function(pageNum) {
    const indices = [];

    // Check for special "nXX" page number
    if (pageNum.slice(0,1) == 'n') {
      try {
        const pageIntStr = pageNum.slice(1, pageNum.length);
        const pageIndex = parseInt(pageIntStr);
        indices.push(pageIndex);
        return indices;
      } catch(err) {
        // Do nothing... will run through page names and see if one matches
      }
    }

    for (let i = 0; i<this.getNumLeafs(); i++) {
      if (this.getPageNum(i) == pageNum) {
        indices.push(i);
      }
    }

    return indices;
  };

  /**
   * Returns the name of the page as it should be displayed in the user interface
   * @param {number} index
   * @return {string}
   */
  BookReader.prototype.getPageName = function(index) {
    return 'Page ' + this.getPageNum(index);
  };

  /**
   * @return {number} the total number of leafs (like an array length)
   */
  BookReader.prototype.getNumLeafs = function() {
    // For deprecated interface support, if numLeafs is set, use that.
    if (this.numLeafs !== undefined)
      return this.numLeafs;
    return this._getDataFlattened().length;
  };

  /**
   * @param  {number} index
   * @return {Number|undefined}
   */
  BookReader.prototype.getPageWidth = function(index) {
    return this.getPageProp(index, 'width');
  };

  /**
   * @param  {number} index
   * @return {Number|undefined}
   */
  BookReader.prototype.getPageHeight = function(index) {
    return this.getPageProp(index, 'height');
  };

  /**
   * @param  {number} index
   * @param  {number} reduce - not used in default implementation
   * @param  {number} rotate - not used in default implementation
   * @return {Number|undefined}
   */
  // eslint-disable-next-line no-unused-vars
  BookReader.prototype.getPageURI = function(index, reduce, rotate) {
    return this.getPageProp(index, 'uri');
  };

  /**
   * @param  {number} index
   * @return {'L' | 'R'}
   */
  BookReader.prototype.getPageSide = function(index) {
    return this.getPageProp(index, 'pageSide') || (index % 2 === 0 ? 'R' : 'L');
  };

  /**
   * @param  {number} index
   * @return {string}
   */
  BookReader.prototype.getPageNum = function(index) {
    const pageNum = this.getPageProp(index, 'pageNum');
    return pageNum === undefined ? `n${index}` : pageNum;
  };

  /**
   * Generalized property accessor.
   * @param  {number} index
   * @return {*|undefined}
   */
  BookReader.prototype.getPageProp = function(index, propName) {
    return this._getDataProp(index, propName);
  };

  /**
   * This function returns the left and right indices for the user-visible
   * spread that contains the given index.  The return values may be
   * null if there is no facing page or the index is invalid.
   * @param  {number} pindex
   * @return {array} - eg [0, 1]
   */
  BookReader.prototype.getSpreadIndices = function(pindex) {
    if (this.pageProgression == 'rl') {
      return this.getPageSide(pindex) == 'R' ? [pindex + 1, pindex] : [pindex, pindex - 1];
    } else {
      return this.getPageSide(pindex) == 'L' ? [pindex, pindex + 1] : [pindex - 1, pindex];
    }
  };

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
   * @param  {number} index
   * @return {number}
   */
  BookReader.prototype.leafNumToIndex = function(leafNum) {
    const index = this._getDataFlattened()
      .findIndex(d => d.leafNum == leafNum);
    // If no match is found, fall back to the leafNum provide (leafNum == index)
    return index > -1 ? index : leafNum;
  };

  /**
   * Parses the pageString format
   * @param {string} pageNum
   * @return {number|undefined}
   */
  BookReader.prototype.parsePageString = function(pageNum) {
    let pageIndex;
    // Check for special "leaf"
    const re = new RegExp('^leaf(\\d+)');
    const leafMatch = re.exec(pageNum);
    if (leafMatch) {
      pageIndex = this.leafNumToIndex(parseInt(leafMatch[1], 10));
      if (pageIndex === null) {
        pageIndex = undefined; // to match return type of getPageIndex
      }
    } else {
      pageIndex = this.getPageIndex(pageNum);
    }
    return pageIndex;
  }

  /**
   * Helper. Flatten the nested structure (make 1d array),
   * and also add pageSide prop
   * @return {PageData[]}
   */
  BookReader.prototype._getDataFlattened = function() {
    if (this._getDataFlattened.cached && this._getDataFlattened.cached[1] === this.data.length)
      return this._getDataFlattened.cached[0];

    let prevPageSide = null;
    const flattend = this.data.flatMap(spread => {
      return spread.map(page => {
        if (!page.pageSide) {
          if (prevPageSide === null) {
            page.pageSide = spread.length === 2 ? 'L' : 'R';
          } else {
            page.pageSide = prevPageSide === 'L' ? 'R' : 'L';
          }
        }
        prevPageSide = page.pageSide;
        return page;
      });
    });

    // length is used as a cache breaker
    this._getDataFlattened.cached = [flattend, this.data.length];
    return flattend;
  };

  /**
   * Helper. Return a prop for a given index
   * @param {number} index
   * @param {string} prop
   * @return {array}
   */
  BookReader.prototype._getDataProp = function(index, prop) {
    const dataf = this._getDataFlattened();
    if (isNaN(index) || index < 0 || index >= dataf.length)
      return;
    if ('undefined' == typeof(dataf[index][prop]))
      return;
    return dataf[index][prop];
  };
}
