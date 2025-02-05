/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/BookReader/BookModel.js":
/*!*************************************!*\
  !*** ./src/BookReader/BookModel.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BookModel: function() { return /* binding */ BookModel; },
/* harmony export */   PageModel: function() { return /* binding */ PageModel; }
/* harmony export */ });
/* harmony import */ var _options_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./options.js */ "./src/BookReader/options.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/BookReader/utils.js");
// @ts-check


/** @typedef {import('./options.js').PageData} PageData */
/** @typedef {import('../BookReader.js').default} BookReader */

/**
 * Contains information about the Book/Document independent of the way it is
 * being rendering. Nothing here should reference e.g. the mode, zoom, etc.
 * It's just information about the book and its pages (usually as specified
 * in the BookReader data option.)
 */
class BookModel {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    this.br = br;
    this.reduceSet = br.reduceSet;
    this.ppi = br.options?.ppi ?? _options_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_OPTIONS.ppi;
    /** @type {'lr' | 'rl'} Page progression */
    this.pageProgression = br.options?.pageProgression ?? _options_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_OPTIONS.pageProgression;

    /** @type {{width: number, height: number}} memoize storage */
    this._medianPageSize = null;
    /** @type {[PageData[], number]} */
    this._getDataFlattenedCached = null;
  }

  /** Get median width/height of page in inches. Memoized for performance. */
  getMedianPageSizeInches() {
    if (this._medianPageSize) {
      return this._medianPageSize;
    }
    const widths = [];
    const heights = [];
    for (const page of this.pagesIterator()) {
      widths.push(page.widthInches);
      heights.push(page.heightInches);
    }
    widths.sort((a, b) => a - b);
    heights.sort((a, b) => a - b);
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
    index = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.clamp)(index, 0, this.getNumLeafs() - 1);
    return this.getPageWidth(index);
  }

  /**
   * Returns the page height for the given index, or first or last page if out of range
   * @deprecated see getPageHeight
   * @param {PageIndex} index
   */
  _getPageHeight(index) {
    const clampedIndex = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.clamp)(index, 0, this.getNumLeafs() - 1);
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
    if (pageNum.slice(0, 1) == 'n') {
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
    if (this.br.numLeafs !== undefined) return this.br.numLeafs;
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
    if (!this.getPageProp(index, 'viewable', true)) {
      const uri = this.br.options.unviewablePageURI;
      if (uri.startsWith('.')) {
        // It's a relative path, so make it relative to the images path
        return this.br.options.imagesBaseURL + uri;
      } else {
        return uri;
      }
    } else {
      return this.getPageProp(index, 'uri');
    }
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
    if (this.pageProgression == 'rl') {
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
    const index = this._getDataFlattened().findIndex(d => d.leafNum == leafNum);
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
   * @param loop whether to loop (i.e. -1 == last page)
   */
  getPage(index, loop = true) {
    const numLeafs = this.getNumLeafs();
    if (!loop && (index < 0 || index >= numLeafs)) {
      return undefined;
    }
    if (index < 0 && index >= -numLeafs) {
      index += numLeafs;
    }
    index = index % numLeafs;
    return new PageModel(this, index);
  }

  /**
   * @param {object} [arg0]
   * @param {number} [arg0.start] inclusive
   * @param {number} [arg0.end] exclusive
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Yield only first unviewable
   * of a chunk of unviewable pages instead of each page
   */
  *pagesIterator({
    start = 0,
    end = Infinity,
    combineConsecutiveUnviewables = false
  } = {}) {
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
    if (this._getDataFlattenedCached && this._getDataFlattenedCached[1] === this.br.data.length) return this._getDataFlattenedCached[0];
    let prevPageSide = null;
    /** @type {number|null} */
    let unviewablesChunkStart = null;
    let index = 0;
    // @ts-ignore TS doesn't know about flatMap for some reason
    const flattened = this.br.data.flatMap(spread => {
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
    this._getDataFlattenedCached = [flattened, this.br.data.length];
    return flattened;
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
    if (invalidIndex || 'undefined' == typeof dataf[index][prop]) return fallbackValue;
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
    // Values less than 10 cause the UI to not work correctly
    const pagePPI = book._getDataProp(index, 'ppi', book.ppi);
    this.ppi = Math.max(pagePPI < 10 ? book.ppi : pagePPI, 10);
    this.book = book;
    this.index = index;
    this.width = book.getPageWidth(index);
    this.widthInches = this.width / this.ppi;
    this.height = book.getPageHeight(index);
    this.heightInches = this.height / this.ppi;
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
      for (const page of this.book.pagesIterator({
        start: this.index + 1
      })) {
        if (page.isViewable) break;
        page._rawData.unviewablesStart = this.index + 1;
      }
    } else {
      this._rawData.viewable = false;
      this._rawData.unviewablesStart = this.prev && !this.prev.isViewable ? this.prev.unviewablesStart : this.index;
      // Update any subsequent page to now point to the right "start"
      for (const page of this.book.pagesIterator({
        start: this.index + 1
      })) {
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

  /** @type {PageModel | null} */
  get left() {
    return this.book.pageProgression === 'lr' ? this.prev : this.next;
  }

  /** @type {PageModel | null} */
  get right() {
    return this.book.pageProgression === 'lr' ? this.next : this.prev;
  }

  /**
   * @type {{left: PageModel | null, right: PageModel | null}}
   */
  get spread() {
    return {
      left: this.pageSide === 'L' ? this : this.left,
      right: this.pageSide === 'R' ? this : this.right
    };
  }

  /**
   * @param {number} pages
   */
  goLeft(pages) {
    const newIndex = this.book.pageProgression === 'lr' ? this.index - pages : this.index + pages;
    return this.book.getPage(newIndex);
  }

  /**
   * @param {number} pages
   */
  goRight(pages) {
    const newIndex = this.book.pageProgression === 'lr' ? this.index + pages : this.index - pages;
    return this.book.getPage(newIndex);
  }

  /**
   * @param {number} reduce
   * @param {number} rotate
   */
  getURI(reduce, rotate) {
    return this.book.getPageURI(this.index, reduce, rotate);
  }

  /**
   * Returns the srcset with correct URIs or void string if out of range
   * @param {number} reduce
   * @param {number} [rotate]
   */
  getURISrcSet(reduce, rotate = 0) {
    const {
      reduceSet
    } = this.book;
    const initialReduce = reduceSet.floor(reduce);
    // We don't need to repeat the initial reduce in the srcset
    const topReduce = reduceSet.decr(initialReduce);
    const reduces = [];
    for (let r = topReduce; r >= 1; r = reduceSet.decr(r)) {
      reduces.push(r);
    }
    return reduces.map(r => `${this.getURI(r, rotate)} ${initialReduce / r}x`).join(', ');
  }

  /**
   * @param {object} [arg0]
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Whether to only yield the first page
   * of a series of unviewable pages instead of each page
   * @return {PageModel|void}
   */
  findNext({
    combineConsecutiveUnviewables = false
  } = {}) {
    return this.book.pagesIterator({
      start: this.index + 1,
      combineConsecutiveUnviewables
    }).next().value;
  }

  /**
   * @param {object} [arg0]
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Whether to only yield the first page
   * of a series of unviewable pages instead of each page
   * @return {PageModel|void}
   */
  findPrev({
    combineConsecutiveUnviewables = false
  } = {}) {
    if (this.index == 0) return undefined;
    if (combineConsecutiveUnviewables) {
      if (this.isConsecutiveUnviewable) {
        return this.book.getPage(this.unviewablesStart);
      } else {
        // Recursively goes backward through the book
        // TODO make a reverse iterator to make it look identical to findNext
        const prev = new PageModel(this.book, this.index - 1);
        return prev.isViewable ? prev : prev.findPrev({
          combineConsecutiveUnviewables
        });
      }
    } else {
      return new PageModel(this.book, this.index - 1);
    }
  }

  /**
   * @param {object} [arg0]
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Whether to only yield the first page
   * of a series of unviewable pages instead of each page
   * @return {PageModel|void}
   */
  findLeft({
    combineConsecutiveUnviewables = false
  } = {}) {
    return this.book.pageProgression === 'lr' ? this.findPrev({
      combineConsecutiveUnviewables
    }) : this.findNext({
      combineConsecutiveUnviewables
    });
  }

  /**
   * @param {object} [arg0]
   * @param {boolean} [arg0.combineConsecutiveUnviewables] Whether to only yield the first page
   * of a series of unviewable pages instead of each page
   * @return {PageModel|void}
   */
  findRight({
    combineConsecutiveUnviewables = false
  } = {}) {
    return this.book.pageProgression === 'lr' ? this.findNext({
      combineConsecutiveUnviewables
    }) : this.findPrev({
      combineConsecutiveUnviewables
    });
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

/***/ }),

/***/ "./src/BookReader/DragScrollable.js":
/*!******************************************!*\
  !*** ./src/BookReader/DragScrollable.js ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DragScrollable: function() { return /* binding */ DragScrollable; }
/* harmony export */ });
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// @ts-check
/*
 * jQuery dragscrollable Plugin
 * Based off version: 1.0 (25-Jun-2009)
 * Copyright (c) 2009 Miquel Herrera
 *
 * Portions Copyright (c) 2010 Reg Braithwaite
 *          Copyright (c) 2010 Internet Archive / Michael Ang
 *          Copyright (c) 2016 Internet Archive / Richard Caceres
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

/**
 * @param {string} string_of_events
 * @param {string} ns
 * @returns
 */
function append_namespace(string_of_events, ns) {
  return string_of_events.split(' ').map(event_name => event_name + ns).join(' ');
}
function left_top(event) {
  /** @type {number} */
  let x;
  /** @type {number} */
  let y;
  if (typeof event.clientX != 'undefined') {
    x = event.clientX;
    y = event.clientY;
  } else if (typeof event.screenX != 'undefined') {
    x = event.screenX;
    y = event.screenY;
  } else if (typeof event.targetTouches != 'undefined') {
    x = event.targetTouches[0].pageX;
    y = event.targetTouches[0].pageY;
  } else if (typeof event.originalEvent == 'undefined') {
    console.error("don't understand x and y for " + event.type, event);
  } else if (typeof event.originalEvent.clientX != 'undefined') {
    x = event.originalEvent.clientX;
    y = event.originalEvent.clientY;
  } else if (typeof event.originalEvent.screenX != 'undefined') {
    x = event.originalEvent.screenX;
    y = event.originalEvent.screenY;
  } else if (typeof event.originalEvent.targetTouches != 'undefined') {
    x = event.originalEvent.targetTouches[0].pageX;
    y = event.originalEvent.targetTouches[0].pageY;
  }
  return {
    left: x,
    top: y
  };
}
const DEFAULT_OPTIONS = {
  /**
   * @type {String|HTMLElement} jQuery selector to apply to each wrapped element to
   * find which will be the dragging elements. Defaults to the first child of scrollable
   * element
   */
  dragSelector: '>:first',
  /** Will the dragging element accept propagated events? default is yes, a propagated
   * mouse event on a inner element will be accepted and processed. If set to false,
   * only events originated on the draggable elements will be processed. */
  acceptPropagatedEvent: true,
  /**
   * Prevents the event to propagate further effectively disabling other default actions
   */
  preventDefault: true,
  dragstart: 'mousedown touchstart',
  dragcontinue: 'mousemove touchmove',
  dragend: 'mouseup touchend',
  // mouseleave
  dragMinDistance: 5,
  namespace: '.ds',
  /** Scroll the window rather than the element */
  scrollWindow: false
};

/**
 * Adds the ability to manage elements scroll by dragging
 * one or more of its descendant elements. Options parameter
 * allow to specifically select which inner elements will
 * respond to the drag events.
 *  usage examples:
 *
 *  To add the scroll by drag to the element id=viewport when dragging its
 *  first child accepting any propagated events
 *	`new DragScrollable($('#viewport')[0]);`
 *
 *  To add the scroll by drag ability to any element div of class viewport
 *  when dragging its first descendant of class dragMe responding only to
 *  evcents originated on the '.dragMe' elements.
 *	```js
 *  new DragScrollable($('div.viewport')[0], {
 *      dragSelector: '.dragMe:first',
 *	    acceptPropagatedEvent: false
 *  });
 * ```
 *
 *  Notice that some 'viewports' could be nested within others but events
 *  would not interfere as acceptPropagatedEvent is set to false.
 */
class DragScrollable {
  /**
   * @param {HTMLElement} element
   * @param {Partial<DEFAULT_OPTIONS>} options
   */
  constructor(element, options = {}) {
    /** @param {MouseEvent} event */
    _defineProperty(this, "_dragStartHandler", event => {
      if (this._shouldAbort()) {
        return true;
      }

      // mousedown, left click, check propagation
      if (event.which > 1 || !this.settings.acceptPropagatedEvent && event.target != this.handling_element[0]) {
        return false;
      }

      // Initial coordinates will be the last when dragging
      this.lastCoord = this.firstCoord = left_top(event);
      this.handling_element.on(this.settings.dragcontinue, this._dragContinueHandler)
      //.on(this.settings.dragend, this._dragEndHandler)
      ;

      // Note, we bind using addEventListener so we can use "capture" binding
      // instead of "bubble" binding
      this.settings.dragend.split(' ').forEach(event_name => {
        this.handling_element[0].addEventListener(event_name, this._dragEndHandler, true);
      });
      if (this.settings.preventDefault) {
        event.preventDefault();
        return false;
      }
    });
    /** @param {MouseEvent} event */
    _defineProperty(this, "_dragContinueHandler", event => {
      // User is dragging
      // console.log('drag continue');
      if (this._shouldAbort()) {
        return true;
      }
      const lt = left_top(event);

      // How much did the mouse move?
      const delta = {
        left: lt.left - this.lastCoord.left,
        top: lt.top - this.lastCoord.top
      };
      const scrollTarget = this.settings.scrollWindow ? $(window) : this.handling_element;

      // Set the scroll position relative to what ever the scroll is now
      scrollTarget.scrollLeft(scrollTarget.scrollLeft() - delta.left);
      scrollTarget.scrollTop(scrollTarget.scrollTop() - delta.top);

      // Save where the cursor is
      this.lastCoord = lt;
      if (this.settings.preventDefault) {
        event.preventDefault();
        return false;
      }
    });
    /** @param {MouseEvent} event */
    _defineProperty(this, "_dragEndHandler", event => {
      // Stop scrolling
      //console.log('dragEndHandler');

      if (this._shouldAbort()) {
        return true;
      }
      this.handling_element.off(this.settings.dragcontinue)
      // Note, for some reason, even though I removeEventListener below,
      // this call to unbind is still necessary. I don't know why.
      .off(this.settings.dragend);

      // Note, we bind using addEventListener so we can use "capture" binding
      // instead of "bubble" binding
      this.settings.dragend.split(' ').forEach(event_name => {
        this.handling_element[0].removeEventListener(event_name, this._dragEndHandler, true);
      });

      // How much did the mouse move total?
      const delta = {
        left: Math.abs(this.lastCoord.left - this.firstCoord.left),
        top: Math.abs(this.lastCoord.top - this.firstCoord.top)
      };
      const distance = Math.max(delta.left, delta.top);

      // Allow event to propagate if min distance was not achieved
      if (this.settings.preventDefault && distance > this.settings.dragMinDistance) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        return false;
      }
    });
    this.handling_element = $(element);
    /** @type {typeof DEFAULT_OPTIONS} */
    this.settings = $.extend({}, DEFAULT_OPTIONS, options || {});
    this.firstCoord = {
      left: 0,
      top: 0
    };
    this.lastCoord = {
      left: 0,
      top: 0
    };
    this.settings.dragstart = append_namespace(this.settings.dragstart, this.settings.namespace);
    this.settings.dragcontinue = append_namespace(this.settings.dragcontinue, this.settings.namespace);
    //settings.dragend = append_namespace(settings.dragend, settings.namespace);

    // Set mouse initiating event on the desired descendant
    this.handling_element.find(this.settings.dragSelector).on(this.settings.dragstart, this._dragStartHandler);
  }
  _shouldAbort() {
    const isTouchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);
    return isTouchDevice;
  }
}

/***/ }),

/***/ "./src/BookReader/ImageCache.js":
/*!**************************************!*\
  !*** ./src/BookReader/ImageCache.js ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ImageCache: function() { return /* binding */ ImageCache; }
/* harmony export */ });
/* harmony import */ var _ReduceSet__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ReduceSet */ "./src/BookReader/ReduceSet.js");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
// @ts-check
/**
 * Creates an image cache dictionary
 * storing images in `<img>` tags so that
 * BookReader can leverage browser caching
 */
/** @typedef {import("./BookModel").BookModel} BookModel */
/** @typedef {import("./BookModel").PageIndex} PageIndex */
/** @typedef {import("./ReduceSet").ReduceSet} ReduceSet */


class ImageCache {
  /**
   * @param {BookModel} book
   * @param {object} opts
   * @param {boolean} [opts.useSrcSet]
   * @param {ReduceSet} [opts.reduceSet]
   */
  constructor(book, {
    useSrcSet = false,
    reduceSet = _ReduceSet__WEBPACK_IMPORTED_MODULE_0__.Pow2ReduceSet
  } = {}) {
    this.book = book;
    this.useSrcSet = useSrcSet;
    this.reduceSet = reduceSet;
    /** @type {{ [index: number]: { reduce: number, loaded: boolean }[] }} */
    this.cache = {};
    this.defaultScale = 8;
  }

  /**
   * Get an image
   * Checks cache first if image is available & of equal/better scale,
   * if not, a new image gets created
   *
   * @param {PageIndex} index
   * @param {Number} reduce
   */
  image(index, reduce) {
    const cachedImages = this.cache[index] || [];
    const sufficientImages = cachedImages.filter(x => x.loaded && x.reduce <= reduce);
    if (sufficientImages.length) {
      // Choose the largest reduction factor that meets our needs
      const bestReduce = Math.max(...sufficientImages.map(e => e.reduce));
      return this._serveImageElement(index, bestReduce);
    } else {
      // Don't use a cache entry; i.e. a fresh fetch will be made
      // for this reduce
      return this._serveImageElement(index, reduce);
    }
  }

  /**
   * Checks if an image of equal or greater quality has been loaded
   * @param {PageIndex} index
   * @param {Number} reduce
   * @returns {Boolean}
   */
  imageLoaded(index, reduce) {
    const cacheImg = this.cache[index]?.find(e => e.reduce <= reduce);
    return cacheImg?.loaded ?? false;
  }

  /**
   * Get the best image that's already loaded for the given index,
   * trying to choose values less that the given reduce
   * @param {PageIndex} index
   * @param idealMaxReduce
   * @returns {null | number}
   */
  getBestLoadedReduce(index, idealMaxReduce = Infinity) {
    const candidates = this.cache[index]?.filter(x => x.loaded) || [];
    if (!candidates.length) return null;
    const lowerResImages = candidates.filter(e => e.reduce >= idealMaxReduce);
    if (lowerResImages.length) {
      // Choose the highest quality loaded lower res image
      return Math.min(...lowerResImages.map(e => e.reduce));
    }
    // Otherwise choose whatever is closest to the reduce
    const higherRestImages = candidates.filter(e => e.reduce < idealMaxReduce);
    return Math.max(...higherRestImages.map(e => e.reduce));
  }

  /**
   * @private
   * Generates an image element on the fly from image info in cache
   *
   * @param {PageIndex} index
   * @param {number} reduce
   * @returns {JQuery<HTMLImageElement>} with base image classes
   */
  _serveImageElement(index, reduce) {
    const validReduce = this.reduceSet.floor(reduce);
    let cacheEntry = this.cache[index]?.find(e => e.reduce == validReduce);
    if (!cacheEntry) {
      cacheEntry = {
        reduce: validReduce,
        loaded: false
      };
      const entries = this.cache[index] || (this.cache[index] = []);
      entries.push(cacheEntry);
    }
    const page = this.book.getPage(index);
    const $img = $('<img />', {
      'class': 'BRpageimage',
      'alt': 'Book page image',
      src: page.getURI(validReduce, 0)
    }).data('reduce', validReduce);
    if (this.useSrcSet) {
      $img.attr('srcset', page.getURISrcSet(validReduce));
    }
    if (!cacheEntry.loaded) {
      $img.one('load', () => cacheEntry.loaded = true);
    }
    return $img;
  }
}

/***/ }),

/***/ "./src/BookReader/Mode1Up.js":
/*!***********************************!*\
  !*** ./src/BookReader/Mode1Up.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Mode1Up: function() { return /* binding */ Mode1Up; }
/* harmony export */ });
/* harmony import */ var _Mode1UpLit_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Mode1UpLit.js */ "./src/BookReader/Mode1UpLit.js");
/* harmony import */ var _DragScrollable_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DragScrollable.js */ "./src/BookReader/DragScrollable.js");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
// @ts-check


/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

class Mode1Up {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;
    this.mode1UpLit = new _Mode1UpLit_js__WEBPACK_IMPORTED_MODULE_0__.Mode1UpLit(bookModel, br);

    /** @private */
    this.$el = $(this.mode1UpLit)
    // We CANNOT use `br-mode-1up` as a class, because it's the same
    // as the name of the web component, and the webcomponents polyfill
    // uses the name of component as a class for style scoping 😒
    .addClass('br-mode-1up__root BRmode1up');

    /** Has mode1up ever been rendered before? */
    this.everShown = false;
  }

  // TODO: Might not need this anymore? Might want to delete.
  /** @private */
  get $brContainer() {
    return this.br.refs.$brContainer;
  }

  /**
   * This is called when we switch to one page view
   */
  prepare() {
    const startLeaf = this.br.currentIndex();
    this.$brContainer.empty().css({
      overflow: 'hidden'
    }).append(this.$el);

    // Need this in a setTimeout so that it happens after the browser has _actually_
    // appended the element to the DOM
    setTimeout(async () => {
      if (!this.everShown) {
        this.mode1UpLit.initFirstRender(startLeaf);
        this.everShown = true;
        this.mode1UpLit.requestUpdate();
        await this.mode1UpLit.updateComplete;
        new _DragScrollable_js__WEBPACK_IMPORTED_MODULE_1__.DragScrollable(this.mode1UpLit, {
          preventDefault: true,
          dragSelector: '.br-mode-1up__visible-world',
          // Only handle mouse events; let browser/interact.js handle touch
          dragstart: 'mousedown',
          dragcontinue: 'mousemove',
          dragend: 'mouseup'
        });
      }
      this.mode1UpLit.jumpToIndex(startLeaf);
      setTimeout(() => {
        // Must explicitly call updateVisibleRegion, since no
        // scroll event seems to fire.
        this.mode1UpLit.updateVisibleRegion();
      });
    });
    this.br.updateBrClasses();
  }

  /**
   * BREAKING CHANGE: No longer supports pageX/pageY
   * @param {PageIndex} index
   * @param {number} [pageX] x position on the page (in pixels) to center on
   * @param {number} [pageY] y position on the page (in pixels) to center on
   * @param {boolean} [noAnimate]
   */
  jumpToIndex(index, pageX, pageY, noAnimate) {
    // Only smooth for small distances
    const distance = Math.abs(this.br.currentIndex() - index);
    const smooth = !noAnimate && distance > 0 && distance <= 4;
    this.mode1UpLit.jumpToIndex(index, {
      smooth
    });
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    switch (direction) {
      case 'in':
        this.mode1UpLit.zoomIn();
        break;
      case 'out':
        this.mode1UpLit.zoomOut();
        break;
      default:
        console.error(`Unsupported direction: ${direction}`);
    }
  }

  /**
   * Resize the current one page view
   * Note this calls drawLeafs
   */
  resizePageView() {
    this.mode1UpLit.htmlDimensionsCacher.updateClientSizes();
    this.mode1UpLit.requestUpdate();
  }
}

/***/ }),

/***/ "./src/BookReader/Mode1UpLit.js":
/*!**************************************!*\
  !*** ./src/BookReader/Mode1UpLit.js ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Mode1UpLit: function() { return /* binding */ Mode1UpLit; }
/* harmony export */ });
/* harmony import */ var lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lit/decorators.js */ "./node_modules/lit/decorators.js");
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lit */ "./node_modules/lit/index.js");
/* harmony import */ var lit_directives_style_map_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lit/directives/style-map.js */ "./node_modules/lit/directives/style-map.js");
/* harmony import */ var _ModeSmoothZoom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ModeSmoothZoom */ "./src/BookReader/ModeSmoothZoom.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils */ "./src/BookReader/utils.js");
/* harmony import */ var _utils_HTMLDimensionsCacher__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/HTMLDimensionsCacher */ "./src/BookReader/utils/HTMLDimensionsCacher.js");
/* harmony import */ var _utils_ScrollClassAdder__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utils/ScrollClassAdder */ "./src/BookReader/utils/ScrollClassAdder.js");
/* harmony import */ var _ModeCoordinateSpace__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./ModeCoordinateSpace */ "./src/BookReader/ModeCoordinateSpace.js");
function _decorate(e, r, t, i) { var o = _getDecoratorsApi(); if (i) for (var n = 0; n < i.length; n++) o = i[n](o); var s = r(function (e) { o.initializeInstanceElements(e, a.elements); }, t), a = o.decorateClass(_coalesceClassElements(s.d.map(_createElementDescriptor)), e); return o.initializeClassElements(s.F, a.elements), o.runClassFinishers(s.F, a.finishers); }
function _getDecoratorsApi() { _getDecoratorsApi = function () { return e; }; var e = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: function (e, r) { ["method", "field"].forEach(function (t) { r.forEach(function (r) { r.kind === t && "own" === r.placement && this.defineClassElement(e, r); }, this); }, this); }, initializeClassElements: function (e, r) { var t = e.prototype; ["method", "field"].forEach(function (i) { r.forEach(function (r) { var o = r.placement; if (r.kind === i && ("static" === o || "prototype" === o)) { var n = "static" === o ? e : t; this.defineClassElement(n, r); } }, this); }, this); }, defineClassElement: function (e, r) { var t = r.descriptor; if ("field" === r.kind) { var i = r.initializer; t = { enumerable: t.enumerable, writable: t.writable, configurable: t.configurable, value: void 0 === i ? void 0 : i.call(e) }; } Object.defineProperty(e, r.key, t); }, decorateClass: function (e, r) { var t = [], i = [], o = { static: [], prototype: [], own: [] }; if (e.forEach(function (e) { this.addElementPlacement(e, o); }, this), e.forEach(function (e) { if (!_hasDecorators(e)) return t.push(e); var r = this.decorateElement(e, o); t.push(r.element), t.push.apply(t, r.extras), i.push.apply(i, r.finishers); }, this), !r) return { elements: t, finishers: i }; var n = this.decorateConstructor(t, r); return i.push.apply(i, n.finishers), n.finishers = i, n; }, addElementPlacement: function (e, r, t) { var i = r[e.placement]; if (!t && -1 !== i.indexOf(e.key)) throw new TypeError("Duplicated element (" + e.key + ")"); i.push(e.key); }, decorateElement: function (e, r) { for (var t = [], i = [], o = e.decorators, n = o.length - 1; n >= 0; n--) { var s = r[e.placement]; s.splice(s.indexOf(e.key), 1); var a = this.fromElementDescriptor(e), l = this.toElementFinisherExtras((0, o[n])(a) || a); e = l.element, this.addElementPlacement(e, r), l.finisher && i.push(l.finisher); var c = l.extras; if (c) { for (var p = 0; p < c.length; p++) this.addElementPlacement(c[p], r); t.push.apply(t, c); } } return { element: e, finishers: i, extras: t }; }, decorateConstructor: function (e, r) { for (var t = [], i = r.length - 1; i >= 0; i--) { var o = this.fromClassDescriptor(e), n = this.toClassDescriptor((0, r[i])(o) || o); if (void 0 !== n.finisher && t.push(n.finisher), void 0 !== n.elements) { e = n.elements; for (var s = 0; s < e.length - 1; s++) for (var a = s + 1; a < e.length; a++) if (e[s].key === e[a].key && e[s].placement === e[a].placement) throw new TypeError("Duplicated element (" + e[s].key + ")"); } } return { elements: e, finishers: t }; }, fromElementDescriptor: function (e) { var r = { kind: e.kind, key: e.key, placement: e.placement, descriptor: e.descriptor }; return Object.defineProperty(r, Symbol.toStringTag, { value: "Descriptor", configurable: !0 }), "field" === e.kind && (r.initializer = e.initializer), r; }, toElementDescriptors: function (e) { if (void 0 !== e) return _toArray(e).map(function (e) { var r = this.toElementDescriptor(e); return this.disallowProperty(e, "finisher", "An element descriptor"), this.disallowProperty(e, "extras", "An element descriptor"), r; }, this); }, toElementDescriptor: function (e) { var r = e.kind + ""; if ("method" !== r && "field" !== r) throw new TypeError('An element descriptor\'s .kind property must be either "method" or "field", but a decorator created an element descriptor with .kind "' + r + '"'); var t = _toPropertyKey(e.key), i = e.placement + ""; if ("static" !== i && "prototype" !== i && "own" !== i) throw new TypeError('An element descriptor\'s .placement property must be one of "static", "prototype" or "own", but a decorator created an element descriptor with .placement "' + i + '"'); var o = e.descriptor; this.disallowProperty(e, "elements", "An element descriptor"); var n = { kind: r, key: t, placement: i, descriptor: Object.assign({}, o) }; return "field" !== r ? this.disallowProperty(e, "initializer", "A method descriptor") : (this.disallowProperty(o, "get", "The property descriptor of a field descriptor"), this.disallowProperty(o, "set", "The property descriptor of a field descriptor"), this.disallowProperty(o, "value", "The property descriptor of a field descriptor"), n.initializer = e.initializer), n; }, toElementFinisherExtras: function (e) { return { element: this.toElementDescriptor(e), finisher: _optionalCallableProperty(e, "finisher"), extras: this.toElementDescriptors(e.extras) }; }, fromClassDescriptor: function (e) { var r = { kind: "class", elements: e.map(this.fromElementDescriptor, this) }; return Object.defineProperty(r, Symbol.toStringTag, { value: "Descriptor", configurable: !0 }), r; }, toClassDescriptor: function (e) { var r = e.kind + ""; if ("class" !== r) throw new TypeError('A class descriptor\'s .kind property must be "class", but a decorator created a class descriptor with .kind "' + r + '"'); this.disallowProperty(e, "key", "A class descriptor"), this.disallowProperty(e, "placement", "A class descriptor"), this.disallowProperty(e, "descriptor", "A class descriptor"), this.disallowProperty(e, "initializer", "A class descriptor"), this.disallowProperty(e, "extras", "A class descriptor"); var t = _optionalCallableProperty(e, "finisher"); return { elements: this.toElementDescriptors(e.elements), finisher: t }; }, runClassFinishers: function (e, r) { for (var t = 0; t < r.length; t++) { var i = (0, r[t])(e); if (void 0 !== i) { if ("function" != typeof i) throw new TypeError("Finishers must return a constructor."); e = i; } } return e; }, disallowProperty: function (e, r, t) { if (void 0 !== e[r]) throw new TypeError(t + " can't have a ." + r + " property."); } }; return e; }
function _createElementDescriptor(e) { var r, t = _toPropertyKey(e.key); "method" === e.kind ? r = { value: e.value, writable: !0, configurable: !0, enumerable: !1 } : "get" === e.kind ? r = { get: e.value, configurable: !0, enumerable: !1 } : "set" === e.kind ? r = { set: e.value, configurable: !0, enumerable: !1 } : "field" === e.kind && (r = { configurable: !0, writable: !0, enumerable: !0 }); var i = { kind: "field" === e.kind ? "field" : "method", key: t, placement: e.static ? "static" : "field" === e.kind ? "own" : "prototype", descriptor: r }; return e.decorators && (i.decorators = e.decorators), "field" === e.kind && (i.initializer = e.value), i; }
function _coalesceGetterSetter(e, r) { void 0 !== e.descriptor.get ? r.descriptor.get = e.descriptor.get : r.descriptor.set = e.descriptor.set; }
function _coalesceClassElements(e) { for (var r = [], isSameElement = function (e) { return "method" === e.kind && e.key === o.key && e.placement === o.placement; }, t = 0; t < e.length; t++) { var i, o = e[t]; if ("method" === o.kind && (i = r.find(isSameElement))) { if (_isDataDescriptor(o.descriptor) || _isDataDescriptor(i.descriptor)) { if (_hasDecorators(o) || _hasDecorators(i)) throw new ReferenceError("Duplicated methods (" + o.key + ") can't be decorated."); i.descriptor = o.descriptor; } else { if (_hasDecorators(o)) { if (_hasDecorators(i)) throw new ReferenceError("Decorators can't be placed on different accessors with for the same property (" + o.key + ")."); i.decorators = o.decorators; } _coalesceGetterSetter(o, i); } } else r.push(o); } return r; }
function _hasDecorators(e) { return e.decorators && e.decorators.length; }
function _isDataDescriptor(e) { return void 0 !== e && !(void 0 === e.value && void 0 === e.writable); }
function _optionalCallableProperty(e, r) { var t = e[r]; if (void 0 !== t && "function" != typeof t) throw new TypeError("Expected '" + r + "' to be a function"); return t; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toArray(r) { return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _superPropGet(t, e, o, r) { var p = _get(_getPrototypeOf(1 & r ? t.prototype : t), e, o); return 2 & r && "function" == typeof p ? function (t) { return p.apply(o, t); } : p; }
function _get() { return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) { var p = _superPropBase(e, t); if (p) { var n = Object.getOwnPropertyDescriptor(p, t); return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value; } }, _get.apply(null, arguments); }
function _superPropBase(t, o) { for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t));); return t; }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
// @ts-check








/** @typedef {import('./BookModel').BookModel} BookModel */
/** @typedef {import('./BookModel').PageIndex} PageIndex */
/** @typedef {import('./BookModel').PageModel} PageModel */
/** @typedef {import('./ModeSmoothZoom').SmoothZoomable} SmoothZoomable */
/** @typedef {import('./PageContainer').PageContainer} PageContainer */
/** @typedef {import('../BookReader').default} BookReader */

// I _have_ to make this globally public, otherwise it won't let me call
// it's constructor :/
/** @implements {SmoothZoomable} */
let Mode1UpLit = _decorate([(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.customElement)('br-mode-1up')], function (_initialize, _LitElement) {
  class Mode1UpLit extends _LitElement {
    /****************************************/
    /************** PROPERTIES **************/
    /****************************************/

    /** @type {BookReader} */

    /************** BOOK-RELATED PROPERTIES **************/

    /** @type {BookModel} */

    /** @type {PageModel[]} */

    /** @type {Record<PageIndex, number>} in world coordinates (inches) */

    /************** SCALE-RELATED PROPERTIES **************/

    /** @type {ModeCoordinateSpace} Manage conversion between coordinates */

    /************** VIRTUAL-SCROLLING PROPERTIES **************/

    /** in world coordinates (inches) */

    /** @type {PageModel[]} */

    /** @type {PageModel[]} */

    /** @type {Record<PageIndex, PageContainer>} position in inches */

    /************** WORLD-RELATED PROPERTIES **************/
    /**
     * The world is an imaginary giant document that contains all the pages.
     * The "world"'s size is used to determine how long the scroll bar should
     * be, for example.
     */

    /** @type {HTMLElement} */

    /** @type {HTMLElement} */

    /** @type {HTMLElement} */

    /************** DOM-RELATED PROPERTIES **************/

    /** @type {HTMLDimensionsCacher} Cache things like clientWidth to reduce repaints */

    /************** CONSTANT PROPERTIES **************/

    /** Vertical space between/around the pages in inches */

    /** How much to zoom when zoom button pressed */

    /****************************************/
    /************** PUBLIC API **************/
    /****************************************/

    /************** MAIN PUBLIC METHODS **************/

    /**
     * @param {PageIndex} index
     */

    /********************************************/
    /************** INTERNAL STUFF **************/
    /********************************************/

    /************** LIFE CYCLE **************/

    /**
     * @param {BookModel} book
     * @param {BookReader} br
     */
    constructor(book, br) {
      super();
      _initialize(this);
      this.book = book;

      /** @type {BookReader} */
      this.br = br;
    }

    /** @override */

    /**
     * @param {PageIndex} startIndex
     */

    /** @override */

    /** @override */

    /** @override */

    /************** LIT CONFIGS **************/

    /** @override */

    /************** RENDERING **************/

    /** @override */

    /** @param {PageModel} page */

    /** @param {PageModel} page */

    /************** VIRTUAL SCROLLING LOGIC **************/

    /**
     * @returns {PageModel[]}
     */

    /**
     * @param {PageModel[]} pages
     * @param {number} spacing
     */

    /**
     * @param {PageModel} page
     * @returns {number}
     */

    /************** INPUT HANDLERS **************/
  }
  return {
    F: Mode1UpLit,
    d: [{
      kind: "field",
      key: "br",
      value: void 0
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Object
      })],
      key: "book",
      value: void 0
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Array
      })],
      key: "pages",
      value() {
        return [];
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Object
      })],
      key: "pageTops",
      value() {
        return {};
      }
    }, {
      kind: "field",
      key: "coordSpace",
      value() {
        return new _ModeCoordinateSpace__WEBPACK_IMPORTED_MODULE_7__.ModeCoordinateSpace(this);
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Number
      })],
      key: "scale",
      value() {
        return 1;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Object
      })],
      key: "visibleRegion",
      value() {
        return {
          top: 0,
          left: 0,
          width: 100,
          height: 100
        };
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Array,
        hasChanged: _utils__WEBPACK_IMPORTED_MODULE_4__.arrChanged
      })],
      key: "visiblePages",
      value() {
        return [];
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Array
      })],
      key: "renderedPages",
      value() {
        return [];
      }
    }, {
      kind: "field",
      key: "pageContainerCache",
      value() {
        return {};
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.query)('.br-mode-1up__world')],
      key: "$world",
      value: void 0
    }, {
      kind: "field",
      key: "worldDimensions",
      value() {
        return {
          width: 100,
          height: 100
        };
      }
    }, {
      kind: "get",
      key: "worldStyle",
      value: function () {
        const wToR = this.coordSpace.worldUnitsToRenderedPixels;
        return {
          width: wToR(this.worldDimensions.width) + "px",
          height: wToR(this.worldDimensions.height) + "px"
        };
      }
    }, {
      kind: "get",
      key: "$container",
      value: function () {
        return this;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.query)('.br-mode-1up__visible-world')],
      key: "$visibleWorld",
      value: void 0
    }, {
      kind: "field",
      key: "htmlDimensionsCacher",
      value() {
        return new _utils_HTMLDimensionsCacher__WEBPACK_IMPORTED_MODULE_5__.HTMLDimensionsCacher(this);
      }
    }, {
      kind: "field",
      key: "smoothZoomer",
      value() {
        return new _ModeSmoothZoom__WEBPACK_IMPORTED_MODULE_3__.ModeSmoothZoom(this);
      }
    }, {
      kind: "field",
      key: "scrollClassAdder",
      value() {
        return new _utils_ScrollClassAdder__WEBPACK_IMPORTED_MODULE_6__.ScrollClassAdder(this, 'BRscrolling-active');
      }
    }, {
      kind: "field",
      key: "SPACING_IN",
      value() {
        return 0.2;
      }
    }, {
      kind: "field",
      key: "ZOOM_FACTOR",
      value() {
        return 1.1;
      }
    }, {
      kind: "method",
      key: "jumpToIndex",
      value: function jumpToIndex(index, {
        smooth = false
      } = {}) {
        if (smooth) {
          this.style.scrollBehavior = 'smooth';
        }
        this.scrollTop = this.coordSpace.worldUnitsToVisiblePixels(this.pageTops[index] - this.SPACING_IN / 2);
        // TODO: Also h center?
        if (smooth) {
          setTimeout(() => this.style.scrollBehavior = '', 100);
        }
      }
    }, {
      kind: "method",
      key: "zoomIn",
      value: function zoomIn() {
        this.scale *= this.ZOOM_FACTOR;
      }
    }, {
      kind: "method",
      key: "zoomOut",
      value: function zoomOut() {
        this.scale *= 1 / this.ZOOM_FACTOR;
      }
    }, {
      kind: "method",
      key: "firstUpdated",
      value: function firstUpdated(changedProps) {
        _superPropGet(Mode1UpLit, "firstUpdated", this, 3)([changedProps]);
        this.htmlDimensionsCacher.updateClientSizes();
        this.smoothZoomer.attach();
      }
    }, {
      kind: "method",
      key: "initFirstRender",
      value: function initFirstRender(startIndex) {
        const page = this.book.getPage(startIndex);
        this.scale = this.computeDefaultScale(page);
      }
    }, {
      kind: "method",
      key: "updated",
      value: function updated(changedProps) {
        // this.X is the new value
        // changedProps.get('X') is the old value
        if (changedProps.has('book')) {
          this.updatePages();
        }
        if (changedProps.has('pages')) {
          this.worldDimensions = this.computeWorldDimensions();
          this.pageTops = this.computePageTops(this.pages, this.SPACING_IN);
        }
        if (changedProps.has('visibleRegion')) {
          this.visiblePages = this.computeVisiblePages();
        }
        if (changedProps.has('visiblePages')) {
          this.throttledUpdateRenderedPages();
          if (this.visiblePages.length) {
            // unclear why this is ever really happening
            this.br.displayedIndices = this.visiblePages.map(p => p.index);
            this.br.updateFirstIndex(this.br.displayedIndices[0]);
            this.br._components.navbar.updateNavIndexThrottled();
          }
        }
        if (changedProps.has('scale')) {
          const oldVal = changedProps.get('scale');
          // Need to set this scale to actually scale the pages
          this.$visibleWorld.style.transform = `scale(${this.scale})`;
          this.smoothZoomer.updateViewportOnZoom(this.scale, oldVal);
          this.updateVisibleRegion();
          // Need to set this scale to update the world size, so the scrollbar gets the correct size
          this.$world.style.transform = `scale(${this.scale})`;
        }
      }
    }, {
      kind: "method",
      key: "updatePages",
      value: function updatePages() {
        this.pages = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.genToArray)(this.book.pagesIterator({
          combineConsecutiveUnviewables: true
        }));
      }
    }, {
      kind: "method",
      key: "connectedCallback",
      value: function connectedCallback() {
        _superPropGet(Mode1UpLit, "connectedCallback", this, 3)([]);
        this.htmlDimensionsCacher.attachResizeListener();
        this.attachScrollListeners();
        this.smoothZoomer.attach();
      }
    }, {
      kind: "method",
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        this.htmlDimensionsCacher.detachResizeListener();
        this.detachScrollListeners();
        this.smoothZoomer.detach();
        _superPropGet(Mode1UpLit, "disconnectedCallback", this, 3)([]);
      }
    }, {
      kind: "method",
      key: "createRenderRoot",
      value: function createRenderRoot() {
        // Disable shadow DOM; that would require a huge rejiggering of CSS
        return this;
      }
    }, {
      kind: "method",
      key: "render",
      value: function render() {
        return (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)`
      <div class="br-mode-1up__world" style=${(0,lit_directives_style_map_js__WEBPACK_IMPORTED_MODULE_2__.styleMap)(this.worldStyle)}></div>
      <div class="br-mode-1up__visible-world">
        ${this.renderedPages.map(p => this.renderPage(p))}
      </div>`;
      }
    }, {
      kind: "field",
      key: "createPageContainer",
      value() {
        return page => {
          return this.pageContainerCache[page.index] || (this.pageContainerCache[page.index] =
          // @ts-ignore I know it's protected, TS! But Mode1Up and BookReader are friends.
          this.br._createPageContainer(page.index));
        };
      }
    }, {
      kind: "field",
      key: "renderPage",
      value() {
        return page => {
          const wToR = this.coordSpace.worldUnitsToRenderedPixels;
          const wToV = this.coordSpace.worldUnitsToVisiblePixels;
          const containerWidth = this.coordSpace.visiblePixelsToWorldUnits(this.htmlDimensionsCacher.clientWidth);
          const width = wToR(page.widthInches);
          const height = wToR(page.heightInches);
          const left = Math.max(this.SPACING_IN, (containerWidth - page.widthInches) / 2);
          const top = this.pageTops[page.index];
          const transform = `translate(${wToR(left)}px, ${wToR(top)}px)`;
          const pageContainerEl = this.createPageContainer(page).update({
            dimensions: {
              width,
              height,
              top: 0,
              left: 0
            },
            reduce: page.width / wToV(page.widthInches)
          }).$container[0];
          pageContainerEl.style.transform = transform;
          pageContainerEl.classList.toggle('BRpage-visible', this.visiblePages.includes(page));
          return pageContainerEl;
        };
      }
    }, {
      kind: "field",
      key: "updateVisibleRegion",
      value() {
        return () => {
          const {
            scrollTop,
            scrollLeft
          } = this;
          // clientHeight excludes scrollbars, which is good.
          const clientWidth = this.htmlDimensionsCacher.clientWidth;
          const clientHeight = this.htmlDimensionsCacher.clientHeight;

          // Note: scrollTop, and clientWidth all are in visible space;
          // i.e. they are affects by the CSS transforms.

          const vToW = this.coordSpace.visiblePixelsToWorldUnits;
          this.visibleRegion = {
            top: vToW(scrollTop),
            height: vToW(clientHeight),
            // TODO: These are very likely wrong
            left: vToW(scrollLeft),
            width: vToW(clientWidth)
          };
        };
      }
    }, {
      kind: "method",
      key: "computeRenderedPages",
      value: function computeRenderedPages() {
        // Also render 1 page before/after
        // @ts-ignore TS doesn't understand the filtering out of null values
        return [this.visiblePages[0]?.prev, ...this.visiblePages, this.visiblePages[this.visiblePages.length - 1]?.next].filter(p => p)
        // Never render more than 10 pages! Usually means something is wrong
        .slice(0, 10);
      }
    }, {
      kind: "field",
      key: "throttledUpdateRenderedPages",
      value() {
        return (0,_utils__WEBPACK_IMPORTED_MODULE_4__.throttle)(() => {
          this.renderedPages = this.computeRenderedPages();
          this.requestUpdate();
        }, 100, null);
      }
    }, {
      kind: "method",
      key: "computePageTops",
      value: function computePageTops(pages, spacing) {
        /** @type {{ [pageIndex: string]: number }} */
        const result = {};
        let top = spacing;
        for (const page of pages) {
          result[page.index] = top;
          top += page.heightInches + spacing;
        }
        return result;
      }
    }, {
      kind: "method",
      key: "computeDefaultScale",
      value: function computeDefaultScale(page) {
        // Default to real size if it fits, otherwise default to full width
        const containerWidthIn = this.coordSpace.renderedPixelsToWorldUnits(this.clientWidth);
        return Math.min(1, containerWidthIn / (page.widthInches + 2 * this.SPACING_IN)) || 1;
      }
    }, {
      kind: "method",
      key: "computeWorldDimensions",
      value: function computeWorldDimensions() {
        return {
          width: Math.max(...this.pages.map(p => p.widthInches)) + 2 * this.SPACING_IN,
          height: (0,_utils__WEBPACK_IMPORTED_MODULE_4__.sum)(this.pages.map(p => p.heightInches)) + (this.pages.length + 1) * this.SPACING_IN
        };
      }
    }, {
      kind: "method",
      key: "computeVisiblePages",
      value: function computeVisiblePages() {
        return this.pages.filter(page => {
          const PT = this.pageTops[page.index];
          const PB = PT + page.heightInches;
          const VT = this.visibleRegion.top;
          const VB = VT + this.visibleRegion.height;
          return PT <= VB && PB >= VT;
        });
      }
    }, {
      kind: "field",
      key: "attachScrollListeners",
      value() {
        return () => {
          this.addEventListener("scroll", this.updateVisibleRegion);
          this.scrollClassAdder.attach();
        };
      }
    }, {
      kind: "field",
      key: "detachScrollListeners",
      value() {
        return () => {
          this.removeEventListener("scroll", this.updateVisibleRegion);
          this.scrollClassAdder.detach();
        };
      }
    }]
  };
}, lit__WEBPACK_IMPORTED_MODULE_1__.LitElement);

/***/ }),

/***/ "./src/BookReader/Mode2Up.js":
/*!***********************************!*\
  !*** ./src/BookReader/Mode2Up.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Mode2Up: function() { return /* binding */ Mode2Up; }
/* harmony export */ });
/* harmony import */ var _Mode2UpLit_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Mode2UpLit.js */ "./src/BookReader/Mode2UpLit.js");
/* harmony import */ var _DragScrollable_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DragScrollable.js */ "./src/BookReader/DragScrollable.js");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
// @ts-check


/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

class Mode2Up {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;
    this.mode2UpLit = new _Mode2UpLit_js__WEBPACK_IMPORTED_MODULE_0__.Mode2UpLit(bookModel, br);
    this.mode2UpLit.flipSpeed = br.flipSpeed;

    /** @private */
    this.$el = $(this.mode2UpLit).attr('autoFit', this.br.options.twoPage.autofit)
    // We CANNOT use `br-mode-2up` as a class, because it's the same
    // as the name of the web component, and the webcomponents polyfill
    // uses the name of component as a class for style scoping 😒
    .addClass('br-mode-2up__root BRmode2up');

    /** Has mode2up ever been rendered before? */
    this.everShown = false;
  }

  /**
   * This is called when we switch into this mode
   */
  prepare() {
    const startLeaf = this.br.currentIndex();
    this.br.refs.$brContainer.empty().css({
      overflow: 'hidden'
    }).append(this.$el);
    this.mode2UpLit.style.opacity = '0';

    // Need this in a setTimeout so that it happens after the browser has _actually_
    // appended the element to the DOM
    setTimeout(async () => {
      if (!this.everShown) {
        this.mode2UpLit.initFirstRender(startLeaf);
        this.everShown = true;
        this.mode2UpLit.requestUpdate();
        await this.mode2UpLit.updateComplete;
        new _DragScrollable_js__WEBPACK_IMPORTED_MODULE_1__.DragScrollable(this.mode2UpLit, {
          preventDefault: true,
          dragSelector: '.br-mode-2up__book',
          // Only handle mouse events; let browser/HammerJS handle touch
          dragstart: 'mousedown',
          dragcontinue: 'mousemove',
          dragend: 'mouseup'
        });
      } else {
        await this.mode2UpLit.jumpToIndex(startLeaf, {
          smooth: false
        });
        this.resizePageView();
      }
      this.mode2UpLit.style.opacity = '1';
    });
    this.br.updateBrClasses();
  }

  /**
   * BREAKING CHANGE: No longer supports pageX/pageY
   * @param {PageIndex} index
   * @param {number} [pageX] x position on the page (in pixels) to center on
   * @param {number} [pageY] y position on the page (in pixels) to center on
   * @param {boolean} [noAnimate]
   */
  jumpToIndex(index, pageX, pageY, noAnimate) {
    this.mode2UpLit.jumpToIndex(index);
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    switch (direction) {
      case 'in':
        this.mode2UpLit.zoomIn();
        break;
      case 'out':
        this.mode2UpLit.zoomOut();
        break;
      default:
        console.error(`Unsupported direction: ${direction}`);
    }
  }
  resizePageView() {
    this.mode2UpLit.htmlDimensionsCacher.updateClientSizes();
    if (this.mode2UpLit.scale < this.mode2UpLit.initialScale && this.mode2UpLit.autoFit == 'none') {
      this.mode2UpLit.autoFit = 'auto';
    }
    if (this.mode2UpLit.autoFit != 'none') {
      this.mode2UpLit.resizeViaAutofit();
    }
    this.mode2UpLit.recenter();
  }
}

/***/ }),

/***/ "./src/BookReader/Mode2UpLit.js":
/*!**************************************!*\
  !*** ./src/BookReader/Mode2UpLit.js ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LeafEdges: function() { return /* binding */ LeafEdges; },
/* harmony export */   Mode2UpLit: function() { return /* binding */ Mode2UpLit; }
/* harmony export */ });
/* harmony import */ var lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lit/decorators.js */ "./node_modules/lit/decorators.js");
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lit */ "./node_modules/lit/index.js");
/* harmony import */ var lit_directives_style_map_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lit/directives/style-map.js */ "./node_modules/lit/directives/style-map.js");
/* harmony import */ var _ModeSmoothZoom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ModeSmoothZoom */ "./src/BookReader/ModeSmoothZoom.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils */ "./src/BookReader/utils.js");
/* harmony import */ var _utils_HTMLDimensionsCacher__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/HTMLDimensionsCacher */ "./src/BookReader/utils/HTMLDimensionsCacher.js");
/* harmony import */ var _BookModel__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./BookModel */ "./src/BookReader/BookModel.js");
/* harmony import */ var _ModeCoordinateSpace__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./ModeCoordinateSpace */ "./src/BookReader/ModeCoordinateSpace.js");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
function _decorate(e, r, t, i) { var o = _getDecoratorsApi(); if (i) for (var n = 0; n < i.length; n++) o = i[n](o); var s = r(function (e) { o.initializeInstanceElements(e, a.elements); }, t), a = o.decorateClass(_coalesceClassElements(s.d.map(_createElementDescriptor)), e); return o.initializeClassElements(s.F, a.elements), o.runClassFinishers(s.F, a.finishers); }
function _getDecoratorsApi() { _getDecoratorsApi = function () { return e; }; var e = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: function (e, r) { ["method", "field"].forEach(function (t) { r.forEach(function (r) { r.kind === t && "own" === r.placement && this.defineClassElement(e, r); }, this); }, this); }, initializeClassElements: function (e, r) { var t = e.prototype; ["method", "field"].forEach(function (i) { r.forEach(function (r) { var o = r.placement; if (r.kind === i && ("static" === o || "prototype" === o)) { var n = "static" === o ? e : t; this.defineClassElement(n, r); } }, this); }, this); }, defineClassElement: function (e, r) { var t = r.descriptor; if ("field" === r.kind) { var i = r.initializer; t = { enumerable: t.enumerable, writable: t.writable, configurable: t.configurable, value: void 0 === i ? void 0 : i.call(e) }; } Object.defineProperty(e, r.key, t); }, decorateClass: function (e, r) { var t = [], i = [], o = { static: [], prototype: [], own: [] }; if (e.forEach(function (e) { this.addElementPlacement(e, o); }, this), e.forEach(function (e) { if (!_hasDecorators(e)) return t.push(e); var r = this.decorateElement(e, o); t.push(r.element), t.push.apply(t, r.extras), i.push.apply(i, r.finishers); }, this), !r) return { elements: t, finishers: i }; var n = this.decorateConstructor(t, r); return i.push.apply(i, n.finishers), n.finishers = i, n; }, addElementPlacement: function (e, r, t) { var i = r[e.placement]; if (!t && -1 !== i.indexOf(e.key)) throw new TypeError("Duplicated element (" + e.key + ")"); i.push(e.key); }, decorateElement: function (e, r) { for (var t = [], i = [], o = e.decorators, n = o.length - 1; n >= 0; n--) { var s = r[e.placement]; s.splice(s.indexOf(e.key), 1); var a = this.fromElementDescriptor(e), l = this.toElementFinisherExtras((0, o[n])(a) || a); e = l.element, this.addElementPlacement(e, r), l.finisher && i.push(l.finisher); var c = l.extras; if (c) { for (var p = 0; p < c.length; p++) this.addElementPlacement(c[p], r); t.push.apply(t, c); } } return { element: e, finishers: i, extras: t }; }, decorateConstructor: function (e, r) { for (var t = [], i = r.length - 1; i >= 0; i--) { var o = this.fromClassDescriptor(e), n = this.toClassDescriptor((0, r[i])(o) || o); if (void 0 !== n.finisher && t.push(n.finisher), void 0 !== n.elements) { e = n.elements; for (var s = 0; s < e.length - 1; s++) for (var a = s + 1; a < e.length; a++) if (e[s].key === e[a].key && e[s].placement === e[a].placement) throw new TypeError("Duplicated element (" + e[s].key + ")"); } } return { elements: e, finishers: t }; }, fromElementDescriptor: function (e) { var r = { kind: e.kind, key: e.key, placement: e.placement, descriptor: e.descriptor }; return Object.defineProperty(r, Symbol.toStringTag, { value: "Descriptor", configurable: !0 }), "field" === e.kind && (r.initializer = e.initializer), r; }, toElementDescriptors: function (e) { if (void 0 !== e) return _toArray(e).map(function (e) { var r = this.toElementDescriptor(e); return this.disallowProperty(e, "finisher", "An element descriptor"), this.disallowProperty(e, "extras", "An element descriptor"), r; }, this); }, toElementDescriptor: function (e) { var r = e.kind + ""; if ("method" !== r && "field" !== r) throw new TypeError('An element descriptor\'s .kind property must be either "method" or "field", but a decorator created an element descriptor with .kind "' + r + '"'); var t = _toPropertyKey(e.key), i = e.placement + ""; if ("static" !== i && "prototype" !== i && "own" !== i) throw new TypeError('An element descriptor\'s .placement property must be one of "static", "prototype" or "own", but a decorator created an element descriptor with .placement "' + i + '"'); var o = e.descriptor; this.disallowProperty(e, "elements", "An element descriptor"); var n = { kind: r, key: t, placement: i, descriptor: Object.assign({}, o) }; return "field" !== r ? this.disallowProperty(e, "initializer", "A method descriptor") : (this.disallowProperty(o, "get", "The property descriptor of a field descriptor"), this.disallowProperty(o, "set", "The property descriptor of a field descriptor"), this.disallowProperty(o, "value", "The property descriptor of a field descriptor"), n.initializer = e.initializer), n; }, toElementFinisherExtras: function (e) { return { element: this.toElementDescriptor(e), finisher: _optionalCallableProperty(e, "finisher"), extras: this.toElementDescriptors(e.extras) }; }, fromClassDescriptor: function (e) { var r = { kind: "class", elements: e.map(this.fromElementDescriptor, this) }; return Object.defineProperty(r, Symbol.toStringTag, { value: "Descriptor", configurable: !0 }), r; }, toClassDescriptor: function (e) { var r = e.kind + ""; if ("class" !== r) throw new TypeError('A class descriptor\'s .kind property must be "class", but a decorator created a class descriptor with .kind "' + r + '"'); this.disallowProperty(e, "key", "A class descriptor"), this.disallowProperty(e, "placement", "A class descriptor"), this.disallowProperty(e, "descriptor", "A class descriptor"), this.disallowProperty(e, "initializer", "A class descriptor"), this.disallowProperty(e, "extras", "A class descriptor"); var t = _optionalCallableProperty(e, "finisher"); return { elements: this.toElementDescriptors(e.elements), finisher: t }; }, runClassFinishers: function (e, r) { for (var t = 0; t < r.length; t++) { var i = (0, r[t])(e); if (void 0 !== i) { if ("function" != typeof i) throw new TypeError("Finishers must return a constructor."); e = i; } } return e; }, disallowProperty: function (e, r, t) { if (void 0 !== e[r]) throw new TypeError(t + " can't have a ." + r + " property."); } }; return e; }
function _createElementDescriptor(e) { var r, t = _toPropertyKey(e.key); "method" === e.kind ? r = { value: e.value, writable: !0, configurable: !0, enumerable: !1 } : "get" === e.kind ? r = { get: e.value, configurable: !0, enumerable: !1 } : "set" === e.kind ? r = { set: e.value, configurable: !0, enumerable: !1 } : "field" === e.kind && (r = { configurable: !0, writable: !0, enumerable: !0 }); var i = { kind: "field" === e.kind ? "field" : "method", key: t, placement: e.static ? "static" : "field" === e.kind ? "own" : "prototype", descriptor: r }; return e.decorators && (i.decorators = e.decorators), "field" === e.kind && (i.initializer = e.value), i; }
function _coalesceGetterSetter(e, r) { void 0 !== e.descriptor.get ? r.descriptor.get = e.descriptor.get : r.descriptor.set = e.descriptor.set; }
function _coalesceClassElements(e) { for (var r = [], isSameElement = function (e) { return "method" === e.kind && e.key === o.key && e.placement === o.placement; }, t = 0; t < e.length; t++) { var i, o = e[t]; if ("method" === o.kind && (i = r.find(isSameElement))) { if (_isDataDescriptor(o.descriptor) || _isDataDescriptor(i.descriptor)) { if (_hasDecorators(o) || _hasDecorators(i)) throw new ReferenceError("Duplicated methods (" + o.key + ") can't be decorated."); i.descriptor = o.descriptor; } else { if (_hasDecorators(o)) { if (_hasDecorators(i)) throw new ReferenceError("Decorators can't be placed on different accessors with for the same property (" + o.key + ")."); i.decorators = o.decorators; } _coalesceGetterSetter(o, i); } } else r.push(o); } return r; }
function _hasDecorators(e) { return e.decorators && e.decorators.length; }
function _isDataDescriptor(e) { return void 0 !== e && !(void 0 === e.value && void 0 === e.writable); }
function _optionalCallableProperty(e, r) { var t = e[r]; if (void 0 !== t && "function" != typeof t) throw new TypeError("Expected '" + r + "' to be a function"); return t; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toArray(r) { return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _superPropGet(t, e, o, r) { var p = _get(_getPrototypeOf(1 & r ? t.prototype : t), e, o); return 2 & r && "function" == typeof p ? function (t) { return p.apply(o, t); } : p; }
function _get() { return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) { var p = _superPropBase(e, t); if (p) { var n = Object.getOwnPropertyDescriptor(p, t); return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value; } }, _get.apply(null, arguments); }
function _superPropBase(t, o) { for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t));); return t; }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
// @ts-check








/** @typedef {import('./BookModel').BookModel} BookModel */
/** @typedef {import('./BookModel').PageIndex} PageIndex */
/** @typedef {import('./ModeSmoothZoom').SmoothZoomable} SmoothZoomable */
/** @typedef {import('./PageContainer').PageContainer} PageContainer */
/** @typedef {import('../BookReader').default} BookReader */

// I _have_ to make this globally public, otherwise it won't let me call
// its constructor :/
/** @implements {SmoothZoomable} */
let Mode2UpLit = _decorate([(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.customElement)('br-mode-2up')], function (_initialize, _LitElement) {
  class Mode2UpLit extends _LitElement {
    /****************************************/
    /************** PROPERTIES **************/
    /****************************************/

    /** @type {BookReader} */

    /************** BOOK-RELATED PROPERTIES **************/

    /** @type {BookModel} */

    /************** SCALE-RELATED PROPERTIES **************/

    /** @type {ModeCoordinateSpace} Manage conversion between coordinates */

    /** @type {import('./options').AutoFitValues} */

    /************** VIRTUAL-FLIPPING PROPERTIES **************/

    /** ms for flip animation */

    /** @type {PageModel[]} */

    /** @type {PageModel | null} */

    /** @type {PageModel | null} */

    /** @type {PageModel[]} */

    /** @type {Record<PageIndex, PageContainer>} position in inches */

    /** @type {{ direction: 'left' | 'right', pagesFlipping: [PageIndex, PageIndex], pagesFlippingCount: number }} */

    /** @private cache this value */

    /************** DOM-RELATED PROPERTIES **************/

    /** @type {HTMLElement} */

    /** @type {HTMLElement} */

    /** @type {HTMLElement} */

    /** @param {PageModel} page */

    /** @param {PageModel} page */

    /**
     * @param {PageModel | null} pageLeft
     * @param {PageModel | null} pageRight
     */

    /** @type {HTMLDimensionsCacher} Cache things like clientWidth to reduce repaints */

    /************** CONSTANT PROPERTIES **************/

    /** How much to zoom when zoom button pressed */

    /** How thick a page is in the real world, as an estimate for the leafs */

    /****************************************/
    /************** PUBLIC API **************/
    /****************************************/

    /************** MAIN PUBLIC METHODS **************/

    /**
     * @param {PageIndex} index
     * TODO Remove smooth option from everywhere.
     */

    /********************************************/
    /************** INTERNAL STUFF **************/
    /********************************************/

    /************** LIFE CYCLE **************/

    /**
     * @param {BookModel} book
     * @param {BookReader} br
     */
    constructor(book, br) {
      super();
      _initialize(this);
      this.book = book;

      /** @type {BookReader} */
      this.br = br;
    }

    /** @override */

    /** @override */

    /** @override */

    /** @override */

    /************** LIT CONFIGS **************/

    /** @override */

    /************** RENDERING **************/

    /** @override */

    /** @param {PageModel} page */

    /**
     * @param {PageIndex} startIndex
     */

    /** @param {PageModel} page */

    /**
     * @param {'left' | 'right'} side
     * Renders the current leaf edges, as well as any "moving" leaf edges,
     * i.e. leaf edges that are currently being flipped. Uses a custom element
     * to render br-leaf-edges.
     **/

    /**
     * @returns {PageModel[]}
     */

    /**
     * @param {PageModel} page
     * @param {import('./options').AutoFitValues} autoFit
     */

    /**
     * @param {PageModel} page
     * @param {number} scale
     * @returns {{x: number, y: number}}
     */

    /************** VIRTUAL FLIPPING LOGIC **************/

    /**
     * @param {'left' | 'right' | 'next' | 'prev' | PageIndex | PageModel | {left: PageModel | null, right: PageModel | null}} nextSpread
     */

    /**
     * @param {'left' | 'right' | 'next' | 'prev' | PageIndex | PageModel | {left: PageModel | null, right: PageModel | null}} nextSpread
     * @returns {{left: PageModel | null, right: PageModel | null}}
     */

    /************** INPUT HANDLERS **************/

    /**
     * @param {MouseEvent} ev
     */
  }
  return {
    F: Mode2UpLit,
    d: [{
      kind: "field",
      key: "br",
      value: void 0
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Object
      })],
      key: "book",
      value: void 0
    }, {
      kind: "field",
      key: "coordSpace",
      value() {
        return new _ModeCoordinateSpace__WEBPACK_IMPORTED_MODULE_7__.ModeCoordinateSpace(this);
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Number
      })],
      key: "scale",
      value() {
        return 1;
      }
    }, {
      kind: "field",
      key: "initialScale",
      value() {
        return 1;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: String
      })],
      key: "autoFit",
      value() {
        return 'auto';
      }
    }, {
      kind: "field",
      key: "flipSpeed",
      value() {
        return 400;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.query)('.br-mode-2up__leafs--flipping')],
      key: "$flippingEdges",
      value: void 0
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Array,
        hasChanged: _utils__WEBPACK_IMPORTED_MODULE_4__.arrChanged
      })],
      key: "visiblePages",
      value() {
        return [];
      }
    }, {
      kind: "get",
      key: "pageLeft",
      value: function () {
        return this.visiblePages.find(p => p.pageSide == 'L');
      }
    }, {
      kind: "get",
      key: "pageRight",
      value: function () {
        return this.visiblePages.find(p => p.pageSide == 'R');
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Array
      })],
      key: "renderedPages",
      value() {
        return [];
      }
    }, {
      kind: "field",
      key: "pageContainerCache",
      value() {
        return {};
      }
    }, {
      kind: "field",
      key: "activeFlip",
      value() {
        return null;
      }
    }, {
      kind: "field",
      key: "_leftCoverWidth",
      value() {
        return 0;
      }
    }, {
      kind: "get",
      key: "$container",
      value: function () {
        return this;
      }
    }, {
      kind: "get",
      key: "$visibleWorld",
      value: function () {
        return this.$book;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.query)('.br-mode-2up__book')],
      key: "$book",
      value: void 0
    }, {
      kind: "get",
      key: "positions",
      value: function () {
        return this.computePositions(this.pageLeft, this.pageRight);
      }
    }, {
      kind: "method",
      key: "computePageHeight",
      value: function computePageHeight(page) {
        return this.book.getMedianPageSizeInches().height;
      }
    }, {
      kind: "method",
      key: "computePageWidth",
      value: function computePageWidth(page) {
        return page.widthInches * this.computePageHeight(page) / page.heightInches;
      }
    }, {
      kind: "method",
      key: "computePositions",
      value: function computePositions(pageLeft, pageRight) {
        const computePageWidth = this.computePageWidth.bind(this);
        const numLeafs = this.book.getNumLeafs();
        const movingPagesWidth = this.activeFlip ? Math.ceil(this.activeFlip.pagesFlippingCount / 2) * this.PAGE_THICKNESS_IN : 0;
        const leftPagesCount = this.book.pageProgression == 'lr' ? pageLeft?.index ?? 0 : !pageLeft ? 0 : numLeafs - pageLeft.index;

        // Everything is relative to the gutter
        const gutter = this._leftCoverWidth + leftPagesCount * this.PAGE_THICKNESS_IN;
        const pageLeftEnd = gutter;
        const pageLeftWidth = !pageLeft ? computePageWidth(pageRight.right) : computePageWidth(pageLeft);
        const pageLeftStart = gutter - pageLeftWidth;
        const leafEdgesLeftEnd = pageLeftStart; // leafEdgesLeftStart + leafEdgesLeftMainWidth + leafEdgesLeftMovingWidth;
        const leafEdgesLeftMovingWidth = this.activeFlip?.direction != 'left' ? 0 : movingPagesWidth;
        const leafEdgesLeftMainWidth = Math.ceil(leftPagesCount / 2) * this.PAGE_THICKNESS_IN - leafEdgesLeftMovingWidth;
        const leafEdgesLeftFullWidth = leafEdgesLeftMovingWidth + leafEdgesLeftMainWidth;
        const leafEdgesLeftMovingStart = leafEdgesLeftEnd - leafEdgesLeftMovingWidth;
        const leafEdgesLeftStart = leafEdgesLeftMovingStart - leafEdgesLeftMainWidth;
        const pageRightStart = gutter;
        const pageRightWidth = !pageRight ? 0 : computePageWidth(pageRight);
        const pageRightEnd = pageRightStart + pageRightWidth;
        const rightPagesCount = this.book.pageProgression == 'lr' ? !pageRight ? 0 : numLeafs - pageRight.index : pageRight?.index ?? 0;
        const leafEdgesRightStart = pageRightEnd;
        const leafEdgesRightMovingWidth = this.activeFlip?.direction != 'right' ? 0 : movingPagesWidth;
        const leafEdgesRightMainStart = leafEdgesRightStart + leafEdgesRightMovingWidth;
        const leafEdgesRightMainWidth = Math.ceil(rightPagesCount / 2) * this.PAGE_THICKNESS_IN - leafEdgesRightMovingWidth;
        const leafEdgesRightEnd = leafEdgesRightStart + leafEdgesRightMainWidth + leafEdgesRightMovingWidth;
        const leafEdgesRightFullWidth = leafEdgesRightMovingWidth + leafEdgesRightMainWidth;
        const spreadWidth = pageRightEnd - pageLeftStart;
        const bookWidth = leafEdgesRightEnd - leafEdgesLeftStart;
        return {
          leafEdgesLeftStart,
          leafEdgesLeftMainWidth,
          leafEdgesLeftMovingStart,
          leafEdgesLeftMovingWidth,
          leafEdgesLeftEnd,
          leafEdgesLeftFullWidth,
          pageLeftStart,
          pageLeftWidth,
          pageLeftEnd,
          gutter,
          pageRightStart,
          pageRightWidth,
          pageRightEnd,
          leafEdgesRightStart,
          leafEdgesRightMovingWidth,
          leafEdgesRightMainStart,
          leafEdgesRightMainWidth,
          leafEdgesRightEnd,
          leafEdgesRightFullWidth,
          spreadWidth,
          bookWidth
        };
      }
    }, {
      kind: "field",
      key: "htmlDimensionsCacher",
      value() {
        return new _utils_HTMLDimensionsCacher__WEBPACK_IMPORTED_MODULE_5__.HTMLDimensionsCacher(this);
      }
    }, {
      kind: "field",
      key: "smoothZoomer",
      value() {
        return new _ModeSmoothZoom__WEBPACK_IMPORTED_MODULE_3__.ModeSmoothZoom(this);
      }
    }, {
      kind: "field",
      key: "ZOOM_FACTOR",
      value() {
        return 1.1;
      }
    }, {
      kind: "field",
      key: "PAGE_THICKNESS_IN",
      value() {
        return 0.002;
      }
    }, {
      kind: "method",
      key: "jumpToIndex",
      value: async function jumpToIndex(index, {
        smooth = true
      } = {}) {
        await this.flipAnimation(index, {
          animate: smooth
        });
      }
    }, {
      kind: "method",
      key: "zoomIn",
      value: function zoomIn() {
        this.scale *= this.ZOOM_FACTOR;
      }
    }, {
      kind: "method",
      key: "zoomOut",
      value: function zoomOut() {
        this.scale *= 1 / this.ZOOM_FACTOR;
      }
    }, {
      kind: "method",
      key: "firstUpdated",
      value: function firstUpdated(changedProps) {
        _superPropGet(Mode2UpLit, "firstUpdated", this, 3)([changedProps]);
        this.htmlDimensionsCacher.updateClientSizes();
        this.smoothZoomer.attach();
      }
    }, {
      kind: "method",
      key: "connectedCallback",
      value: function connectedCallback() {
        _superPropGet(Mode2UpLit, "connectedCallback", this, 3)([]);
        this.htmlDimensionsCacher.attachResizeListener();
        this.smoothZoomer.attach();
      }
    }, {
      kind: "method",
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        this.htmlDimensionsCacher.detachResizeListener();
        this.smoothZoomer.detach();
        _superPropGet(Mode2UpLit, "disconnectedCallback", this, 3)([]);
      }
    }, {
      kind: "method",
      key: "updated",
      value: function updated(changedProps) {
        // this.X is the new value
        // changedProps.get('X') is the old value
        if (changedProps.has('book')) {
          this._leftCoverWidth = this.computePageWidth(this.book.getPage(this.book.pageProgression == 'lr' ? 0 : -1));
        }
        if (changedProps.has('visiblePages')) {
          this.renderedPages = this.computeRenderedPages();
          this.br.displayedIndices = this.visiblePages.map(p => p.index);
          this.br.updateFirstIndex(this.br.displayedIndices[0]);
          this.br._components.navbar.updateNavIndexThrottled();
        }
        if (changedProps.has('autoFit')) {
          if (this.autoFit != 'none') {
            this.resizeViaAutofit();
          }
        }
        if (changedProps.has('scale')) {
          const oldVal = changedProps.get('scale');
          this.recenter();
          this.smoothZoomer.updateViewportOnZoom(this.scale, oldVal);
        }
      }
    }, {
      kind: "method",
      key: "createRenderRoot",
      value: function createRenderRoot() {
        // Disable shadow DOM; that would require a huge rejiggering of CSS
        return this;
      }
    }, {
      kind: "method",
      key: "render",
      value: function render() {
        return (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)`
      <div class="br-mode-2up__book" @mouseup=${this.handlePageClick}>
        ${this.renderLeafEdges('left')}
        ${this.renderedPages.map(p => this.renderPage(p))}
        ${this.renderLeafEdges('right')}
      </div>`;
      }
    }, {
      kind: "field",
      key: "createPageContainer",
      value() {
        return page => {
          return this.pageContainerCache[page.index] || (this.pageContainerCache[page.index] =
          // @ts-ignore I know it's protected, TS! But Mode2Up and BookReader are friends.
          this.br._createPageContainer(page.index));
        };
      }
    }, {
      kind: "method",
      key: "initFirstRender",
      value: function initFirstRender(startIndex) {
        const page = this.book.getPage(startIndex);
        const spread = page.spread;
        this.visiblePages = (this.book.pageProgression == 'lr' ? [spread.left, spread.right] : [spread.right, spread.left]).filter(p => p);
        this.htmlDimensionsCacher.updateClientSizes();
        this.resizeViaAutofit(page);
        this.initialScale = this.scale;
      }
    }, {
      kind: "field",
      key: "renderPage",
      value() {
        return page => {
          const wToR = this.coordSpace.worldUnitsToRenderedPixels;
          const wToV = this.coordSpace.worldUnitsToVisiblePixels;
          const width = wToR(this.computePageWidth(page));
          const height = wToR(this.computePageHeight(page));
          const isVisible = this.visiblePages.map(p => p.index).includes(page.index);
          const positions = this.computePositions(page.spread.left, page.spread.right);
          const pageContainerEl = this.createPageContainer(page).update({
            dimensions: {
              width,
              height,
              top: 0,
              left: wToR(page.pageSide == 'L' ? positions.pageLeftStart : positions.pageLeftEnd)
            },
            reduce: page.width / wToV(this.computePageWidth(page))
          }).$container[0];
          pageContainerEl.classList.toggle('BRpage-visible', isVisible);
          return pageContainerEl;
        };
      }
    }, {
      kind: "field",
      key: "renderLeafEdges",
      value() {
        return side => {
          if (!this.visiblePages.length) return (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)``;
          const fullWidthIn = side == 'left' ? this.positions.leafEdgesLeftFullWidth : this.positions.leafEdgesRightFullWidth;
          if (!fullWidthIn) return (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)``;
          const wToR = this.coordSpace.worldUnitsToRenderedPixels;
          const height = wToR(this.computePageHeight(this.visiblePages[0]));
          const hasMovingPages = this.activeFlip?.direction == side;
          const leftmostPage = this.book.getPage(this.book.pageProgression == 'lr' ? 0 : this.book.getNumLeafs() - 1);
          const rightmostPage = this.book.getPage(this.book.pageProgression == 'lr' ? this.book.getNumLeafs() - 1 : 0);
          const numPagesFlipping = hasMovingPages ? this.activeFlip.pagesFlippingCount : 0;
          const range = side == 'left' ? [leftmostPage.index, this.pageLeft.goLeft(numPagesFlipping).index] : [this.pageRight.goRight(numPagesFlipping).index, rightmostPage.index];
          const mainEdgesStyle = {
            width: `${wToR(side == 'left' ? this.positions.leafEdgesLeftMainWidth : this.positions.leafEdgesRightMainWidth)}px`,
            height: `${height}px`,
            left: `${wToR(side == 'left' ? this.positions.leafEdgesLeftStart : this.positions.leafEdgesRightMainStart)}px`
          };
          const mainEdges = (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)`
      <br-leaf-edges
        leftIndex=${range[0]}
        rightIndex=${range[1]}
        .book=${this.book}
        .pageClickHandler=${index => this.br.jumpToIndex(index)}
        side=${side}
        class="br-mode-2up__leafs br-mode-2up__leafs--${side}"
        style=${(0,lit_directives_style_map_js__WEBPACK_IMPORTED_MODULE_2__.styleMap)(mainEdgesStyle)}
      ></br-leaf-edges>
    `;
          if (hasMovingPages) {
            const width = wToR(side == 'left' ? this.positions.leafEdgesLeftMovingWidth : this.positions.leafEdgesRightMovingWidth);
            const style = {
              width: `${width}px`,
              height: `${height}px`,
              left: `${wToR(side == 'left' ? this.positions.leafEdgesLeftMovingStart : this.positions.leafEdgesRightStart)}px`,
              pointerEvents: 'none',
              transformOrigin: `${wToR(side == 'left' ? this.positions.pageLeftWidth : -this.positions.pageRightWidth) + width / 2}px 0`
            };
            const movingEdges = (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)`
        <br-leaf-edges
          leftIndex=${this.activeFlip.pagesFlipping[0]}
          rightIndex=${this.activeFlip.pagesFlipping[1]}
          .book=${this.book}
          side=${side}
          class="br-mode-2up__leafs br-mode-2up__leafs--${side} br-mode-2up__leafs--flipping"
          style=${(0,lit_directives_style_map_js__WEBPACK_IMPORTED_MODULE_2__.styleMap)(style)}
        ></br-leaf-edges>
      `;
            return side == 'left' ? (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)`${mainEdges}${movingEdges}` : (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)`${movingEdges}${mainEdges}`;
          } else {
            return mainEdges;
          }
        };
      }
    }, {
      kind: "method",
      key: "resizeViaAutofit",
      value: function resizeViaAutofit(page = this.visiblePages[0]) {
        this.scale = this.computeScale(page, this.autoFit);
      }
    }, {
      kind: "method",
      key: "recenter",
      value: function recenter(page = this.visiblePages[0]) {
        const translate = this.computeTranslate(page, this.scale);
        this.$book.style.transform = `translateX(${translate.x}px) translateY(${translate.y}px) scale(${this.scale})`;
      }
    }, {
      kind: "method",
      key: "computeRenderedPages",
      value: function computeRenderedPages() {
        // Also render 2 pages before/after
        // @ts-ignore TS doesn't understand the filtering out of null values
        return [this.visiblePages[0]?.prev?.prev, this.visiblePages[0]?.prev, ...this.visiblePages, this.visiblePages[this.visiblePages.length - 1]?.next, this.visiblePages[this.visiblePages.length - 1]?.next?.next].filter(p => p)
        // Never render more than 10 pages! Usually means something is wrong
        .slice(0, 10);
      }
    }, {
      kind: "method",
      key: "computeScale",
      value: function computeScale(page, autoFit) {
        if (!page) return 1;
        const spread = page.spread;
        const bookWidth = this.computePositions(spread.left, spread.right).bookWidth;
        const bookHeight = this.computePageHeight(spread.left || spread.right);
        const BOOK_PADDING_PX = 10;
        const curScale = this.scale;
        this.scale = 1; // Need this temporarily
        const widthScale = this.coordSpace.renderedPixelsToWorldUnits(this.htmlDimensionsCacher.clientWidth - 2 * BOOK_PADDING_PX) / bookWidth;
        const heightScale = this.coordSpace.renderedPixelsToWorldUnits(this.htmlDimensionsCacher.clientHeight - 2 * BOOK_PADDING_PX) / bookHeight;
        this.scale = curScale;
        const realScale = 1;
        let scale = realScale;
        if (autoFit == 'width') {
          scale = widthScale;
        } else if (autoFit == 'height') {
          scale = heightScale;
        } else if (autoFit == 'auto') {
          scale = Math.min(widthScale, heightScale);
        } else if (autoFit == 'none') {
          scale = this.scale;
        } else {
          // Should be impossible
          throw new Error(`Invalid autoFit value: ${autoFit}`);
        }
        return scale;
      }
    }, {
      kind: "method",
      key: "computeTranslate",
      value: function computeTranslate(page, scale = this.scale) {
        if (!page) return {
          x: 0,
          y: 0
        };
        const spread = page.spread;
        // Default to real size if it fits, otherwise default to full height
        const positions = this.computePositions(spread.left, spread.right);
        const bookWidth = positions.bookWidth;
        const bookHeight = this.computePageHeight(spread.left || spread.right);
        const visibleBookWidth = this.coordSpace.worldUnitsToRenderedPixels(bookWidth) * scale;
        const visibleBookHeight = this.coordSpace.worldUnitsToRenderedPixels(bookHeight) * scale;
        const leftOffset = this.coordSpace.worldUnitsToRenderedPixels(-positions.leafEdgesLeftStart) * scale;
        const translateX = (this.htmlDimensionsCacher.clientWidth - visibleBookWidth) / 2 + leftOffset;
        const translateY = (this.htmlDimensionsCacher.clientHeight - visibleBookHeight) / 2;
        return {
          x: Math.max(leftOffset, translateX),
          y: Math.max(0, translateY)
        };
      }
    }, {
      kind: "method",
      key: "flipAnimation",
      value: async function flipAnimation(nextSpread, {
        animate = true
      } = {}) {
        const curSpread = (this.pageLeft || this.pageRight)?.spread;
        if (!curSpread) {
          // Nothings been actually rendered yet! Will be corrected during initFirstRender
          return;
        }
        nextSpread = this.parseNextSpread(nextSpread);
        if (this.activeFlip || !nextSpread) return;
        const progression = this.book.pageProgression;
        const curLeftIndex = curSpread.left?.index ?? (progression == 'lr' ? -1 : this.book.getNumLeafs());
        const nextLeftIndex = nextSpread.left?.index ?? (progression == 'lr' ? -1 : this.book.getNumLeafs());
        if (curLeftIndex == nextLeftIndex) return;
        const renderedIndices = this.renderedPages.map(p => p.index);
        /** @type {PageContainer[]} */
        const nextPageContainers = [];
        for (const page of [nextSpread.left, nextSpread.right]) {
          if (!page) continue;
          nextPageContainers.push(this.createPageContainer(page));
          if (!renderedIndices.includes(page.index)) {
            this.renderedPages.push(page);
          }
        }
        const curTranslate = this.computeTranslate(curSpread.left || curSpread.right, this.scale);
        const idealNextTranslate = this.computeTranslate(nextSpread.left || nextSpread.right, this.scale);
        const translateDiff = Math.sqrt((idealNextTranslate.x - curTranslate.x) ** 2 + (idealNextTranslate.y - curTranslate.y) ** 2);
        let nextTranslate = `translate(${idealNextTranslate.x}px, ${idealNextTranslate.y}px)`;
        if (translateDiff < 50) {
          const activeTranslate = this.$book.style.transform.match(/translate\([^)]+\)/)?.[0];
          if (activeTranslate) {
            nextTranslate = activeTranslate;
          }
        }
        const newTransform = `${nextTranslate} scale(${this.scale})`;
        if (animate && 'animate' in Element.prototype) {
          // This table is used to determine the direction of the flip animation:
          //    | < | >
          // lr | L | R
          // rl | R | L
          const direction = progression == 'lr' ? nextLeftIndex > curLeftIndex ? 'right' : 'left' : nextLeftIndex > curLeftIndex ? 'left' : 'right';
          this.activeFlip = {
            direction,
            pagesFlipping: [curLeftIndex, nextLeftIndex],
            pagesFlippingCount: Math.abs(nextLeftIndex - curLeftIndex)
          };
          this.classList.add(`br-mode-2up--flipping-${direction}`);
          this.classList.add(`BRpageFlipping`);

          // Wait for lit update cycle to finish so that entering pages are rendered
          this.requestUpdate();
          await this.updateComplete;
          this.visiblePages.map(p => this.pageContainerCache[p.index].$container).forEach($c => $c.addClass('BRpage-exiting'));
          nextPageContainers.forEach(c => c.$container.addClass('BRpage-entering'));

          /** @type {KeyframeAnimationOptions} */
          const animationStyle = {
            duration: this.flipSpeed + this.activeFlip.pagesFlippingCount,
            easing: 'ease-in',
            fill: 'none'
          };
          const bookCenteringAnimation = this.$book.animate([{
            transform: newTransform
          }], animationStyle);
          const edgeTranslationAnimation = this.$flippingEdges.animate([{
            transform: `rotateY(0deg)`
          }, {
            transform: direction == 'left' ? `rotateY(-180deg)` : `rotateY(180deg)`
          }], animationStyle);
          const exitingPageAnimation = direction == 'left' ? this.querySelector('.BRpage-exiting[data-side=L]').animate([{
            transform: `rotateY(0deg)`
          }, {
            transform: `rotateY(180deg)`
          }], animationStyle) : this.querySelector('.BRpage-exiting[data-side=R]').animate([{
            transform: `rotateY(0deg)`
          }, {
            transform: `rotateY(-180deg)`
          }], animationStyle);
          const enteringPageAnimation = direction == 'left' ? this.querySelector('.BRpage-entering[data-side=R]').animate([{
            transform: `rotateY(-180deg)`
          }, {
            transform: `rotateY(0deg)`
          }], animationStyle) : this.querySelector('.BRpage-entering[data-side=L]').animate([{
            transform: `rotateY(180deg)`
          }, {
            transform: `rotateY(0deg)`
          }], animationStyle);
          bookCenteringAnimation.play();
          edgeTranslationAnimation.play();
          exitingPageAnimation.play();
          enteringPageAnimation.play();
          nextPageContainers.forEach(c => c.$container.addClass('BRpage-visible'));
          await Promise.race([(0,_utils__WEBPACK_IMPORTED_MODULE_4__.promisifyEvent)(bookCenteringAnimation, 'finish'), (0,_utils__WEBPACK_IMPORTED_MODULE_4__.promisifyEvent)(edgeTranslationAnimation, 'finish'), (0,_utils__WEBPACK_IMPORTED_MODULE_4__.promisifyEvent)(exitingPageAnimation, 'finish'), (0,_utils__WEBPACK_IMPORTED_MODULE_4__.promisifyEvent)(enteringPageAnimation, 'finish')]);
          this.classList.remove(`br-mode-2up--flipping-${direction}`);
          this.classList.remove(`BRpageFlipping`);
          this.visiblePages.map(p => this.pageContainerCache[p.index].$container).forEach($c => $c.removeClass('BRpage-exiting BRpage-visible'));
          nextPageContainers.forEach(c => c.$container.removeClass('BRpage-entering'));
          this.activeFlip = null;
        }
        this.$book.style.transform = newTransform;
        this.visiblePages = (progression == 'lr' ? [nextSpread.left, nextSpread.right] : [nextSpread.right, nextSpread.left]).filter(x => x);
      }
    }, {
      kind: "method",
      key: "parseNextSpread",
      value: function parseNextSpread(nextSpread) {
        if (nextSpread == 'next') {
          nextSpread = this.book.pageProgression == 'lr' ? 'right' : 'left';
        } else if (nextSpread == 'prev') {
          nextSpread = this.book.pageProgression == 'lr' ? 'left' : 'right';
        }
        const curSpread = (this.pageLeft || this.pageRight).spread;
        if (nextSpread == 'left') {
          nextSpread = curSpread.left?.findLeft({
            combineConsecutiveUnviewables: true
          })?.spread;
        } else if (nextSpread == 'right') {
          nextSpread = curSpread.right?.findRight({
            combineConsecutiveUnviewables: true
          })?.spread;
        }
        if (typeof nextSpread == 'number') {
          nextSpread = this.book.getPage(nextSpread).spread;
        }
        if (nextSpread instanceof _BookModel__WEBPACK_IMPORTED_MODULE_6__.PageModel) {
          nextSpread = nextSpread.spread;
        }
        return nextSpread;
      }
    }, {
      kind: "field",
      key: "handlePageClick",
      value() {
        return ev => {
          // right click
          if (ev.which == 3 && this.br.protected) {
            return false;
          }
          if (ev.which != 1) return;
          const $page = $(ev.target).closest('.BRpagecontainer');
          if (!$page.length) return;
          if ($page.data('side') == 'L') {
            this.flipAnimation('left');
          } else if ($page.data('side') == 'R') {
            this.flipAnimation('right');
          }
        };
      }
    }]
  };
}, lit__WEBPACK_IMPORTED_MODULE_1__.LitElement);
let LeafEdges = _decorate([(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.customElement)('br-leaf-edges')], function (_initialize2, _LitElement2) {
  class LeafEdges extends _LitElement2 {
    constructor(...args) {
      super(...args);
      _initialize2(this);
    }
  }
  return {
    F: LeafEdges,
    d: [{
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Number
      })],
      key: "leftIndex",
      value() {
        return 0;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: Number
      })],
      key: "rightIndex",
      value() {
        return 0;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        type: String
      })],
      key: "side",
      value() {
        return 'left';
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        attribute: false
      })],
      key: "book",
      value() {
        return null;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.property)({
        attribute: false,
        type: Function
      })],
      key: "pageClickHandler",
      value() {
        return null;
      }
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.query)('.br-leaf-edges__bar')],
      key: "$hoverBar",
      value: void 0
    }, {
      kind: "field",
      decorators: [(0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.query)('.br-leaf-edges__label')],
      key: "$hoverLabel",
      value: void 0
    }, {
      kind: "get",
      key: "pageWidthPercent",
      value: /** @type {'left' | 'right'} */

      /** @type {BookModel} */

      /** @type {(index: PageIndex) => void} */

      function () {
        return 100 * 1 / (this.rightIndex - this.leftIndex + 1);
      }
    }, {
      kind: "method",
      key: "render",
      value: function render() {
        return (0,lit__WEBPACK_IMPORTED_MODULE_1__.html)`
      <div
        class="br-leaf-edges__bar"
        style="${(0,lit_directives_style_map_js__WEBPACK_IMPORTED_MODULE_2__.styleMap)({
          width: `${this.pageWidthPercent}%`
        })}"
      ></div>
      <div class="br-leaf-edges__label">Page</div>`;
      }
    }, {
      kind: "method",
      key: "connectedCallback",
      value: function connectedCallback() {
        _superPropGet(LeafEdges, "connectedCallback", this, 3)([]);
        this.addEventListener('mouseenter', this.onMouseEnter);
        this.addEventListener('mouseleave', this.onMouseLeave);
        this.addEventListener('click', this.onClick);
      }
    }, {
      kind: "method",
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        _superPropGet(LeafEdges, "disconnectedCallback", this, 3)([]);
        this.addEventListener('mouseenter', this.onMouseEnter);
        this.removeEventListener('mousemove', this.onMouseMove);
        this.removeEventListener('mouseleave', this.onMouseLeave);
      }

      /** @override */
    }, {
      kind: "method",
      key: "createRenderRoot",
      value: function createRenderRoot() {
        // Disable shadow DOM; that would require a huge rejiggering of CSS
        return this;
      }

      /**
       * @param {MouseEvent} e
       */
    }, {
      kind: "field",
      key: "onMouseEnter",
      value() {
        return e => {
          this.addEventListener('mousemove', this.onMouseMove);
          this.$hoverBar.style.display = 'block';
          this.$hoverLabel.style.display = 'block';
        };
      }
    }, {
      kind: "field",
      key: "onMouseMove",
      value() {
        return e => {
          this.$hoverBar.style.left = `${e.offsetX}px`;
          if (this.side == 'right') {
            this.$hoverLabel.style.left = `${e.offsetX}px`;
          } else {
            this.$hoverLabel.style.right = `${this.offsetWidth - e.offsetX}px`;
          }
          this.$hoverLabel.style.top = `${e.offsetY}px`;
          const index = this.mouseEventToPageIndex(e);
          this.$hoverLabel.textContent = this.book.getPageName(index);
        };
      }
    }, {
      kind: "field",
      key: "onMouseLeave",
      value() {
        return e => {
          this.removeEventListener('mousemove', this.onMouseMove);
          this.$hoverBar.style.display = 'none';
          this.$hoverLabel.style.display = 'none';
        };
      }
    }, {
      kind: "field",
      key: "onClick",
      value() {
        return e => {
          this.pageClickHandler(this.mouseEventToPageIndex(e));
        };
      }
    }, {
      kind: "method",
      key: "mouseEventToPageIndex",
      value:
      /**
       * @param {MouseEvent} e
       */
      /**
       * @param {MouseEvent} e
       */
      /**
       * @param {MouseEvent} e
       */
      /**
       * @param {MouseEvent} e
       * @returns {PageIndex}
       */
      function mouseEventToPageIndex(e) {
        return Math.floor(this.leftIndex + e.offsetX / this.offsetWidth * (this.rightIndex - this.leftIndex + 1));
      }
    }]
  };
}, lit__WEBPACK_IMPORTED_MODULE_1__.LitElement);

/***/ }),

/***/ "./src/BookReader/ModeCoordinateSpace.js":
/*!***********************************************!*\
  !*** ./src/BookReader/ModeCoordinateSpace.js ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ModeCoordinateSpace: function() { return /* binding */ ModeCoordinateSpace; }
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/BookReader/utils.js");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


/**
 * There are a few different "coordinate spaces" at play in BR:
 * (1) World units: i.e. inches. Unless otherwise stated, all computations
 *     are done in world units.
 * (2) Rendered Pixels: i.e. img.width = '300'. Note this does _not_ take
 *     into account zoom scaling.
 * (3) Visible Pixels: Just rendered pixels, but taking into account scaling.
 */
class ModeCoordinateSpace {
  /**
   * @param {{ scale: number }} mode
   */
  constructor(mode) {
    _defineProperty(this, "screenDPI", (0,_utils__WEBPACK_IMPORTED_MODULE_0__.calcScreenDPI)());
    _defineProperty(this, "worldUnitsToRenderedPixels", (/** @type {number} */inches) => inches * this.screenDPI);
    _defineProperty(this, "renderedPixelsToWorldUnits", (/** @type {number} */px) => px / this.screenDPI);
    _defineProperty(this, "renderedPixelsToVisiblePixels", (/** @type {number} */px) => px * this.mode.scale);
    _defineProperty(this, "visiblePixelsToRenderedPixels", (/** @type {number} */px) => px / this.mode.scale);
    _defineProperty(this, "worldUnitsToVisiblePixels", (/** @type {number} */px) => this.renderedPixelsToVisiblePixels(this.worldUnitsToRenderedPixels(px)));
    _defineProperty(this, "visiblePixelsToWorldUnits", (/** @type {number} */px) => this.renderedPixelsToWorldUnits(this.visiblePixelsToRenderedPixels(px)));
    this.mode = mode;
  }
}

/***/ }),

/***/ "./src/BookReader/ModeSmoothZoom.js":
/*!******************************************!*\
  !*** ./src/BookReader/ModeSmoothZoom.js ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ModeSmoothZoom: function() { return /* binding */ ModeSmoothZoom; },
/* harmony export */   TouchesMonitor: function() { return /* binding */ TouchesMonitor; }
/* harmony export */ });
/* harmony import */ var interactjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! interactjs */ "./node_modules/interactjs/dist/interact.min.js");
/* harmony import */ var interactjs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(interactjs__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _util_browserSniffing_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util/browserSniffing.js */ "./src/util/browserSniffing.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/BookReader/utils.js");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// @ts-check



/** @typedef {import('./utils/HTMLDimensionsCacher.js').HTMLDimensionsCacher} HTMLDimensionsCacher */

/**
 * @typedef {object} SmoothZoomable
 * @property {HTMLElement} $container
 * @property {HTMLElement} $visibleWorld
 * @property {import("./options.js").AutoFitValues} autoFit
 * @property {number} scale
 * @property {HTMLDimensionsCacher} htmlDimensionsCacher
 * @property {function(): void} [attachScrollListeners]
 * @property {function(): void} [detachScrollListeners]
 */

/** Manages pinch-zoom, ctrl-wheel, and trackpad pinch smooth zooming. */
class ModeSmoothZoom {
  /** @param {SmoothZoomable} mode */
  constructor(mode) {
    /** Position (in unit-less, [0, 1] coordinates) in client to scale around */
    _defineProperty(this, "scaleCenter", {
      x: 0.5,
      y: 0.5
    });
    /** @param {Event} ev */
    _defineProperty(this, "_preventEvent", ev => {
      ev.preventDefault();
      return false;
    });
    _defineProperty(this, "_pinchStart", async () => {
      // Safari calls gesturestart twice!
      if (this.pinching) return;
      if ((0,_util_browserSniffing_js__WEBPACK_IMPORTED_MODULE_0__.isIOS)()) {
        // Safari sometimes causes a pinch to trigger when there's only one touch!
        await (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.sleep)(0); // touches monitor can receive the touch event late
        if (this.touchesMonitor.touches < 2) return;
      }
      this.pinching = true;

      // Do this in case the pinchend hasn't fired yet.
      this.oldScale = 1;
      this.mode.$visibleWorld.classList.add("BRsmooth-zooming");
      this.mode.$visibleWorld.style.willChange = "transform";
      this.mode.autoFit = "none";
      this.detachCtrlZoom();
      this.mode.detachScrollListeners?.();
      this.interact.gesturable({
        listeners: {
          start: this._pinchStart,
          move: this._pinchMove,
          end: this._pinchEnd
        }
      });
    });
    /** @param {{ scale: number, clientX: number, clientY: number }}} e */
    _defineProperty(this, "_pinchMove", async e => {
      if (!this.pinching) return;
      this.lastEvent = {
        scale: e.scale,
        clientX: e.clientX,
        clientY: e.clientY
      };
      if (!this.pinchMoveFrame) {
        // Buffer these events; only update the scale when request animation fires
        this.pinchMoveFrame = this.bufferFn(this._drawPinchZoomFrame);
      }
    });
    _defineProperty(this, "_pinchEnd", async () => {
      if (!this.pinching) return;
      this.pinching = false;
      this.interact.gesturable({
        listeners: {
          start: this._pinchStart,
          end: this._pinchEnd
        }
      });
      // Want this to happen after the pinchMoveFrame,
      // if one is in progress; otherwise setting oldScale
      // messes up the transform.
      await this.pinchMoveFramePromise;
      this.scaleCenter = {
        x: 0.5,
        y: 0.5
      };
      this.oldScale = 1;
      this.mode.$visibleWorld.classList.remove("BRsmooth-zooming");
      this.mode.$visibleWorld.style.willChange = "auto";
      this.attachCtrlZoom();
      this.mode.attachScrollListeners?.();
    });
    _defineProperty(this, "_drawPinchZoomFrame", async () => {
      // Because of the buffering/various timing locks,
      // this can be called after the pinch has ended, which
      // results in a janky zoom after the pinch.
      if (!this.pinching) {
        this.pinchMoveFrame = null;
        return;
      }
      this.mode.$container.style.overflow = "hidden";
      this.pinchMoveFramePromiseRes = null;
      this.pinchMoveFramePromise = new Promise(res => this.pinchMoveFramePromiseRes = res);
      this.updateScaleCenter({
        clientX: this.lastEvent.clientX,
        clientY: this.lastEvent.clientY
      });
      const curScale = this.mode.scale;
      const newScale = curScale * this.lastEvent.scale / this.oldScale;
      if (curScale != newScale) {
        this.mode.scale = newScale;
        await this.pinchMoveFramePromise;
      }
      this.mode.$container.style.overflow = "auto";
      this.oldScale = this.lastEvent.scale;
      this.pinchMoveFrame = null;
    });
    _defineProperty(this, "_dragMove", async e => {
      if (this.pinching) {
        await this._pinchEnd();
      }
      this.mode.$container.scrollTop -= e.dy;
      this.mode.$container.scrollLeft -= e.dx;
    });
    /** @param {WheelEvent} ev **/
    _defineProperty(this, "_handleCtrlWheel", ev => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      const zoomMultiplier =
      // Zooming on macs was painfully slow; likely due to their better
      // trackpads. Give them a higher zoom rate.
      /Mac/i.test(navigator.platform) ? 0.045 :
      // This worked well for me on Windows
      0.03;

      // Zoom around the cursor
      this.updateScaleCenter(ev);
      this.mode.autoFit = "none";
      this.mode.scale *= 1 - Math.sign(ev.deltaY) * zoomMultiplier;
    });
    /** @type {SmoothZoomable} */
    this.mode = mode;

    /** Whether a pinch is currently happening */
    this.pinching = false;
    /** Non-null when a scale has been enqueued/is being processed by the buffer function */
    this.pinchMoveFrame = null;
    /** Promise for the current/enqueued pinch move frame. Resolves when it is complete. */
    this.pinchMoveFramePromise = Promise.resolve();
    this.oldScale = 1;
    /** @type {{ scale: number, clientX: number, clientY: number }}} */
    this.lastEvent = null;
    this.attached = false;

    /** @type {function(function(): void): any} */
    this.bufferFn = window.requestAnimationFrame.bind(window);
  }
  attach() {
    if (this.attached) return;
    this.attachCtrlZoom();

    // GestureEvents work only on Safari; they're too glitchy to use
    // fully, but they can sometimes help error correct when interact
    // misses an end/start event on Safari due to Safari bugs.
    this.mode.$container.addEventListener('gesturestart', this._pinchStart);
    this.mode.$container.addEventListener('gesturechange', this._preventEvent);
    this.mode.$container.addEventListener('gestureend', this._pinchEnd);
    if ((0,_util_browserSniffing_js__WEBPACK_IMPORTED_MODULE_0__.isIOS)()) {
      this.touchesMonitor = new TouchesMonitor(this.mode.$container);
      this.touchesMonitor.attach();
    }
    this.mode.$container.style.touchAction = "pan-x pan-y";

    // The pinch listeners
    this.interact = interactjs__WEBPACK_IMPORTED_MODULE_2___default()(this.mode.$container);
    this.interact.gesturable({
      listeners: {
        start: this._pinchStart,
        end: this._pinchEnd
      }
    });
    if ((0,_util_browserSniffing_js__WEBPACK_IMPORTED_MODULE_0__.isSamsungInternet)()) {
      // Samsung internet pinch-zoom will not work unless we disable
      // all touch actions. So use interact.js' built-in drag support
      // to handle moving on that browser.
      this.mode.$container.style.touchAction = "none";
      this.interact.draggable({
        inertia: {
          resistance: 2,
          minSpeed: 100,
          allowResume: true
        },
        listeners: {
          move: this._dragMove
        }
      });
    }
    this.attached = true;
  }
  detach() {
    this.detachCtrlZoom();

    // GestureEvents work only on Safari; they interfere with Hammer,
    // so block them.
    this.mode.$container.removeEventListener('gesturestart', this._pinchStart);
    this.mode.$container.removeEventListener('gesturechange', this._preventEvent);
    this.mode.$container.removeEventListener('gestureend', this._pinchEnd);
    this.touchesMonitor?.detach?.();

    // The pinch listeners
    this.interact.unset();
    interactjs__WEBPACK_IMPORTED_MODULE_2___default().removeDocument(document);
    this.attached = false;
  }
  /** @private */
  attachCtrlZoom() {
    window.addEventListener("wheel", this._handleCtrlWheel, {
      passive: false
    });
  }

  /** @private */
  detachCtrlZoom() {
    window.removeEventListener("wheel", this._handleCtrlWheel);
  }
  /**
   * @param {object} param0
   * @param {number} param0.clientX
   * @param {number} param0.clientY
   */
  updateScaleCenter({
    clientX,
    clientY
  }) {
    const bc = this.mode.htmlDimensionsCacher.boundingClientRect;
    this.scaleCenter = {
      x: (clientX - bc.left) / this.mode.htmlDimensionsCacher.clientWidth,
      y: (clientY - bc.top) / this.mode.htmlDimensionsCacher.clientHeight
    };
  }

  /**
   * @param {number} newScale
   * @param {number} oldScale
   */
  updateViewportOnZoom(newScale, oldScale) {
    const container = this.mode.$container;
    const {
      scrollTop: T,
      scrollLeft: L
    } = container;
    const W = this.mode.htmlDimensionsCacher.clientWidth;
    const H = this.mode.htmlDimensionsCacher.clientHeight;

    // Scale factor change
    const F = newScale / oldScale;

    // Where in the viewport the zoom is centered on
    const XPOS = this.scaleCenter.x;
    const YPOS = this.scaleCenter.y;
    const oldCenter = {
      x: L + XPOS * W,
      y: T + YPOS * H
    };
    const newCenter = {
      x: F * oldCenter.x,
      y: F * oldCenter.y
    };
    container.scrollTop = newCenter.y - YPOS * H;
    container.scrollLeft = newCenter.x - XPOS * W;
    this.pinchMoveFramePromiseRes?.();
  }
}
class TouchesMonitor {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    /**
     * @param {TouchEvent} ev
     */
    _defineProperty(this, "_updateTouchCount", ev => {
      this.touches = ev.touches.length;
    });
    /** @type {HTMLElement} */
    this.container = container;
    this.touches = 0;
  }
  attach() {
    this.container.addEventListener("touchstart", this._updateTouchCount);
    this.container.addEventListener("touchend", this._updateTouchCount);
  }
  detach() {
    this.container.removeEventListener("touchstart", this._updateTouchCount);
    this.container.removeEventListener("touchend", this._updateTouchCount);
  }
}

/***/ }),

/***/ "./src/BookReader/ModeThumb.js":
/*!*************************************!*\
  !*** ./src/BookReader/ModeThumb.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ModeThumb: function() { return /* binding */ ModeThumb; }
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/BookReader/utils.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events.js */ "./src/BookReader/events.js");
/* harmony import */ var _DragScrollable_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DragScrollable.js */ "./src/BookReader/DragScrollable.js");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
// @ts-check



/** @typedef {import('../BookREader.js').default} BookReader */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */
/** @typedef {import('./BookModel.js').BookModel} BookModel */

/** @typedef {JQuery} $lazyLoadImgPlaceholder * jQuery element with data attributes: leaf, reduce */

class ModeThumb {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;
  }

  /**
   * Draws the thumbnail view
   * @param {number} [seekIndex] If seekIndex is defined, the view will be drawn
   *    with that page visible (without any animated scrolling).
   *
   * Creates place holder for image to load after gallery has been drawn
   */
  drawLeafs(seekIndex) {
    const {
      floor
    } = Math;
    const {
      book
    } = this;
    const viewWidth = this.br.refs.$brContainer.prop('scrollWidth') - 20; // width minus buffer

    let leafHeight;
    let rightPos = 0;
    let bottomPos = 0;
    let maxRight = 0;
    let currentRow = 0;
    let leafIndex = 0;
    /** @type {Array<{ leafs?: Array<{num: PageIndex, left: number}>, height?: number, top?: number }>} */
    const leafMap = [];

    // Will be set to top of requested seek index, if set
    let seekTop;

    // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
    // make `leafMap`
    for (const page of book.pagesIterator({
      combineConsecutiveUnviewables: true
    })) {
      const leafWidth = this.br.thumbWidth;
      if (rightPos + (leafWidth + this.br.thumbPadding) > viewWidth) {
        currentRow++;
        rightPos = 0;
        leafIndex = 0;
      }

      // Init current row in leafMap
      if (!leafMap[currentRow]) {
        leafMap[currentRow] = {};
      }
      if (!leafMap[currentRow].leafs) {
        leafMap[currentRow].leafs = [];
        leafMap[currentRow].height = 0;
        leafMap[currentRow].top = 0;
      }
      leafMap[currentRow].leafs[leafIndex] = {
        num: page.index,
        left: rightPos
      };
      leafHeight = floor(page.height * this.br.thumbWidth / page.width);
      if (leafHeight > leafMap[currentRow].height) {
        leafMap[currentRow].height = leafHeight;
      }
      if (leafIndex === 0) {
        bottomPos += this.br.thumbPadding + leafMap[currentRow].height;
      }
      rightPos += leafWidth + this.br.thumbPadding;
      if (rightPos > maxRight) {
        maxRight = rightPos;
      }
      leafIndex++;
      if (page.index == seekIndex) {
        seekTop = bottomPos - this.br.thumbPadding - leafMap[currentRow].height;
      }
    }

    // reset the bottom position based on thumbnails
    this.br.refs.$brPageViewEl.height(bottomPos);
    const pageViewBuffer = floor((this.br.refs.$brContainer.prop('scrollWidth') - maxRight) / 2) - 14;

    // If seekTop is defined, seeking was requested and target found
    if (typeof seekTop != 'undefined') {
      this.br.refs.$brContainer.scrollTop(seekTop);
    }
    const scrollTop = this.br.refs.$brContainer.prop('scrollTop');
    const scrollBottom = scrollTop + this.br.refs.$brContainer.height();
    let leafTop = 0;
    let leafBottom = 0;
    const rowsToDisplay = [];
    const imagesToDisplay = [];

    // Visible leafs with least/greatest index
    let leastVisible = book.getNumLeafs() - 1;
    let mostVisible = 0;

    // Determine the thumbnails in view
    for (let i = 0; i < leafMap.length; i++) {
      if (!leafMap[i]) {
        continue;
      }
      leafBottom += this.br.thumbPadding + leafMap[i].height;
      const topInView = leafTop >= scrollTop && leafTop <= scrollBottom;
      const bottomInView = leafBottom >= scrollTop && leafBottom <= scrollBottom;
      const middleInView = leafTop <= scrollTop && leafBottom >= scrollBottom;
      if (topInView || bottomInView || middleInView) {
        rowsToDisplay.push(i);
        if (leafMap[i].leafs[0].num < leastVisible) {
          leastVisible = leafMap[i].leafs[0].num;
        }
        if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
          mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
        }
      }
      if (leafTop > leafMap[i].top) {
        leafMap[i].top = leafTop;
      }
      leafTop = leafBottom;
    }
    // at this point, `rowsToDisplay` now has all the rows in view

    // create a buffer of preloaded rows before and after the visible rows
    const firstRow = rowsToDisplay[0];
    const lastRow = rowsToDisplay[rowsToDisplay.length - 1];
    for (let i = 1; i < this.br.thumbRowBuffer + 1; i++) {
      if (lastRow + i < leafMap.length) {
        rowsToDisplay.push(lastRow + i);
      }
    }
    for (let i = 1; i < this.br.thumbRowBuffer; i++) {
      if (firstRow - i >= 0) {
        rowsToDisplay.push(firstRow - i);
      }
    }
    rowsToDisplay.sort((a, b) => a - b);

    // Create the thumbnail divs and images (lazy loaded)
    for (const row of rowsToDisplay) {
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.notInArray)(row, this.br.displayedRows)) {
        if (!leafMap[row]) {
          continue;
        }
        for (const {
          num: leaf,
          left: leafLeft
        } of leafMap[row].leafs) {
          const leafWidth = this.br.thumbWidth;
          const leafHeight = floor(book.getPageHeight(leaf) * this.br.thumbWidth / book.getPageWidth(leaf));
          const leafTop = leafMap[row].top;
          let left = leafLeft + pageViewBuffer;
          if ('rl' == this.br.pageProgression) {
            left = viewWidth - leafWidth - left;
          }
          left += this.br.thumbPadding;
          imagesToDisplay.push(leaf);

          /* get thumbnail's reducer */
          const idealReduce = floor(book.getPageWidth(leaf) / this.br.thumbWidth);
          const nearestFactor2 = 2 * Math.round(idealReduce / 2);
          const thumbReduce = nearestFactor2;
          const pageContainer = this.br._createPageContainer(leaf).update({
            dimensions: {
              width: leafWidth,
              height: leafHeight,
              top: leafTop,
              left
            },
            reduce: thumbReduce
          });
          pageContainer.$container.data('leaf', leaf).on('mouseup', event => {
            // We want to suppress the fragmentChange triggers in `updateFirstIndex` and `switchMode`
            // because otherwise it repeatedly triggers listeners and we get in an infinite loop.
            // We manually trigger the `fragmentChange` once at the end.
            this.br.updateFirstIndex(leaf, {
              suppressFragmentChange: true
            });
            // as per request in webdev-4042, we want to switch 1-up mode while clicking on thumbnail leafs
            this.br.switchMode(this.br.constMode1up, {
              suppressFragmentChange: true
            });

            // shift viewModeOrder after clicking on thumbsnail leaf
            const nextModeID = this.br.viewModeOrder.shift();
            this.br.viewModeOrder.push(nextModeID);
            this.br._components.navbar.updateViewModeButton($('.viewmode'), 'twopg', 'Two-page view');
            this.br.trigger(_events_js__WEBPACK_IMPORTED_MODULE_1__.EVENTS.fragmentChange);
            event.stopPropagation();
          });
          this.br.refs.$brPageViewEl.append(pageContainer.$container);
        }
      }
    }

    // Remove thumbnails that are not to be displayed
    for (const row of this.br.displayedRows) {
      if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.notInArray)(row, rowsToDisplay)) {
        for (const {
          num: index
        } of leafMap[row]?.leafs) {
          if (!imagesToDisplay?.includes(index)) {
            this.br.$(`.pagediv${index}`)?.remove();
          }
        }
      }
    }

    // Update which page is considered current to make sure a visible page is the current one
    const currentIndex = this.br.currentIndex();
    if (currentIndex < leastVisible) {
      this.br.updateFirstIndex(leastVisible);
    } else if (currentIndex > mostVisible) {
      this.br.updateFirstIndex(mostVisible);
    }

    // remember what rows are displayed
    this.br.displayedRows = rowsToDisplay.slice();

    // remove previous highlights
    this.br.$('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');

    // highlight current page
    this.br.$('.pagediv' + this.br.currentIndex()).addClass('BRpagedivthumb_highlight');
  }

  /**
   * Replaces placeholder image with real one
   *
   * @param {$lazyLoadImgPlaceholder} imgPlaceholder
   */
  lazyLoadImage(imgPlaceholder) {
    const leaf = $(imgPlaceholder).data('leaf');
    const reduce = $(imgPlaceholder).data('reduce');
    const $img = this.br.imageCache.image(leaf, reduce);
    const $parent = $(imgPlaceholder).parent();
    /* March 16, 2021 (isa) - manually append & remove, `replaceWith` currently loses closure scope */
    $($parent).append($img);
    $(imgPlaceholder).remove();
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    const oldColumns = this.br.thumbColumns;
    switch (direction) {
      case 'in':
        this.br.thumbColumns -= 1;
        break;
      case 'out':
        this.br.thumbColumns += 1;
        break;
      default:
        console.error(`Unsupported direction: ${direction}`);
    }

    // Limit zoom in/out columns
    this.br.thumbColumns = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp)(this.br.thumbColumns, this.br.options.thumbMinZoomColumns, this.br.options.thumbMaxZoomColumns);
    if (this.br.thumbColumns != oldColumns) {
      this.br.displayedRows = []; /* force a gallery redraw */
      this.prepare();
    }
  }

  /**
   * Returns the width per thumbnail to display the requested number of columns
   * Note: #BRpageview must already exist since its width is used to calculate the
   *       thumbnail width
   * @param {number} thumbnailColumns
   */
  getThumbnailWidth(thumbnailColumns) {
    const DEFAULT_THUMBNAIL_WIDTH = 100;
    const padding = (thumbnailColumns + 1) * this.br.thumbPadding;
    const width = (this.br.refs.$brPageViewEl.width() - padding) / (thumbnailColumns + 0.5); // extra 0.5 is for some space at sides
    const idealThumbnailWidth = Math.floor(width);
    return idealThumbnailWidth > 0 ? idealThumbnailWidth : DEFAULT_THUMBNAIL_WIDTH;
  }
  prepare() {
    this.br.refs.$brContainer.empty();
    this.br.refs.$brContainer.css({
      overflowY: 'scroll',
      overflowX: 'auto'
    });
    this.br.refs.$brPageViewEl = $("<div class='BRpageview'></div>");
    this.br.refs.$brContainer.append(this.br.refs.$brPageViewEl);
    this.dragScrollable = this.dragScrollable || new _DragScrollable_js__WEBPACK_IMPORTED_MODULE_2__.DragScrollable(this.br.refs.$brContainer[0], {
      preventDefault: true
    });
    this.br.bindGestures(this.br.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // disableSelect(this.br.$('#BRpageview'));
    this.br.thumbWidth = this.getThumbnailWidth(this.br.thumbColumns);
    this.br.reduce = this.book.getPageWidth(0) / this.br.thumbWidth;
    this.br.displayedRows = [];
    // Draw leafs with current index directly in view (no animating to the index)
    this.drawLeafs(this.br.currentIndex());
    this.br.updateBrClasses();
  }

  /**
   * @param {PageIndex} index
   */
  jumpToIndex(index) {
    const {
      floor
    } = Math;
    const {
      book
    } = this;
    const viewWidth = this.br.refs.$brContainer.prop('scrollWidth') - 20; // width minus buffer
    const leafWidth = this.br.thumbWidth;
    let leafTop = 0;
    let rightPos = 0;
    let bottomPos = 0;
    let rowHeight = 0;
    let leafIndex = 0;
    for (let i = 0; i <= index; i++) {
      if (rightPos + (leafWidth + this.br.thumbPadding) > viewWidth) {
        rightPos = 0;
        rowHeight = 0;
        leafIndex = 0;
      }
      const leafHeight = floor(book.getPageHeight(leafIndex) * this.br.thumbWidth / book.getPageWidth(leafIndex));
      if (leafHeight > rowHeight) {
        rowHeight = leafHeight;
      }
      if (leafIndex == 0) {
        leafTop = bottomPos;
        bottomPos += this.br.thumbPadding + rowHeight;
      }
      rightPos += leafWidth + this.br.thumbPadding;
      leafIndex++;
    }
    this.br.updateFirstIndex(index);
    if (this.br.refs.$brContainer.prop('scrollTop') == leafTop) {
      this.br.drawLeafs();
    } else {
      this.br.animating = true;
      this.br.refs.$brContainer.stop(true).animate({
        scrollTop: leafTop
      }, 'fast', () => {
        this.br.animating = false;
      });
    }
  }
}

/***/ }),

/***/ "./src/BookReader/Navbar/Navbar.js":
/*!*****************************************!*\
  !*** ./src/BookReader/Navbar/Navbar.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Navbar: function() { return /* binding */ Navbar; },
/* harmony export */   getNavPageNumHtml: function() { return /* binding */ getNavPageNumHtml; }
/* harmony export */ });
/* harmony import */ var jquery_ui_ui_widget_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jquery-ui/ui/widget.js */ "./node_modules/jquery-ui/ui/widget.js");
/* harmony import */ var jquery_ui_ui_widget_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jquery_ui_ui_widget_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var jquery_ui_ui_widgets_mouse_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jquery-ui/ui/widgets/mouse.js */ "./node_modules/jquery-ui/ui/widgets/mouse.js");
/* harmony import */ var jquery_ui_ui_widgets_mouse_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(jquery_ui_ui_widgets_mouse_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var jquery_ui_ui_widgets_slider_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jquery-ui/ui/widgets/slider.js */ "./node_modules/jquery-ui/ui/widgets/slider.js");
/* harmony import */ var jquery_ui_ui_widgets_slider_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(jquery_ui_ui_widgets_slider_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../events.js */ "./src/BookReader/events.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils.js */ "./src/BookReader/utils.js");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
/** @typedef {import("../../BookReader.js").default} BookReader */






class Navbar {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    this.br = br;

    /** @type {JQuery} */
    this.$root = null;
    /** @type {JQuery} */
    this.$nav = null;
    /** @type {number} */
    this.maxPageNum = null;

    /** @type {Object} controls will be switch over "this.maximumControls" */
    this.minimumControls = ['viewmode'];
    /** @type {Object} controls will be switch over "this.minimumControls" */
    this.maximumControls = ['book_left', 'book_right', 'zoom_in', 'zoom_out', 'onepg', 'twopg', 'thumb'];
    this.updateNavIndexThrottled = (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.throttle)(this.updateNavIndex.bind(this), 250, false);
  }
  controlFor(controlName) {
    const option = this.br.options.controls[controlName];
    if (!option.visible) {
      return '';
    }
    if (option.template) {
      return `<li>${option.template(this.br)}</li>`;
    }
    return `<li>
      <button class="BRicon ${option.className}" title="${option.label}">
        <div class="icon icon-${option.iconClassName}"></div>
        <span class="BRtooltip">${option.label}</span>
      </button>
    </li>`;
  }

  /** @private */
  _renderControls() {
    return ['bookLeft', 'bookRight', 'onePage', 'twoPage', 'thumbnail', 'viewmode', 'zoomOut', 'zoomIn', 'fullScreen'].map(mode => this.controlFor(mode)).join('');
  }

  /** @private */
  _bindViewModeButton() {
    const {
      br
    } = this;
    const viewModeOptions = br.options.controls.viewmode;
    const viewModes = [{
      mode: br.constMode1up,
      className: 'onepg',
      title: 'One-page view'
    }, {
      mode: br.constMode2up,
      className: 'twopg',
      title: 'Two-page view'
    }, {
      mode: br.constModeThumb,
      className: 'thumb',
      title: 'Thumbnail view'
    }].filter(mode => !viewModeOptions.excludedModes.includes(mode.mode));
    const viewModeOrder = viewModes.map(m => m.mode);
    if (viewModeOptions.excludedModes.includes(br.mode)) {
      br.switchMode(viewModeOrder[0]);
    }

    // Reorder the viewModeOrder so the current view mode is at the end
    const currentModeIndex = viewModeOrder.indexOf(br.mode);
    for (let i = 0; i <= currentModeIndex; i++) {
      viewModeOrder.push(viewModeOrder.shift());
    }
    if (viewModes.length < 2) {
      this.$nav.find(`.${viewModeOptions.className}`).remove();
    }
    this.br.bind(_events_js__WEBPACK_IMPORTED_MODULE_3__.EVENTS.PostInit, () => {
      const $button = this.$nav.find(`.${viewModeOptions.className}`).off('.bindNavigationHandlers').on('click', e => {
        const nextModeID = viewModeOrder.shift();
        const newViewMode = viewModes.find(m => m.mode === nextModeID);
        const nextViewMode = viewModes.find(m => m.mode === viewModeOrder[0]);
        viewModeOrder.push(nextModeID);
        br.viewModeOrder = viewModeOrder;
        this.updateViewModeButton($(e.currentTarget), nextViewMode.className, nextViewMode.title);
        br.switchMode(newViewMode.mode);
      });
      const currentViewModeButton = viewModes.find(m => m.mode === viewModeOrder[0]);
      this.updateViewModeButton($button, currentViewModeButton.className, currentViewModeButton.title);
    });
  }

  /**
   * Toggle viewmode button to change page view
   */
  updateViewModeButton($button, iconClass, tooltipText) {
    $button.attr('title', tooltipText).find('.icon').removeClass().addClass(`icon icon-${iconClass}`).end().find('.BRtooltip').text(tooltipText);
  }

  /**
   * Switch navbar controls on mobile and desktop
   */
  switchNavbarControls() {
    if (this.br.refs.$brContainer.prop('clientWidth') < 640) {
      this.showMinimumNavPageNum();
      // we don't want navbar controls switching with liner-notes
      if (this.br.options.bookType !== 'linerNotes') {
        this.showMinimumNavbarControls();
      }
    } else {
      this.showMaximumNavPageNum();
      // we don't want navbar controls switching with liner-notes
      if (this.br.options.bookType !== 'linerNotes') {
        this.showMaximumNavbarControls();
      }
    }
  }

  /**
   * Switch Book Nav page number display to minimum/mobile
   */
  showMinimumNavPageNum() {
    const minElement = document.querySelector('.BRcurrentpage.BRmin');
    const maxElement = document.querySelector('.BRcurrentpage.BRmax');
    if (minElement) minElement.classList.remove('hide');
    if (maxElement) maxElement.classList.add('hide');
  }

  /**
   * Switch Book Nav page number display to maximum/desktop
   */
  showMaximumNavPageNum() {
    const minElement = document.querySelector('.BRcurrentpage.BRmin');
    const maxElement = document.querySelector('.BRcurrentpage.BRmax');
    if (minElement) minElement.classList.add('hide');
    if (maxElement) maxElement.classList.remove('hide');
  }

  /**
   * Switch Book Navbar controls to minimised
   * NOTE: only `this.minimumControls` and `this.maximumControls` switch on resize
   */
  showMinimumNavbarControls() {
    this.minimumControls.forEach(control => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.maximumControls.forEach(control => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.add('hide');
    });
  }

  /**
   * Switch Book Navbar controls to maximized
   * NOTE: only `this.minimumControls` and `this.maximumControls` switch on resize
   */
  showMaximumNavbarControls() {
    this.maximumControls.forEach(control => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.minimumControls.forEach(control => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.add('hide');
    });
  }

  /**
   * Initialize the navigation bar (bottom)
   * @return {JQuery}
   */
  init() {
    const {
      br
    } = this;
    const {
      navbarTitle: title
    } = br.options;
    const isRTL = br.pageProgression === 'rl';
    const bookFlipLeft = isRTL ? 'book_flip_next' : 'book_flip_prev';
    const bookFlipRight = isRTL ? 'book_flip_prev' : 'book_flip_next';
    this.br.options.controls['bookLeft'].className = `book_left ${bookFlipLeft}`;
    this.br.options.controls['bookRight'].className = `book_right ${bookFlipRight}`;
    br.refs.$BRfooter = this.$root = $(`<div class="BRfooter"></div>`);
    br.refs.$BRnav = this.$nav = $(`<div class="BRnav BRnavDesktop">
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <nav class="BRcontrols">
            <ul class="controls">
              <li class="scrubber">
                <div class="BRnavpos">
                  <div class="BRpager"></div>
                  <div class="BRnavline"></div>
                </div>
                <p>
                  <span class="BRcurrentpage BRmax"></span>
                  <span class="BRcurrentpage BRmin"></span>
                </p>
              </li>
              ${this._renderControls()}
            </ul>
          </nav>
        </div>`);
    this.$root.append(this.$nav);
    br.refs.$br.append(this.$root);
    const $slider = this.$root.find('.BRpager').slider({
      animate: true,
      min: 0,
      max: br.book.getNumLeafs() - 1,
      value: br.currentIndex(),
      range: "min"
    });
    $slider.on('slide', (event, ui) => {
      this.updateNavPageNum(ui.value);
      return true;
    });
    $slider.on('slidechange', (event, ui) => {
      this.updateNavPageNum(ui.value);
      // recursion prevention for jumpToIndex
      if ($slider.data('swallowchange')) {
        $slider.data('swallowchange', false);
      } else {
        br.jumpToIndex(ui.value);
      }
      return true;
    });
    br.options.controls.viewmode.visible && this._bindViewModeButton();
    this.updateNavPageNum(br.currentIndex());
    return this.$nav;
  }

  /**
  * Returns the textual representation of the current page for the navbar
  * @param {number} index
  * @param {boolean} [useMaxFormat = false]
  * @return {string}
  */
  getNavPageNumString(index, useMaxFormat = false) {
    const {
      br
    } = this;
    // Accessible index starts at 0 (alas) so we add 1 to make human
    const pageNum = br.book.getPageNum(index);
    const pageType = br.book.getPageProp(index, 'pageType');
    const numLeafs = br.book.getNumLeafs();
    if (!this.maxPageNum) {
      // Calculate Max page num (used for pagination display)
      let maxPageNum = 0;
      let pageNumVal;
      for (let i = 0; i < numLeafs; i++) {
        pageNumVal = parseFloat(br.book.getPageNum(i));
        if (!isNaN(pageNumVal) && pageNumVal > maxPageNum) {
          maxPageNum = pageNumVal;
        }
      }
      this.maxPageNum = maxPageNum;
    }
    return getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.maxPageNum, useMaxFormat);
  }

  /**
   * Renders the navbar string to the DOM
   * @param {number} index
   */
  updateNavPageNum(index) {
    this.$root.find('.BRcurrentpage.BRmax').html(this.getNavPageNumString(index, true));
    this.$root.find('.BRcurrentpage.BRmin').html(this.getNavPageNumString(index));
  }

  /**
   * Update the nav bar display - does not cause navigation.
   * @param {number} index
   */
  updateNavIndex(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.br.currentIndex();
    this.$root.find('.BRpager').data('swallowchange', true).slider('value', index);
  }
}

/**
 * Renders the html for the page string
 * @param {number} index
 * @param {number} numLeafs
 * @param {number|string} pageNum
 * @param {*} pageType - Deprecated
 * @param {number} maxPageNum
 * @param {boolean} [useMaxFormat = false]
 * @return {string}
 */
function getNavPageNumHtml(index, numLeafs, pageNum, pageType, maxPageNum, useMaxFormat = false) {
  const pageIsAsserted = pageNum[0] != 'n';
  const pageIndex = index + 1;
  if (!pageIsAsserted) {
    pageNum = '—';
  }
  if (useMaxFormat === true) {
    return `Page ${pageNum} (${pageIndex}/${numLeafs})`;
  }
  if (!pageIsAsserted) {
    return `(${pageIndex} of ${numLeafs})`;
  }
  const bookLengthLabel = maxPageNum && parseFloat(pageNum) ? ` of ${maxPageNum}` : '';
  return `${pageNum}${bookLengthLabel}`;
}

/***/ }),

/***/ "./src/BookReader/PageContainer.js":
/*!*****************************************!*\
  !*** ./src/BookReader/PageContainer.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PageContainer: function() { return /* binding */ PageContainer; },
/* harmony export */   boxToSVGRect: function() { return /* binding */ boxToSVGRect; },
/* harmony export */   createDIVPageLayer: function() { return /* binding */ createDIVPageLayer; },
/* harmony export */   createSVGPageLayer: function() { return /* binding */ createSVGPageLayer; },
/* harmony export */   renderBoxesInPageContainerLayer: function() { return /* binding */ renderBoxesInPageContainerLayer; }
/* harmony export */ });
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
// @ts-check
/** @typedef {import('./BookModel.js').PageModel} PageModel */
/** @typedef {import('./ImageCache.js').ImageCache} ImageCache */

class PageContainer {
  /**
   * @param {PageModel} page
   * @param {object} opts
   * @param {boolean} opts.isProtected Whether we're in a protected book
   * @param {ImageCache} opts.imageCache
   * @param {string} opts.loadingImage
   */
  constructor(page, {
    isProtected,
    imageCache,
    loadingImage
  }) {
    this.page = page;
    this.imageCache = imageCache;
    this.loadingImage = loadingImage;
    this.$container = $('<div />', {
      'class': `BRpagecontainer ${page ? `pagediv${page.index}` : 'BRemptypage'}`,
      css: {
        position: 'absolute'
      }
    }).attr('data-side', page?.pageSide);
    if (isProtected) {
      this.$container.append($('<div class="BRscreen" />'));
      this.$container.addClass('protected');
    }

    /** @type {JQuery<HTMLImageElement>} The main book page image */
    this.$img = null;
  }

  /**
   * @param {object} param0
   * @param {{ width: number, height: number, top: number, left: number }} [param0.dimensions]
   * @param {number} param0.reduce
   */
  update({
    dimensions = null,
    reduce = null
  }) {
    if (dimensions) {
      this.$container.css(dimensions);
    }
    if (reduce == null || !this.page) {
      return;
    }
    const alreadyLoaded = this.imageCache.imageLoaded(this.page.index, reduce);
    const nextBestLoadedReduce = !alreadyLoaded && this.imageCache.getBestLoadedReduce(this.page.index, reduce);

    // Create high res image
    const $newImg = this.imageCache.image(this.page.index, reduce);

    // Avoid removing/re-adding the image if it's already there
    // This can be called quite a bit, so we need to be fast
    if (this.$img?.[0].src == $newImg[0].src) {
      return this;
    }
    this.$img?.remove();
    this.$img = $newImg.prependTo(this.$container);
    const backgroundLayers = [];
    if (!alreadyLoaded) {
      this.$container.addClass('BRpageloading');
      backgroundLayers.push(`url("${this.loadingImage}") center/20px no-repeat`);
    }
    if (nextBestLoadedReduce) {
      backgroundLayers.push(`url("${this.page.getURI(nextBestLoadedReduce, 0)}") center/100% 100% no-repeat`);
    }
    if (!alreadyLoaded) {
      this.$img.css('background', backgroundLayers.join(',')).one('loadend', async ev => {
        $(ev.target).css({
          'background': ''
        });
        $(ev.target).parent().removeClass('BRpageloading');
      });
    }
    return this;
  }
}

/**
 * @param {PageModel} page
 * @param {string} className
 */
function createSVGPageLayer(page, className) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", `0 0 ${page.width} ${page.height}`);
  svg.setAttribute('class', `BRPageLayer ${className}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  return svg;
}

/**
 * @param {PageModel} page
 * @param {string} className
 */
function createDIVPageLayer(page, className) {
  const div = document.createElement("div");
  div.style.width = `${page.width}px`;
  div.style.height = `${page.height}px`;
  div.setAttribute('class', `BRPageLayer ${className}`);
  return div;
}

/**
 * @param {{ l: number, r: number, b: number, t: number }} box
 */
function boxToSVGRect({
  l: left,
  r: right,
  b: bottom,
  t: top
}) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", left.toString());
  rect.setAttribute("y", top.toString());
  rect.setAttribute("width", (right - left).toString());
  rect.setAttribute("height", (bottom - top).toString());

  // Some style; corner radius 4px. Can't set this in CSS yet
  rect.setAttribute("rx", "4");
  rect.setAttribute("ry", "4");
  return rect;
}

/**
 * @param {string} layerClass
 * @param {Array<{ l: number, r: number, b: number, t: number }>} boxes
 * @param {PageModel} page
 * @param {HTMLElement} containerEl
 * @param {string[]} [rectClasses] CSS classes to add to the rects
 */
function renderBoxesInPageContainerLayer(layerClass, boxes, page, containerEl, rectClasses = null) {
  const mountedSvg = containerEl.querySelector(`.${layerClass}`);
  // Create the layer if it's not there
  const svg = mountedSvg || createSVGPageLayer(page, layerClass);
  if (!mountedSvg) {
    // Insert after the image if the image is already loaded.
    const imgEl = containerEl.querySelector('.BRpageimage');
    if (imgEl) $(svg).insertAfter(imgEl);else $(svg).prependTo(containerEl);
  }
  for (const [i, box] of boxes.entries()) {
    const rect = boxToSVGRect(box);
    if (rectClasses) {
      rect.setAttribute('class', rectClasses[i]);
    }
    svg.appendChild(rect);
  }
}

/***/ }),

/***/ "./src/BookReader/ReduceSet.js":
/*!*************************************!*\
  !*** ./src/BookReader/ReduceSet.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IntegerReduceSet: function() { return /* binding */ IntegerReduceSet; },
/* harmony export */   NAMED_REDUCE_SETS: function() { return /* binding */ NAMED_REDUCE_SETS; },
/* harmony export */   Pow2ReduceSet: function() { return /* binding */ Pow2ReduceSet; }
/* harmony export */ });
/**
 * @typedef {object} ReduceSet Set of valid numbers for a reduce variable.
 * @property {(n: number) => number} floor
 * @property {(n: number) => number} decr Return the predecessor of the given element
 */

/** @type {ReduceSet} */
const IntegerReduceSet = {
  floor: Math.floor,
  decr(n) {
    return n - 1;
  }
};

/** @type {ReduceSet} */
const Pow2ReduceSet = {
  floor(n) {
    return 2 ** Math.floor(Math.log2(Math.max(1, n)));
  },
  decr(n) {
    return 2 ** (Math.log2(n) - 1);
  }
};
const NAMED_REDUCE_SETS = {
  pow2: Pow2ReduceSet,
  integer: IntegerReduceSet
};

/***/ }),

/***/ "./src/BookReader/Toolbar/Toolbar.js":
/*!*******************************************!*\
  !*** ./src/BookReader/Toolbar/Toolbar.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Toolbar: function() { return /* binding */ Toolbar; },
/* harmony export */   createPopup: function() { return /* binding */ createPopup; }
/* harmony export */ });
/* harmony import */ var jquery_colorbox__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jquery-colorbox */ "./node_modules/jquery-colorbox/jquery.colorbox.js");
/* harmony import */ var jquery_colorbox__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jquery_colorbox__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils.js */ "./src/BookReader/utils.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events.js */ "./src/BookReader/events.js");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");



/** @typedef {import("../../BookReader.js").default} BookReader */

class Toolbar {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    this.br = br;
  }

  /**
   * This method builds the html for the toolbar. It can be decorated to extend
   * the toolbar.
   * @return {JQuery}
   */
  buildToolbarElement() {
    const {
      br
    } = this;
    const logoHtml = !br.showLogo ? '' : `
      <span class="BRtoolbarSection BRtoolbarSectionLogo">
        <a class="logo" href="${br.logoURL}"></a>
      </span>`;

    // Add large screen navigation
    br.refs.$BRtoolbar = $(`
      <div class="BRtoolbar header">
        <div class="BRtoolbarbuttons">
          <div class="BRtoolbarLeft">
            ${logoHtml}
            <span class="BRtoolbarSection BRtoolbarSectionTitle"></span>
          </div>
          <div class="BRtoolbarRight">
            <span class="BRtoolbarSection BRtoolbarSectionInfo">
              <button class="BRpill info js-tooltip">Info</button>
              <button class="BRpill share js-tooltip">Share</button>
            </span>
          </div>
        </div>
      </div>`);
    // TODO actual hamburger menu
    // <span class="BRtoolbarSection BRtoolbarSectionMenu">
    //   <button class="BRpill BRtoolbarHamburger">
    //     <img src="${br.imagesBaseURL}icon_hamburger.svg" />
    //     <div class="BRhamburgerDrawer"><ul><li>hi</li></ul></div>
    //   </button>
    // </span>

    const $titleSectionEl = br.refs.$BRtoolbar.find('.BRtoolbarSectionTitle');
    if (br.bookUrl && br.options.enableBookTitleLink) {
      $titleSectionEl.append($('<a>').attr({
        href: br.bookUrl,
        title: br.bookUrlTitle
      }).addClass('BRreturn').html(br.bookUrlText || br.bookTitle));
    } else if (br.bookTitle) {
      $titleSectionEl.append(br.bookUrlText || br.bookTitle);
    }

    // const $hamburger = br.refs.$BRtoolbar.find('BRtoolbarHamburger');
    return br.refs.$BRtoolbar;
  }

  /**
   * Initializes the toolbar (top)
   * @param {string} mode
   * @param {string} ui
   */
  initToolbar(mode, ui) {
    const {
      br
    } = this;
    br.refs.$br.append(this.buildToolbarElement());
    br.$('.BRnavCntl').addClass('BRup');
    br.$('.pause').hide();

    // We build in mode 2
    br.refs.$BRtoolbar.append();

    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if (!br.canSwitchToMode(br.constMode2up)) {
      br.$('.two_page_mode, .play, .pause').hide();
    }
    if (!br.canSwitchToMode(br.constModeThumb)) {
      br.$('.thumbnail_mode').hide();
    }

    // Hide one page button if it is the only mode available
    if (!(br.canSwitchToMode(br.constMode2up) || br.canSwitchToMode(br.constModeThumb))) {
      br.$('.one_page_mode').hide();
    }
    $('<div style="display: none;"></div>').append(blankShareDiv()).append(blankInfoDiv()).appendTo(br.refs.$br);
    br.$('.BRinfo .BRfloatTitle a').attr({
      href: br.bookUrl
    }).text(br.bookTitle).addClass('title');

    // These functions can be overridden
    this.buildInfoDiv(br.$('.BRinfo'));
    this.buildShareDiv(br.$('.BRshare'));
    br.$('.share').colorbox({
      inline: true,
      opacity: "0.5",
      href: br.$('.BRshare'),
      onLoad: () => {
        br.trigger(_events_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.stop);
        br.$('.BRpageviewValue').val(window.location.href);
      }
    });
    br.$('.info').colorbox({
      inline: true,
      opacity: "0.5",
      href: br.$('.BRinfo'),
      onLoad: () => {
        br.trigger(_events_js__WEBPACK_IMPORTED_MODULE_2__.EVENTS.stop);
      }
    });
  }

  /**
   * @param {JQuery} $shareDiv
   */
  buildShareDiv($shareDiv) {
    const {
      br
    } = this;
    const pageView = document.location + '';
    const bookView = (pageView + '').replace(/#.*/, '');
    const embedHtml = !br.getEmbedCode ? '' : `
      <div class="share-embed">
        <p class="share-embed-prompt">Copy and paste one of these options to share this book elsewhere.</p>
        <form method="post" action="">
          <fieldset class="fieldset-share-pageview">
            <label for="pageview">Link to this page view</label>
            <input type="text" name="pageview" class="BRpageviewValue" value="${pageView}"/>
          </fieldset>
          <fieldset class="fieldset-share-book-link">
            <label for="booklink">Link to the book</label>
            <input type="text" name="booklink" class="booklink" value="${bookView}"/>
          </fieldset>
          <fieldset class="fieldset-embed">
            <label for="iframe">Embed a mini Book Reader</label>
            <fieldset class="sub">
              <label class="sub">
                <input type="radio" name="pages" value="${br.constMode1up}" checked="checked"/>
                1 page
              </label>
              <label class="sub">
                <input type="radio" name="pages" value="${br.constMode2up}"/>
                2 pages
              </label>
              <label class="sub">
                <input type="checkbox" name="thispage" value="thispage"/>
                Open to this page?
              </label>
            </fieldset>
            <textarea cols="30" rows="4" name="iframe" class="BRframeEmbed"></textarea>
          </fieldset>
        </form>
      </div>`;
    const $form = $(`
      <div class="share-title">Share this book</div>
      <div class="share-social">
        <label class="sub open-to-this-page">
          <input class="thispage-social" type="checkbox" />
          Open to this page?
        </label>
        <button class="BRaction share facebook-share-button">
          <i class="BRicon fb"></i>Facebook
        </button>
        <button class="BRaction share twitter-share-button">
          <i class="BRicon twitter"></i>Twitter
        </button>
        <button class="BRaction share email-share-button">
          <i class="BRicon email"></i>Email
        </button>
      </div>
      ${embedHtml}
      <div class="BRfloatFoot">
        <button class="share-finished" type="button" onclick="$.fn.colorbox.close();">
          Finished
        </button>
      </div>
    `);
    $form.appendTo($shareDiv);
    $form.find('.fieldset-embed input').on('change', event => {
      const form = $(event.target).parents('form').first();
      const params = {};
      params.mode = $(form.find('.fieldset-embed input[name=pages]:checked')).val();
      if (form.find('.fieldset-embed input[name=thispage]').prop('checked')) {
        params.page = br.book.getPageNum(br.currentIndex());
      }
      if (br.getEmbedCode) {
        // $$$ changeable width/height to be added to share UI
        const frameWidth = "480px";
        const frameHeight = "430px";
        form.find('.BRframeEmbed').val(br.getEmbedCode(frameWidth, frameHeight, params));
      }
    });
    $form.find('input, textarea').on('focus', event => event.target.select());

    // Bind share buttons

    // Use url without hashes
    $form.find('.facebook-share-button').on("click", () => {
      const params = $.param({
        u: this._getSocialShareUrl()
      });
      const url = 'https://www.facebook.com/sharer.php?' + params;
      createPopup(url, 600, 400, 'Share');
    });
    $form.find('.twitter-share-button').on("click", () => {
      const params = $.param({
        url: this._getSocialShareUrl(),
        text: br.bookTitle
      });
      const url = 'https://twitter.com/intent/tweet?' + params;
      createPopup(url, 600, 400, 'Share');
    });
    $form.find('.email-share-button').on("click", () => {
      const body = `${br.bookTitle}\n\n${this._getSocialShareUrl()}`;
      window.location.href = `mailto:?subject=${encodeURI(br.bookTitle)}&body=${encodeURI(body)}`;
    });
    $form.find('input[name=thispage]').trigger('change');
    $form.appendTo($shareDiv);
  }
  _getSocialShareUrl() {
    const {
      br
    } = this;
    const shareThisPage = br.$('.thispage-social').prop('checked');
    if (shareThisPage) {
      return window.location.href;
    } else {
      return `${document.location.protocol}//${window.location.hostname}${window.location.pathname}`;
    }
  }

  /**
   * @param {JQuery} $infoDiv DOM element. Appends info to this element
   * Can be overridden or extended
   */
  buildInfoDiv($infoDiv) {
    const {
      br
    } = this;
    // Remove these legacy elements
    $infoDiv.find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();
    const $leftCol = $(`<div class="BRinfoLeftCol"></div>`);
    if (br.thumbnail) {
      $leftCol.append($(`
        <div class="BRimageW">
          <img src="${br.thumbnail}" alt="${(0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.escapeHTML)(br.bookTitle)}" />
        </div>`));
    }
    const $rightCol = $(`<div class="BRinfoRightCol">`);

    // A loop to build fields
    for (const {
      extraValueClass = '',
      label,
      value
    } of br.metadata) {
      const escapedValue = label === 'Title' ? (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.escapeHTML)(value) : value;
      $rightCol.append($(`
        <div class="BRinfoValueWrapper">
          <div class="BRinfoLabel">${label}</div>
          <div class="BRinfoValue ${extraValueClass}">${escapedValue}</div>
        </div>`));
    }
    const moreInfoText = br.bookUrlMoreInfo ? br.bookUrlMoreInfo : br.bookTitle;
    if (moreInfoText && br.bookUrl) {
      $rightCol.append($(`
        <div class="BRinfoValueWrapper">
          <div class="BRinfoMoreInfoWrapper">
            <a class="BRinfoMoreInfo" href="${br.bookUrl}">
              ${(0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.escapeHTML)(moreInfoText)}
            </a>
          </div>
        </div>`));
    }
    const $footer = $(`<div class="BRfloatFoot BRinfoFooter"></div>`);
    const $children = $('<div class="BRinfoW mv20-lg">').append([$leftCol, $rightCol, $('<br style="clear:both"/>')]);
    $infoDiv.append($children, $footer).addClass('wide');
  }

  /**
   * @return {number} (in pixels) of the toolbar height. 0 if no toolbar.
   */
  getToolBarHeight() {
    const {
      $BRtoolbar
    } = this.br.refs;
    if ($BRtoolbar && $BRtoolbar.css('display') === 'block') {
      return $BRtoolbar.outerHeight() + parseInt($BRtoolbar.css('top'));
    } else {
      return 0;
    }
  }
}
function blankInfoDiv() {
  return $(`
    <div class="BRfloat BRinfo">
      <div class="BRfloatHead">About this book
        <button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="br-colorbox-shift">Close</span></button>
      </div>
      <div class="BRfloatBody">
        <div class="BRfloatCover"></div>
        <div class="BRfloatMeta">
          <div class="BRfloatTitle">
            <h2><a /></h2>
          </div>
        </div>
      </div>
      <div class="BRfloatFoot">
        <a href="https://openlibrary.org/dev/docs/bookreader">About the BookReader</a>
      </div>
    </div>`);
}
function blankShareDiv() {
  return $(`
    <div class="BRfloat BRshare">
      <div class="BRfloatHead">
        Share
        <button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="br-colorbox-shift">Close</span></button>
      </div>
    </div>`);
}

/**
 * Helper opens a popup window. On mobile it only opens a new tab. Used for share.
 * @param {string} href
 * @param {number} width
 * @param {number} height
 * @param {string} name
 */
function createPopup(href, width, height, name) {
  // Fixes dual-screen position
  const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
  const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
  const win_w = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const win_h = window.innerHeight || document.documentElement.clientHeight || screen.height;
  const left = win_w / 2 - width / 2 + dualScreenLeft;
  const top = win_h / 2 - height / 2 + dualScreenTop;
  const opts = `status=1,width=${width},height=${height},top=${top},left=${left}`;
  window.open(href, name, opts);
}

/***/ }),

/***/ "./src/BookReader/events.js":
/*!**********************************!*\
  !*** ./src/BookReader/events.js ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EVENTS: function() { return /* binding */ EVENTS; }
/* harmony export */ });
/** @enum {string} */
const EVENTS = {
  /** Indicates that the fragment (a serialization of the reader
   * state) has changed. */
  fragmentChange: 'fragmentChange',
  pageChanged: 'pageChanged',
  PostInit: 'PostInit',
  stop: 'stop',
  resize: 'resize',
  userAction: 'userAction',
  // event to know if user is actively reading
  // menu click events
  fullscreenToggled: 'fullscreenToggled',
  zoomOut: 'zoomOut',
  zoomIn: 'zoomIn',
  '1PageViewSelected': '1PageViewSelected',
  '2PageViewSelected': '2PageViewSelected',
  /* currently 3 represents thumbnail view */
  '3PageViewSelected': '3PageViewSelected'
};

/***/ }),

/***/ "./src/BookReader/options.js":
/*!***********************************!*\
  !*** ./src/BookReader/options.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_OPTIONS: function() { return /* binding */ DEFAULT_OPTIONS; },
/* harmony export */   OptionsParseError: function() { return /* binding */ OptionsParseError; }
/* harmony export */ });
// @ts-check
/** @typedef {import('./BookModel.js').PageNumString} PageNumString */
/** @typedef {import('./BookModel.js').LeafNum} LeafNum */

const DEFAULT_OPTIONS = {
  /**
   * @type {string} A string, such as "mode/1up". See
   * http://openlibrary.org/dev/docs/bookurls for valid syntax
   */
  defaults: null,
  /** Padding in 1up */
  padding: 10,
  /** @type {'full' | 'embed' | 'responsive'} UI mode */
  ui: 'full',
  /** Controls whether nav/toolbar will autohide */
  uiAutoHide: false,
  /** thumbnail mode */
  /** number of rows to pre-cache out a view */
  thumbRowBuffer: 1,
  thumbColumns: 6,
  /** number of thumbnails to load at once */
  thumbMaxLoading: 4,
  /** spacing between thumbnails */
  thumbPadding: 10,
  /** min zoom in columns */
  thumbMinZoomColumns: 2,
  /** max zoom out columns */
  thumbMaxZoomColumns: 8,
  /** @type {number | 'fast' | 'slow'} speed for flip animation */
  flipSpeed: 400,
  showToolbar: true,
  showNavbar: true,
  navBarTitle: '',
  showLogo: true,
  /** Where the logo links to */
  logoURL: 'https://archive.org',
  /**
   * Base URL for UI images - should be overridden (before init) by
   * custom implementations.
   * $$$ This is the same directory as the images referenced by relative
   *     path in the CSS.  Would be better to automagically find that path.
   */
  imagesBaseURL: '/BookReader/images/',
  /** @type {'pow2' | 'integer'} What reduces are valid for getURI. */
  reduceSet: 'pow2',
  /**
   * Zoom levels
   * @type {ReductionFactor[]}
   * $$$ provide finer grained zooming, {reduce: 8, autofit: null}, {reduce: 16, autofit: null}
   * The autofit code ensures that fit to width and fit to height will be available
   */
  reductionFactors: [{
    reduce: 0.25,
    autofit: null
  }, {
    reduce: 0.5,
    autofit: null
  }, {
    reduce: 1,
    autofit: null
  }, {
    reduce: 2,
    autofit: null
  }, {
    reduce: 3,
    autofit: null
  }, {
    reduce: 4,
    autofit: null
  }, {
    reduce: 6,
    autofit: null
  }],
  /** Object to hold parameters related to 1up mode */
  onePage: {
    /** @type {AutoFitValues} */
    autofit: 'auto'
  },
  /** Object to hold parameters related to 2up mode */
  twoPage: {
    /** Width of cover */
    coverInternalPadding: 0,
    /** Padding outside of cover */
    coverExternalPadding: 0,
    /** Width of book spine  $$$ consider sizing based on book length */
    bookSpineDivWidth: 64,
    /** @type {AutoFitValues} */
    autofit: 'auto'
  },
  onePageMinBreakpoint: 800,
  bookTitle: '',
  /** @type {string} */
  bookUrl: null,
  /** @type {string} */
  bookUrlText: null,
  /** @type {string} */
  bookUrlTitle: null,
  enableBookTitleLink: true,
  /**
   * @type {string} language in ISO 639-1 (PRIVATE: Will also
   * handle language name in English, native name, 639-2/T, or 639-2/B . (archive.org books
   * appear to use 639-2/B ? But I don't think that's a guarantee). See
   * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes ) */
  bookLanguage: null,
  /**
   * @type {Array<{label: string, value: *, extraValueClass: string?}>}
   * Fields used to populate the info window
   * @example [
   *   {label: 'Title', value: 'Open Library BookReader Presentation'},
   *   {label: 'Author', value: 'Internet Archive'},
   *   {label: 'Demo Info', value: 'This demo shows how one could use BookReader with their own content.'},
   * ]
   **/
  metadata: [],
  /** @type {string} */
  thumbnail: null,
  /** @type {string} */
  bookUrlMoreInfo: null,
  /** Experimental Controls (eg b/w) */
  enableExperimentalControls: false,
  /** CSS selectors */
  /** Where BookReader mounts to */
  el: '#BookReader',
  /** @type {'lr' | 'rl'} Page progression */
  pageProgression: 'lr',
  /** The PPI the book is scanned at **/
  ppi: 500,
  /** Should image downloads be blocked */
  protected: false,
  /**
   * Settings for individual plugins. Note they have to be imported first.
   * WIP: Most plugins just put their options anywhere in this global options file,
   * but going forward we'll keep them here.
   **/
  plugins: {
    /** @type {import('../plugins/plugin.archive_analytics.js').ArchiveAnalyticsPlugin['options']}*/
    archiveAnalytics: null,
    /** @type {import('../plugins/plugin.text_selection.js').TextSelectionPlugin['options']} */
    textSelection: null
  },
  /**
   * Any variables you want to define. If an option has a StringWithVars type, or
   * has something like `{{server}}/foo.com` in its value, these variables replace
   * the `{{foo}}`.
   * @type { {[var_name: string]: any } }
   */
  vars: {},
  /**
   * @type {Array<[PageData, PageData]|[PageData]>}
   * Data is a simple way to populate the bookreader
   *
   * Example:
   * ```
   * [
   *   // Each child is a spread
   *   [
   *     {
   *       width: 123,
   *       height: 123,
   *       // Optional: If not provided, include a getPageURI
   *       uri: 'https://archive.org/image.jpg',
   *       // Optional: Shown instead of leaf number if present.
   *       pageNum: '1'
   *     },
   *     {width: 123, height: 123, uri: 'https://archive.org/image2.jpg', pageNum: '2'},
   *   ]
   * ],
   * ```
   *
   * Note if URI is omitted, a custom getPageURI can be provided. This allows the page
   * URI to the result of a function, which allows for things such as dynamic
   * page scaling.
   */
  data: [],
  /** @type {import('../plugins/plugin.chapters.js').TocEntry[]} */
  table_of_contents: null,
  /** Advanced methods for page rendering */
  /** @type {() => number} */
  getNumLeafs: null,
  /** @type {(index: number) => number} */
  getPageWidth: null,
  /** @type {(index: number) => number} */
  getPageHeight: null,
  /** @type {(index: number, reduce: number, rotate: number) => *} */
  getPageURI: null,
  /**
   * @type {(index: number) => 'L' | 'R'}
   * Return which side, left or right, that a given page should be displayed on
   */
  getPageSide: null,
  /**
   * @type {(pindex: number) => [number, number]}
   * This function returns the left and right indices for the user-visible
   * spread that contains the given index.  The return values may be
   * null if there is no facing page or the index is invalid.
   */
  getSpreadIndices: null,
  /** @type {(index: number) => string} */
  getPageNum: null,
  /** @type {(index: number) => *} */
  getPageProp: null,
  /** @type {(index: number) => number} */
  leafNumToIndex: null,
  /**
   * @type {(frameWidth: number|string, frameHeight: number|string, viewParams) => *}
   * Optional: if present, and embed code will be shown in the share dialog
   */
  getEmbedCode: null,
  controls: {
    bookLeft: {
      visible: true,
      label: 'Flip left',
      className: 'book_left',
      iconClassName: 'left-arrow'
    },
    bookRight: {
      visible: true,
      label: 'Flip right',
      className: 'book_right',
      iconClassName: 'left-arrow hflip'
    },
    onePage: {
      visible: true,
      label: 'One-page view',
      className: 'onepg',
      iconClassName: 'onepg'
    },
    twoPage: {
      visible: true,
      label: 'Two-page view',
      className: 'twopg',
      iconClassName: 'twopg'
    },
    thumbnail: {
      visible: true,
      label: 'Thumbnail view',
      className: 'thumb',
      iconClassName: 'thumb'
    },
    viewmode: {
      visible: true,
      className: 'viewmode',
      excludedModes: []
    },
    zoomOut: {
      visible: true,
      label: 'Zoom out',
      className: 'zoom_out',
      iconClassName: 'magnify'
    },
    zoomIn: {
      visible: true,
      label: 'Zoom in',
      className: 'zoom_in',
      iconClassName: 'magnify plus'
    },
    fullScreen: {
      visible: true,
      label: 'Toggle fullscreen',
      className: 'full',
      iconClassName: 'fullscreen'
    }
  },
  /**
   * @type {Boolean}
   * Optional: if true, starts in fullscreen mode
   */
  startFullscreen: false,
  /**
   * @type {Boolean}
   * will show logo at fullscreen mode
  */
  enableFSLogoShortcut: false,
  /**
   * @type {Boolean}
   * On init, by default, we want to handle resizing bookreader
   * when browser window changes size (inc. `orientationchange` event)
   * toggle off if you want to handle this outside of bookreader
   */
  autoResize: true,
  /**
   * @type {Boolean}
   * On init, by default, we want to use srcSet for images
   */
  useSrcSet: false,
  /**
   * @type {string}
   * Path to the image to display when a page is unviewable (i.e. when
   * displaying a preview of a book).
   *
   * Relative to the imagesBaseURL if a relative path is specified.
   */
  unviewablePageURI: './unviewable_page.png'
};

/**
 * @typedef {'width' | 'height' | 'auto' | 'none'} AutoFitValues
 * - width: fill the width of the container
 * - height: fill the height of the container
 * - auto: fill the width or height of the container, whichever is smaller
 * - none: do not autofit
 **/

/**
 * @typedef {object} ReductionFactor
 * @property {number} reduce
 * @property {AutoFitValues} [autofit] If set, the corresponding reduction factors
 * are what will be used when the user tries to autofit by width/height.
 */

/**
 * @typedef {Object} PageData
 * @property {number} width
 * @property {number} height
 * @property {string} [uri] If not provided, include a getPageURI
 * @property {PageNumString} [pageNum] Shown instead of leaf number if present
 * @property {LeafNum} [leafNum] Sometimes specified in Internet Archive books
 * @property {number} [ppi] The resolution of the page if different from {@see BookReaderOptions.ppi}
 * @property {'L' | 'R'} [pageSide] PRIVATE; computed automatically
 * @property {boolean} [viewable=true] Set false if page is not viewable. Displays a dummy preview image.
 * @property {number} [unviewablesStart] PRIVATE; index where the chunk of unviewable pages started
 *
 * Note if URI is omitted, a custom getPageURI can be provided. This allows the page
 * URI to the result of a function, which allows for things such as dynamic
 * page scaling.
 */

/** @typedef {typeof DEFAULT_OPTIONS} BookReaderOptions */

/**
 * Thrown when an error occurs while parsing options.
 * Potentially recoverable and non-halting.
 */
class OptionsParseError extends Error {}

/***/ }),

/***/ "./src/BookReader/utils.js":
/*!*********************************!*\
  !*** ./src/BookReader/utils.js ***!
  \*********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PolyfilledCustomEvent: function() { return /* binding */ PolyfilledCustomEvent; },
/* harmony export */   arrChanged: function() { return /* binding */ arrChanged; },
/* harmony export */   arrEquals: function() { return /* binding */ arrEquals; },
/* harmony export */   calcScreenDPI: function() { return /* binding */ calcScreenDPI; },
/* harmony export */   clamp: function() { return /* binding */ clamp; },
/* harmony export */   cssPercentage: function() { return /* binding */ cssPercentage; },
/* harmony export */   debounce: function() { return /* binding */ debounce; },
/* harmony export */   decodeURIComponentPlus: function() { return /* binding */ decodeURIComponentPlus; },
/* harmony export */   disableSelect: function() { return /* binding */ disableSelect; },
/* harmony export */   encodeURIComponentPlus: function() { return /* binding */ encodeURIComponentPlus; },
/* harmony export */   escapeHTML: function() { return /* binding */ escapeHTML; },
/* harmony export */   escapeRegExp: function() { return /* binding */ escapeRegExp; },
/* harmony export */   genToArray: function() { return /* binding */ genToArray; },
/* harmony export */   getActiveElement: function() { return /* binding */ getActiveElement; },
/* harmony export */   getIFrameDocument: function() { return /* binding */ getIFrameDocument; },
/* harmony export */   isInputActive: function() { return /* binding */ isInputActive; },
/* harmony export */   notInArray: function() { return /* binding */ notInArray; },
/* harmony export */   poll: function() { return /* binding */ poll; },
/* harmony export */   polyfillCustomEvent: function() { return /* binding */ polyfillCustomEvent; },
/* harmony export */   promisifyEvent: function() { return /* binding */ promisifyEvent; },
/* harmony export */   sleep: function() { return /* binding */ sleep; },
/* harmony export */   sum: function() { return /* binding */ sum; },
/* harmony export */   throttle: function() { return /* binding */ throttle; }
/* harmony export */ });
/**
 * Bind mouse handlers
 * Disable mouse click to avoid selected/highlighted page images
 * @param {JQuery} jObject
 */
function disableSelect(jObject) {
  // $$$ check here for right-click and don't disable.  Also use jQuery style
  //     for stopping propagation. See https://bugs.edge.launchpad.net/gnubook/+bug/362626
  jObject.bind('mousedown', () => false);
  // Special hack for IE7
  jObject[0].onselectstart = () => false;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Given value and maximum, calculate a percentage suitable for CSS
 * @param {number} value
 * @param {number} max
 * @return {string}
 */
function cssPercentage(value, max) {
  return value / max * 100 + '%';
}

/**
 * @param {*} value
 * @param {Array} array
 * @return {boolean}
 */
function notInArray(value, array) {
  return !array.includes(value);
}

/**
 * Determines the active element, going into shadow doms.
 * @return {Element}
 */
function getActiveElement(doc = document, recurseShadowDom = true) {
  const activeElement = doc.activeElement;
  if (recurseShadowDom && activeElement?.shadowRoot) {
    return getActiveElement(activeElement.shadowRoot, true);
  }
  return activeElement;
}

/** Check if an input field/textarea is active. Also checks shadow DOMs. */
function isInputActive(doc = document) {
  const activeEl = getActiveElement(doc);
  return activeEl?.tagName == "INPUT" || activeEl?.tagName == "TEXTAREA";
}

/**
 * @param {HTMLIFrameElement} iframe
 * @return {Document}
 */
function getIFrameDocument(iframe) {
  // Adapted from http://xkr.us/articles/dom/iframe-document/
  const outer = iframe.contentWindow || iframe.contentDocument;
  return outer.document || outer;
}

/**
 * @param {string} str
 * @return {string}
 */
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * Decodes a URI component and converts '+' to ' '
 * @param {string} value
 * @return {string}
 */
function decodeURIComponentPlus(value) {
  return decodeURIComponent(value).replace(/\+/g, ' ');
}

/**
 * Encodes a URI component and converts ' ' to '+'
 * @param {string|number|boolean} value
 * @return {string};
 */
function encodeURIComponentPlus(value) {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

/**
 * @template {Function} T
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 * @see https://davidwalsh.name/javascript-debounce-function
 *
 * @param {T} func
 * @param {number} wait
 * @param {boolean} immediate
 * @return {T}
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * @template T
 * Throttle function
 * @see https://remysharp.com/2010/07/21/throttling-function-calls
 * @param {T} fn
 * @param {number} threshold
 * @param {boolean} delay
 * @return {T}
 */
function throttle(fn, threshold, delay) {
  threshold || (threshold = 250);
  let last;
  let deferTimer;
  if (delay) last = +new Date();
  return function () {
    const context = this;
    const now = +new Date();
    const args = arguments;
    if (last && now < last + threshold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(() => {
        last = now;
        fn.apply(context, args);
      }, threshold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

/**
 * FIXME we need a better way to do this :/ This is not automatically poly-filled by
 * core-js https://github.com/zloirock/core-js/issues/354
 * @param {Window} window
 */
function polyfillCustomEvent(window) {
  if (typeof window.CustomEvent === "function") return false;
  window.CustomEvent = PolyfilledCustomEvent;
}

/**
 * https://caniuse.com/customevent has issues on older browsers where it can't be
 * called as a constructor, so we have to use older methods.
 * @param {String} eventName
 * @return {CustomEvent}
 */
function PolyfilledCustomEvent(eventName, {
  bubbles = false,
  cancelable = false,
  detail = null
} = {}) {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(eventName, bubbles, cancelable, detail);
  return event;
}

/*
 * Returns the number pixels something should be rendered at to be ~1n on the users
 * screen when measured with a ruler.
 */
function calcScreenDPI() {
  const el = document.createElement('div');
  el.style.width = '1in';
  document.body.appendChild(el);
  const dpi = el.offsetWidth;
  document.body.removeChild(el);

  // Do you believe in magic... numbers? We tested on some devices, and the displayed
  // size of `width: 1in` was less than desired. On @pezvi's mac, it was ~75% ; on
  // @cdrini's laptop it was ~85%. Since we want to avoid things appearing too small,
  // let's just use a multiplier of 1.25
  const screenDPI = dpi * 1.25;
  // This will return 0 in testing; never want it to be 0!
  return screenDPI == 0 ? 100 : screenDPI;
}

/**
 * @param {number[]} nums
 * @returns {number}
 */
function sum(nums) {
  return nums.reduce((cur, acc) => cur + acc, 0);
}

/**
 * @template T
 * @param {Generator<T>} gen
 * @returns {T[]}
 */
function genToArray(gen) {
  const result = [];
  for (const item of gen) {
    result.push(item);
  }
  return result;
}

/**
 * Check if arrays contain the same elements. Does reference comparison.
 * @param {Array} arr1
 * @param {Array} arr2
 */
function arrEquals(arr1, arr2) {
  return arr1.length == arr2.length && arr1.every((x, i) => x == arr2[i]);
}

/**
 * Check if array has changed; namely to be used with lit's property.hasChanged
 * @param {Array} [arr1]
 * @param {Array} [arr2]
 */
function arrChanged(arr1, arr2) {
  return arr1 && arr2 && !arrEquals(arr1, arr2);
}

/**
 * Waits the provided number of ms and then resolves with a promise
 * @param {number} ms
 **/
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {function(): T} fn
 * @param {Object} options
 * @param {function(T): boolean} [options.until]
 * @return {T | undefined}
 */
async function poll(fn, {
  step = 50,
  timeout = 500,
  until = val => Boolean(val),
  _sleep = sleep
} = {}) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const result = fn();
    if (until(result)) return result;
    await _sleep(step);
  }
}

/**
 * Convert a EventTarget style event into a promise
 * @param {EventTarget} target
 * @param {string} eventType
 * @return {Promise<Event>}
 */
function promisifyEvent(target, eventType) {
  return new Promise(res => {
    const resolver = ev => {
      target.removeEventListener(eventType, resolver);
      res(ev);
    };
    target.addEventListener(eventType, resolver);
  });
}

/**
 * Escapes regex special characters in a string. Allows for safe usage in regexes.
 * Src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
 * @param {string} string
 * @returns {string}
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/***/ }),

/***/ "./src/BookReader/utils/HTMLDimensionsCacher.js":
/*!******************************************************!*\
  !*** ./src/BookReader/utils/HTMLDimensionsCacher.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HTMLDimensionsCacher: function() { return /* binding */ HTMLDimensionsCacher; }
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/BookReader/utils.js");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// @ts-check


/**
 * Computing these things repeatedly is expensive (the browser needs to
 * do a lot of computations/redrawing to make sure these are correct),
 * so we store them here, and only recompute them when necessary:
 * - window resize could have cause the container to change size
 * - zoom could have cause scrollbars to appear/disappear, changing
 *   the client size.
 */
class HTMLDimensionsCacher {
  /**
   * @param {HTMLElement} element
   */
  constructor(element) {
    _defineProperty(this, "clientWidth", 100);
    _defineProperty(this, "clientHeight", 100);
    _defineProperty(this, "boundingClientRect", {
      top: 0,
      left: 0
    });
    _defineProperty(this, "updateClientSizes", () => {
      const bc = this.element.getBoundingClientRect();
      this.clientWidth = this.element.clientWidth;
      this.clientHeight = this.element.clientHeight;
      this.boundingClientRect.top = bc.top;
      this.boundingClientRect.left = bc.left;
    });
    _defineProperty(this, "debouncedUpdateClientSizes", (0,_utils__WEBPACK_IMPORTED_MODULE_0__.debounce)(this.updateClientSizes, 150, false));
    /** @type {HTMLElement} */
    this.element = element;
  }
  /** @param {EventTarget} win */
  attachResizeListener(win = window) {
    win.addEventListener('resize', this.debouncedUpdateClientSizes);
  }

  /** @param {EventTarget} win */
  detachResizeListener(win = window) {
    win.removeEventListener('resize', this.debouncedUpdateClientSizes);
  }
}

/***/ }),

/***/ "./src/BookReader/utils/ScrollClassAdder.js":
/*!**************************************************!*\
  !*** ./src/BookReader/utils/ScrollClassAdder.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ScrollClassAdder: function() { return /* binding */ ScrollClassAdder; }
/* harmony export */ });
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/** Adds a class while the given element is experiencing scrolling */
class ScrollClassAdder {
  /**
   * @param {HTMLElement} element
   * @param {string} className
   */
  constructor(element, className) {
    _defineProperty(this, "onScroll", () => {
      this.element.classList.add(this.className);
      clearTimeout(this.timeout);
      // TODO: Also remove class on mousemove, touch, click, etc.
      this.timeout = setTimeout(() => {
        this.element.classList.remove(this.className);
      }, 600);
    });
    /** @type {HTMLElement} */
    this.element = element;
    /** @type {string} */
    this.className = className;
    this.timeout = null;
  }
  attach() {
    this.element.addEventListener('scroll', this.onScroll);
  }
  detach() {
    this.element.removeEventListener('scroll', this.onScroll);
  }
}

/***/ }),

/***/ "./src/BookReader/utils/classes.js":
/*!*****************************************!*\
  !*** ./src/BookReader/utils/classes.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   exposeOverrideable: function() { return /* binding */ exposeOverrideable; }
/* harmony export */ });
/**
 * Exposes a function from one class (FromClass) to another (ToClass), in such a way
 * that if the ToClass's method is overridden, the FromClass's method is also overridden.
 * WARNING: This modifies FromClass' prototype! So FromClasses cannot be shared between
 * different ToClasses.
 * @param {new () => TFrom} FromClass the class to get the method from
 * @param {keyof TFrom} fromMethod the method's name in FromClass
 * @param {function(TFrom): TTo} fromTransform how to get the TTo `this` to use when setting the method on TFrom
 * @param {new () => TTo} ToClass the class to add the method to
 * @param {string} toMethod the name of the method to add to TTo (likely will be equal to fromMethod)
 * @param {function(TTo): TFrom} toTransform how to get the TFrom this to use when calling the new method
 * @template TFrom type of FromClass for type-checking/autocomplete
 * @template TTo type of ToClass for type-checking/autocomplete
 */
function exposeOverrideable(FromClass, fromMethod, fromTransform, ToClass, toMethod, toTransform) {
  // Wrapper function needed to "capture" the current version of fromMethod
  let wrapper = (fn => {
    return function () {
      return fn.apply(toTransform(this), arguments);
    };
  })(FromClass.prototype[fromMethod]);
  Object.defineProperty(ToClass.prototype, toMethod, {
    get() {
      return wrapper;
    },
    set(overrideFn) {
      // overrideFn expects `this` to be ToClass, so ensure as such
      // But we can also call this method from FromClass; need to ensure
      // it's always called with a ToClass
      FromClass.prototype[fromMethod] = function () {
        const newThis = this instanceof FromClass ? fromTransform(this) : this;
        return overrideFn.apply(newThis, arguments);
      };
      wrapper = overrideFn;
    }
  });
}

/***/ }),

/***/ "./src/util/browserSniffing.js":
/*!*************************************!*\
  !*** ./src/util/browserSniffing.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isChrome: function() { return /* binding */ isChrome; },
/* harmony export */   isFirefox: function() { return /* binding */ isFirefox; },
/* harmony export */   isIOS: function() { return /* binding */ isIOS; },
/* harmony export */   isSafari: function() { return /* binding */ isSafari; },
/* harmony export */   isSamsungInternet: function() { return /* binding */ isSamsungInternet; }
/* harmony export */ });
/**
 * Checks whether the current browser is a Chrome/Chromium browser
 * Code from https://stackoverflow.com/a/4565120/2317712
 * @param {string} [userAgent]
 * @param {string} [vendor]
 * @return {boolean}
 */
function isChrome(userAgent = navigator.userAgent, vendor = navigator.vendor) {
  return /chrome/i.test(userAgent) && /google inc/i.test(vendor);
}

/**
 * Checks whether the current browser is firefox
 * @param {string} [userAgent]
 * @return {boolean}
 */
function isFirefox(userAgent = navigator.userAgent) {
  return /firefox/i.test(userAgent);
}

/**
 * Checks whether the current browser is safari
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent#Browser_Name
 * @param {string} [userAgent]
 * @return {boolean}
 */
function isSafari(userAgent = navigator.userAgent) {
  return /safari/i.test(userAgent) && !/chrome|chromium/i.test(userAgent);
}

/**
 * Checks whether the current browser is iOS (and hence iOS webkit)
 * @return {boolean}
 */
function isIOS() {
  // We can't just check the userAgent because as of iOS 13,
  // the userAgent is the same as desktop Safari because
  // they wanted iPad's to be served the same version of websites
  // as desktops.
  return 'ongesturestart' in window && navigator.maxTouchPoints > 0;
}

/**
 * Checks whether the current browser is Samsung Internet
 * https://stackoverflow.com/a/40684162/2317712
 * @param {string} [userAgent]
 * @return {boolean}
 */
function isSamsungInternet(userAgent = navigator.userAgent) {
  return /SamsungBrowser/i.test(userAgent);
}

/***/ }),

/***/ "./node_modules/interactjs/dist/interact.min.js":
/*!******************************************************!*\
  !*** ./node_modules/interactjs/dist/interact.min.js ***!
  \******************************************************/
/***/ (function(module) {

/* interact.js 1.10.18 | https://interactjs.io/license */
!function(t){ true?module.exports=t():0}((function(){var t={};Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0,t.default=function(t){return!(!t||!t.Window)&&t instanceof t.Window};var e={};Object.defineProperty(e,"__esModule",{value:!0}),e.getWindow=function(e){return(0,t.default)(e)?e:(e.ownerDocument||e).defaultView||r.window},e.init=o,e.window=e.realWindow=void 0;var n=void 0;e.realWindow=n;var r=void 0;function o(t){e.realWindow=n=t;var o=t.document.createTextNode("");o.ownerDocument!==t.document&&"function"==typeof t.wrap&&t.wrap(o)===o&&(t=t.wrap(t)),e.window=r=t}e.window=r,"undefined"!=typeof window&&window&&o(window);var i={};function a(t){return a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},a(t)}Object.defineProperty(i,"__esModule",{value:!0}),i.default=void 0;var s=function(t){return!!t&&"object"===a(t)},l=function(t){return"function"==typeof t},u={window:function(n){return n===e.window||(0,t.default)(n)},docFrag:function(t){return s(t)&&11===t.nodeType},object:s,func:l,number:function(t){return"number"==typeof t},bool:function(t){return"boolean"==typeof t},string:function(t){return"string"==typeof t},element:function(t){if(!t||"object"!==a(t))return!1;var n=e.getWindow(t)||e.window;return/object|function/.test("undefined"==typeof Element?"undefined":a(Element))?t instanceof Element||t instanceof n.Element:1===t.nodeType&&"string"==typeof t.nodeName},plainObject:function(t){return s(t)&&!!t.constructor&&/function Object\b/.test(t.constructor.toString())},array:function(t){return s(t)&&void 0!==t.length&&l(t.splice)}};i.default=u;var c={};function f(t){var e=t.interaction;if("drag"===e.prepared.name){var n=e.prepared.axis;"x"===n?(e.coords.cur.page.y=e.coords.start.page.y,e.coords.cur.client.y=e.coords.start.client.y,e.coords.velocity.client.y=0,e.coords.velocity.page.y=0):"y"===n&&(e.coords.cur.page.x=e.coords.start.page.x,e.coords.cur.client.x=e.coords.start.client.x,e.coords.velocity.client.x=0,e.coords.velocity.page.x=0)}}function d(t){var e=t.iEvent,n=t.interaction;if("drag"===n.prepared.name){var r=n.prepared.axis;if("x"===r||"y"===r){var o="x"===r?"y":"x";e.page[o]=n.coords.start.page[o],e.client[o]=n.coords.start.client[o],e.delta[o]=0}}}Object.defineProperty(c,"__esModule",{value:!0}),c.default=void 0;var p={id:"actions/drag",install:function(t){var e=t.actions,n=t.Interactable,r=t.defaults;n.prototype.draggable=p.draggable,e.map.drag=p,e.methodDict.drag="draggable",r.actions.drag=p.defaults},listeners:{"interactions:before-action-move":f,"interactions:action-resume":f,"interactions:action-move":d,"auto-start:check":function(t){var e=t.interaction,n=t.interactable,r=t.buttons,o=n.options.drag;if(o&&o.enabled&&(!e.pointerIsDown||!/mouse|pointer/.test(e.pointerType)||0!=(r&n.options.drag.mouseButtons)))return t.action={name:"drag",axis:"start"===o.lockAxis?o.startAxis:o.lockAxis},!1}},draggable:function(t){return i.default.object(t)?(this.options.drag.enabled=!1!==t.enabled,this.setPerAction("drag",t),this.setOnEvents("drag",t),/^(xy|x|y|start)$/.test(t.lockAxis)&&(this.options.drag.lockAxis=t.lockAxis),/^(xy|x|y)$/.test(t.startAxis)&&(this.options.drag.startAxis=t.startAxis),this):i.default.bool(t)?(this.options.drag.enabled=t,this):this.options.drag},beforeMove:f,move:d,defaults:{startAxis:"xy",lockAxis:"xy"},getCursor:function(){return"move"}},v=p;c.default=v;var h={};Object.defineProperty(h,"__esModule",{value:!0}),h.default=void 0;var g={init:function(t){var e=t;g.document=e.document,g.DocumentFragment=e.DocumentFragment||y,g.SVGElement=e.SVGElement||y,g.SVGSVGElement=e.SVGSVGElement||y,g.SVGElementInstance=e.SVGElementInstance||y,g.Element=e.Element||y,g.HTMLElement=e.HTMLElement||g.Element,g.Event=e.Event,g.Touch=e.Touch||y,g.PointerEvent=e.PointerEvent||e.MSPointerEvent},document:null,DocumentFragment:null,SVGElement:null,SVGSVGElement:null,SVGElementInstance:null,Element:null,HTMLElement:null,Event:null,Touch:null,PointerEvent:null};function y(){}var m=g;h.default=m;var b={};Object.defineProperty(b,"__esModule",{value:!0}),b.default=void 0;var x={init:function(t){var e=h.default.Element,n=t.navigator||{};x.supportsTouch="ontouchstart"in t||i.default.func(t.DocumentTouch)&&h.default.document instanceof t.DocumentTouch,x.supportsPointerEvent=!1!==n.pointerEnabled&&!!h.default.PointerEvent,x.isIOS=/iP(hone|od|ad)/.test(n.platform),x.isIOS7=/iP(hone|od|ad)/.test(n.platform)&&/OS 7[^\d]/.test(n.appVersion),x.isIe9=/MSIE 9/.test(n.userAgent),x.isOperaMobile="Opera"===n.appName&&x.supportsTouch&&/Presto/.test(n.userAgent),x.prefixedMatchesSelector="matches"in e.prototype?"matches":"webkitMatchesSelector"in e.prototype?"webkitMatchesSelector":"mozMatchesSelector"in e.prototype?"mozMatchesSelector":"oMatchesSelector"in e.prototype?"oMatchesSelector":"msMatchesSelector",x.pEventTypes=x.supportsPointerEvent?h.default.PointerEvent===t.MSPointerEvent?{up:"MSPointerUp",down:"MSPointerDown",over:"mouseover",out:"mouseout",move:"MSPointerMove",cancel:"MSPointerCancel"}:{up:"pointerup",down:"pointerdown",over:"pointerover",out:"pointerout",move:"pointermove",cancel:"pointercancel"}:null,x.wheelEvent=h.default.document&&"onmousewheel"in h.default.document?"mousewheel":"wheel"},supportsTouch:null,supportsPointerEvent:null,isIOS7:null,isIOS:null,isIe9:null,isOperaMobile:null,prefixedMatchesSelector:null,pEventTypes:null,wheelEvent:null},w=x;b.default=w;var _={};function P(t){var e=t.parentNode;if(i.default.docFrag(e)){for(;(e=e.host)&&i.default.docFrag(e););return e}return e}function O(t,n){return e.window!==e.realWindow&&(n=n.replace(/\/deep\//g," ")),t[b.default.prefixedMatchesSelector](n)}Object.defineProperty(_,"__esModule",{value:!0}),_.closest=function(t,e){for(;i.default.element(t);){if(O(t,e))return t;t=P(t)}return null},_.getActualElement=function(t){return t.correspondingUseElement||t},_.getElementClientRect=j,_.getElementRect=function(t){var n=j(t);if(!b.default.isIOS7&&n){var r=T(e.getWindow(t));n.left+=r.x,n.right+=r.x,n.top+=r.y,n.bottom+=r.y}return n},_.getPath=function(t){for(var e=[];t;)e.push(t),t=P(t);return e},_.getScrollXY=T,_.indexOfDeepestElement=function(t){for(var n,r=[],o=0;o<t.length;o++){var i=t[o],a=t[n];if(i&&o!==n)if(a){var s=E(i),l=E(a);if(s!==i.ownerDocument)if(l!==i.ownerDocument)if(s!==l){r=r.length?r:S(a);var u=void 0;if(a instanceof h.default.HTMLElement&&i instanceof h.default.SVGElement&&!(i instanceof h.default.SVGSVGElement)){if(i===l)continue;u=i.ownerSVGElement}else u=i;for(var c=S(u,a.ownerDocument),f=0;c[f]&&c[f]===r[f];)f++;var d=[c[f-1],c[f],r[f]];if(d[0])for(var p=d[0].lastChild;p;){if(p===d[1]){n=o,r=c;break}if(p===d[2])break;p=p.previousSibling}}else v=i,g=a,void 0,void 0,(parseInt(e.getWindow(v).getComputedStyle(v).zIndex,10)||0)>=(parseInt(e.getWindow(g).getComputedStyle(g).zIndex,10)||0)&&(n=o);else n=o}else n=o}var v,g;return n},_.matchesSelector=O,_.matchesUpTo=function(t,e,n){for(;i.default.element(t);){if(O(t,e))return!0;if((t=P(t))===n)return O(t,e)}return!1},_.nodeContains=function(t,e){if(t.contains)return t.contains(e);for(;e;){if(e===t)return!0;e=e.parentNode}return!1},_.parentNode=P,_.trySelector=function(t){return!!i.default.string(t)&&(h.default.document.querySelector(t),!0)};var E=function(t){return t.parentNode||t.host};function S(t,e){for(var n,r=[],o=t;(n=E(o))&&o!==e&&n!==o.ownerDocument;)r.unshift(o),o=n;return r}function T(t){return{x:(t=t||e.window).scrollX||t.document.documentElement.scrollLeft,y:t.scrollY||t.document.documentElement.scrollTop}}function j(t){var e=t instanceof h.default.SVGElement?t.getBoundingClientRect():t.getClientRects()[0];return e&&{left:e.left,right:e.right,top:e.top,bottom:e.bottom,width:e.width||e.right-e.left,height:e.height||e.bottom-e.top}}var M={};Object.defineProperty(M,"__esModule",{value:!0}),M.default=function(t,e){for(var n in e)t[n]=e[n];return t};var k={};function I(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}function D(t,e,n){return"parent"===t?(0,_.parentNode)(n):"self"===t?e.getRect(n):(0,_.closest)(n,t)}Object.defineProperty(k,"__esModule",{value:!0}),k.addEdges=function(t,e,n){t.left&&(e.left+=n.x),t.right&&(e.right+=n.x),t.top&&(e.top+=n.y),t.bottom&&(e.bottom+=n.y),e.width=e.right-e.left,e.height=e.bottom-e.top},k.getStringOptionResult=D,k.rectToXY=function(t){return t&&{x:"x"in t?t.x:t.left,y:"y"in t?t.y:t.top}},k.resolveRectLike=function(t,e,n,r){var o,a=t;return i.default.string(a)?a=D(a,e,n):i.default.func(a)&&(a=a.apply(void 0,function(t){if(Array.isArray(t))return I(t)}(o=r)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(o)||function(t,e){if(t){if("string"==typeof t)return I(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?I(t,e):void 0}}(o)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}())),i.default.element(a)&&(a=(0,_.getElementRect)(a)),a},k.tlbrToXywh=function(t){return!t||"x"in t&&"y"in t||((t=(0,M.default)({},t)).x=t.left||0,t.y=t.top||0,t.width=t.width||(t.right||0)-t.x,t.height=t.height||(t.bottom||0)-t.y),t},k.xywhToTlbr=function(t){return!t||"left"in t&&"top"in t||((t=(0,M.default)({},t)).left=t.x||0,t.top=t.y||0,t.right=t.right||t.left+t.width,t.bottom=t.bottom||t.top+t.height),t};var A={};Object.defineProperty(A,"__esModule",{value:!0}),A.default=function(t,e,n){var r=t.options[n],o=r&&r.origin||t.options.origin,i=(0,k.resolveRectLike)(o,t,e,[t&&e]);return(0,k.rectToXY)(i)||{x:0,y:0}};var z={};function C(t){return t.trim().split(/ +/)}Object.defineProperty(z,"__esModule",{value:!0}),z.default=function t(e,n,r){if(r=r||{},i.default.string(e)&&-1!==e.search(" ")&&(e=C(e)),i.default.array(e))return e.reduce((function(e,o){return(0,M.default)(e,t(o,n,r))}),r);if(i.default.object(e)&&(n=e,e=""),i.default.func(n))r[e]=r[e]||[],r[e].push(n);else if(i.default.array(n))for(var o=0;o<n.length;o++){var a;a=n[o],t(e,a,r)}else if(i.default.object(n))for(var s in n){var l=C(s).map((function(t){return"".concat(e).concat(t)}));t(l,n[s],r)}return r};var R={};Object.defineProperty(R,"__esModule",{value:!0}),R.default=void 0,R.default=function(t,e){return Math.sqrt(t*t+e*e)};var F={};Object.defineProperty(F,"__esModule",{value:!0}),F.default=function(t,e){t.__set||(t.__set={});var n=function(n){"function"!=typeof t[n]&&"__set"!==n&&Object.defineProperty(t,n,{get:function(){return n in t.__set?t.__set[n]:t.__set[n]=e[n]},set:function(e){t.__set[n]=e},configurable:!0})};for(var r in e)n(r);return t};var X={};function B(t){return t instanceof h.default.Event||t instanceof h.default.Touch}function Y(t,e,n){return t=t||"page",(n=n||{}).x=e[t+"X"],n.y=e[t+"Y"],n}function W(t,e){return e=e||{x:0,y:0},b.default.isOperaMobile&&B(t)?(Y("screen",t,e),e.x+=window.scrollX,e.y+=window.scrollY):Y("page",t,e),e}function L(t,e){return e=e||{},b.default.isOperaMobile&&B(t)?Y("screen",t,e):Y("client",t,e),e}function U(t){var e=[];return i.default.array(t)?(e[0]=t[0],e[1]=t[1]):"touchend"===t.type?1===t.touches.length?(e[0]=t.touches[0],e[1]=t.changedTouches[0]):0===t.touches.length&&(e[0]=t.changedTouches[0],e[1]=t.changedTouches[1]):(e[0]=t.touches[0],e[1]=t.touches[1]),e}function V(t){for(var e={pageX:0,pageY:0,clientX:0,clientY:0,screenX:0,screenY:0},n=0;n<t.length;n++){var r=t[n];for(var o in e)e[o]+=r[o]}for(var i in e)e[i]/=t.length;return e}Object.defineProperty(X,"__esModule",{value:!0}),X.coordsToEvent=function(t){return{coords:t,get page(){return this.coords.page},get client(){return this.coords.client},get timeStamp(){return this.coords.timeStamp},get pageX(){return this.coords.page.x},get pageY(){return this.coords.page.y},get clientX(){return this.coords.client.x},get clientY(){return this.coords.client.y},get pointerId(){return this.coords.pointerId},get target(){return this.coords.target},get type(){return this.coords.type},get pointerType(){return this.coords.pointerType},get buttons(){return this.coords.buttons},preventDefault:function(){}}},X.copyCoords=function(t,e){t.page=t.page||{},t.page.x=e.page.x,t.page.y=e.page.y,t.client=t.client||{},t.client.x=e.client.x,t.client.y=e.client.y,t.timeStamp=e.timeStamp},X.getClientXY=L,X.getEventTargets=function(t){var e=i.default.func(t.composedPath)?t.composedPath():t.path;return[_.getActualElement(e?e[0]:t.target),_.getActualElement(t.currentTarget)]},X.getPageXY=W,X.getPointerId=function(t){return i.default.number(t.pointerId)?t.pointerId:t.identifier},X.getPointerType=function(t){return i.default.string(t.pointerType)?t.pointerType:i.default.number(t.pointerType)?[void 0,void 0,"touch","pen","mouse"][t.pointerType]:/touch/.test(t.type||"")||t instanceof h.default.Touch?"touch":"mouse"},X.getTouchPair=U,X.getXY=Y,X.isNativePointer=B,X.newCoords=function(){return{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0}},X.pointerAverage=V,Object.defineProperty(X,"pointerExtend",{enumerable:!0,get:function(){return F.default}}),X.setCoordDeltas=function(t,e,n){t.page.x=n.page.x-e.page.x,t.page.y=n.page.y-e.page.y,t.client.x=n.client.x-e.client.x,t.client.y=n.client.y-e.client.y,t.timeStamp=n.timeStamp-e.timeStamp},X.setCoordVelocity=function(t,e){var n=Math.max(e.timeStamp/1e3,.001);t.page.x=e.page.x/n,t.page.y=e.page.y/n,t.client.x=e.client.x/n,t.client.y=e.client.y/n,t.timeStamp=n},X.setCoords=function(t,e,n){var r=e.length>1?V(e):e[0];W(r,t.page),L(r,t.client),t.timeStamp=n},X.setZeroCoords=function(t){t.page.x=0,t.page.y=0,t.client.x=0,t.client.y=0},X.touchAngle=function(t,e){var n=e+"X",r=e+"Y",o=U(t),i=o[1][n]-o[0][n],a=o[1][r]-o[0][r];return 180*Math.atan2(a,i)/Math.PI},X.touchBBox=function(t){if(!t.length)return null;var e=U(t),n=Math.min(e[0].pageX,e[1].pageX),r=Math.min(e[0].pageY,e[1].pageY),o=Math.max(e[0].pageX,e[1].pageX),i=Math.max(e[0].pageY,e[1].pageY);return{x:n,y:r,left:n,top:r,right:o,bottom:i,width:o-n,height:i-r}},X.touchDistance=function(t,e){var n=e+"X",r=e+"Y",o=U(t),i=o[0][n]-o[1][n],a=o[0][r]-o[1][r];return(0,R.default)(i,a)};var N={};function q(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function G(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(N,"__esModule",{value:!0}),N.BaseEvent=void 0;var $=function(){function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),G(this,"immediatePropagationStopped",!1),G(this,"propagationStopped",!1),this._interaction=e}var e,n;return e=t,(n=[{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}}])&&q(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();N.BaseEvent=$,Object.defineProperty($.prototype,"interaction",{get:function(){return this._interaction._proxy},set:function(){}});var H={};Object.defineProperty(H,"__esModule",{value:!0}),H.remove=H.merge=H.from=H.findIndex=H.find=H.contains=void 0,H.contains=function(t,e){return-1!==t.indexOf(e)},H.remove=function(t,e){return t.splice(t.indexOf(e),1)};var K=function(t,e){for(var n=0;n<e.length;n++){var r=e[n];t.push(r)}return t};H.merge=K,H.from=function(t){return K([],t)};var Z=function(t,e){for(var n=0;n<t.length;n++)if(e(t[n],n,t))return n;return-1};H.findIndex=Z,H.find=function(t,e){return t[Z(t,e)]};var J={};function Q(t){return Q="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},Q(t)}function tt(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function et(t,e){return et=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},et(t,e)}function nt(t,e){if(e&&("object"===Q(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return rt(t)}function rt(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function ot(t){return ot=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},ot(t)}function it(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(J,"__esModule",{value:!0}),J.DropEvent=void 0;var at=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&et(t,e)}(a,t);var e,n,r,o,i=(r=a,o=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}(),function(){var t,e=ot(r);if(o){var n=ot(this).constructor;t=Reflect.construct(e,arguments,n)}else t=e.apply(this,arguments);return nt(this,t)});function a(t,e,n){var r;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,a),it(rt(r=i.call(this,e._interaction)),"dropzone",void 0),it(rt(r),"dragEvent",void 0),it(rt(r),"relatedTarget",void 0),it(rt(r),"draggable",void 0),it(rt(r),"propagationStopped",!1),it(rt(r),"immediatePropagationStopped",!1);var o="dragleave"===n?t.prev:t.cur,s=o.element,l=o.dropzone;return r.type=n,r.target=s,r.currentTarget=s,r.dropzone=l,r.dragEvent=e,r.relatedTarget=e.target,r.draggable=e.interactable,r.timeStamp=e.timeStamp,r}return e=a,(n=[{key:"reject",value:function(){var t=this,e=this._interaction.dropState;if("dropactivate"===this.type||this.dropzone&&e.cur.dropzone===this.dropzone&&e.cur.element===this.target)if(e.prev.dropzone=this.dropzone,e.prev.element=this.target,e.rejected=!0,e.events.enter=null,this.stopImmediatePropagation(),"dropactivate"===this.type){var n=e.activeDrops,r=H.findIndex(n,(function(e){var n=e.dropzone,r=e.element;return n===t.dropzone&&r===t.target}));e.activeDrops.splice(r,1);var o=new a(e,this.dragEvent,"dropdeactivate");o.dropzone=this.dropzone,o.target=this.target,this.dropzone.fire(o)}else this.dropzone.fire(new a(e,this.dragEvent,"dragleave"))}},{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}}])&&tt(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),a}(N.BaseEvent);J.DropEvent=at;var st={};function lt(t,e){for(var n=0;n<t.slice().length;n++){var r=t.slice()[n],o=r.dropzone,i=r.element;e.dropzone=o,e.target=i,o.fire(e),e.propagationStopped=e.immediatePropagationStopped=!1}}function ut(t,e){for(var n=function(t,e){for(var n=t.interactables,r=[],o=0;o<n.list.length;o++){var a=n.list[o];if(a.options.drop.enabled){var s=a.options.drop.accept;if(!(i.default.element(s)&&s!==e||i.default.string(s)&&!_.matchesSelector(e,s)||i.default.func(s)&&!s({dropzone:a,draggableElement:e})))for(var l=i.default.string(a.target)?a._context.querySelectorAll(a.target):i.default.array(a.target)?a.target:[a.target],u=0;u<l.length;u++){var c=l[u];c!==e&&r.push({dropzone:a,element:c,rect:a.getRect(c)})}}}return r}(t,e),r=0;r<n.length;r++){var o=n[r];o.rect=o.dropzone.getRect(o.element)}return n}function ct(t,e,n){for(var r=t.dropState,o=t.interactable,i=t.element,a=[],s=0;s<r.activeDrops.length;s++){var l=r.activeDrops[s],u=l.dropzone,c=l.element,f=l.rect;a.push(u.dropCheck(e,n,o,i,c,f)?c:null)}var d=_.indexOfDeepestElement(a);return r.activeDrops[d]||null}function ft(t,e,n){var r=t.dropState,o={enter:null,leave:null,activate:null,deactivate:null,move:null,drop:null};return"dragstart"===n.type&&(o.activate=new J.DropEvent(r,n,"dropactivate"),o.activate.target=null,o.activate.dropzone=null),"dragend"===n.type&&(o.deactivate=new J.DropEvent(r,n,"dropdeactivate"),o.deactivate.target=null,o.deactivate.dropzone=null),r.rejected||(r.cur.element!==r.prev.element&&(r.prev.dropzone&&(o.leave=new J.DropEvent(r,n,"dragleave"),n.dragLeave=o.leave.target=r.prev.element,n.prevDropzone=o.leave.dropzone=r.prev.dropzone),r.cur.dropzone&&(o.enter=new J.DropEvent(r,n,"dragenter"),n.dragEnter=r.cur.element,n.dropzone=r.cur.dropzone)),"dragend"===n.type&&r.cur.dropzone&&(o.drop=new J.DropEvent(r,n,"drop"),n.dropzone=r.cur.dropzone,n.relatedTarget=r.cur.element),"dragmove"===n.type&&r.cur.dropzone&&(o.move=new J.DropEvent(r,n,"dropmove"),o.move.dragmove=n,n.dropzone=r.cur.dropzone)),o}function dt(t,e){var n=t.dropState,r=n.activeDrops,o=n.cur,i=n.prev;e.leave&&i.dropzone.fire(e.leave),e.enter&&o.dropzone.fire(e.enter),e.move&&o.dropzone.fire(e.move),e.drop&&o.dropzone.fire(e.drop),e.deactivate&&lt(r,e.deactivate),n.prev.dropzone=o.dropzone,n.prev.element=o.element}function pt(t,e){var n=t.interaction,r=t.iEvent,o=t.event;if("dragmove"===r.type||"dragend"===r.type){var i=n.dropState;e.dynamicDrop&&(i.activeDrops=ut(e,n.element));var a=r,s=ct(n,a,o);i.rejected=i.rejected&&!!s&&s.dropzone===i.cur.dropzone&&s.element===i.cur.element,i.cur.dropzone=s&&s.dropzone,i.cur.element=s&&s.element,i.events=ft(n,0,a)}}Object.defineProperty(st,"__esModule",{value:!0}),st.default=void 0;var vt={id:"actions/drop",install:function(t){var e=t.actions,n=t.interactStatic,r=t.Interactable,o=t.defaults;t.usePlugin(c.default),r.prototype.dropzone=function(t){return function(t,e){if(i.default.object(e)){if(t.options.drop.enabled=!1!==e.enabled,e.listeners){var n=(0,z.default)(e.listeners),r=Object.keys(n).reduce((function(t,e){return t[/^(enter|leave)/.test(e)?"drag".concat(e):/^(activate|deactivate|move)/.test(e)?"drop".concat(e):e]=n[e],t}),{});t.off(t.options.drop.listeners),t.on(r),t.options.drop.listeners=r}return i.default.func(e.ondrop)&&t.on("drop",e.ondrop),i.default.func(e.ondropactivate)&&t.on("dropactivate",e.ondropactivate),i.default.func(e.ondropdeactivate)&&t.on("dropdeactivate",e.ondropdeactivate),i.default.func(e.ondragenter)&&t.on("dragenter",e.ondragenter),i.default.func(e.ondragleave)&&t.on("dragleave",e.ondragleave),i.default.func(e.ondropmove)&&t.on("dropmove",e.ondropmove),/^(pointer|center)$/.test(e.overlap)?t.options.drop.overlap=e.overlap:i.default.number(e.overlap)&&(t.options.drop.overlap=Math.max(Math.min(1,e.overlap),0)),"accept"in e&&(t.options.drop.accept=e.accept),"checker"in e&&(t.options.drop.checker=e.checker),t}return i.default.bool(e)?(t.options.drop.enabled=e,t):t.options.drop}(this,t)},r.prototype.dropCheck=function(t,e,n,r,o,a){return function(t,e,n,r,o,a,s){var l=!1;if(!(s=s||t.getRect(a)))return!!t.options.drop.checker&&t.options.drop.checker(e,n,l,t,a,r,o);var u=t.options.drop.overlap;if("pointer"===u){var c=(0,A.default)(r,o,"drag"),f=X.getPageXY(e);f.x+=c.x,f.y+=c.y;var d=f.x>s.left&&f.x<s.right,p=f.y>s.top&&f.y<s.bottom;l=d&&p}var v=r.getRect(o);if(v&&"center"===u){var h=v.left+v.width/2,g=v.top+v.height/2;l=h>=s.left&&h<=s.right&&g>=s.top&&g<=s.bottom}return v&&i.default.number(u)&&(l=Math.max(0,Math.min(s.right,v.right)-Math.max(s.left,v.left))*Math.max(0,Math.min(s.bottom,v.bottom)-Math.max(s.top,v.top))/(v.width*v.height)>=u),t.options.drop.checker&&(l=t.options.drop.checker(e,n,l,t,a,r,o)),l}(this,t,e,n,r,o,a)},n.dynamicDrop=function(e){return i.default.bool(e)?(t.dynamicDrop=e,n):t.dynamicDrop},(0,M.default)(e.phaselessTypes,{dragenter:!0,dragleave:!0,dropactivate:!0,dropdeactivate:!0,dropmove:!0,drop:!0}),e.methodDict.drop="dropzone",t.dynamicDrop=!1,o.actions.drop=vt.defaults},listeners:{"interactions:before-action-start":function(t){var e=t.interaction;"drag"===e.prepared.name&&(e.dropState={cur:{dropzone:null,element:null},prev:{dropzone:null,element:null},rejected:null,events:null,activeDrops:[]})},"interactions:after-action-start":function(t,e){var n=t.interaction,r=(t.event,t.iEvent);if("drag"===n.prepared.name){var o=n.dropState;o.activeDrops=null,o.events=null,o.activeDrops=ut(e,n.element),o.events=ft(n,0,r),o.events.activate&&(lt(o.activeDrops,o.events.activate),e.fire("actions/drop:start",{interaction:n,dragEvent:r}))}},"interactions:action-move":pt,"interactions:after-action-move":function(t,e){var n=t.interaction,r=t.iEvent;"drag"===n.prepared.name&&(dt(n,n.dropState.events),e.fire("actions/drop:move",{interaction:n,dragEvent:r}),n.dropState.events={})},"interactions:action-end":function(t,e){if("drag"===t.interaction.prepared.name){var n=t.interaction,r=t.iEvent;pt(t,e),dt(n,n.dropState.events),e.fire("actions/drop:end",{interaction:n,dragEvent:r})}},"interactions:stop":function(t){var e=t.interaction;if("drag"===e.prepared.name){var n=e.dropState;n&&(n.activeDrops=null,n.events=null,n.cur.dropzone=null,n.cur.element=null,n.prev.dropzone=null,n.prev.element=null,n.rejected=!1)}}},getActiveDrops:ut,getDrop:ct,getDropEvents:ft,fireDropEvents:dt,defaults:{enabled:!1,accept:null,overlap:"pointer"}},ht=vt;st.default=ht;var gt={};function yt(t){var e=t.interaction,n=t.iEvent,r=t.phase;if("gesture"===e.prepared.name){var o=e.pointers.map((function(t){return t.pointer})),a="start"===r,s="end"===r,l=e.interactable.options.deltaSource;if(n.touches=[o[0],o[1]],a)n.distance=X.touchDistance(o,l),n.box=X.touchBBox(o),n.scale=1,n.ds=0,n.angle=X.touchAngle(o,l),n.da=0,e.gesture.startDistance=n.distance,e.gesture.startAngle=n.angle;else if(s){var u=e.prevEvent;n.distance=u.distance,n.box=u.box,n.scale=u.scale,n.ds=0,n.angle=u.angle,n.da=0}else n.distance=X.touchDistance(o,l),n.box=X.touchBBox(o),n.scale=n.distance/e.gesture.startDistance,n.angle=X.touchAngle(o,l),n.ds=n.scale-e.gesture.scale,n.da=n.angle-e.gesture.angle;e.gesture.distance=n.distance,e.gesture.angle=n.angle,i.default.number(n.scale)&&n.scale!==1/0&&!isNaN(n.scale)&&(e.gesture.scale=n.scale)}}Object.defineProperty(gt,"__esModule",{value:!0}),gt.default=void 0;var mt={id:"actions/gesture",before:["actions/drag","actions/resize"],install:function(t){var e=t.actions,n=t.Interactable,r=t.defaults;n.prototype.gesturable=function(t){return i.default.object(t)?(this.options.gesture.enabled=!1!==t.enabled,this.setPerAction("gesture",t),this.setOnEvents("gesture",t),this):i.default.bool(t)?(this.options.gesture.enabled=t,this):this.options.gesture},e.map.gesture=mt,e.methodDict.gesture="gesturable",r.actions.gesture=mt.defaults},listeners:{"interactions:action-start":yt,"interactions:action-move":yt,"interactions:action-end":yt,"interactions:new":function(t){t.interaction.gesture={angle:0,distance:0,scale:1,startAngle:0,startDistance:0}},"auto-start:check":function(t){if(!(t.interaction.pointers.length<2)){var e=t.interactable.options.gesture;if(e&&e.enabled)return t.action={name:"gesture"},!1}}},defaults:{},getCursor:function(){return""}},bt=mt;gt.default=bt;var xt={};function wt(t,e,n,r,o,a,s){if(!e)return!1;if(!0===e){var l=i.default.number(a.width)?a.width:a.right-a.left,u=i.default.number(a.height)?a.height:a.bottom-a.top;if(s=Math.min(s,Math.abs(("left"===t||"right"===t?l:u)/2)),l<0&&("left"===t?t="right":"right"===t&&(t="left")),u<0&&("top"===t?t="bottom":"bottom"===t&&(t="top")),"left"===t){var c=l>=0?a.left:a.right;return n.x<c+s}if("top"===t){var f=u>=0?a.top:a.bottom;return n.y<f+s}if("right"===t)return n.x>(l>=0?a.right:a.left)-s;if("bottom"===t)return n.y>(u>=0?a.bottom:a.top)-s}return!!i.default.element(r)&&(i.default.element(e)?e===r:_.matchesUpTo(r,e,o))}function _t(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.resizeAxes){var r=e;n.interactable.options.resize.square?("y"===n.resizeAxes?r.delta.x=r.delta.y:r.delta.y=r.delta.x,r.axes="xy"):(r.axes=n.resizeAxes,"x"===n.resizeAxes?r.delta.y=0:"y"===n.resizeAxes&&(r.delta.x=0))}}Object.defineProperty(xt,"__esModule",{value:!0}),xt.default=void 0;var Pt={id:"actions/resize",before:["actions/drag"],install:function(t){var e=t.actions,n=t.browser,r=t.Interactable,o=t.defaults;Pt.cursors=function(t){return t.isIe9?{x:"e-resize",y:"s-resize",xy:"se-resize",top:"n-resize",left:"w-resize",bottom:"s-resize",right:"e-resize",topleft:"se-resize",bottomright:"se-resize",topright:"ne-resize",bottomleft:"ne-resize"}:{x:"ew-resize",y:"ns-resize",xy:"nwse-resize",top:"ns-resize",left:"ew-resize",bottom:"ns-resize",right:"ew-resize",topleft:"nwse-resize",bottomright:"nwse-resize",topright:"nesw-resize",bottomleft:"nesw-resize"}}(n),Pt.defaultMargin=n.supportsTouch||n.supportsPointerEvent?20:10,r.prototype.resizable=function(e){return function(t,e,n){return i.default.object(e)?(t.options.resize.enabled=!1!==e.enabled,t.setPerAction("resize",e),t.setOnEvents("resize",e),i.default.string(e.axis)&&/^x$|^y$|^xy$/.test(e.axis)?t.options.resize.axis=e.axis:null===e.axis&&(t.options.resize.axis=n.defaults.actions.resize.axis),i.default.bool(e.preserveAspectRatio)?t.options.resize.preserveAspectRatio=e.preserveAspectRatio:i.default.bool(e.square)&&(t.options.resize.square=e.square),t):i.default.bool(e)?(t.options.resize.enabled=e,t):t.options.resize}(this,e,t)},e.map.resize=Pt,e.methodDict.resize="resizable",o.actions.resize=Pt.defaults},listeners:{"interactions:new":function(t){t.interaction.resizeAxes="xy"},"interactions:action-start":function(t){!function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e,o=n.rect;n._rects={start:(0,M.default)({},o),corrected:(0,M.default)({},o),previous:(0,M.default)({},o),delta:{left:0,right:0,width:0,top:0,bottom:0,height:0}},r.edges=n.prepared.edges,r.rect=n._rects.corrected,r.deltaRect=n._rects.delta}}(t),_t(t)},"interactions:action-move":function(t){!function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e,o=n.interactable.options.resize.invert,i="reposition"===o||"negate"===o,a=n.rect,s=n._rects,l=s.start,u=s.corrected,c=s.delta,f=s.previous;if((0,M.default)(f,u),i){if((0,M.default)(u,a),"reposition"===o){if(u.top>u.bottom){var d=u.top;u.top=u.bottom,u.bottom=d}if(u.left>u.right){var p=u.left;u.left=u.right,u.right=p}}}else u.top=Math.min(a.top,l.bottom),u.bottom=Math.max(a.bottom,l.top),u.left=Math.min(a.left,l.right),u.right=Math.max(a.right,l.left);for(var v in u.width=u.right-u.left,u.height=u.bottom-u.top,u)c[v]=u[v]-f[v];r.edges=n.prepared.edges,r.rect=u,r.deltaRect=c}}(t),_t(t)},"interactions:action-end":function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e;r.edges=n.prepared.edges,r.rect=n._rects.corrected,r.deltaRect=n._rects.delta}},"auto-start:check":function(t){var e=t.interaction,n=t.interactable,r=t.element,o=t.rect,a=t.buttons;if(o){var s=(0,M.default)({},e.coords.cur.page),l=n.options.resize;if(l&&l.enabled&&(!e.pointerIsDown||!/mouse|pointer/.test(e.pointerType)||0!=(a&l.mouseButtons))){if(i.default.object(l.edges)){var u={left:!1,right:!1,top:!1,bottom:!1};for(var c in u)u[c]=wt(c,l.edges[c],s,e._latestPointer.eventTarget,r,o,l.margin||Pt.defaultMargin);u.left=u.left&&!u.right,u.top=u.top&&!u.bottom,(u.left||u.right||u.top||u.bottom)&&(t.action={name:"resize",edges:u})}else{var f="y"!==l.axis&&s.x>o.right-Pt.defaultMargin,d="x"!==l.axis&&s.y>o.bottom-Pt.defaultMargin;(f||d)&&(t.action={name:"resize",axes:(f?"x":"")+(d?"y":"")})}return!t.action&&void 0}}}},defaults:{square:!1,preserveAspectRatio:!1,axis:"xy",margin:NaN,edges:null,invert:"none"},cursors:null,getCursor:function(t){var e=t.edges,n=t.axis,r=t.name,o=Pt.cursors,i=null;if(n)i=o[r+n];else if(e){for(var a="",s=["top","bottom","left","right"],l=0;l<s.length;l++){var u=s[l];e[u]&&(a+=u)}i=o[a]}return i},defaultMargin:null},Ot=Pt;xt.default=Ot;var Et={};Object.defineProperty(Et,"__esModule",{value:!0}),Et.default=void 0;var St={id:"actions",install:function(t){t.usePlugin(gt.default),t.usePlugin(xt.default),t.usePlugin(c.default),t.usePlugin(st.default)}};Et.default=St;var Tt={};Object.defineProperty(Tt,"__esModule",{value:!0}),Tt.default=void 0;var jt,Mt,kt=0,It={request:function(t){return jt(t)},cancel:function(t){return Mt(t)},init:function(t){if(jt=t.requestAnimationFrame,Mt=t.cancelAnimationFrame,!jt)for(var e=["ms","moz","webkit","o"],n=0;n<e.length;n++){var r=e[n];jt=t["".concat(r,"RequestAnimationFrame")],Mt=t["".concat(r,"CancelAnimationFrame")]||t["".concat(r,"CancelRequestAnimationFrame")]}jt=jt&&jt.bind(t),Mt=Mt&&Mt.bind(t),jt||(jt=function(e){var n=Date.now(),r=Math.max(0,16-(n-kt)),o=t.setTimeout((function(){e(n+r)}),r);return kt=n+r,o},Mt=function(t){return clearTimeout(t)})}};Tt.default=It;var Dt={};Object.defineProperty(Dt,"__esModule",{value:!0}),Dt.default=void 0,Dt.getContainer=zt,Dt.getScroll=Ct,Dt.getScrollSize=function(t){return i.default.window(t)&&(t=window.document.body),{x:t.scrollWidth,y:t.scrollHeight}},Dt.getScrollSizeDelta=function(t,e){var n=t.interaction,r=t.element,o=n&&n.interactable.options[n.prepared.name].autoScroll;if(!o||!o.enabled)return e(),{x:0,y:0};var i=zt(o.container,n.interactable,r),a=Ct(i);e();var s=Ct(i);return{x:s.x-a.x,y:s.y-a.y}};var At={defaults:{enabled:!1,margin:60,container:null,speed:300},now:Date.now,interaction:null,i:0,x:0,y:0,isScrolling:!1,prevTime:0,margin:0,speed:0,start:function(t){At.isScrolling=!0,Tt.default.cancel(At.i),t.autoScroll=At,At.interaction=t,At.prevTime=At.now(),At.i=Tt.default.request(At.scroll)},stop:function(){At.isScrolling=!1,At.interaction&&(At.interaction.autoScroll=null),Tt.default.cancel(At.i)},scroll:function(){var t=At.interaction,e=t.interactable,n=t.element,r=t.prepared.name,o=e.options[r].autoScroll,a=zt(o.container,e,n),s=At.now(),l=(s-At.prevTime)/1e3,u=o.speed*l;if(u>=1){var c={x:At.x*u,y:At.y*u};if(c.x||c.y){var f=Ct(a);i.default.window(a)?a.scrollBy(c.x,c.y):a&&(a.scrollLeft+=c.x,a.scrollTop+=c.y);var d=Ct(a),p={x:d.x-f.x,y:d.y-f.y};(p.x||p.y)&&e.fire({type:"autoscroll",target:n,interactable:e,delta:p,interaction:t,container:a})}At.prevTime=s}At.isScrolling&&(Tt.default.cancel(At.i),At.i=Tt.default.request(At.scroll))},check:function(t,e){var n;return null==(n=t.options[e].autoScroll)?void 0:n.enabled},onInteractionMove:function(t){var e=t.interaction,n=t.pointer;if(e.interacting()&&At.check(e.interactable,e.prepared.name))if(e.simulation)At.x=At.y=0;else{var r,o,a,s,l=e.interactable,u=e.element,c=e.prepared.name,f=l.options[c].autoScroll,d=zt(f.container,l,u);if(i.default.window(d))s=n.clientX<At.margin,r=n.clientY<At.margin,o=n.clientX>d.innerWidth-At.margin,a=n.clientY>d.innerHeight-At.margin;else{var p=_.getElementClientRect(d);s=n.clientX<p.left+At.margin,r=n.clientY<p.top+At.margin,o=n.clientX>p.right-At.margin,a=n.clientY>p.bottom-At.margin}At.x=o?1:s?-1:0,At.y=a?1:r?-1:0,At.isScrolling||(At.margin=f.margin,At.speed=f.speed,At.start(e))}}};function zt(t,n,r){return(i.default.string(t)?(0,k.getStringOptionResult)(t,n,r):t)||(0,e.getWindow)(r)}function Ct(t){return i.default.window(t)&&(t=window.document.body),{x:t.scrollLeft,y:t.scrollTop}}var Rt={id:"auto-scroll",install:function(t){var e=t.defaults,n=t.actions;t.autoScroll=At,At.now=function(){return t.now()},n.phaselessTypes.autoscroll=!0,e.perAction.autoScroll=At.defaults},listeners:{"interactions:new":function(t){t.interaction.autoScroll=null},"interactions:destroy":function(t){t.interaction.autoScroll=null,At.stop(),At.interaction&&(At.interaction=null)},"interactions:stop":At.stop,"interactions:action-move":function(t){return At.onInteractionMove(t)}}},Ft=Rt;Dt.default=Ft;var Xt={};Object.defineProperty(Xt,"__esModule",{value:!0}),Xt.copyAction=function(t,e){return t.name=e.name,t.axis=e.axis,t.edges=e.edges,t},Xt.sign=void 0,Xt.warnOnce=function(t,n){var r=!1;return function(){return r||(e.window.console.warn(n),r=!0),t.apply(this,arguments)}},Xt.sign=function(t){return t>=0?1:-1};var Bt={};function Yt(t){return i.default.bool(t)?(this.options.styleCursor=t,this):null===t?(delete this.options.styleCursor,this):this.options.styleCursor}function Wt(t){return i.default.func(t)?(this.options.actionChecker=t,this):null===t?(delete this.options.actionChecker,this):this.options.actionChecker}Object.defineProperty(Bt,"__esModule",{value:!0}),Bt.default=void 0;var Lt={id:"auto-start/interactableMethods",install:function(t){var e=t.Interactable;e.prototype.getAction=function(e,n,r,o){var i=function(t,e,n,r,o){var i=t.getRect(r),a={action:null,interactable:t,interaction:n,element:r,rect:i,buttons:e.buttons||{0:1,1:4,3:8,4:16}[e.button]};return o.fire("auto-start:check",a),a.action}(this,n,r,o,t);return this.options.actionChecker?this.options.actionChecker(e,n,i,this,o,r):i},e.prototype.ignoreFrom=(0,Xt.warnOnce)((function(t){return this._backCompatOption("ignoreFrom",t)}),"Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue})."),e.prototype.allowFrom=(0,Xt.warnOnce)((function(t){return this._backCompatOption("allowFrom",t)}),"Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue})."),e.prototype.actionChecker=Wt,e.prototype.styleCursor=Yt}};Bt.default=Lt;var Ut={};function Vt(t,e,n,r,o){return e.testIgnoreAllow(e.options[t.name],n,r)&&e.options[t.name].enabled&&$t(e,n,t,o)?t:null}function Nt(t,e,n,r,o,i,a){for(var s=0,l=r.length;s<l;s++){var u=r[s],c=o[s],f=u.getAction(e,n,t,c);if(f){var d=Vt(f,u,c,i,a);if(d)return{action:d,interactable:u,element:c}}}return{action:null,interactable:null,element:null}}function qt(t,e,n,r,o){var a=[],s=[],l=r;function u(t){a.push(t),s.push(l)}for(;i.default.element(l);){a=[],s=[],o.interactables.forEachMatch(l,u);var c=Nt(t,e,n,a,s,r,o);if(c.action&&!c.interactable.options[c.action.name].manualStart)return c;l=_.parentNode(l)}return{action:null,interactable:null,element:null}}function Gt(t,e,n){var r=e.action,o=e.interactable,i=e.element;r=r||{name:null},t.interactable=o,t.element=i,(0,Xt.copyAction)(t.prepared,r),t.rect=o&&r.name?o.getRect(i):null,Zt(t,n),n.fire("autoStart:prepared",{interaction:t})}function $t(t,e,n,r){var o=t.options,i=o[n.name].max,a=o[n.name].maxPerElement,s=r.autoStart.maxInteractions,l=0,u=0,c=0;if(!(i&&a&&s))return!1;for(var f=0;f<r.interactions.list.length;f++){var d=r.interactions.list[f],p=d.prepared.name;if(d.interacting()){if(++l>=s)return!1;if(d.interactable===t){if((u+=p===n.name?1:0)>=i)return!1;if(d.element===e&&(c++,p===n.name&&c>=a))return!1}}}return s>0}function Ht(t,e){return i.default.number(t)?(e.autoStart.maxInteractions=t,this):e.autoStart.maxInteractions}function Kt(t,e,n){var r=n.autoStart.cursorElement;r&&r!==t&&(r.style.cursor=""),t.ownerDocument.documentElement.style.cursor=e,t.style.cursor=e,n.autoStart.cursorElement=e?t:null}function Zt(t,e){var n=t.interactable,r=t.element,o=t.prepared;if("mouse"===t.pointerType&&n&&n.options.styleCursor){var a="";if(o.name){var s=n.options[o.name].cursorChecker;a=i.default.func(s)?s(o,n,r,t._interacting):e.actions.map[o.name].getCursor(o)}Kt(t.element,a||"",e)}else e.autoStart.cursorElement&&Kt(e.autoStart.cursorElement,"",e)}Object.defineProperty(Ut,"__esModule",{value:!0}),Ut.default=void 0;var Jt={id:"auto-start/base",before:["actions"],install:function(t){var e=t.interactStatic,n=t.defaults;t.usePlugin(Bt.default),n.base.actionChecker=null,n.base.styleCursor=!0,(0,M.default)(n.perAction,{manualStart:!1,max:1/0,maxPerElement:1,allowFrom:null,ignoreFrom:null,mouseButtons:1}),e.maxInteractions=function(e){return Ht(e,t)},t.autoStart={maxInteractions:1/0,withinInteractionLimit:$t,cursorElement:null}},listeners:{"interactions:down":function(t,e){var n=t.interaction,r=t.pointer,o=t.event,i=t.eventTarget;n.interacting()||Gt(n,qt(n,r,o,i,e),e)},"interactions:move":function(t,e){!function(t,e){var n=t.interaction,r=t.pointer,o=t.event,i=t.eventTarget;"mouse"!==n.pointerType||n.pointerIsDown||n.interacting()||Gt(n,qt(n,r,o,i,e),e)}(t,e),function(t,e){var n=t.interaction;if(n.pointerIsDown&&!n.interacting()&&n.pointerWasMoved&&n.prepared.name){e.fire("autoStart:before-start",t);var r=n.interactable,o=n.prepared.name;o&&r&&(r.options[o].manualStart||!$t(r,n.element,n.prepared,e)?n.stop():(n.start(n.prepared,r,n.element),Zt(n,e)))}}(t,e)},"interactions:stop":function(t,e){var n=t.interaction,r=n.interactable;r&&r.options.styleCursor&&Kt(n.element,"",e)}},maxInteractions:Ht,withinInteractionLimit:$t,validateAction:Vt},Qt=Jt;Ut.default=Qt;var te={};Object.defineProperty(te,"__esModule",{value:!0}),te.default=void 0;var ee={id:"auto-start/dragAxis",listeners:{"autoStart:before-start":function(t,e){var n=t.interaction,r=t.eventTarget,o=t.dx,a=t.dy;if("drag"===n.prepared.name){var s=Math.abs(o),l=Math.abs(a),u=n.interactable.options.drag,c=u.startAxis,f=s>l?"x":s<l?"y":"xy";if(n.prepared.axis="start"===u.lockAxis?f[0]:u.lockAxis,"xy"!==f&&"xy"!==c&&c!==f){n.prepared.name=null;for(var d=r,p=function(t){if(t!==n.interactable){var o=n.interactable.options.drag;if(!o.manualStart&&t.testIgnoreAllow(o,d,r)){var i=t.getAction(n.downPointer,n.downEvent,n,d);if(i&&"drag"===i.name&&function(t,e){if(!e)return!1;var n=e.options.drag.startAxis;return"xy"===t||"xy"===n||n===t}(f,t)&&Ut.default.validateAction(i,t,d,r,e))return t}}};i.default.element(d);){var v=e.interactables.forEachMatch(d,p);if(v){n.prepared.name="drag",n.interactable=v,n.element=d;break}d=(0,_.parentNode)(d)}}}}}};te.default=ee;var ne={};function re(t){var e=t.prepared&&t.prepared.name;if(!e)return null;var n=t.interactable.options;return n[e].hold||n[e].delay}Object.defineProperty(ne,"__esModule",{value:!0}),ne.default=void 0;var oe={id:"auto-start/hold",install:function(t){var e=t.defaults;t.usePlugin(Ut.default),e.perAction.hold=0,e.perAction.delay=0},listeners:{"interactions:new":function(t){t.interaction.autoStartHoldTimer=null},"autoStart:prepared":function(t){var e=t.interaction,n=re(e);n>0&&(e.autoStartHoldTimer=setTimeout((function(){e.start(e.prepared,e.interactable,e.element)}),n))},"interactions:move":function(t){var e=t.interaction,n=t.duplicate;e.autoStartHoldTimer&&e.pointerWasMoved&&!n&&(clearTimeout(e.autoStartHoldTimer),e.autoStartHoldTimer=null)},"autoStart:before-start":function(t){var e=t.interaction;re(e)>0&&(e.prepared.name=null)}},getHoldDuration:re},ie=oe;ne.default=ie;var ae={};Object.defineProperty(ae,"__esModule",{value:!0}),ae.default=void 0;var se={id:"auto-start",install:function(t){t.usePlugin(Ut.default),t.usePlugin(ne.default),t.usePlugin(te.default)}};ae.default=se;var le={};function ue(t){return/^(always|never|auto)$/.test(t)?(this.options.preventDefault=t,this):i.default.bool(t)?(this.options.preventDefault=t?"always":"never",this):this.options.preventDefault}function ce(t){var e=t.interaction,n=t.event;e.interactable&&e.interactable.checkAndPreventDefault(n)}function fe(t){var n=t.Interactable;n.prototype.preventDefault=ue,n.prototype.checkAndPreventDefault=function(n){return function(t,n,r){var o=t.options.preventDefault;if("never"!==o)if("always"!==o){if(n.events.supportsPassive&&/^touch(start|move)$/.test(r.type)){var a=(0,e.getWindow)(r.target).document,s=n.getDocOptions(a);if(!s||!s.events||!1!==s.events.passive)return}/^(mouse|pointer|touch)*(down|start)/i.test(r.type)||i.default.element(r.target)&&(0,_.matchesSelector)(r.target,"input,select,textarea,[contenteditable=true],[contenteditable=true] *")||r.preventDefault()}else r.preventDefault()}(this,t,n)},t.interactions.docEvents.push({type:"dragstart",listener:function(e){for(var n=0;n<t.interactions.list.length;n++){var r=t.interactions.list[n];if(r.element&&(r.element===e.target||(0,_.nodeContains)(r.element,e.target)))return void r.interactable.checkAndPreventDefault(e)}}})}Object.defineProperty(le,"__esModule",{value:!0}),le.default=void 0,le.install=fe;var de={id:"core/interactablePreventDefault",install:fe,listeners:["down","move","up","cancel"].reduce((function(t,e){return t["interactions:".concat(e)]=ce,t}),{})};le.default=de;var pe={};Object.defineProperty(pe,"__esModule",{value:!0}),pe.default=void 0,pe.default={};var ve,he={};Object.defineProperty(he,"__esModule",{value:!0}),he.default=void 0,function(t){t.touchAction="touchAction",t.boxSizing="boxSizing",t.noListeners="noListeners"}(ve||(ve={}));ve.touchAction,ve.boxSizing,ve.noListeners;var ge={id:"dev-tools",install:function(){}};he.default=ge;var ye={};Object.defineProperty(ye,"__esModule",{value:!0}),ye.default=function t(e){var n={};for(var r in e){var o=e[r];i.default.plainObject(o)?n[r]=t(o):i.default.array(o)?n[r]=H.from(o):n[r]=o}return n};var me={};function be(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i=[],a=!0,s=!1;try{for(n=n.call(t);!(a=(r=n.next()).done)&&(i.push(r.value),!e||i.length!==e);a=!0);}catch(t){s=!0,o=t}finally{try{a||null==n.return||n.return()}finally{if(s)throw o}}return i}}(t,e)||function(t,e){if(t){if("string"==typeof t)return xe(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?xe(t,e):void 0}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function xe(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}function we(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function _e(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(me,"__esModule",{value:!0}),me.default=void 0,me.getRectOffset=Ee;var Pe=function(){function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),_e(this,"states",[]),_e(this,"startOffset",{left:0,right:0,top:0,bottom:0}),_e(this,"startDelta",void 0),_e(this,"result",void 0),_e(this,"endResult",void 0),_e(this,"startEdges",void 0),_e(this,"edges",void 0),_e(this,"interaction",void 0),this.interaction=e,this.result=Oe(),this.edges={left:!1,right:!1,top:!1,bottom:!1}}var e,n;return e=t,(n=[{key:"start",value:function(t,e){var n=t.phase,r=this.interaction,o=function(t){var e=t.interactable.options[t.prepared.name],n=e.modifiers;return n&&n.length?n:["snap","snapSize","snapEdges","restrict","restrictEdges","restrictSize"].map((function(t){var n=e[t];return n&&n.enabled&&{options:n,methods:n._methods}})).filter((function(t){return!!t}))}(r);this.prepareStates(o),this.startEdges=(0,M.default)({},r.edges),this.edges=(0,M.default)({},this.startEdges),this.startOffset=Ee(r.rect,e),this.startDelta={x:0,y:0};var i=this.fillArg({phase:n,pageCoords:e,preEnd:!1});return this.result=Oe(),this.startAll(i),this.result=this.setAll(i)}},{key:"fillArg",value:function(t){var e=this.interaction;return t.interaction=e,t.interactable=e.interactable,t.element=e.element,t.rect||(t.rect=e.rect),t.edges||(t.edges=this.startEdges),t.startOffset=this.startOffset,t}},{key:"startAll",value:function(t){for(var e=0;e<this.states.length;e++){var n=this.states[e];n.methods.start&&(t.state=n,n.methods.start(t))}}},{key:"setAll",value:function(t){var e=t.phase,n=t.preEnd,r=t.skipModifiers,o=t.rect,i=t.edges;t.coords=(0,M.default)({},t.pageCoords),t.rect=(0,M.default)({},o),t.edges=(0,M.default)({},i);for(var a=r?this.states.slice(r):this.states,s=Oe(t.coords,t.rect),l=0;l<a.length;l++){var u,c=a[l],f=c.options,d=(0,M.default)({},t.coords),p=null;null!=(u=c.methods)&&u.set&&this.shouldDo(f,n,e)&&(t.state=c,p=c.methods.set(t),k.addEdges(t.edges,t.rect,{x:t.coords.x-d.x,y:t.coords.y-d.y})),s.eventProps.push(p)}(0,M.default)(this.edges,t.edges),s.delta.x=t.coords.x-t.pageCoords.x,s.delta.y=t.coords.y-t.pageCoords.y,s.rectDelta.left=t.rect.left-o.left,s.rectDelta.right=t.rect.right-o.right,s.rectDelta.top=t.rect.top-o.top,s.rectDelta.bottom=t.rect.bottom-o.bottom;var v=this.result.coords,h=this.result.rect;if(v&&h){var g=s.rect.left!==h.left||s.rect.right!==h.right||s.rect.top!==h.top||s.rect.bottom!==h.bottom;s.changed=g||v.x!==s.coords.x||v.y!==s.coords.y}return s}},{key:"applyToInteraction",value:function(t){var e=this.interaction,n=t.phase,r=e.coords.cur,o=e.coords.start,i=this.result,a=this.startDelta,s=i.delta;"start"===n&&(0,M.default)(this.startDelta,i.delta);for(var l=0;l<[[o,a],[r,s]].length;l++){var u=be([[o,a],[r,s]][l],2),c=u[0],f=u[1];c.page.x+=f.x,c.page.y+=f.y,c.client.x+=f.x,c.client.y+=f.y}var d=this.result.rectDelta,p=t.rect||e.rect;p.left+=d.left,p.right+=d.right,p.top+=d.top,p.bottom+=d.bottom,p.width=p.right-p.left,p.height=p.bottom-p.top}},{key:"setAndApply",value:function(t){var e=this.interaction,n=t.phase,r=t.preEnd,o=t.skipModifiers,i=this.setAll(this.fillArg({preEnd:r,phase:n,pageCoords:t.modifiedCoords||e.coords.cur.page}));if(this.result=i,!i.changed&&(!o||o<this.states.length)&&e.interacting())return!1;if(t.modifiedCoords){var a=e.coords.cur.page,s={x:t.modifiedCoords.x-a.x,y:t.modifiedCoords.y-a.y};i.coords.x+=s.x,i.coords.y+=s.y,i.delta.x+=s.x,i.delta.y+=s.y}this.applyToInteraction(t)}},{key:"beforeEnd",value:function(t){var e=t.interaction,n=t.event,r=this.states;if(r&&r.length){for(var o=!1,i=0;i<r.length;i++){var a=r[i];t.state=a;var s=a.options,l=a.methods,u=l.beforeEnd&&l.beforeEnd(t);if(u)return this.endResult=u,!1;o=o||!o&&this.shouldDo(s,!0,t.phase,!0)}o&&e.move({event:n,preEnd:!0})}}},{key:"stop",value:function(t){var e=t.interaction;if(this.states&&this.states.length){var n=(0,M.default)({states:this.states,interactable:e.interactable,element:e.element,rect:null},t);this.fillArg(n);for(var r=0;r<this.states.length;r++){var o=this.states[r];n.state=o,o.methods.stop&&o.methods.stop(n)}this.states=null,this.endResult=null}}},{key:"prepareStates",value:function(t){this.states=[];for(var e=0;e<t.length;e++){var n=t[e],r=n.options,o=n.methods,i=n.name;this.states.push({options:r,methods:o,index:e,name:i})}return this.states}},{key:"restoreInteractionCoords",value:function(t){var e=t.interaction,n=e.coords,r=e.rect,o=e.modification;if(o.result){for(var i=o.startDelta,a=o.result,s=a.delta,l=a.rectDelta,u=[[n.start,i],[n.cur,s]],c=0;c<u.length;c++){var f=be(u[c],2),d=f[0],p=f[1];d.page.x-=p.x,d.page.y-=p.y,d.client.x-=p.x,d.client.y-=p.y}r.left-=l.left,r.right-=l.right,r.top-=l.top,r.bottom-=l.bottom}}},{key:"shouldDo",value:function(t,e,n,r){return!(!t||!1===t.enabled||r&&!t.endOnly||t.endOnly&&!e||"start"===n&&!t.setStart)}},{key:"copyFrom",value:function(t){this.startOffset=t.startOffset,this.startDelta=t.startDelta,this.startEdges=t.startEdges,this.edges=t.edges,this.states=t.states.map((function(t){return(0,ye.default)(t)})),this.result=Oe((0,M.default)({},t.result.coords),(0,M.default)({},t.result.rect))}},{key:"destroy",value:function(){for(var t in this)this[t]=null}}])&&we(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();function Oe(t,e){return{rect:e,coords:t,delta:{x:0,y:0},rectDelta:{left:0,right:0,top:0,bottom:0},eventProps:[],changed:!0}}function Ee(t,e){return t?{left:e.x-t.left,top:e.y-t.top,right:t.right-e.x,bottom:t.bottom-e.y}:{left:0,top:0,right:0,bottom:0}}me.default=Pe;var Se={};function Te(t){var e=t.iEvent,n=t.interaction.modification.result;n&&(e.modifiers=n.eventProps)}Object.defineProperty(Se,"__esModule",{value:!0}),Se.addEventModifiers=Te,Se.default=void 0,Se.makeModifier=function(t,e){var n=t.defaults,r={start:t.start,set:t.set,beforeEnd:t.beforeEnd,stop:t.stop},o=function(t){var o=t||{};for(var i in o.enabled=!1!==o.enabled,n)i in o||(o[i]=n[i]);var a={options:o,methods:r,name:e,enable:function(){return o.enabled=!0,a},disable:function(){return o.enabled=!1,a}};return a};return e&&"string"==typeof e&&(o._defaults=n,o._methods=r),o};var je={id:"modifiers/base",before:["actions"],install:function(t){t.defaults.perAction.modifiers=[]},listeners:{"interactions:new":function(t){var e=t.interaction;e.modification=new me.default(e)},"interactions:before-action-start":function(t){var e=t.interaction,n=t.interaction.modification;n.start(t,e.coords.start.page),e.edges=n.edges,n.applyToInteraction(t)},"interactions:before-action-move":function(t){var e=t.interaction,n=e.modification,r=n.setAndApply(t);return e.edges=n.edges,r},"interactions:before-action-end":function(t){var e=t.interaction,n=e.modification,r=n.beforeEnd(t);return e.edges=n.startEdges,r},"interactions:action-start":Te,"interactions:action-move":Te,"interactions:action-end":Te,"interactions:after-action-start":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:after-action-move":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:stop":function(t){return t.interaction.modification.stop(t)}}},Me=je;Se.default=Me;var ke={};Object.defineProperty(ke,"__esModule",{value:!0}),ke.defaults=void 0,ke.defaults={base:{preventDefault:"auto",deltaSource:"page"},perAction:{enabled:!1,origin:{x:0,y:0}},actions:{}};var Ie={};function De(t){return De="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},De(t)}function Ae(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function ze(t,e){return ze=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},ze(t,e)}function Ce(t,e){if(e&&("object"===De(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return Re(t)}function Re(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function Fe(t){return Fe=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},Fe(t)}function Xe(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(Ie,"__esModule",{value:!0}),Ie.InteractEvent=void 0;var Be=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&ze(t,e)}(a,t);var e,n,r,o,i=(r=a,o=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}(),function(){var t,e=Fe(r);if(o){var n=Fe(this).constructor;t=Reflect.construct(e,arguments,n)}else t=e.apply(this,arguments);return Ce(this,t)});function a(t,e,n,r,o,s,l){var u;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,a),Xe(Re(u=i.call(this,t)),"relatedTarget",null),Xe(Re(u),"screenX",void 0),Xe(Re(u),"screenY",void 0),Xe(Re(u),"button",void 0),Xe(Re(u),"buttons",void 0),Xe(Re(u),"ctrlKey",void 0),Xe(Re(u),"shiftKey",void 0),Xe(Re(u),"altKey",void 0),Xe(Re(u),"metaKey",void 0),Xe(Re(u),"page",void 0),Xe(Re(u),"client",void 0),Xe(Re(u),"delta",void 0),Xe(Re(u),"rect",void 0),Xe(Re(u),"x0",void 0),Xe(Re(u),"y0",void 0),Xe(Re(u),"t0",void 0),Xe(Re(u),"dt",void 0),Xe(Re(u),"duration",void 0),Xe(Re(u),"clientX0",void 0),Xe(Re(u),"clientY0",void 0),Xe(Re(u),"velocity",void 0),Xe(Re(u),"speed",void 0),Xe(Re(u),"swipe",void 0),Xe(Re(u),"axes",void 0),Xe(Re(u),"preEnd",void 0),o=o||t.element;var c=t.interactable,f=(c&&c.options||ke.defaults).deltaSource,d=(0,A.default)(c,o,n),p="start"===r,v="end"===r,h=p?Re(u):t.prevEvent,g=p?t.coords.start:v?{page:h.page,client:h.client,timeStamp:t.coords.cur.timeStamp}:t.coords.cur;return u.page=(0,M.default)({},g.page),u.client=(0,M.default)({},g.client),u.rect=(0,M.default)({},t.rect),u.timeStamp=g.timeStamp,v||(u.page.x-=d.x,u.page.y-=d.y,u.client.x-=d.x,u.client.y-=d.y),u.ctrlKey=e.ctrlKey,u.altKey=e.altKey,u.shiftKey=e.shiftKey,u.metaKey=e.metaKey,u.button=e.button,u.buttons=e.buttons,u.target=o,u.currentTarget=o,u.preEnd=s,u.type=l||n+(r||""),u.interactable=c,u.t0=p?t.pointers[t.pointers.length-1].downTime:h.t0,u.x0=t.coords.start.page.x-d.x,u.y0=t.coords.start.page.y-d.y,u.clientX0=t.coords.start.client.x-d.x,u.clientY0=t.coords.start.client.y-d.y,u.delta=p||v?{x:0,y:0}:{x:u[f].x-h[f].x,y:u[f].y-h[f].y},u.dt=t.coords.delta.timeStamp,u.duration=u.timeStamp-u.t0,u.velocity=(0,M.default)({},t.coords.velocity[f]),u.speed=(0,R.default)(u.velocity.x,u.velocity.y),u.swipe=v||"inertiastart"===r?u.getSwipe():null,u}return e=a,(n=[{key:"getSwipe",value:function(){var t=this._interaction;if(t.prevEvent.speed<600||this.timeStamp-t.prevEvent.timeStamp>150)return null;var e=180*Math.atan2(t.prevEvent.velocityY,t.prevEvent.velocityX)/Math.PI;e<0&&(e+=360);var n=112.5<=e&&e<247.5,r=202.5<=e&&e<337.5;return{up:r,down:!r&&22.5<=e&&e<157.5,left:n,right:!n&&(292.5<=e||e<67.5),angle:e,speed:t.prevEvent.speed,velocity:{x:t.prevEvent.velocityX,y:t.prevEvent.velocityY}}}},{key:"preventDefault",value:function(){}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}}])&&Ae(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),a}(N.BaseEvent);Ie.InteractEvent=Be,Object.defineProperties(Be.prototype,{pageX:{get:function(){return this.page.x},set:function(t){this.page.x=t}},pageY:{get:function(){return this.page.y},set:function(t){this.page.y=t}},clientX:{get:function(){return this.client.x},set:function(t){this.client.x=t}},clientY:{get:function(){return this.client.y},set:function(t){this.client.y=t}},dx:{get:function(){return this.delta.x},set:function(t){this.delta.x=t}},dy:{get:function(){return this.delta.y},set:function(t){this.delta.y=t}},velocityX:{get:function(){return this.velocity.x},set:function(t){this.velocity.x=t}},velocityY:{get:function(){return this.velocity.y},set:function(t){this.velocity.y=t}}});var Ye={};function We(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function Le(t,e,n){return e&&We(t.prototype,e),n&&We(t,n),Object.defineProperty(t,"prototype",{writable:!1}),t}function Ue(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(Ye,"__esModule",{value:!0}),Ye.PointerInfo=void 0;var Ve=Le((function t(e,n,r,o,i){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),Ue(this,"id",void 0),Ue(this,"pointer",void 0),Ue(this,"event",void 0),Ue(this,"downTime",void 0),Ue(this,"downTarget",void 0),this.id=e,this.pointer=n,this.event=r,this.downTime=o,this.downTarget=i}));Ye.PointerInfo=Ve;var Ne,qe,Ge={};function $e(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function He(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(Ge,"__esModule",{value:!0}),Ge.Interaction=void 0,Object.defineProperty(Ge,"PointerInfo",{enumerable:!0,get:function(){return Ye.PointerInfo}}),Ge.default=Ge._ProxyValues=Ge._ProxyMethods=void 0,Ge._ProxyValues=Ne,function(t){t.interactable="",t.element="",t.prepared="",t.pointerIsDown="",t.pointerWasMoved="",t._proxy=""}(Ne||(Ge._ProxyValues=Ne={})),Ge._ProxyMethods=qe,function(t){t.start="",t.move="",t.end="",t.stop="",t.interacting=""}(qe||(Ge._ProxyMethods=qe={}));var Ke=0,Ze=function(){function t(e){var n=this,r=e.pointerType,o=e.scopeFire;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),He(this,"interactable",null),He(this,"element",null),He(this,"rect",null),He(this,"_rects",void 0),He(this,"edges",null),He(this,"_scopeFire",void 0),He(this,"prepared",{name:null,axis:null,edges:null}),He(this,"pointerType",void 0),He(this,"pointers",[]),He(this,"downEvent",null),He(this,"downPointer",{}),He(this,"_latestPointer",{pointer:null,event:null,eventTarget:null}),He(this,"prevEvent",null),He(this,"pointerIsDown",!1),He(this,"pointerWasMoved",!1),He(this,"_interacting",!1),He(this,"_ending",!1),He(this,"_stopped",!0),He(this,"_proxy",null),He(this,"simulation",null),He(this,"doMove",(0,Xt.warnOnce)((function(t){this.move(t)}),"The interaction.doMove() method has been renamed to interaction.move()")),He(this,"coords",{start:X.newCoords(),prev:X.newCoords(),cur:X.newCoords(),delta:X.newCoords(),velocity:X.newCoords()}),He(this,"_id",Ke++),this._scopeFire=o,this.pointerType=r;var i=this;this._proxy={};var a=function(t){Object.defineProperty(n._proxy,t,{get:function(){return i[t]}})};for(var s in Ne)a(s);var l=function(t){Object.defineProperty(n._proxy,t,{value:function(){return i[t].apply(i,arguments)}})};for(var u in qe)l(u);this._scopeFire("interactions:new",{interaction:this})}var e,n;return e=t,n=[{key:"pointerMoveTolerance",get:function(){return 1}},{key:"pointerDown",value:function(t,e,n){var r=this.updatePointer(t,e,n,!0),o=this.pointers[r];this._scopeFire("interactions:down",{pointer:t,event:e,eventTarget:n,pointerIndex:r,pointerInfo:o,type:"down",interaction:this})}},{key:"start",value:function(t,e,n){return!(this.interacting()||!this.pointerIsDown||this.pointers.length<("gesture"===t.name?2:1)||!e.options[t.name].enabled)&&((0,Xt.copyAction)(this.prepared,t),this.interactable=e,this.element=n,this.rect=e.getRect(n),this.edges=this.prepared.edges?(0,M.default)({},this.prepared.edges):{left:!0,right:!0,top:!0,bottom:!0},this._stopped=!1,this._interacting=this._doPhase({interaction:this,event:this.downEvent,phase:"start"})&&!this._stopped,this._interacting)}},{key:"pointerMove",value:function(t,e,n){this.simulation||this.modification&&this.modification.endResult||this.updatePointer(t,e,n,!1);var r,o,i=this.coords.cur.page.x===this.coords.prev.page.x&&this.coords.cur.page.y===this.coords.prev.page.y&&this.coords.cur.client.x===this.coords.prev.client.x&&this.coords.cur.client.y===this.coords.prev.client.y;this.pointerIsDown&&!this.pointerWasMoved&&(r=this.coords.cur.client.x-this.coords.start.client.x,o=this.coords.cur.client.y-this.coords.start.client.y,this.pointerWasMoved=(0,R.default)(r,o)>this.pointerMoveTolerance);var a=this.getPointerIndex(t),s={pointer:t,pointerIndex:a,pointerInfo:this.pointers[a],event:e,type:"move",eventTarget:n,dx:r,dy:o,duplicate:i,interaction:this};i||X.setCoordVelocity(this.coords.velocity,this.coords.delta),this._scopeFire("interactions:move",s),i||this.simulation||(this.interacting()&&(s.type=null,this.move(s)),this.pointerWasMoved&&X.copyCoords(this.coords.prev,this.coords.cur))}},{key:"move",value:function(t){t&&t.event||X.setZeroCoords(this.coords.delta),(t=(0,M.default)({pointer:this._latestPointer.pointer,event:this._latestPointer.event,eventTarget:this._latestPointer.eventTarget,interaction:this},t||{})).phase="move",this._doPhase(t)}},{key:"pointerUp",value:function(t,e,n,r){var o=this.getPointerIndex(t);-1===o&&(o=this.updatePointer(t,e,n,!1));var i=/cancel$/i.test(e.type)?"cancel":"up";this._scopeFire("interactions:".concat(i),{pointer:t,pointerIndex:o,pointerInfo:this.pointers[o],event:e,eventTarget:n,type:i,curEventTarget:r,interaction:this}),this.simulation||this.end(e),this.removePointer(t,e)}},{key:"documentBlur",value:function(t){this.end(t),this._scopeFire("interactions:blur",{event:t,type:"blur",interaction:this})}},{key:"end",value:function(t){var e;this._ending=!0,t=t||this._latestPointer.event,this.interacting()&&(e=this._doPhase({event:t,interaction:this,phase:"end"})),this._ending=!1,!0===e&&this.stop()}},{key:"currentAction",value:function(){return this._interacting?this.prepared.name:null}},{key:"interacting",value:function(){return this._interacting}},{key:"stop",value:function(){this._scopeFire("interactions:stop",{interaction:this}),this.interactable=this.element=null,this._interacting=!1,this._stopped=!0,this.prepared.name=this.prevEvent=null}},{key:"getPointerIndex",value:function(t){var e=X.getPointerId(t);return"mouse"===this.pointerType||"pen"===this.pointerType?this.pointers.length-1:H.findIndex(this.pointers,(function(t){return t.id===e}))}},{key:"getPointerInfo",value:function(t){return this.pointers[this.getPointerIndex(t)]}},{key:"updatePointer",value:function(t,e,n,r){var o=X.getPointerId(t),i=this.getPointerIndex(t),a=this.pointers[i];return r=!1!==r&&(r||/(down|start)$/i.test(e.type)),a?a.pointer=t:(a=new Ye.PointerInfo(o,t,e,null,null),i=this.pointers.length,this.pointers.push(a)),X.setCoords(this.coords.cur,this.pointers.map((function(t){return t.pointer})),this._now()),X.setCoordDeltas(this.coords.delta,this.coords.prev,this.coords.cur),r&&(this.pointerIsDown=!0,a.downTime=this.coords.cur.timeStamp,a.downTarget=n,X.pointerExtend(this.downPointer,t),this.interacting()||(X.copyCoords(this.coords.start,this.coords.cur),X.copyCoords(this.coords.prev,this.coords.cur),this.downEvent=e,this.pointerWasMoved=!1)),this._updateLatestPointer(t,e,n),this._scopeFire("interactions:update-pointer",{pointer:t,event:e,eventTarget:n,down:r,pointerInfo:a,pointerIndex:i,interaction:this}),i}},{key:"removePointer",value:function(t,e){var n=this.getPointerIndex(t);if(-1!==n){var r=this.pointers[n];this._scopeFire("interactions:remove-pointer",{pointer:t,event:e,eventTarget:null,pointerIndex:n,pointerInfo:r,interaction:this}),this.pointers.splice(n,1),this.pointerIsDown=!1}}},{key:"_updateLatestPointer",value:function(t,e,n){this._latestPointer.pointer=t,this._latestPointer.event=e,this._latestPointer.eventTarget=n}},{key:"destroy",value:function(){this._latestPointer.pointer=null,this._latestPointer.event=null,this._latestPointer.eventTarget=null}},{key:"_createPreparedEvent",value:function(t,e,n,r){return new Ie.InteractEvent(this,t,this.prepared.name,e,this.element,n,r)}},{key:"_fireEvent",value:function(t){var e;null==(e=this.interactable)||e.fire(t),(!this.prevEvent||t.timeStamp>=this.prevEvent.timeStamp)&&(this.prevEvent=t)}},{key:"_doPhase",value:function(t){var e=t.event,n=t.phase,r=t.preEnd,o=t.type,i=this.rect;if(i&&"move"===n&&(k.addEdges(this.edges,i,this.coords.delta[this.interactable.options.deltaSource]),i.width=i.right-i.left,i.height=i.bottom-i.top),!1===this._scopeFire("interactions:before-action-".concat(n),t))return!1;var a=t.iEvent=this._createPreparedEvent(e,n,r,o);return this._scopeFire("interactions:action-".concat(n),t),"start"===n&&(this.prevEvent=a),this._fireEvent(a),this._scopeFire("interactions:after-action-".concat(n),t),!0}},{key:"_now",value:function(){return Date.now()}}],n&&$e(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();Ge.Interaction=Ze;var Je=Ze;Ge.default=Je;var Qe={};function tn(t){t.pointerIsDown&&(on(t.coords.cur,t.offset.total),t.offset.pending.x=0,t.offset.pending.y=0)}function en(t){nn(t.interaction)}function nn(t){if(!function(t){return!(!t.offset.pending.x&&!t.offset.pending.y)}(t))return!1;var e=t.offset.pending;return on(t.coords.cur,e),on(t.coords.delta,e),k.addEdges(t.edges,t.rect,e),e.x=0,e.y=0,!0}function rn(t){var e=t.x,n=t.y;this.offset.pending.x+=e,this.offset.pending.y+=n,this.offset.total.x+=e,this.offset.total.y+=n}function on(t,e){var n=t.page,r=t.client,o=e.x,i=e.y;n.x+=o,n.y+=i,r.x+=o,r.y+=i}Object.defineProperty(Qe,"__esModule",{value:!0}),Qe.addTotal=tn,Qe.applyPending=nn,Qe.default=void 0,Ge._ProxyMethods.offsetBy="";var an={id:"offset",before:["modifiers","pointer-events","actions","inertia"],install:function(t){t.Interaction.prototype.offsetBy=rn},listeners:{"interactions:new":function(t){t.interaction.offset={total:{x:0,y:0},pending:{x:0,y:0}}},"interactions:update-pointer":function(t){return tn(t.interaction)},"interactions:before-action-start":en,"interactions:before-action-move":en,"interactions:before-action-end":function(t){var e=t.interaction;if(nn(e))return e.move({offset:!0}),e.end(),!1},"interactions:stop":function(t){var e=t.interaction;e.offset.total.x=0,e.offset.total.y=0,e.offset.pending.x=0,e.offset.pending.y=0}}},sn=an;Qe.default=sn;var ln={};function un(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function cn(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(ln,"__esModule",{value:!0}),ln.default=ln.InertiaState=void 0;var fn=function(){function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),cn(this,"active",!1),cn(this,"isModified",!1),cn(this,"smoothEnd",!1),cn(this,"allowResume",!1),cn(this,"modification",void 0),cn(this,"modifierCount",0),cn(this,"modifierArg",void 0),cn(this,"startCoords",void 0),cn(this,"t0",0),cn(this,"v0",0),cn(this,"te",0),cn(this,"targetOffset",void 0),cn(this,"modifiedOffset",void 0),cn(this,"currentOffset",void 0),cn(this,"lambda_v0",0),cn(this,"one_ve_v0",0),cn(this,"timeout",void 0),cn(this,"interaction",void 0),this.interaction=e}var e,n;return e=t,(n=[{key:"start",value:function(t){var e=this.interaction,n=dn(e);if(!n||!n.enabled)return!1;var r=e.coords.velocity.client,o=(0,R.default)(r.x,r.y),i=this.modification||(this.modification=new me.default(e));if(i.copyFrom(e.modification),this.t0=e._now(),this.allowResume=n.allowResume,this.v0=o,this.currentOffset={x:0,y:0},this.startCoords=e.coords.cur.page,this.modifierArg=i.fillArg({pageCoords:this.startCoords,preEnd:!0,phase:"inertiastart"}),this.t0-e.coords.cur.timeStamp<50&&o>n.minSpeed&&o>n.endSpeed)this.startInertia();else{if(i.result=i.setAll(this.modifierArg),!i.result.changed)return!1;this.startSmoothEnd()}return e.modification.result.rect=null,e.offsetBy(this.targetOffset),e._doPhase({interaction:e,event:t,phase:"inertiastart"}),e.offsetBy({x:-this.targetOffset.x,y:-this.targetOffset.y}),e.modification.result.rect=null,this.active=!0,e.simulation=this,!0}},{key:"startInertia",value:function(){var t=this,e=this.interaction.coords.velocity.client,n=dn(this.interaction),r=n.resistance,o=-Math.log(n.endSpeed/this.v0)/r;this.targetOffset={x:(e.x-o)/r,y:(e.y-o)/r},this.te=o,this.lambda_v0=r/this.v0,this.one_ve_v0=1-n.endSpeed/this.v0;var i=this.modification,a=this.modifierArg;a.pageCoords={x:this.startCoords.x+this.targetOffset.x,y:this.startCoords.y+this.targetOffset.y},i.result=i.setAll(a),i.result.changed&&(this.isModified=!0,this.modifiedOffset={x:this.targetOffset.x+i.result.delta.x,y:this.targetOffset.y+i.result.delta.y}),this.onNextFrame((function(){return t.inertiaTick()}))}},{key:"startSmoothEnd",value:function(){var t=this;this.smoothEnd=!0,this.isModified=!0,this.targetOffset={x:this.modification.result.delta.x,y:this.modification.result.delta.y},this.onNextFrame((function(){return t.smoothEndTick()}))}},{key:"onNextFrame",value:function(t){var e=this;this.timeout=Tt.default.request((function(){e.active&&t()}))}},{key:"inertiaTick",value:function(){var t,e,n,r,o,i=this,a=this.interaction,s=dn(a).resistance,l=(a._now()-this.t0)/1e3;if(l<this.te){var u,c=1-(Math.exp(-s*l)-this.lambda_v0)/this.one_ve_v0;this.isModified?(0,0,t=this.targetOffset.x,e=this.targetOffset.y,n=this.modifiedOffset.x,r=this.modifiedOffset.y,u={x:vn(o=c,0,t,n),y:vn(o,0,e,r)}):u={x:this.targetOffset.x*c,y:this.targetOffset.y*c};var f={x:u.x-this.currentOffset.x,y:u.y-this.currentOffset.y};this.currentOffset.x+=f.x,this.currentOffset.y+=f.y,a.offsetBy(f),a.move(),this.onNextFrame((function(){return i.inertiaTick()}))}else a.offsetBy({x:this.modifiedOffset.x-this.currentOffset.x,y:this.modifiedOffset.y-this.currentOffset.y}),this.end()}},{key:"smoothEndTick",value:function(){var t=this,e=this.interaction,n=e._now()-this.t0,r=dn(e).smoothEndDuration;if(n<r){var o={x:hn(n,0,this.targetOffset.x,r),y:hn(n,0,this.targetOffset.y,r)},i={x:o.x-this.currentOffset.x,y:o.y-this.currentOffset.y};this.currentOffset.x+=i.x,this.currentOffset.y+=i.y,e.offsetBy(i),e.move({skipModifiers:this.modifierCount}),this.onNextFrame((function(){return t.smoothEndTick()}))}else e.offsetBy({x:this.targetOffset.x-this.currentOffset.x,y:this.targetOffset.y-this.currentOffset.y}),this.end()}},{key:"resume",value:function(t){var e=t.pointer,n=t.event,r=t.eventTarget,o=this.interaction;o.offsetBy({x:-this.currentOffset.x,y:-this.currentOffset.y}),o.updatePointer(e,n,r,!0),o._doPhase({interaction:o,event:n,phase:"resume"}),(0,X.copyCoords)(o.coords.prev,o.coords.cur),this.stop()}},{key:"end",value:function(){this.interaction.move(),this.interaction.end(),this.stop()}},{key:"stop",value:function(){this.active=this.smoothEnd=!1,this.interaction.simulation=null,Tt.default.cancel(this.timeout)}}])&&un(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();function dn(t){var e=t.interactable,n=t.prepared;return e&&e.options&&n.name&&e.options[n.name].inertia}ln.InertiaState=fn;var pn={id:"inertia",before:["modifiers","actions"],install:function(t){var e=t.defaults;t.usePlugin(Qe.default),t.usePlugin(Se.default),t.actions.phases.inertiastart=!0,t.actions.phases.resume=!0,e.perAction.inertia={enabled:!1,resistance:10,minSpeed:100,endSpeed:10,allowResume:!0,smoothEndDuration:300}},listeners:{"interactions:new":function(t){var e=t.interaction;e.inertia=new fn(e)},"interactions:before-action-end":function(t){var e=t.interaction,n=t.event;return(!e._interacting||e.simulation||!e.inertia.start(n))&&null},"interactions:down":function(t){var e=t.interaction,n=t.eventTarget,r=e.inertia;if(r.active)for(var o=n;i.default.element(o);){if(o===e.element){r.resume(t);break}o=_.parentNode(o)}},"interactions:stop":function(t){var e=t.interaction.inertia;e.active&&e.stop()},"interactions:before-action-resume":function(t){var e=t.interaction.modification;e.stop(t),e.start(t,t.interaction.coords.cur.page),e.applyToInteraction(t)},"interactions:before-action-inertiastart":function(t){return t.interaction.modification.setAndApply(t)},"interactions:action-resume":Se.addEventModifiers,"interactions:action-inertiastart":Se.addEventModifiers,"interactions:after-action-inertiastart":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:after-action-resume":function(t){return t.interaction.modification.restoreInteractionCoords(t)}}};function vn(t,e,n,r){var o=1-t;return o*o*e+2*o*t*n+t*t*r}function hn(t,e,n,r){return-n*(t/=r)*(t-2)+e}var gn=pn;ln.default=gn;var yn={};function mn(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function bn(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function xn(t,e){for(var n=0;n<e.length;n++){var r=e[n];if(t.immediatePropagationStopped)break;r(t)}}Object.defineProperty(yn,"__esModule",{value:!0}),yn.Eventable=void 0;var wn=function(){function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),bn(this,"options",void 0),bn(this,"types",{}),bn(this,"propagationStopped",!1),bn(this,"immediatePropagationStopped",!1),bn(this,"global",void 0),this.options=(0,M.default)({},e||{})}var e,n;return e=t,(n=[{key:"fire",value:function(t){var e,n=this.global;(e=this.types[t.type])&&xn(t,e),!t.propagationStopped&&n&&(e=n[t.type])&&xn(t,e)}},{key:"on",value:function(t,e){var n=(0,z.default)(t,e);for(t in n)this.types[t]=H.merge(this.types[t]||[],n[t])}},{key:"off",value:function(t,e){var n=(0,z.default)(t,e);for(t in n){var r=this.types[t];if(r&&r.length)for(var o=0;o<n[t].length;o++){var i=n[t][o],a=r.indexOf(i);-1!==a&&r.splice(a,1)}}}},{key:"getRect",value:function(t){return null}}])&&mn(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();yn.Eventable=wn;var _n={};Object.defineProperty(_n,"__esModule",{value:!0}),_n.default=function(t,e){if(e.phaselessTypes[t])return!0;for(var n in e.map)if(0===t.indexOf(n)&&t.substr(n.length)in e.phases)return!0;return!1};var Pn={};Object.defineProperty(Pn,"__esModule",{value:!0}),Pn.createInteractStatic=function(t){var e=function e(n,r){var o=t.interactables.get(n,r);return o||((o=t.interactables.new(n,r)).events.global=e.globalEvents),o};return e.getPointerAverage=X.pointerAverage,e.getTouchBBox=X.touchBBox,e.getTouchDistance=X.touchDistance,e.getTouchAngle=X.touchAngle,e.getElementRect=_.getElementRect,e.getElementClientRect=_.getElementClientRect,e.matchesSelector=_.matchesSelector,e.closest=_.closest,e.globalEvents={},e.version="1.10.18",e.scope=t,e.use=function(t,e){return this.scope.usePlugin(t,e),this},e.isSet=function(t,e){return!!this.scope.interactables.get(t,e&&e.context)},e.on=(0,Xt.warnOnce)((function(t,e,n){if(i.default.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),i.default.array(t)){for(var r=0;r<t.length;r++){var o=t[r];this.on(o,e,n)}return this}if(i.default.object(t)){for(var a in t)this.on(a,t[a],e);return this}return(0,_n.default)(t,this.scope.actions)?this.globalEvents[t]?this.globalEvents[t].push(e):this.globalEvents[t]=[e]:this.scope.events.add(this.scope.document,t,e,{options:n}),this}),"The interact.on() method is being deprecated"),e.off=(0,Xt.warnOnce)((function(t,e,n){if(i.default.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),i.default.array(t)){for(var r=0;r<t.length;r++){var o=t[r];this.off(o,e,n)}return this}if(i.default.object(t)){for(var a in t)this.off(a,t[a],e);return this}var s;return(0,_n.default)(t,this.scope.actions)?t in this.globalEvents&&-1!==(s=this.globalEvents[t].indexOf(e))&&this.globalEvents[t].splice(s,1):this.scope.events.remove(this.scope.document,t,e,n),this}),"The interact.off() method is being deprecated"),e.debug=function(){return this.scope},e.supportsTouch=function(){return b.default.supportsTouch},e.supportsPointerEvent=function(){return b.default.supportsPointerEvent},e.stop=function(){for(var t=0;t<this.scope.interactions.list.length;t++)this.scope.interactions.list[t].stop();return this},e.pointerMoveTolerance=function(t){return i.default.number(t)?(this.scope.interactions.pointerMoveTolerance=t,this):this.scope.interactions.pointerMoveTolerance},e.addDocument=function(t,e){this.scope.addDocument(t,e)},e.removeDocument=function(t){this.scope.removeDocument(t)},e};var On={};function En(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function Sn(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(On,"__esModule",{value:!0}),On.Interactable=void 0;var Tn=function(){function t(n,r,o,i){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),Sn(this,"options",void 0),Sn(this,"_actions",void 0),Sn(this,"target",void 0),Sn(this,"events",new yn.Eventable),Sn(this,"_context",void 0),Sn(this,"_win",void 0),Sn(this,"_doc",void 0),Sn(this,"_scopeEvents",void 0),Sn(this,"_rectChecker",void 0),this._actions=r.actions,this.target=n,this._context=r.context||o,this._win=(0,e.getWindow)((0,_.trySelector)(n)?this._context:n),this._doc=this._win.document,this._scopeEvents=i,this.set(r)}var n,r;return n=t,(r=[{key:"_defaults",get:function(){return{base:{},perAction:{},actions:{}}}},{key:"setOnEvents",value:function(t,e){return i.default.func(e.onstart)&&this.on("".concat(t,"start"),e.onstart),i.default.func(e.onmove)&&this.on("".concat(t,"move"),e.onmove),i.default.func(e.onend)&&this.on("".concat(t,"end"),e.onend),i.default.func(e.oninertiastart)&&this.on("".concat(t,"inertiastart"),e.oninertiastart),this}},{key:"updatePerActionListeners",value:function(t,e,n){(i.default.array(e)||i.default.object(e))&&this.off(t,e),(i.default.array(n)||i.default.object(n))&&this.on(t,n)}},{key:"setPerAction",value:function(t,e){var n=this._defaults;for(var r in e){var o=r,a=this.options[t],s=e[o];"listeners"===o&&this.updatePerActionListeners(t,a.listeners,s),i.default.array(s)?a[o]=H.from(s):i.default.plainObject(s)?(a[o]=(0,M.default)(a[o]||{},(0,ye.default)(s)),i.default.object(n.perAction[o])&&"enabled"in n.perAction[o]&&(a[o].enabled=!1!==s.enabled)):i.default.bool(s)&&i.default.object(n.perAction[o])?a[o].enabled=s:a[o]=s}}},{key:"getRect",value:function(t){return t=t||(i.default.element(this.target)?this.target:null),i.default.string(this.target)&&(t=t||this._context.querySelector(this.target)),(0,_.getElementRect)(t)}},{key:"rectChecker",value:function(t){var e=this;return i.default.func(t)?(this._rectChecker=t,this.getRect=function(t){var n=(0,M.default)({},e._rectChecker(t));return"width"in n||(n.width=n.right-n.left,n.height=n.bottom-n.top),n},this):null===t?(delete this.getRect,delete this._rectChecker,this):this.getRect}},{key:"_backCompatOption",value:function(t,e){if((0,_.trySelector)(e)||i.default.object(e)){for(var n in this.options[t]=e,this._actions.map)this.options[n][t]=e;return this}return this.options[t]}},{key:"origin",value:function(t){return this._backCompatOption("origin",t)}},{key:"deltaSource",value:function(t){return"page"===t||"client"===t?(this.options.deltaSource=t,this):this.options.deltaSource}},{key:"context",value:function(){return this._context}},{key:"inContext",value:function(t){return this._context===t.ownerDocument||(0,_.nodeContains)(this._context,t)}},{key:"testIgnoreAllow",value:function(t,e,n){return!this.testIgnore(t.ignoreFrom,e,n)&&this.testAllow(t.allowFrom,e,n)}},{key:"testAllow",value:function(t,e,n){return!t||!!i.default.element(n)&&(i.default.string(t)?(0,_.matchesUpTo)(n,t,e):!!i.default.element(t)&&(0,_.nodeContains)(t,n))}},{key:"testIgnore",value:function(t,e,n){return!(!t||!i.default.element(n))&&(i.default.string(t)?(0,_.matchesUpTo)(n,t,e):!!i.default.element(t)&&(0,_.nodeContains)(t,n))}},{key:"fire",value:function(t){return this.events.fire(t),this}},{key:"_onOff",value:function(t,e,n,r){i.default.object(e)&&!i.default.array(e)&&(r=n,n=null);var o="on"===t?"add":"remove",a=(0,z.default)(e,n);for(var s in a){"wheel"===s&&(s=b.default.wheelEvent);for(var l=0;l<a[s].length;l++){var u=a[s][l];(0,_n.default)(s,this._actions)?this.events[t](s,u):i.default.string(this.target)?this._scopeEvents["".concat(o,"Delegate")](this.target,this._context,s,u,r):this._scopeEvents[o](this.target,s,u,r)}}return this}},{key:"on",value:function(t,e,n){return this._onOff("on",t,e,n)}},{key:"off",value:function(t,e,n){return this._onOff("off",t,e,n)}},{key:"set",value:function(t){var e=this._defaults;for(var n in i.default.object(t)||(t={}),this.options=(0,ye.default)(e.base),this._actions.methodDict){var r=n,o=this._actions.methodDict[r];this.options[r]={},this.setPerAction(r,(0,M.default)((0,M.default)({},e.perAction),e.actions[r])),this[o](t[r])}for(var a in t)i.default.func(this[a])&&this[a](t[a]);return this}},{key:"unset",value:function(){if(i.default.string(this.target))for(var t in this._scopeEvents.delegatedEvents)for(var e=this._scopeEvents.delegatedEvents[t],n=e.length-1;n>=0;n--){var r=e[n],o=r.selector,a=r.context,s=r.listeners;o===this.target&&a===this._context&&e.splice(n,1);for(var l=s.length-1;l>=0;l--)this._scopeEvents.removeDelegate(this.target,this._context,t,s[l][0],s[l][1])}else this._scopeEvents.remove(this.target,"all")}}])&&En(n.prototype,r),Object.defineProperty(n,"prototype",{writable:!1}),t}();On.Interactable=Tn;var jn={};function Mn(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function kn(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(jn,"__esModule",{value:!0}),jn.InteractableSet=void 0;var In=function(){function t(e){var n=this;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),kn(this,"list",[]),kn(this,"selectorMap",{}),kn(this,"scope",void 0),this.scope=e,e.addListeners({"interactable:unset":function(t){var e=t.interactable,r=e.target,o=e._context,a=i.default.string(r)?n.selectorMap[r]:r[n.scope.id],s=H.findIndex(a,(function(t){return t.context===o}));a[s]&&(a[s].context=null,a[s].interactable=null),a.splice(s,1)}})}var e,n;return e=t,(n=[{key:"new",value:function(t,e){e=(0,M.default)(e||{},{actions:this.scope.actions});var n=new this.scope.Interactable(t,e,this.scope.document,this.scope.events),r={context:n._context,interactable:n};return this.scope.addDocument(n._doc),this.list.push(n),i.default.string(t)?(this.selectorMap[t]||(this.selectorMap[t]=[]),this.selectorMap[t].push(r)):(n.target[this.scope.id]||Object.defineProperty(t,this.scope.id,{value:[],configurable:!0}),t[this.scope.id].push(r)),this.scope.fire("interactable:new",{target:t,options:e,interactable:n,win:this.scope._win}),n}},{key:"get",value:function(t,e){var n=e&&e.context||this.scope.document,r=i.default.string(t),o=r?this.selectorMap[t]:t[this.scope.id];if(!o)return null;var a=H.find(o,(function(e){return e.context===n&&(r||e.interactable.inContext(t))}));return a&&a.interactable}},{key:"forEachMatch",value:function(t,e){for(var n=0;n<this.list.length;n++){var r=this.list[n],o=void 0;if((i.default.string(r.target)?i.default.element(t)&&_.matchesSelector(t,r.target):t===r.target)&&r.inContext(t)&&(o=e(r)),void 0!==o)return o}}}])&&Mn(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();jn.InteractableSet=In;var Dn={};function An(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function zn(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Cn(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i=[],a=!0,s=!1;try{for(n=n.call(t);!(a=(r=n.next()).done)&&(i.push(r.value),!e||i.length!==e);a=!0);}catch(t){s=!0,o=t}finally{try{a||null==n.return||n.return()}finally{if(s)throw o}}return i}}(t,e)||function(t,e){if(t){if("string"==typeof t)return Rn(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Rn(t,e):void 0}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Rn(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}Object.defineProperty(Dn,"__esModule",{value:!0}),Dn.default=void 0;var Fn=function(){function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),zn(this,"currentTarget",void 0),zn(this,"originalEvent",void 0),zn(this,"type",void 0),this.originalEvent=e,(0,F.default)(this,e)}var e,n;return e=t,(n=[{key:"preventOriginalDefault",value:function(){this.originalEvent.preventDefault()}},{key:"stopPropagation",value:function(){this.originalEvent.stopPropagation()}},{key:"stopImmediatePropagation",value:function(){this.originalEvent.stopImmediatePropagation()}}])&&An(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();function Xn(t){if(!i.default.object(t))return{capture:!!t,passive:!1};var e=(0,M.default)({},t);return e.capture=!!t.capture,e.passive=!!t.passive,e}var Bn={id:"events",install:function(t){var e,n=[],r={},o=[],a={add:s,remove:l,addDelegate:function(t,e,n,i,a){var l=Xn(a);if(!r[n]){r[n]=[];for(var f=0;f<o.length;f++){var d=o[f];s(d,n,u),s(d,n,c,!0)}}var p=r[n],v=H.find(p,(function(n){return n.selector===t&&n.context===e}));v||(v={selector:t,context:e,listeners:[]},p.push(v)),v.listeners.push([i,l])},removeDelegate:function(t,e,n,o,i){var a,s=Xn(i),f=r[n],d=!1;if(f)for(a=f.length-1;a>=0;a--){var p=f[a];if(p.selector===t&&p.context===e){for(var v=p.listeners,h=v.length-1;h>=0;h--){var g=Cn(v[h],2),y=g[0],m=g[1],b=m.capture,x=m.passive;if(y===o&&b===s.capture&&x===s.passive){v.splice(h,1),v.length||(f.splice(a,1),l(e,n,u),l(e,n,c,!0)),d=!0;break}}if(d)break}}},delegateListener:u,delegateUseCapture:c,delegatedEvents:r,documents:o,targets:n,supportsOptions:!1,supportsPassive:!1};function s(t,e,r,o){var i=Xn(o),s=H.find(n,(function(e){return e.eventTarget===t}));s||(s={eventTarget:t,events:{}},n.push(s)),s.events[e]||(s.events[e]=[]),t.addEventListener&&!H.contains(s.events[e],r)&&(t.addEventListener(e,r,a.supportsOptions?i:i.capture),s.events[e].push(r))}function l(t,e,r,o){var i=Xn(o),s=H.findIndex(n,(function(e){return e.eventTarget===t})),u=n[s];if(u&&u.events)if("all"!==e){var c=!1,f=u.events[e];if(f){if("all"===r){for(var d=f.length-1;d>=0;d--)l(t,e,f[d],i);return}for(var p=0;p<f.length;p++)if(f[p]===r){t.removeEventListener(e,r,a.supportsOptions?i:i.capture),f.splice(p,1),0===f.length&&(delete u.events[e],c=!0);break}}c&&!Object.keys(u.events).length&&n.splice(s,1)}else for(e in u.events)u.events.hasOwnProperty(e)&&l(t,e,"all")}function u(t,e){for(var n=Xn(e),o=new Fn(t),a=r[t.type],s=Cn(X.getEventTargets(t),1)[0],l=s;i.default.element(l);){for(var u=0;u<a.length;u++){var c=a[u],f=c.selector,d=c.context;if(_.matchesSelector(l,f)&&_.nodeContains(d,s)&&_.nodeContains(d,l)){var p=c.listeners;o.currentTarget=l;for(var v=0;v<p.length;v++){var h=Cn(p[v],2),g=h[0],y=h[1],m=y.capture,b=y.passive;m===n.capture&&b===n.passive&&g(o)}}}l=_.parentNode(l)}}function c(t){return u(t,!0)}return null==(e=t.document)||e.createElement("div").addEventListener("test",null,{get capture(){return a.supportsOptions=!0},get passive(){return a.supportsPassive=!0}}),t.events=a,a}};Dn.default=Bn;var Yn={};Object.defineProperty(Yn,"__esModule",{value:!0}),Yn.default=void 0;var Wn={methodOrder:["simulationResume","mouseOrPen","hasPointer","idle"],search:function(t){for(var e=0;e<Wn.methodOrder.length;e++){var n;n=Wn.methodOrder[e];var r=Wn[n](t);if(r)return r}return null},simulationResume:function(t){var e=t.pointerType,n=t.eventType,r=t.eventTarget,o=t.scope;if(!/down|start/i.test(n))return null;for(var i=0;i<o.interactions.list.length;i++){var a=o.interactions.list[i],s=r;if(a.simulation&&a.simulation.allowResume&&a.pointerType===e)for(;s;){if(s===a.element)return a;s=_.parentNode(s)}}return null},mouseOrPen:function(t){var e,n=t.pointerId,r=t.pointerType,o=t.eventType,i=t.scope;if("mouse"!==r&&"pen"!==r)return null;for(var a=0;a<i.interactions.list.length;a++){var s=i.interactions.list[a];if(s.pointerType===r){if(s.simulation&&!Ln(s,n))continue;if(s.interacting())return s;e||(e=s)}}if(e)return e;for(var l=0;l<i.interactions.list.length;l++){var u=i.interactions.list[l];if(!(u.pointerType!==r||/down/i.test(o)&&u.simulation))return u}return null},hasPointer:function(t){for(var e=t.pointerId,n=t.scope,r=0;r<n.interactions.list.length;r++){var o=n.interactions.list[r];if(Ln(o,e))return o}return null},idle:function(t){for(var e=t.pointerType,n=t.scope,r=0;r<n.interactions.list.length;r++){var o=n.interactions.list[r];if(1===o.pointers.length){var i=o.interactable;if(i&&(!i.options.gesture||!i.options.gesture.enabled))continue}else if(o.pointers.length>=2)continue;if(!o.interacting()&&e===o.pointerType)return o}return null}};function Ln(t,e){return t.pointers.some((function(t){return t.id===e}))}var Un=Wn;Yn.default=Un;var Vn={};function Nn(t){return Nn="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},Nn(t)}function qn(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i=[],a=!0,s=!1;try{for(n=n.call(t);!(a=(r=n.next()).done)&&(i.push(r.value),!e||i.length!==e);a=!0);}catch(t){s=!0,o=t}finally{try{a||null==n.return||n.return()}finally{if(s)throw o}}return i}}(t,e)||function(t,e){if(t){if("string"==typeof t)return Gn(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Gn(t,e):void 0}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Gn(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}function $n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function Hn(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function Kn(t,e){return Kn=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},Kn(t,e)}function Zn(t,e){if(e&&("object"===Nn(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}function Jn(t){return Jn=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},Jn(t)}Object.defineProperty(Vn,"__esModule",{value:!0}),Vn.default=void 0;var Qn=["pointerDown","pointerMove","pointerUp","updatePointer","removePointer","windowBlur"];function tr(t,e){return function(n){var r=e.interactions.list,o=X.getPointerType(n),i=qn(X.getEventTargets(n),2),a=i[0],s=i[1],l=[];if(/^touch/.test(n.type)){e.prevTouchTime=e.now();for(var u=0;u<n.changedTouches.length;u++){var c=n.changedTouches[u],f={pointer:c,pointerId:X.getPointerId(c),pointerType:o,eventType:n.type,eventTarget:a,curEventTarget:s,scope:e},d=er(f);l.push([f.pointer,f.eventTarget,f.curEventTarget,d])}}else{var p=!1;if(!b.default.supportsPointerEvent&&/mouse/.test(n.type)){for(var v=0;v<r.length&&!p;v++)p="mouse"!==r[v].pointerType&&r[v].pointerIsDown;p=p||e.now()-e.prevTouchTime<500||0===n.timeStamp}if(!p){var h={pointer:n,pointerId:X.getPointerId(n),pointerType:o,eventType:n.type,curEventTarget:s,eventTarget:a,scope:e},g=er(h);l.push([h.pointer,h.eventTarget,h.curEventTarget,g])}}for(var y=0;y<l.length;y++){var m=qn(l[y],4),x=m[0],w=m[1],_=m[2];m[3][t](x,n,w,_)}}}function er(t){var e=t.pointerType,n=t.scope,r={interaction:Yn.default.search(t),searchDetails:t};return n.fire("interactions:find",r),r.interaction||n.interactions.new({pointerType:e})}function nr(t,e){var n=t.doc,r=t.scope,o=t.options,i=r.interactions.docEvents,a=r.events,s=a[e];for(var l in r.browser.isIOS&&!o.events&&(o.events={passive:!1}),a.delegatedEvents)s(n,l,a.delegateListener),s(n,l,a.delegateUseCapture,!0);for(var u=o&&o.events,c=0;c<i.length;c++){var f=i[c];s(n,f.type,f.listener,u)}}var rr={id:"core/interactions",install:function(t){for(var e={},n=0;n<Qn.length;n++){var r=Qn[n];e[r]=tr(r,t)}var o,i=b.default.pEventTypes;function a(){for(var e=0;e<t.interactions.list.length;e++){var n=t.interactions.list[e];if(n.pointerIsDown&&"touch"===n.pointerType&&!n._interacting)for(var r=function(){var e=n.pointers[o];t.documents.some((function(t){var n=t.doc;return(0,_.nodeContains)(n,e.downTarget)}))||n.removePointer(e.pointer,e.event)},o=0;o<n.pointers.length;o++)r()}}(o=h.default.PointerEvent?[{type:i.down,listener:a},{type:i.down,listener:e.pointerDown},{type:i.move,listener:e.pointerMove},{type:i.up,listener:e.pointerUp},{type:i.cancel,listener:e.pointerUp}]:[{type:"mousedown",listener:e.pointerDown},{type:"mousemove",listener:e.pointerMove},{type:"mouseup",listener:e.pointerUp},{type:"touchstart",listener:a},{type:"touchstart",listener:e.pointerDown},{type:"touchmove",listener:e.pointerMove},{type:"touchend",listener:e.pointerUp},{type:"touchcancel",listener:e.pointerUp}]).push({type:"blur",listener:function(e){for(var n=0;n<t.interactions.list.length;n++)t.interactions.list[n].documentBlur(e)}}),t.prevTouchTime=0,t.Interaction=function(e){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&Kn(t,e)}(s,e);var n,r,o,i,a=(o=s,i=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}(),function(){var t,e=Jn(o);if(i){var n=Jn(this).constructor;t=Reflect.construct(e,arguments,n)}else t=e.apply(this,arguments);return Zn(this,t)});function s(){return $n(this,s),a.apply(this,arguments)}return n=s,(r=[{key:"pointerMoveTolerance",get:function(){return t.interactions.pointerMoveTolerance},set:function(e){t.interactions.pointerMoveTolerance=e}},{key:"_now",value:function(){return t.now()}}])&&Hn(n.prototype,r),Object.defineProperty(n,"prototype",{writable:!1}),s}(Ge.default),t.interactions={list:[],new:function(e){e.scopeFire=function(e,n){return t.fire(e,n)};var n=new t.Interaction(e);return t.interactions.list.push(n),n},listeners:e,docEvents:o,pointerMoveTolerance:1},t.usePlugin(le.default)},listeners:{"scope:add-document":function(t){return nr(t,"add")},"scope:remove-document":function(t){return nr(t,"remove")},"interactable:unset":function(t,e){for(var n=t.interactable,r=e.interactions.list.length-1;r>=0;r--){var o=e.interactions.list[r];o.interactable===n&&(o.stop(),e.fire("interactions:destroy",{interaction:o}),o.destroy(),e.interactions.list.length>2&&e.interactions.list.splice(r,1))}}},onDocSignal:nr,doOnInteractions:tr,methodNames:Qn},or=rr;Vn.default=or;var ir={};function ar(t){return ar="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},ar(t)}function sr(){return sr="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(t,e,n){var r=lr(t,e);if(r){var o=Object.getOwnPropertyDescriptor(r,e);return o.get?o.get.call(arguments.length<3?t:n):o.value}},sr.apply(this,arguments)}function lr(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=fr(t)););return t}function ur(t,e){return ur=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},ur(t,e)}function cr(t,e){if(e&&("object"===ar(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}function fr(t){return fr=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},fr(t)}function dr(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function pr(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function vr(t,e,n){return e&&pr(t.prototype,e),n&&pr(t,n),Object.defineProperty(t,"prototype",{writable:!1}),t}function hr(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(ir,"__esModule",{value:!0}),ir.Scope=void 0,ir.initScope=yr;var gr=function(){function t(){var e=this;dr(this,t),hr(this,"id","__interact_scope_".concat(Math.floor(100*Math.random()))),hr(this,"isInitialized",!1),hr(this,"listenerMaps",[]),hr(this,"browser",b.default),hr(this,"defaults",(0,ye.default)(ke.defaults)),hr(this,"Eventable",yn.Eventable),hr(this,"actions",{map:{},phases:{start:!0,move:!0,end:!0},methodDict:{},phaselessTypes:{}}),hr(this,"interactStatic",(0,Pn.createInteractStatic)(this)),hr(this,"InteractEvent",Ie.InteractEvent),hr(this,"Interactable",void 0),hr(this,"interactables",new jn.InteractableSet(this)),hr(this,"_win",void 0),hr(this,"document",void 0),hr(this,"window",void 0),hr(this,"documents",[]),hr(this,"_plugins",{list:[],map:{}}),hr(this,"onWindowUnload",(function(t){return e.removeDocument(t.target)}));var n=this;this.Interactable=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&ur(t,e)}(i,t);var e,r,o=(e=i,r=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}(),function(){var t,n=fr(e);if(r){var o=fr(this).constructor;t=Reflect.construct(n,arguments,o)}else t=n.apply(this,arguments);return cr(this,t)});function i(){return dr(this,i),o.apply(this,arguments)}return vr(i,[{key:"_defaults",get:function(){return n.defaults}},{key:"set",value:function(t){return sr(fr(i.prototype),"set",this).call(this,t),n.fire("interactable:set",{options:t,interactable:this}),this}},{key:"unset",value:function(){sr(fr(i.prototype),"unset",this).call(this);var t=n.interactables.list.indexOf(this);t<0||(sr(fr(i.prototype),"unset",this).call(this),n.interactables.list.splice(t,1),n.fire("interactable:unset",{interactable:this}))}}]),i}(On.Interactable)}return vr(t,[{key:"addListeners",value:function(t,e){this.listenerMaps.push({id:e,map:t})}},{key:"fire",value:function(t,e){for(var n=0;n<this.listenerMaps.length;n++){var r=this.listenerMaps[n].map[t];if(r&&!1===r(e,this,t))return!1}}},{key:"init",value:function(t){return this.isInitialized?this:yr(this,t)}},{key:"pluginIsInstalled",value:function(t){return this._plugins.map[t.id]||-1!==this._plugins.list.indexOf(t)}},{key:"usePlugin",value:function(t,e){if(!this.isInitialized)return this;if(this.pluginIsInstalled(t))return this;if(t.id&&(this._plugins.map[t.id]=t),this._plugins.list.push(t),t.install&&t.install(this,e),t.listeners&&t.before){for(var n=0,r=this.listenerMaps.length,o=t.before.reduce((function(t,e){return t[e]=!0,t[mr(e)]=!0,t}),{});n<r;n++){var i=this.listenerMaps[n].id;if(o[i]||o[mr(i)])break}this.listenerMaps.splice(n,0,{id:t.id,map:t.listeners})}else t.listeners&&this.listenerMaps.push({id:t.id,map:t.listeners});return this}},{key:"addDocument",value:function(t,n){if(-1!==this.getDocIndex(t))return!1;var r=e.getWindow(t);n=n?(0,M.default)({},n):{},this.documents.push({doc:t,options:n}),this.events.documents.push(t),t!==this.document&&this.events.add(r,"unload",this.onWindowUnload),this.fire("scope:add-document",{doc:t,window:r,scope:this,options:n})}},{key:"removeDocument",value:function(t){var n=this.getDocIndex(t),r=e.getWindow(t),o=this.documents[n].options;this.events.remove(r,"unload",this.onWindowUnload),this.documents.splice(n,1),this.events.documents.splice(n,1),this.fire("scope:remove-document",{doc:t,window:r,scope:this,options:o})}},{key:"getDocIndex",value:function(t){for(var e=0;e<this.documents.length;e++)if(this.documents[e].doc===t)return e;return-1}},{key:"getDocOptions",value:function(t){var e=this.getDocIndex(t);return-1===e?null:this.documents[e].options}},{key:"now",value:function(){return(this.window.Date||Date).now()}}]),t}();function yr(t,n){return t.isInitialized=!0,i.default.window(n)&&e.init(n),h.default.init(n),b.default.init(n),Tt.default.init(n),t.window=n,t.document=n.document,t.usePlugin(Vn.default),t.usePlugin(Dn.default),t}function mr(t){return t&&t.replace(/\/.*$/,"")}ir.Scope=gr;var br={};Object.defineProperty(br,"__esModule",{value:!0}),br.default=void 0;var xr=new ir.Scope,wr=xr.interactStatic;br.default=wr;var _r="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:void 0;xr.init(_r);var Pr={};Object.defineProperty(Pr,"__esModule",{value:!0}),Pr.default=void 0,Pr.default=function(){};var Or={};Object.defineProperty(Or,"__esModule",{value:!0}),Or.default=void 0,Or.default=function(){};var Er={};function Sr(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i=[],a=!0,s=!1;try{for(n=n.call(t);!(a=(r=n.next()).done)&&(i.push(r.value),!e||i.length!==e);a=!0);}catch(t){s=!0,o=t}finally{try{a||null==n.return||n.return()}finally{if(s)throw o}}return i}}(t,e)||function(t,e){if(t){if("string"==typeof t)return Tr(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Tr(t,e):void 0}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Tr(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}Object.defineProperty(Er,"__esModule",{value:!0}),Er.default=void 0,Er.default=function(t){var e=[["x","y"],["left","top"],["right","bottom"],["width","height"]].filter((function(e){var n=Sr(e,2),r=n[0],o=n[1];return r in t||o in t})),n=function(n,r){for(var o=t.range,i=t.limits,a=void 0===i?{left:-1/0,right:1/0,top:-1/0,bottom:1/0}:i,s=t.offset,l=void 0===s?{x:0,y:0}:s,u={range:o,grid:t,x:null,y:null},c=0;c<e.length;c++){var f=Sr(e[c],2),d=f[0],p=f[1],v=Math.round((n-l.x)/t[d]),h=Math.round((r-l.y)/t[p]);u[d]=Math.max(a.left,Math.min(a.right,v*t[d]+l.x)),u[p]=Math.max(a.top,Math.min(a.bottom,h*t[p]+l.y))}return u};return n.grid=t,n.coordFields=e,n};var jr={};Object.defineProperty(jr,"__esModule",{value:!0}),Object.defineProperty(jr,"edgeTarget",{enumerable:!0,get:function(){return Pr.default}}),Object.defineProperty(jr,"elements",{enumerable:!0,get:function(){return Or.default}}),Object.defineProperty(jr,"grid",{enumerable:!0,get:function(){return Er.default}});var Mr={};Object.defineProperty(Mr,"__esModule",{value:!0}),Mr.default=void 0;var kr={id:"snappers",install:function(t){var e=t.interactStatic;e.snappers=(0,M.default)(e.snappers||{},jr),e.createSnapGrid=e.snappers.grid}},Ir=kr;Mr.default=Ir;var Dr={};function Ar(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function zr(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?Ar(Object(n),!0).forEach((function(e){Cr(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Ar(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function Cr(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}Object.defineProperty(Dr,"__esModule",{value:!0}),Dr.default=Dr.aspectRatio=void 0;var Rr={start:function(t){var e=t.state,n=t.rect,r=t.edges,o=t.pageCoords,i=e.options,a=i.ratio,s=i.enabled,l=e.options,u=l.equalDelta,c=l.modifiers;"preserve"===a&&(a=n.width/n.height),e.startCoords=(0,M.default)({},o),e.startRect=(0,M.default)({},n),e.ratio=a,e.equalDelta=u;var f=e.linkedEdges={top:r.top||r.left&&!r.bottom,left:r.left||r.top&&!r.right,bottom:r.bottom||r.right&&!r.top,right:r.right||r.bottom&&!r.left};if(e.xIsPrimaryAxis=!(!r.left&&!r.right),e.equalDelta){var d=(f.left?1:-1)*(f.top?1:-1);e.edgeSign={x:d,y:d}}else e.edgeSign={x:f.left?-1:1,y:f.top?-1:1};if(!1!==s&&(0,M.default)(r,f),null!=c&&c.length){var p=new me.default(t.interaction);p.copyFrom(t.interaction.modification),p.prepareStates(c),e.subModification=p,p.startAll(zr({},t))}},set:function(t){var e=t.state,n=t.rect,r=t.coords,o=e.linkedEdges,i=(0,M.default)({},r),a=e.equalDelta?Fr:Xr;if((0,M.default)(t.edges,o),a(e,e.xIsPrimaryAxis,r,n),!e.subModification)return null;var s=(0,M.default)({},n);(0,k.addEdges)(o,s,{x:r.x-i.x,y:r.y-i.y});var l=e.subModification.setAll(zr(zr({},t),{},{rect:s,edges:o,pageCoords:r,prevCoords:r,prevRect:s})),u=l.delta;return l.changed&&(a(e,Math.abs(u.x)>Math.abs(u.y),l.coords,l.rect),(0,M.default)(r,l.coords)),l.eventProps},defaults:{ratio:"preserve",equalDelta:!1,modifiers:[],enabled:!1}};function Fr(t,e,n){var r=t.startCoords,o=t.edgeSign;e?n.y=r.y+(n.x-r.x)*o.y:n.x=r.x+(n.y-r.y)*o.x}function Xr(t,e,n,r){var o=t.startRect,i=t.startCoords,a=t.ratio,s=t.edgeSign;if(e){var l=r.width/a;n.y=i.y+(l-o.height)*s.y}else{var u=r.height*a;n.x=i.x+(u-o.width)*s.x}}Dr.aspectRatio=Rr;var Br=(0,Se.makeModifier)(Rr,"aspectRatio");Dr.default=Br;var Yr={};Object.defineProperty(Yr,"__esModule",{value:!0}),Yr.default=void 0;var Wr=function(){};Wr._defaults={};var Lr=Wr;Yr.default=Lr;var Ur={};Object.defineProperty(Ur,"__esModule",{value:!0}),Object.defineProperty(Ur,"default",{enumerable:!0,get:function(){return Yr.default}});var Vr={};function Nr(t,e,n){return i.default.func(t)?k.resolveRectLike(t,e.interactable,e.element,[n.x,n.y,e]):k.resolveRectLike(t,e.interactable,e.element)}Object.defineProperty(Vr,"__esModule",{value:!0}),Vr.default=void 0,Vr.getRestrictionRect=Nr,Vr.restrict=void 0;var qr={start:function(t){var e=t.rect,n=t.startOffset,r=t.state,o=t.interaction,i=t.pageCoords,a=r.options,s=a.elementRect,l=(0,M.default)({left:0,top:0,right:0,bottom:0},a.offset||{});if(e&&s){var u=Nr(a.restriction,o,i);if(u){var c=u.right-u.left-e.width,f=u.bottom-u.top-e.height;c<0&&(l.left+=c,l.right+=c),f<0&&(l.top+=f,l.bottom+=f)}l.left+=n.left-e.width*s.left,l.top+=n.top-e.height*s.top,l.right+=n.right-e.width*(1-s.right),l.bottom+=n.bottom-e.height*(1-s.bottom)}r.offset=l},set:function(t){var e=t.coords,n=t.interaction,r=t.state,o=r.options,i=r.offset,a=Nr(o.restriction,n,e);if(a){var s=k.xywhToTlbr(a);e.x=Math.max(Math.min(s.right-i.right,e.x),s.left+i.left),e.y=Math.max(Math.min(s.bottom-i.bottom,e.y),s.top+i.top)}},defaults:{restriction:null,elementRect:null,offset:null,endOnly:!1,enabled:!1}};Vr.restrict=qr;var Gr=(0,Se.makeModifier)(qr,"restrict");Vr.default=Gr;var $r={};Object.defineProperty($r,"__esModule",{value:!0}),$r.restrictEdges=$r.default=void 0;var Hr={top:1/0,left:1/0,bottom:-1/0,right:-1/0},Kr={top:-1/0,left:-1/0,bottom:1/0,right:1/0};function Zr(t,e){for(var n=["top","left","bottom","right"],r=0;r<n.length;r++){var o=n[r];o in t||(t[o]=e[o])}return t}var Jr={noInner:Hr,noOuter:Kr,start:function(t){var e,n=t.interaction,r=t.startOffset,o=t.state,i=o.options;if(i){var a=(0,Vr.getRestrictionRect)(i.offset,n,n.coords.start.page);e=k.rectToXY(a)}e=e||{x:0,y:0},o.offset={top:e.y+r.top,left:e.x+r.left,bottom:e.y-r.bottom,right:e.x-r.right}},set:function(t){var e=t.coords,n=t.edges,r=t.interaction,o=t.state,i=o.offset,a=o.options;if(n){var s=(0,M.default)({},e),l=(0,Vr.getRestrictionRect)(a.inner,r,s)||{},u=(0,Vr.getRestrictionRect)(a.outer,r,s)||{};Zr(l,Hr),Zr(u,Kr),n.top?e.y=Math.min(Math.max(u.top+i.top,s.y),l.top+i.top):n.bottom&&(e.y=Math.max(Math.min(u.bottom+i.bottom,s.y),l.bottom+i.bottom)),n.left?e.x=Math.min(Math.max(u.left+i.left,s.x),l.left+i.left):n.right&&(e.x=Math.max(Math.min(u.right+i.right,s.x),l.right+i.right))}},defaults:{inner:null,outer:null,offset:null,endOnly:!1,enabled:!1}};$r.restrictEdges=Jr;var Qr=(0,Se.makeModifier)(Jr,"restrictEdges");$r.default=Qr;var to={};Object.defineProperty(to,"__esModule",{value:!0}),to.restrictRect=to.default=void 0;var eo=(0,M.default)({get elementRect(){return{top:0,left:0,bottom:1,right:1}},set elementRect(t){}},Vr.restrict.defaults),no={start:Vr.restrict.start,set:Vr.restrict.set,defaults:eo};to.restrictRect=no;var ro=(0,Se.makeModifier)(no,"restrictRect");to.default=ro;var oo={};Object.defineProperty(oo,"__esModule",{value:!0}),oo.restrictSize=oo.default=void 0;var io={width:-1/0,height:-1/0},ao={width:1/0,height:1/0},so={start:function(t){return $r.restrictEdges.start(t)},set:function(t){var e=t.interaction,n=t.state,r=t.rect,o=t.edges,i=n.options;if(o){var a=k.tlbrToXywh((0,Vr.getRestrictionRect)(i.min,e,t.coords))||io,s=k.tlbrToXywh((0,Vr.getRestrictionRect)(i.max,e,t.coords))||ao;n.options={endOnly:i.endOnly,inner:(0,M.default)({},$r.restrictEdges.noInner),outer:(0,M.default)({},$r.restrictEdges.noOuter)},o.top?(n.options.inner.top=r.bottom-a.height,n.options.outer.top=r.bottom-s.height):o.bottom&&(n.options.inner.bottom=r.top+a.height,n.options.outer.bottom=r.top+s.height),o.left?(n.options.inner.left=r.right-a.width,n.options.outer.left=r.right-s.width):o.right&&(n.options.inner.right=r.left+a.width,n.options.outer.right=r.left+s.width),$r.restrictEdges.set(t),n.options=i}},defaults:{min:null,max:null,endOnly:!1,enabled:!1}};oo.restrictSize=so;var lo=(0,Se.makeModifier)(so,"restrictSize");oo.default=lo;var uo={};Object.defineProperty(uo,"__esModule",{value:!0}),Object.defineProperty(uo,"default",{enumerable:!0,get:function(){return Yr.default}});var co={};Object.defineProperty(co,"__esModule",{value:!0}),co.snap=co.default=void 0;var fo={start:function(t){var e,n=t.interaction,r=t.interactable,o=t.element,i=t.rect,a=t.state,s=t.startOffset,l=a.options,u=l.offsetWithOrigin?function(t){var e=t.interaction.element;return(0,k.rectToXY)((0,k.resolveRectLike)(t.state.options.origin,null,null,[e]))||(0,A.default)(t.interactable,e,t.interaction.prepared.name)}(t):{x:0,y:0};if("startCoords"===l.offset)e={x:n.coords.start.page.x,y:n.coords.start.page.y};else{var c=(0,k.resolveRectLike)(l.offset,r,o,[n]);(e=(0,k.rectToXY)(c)||{x:0,y:0}).x+=u.x,e.y+=u.y}var f=l.relativePoints;a.offsets=i&&f&&f.length?f.map((function(t,n){return{index:n,relativePoint:t,x:s.left-i.width*t.x+e.x,y:s.top-i.height*t.y+e.y}})):[{index:0,relativePoint:null,x:e.x,y:e.y}]},set:function(t){var e=t.interaction,n=t.coords,r=t.state,o=r.options,a=r.offsets,s=(0,A.default)(e.interactable,e.element,e.prepared.name),l=(0,M.default)({},n),u=[];o.offsetWithOrigin||(l.x-=s.x,l.y-=s.y);for(var c=0;c<a.length;c++)for(var f=a[c],d=l.x-f.x,p=l.y-f.y,v=0,h=o.targets.length;v<h;v++){var g,y=o.targets[v];(g=i.default.func(y)?y(d,p,e._proxy,f,v):y)&&u.push({x:(i.default.number(g.x)?g.x:d)+f.x,y:(i.default.number(g.y)?g.y:p)+f.y,range:i.default.number(g.range)?g.range:o.range,source:y,index:v,offset:f})}for(var m={target:null,inRange:!1,distance:0,range:0,delta:{x:0,y:0}},b=0;b<u.length;b++){var x=u[b],w=x.range,_=x.x-l.x,P=x.y-l.y,O=(0,R.default)(_,P),E=O<=w;w===1/0&&m.inRange&&m.range!==1/0&&(E=!1),m.target&&!(E?m.inRange&&w!==1/0?O/w<m.distance/m.range:w===1/0&&m.range!==1/0||O<m.distance:!m.inRange&&O<m.distance)||(m.target=x,m.distance=O,m.range=w,m.inRange=E,m.delta.x=_,m.delta.y=P)}return m.inRange&&(n.x=m.target.x,n.y=m.target.y),r.closest=m,m},defaults:{range:1/0,targets:null,offset:null,offsetWithOrigin:!0,origin:null,relativePoints:null,endOnly:!1,enabled:!1}};co.snap=fo;var po=(0,Se.makeModifier)(fo,"snap");co.default=po;var vo={};function ho(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}Object.defineProperty(vo,"__esModule",{value:!0}),vo.snapSize=vo.default=void 0;var go={start:function(t){var e=t.state,n=t.edges,r=e.options;if(!n)return null;t.state={options:{targets:null,relativePoints:[{x:n.left?0:1,y:n.top?0:1}],offset:r.offset||"self",origin:{x:0,y:0},range:r.range}},e.targetFields=e.targetFields||[["width","height"],["x","y"]],co.snap.start(t),e.offsets=t.state.offsets,t.state=e},set:function(t){var e,n,r=t.interaction,o=t.state,a=t.coords,s=o.options,l=o.offsets,u={x:a.x-l[0].x,y:a.y-l[0].y};o.options=(0,M.default)({},s),o.options.targets=[];for(var c=0;c<(s.targets||[]).length;c++){var f=(s.targets||[])[c],d=void 0;if(d=i.default.func(f)?f(u.x,u.y,r):f){for(var p=0;p<o.targetFields.length;p++){var v=(e=o.targetFields[p],n=2,function(t){if(Array.isArray(t))return t}(e)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i=[],a=!0,s=!1;try{for(n=n.call(t);!(a=(r=n.next()).done)&&(i.push(r.value),!e||i.length!==e);a=!0);}catch(t){s=!0,o=t}finally{try{a||null==n.return||n.return()}finally{if(s)throw o}}return i}}(e,n)||function(t,e){if(t){if("string"==typeof t)return ho(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ho(t,e):void 0}}(e,n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()),h=v[0],g=v[1];if(h in d||g in d){d.x=d[h],d.y=d[g];break}}o.options.targets.push(d)}}var y=co.snap.set(t);return o.options=s,y},defaults:{range:1/0,targets:null,offset:null,endOnly:!1,enabled:!1}};vo.snapSize=go;var yo=(0,Se.makeModifier)(go,"snapSize");vo.default=yo;var mo={};Object.defineProperty(mo,"__esModule",{value:!0}),mo.snapEdges=mo.default=void 0;var bo={start:function(t){var e=t.edges;return e?(t.state.targetFields=t.state.targetFields||[[e.left?"left":"right",e.top?"top":"bottom"]],vo.snapSize.start(t)):null},set:vo.snapSize.set,defaults:(0,M.default)((0,ye.default)(vo.snapSize.defaults),{targets:null,range:null,offset:{x:0,y:0}})};mo.snapEdges=bo;var xo=(0,Se.makeModifier)(bo,"snapEdges");mo.default=xo;var wo={};Object.defineProperty(wo,"__esModule",{value:!0}),Object.defineProperty(wo,"default",{enumerable:!0,get:function(){return Yr.default}});var _o={};Object.defineProperty(_o,"__esModule",{value:!0}),Object.defineProperty(_o,"default",{enumerable:!0,get:function(){return Yr.default}});var Po={};Object.defineProperty(Po,"__esModule",{value:!0}),Po.default=void 0;var Oo={aspectRatio:Dr.default,restrictEdges:$r.default,restrict:Vr.default,restrictRect:to.default,restrictSize:oo.default,snapEdges:mo.default,snap:co.default,snapSize:vo.default,spring:wo.default,avoid:Ur.default,transform:_o.default,rubberband:uo.default};Po.default=Oo;var Eo={};Object.defineProperty(Eo,"__esModule",{value:!0}),Eo.default=void 0;var So={id:"modifiers",install:function(t){var e=t.interactStatic;for(var n in t.usePlugin(Se.default),t.usePlugin(Mr.default),e.modifiers=Po.default,Po.default){var r=Po.default[n],o=r._defaults,i=r._methods;o._methods=i,t.defaults.perAction[n]=o}}},To=So;Eo.default=To;var jo={};function Mo(t){return Mo="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},Mo(t)}function ko(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function Io(t,e){return Io=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},Io(t,e)}function Do(t,e){if(e&&("object"===Mo(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return Ao(t)}function Ao(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function zo(t){return zo=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},zo(t)}Object.defineProperty(jo,"__esModule",{value:!0}),jo.default=jo.PointerEvent=void 0;var Co=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&Io(t,e)}(a,t);var e,n,r,o,i=(r=a,o=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}(),function(){var t,e=zo(r);if(o){var n=zo(this).constructor;t=Reflect.construct(e,arguments,n)}else t=e.apply(this,arguments);return Do(this,t)});function a(t,e,n,r,o,s){var l;if(function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,a),l=i.call(this,o),X.pointerExtend(Ao(l),n),n!==e&&X.pointerExtend(Ao(l),e),l.timeStamp=s,l.originalEvent=n,l.type=t,l.pointerId=X.getPointerId(e),l.pointerType=X.getPointerType(e),l.target=r,l.currentTarget=null,"tap"===t){var u=o.getPointerIndex(e);l.dt=l.timeStamp-o.pointers[u].downTime;var c=l.timeStamp-o.tapTime;l.double=!!o.prevTap&&"doubletap"!==o.prevTap.type&&o.prevTap.target===l.target&&c<500}else"doubletap"===t&&(l.dt=e.timeStamp-o.tapTime,l.double=!0);return l}return e=a,(n=[{key:"_subtractOrigin",value:function(t){var e=t.x,n=t.y;return this.pageX-=e,this.pageY-=n,this.clientX-=e,this.clientY-=n,this}},{key:"_addOrigin",value:function(t){var e=t.x,n=t.y;return this.pageX+=e,this.pageY+=n,this.clientX+=e,this.clientY+=n,this}},{key:"preventDefault",value:function(){this.originalEvent.preventDefault()}}])&&ko(e.prototype,n),Object.defineProperty(e,"prototype",{writable:!1}),a}(N.BaseEvent);jo.PointerEvent=jo.default=Co;var Ro={};Object.defineProperty(Ro,"__esModule",{value:!0}),Ro.default=void 0;var Fo={id:"pointer-events/base",before:["inertia","modifiers","auto-start","actions"],install:function(t){t.pointerEvents=Fo,t.defaults.actions.pointerEvents=Fo.defaults,(0,M.default)(t.actions.phaselessTypes,Fo.types)},listeners:{"interactions:new":function(t){var e=t.interaction;e.prevTap=null,e.tapTime=0},"interactions:update-pointer":function(t){var e=t.down,n=t.pointerInfo;!e&&n.hold||(n.hold={duration:1/0,timeout:null})},"interactions:move":function(t,e){var n=t.interaction,r=t.pointer,o=t.event,i=t.eventTarget;t.duplicate||n.pointerIsDown&&!n.pointerWasMoved||(n.pointerIsDown&&Yo(t),Xo({interaction:n,pointer:r,event:o,eventTarget:i,type:"move"},e))},"interactions:down":function(t,e){!function(t,e){for(var n=t.interaction,r=t.pointer,o=t.event,i=t.eventTarget,a=t.pointerIndex,s=n.pointers[a].hold,l=_.getPath(i),u={interaction:n,pointer:r,event:o,eventTarget:i,type:"hold",targets:[],path:l,node:null},c=0;c<l.length;c++){var f=l[c];u.node=f,e.fire("pointerEvents:collect-targets",u)}if(u.targets.length){for(var d=1/0,p=0;p<u.targets.length;p++){var v=u.targets[p].eventable.options.holdDuration;v<d&&(d=v)}s.duration=d,s.timeout=setTimeout((function(){Xo({interaction:n,eventTarget:i,pointer:r,event:o,type:"hold"},e)}),d)}}(t,e),Xo(t,e)},"interactions:up":function(t,e){Yo(t),Xo(t,e),function(t,e){var n=t.interaction,r=t.pointer,o=t.event,i=t.eventTarget;n.pointerWasMoved||Xo({interaction:n,eventTarget:i,pointer:r,event:o,type:"tap"},e)}(t,e)},"interactions:cancel":function(t,e){Yo(t),Xo(t,e)}},PointerEvent:jo.PointerEvent,fire:Xo,collectEventTargets:Bo,defaults:{holdDuration:600,ignoreFrom:null,allowFrom:null,origin:{x:0,y:0}},types:{down:!0,move:!0,up:!0,cancel:!0,tap:!0,doubletap:!0,hold:!0}};function Xo(t,e){var n=t.interaction,r=t.pointer,o=t.event,i=t.eventTarget,a=t.type,s=t.targets,l=void 0===s?Bo(t,e):s,u=new jo.PointerEvent(a,r,o,i,n,e.now());e.fire("pointerEvents:new",{pointerEvent:u});for(var c={interaction:n,pointer:r,event:o,eventTarget:i,targets:l,type:a,pointerEvent:u},f=0;f<l.length;f++){var d=l[f];for(var p in d.props||{})u[p]=d.props[p];var v=(0,A.default)(d.eventable,d.node);if(u._subtractOrigin(v),u.eventable=d.eventable,u.currentTarget=d.node,d.eventable.fire(u),u._addOrigin(v),u.immediatePropagationStopped||u.propagationStopped&&f+1<l.length&&l[f+1].node!==u.currentTarget)break}if(e.fire("pointerEvents:fired",c),"tap"===a){var h=u.double?Xo({interaction:n,pointer:r,event:o,eventTarget:i,type:"doubletap"},e):u;n.prevTap=h,n.tapTime=h.timeStamp}return u}function Bo(t,e){var n=t.interaction,r=t.pointer,o=t.event,i=t.eventTarget,a=t.type,s=n.getPointerIndex(r),l=n.pointers[s];if("tap"===a&&(n.pointerWasMoved||!l||l.downTarget!==i))return[];for(var u=_.getPath(i),c={interaction:n,pointer:r,event:o,eventTarget:i,type:a,path:u,targets:[],node:null},f=0;f<u.length;f++){var d=u[f];c.node=d,e.fire("pointerEvents:collect-targets",c)}return"hold"===a&&(c.targets=c.targets.filter((function(t){var e;return t.eventable.options.holdDuration===(null==(e=n.pointers[s])?void 0:e.hold.duration)}))),c.targets}function Yo(t){var e=t.interaction,n=t.pointerIndex,r=e.pointers[n].hold;r&&r.timeout&&(clearTimeout(r.timeout),r.timeout=null)}var Wo=Fo;Ro.default=Wo;var Lo={};function Uo(t){var e=t.interaction;e.holdIntervalHandle&&(clearInterval(e.holdIntervalHandle),e.holdIntervalHandle=null)}Object.defineProperty(Lo,"__esModule",{value:!0}),Lo.default=void 0;var Vo={id:"pointer-events/holdRepeat",install:function(t){t.usePlugin(Ro.default);var e=t.pointerEvents;e.defaults.holdRepeatInterval=0,e.types.holdrepeat=t.actions.phaselessTypes.holdrepeat=!0},listeners:["move","up","cancel","endall"].reduce((function(t,e){return t["pointerEvents:".concat(e)]=Uo,t}),{"pointerEvents:new":function(t){var e=t.pointerEvent;"hold"===e.type&&(e.count=(e.count||0)+1)},"pointerEvents:fired":function(t,e){var n=t.interaction,r=t.pointerEvent,o=t.eventTarget,i=t.targets;if("hold"===r.type&&i.length){var a=i[0].eventable.options.holdRepeatInterval;a<=0||(n.holdIntervalHandle=setTimeout((function(){e.pointerEvents.fire({interaction:n,eventTarget:o,type:"hold",pointer:r,event:r},e)}),a))}}})},No=Vo;Lo.default=No;var qo={};function Go(t){return(0,M.default)(this.events.options,t),this}Object.defineProperty(qo,"__esModule",{value:!0}),qo.default=void 0;var $o={id:"pointer-events/interactableTargets",install:function(t){var e=t.Interactable;e.prototype.pointerEvents=Go;var n=e.prototype._backCompatOption;e.prototype._backCompatOption=function(t,e){var r=n.call(this,t,e);return r===this&&(this.events.options[t]=e),r}},listeners:{"pointerEvents:collect-targets":function(t,e){var n=t.targets,r=t.node,o=t.type,i=t.eventTarget;e.interactables.forEachMatch(r,(function(t){var e=t.events,a=e.options;e.types[o]&&e.types[o].length&&t.testIgnoreAllow(a,r,i)&&n.push({node:r,eventable:e,props:{interactable:t}})}))},"interactable:new":function(t){var e=t.interactable;e.events.getRect=function(t){return e.getRect(t)}},"interactable:set":function(t,e){var n=t.interactable,r=t.options;(0,M.default)(n.events.options,e.pointerEvents.defaults),(0,M.default)(n.events.options,r.pointerEvents||{})}}},Ho=$o;qo.default=Ho;var Ko={};Object.defineProperty(Ko,"__esModule",{value:!0}),Ko.default=void 0;var Zo={id:"pointer-events",install:function(t){t.usePlugin(Ro),t.usePlugin(Lo.default),t.usePlugin(qo.default)}},Jo=Zo;Ko.default=Jo;var Qo={};function ti(t){var e=t.Interactable;t.actions.phases.reflow=!0,e.prototype.reflow=function(e){return function(t,e,n){for(var r=i.default.string(t.target)?H.from(t._context.querySelectorAll(t.target)):[t.target],o=n.window.Promise,a=o?[]:null,s=function(){var i=r[l],s=t.getRect(i);if(!s)return"break";var u=H.find(n.interactions.list,(function(n){return n.interacting()&&n.interactable===t&&n.element===i&&n.prepared.name===e.name})),c=void 0;if(u)u.move(),a&&(c=u._reflowPromise||new o((function(t){u._reflowResolve=t})));else{var f=(0,k.tlbrToXywh)(s),d={page:{x:f.x,y:f.y},client:{x:f.x,y:f.y},timeStamp:n.now()},p=X.coordsToEvent(d);c=function(t,e,n,r,o){var i=t.interactions.new({pointerType:"reflow"}),a={interaction:i,event:o,pointer:o,eventTarget:n,phase:"reflow"};i.interactable=e,i.element=n,i.prevEvent=o,i.updatePointer(o,o,n,!0),X.setZeroCoords(i.coords.delta),(0,Xt.copyAction)(i.prepared,r),i._doPhase(a);var s=t.window.Promise,l=s?new s((function(t){i._reflowResolve=t})):void 0;return i._reflowPromise=l,i.start(r,e,n),i._interacting?(i.move(a),i.end(o)):(i.stop(),i._reflowResolve()),i.removePointer(o,o),l}(n,t,i,e,p)}a&&a.push(c)},l=0;l<r.length&&"break"!==s();l++);return a&&o.all(a).then((function(){return t}))}(this,e,t)}}Object.defineProperty(Qo,"__esModule",{value:!0}),Qo.default=void 0,Qo.install=ti;var ei={id:"reflow",install:ti,listeners:{"interactions:stop":function(t,e){var n=t.interaction;"reflow"===n.pointerType&&(n._reflowResolve&&n._reflowResolve(),H.remove(e.interactions.list,n))}}},ni=ei;Qo.default=ni;var ri={};Object.defineProperty(ri,"__esModule",{value:!0}),ri.default=void 0,br.default.use(le.default),br.default.use(Qe.default),br.default.use(Ko.default),br.default.use(ln.default),br.default.use(Eo.default),br.default.use(ae.default),br.default.use(Et.default),br.default.use(Dt.default),br.default.use(Qo.default);var oi=br.default;ri.default=oi,br.default.default=br.default,Et.default,Dt.default,ae.default,le.default,he.default,ln.default,br.default,Eo.default,Qe.default,Ko.default,Qo.default;var ii={exports:{}};function ai(t){return ai="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},ai(t)}Object.defineProperty(ii.exports,"__esModule",{value:!0}),ii.exports.default=void 0;var si=ri.default;if(ii.exports.default=si,"object"===ai(ii)&&ii)try{ii.exports=ri.default}catch(t){}return ri.default.default=ri.default,ii.exports}));
//# sourceMappingURL=interact.min.js.map


/***/ }),

/***/ "./node_modules/jquery-colorbox/jquery.colorbox.js":
/*!*********************************************************!*\
  !*** ./node_modules/jquery-colorbox/jquery.colorbox.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var jQuery = __webpack_require__(/*! jquery */ "jquery");
/*!
	Colorbox 1.6.4
	license: MIT
	http://www.jacklmoore.com/colorbox
*/
(function ($, document, window) {
	var
	// Default settings object.
	// See http://jacklmoore.com/colorbox for details.
	defaults = {
		// data sources
		html: false,
		photo: false,
		iframe: false,
		inline: false,

		// behavior and appearance
		transition: "elastic",
		speed: 300,
		fadeOut: 300,
		width: false,
		initialWidth: "600",
		innerWidth: false,
		maxWidth: false,
		height: false,
		initialHeight: "450",
		innerHeight: false,
		maxHeight: false,
		scalePhotos: true,
		scrolling: true,
		opacity: 0.9,
		preloading: true,
		className: false,
		overlayClose: true,
		escKey: true,
		arrowKey: true,
		top: false,
		bottom: false,
		left: false,
		right: false,
		fixed: false,
		data: undefined,
		closeButton: true,
		fastIframe: true,
		open: false,
		reposition: true,
		loop: true,
		slideshow: false,
		slideshowAuto: true,
		slideshowSpeed: 2500,
		slideshowStart: "start slideshow",
		slideshowStop: "stop slideshow",
		photoRegex: /\.(gif|png|jp(e|g|eg)|bmp|ico|webp|jxr|svg)((#|\?).*)?$/i,

		// alternate image paths for high-res displays
		retinaImage: false,
		retinaUrl: false,
		retinaSuffix: '@2x.$1',

		// internationalization
		current: "image {current} of {total}",
		previous: "previous",
		next: "next",
		close: "close",
		xhrError: "This content failed to load.",
		imgError: "This image failed to load.",

		// accessbility
		returnFocus: true,
		trapFocus: true,

		// callbacks
		onOpen: false,
		onLoad: false,
		onComplete: false,
		onCleanup: false,
		onClosed: false,

		rel: function() {
			return this.rel;
		},
		href: function() {
			// using this.href would give the absolute url, when the href may have been inteded as a selector (e.g. '#container')
			return $(this).attr('href');
		},
		title: function() {
			return this.title;
		},
		createImg: function() {
			var img = new Image();
			var attrs = $(this).data('cbox-img-attrs');

			if (typeof attrs === 'object') {
				$.each(attrs, function(key, val){
					img[key] = val;
				});
			}

			return img;
		},
		createIframe: function() {
			var iframe = document.createElement('iframe');
			var attrs = $(this).data('cbox-iframe-attrs');

			if (typeof attrs === 'object') {
				$.each(attrs, function(key, val){
					iframe[key] = val;
				});
			}

			if ('frameBorder' in iframe) {
				iframe.frameBorder = 0;
			}
			if ('allowTransparency' in iframe) {
				iframe.allowTransparency = "true";
			}
			iframe.name = (new Date()).getTime(); // give the iframe a unique name to prevent caching
			iframe.allowFullscreen = true;

			return iframe;
		}
	},

	// Abstracting the HTML and event identifiers for easy rebranding
	colorbox = 'colorbox',
	prefix = 'cbox',
	boxElement = prefix + 'Element',

	// Events
	event_open = prefix + '_open',
	event_load = prefix + '_load',
	event_complete = prefix + '_complete',
	event_cleanup = prefix + '_cleanup',
	event_closed = prefix + '_closed',
	event_purge = prefix + '_purge',

	// Cached jQuery Object Variables
	$overlay,
	$box,
	$wrap,
	$content,
	$topBorder,
	$leftBorder,
	$rightBorder,
	$bottomBorder,
	$related,
	$window,
	$loaded,
	$loadingBay,
	$loadingOverlay,
	$title,
	$current,
	$slideshow,
	$next,
	$prev,
	$close,
	$groupControls,
	$events = $('<a/>'), // $({}) would be prefered, but there is an issue with jQuery 1.4.2

	// Variables for cached values or use across multiple functions
	settings,
	interfaceHeight,
	interfaceWidth,
	loadedHeight,
	loadedWidth,
	index,
	photo,
	open,
	active,
	closing,
	loadingTimer,
	publicMethod,
	div = "div",
	requests = 0,
	previousCSS = {},
	init;

	// ****************
	// HELPER FUNCTIONS
	// ****************

	// Convenience function for creating new jQuery objects
	function $tag(tag, id, css) {
		var element = document.createElement(tag);

		if (id) {
			element.id = prefix + id;
		}

		if (css) {
			element.style.cssText = css;
		}

		return $(element);
	}

	// Get the window height using innerHeight when available to avoid an issue with iOS
	// http://bugs.jquery.com/ticket/6724
	function winheight() {
		return window.innerHeight ? window.innerHeight : $(window).height();
	}

	function Settings(element, options) {
		if (options !== Object(options)) {
			options = {};
		}

		this.cache = {};
		this.el = element;

		this.value = function(key) {
			var dataAttr;

			if (this.cache[key] === undefined) {
				dataAttr = $(this.el).attr('data-cbox-'+key);

				if (dataAttr !== undefined) {
					this.cache[key] = dataAttr;
				} else if (options[key] !== undefined) {
					this.cache[key] = options[key];
				} else if (defaults[key] !== undefined) {
					this.cache[key] = defaults[key];
				}
			}

			return this.cache[key];
		};

		this.get = function(key) {
			var value = this.value(key);
			return $.isFunction(value) ? value.call(this.el, this) : value;
		};
	}

	// Determine the next and previous members in a group.
	function getIndex(increment) {
		var
		max = $related.length,
		newIndex = (index + increment) % max;

		return (newIndex < 0) ? max + newIndex : newIndex;
	}

	// Convert '%' and 'px' values to integers
	function setSize(size, dimension) {
		return Math.round((/%/.test(size) ? ((dimension === 'x' ? $window.width() : winheight()) / 100) : 1) * parseInt(size, 10));
	}

	// Checks an href to see if it is a photo.
	// There is a force photo option (photo: true) for hrefs that cannot be matched by the regex.
	function isImage(settings, url) {
		return settings.get('photo') || settings.get('photoRegex').test(url);
	}

	function retinaUrl(settings, url) {
		return settings.get('retinaUrl') && window.devicePixelRatio > 1 ? url.replace(settings.get('photoRegex'), settings.get('retinaSuffix')) : url;
	}

	function trapFocus(e) {
		if ('contains' in $box[0] && !$box[0].contains(e.target) && e.target !== $overlay[0]) {
			e.stopPropagation();
			$box.focus();
		}
	}

	function setClass(str) {
		if (setClass.str !== str) {
			$box.add($overlay).removeClass(setClass.str).addClass(str);
			setClass.str = str;
		}
	}

	function getRelated(rel) {
		index = 0;

		if (rel && rel !== false && rel !== 'nofollow') {
			$related = $('.' + boxElement).filter(function () {
				var options = $.data(this, colorbox);
				var settings = new Settings(this, options);
				return (settings.get('rel') === rel);
			});
			index = $related.index(settings.el);

			// Check direct calls to Colorbox.
			if (index === -1) {
				$related = $related.add(settings.el);
				index = $related.length - 1;
			}
		} else {
			$related = $(settings.el);
		}
	}

	function trigger(event) {
		// for external use
		$(document).trigger(event);
		// for internal use
		$events.triggerHandler(event);
	}

	var slideshow = (function(){
		var active,
			className = prefix + "Slideshow_",
			click = "click." + prefix,
			timeOut;

		function clear () {
			clearTimeout(timeOut);
		}

		function set() {
			if (settings.get('loop') || $related[index + 1]) {
				clear();
				timeOut = setTimeout(publicMethod.next, settings.get('slideshowSpeed'));
			}
		}

		function start() {
			$slideshow
				.html(settings.get('slideshowStop'))
				.unbind(click)
				.one(click, stop);

			$events
				.bind(event_complete, set)
				.bind(event_load, clear);

			$box.removeClass(className + "off").addClass(className + "on");
		}

		function stop() {
			clear();

			$events
				.unbind(event_complete, set)
				.unbind(event_load, clear);

			$slideshow
				.html(settings.get('slideshowStart'))
				.unbind(click)
				.one(click, function () {
					publicMethod.next();
					start();
				});

			$box.removeClass(className + "on").addClass(className + "off");
		}

		function reset() {
			active = false;
			$slideshow.hide();
			clear();
			$events
				.unbind(event_complete, set)
				.unbind(event_load, clear);
			$box.removeClass(className + "off " + className + "on");
		}

		return function(){
			if (active) {
				if (!settings.get('slideshow')) {
					$events.unbind(event_cleanup, reset);
					reset();
				}
			} else {
				if (settings.get('slideshow') && $related[1]) {
					active = true;
					$events.one(event_cleanup, reset);
					if (settings.get('slideshowAuto')) {
						start();
					} else {
						stop();
					}
					$slideshow.show();
				}
			}
		};

	}());


	function launch(element) {
		var options;

		if (!closing) {

			options = $(element).data(colorbox);

			settings = new Settings(element, options);

			getRelated(settings.get('rel'));

			if (!open) {
				open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.

				setClass(settings.get('className'));

				// Show colorbox so the sizes can be calculated in older versions of jQuery
				$box.css({visibility:'hidden', display:'block', opacity:''});

				$loaded = $tag(div, 'LoadedContent', 'width:0; height:0; overflow:hidden; visibility:hidden');
				$content.css({width:'', height:''}).append($loaded);

				// Cache values needed for size calculations
				interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(true) - $content.height();
				interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(true) - $content.width();
				loadedHeight = $loaded.outerHeight(true);
				loadedWidth = $loaded.outerWidth(true);

				// Opens inital empty Colorbox prior to content being loaded.
				var initialWidth = setSize(settings.get('initialWidth'), 'x');
				var initialHeight = setSize(settings.get('initialHeight'), 'y');
				var maxWidth = settings.get('maxWidth');
				var maxHeight = settings.get('maxHeight');

				settings.w = Math.max((maxWidth !== false ? Math.min(initialWidth, setSize(maxWidth, 'x')) : initialWidth) - loadedWidth - interfaceWidth, 0);
				settings.h = Math.max((maxHeight !== false ? Math.min(initialHeight, setSize(maxHeight, 'y')) : initialHeight) - loadedHeight - interfaceHeight, 0);

				$loaded.css({width:'', height:settings.h});
				publicMethod.position();

				trigger(event_open);
				settings.get('onOpen');

				$groupControls.add($title).hide();

				$box.focus();

				if (settings.get('trapFocus')) {
					// Confine focus to the modal
					// Uses event capturing that is not supported in IE8-
					if (document.addEventListener) {

						document.addEventListener('focus', trapFocus, true);

						$events.one(event_closed, function () {
							document.removeEventListener('focus', trapFocus, true);
						});
					}
				}

				// Return focus on closing
				if (settings.get('returnFocus')) {
					$events.one(event_closed, function () {
						$(settings.el).focus();
					});
				}
			}

			var opacity = parseFloat(settings.get('opacity'));
			$overlay.css({
				opacity: opacity === opacity ? opacity : '',
				cursor: settings.get('overlayClose') ? 'pointer' : '',
				visibility: 'visible'
			}).show();

			if (settings.get('closeButton')) {
				$close.html(settings.get('close')).appendTo($content);
			} else {
				$close.appendTo('<div/>'); // replace with .detach() when dropping jQuery < 1.4
			}

			load();
		}
	}

	// Colorbox's markup needs to be added to the DOM prior to being called
	// so that the browser will go ahead and load the CSS background images.
	function appendHTML() {
		if (!$box) {
			init = false;
			$window = $(window);
			$box = $tag(div).attr({
				id: colorbox,
				'class': $.support.opacity === false ? prefix + 'IE' : '', // class for optional IE8 & lower targeted CSS.
				role: 'dialog',
				tabindex: '-1'
			}).hide();
			$overlay = $tag(div, "Overlay").hide();
			$loadingOverlay = $([$tag(div, "LoadingOverlay")[0],$tag(div, "LoadingGraphic")[0]]);
			$wrap = $tag(div, "Wrapper");
			$content = $tag(div, "Content").append(
				$title = $tag(div, "Title"),
				$current = $tag(div, "Current"),
				$prev = $('<button type="button"/>').attr({id:prefix+'Previous'}),
				$next = $('<button type="button"/>').attr({id:prefix+'Next'}),
				$slideshow = $('<button type="button"/>').attr({id:prefix+'Slideshow'}),
				$loadingOverlay
			);

			$close = $('<button type="button"/>').attr({id:prefix+'Close'});

			$wrap.append( // The 3x3 Grid that makes up Colorbox
				$tag(div).append(
					$tag(div, "TopLeft"),
					$topBorder = $tag(div, "TopCenter"),
					$tag(div, "TopRight")
				),
				$tag(div, false, 'clear:left').append(
					$leftBorder = $tag(div, "MiddleLeft"),
					$content,
					$rightBorder = $tag(div, "MiddleRight")
				),
				$tag(div, false, 'clear:left').append(
					$tag(div, "BottomLeft"),
					$bottomBorder = $tag(div, "BottomCenter"),
					$tag(div, "BottomRight")
				)
			).find('div div').css({'float': 'left'});

			$loadingBay = $tag(div, false, 'position:absolute; width:9999px; visibility:hidden; display:none; max-width:none;');

			$groupControls = $next.add($prev).add($current).add($slideshow);
		}
		if (document.body && !$box.parent().length) {
			$(document.body).append($overlay, $box.append($wrap, $loadingBay));
		}
	}

	// Add Colorbox's event bindings
	function addBindings() {
		function clickHandler(e) {
			// ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
			// See: http://jacklmoore.com/notes/click-events/
			if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				launch(this);
			}
		}

		if ($box) {
			if (!init) {
				init = true;

				// Anonymous functions here keep the public method from being cached, thereby allowing them to be redefined on the fly.
				$next.click(function () {
					publicMethod.next();
				});
				$prev.click(function () {
					publicMethod.prev();
				});
				$close.click(function () {
					publicMethod.close();
				});
				$overlay.click(function () {
					if (settings.get('overlayClose')) {
						publicMethod.close();
					}
				});

				// Key Bindings
				$(document).bind('keydown.' + prefix, function (e) {
					var key = e.keyCode;
					if (open && settings.get('escKey') && key === 27) {
						e.preventDefault();
						publicMethod.close();
					}
					if (open && settings.get('arrowKey') && $related[1] && !e.altKey) {
						if (key === 37) {
							e.preventDefault();
							$prev.click();
						} else if (key === 39) {
							e.preventDefault();
							$next.click();
						}
					}
				});

				if ($.isFunction($.fn.on)) {
					// For jQuery 1.7+
					$(document).on('click.'+prefix, '.'+boxElement, clickHandler);
				} else {
					// For jQuery 1.3.x -> 1.6.x
					// This code is never reached in jQuery 1.9, so do not contact me about 'live' being removed.
					// This is not here for jQuery 1.9, it's here for legacy users.
					$('.'+boxElement).live('click.'+prefix, clickHandler);
				}
			}
			return true;
		}
		return false;
	}

	// Don't do anything if Colorbox already exists.
	if ($[colorbox]) {
		return;
	}

	// Append the HTML when the DOM loads
	$(appendHTML);


	// ****************
	// PUBLIC FUNCTIONS
	// Usage format: $.colorbox.close();
	// Usage from within an iframe: parent.jQuery.colorbox.close();
	// ****************

	publicMethod = $.fn[colorbox] = $[colorbox] = function (options, callback) {
		var settings;
		var $obj = this;

		options = options || {};

		if ($.isFunction($obj)) { // assume a call to $.colorbox
			$obj = $('<a/>');
			options.open = true;
		}

		if (!$obj[0]) { // colorbox being applied to empty collection
			return $obj;
		}

		appendHTML();

		if (addBindings()) {

			if (callback) {
				options.onComplete = callback;
			}

			$obj.each(function () {
				var old = $.data(this, colorbox) || {};
				$.data(this, colorbox, $.extend(old, options));
			}).addClass(boxElement);

			settings = new Settings($obj[0], options);

			if (settings.get('open')) {
				launch($obj[0]);
			}
		}

		return $obj;
	};

	publicMethod.position = function (speed, loadedCallback) {
		var
		css,
		top = 0,
		left = 0,
		offset = $box.offset(),
		scrollTop,
		scrollLeft;

		$window.unbind('resize.' + prefix);

		// remove the modal so that it doesn't influence the document width/height
		$box.css({top: -9e4, left: -9e4});

		scrollTop = $window.scrollTop();
		scrollLeft = $window.scrollLeft();

		if (settings.get('fixed')) {
			offset.top -= scrollTop;
			offset.left -= scrollLeft;
			$box.css({position: 'fixed'});
		} else {
			top = scrollTop;
			left = scrollLeft;
			$box.css({position: 'absolute'});
		}

		// keeps the top and left positions within the browser's viewport.
		if (settings.get('right') !== false) {
			left += Math.max($window.width() - settings.w - loadedWidth - interfaceWidth - setSize(settings.get('right'), 'x'), 0);
		} else if (settings.get('left') !== false) {
			left += setSize(settings.get('left'), 'x');
		} else {
			left += Math.round(Math.max($window.width() - settings.w - loadedWidth - interfaceWidth, 0) / 2);
		}

		if (settings.get('bottom') !== false) {
			top += Math.max(winheight() - settings.h - loadedHeight - interfaceHeight - setSize(settings.get('bottom'), 'y'), 0);
		} else if (settings.get('top') !== false) {
			top += setSize(settings.get('top'), 'y');
		} else {
			top += Math.round(Math.max(winheight() - settings.h - loadedHeight - interfaceHeight, 0) / 2);
		}

		$box.css({top: offset.top, left: offset.left, visibility:'visible'});

		// this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
		// but it has to be shrank down around the size of div#colorbox when it's done.  If not,
		// it can invoke an obscure IE bug when using iframes.
		$wrap[0].style.width = $wrap[0].style.height = "9999px";

		function modalDimensions() {
			$topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = (parseInt($box[0].style.width,10) - interfaceWidth)+'px';
			$content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = (parseInt($box[0].style.height,10) - interfaceHeight)+'px';
		}

		css = {width: settings.w + loadedWidth + interfaceWidth, height: settings.h + loadedHeight + interfaceHeight, top: top, left: left};

		// setting the speed to 0 if the content hasn't changed size or position
		if (speed) {
			var tempSpeed = 0;
			$.each(css, function(i){
				if (css[i] !== previousCSS[i]) {
					tempSpeed = speed;
					return;
				}
			});
			speed = tempSpeed;
		}

		previousCSS = css;

		if (!speed) {
			$box.css(css);
		}

		$box.dequeue().animate(css, {
			duration: speed || 0,
			complete: function () {
				modalDimensions();

				active = false;

				// shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
				$wrap[0].style.width = (settings.w + loadedWidth + interfaceWidth) + "px";
				$wrap[0].style.height = (settings.h + loadedHeight + interfaceHeight) + "px";

				if (settings.get('reposition')) {
					setTimeout(function () {  // small delay before binding onresize due to an IE8 bug.
						$window.bind('resize.' + prefix, publicMethod.position);
					}, 1);
				}

				if ($.isFunction(loadedCallback)) {
					loadedCallback();
				}
			},
			step: modalDimensions
		});
	};

	publicMethod.resize = function (options) {
		var scrolltop;

		if (open) {
			options = options || {};

			if (options.width) {
				settings.w = setSize(options.width, 'x') - loadedWidth - interfaceWidth;
			}

			if (options.innerWidth) {
				settings.w = setSize(options.innerWidth, 'x');
			}

			$loaded.css({width: settings.w});

			if (options.height) {
				settings.h = setSize(options.height, 'y') - loadedHeight - interfaceHeight;
			}

			if (options.innerHeight) {
				settings.h = setSize(options.innerHeight, 'y');
			}

			if (!options.innerHeight && !options.height) {
				scrolltop = $loaded.scrollTop();
				$loaded.css({height: "auto"});
				settings.h = $loaded.height();
			}

			$loaded.css({height: settings.h});

			if(scrolltop) {
				$loaded.scrollTop(scrolltop);
			}

			publicMethod.position(settings.get('transition') === "none" ? 0 : settings.get('speed'));
		}
	};

	publicMethod.prep = function (object) {
		if (!open) {
			return;
		}

		var callback, speed = settings.get('transition') === "none" ? 0 : settings.get('speed');

		$loaded.remove();

		$loaded = $tag(div, 'LoadedContent').append(object);

		function getWidth() {
			settings.w = settings.w || $loaded.width();
			settings.w = settings.mw && settings.mw < settings.w ? settings.mw : settings.w;
			return settings.w;
		}
		function getHeight() {
			settings.h = settings.h || $loaded.height();
			settings.h = settings.mh && settings.mh < settings.h ? settings.mh : settings.h;
			return settings.h;
		}

		$loaded.hide()
		.appendTo($loadingBay.show())// content has to be appended to the DOM for accurate size calculations.
		.css({width: getWidth(), overflow: settings.get('scrolling') ? 'auto' : 'hidden'})
		.css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
		.prependTo($content);

		$loadingBay.hide();

		// floating the IMG removes the bottom line-height and fixed a problem where IE miscalculates the width of the parent element as 100% of the document width.

		$(photo).css({'float': 'none'});

		setClass(settings.get('className'));

		callback = function () {
			var total = $related.length,
				iframe,
				complete;

			if (!open) {
				return;
			}

			function removeFilter() { // Needed for IE8 in versions of jQuery prior to 1.7.2
				if ($.support.opacity === false) {
					$box[0].style.removeAttribute('filter');
				}
			}

			complete = function () {
				clearTimeout(loadingTimer);
				$loadingOverlay.hide();
				trigger(event_complete);
				settings.get('onComplete');
			};


			$title.html(settings.get('title')).show();
			$loaded.show();

			if (total > 1) { // handle grouping
				if (typeof settings.get('current') === "string") {
					$current.html(settings.get('current').replace('{current}', index + 1).replace('{total}', total)).show();
				}

				$next[(settings.get('loop') || index < total - 1) ? "show" : "hide"]().html(settings.get('next'));
				$prev[(settings.get('loop') || index) ? "show" : "hide"]().html(settings.get('previous'));

				slideshow();

				// Preloads images within a rel group
				if (settings.get('preloading')) {
					$.each([getIndex(-1), getIndex(1)], function(){
						var img,
							i = $related[this],
							settings = new Settings(i, $.data(i, colorbox)),
							src = settings.get('href');

						if (src && isImage(settings, src)) {
							src = retinaUrl(settings, src);
							img = document.createElement('img');
							img.src = src;
						}
					});
				}
			} else {
				$groupControls.hide();
			}

			if (settings.get('iframe')) {

				iframe = settings.get('createIframe');

				if (!settings.get('scrolling')) {
					iframe.scrolling = "no";
				}

				$(iframe)
					.attr({
						src: settings.get('href'),
						'class': prefix + 'Iframe'
					})
					.one('load', complete)
					.appendTo($loaded);

				$events.one(event_purge, function () {
					iframe.src = "//about:blank";
				});

				if (settings.get('fastIframe')) {
					$(iframe).trigger('load');
				}
			} else {
				complete();
			}

			if (settings.get('transition') === 'fade') {
				$box.fadeTo(speed, 1, removeFilter);
			} else {
				removeFilter();
			}
		};

		if (settings.get('transition') === 'fade') {
			$box.fadeTo(speed, 0, function () {
				publicMethod.position(0, callback);
			});
		} else {
			publicMethod.position(speed, callback);
		}
	};

	function load () {
		var href, setResize, prep = publicMethod.prep, $inline, request = ++requests;

		active = true;

		photo = false;

		trigger(event_purge);
		trigger(event_load);
		settings.get('onLoad');

		settings.h = settings.get('height') ?
				setSize(settings.get('height'), 'y') - loadedHeight - interfaceHeight :
				settings.get('innerHeight') && setSize(settings.get('innerHeight'), 'y');

		settings.w = settings.get('width') ?
				setSize(settings.get('width'), 'x') - loadedWidth - interfaceWidth :
				settings.get('innerWidth') && setSize(settings.get('innerWidth'), 'x');

		// Sets the minimum dimensions for use in image scaling
		settings.mw = settings.w;
		settings.mh = settings.h;

		// Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
		// If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
		if (settings.get('maxWidth')) {
			settings.mw = setSize(settings.get('maxWidth'), 'x') - loadedWidth - interfaceWidth;
			settings.mw = settings.w && settings.w < settings.mw ? settings.w : settings.mw;
		}
		if (settings.get('maxHeight')) {
			settings.mh = setSize(settings.get('maxHeight'), 'y') - loadedHeight - interfaceHeight;
			settings.mh = settings.h && settings.h < settings.mh ? settings.h : settings.mh;
		}

		href = settings.get('href');

		loadingTimer = setTimeout(function () {
			$loadingOverlay.show();
		}, 100);

		if (settings.get('inline')) {
			var $target = $(href).eq(0);
			// Inserts an empty placeholder where inline content is being pulled from.
			// An event is bound to put inline content back when Colorbox closes or loads new content.
			$inline = $('<div>').hide().insertBefore($target);

			$events.one(event_purge, function () {
				$inline.replaceWith($target);
			});

			prep($target);
		} else if (settings.get('iframe')) {
			// IFrame element won't be added to the DOM until it is ready to be displayed,
			// to avoid problems with DOM-ready JS that might be trying to run in that iframe.
			prep(" ");
		} else if (settings.get('html')) {
			prep(settings.get('html'));
		} else if (isImage(settings, href)) {

			href = retinaUrl(settings, href);

			photo = settings.get('createImg');

			$(photo)
			.addClass(prefix + 'Photo')
			.bind('error.'+prefix,function () {
				prep($tag(div, 'Error').html(settings.get('imgError')));
			})
			.one('load', function () {
				if (request !== requests) {
					return;
				}

				// A small pause because some browsers will occassionaly report a
				// img.width and img.height of zero immediately after the img.onload fires
				setTimeout(function(){
					var percent;

					if (settings.get('retinaImage') && window.devicePixelRatio > 1) {
						photo.height = photo.height / window.devicePixelRatio;
						photo.width = photo.width / window.devicePixelRatio;
					}

					if (settings.get('scalePhotos')) {
						setResize = function () {
							photo.height -= photo.height * percent;
							photo.width -= photo.width * percent;
						};
						if (settings.mw && photo.width > settings.mw) {
							percent = (photo.width - settings.mw) / photo.width;
							setResize();
						}
						if (settings.mh && photo.height > settings.mh) {
							percent = (photo.height - settings.mh) / photo.height;
							setResize();
						}
					}

					if (settings.h) {
						photo.style.marginTop = Math.max(settings.mh - photo.height, 0) / 2 + 'px';
					}

					if ($related[1] && (settings.get('loop') || $related[index + 1])) {
						photo.style.cursor = 'pointer';

						$(photo).bind('click.'+prefix, function () {
							publicMethod.next();
						});
					}

					photo.style.width = photo.width + 'px';
					photo.style.height = photo.height + 'px';
					prep(photo);
				}, 1);
			});

			photo.src = href;

		} else if (href) {
			$loadingBay.load(href, settings.get('data'), function (data, status) {
				if (request === requests) {
					prep(status === 'error' ? $tag(div, 'Error').html(settings.get('xhrError')) : $(this).contents());
				}
			});
		}
	}

	// Navigates to the next page/image in a set.
	publicMethod.next = function () {
		if (!active && $related[1] && (settings.get('loop') || $related[index + 1])) {
			index = getIndex(1);
			launch($related[index]);
		}
	};

	publicMethod.prev = function () {
		if (!active && $related[1] && (settings.get('loop') || index)) {
			index = getIndex(-1);
			launch($related[index]);
		}
	};

	// Note: to use this within an iframe use the following format: parent.jQuery.colorbox.close();
	publicMethod.close = function () {
		if (open && !closing) {

			closing = true;
			open = false;
			trigger(event_cleanup);
			settings.get('onCleanup');
			$window.unbind('.' + prefix);
			$overlay.fadeTo(settings.get('fadeOut') || 0, 0);

			$box.stop().fadeTo(settings.get('fadeOut') || 0, 0, function () {
				$box.hide();
				$overlay.hide();
				trigger(event_purge);
				$loaded.remove();

				setTimeout(function () {
					closing = false;
					trigger(event_closed);
					settings.get('onClosed');
				}, 1);
			});
		}
	};

	// Removes changes Colorbox made to the document, but does not remove the plugin.
	publicMethod.remove = function () {
		if (!$box) { return; }

		$box.stop();
		$[colorbox].close();
		$box.stop(false, true).remove();
		$overlay.remove();
		closing = false;
		$box = null;
		$('.' + boxElement)
			.removeData(colorbox)
			.removeClass(boxElement);

		$(document).unbind('click.'+prefix).unbind('keydown.'+prefix);
	};

	// A method for fetching the current element Colorbox is referencing.
	// returns a jQuery object.
	publicMethod.element = function () {
		return $(settings.el);
	};

	publicMethod.settings = defaults;

}(jQuery, document, window));


/***/ }),

/***/ "./node_modules/jquery-ui-touch-punch/jquery.ui.touch-punch.js":
/*!*********************************************************************!*\
  !*** ./node_modules/jquery-ui-touch-punch/jquery.ui.touch-punch.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var jQuery = __webpack_require__(/*! jquery */ "jquery");
/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011–2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function ($) {

  // Detect touch support
  $.support.touch = 'ontouchend' in document;

  // Ignore browsers without touch support
  if (!$.support.touch) {
    return;
  }

  var mouseProto = $.ui.mouse.prototype,
      _mouseInit = mouseProto._mouseInit,
      _mouseDestroy = mouseProto._mouseDestroy,
      touchHandled;

  /**
   * Simulate a mouse event based on a corresponding touch event
   * @param {Object} event A touch event
   * @param {String} simulatedType The corresponding mouse event
   */
  function simulateMouseEvent (event, simulatedType) {

    // Ignore multi-touch events
    if (event.originalEvent.touches.length > 1) {
      return;
    }

    event.preventDefault();

    var touch = event.originalEvent.changedTouches[0],
        simulatedEvent = document.createEvent('MouseEvents');
    
    // Initialize the simulated mouse event using the touch event's coordinates
    simulatedEvent.initMouseEvent(
      simulatedType,    // type
      true,             // bubbles                    
      true,             // cancelable                 
      window,           // view                       
      1,                // detail                     
      touch.screenX,    // screenX                    
      touch.screenY,    // screenY                    
      touch.clientX,    // clientX                    
      touch.clientY,    // clientY                    
      false,            // ctrlKey                    
      false,            // altKey                     
      false,            // shiftKey                   
      false,            // metaKey                    
      0,                // button                     
      null              // relatedTarget              
    );

    // Dispatch the simulated event to the target element
    event.target.dispatchEvent(simulatedEvent);
  }

  /**
   * Handle the jQuery UI widget's touchstart events
   * @param {Object} event The widget element's touchstart event
   */
  mouseProto._touchStart = function (event) {

    var self = this;

    // Ignore the event if another widget is already being handled
    if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
      return;
    }

    // Set the flag to prevent other widgets from inheriting the touch event
    touchHandled = true;

    // Track movement to determine if interaction was a click
    self._touchMoved = false;

    // Simulate the mouseover event
    simulateMouseEvent(event, 'mouseover');

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');

    // Simulate the mousedown event
    simulateMouseEvent(event, 'mousedown');
  };

  /**
   * Handle the jQuery UI widget's touchmove events
   * @param {Object} event The document's touchmove event
   */
  mouseProto._touchMove = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Interaction was not a click
    this._touchMoved = true;

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');
  };

  /**
   * Handle the jQuery UI widget's touchend events
   * @param {Object} event The document's touchend event
   */
  mouseProto._touchEnd = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Simulate the mouseup event
    simulateMouseEvent(event, 'mouseup');

    // Simulate the mouseout event
    simulateMouseEvent(event, 'mouseout');

    // If the touch interaction did not move, it should trigger a click
    if (!this._touchMoved) {

      // Simulate the click event
      simulateMouseEvent(event, 'click');
    }

    // Unset the flag to allow other widgets to inherit the touch event
    touchHandled = false;
  };

  /**
   * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
   * This method extends the widget with bound touch event handlers that
   * translate touch events to mouse events and pass them to the widget's
   * original mouse event handling methods.
   */
  mouseProto._mouseInit = function () {
    
    var self = this;

    // Delegate the touch handlers to the widget's element
    self.element.bind({
      touchstart: $.proxy(self, '_touchStart'),
      touchmove: $.proxy(self, '_touchMove'),
      touchend: $.proxy(self, '_touchEnd')
    });

    // Call the original $.ui.mouse init method
    _mouseInit.call(self);
  };

  /**
   * Remove the touch event handlers
   */
  mouseProto._mouseDestroy = function () {
    
    var self = this;

    // Delegate the touch handlers to the widget's element
    self.element.unbind({
      touchstart: $.proxy(self, '_touchStart'),
      touchmove: $.proxy(self, '_touchMove'),
      touchend: $.proxy(self, '_touchEnd')
    });

    // Call the original $.ui.mouse destroy method
    _mouseDestroy.call(self);
  };

})(jQuery);

/***/ }),

/***/ "./node_modules/jquery-ui/ui/ie.js":
/*!*****************************************!*\
  !*** ./node_modules/jquery-ui/ui/ie.js ***!
  \*****************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;( function( factory ) {
	if ( true ) {

		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(/*! jquery */ "jquery"), __webpack_require__(/*! ./version */ "./node_modules/jquery-ui/ui/version.js") ], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
} ( function( $ ) {

// This file is deprecated
return $.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );
} ) );


/***/ }),

/***/ "./node_modules/jquery-ui/ui/keycode.js":
/*!**********************************************!*\
  !*** ./node_modules/jquery-ui/ui/keycode.js ***!
  \**********************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * jQuery UI Keycode 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Keycode
//>>group: Core
//>>description: Provide keycodes as keynames
//>>docs: http://api.jqueryui.com/jQuery.ui.keyCode/

( function( factory ) {
	if ( true ) {

		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(/*! jquery */ "jquery"), __webpack_require__(/*! ./version */ "./node_modules/jquery-ui/ui/version.js") ], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
} ( function( $ ) {
return $.ui.keyCode = {
	BACKSPACE: 8,
	COMMA: 188,
	DELETE: 46,
	DOWN: 40,
	END: 35,
	ENTER: 13,
	ESCAPE: 27,
	HOME: 36,
	LEFT: 37,
	PAGE_DOWN: 34,
	PAGE_UP: 33,
	PERIOD: 190,
	RIGHT: 39,
	SPACE: 32,
	TAB: 9,
	UP: 38
};

} ) );


/***/ }),

/***/ "./node_modules/jquery-ui/ui/version.js":
/*!**********************************************!*\
  !*** ./node_modules/jquery-ui/ui/version.js ***!
  \**********************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;( function( factory ) {
	if ( true ) {

		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(/*! jquery */ "jquery") ], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
} ( function( $ ) {

$.ui = $.ui || {};

return $.ui.version = "1.12.1";

} ) );


/***/ }),

/***/ "./node_modules/jquery-ui/ui/widget.js":
/*!*********************************************!*\
  !*** ./node_modules/jquery-ui/ui/widget.js ***!
  \*********************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * jQuery UI Widget 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/

( function( factory ) {
	if ( true ) {

		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(/*! jquery */ "jquery"), __webpack_require__(/*! ./version */ "./node_modules/jquery-ui/ui/version.js") ], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
}( function( $ ) {

var widgetUuid = 0;
var widgetSlice = Array.prototype.slice;

$.cleanData = ( function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// Http://bugs.jquery.com/ticket/8235
			} catch ( e ) {}
		}
		orig( elems );
	};
} )( $.cleanData );

$.widget = function( name, base, prototype ) {
	var existingConstructor, constructor, basePrototype;

	// ProxiedPrototype allows the provided prototype to remain unmodified
	// so that it can be used as a mixin for multiple widgets (#8876)
	var proxiedPrototype = {};

	var namespace = name.split( "." )[ 0 ];
	name = name.split( "." )[ 1 ];
	var fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	if ( $.isArray( prototype ) ) {
		prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
	}

	// Create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {

		// Allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// Allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	// Extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,

		// Copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),

		// Track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	} );

	basePrototype = new base();

	// We need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = ( function() {
			function _super() {
				return base.prototype[ prop ].apply( this, arguments );
			}

			function _superApply( args ) {
				return base.prototype[ prop ].apply( this, args );
			}

			return function() {
				var __super = this._super;
				var __superApply = this._superApply;
				var returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		} )();
	} );
	constructor.prototype = $.widget.extend( basePrototype, {

		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	} );

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// Redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
				child._proto );
		} );

		// Remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widgetSlice.call( arguments, 1 );
	var inputIndex = 0;
	var inputLength = input.length;
	var key;
	var value;

	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {

				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :

						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );

				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string";
		var args = widgetSlice.call( arguments, 1 );
		var returnValue = this;

		if ( isMethodCall ) {

			// If this is an empty collection, we need to have the instance method
			// return undefined instead of the jQuery instance
			if ( !this.length && options === "instance" ) {
				returnValue = undefined;
			} else {
				this.each( function() {
					var methodValue;
					var instance = $.data( this, fullName );

					if ( options === "instance" ) {
						returnValue = instance;
						return false;
					}

					if ( !instance ) {
						return $.error( "cannot call methods on " + name +
							" prior to initialization; " +
							"attempted to call method '" + options + "'" );
					}

					if ( !$.isFunction( instance[ options ] ) || options.charAt( 0 ) === "_" ) {
						return $.error( "no such method '" + options + "' for " + name +
							" widget instance" );
					}

					methodValue = instance[ options ].apply( instance, args );

					if ( methodValue !== instance && methodValue !== undefined ) {
						returnValue = methodValue && methodValue.jquery ?
							returnValue.pushStack( methodValue.get() ) :
							methodValue;
						return false;
					}
				} );
			}
		} else {

			// Allow multiple hashes to be passed on init
			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat( args ) );
			}

			this.each( function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			} );
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",

	options: {
		classes: {},
		disabled: false,

		// Callbacks
		create: null
	},

	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widgetUuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();
		this.classesElementLookup = {};

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			} );
			this.document = $( element.style ?

				// Element within the document
				element.ownerDocument :

				// Element is window or document
				element.document || element );
			this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();

		if ( this.options.disabled ) {
			this._setOptionDisabled( this.options.disabled );
		}

		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},

	_getCreateOptions: function() {
		return {};
	},

	_getCreateEventData: $.noop,

	_create: $.noop,

	_init: $.noop,

	destroy: function() {
		var that = this;

		this._destroy();
		$.each( this.classesElementLookup, function( key, value ) {
			that._removeClass( value, key );
		} );

		// We can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.off( this.eventNamespace )
			.removeData( this.widgetFullName );
		this.widget()
			.off( this.eventNamespace )
			.removeAttr( "aria-disabled" );

		// Clean up events and states
		this.bindings.off( this.eventNamespace );
	},

	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;
		var parts;
		var curOption;
		var i;

		if ( arguments.length === 0 ) {

			// Don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {

			// Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},

	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},

	_setOption: function( key, value ) {
		if ( key === "classes" ) {
			this._setOptionClasses( value );
		}

		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this._setOptionDisabled( value );
		}

		return this;
	},

	_setOptionClasses: function( value ) {
		var classKey, elements, currentElements;

		for ( classKey in value ) {
			currentElements = this.classesElementLookup[ classKey ];
			if ( value[ classKey ] === this.options.classes[ classKey ] ||
					!currentElements ||
					!currentElements.length ) {
				continue;
			}

			// We are doing this to create a new jQuery object because the _removeClass() call
			// on the next line is going to destroy the reference to the current elements being
			// tracked. We need to save a copy of this collection so that we can add the new classes
			// below.
			elements = $( currentElements.get() );
			this._removeClass( currentElements, classKey );

			// We don't use _addClass() here, because that uses this.options.classes
			// for generating the string of classes. We want to use the value passed in from
			// _setOption(), this is the new value of the classes option which was passed to
			// _setOption(). We pass this value directly to _classes().
			elements.addClass( this._classes( {
				element: elements,
				keys: classKey,
				classes: value,
				add: true
			} ) );
		}
	},

	_setOptionDisabled: function( value ) {
		this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

		// If the widget is becoming disabled, then nothing is interactive
		if ( value ) {
			this._removeClass( this.hoverable, null, "ui-state-hover" );
			this._removeClass( this.focusable, null, "ui-state-focus" );
		}
	},

	enable: function() {
		return this._setOptions( { disabled: false } );
	},

	disable: function() {
		return this._setOptions( { disabled: true } );
	},

	_classes: function( options ) {
		var full = [];
		var that = this;

		options = $.extend( {
			element: this.element,
			classes: this.options.classes || {}
		}, options );

		function processClassString( classes, checkOption ) {
			var current, i;
			for ( i = 0; i < classes.length; i++ ) {
				current = that.classesElementLookup[ classes[ i ] ] || $();
				if ( options.add ) {
					current = $( $.unique( current.get().concat( options.element.get() ) ) );
				} else {
					current = $( current.not( options.element ).get() );
				}
				that.classesElementLookup[ classes[ i ] ] = current;
				full.push( classes[ i ] );
				if ( checkOption && options.classes[ classes[ i ] ] ) {
					full.push( options.classes[ classes[ i ] ] );
				}
			}
		}

		this._on( options.element, {
			"remove": "_untrackClassesElement"
		} );

		if ( options.keys ) {
			processClassString( options.keys.match( /\S+/g ) || [], true );
		}
		if ( options.extra ) {
			processClassString( options.extra.match( /\S+/g ) || [] );
		}

		return full.join( " " );
	},

	_untrackClassesElement: function( event ) {
		var that = this;
		$.each( that.classesElementLookup, function( key, value ) {
			if ( $.inArray( event.target, value ) !== -1 ) {
				that.classesElementLookup[ key ] = $( value.not( event.target ).get() );
			}
		} );
	},

	_removeClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, false );
	},

	_addClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, true );
	},

	_toggleClass: function( element, keys, extra, add ) {
		add = ( typeof add === "boolean" ) ? add : extra;
		var shift = ( typeof element === "string" || element === null ),
			options = {
				extra: shift ? keys : extra,
				keys: shift ? element : keys,
				element: shift ? this.element : element,
				add: add
			};
		options.element.toggleClass( this._classes( options ), add );
		return this;
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement;
		var instance = this;

		// No suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// No element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {

				// Allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// Copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ );
			var eventName = match[ 1 ] + instance.eventNamespace;
			var selector = match[ 2 ];

			if ( selector ) {
				delegateElement.on( eventName, selector, handlerProxy );
			} else {
				element.on( eventName, handlerProxy );
			}
		} );
	},

	_off: function( element, eventName ) {
		eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.off( eventName ).off( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
			},
			mouseleave: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
			}
		} );
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
			},
			focusout: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
			}
		} );
	},

	_trigger: function( type, event, data ) {
		var prop, orig;
		var callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();

		// The original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// Copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}

		var hasOptions;
		var effectName = !options ?
			method :
			options === true || typeof options === "number" ?
				defaultEffect :
				options.effect || defaultEffect;

		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}

		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;

		if ( options.delay ) {
			element.delay( options.delay );
		}

		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue( function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			} );
		}
	};
} );

return $.widget;

} ) );


/***/ }),

/***/ "./node_modules/jquery-ui/ui/widgets/mouse.js":
/*!****************************************************!*\
  !*** ./node_modules/jquery-ui/ui/widgets/mouse.js ***!
  \****************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * jQuery UI Mouse 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Mouse
//>>group: Widgets
//>>description: Abstracts mouse-based interactions to assist in creating certain widgets.
//>>docs: http://api.jqueryui.com/mouse/

( function( factory ) {
	if ( true ) {

		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
			__webpack_require__(/*! jquery */ "jquery"),
			__webpack_require__(/*! ../ie */ "./node_modules/jquery-ui/ui/ie.js"),
			__webpack_require__(/*! ../version */ "./node_modules/jquery-ui/ui/version.js"),
			__webpack_require__(/*! ../widget */ "./node_modules/jquery-ui/ui/widget.js")
		], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
}( function( $ ) {

var mouseHandled = false;
$( document ).on( "mouseup", function() {
	mouseHandled = false;
} );

return $.widget( "ui.mouse", {
	version: "1.12.1",
	options: {
		cancel: "input, textarea, button, select, option",
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var that = this;

		this.element
			.on( "mousedown." + this.widgetName, function( event ) {
				return that._mouseDown( event );
			} )
			.on( "click." + this.widgetName, function( event ) {
				if ( true === $.data( event.target, that.widgetName + ".preventClickEvent" ) ) {
					$.removeData( event.target, that.widgetName + ".preventClickEvent" );
					event.stopImmediatePropagation();
					return false;
				}
			} );

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.off( "." + this.widgetName );
		if ( this._mouseMoveDelegate ) {
			this.document
				.off( "mousemove." + this.widgetName, this._mouseMoveDelegate )
				.off( "mouseup." + this.widgetName, this._mouseUpDelegate );
		}
	},

	_mouseDown: function( event ) {

		// don't let more than one widget handle mouseStart
		if ( mouseHandled ) {
			return;
		}

		this._mouseMoved = false;

		// We may have missed mouseup (out of window)
		( this._mouseStarted && this._mouseUp( event ) );

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = ( event.which === 1 ),

			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = ( typeof this.options.cancel === "string" && event.target.nodeName ?
				$( event.target ).closest( this.options.cancel ).length : false );
		if ( !btnIsLeft || elIsCancel || !this._mouseCapture( event ) ) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if ( !this.mouseDelayMet ) {
			this._mouseDelayTimer = setTimeout( function() {
				that.mouseDelayMet = true;
			}, this.options.delay );
		}

		if ( this._mouseDistanceMet( event ) && this._mouseDelayMet( event ) ) {
			this._mouseStarted = ( this._mouseStart( event ) !== false );
			if ( !this._mouseStarted ) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if ( true === $.data( event.target, this.widgetName + ".preventClickEvent" ) ) {
			$.removeData( event.target, this.widgetName + ".preventClickEvent" );
		}

		// These delegates are required to keep context
		this._mouseMoveDelegate = function( event ) {
			return that._mouseMove( event );
		};
		this._mouseUpDelegate = function( event ) {
			return that._mouseUp( event );
		};

		this.document
			.on( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.on( "mouseup." + this.widgetName, this._mouseUpDelegate );

		event.preventDefault();

		mouseHandled = true;
		return true;
	},

	_mouseMove: function( event ) {

		// Only check for mouseups outside the document if you've moved inside the document
		// at least once. This prevents the firing of mouseup in the case of IE<9, which will
		// fire a mousemove event if content is placed under the cursor. See #7778
		// Support: IE <9
		if ( this._mouseMoved ) {

			// IE mouseup check - mouseup happened when mouse was out of window
			if ( $.ui.ie && ( !document.documentMode || document.documentMode < 9 ) &&
					!event.button ) {
				return this._mouseUp( event );

			// Iframe mouseup check - mouseup occurred in another document
			} else if ( !event.which ) {

				// Support: Safari <=8 - 9
				// Safari sets which to 0 if you press any of the following keys
				// during a drag (#14461)
				if ( event.originalEvent.altKey || event.originalEvent.ctrlKey ||
						event.originalEvent.metaKey || event.originalEvent.shiftKey ) {
					this.ignoreMissingWhich = true;
				} else if ( !this.ignoreMissingWhich ) {
					return this._mouseUp( event );
				}
			}
		}

		if ( event.which || event.button ) {
			this._mouseMoved = true;
		}

		if ( this._mouseStarted ) {
			this._mouseDrag( event );
			return event.preventDefault();
		}

		if ( this._mouseDistanceMet( event ) && this._mouseDelayMet( event ) ) {
			this._mouseStarted =
				( this._mouseStart( this._mouseDownEvent, event ) !== false );
			( this._mouseStarted ? this._mouseDrag( event ) : this._mouseUp( event ) );
		}

		return !this._mouseStarted;
	},

	_mouseUp: function( event ) {
		this.document
			.off( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.off( "mouseup." + this.widgetName, this._mouseUpDelegate );

		if ( this._mouseStarted ) {
			this._mouseStarted = false;

			if ( event.target === this._mouseDownEvent.target ) {
				$.data( event.target, this.widgetName + ".preventClickEvent", true );
			}

			this._mouseStop( event );
		}

		if ( this._mouseDelayTimer ) {
			clearTimeout( this._mouseDelayTimer );
			delete this._mouseDelayTimer;
		}

		this.ignoreMissingWhich = false;
		mouseHandled = false;
		event.preventDefault();
	},

	_mouseDistanceMet: function( event ) {
		return ( Math.max(
				Math.abs( this._mouseDownEvent.pageX - event.pageX ),
				Math.abs( this._mouseDownEvent.pageY - event.pageY )
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function( /* event */ ) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function( /* event */ ) {},
	_mouseDrag: function( /* event */ ) {},
	_mouseStop: function( /* event */ ) {},
	_mouseCapture: function( /* event */ ) { return true; }
} );

} ) );


/***/ }),

/***/ "./node_modules/jquery-ui/ui/widgets/slider.js":
/*!*****************************************************!*\
  !*** ./node_modules/jquery-ui/ui/widgets/slider.js ***!
  \*****************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * jQuery UI Slider 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Slider
//>>group: Widgets
//>>description: Displays a flexible slider with ranges and accessibility via keyboard.
//>>docs: http://api.jqueryui.com/slider/
//>>demos: http://jqueryui.com/slider/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/slider.css
//>>css.theme: ../../themes/base/theme.css

( function( factory ) {
	if ( true ) {

		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
			__webpack_require__(/*! jquery */ "jquery"),
			__webpack_require__(/*! ./mouse */ "./node_modules/jquery-ui/ui/widgets/mouse.js"),
			__webpack_require__(/*! ../keycode */ "./node_modules/jquery-ui/ui/keycode.js"),
			__webpack_require__(/*! ../version */ "./node_modules/jquery-ui/ui/version.js"),
			__webpack_require__(/*! ../widget */ "./node_modules/jquery-ui/ui/widget.js")
		], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
}( function( $ ) {

return $.widget( "ui.slider", $.ui.mouse, {
	version: "1.12.1",
	widgetEventPrefix: "slide",

	options: {
		animate: false,
		classes: {
			"ui-slider": "ui-corner-all",
			"ui-slider-handle": "ui-corner-all",

			// Note: ui-widget-header isn't the most fittingly semantic framework class for this
			// element, but worked best visually with a variety of themes
			"ui-slider-range": "ui-corner-all ui-widget-header"
		},
		distance: 0,
		max: 100,
		min: 0,
		orientation: "horizontal",
		range: false,
		step: 1,
		value: 0,
		values: null,

		// Callbacks
		change: null,
		slide: null,
		start: null,
		stop: null
	},

	// Number of pages in a slider
	// (how many times can you page up/down to go through the whole range)
	numPages: 5,

	_create: function() {
		this._keySliding = false;
		this._mouseSliding = false;
		this._animateOff = true;
		this._handleIndex = null;
		this._detectOrientation();
		this._mouseInit();
		this._calculateNewMax();

		this._addClass( "ui-slider ui-slider-" + this.orientation,
			"ui-widget ui-widget-content" );

		this._refresh();

		this._animateOff = false;
	},

	_refresh: function() {
		this._createRange();
		this._createHandles();
		this._setupEvents();
		this._refreshValue();
	},

	_createHandles: function() {
		var i, handleCount,
			options = this.options,
			existingHandles = this.element.find( ".ui-slider-handle" ),
			handle = "<span tabindex='0'></span>",
			handles = [];

		handleCount = ( options.values && options.values.length ) || 1;

		if ( existingHandles.length > handleCount ) {
			existingHandles.slice( handleCount ).remove();
			existingHandles = existingHandles.slice( 0, handleCount );
		}

		for ( i = existingHandles.length; i < handleCount; i++ ) {
			handles.push( handle );
		}

		this.handles = existingHandles.add( $( handles.join( "" ) ).appendTo( this.element ) );

		this._addClass( this.handles, "ui-slider-handle", "ui-state-default" );

		this.handle = this.handles.eq( 0 );

		this.handles.each( function( i ) {
			$( this )
				.data( "ui-slider-handle-index", i )
				.attr( "tabIndex", 0 );
		} );
	},

	_createRange: function() {
		var options = this.options;

		if ( options.range ) {
			if ( options.range === true ) {
				if ( !options.values ) {
					options.values = [ this._valueMin(), this._valueMin() ];
				} else if ( options.values.length && options.values.length !== 2 ) {
					options.values = [ options.values[ 0 ], options.values[ 0 ] ];
				} else if ( $.isArray( options.values ) ) {
					options.values = options.values.slice( 0 );
				}
			}

			if ( !this.range || !this.range.length ) {
				this.range = $( "<div>" )
					.appendTo( this.element );

				this._addClass( this.range, "ui-slider-range" );
			} else {
				this._removeClass( this.range, "ui-slider-range-min ui-slider-range-max" );

				// Handle range switching from true to min/max
				this.range.css( {
					"left": "",
					"bottom": ""
				} );
			}
			if ( options.range === "min" || options.range === "max" ) {
				this._addClass( this.range, "ui-slider-range-" + options.range );
			}
		} else {
			if ( this.range ) {
				this.range.remove();
			}
			this.range = null;
		}
	},

	_setupEvents: function() {
		this._off( this.handles );
		this._on( this.handles, this._handleEvents );
		this._hoverable( this.handles );
		this._focusable( this.handles );
	},

	_destroy: function() {
		this.handles.remove();
		if ( this.range ) {
			this.range.remove();
		}

		this._mouseDestroy();
	},

	_mouseCapture: function( event ) {
		var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
			that = this,
			o = this.options;

		if ( o.disabled ) {
			return false;
		}

		this.elementSize = {
			width: this.element.outerWidth(),
			height: this.element.outerHeight()
		};
		this.elementOffset = this.element.offset();

		position = { x: event.pageX, y: event.pageY };
		normValue = this._normValueFromMouse( position );
		distance = this._valueMax() - this._valueMin() + 1;
		this.handles.each( function( i ) {
			var thisDistance = Math.abs( normValue - that.values( i ) );
			if ( ( distance > thisDistance ) ||
				( distance === thisDistance &&
					( i === that._lastChangedValue || that.values( i ) === o.min ) ) ) {
				distance = thisDistance;
				closestHandle = $( this );
				index = i;
			}
		} );

		allowed = this._start( event, index );
		if ( allowed === false ) {
			return false;
		}
		this._mouseSliding = true;

		this._handleIndex = index;

		this._addClass( closestHandle, null, "ui-state-active" );
		closestHandle.trigger( "focus" );

		offset = closestHandle.offset();
		mouseOverHandle = !$( event.target ).parents().addBack().is( ".ui-slider-handle" );
		this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
			left: event.pageX - offset.left - ( closestHandle.width() / 2 ),
			top: event.pageY - offset.top -
				( closestHandle.height() / 2 ) -
				( parseInt( closestHandle.css( "borderTopWidth" ), 10 ) || 0 ) -
				( parseInt( closestHandle.css( "borderBottomWidth" ), 10 ) || 0 ) +
				( parseInt( closestHandle.css( "marginTop" ), 10 ) || 0 )
		};

		if ( !this.handles.hasClass( "ui-state-hover" ) ) {
			this._slide( event, index, normValue );
		}
		this._animateOff = true;
		return true;
	},

	_mouseStart: function() {
		return true;
	},

	_mouseDrag: function( event ) {
		var position = { x: event.pageX, y: event.pageY },
			normValue = this._normValueFromMouse( position );

		this._slide( event, this._handleIndex, normValue );

		return false;
	},

	_mouseStop: function( event ) {
		this._removeClass( this.handles, null, "ui-state-active" );
		this._mouseSliding = false;

		this._stop( event, this._handleIndex );
		this._change( event, this._handleIndex );

		this._handleIndex = null;
		this._clickOffset = null;
		this._animateOff = false;

		return false;
	},

	_detectOrientation: function() {
		this.orientation = ( this.options.orientation === "vertical" ) ? "vertical" : "horizontal";
	},

	_normValueFromMouse: function( position ) {
		var pixelTotal,
			pixelMouse,
			percentMouse,
			valueTotal,
			valueMouse;

		if ( this.orientation === "horizontal" ) {
			pixelTotal = this.elementSize.width;
			pixelMouse = position.x - this.elementOffset.left -
				( this._clickOffset ? this._clickOffset.left : 0 );
		} else {
			pixelTotal = this.elementSize.height;
			pixelMouse = position.y - this.elementOffset.top -
				( this._clickOffset ? this._clickOffset.top : 0 );
		}

		percentMouse = ( pixelMouse / pixelTotal );
		if ( percentMouse > 1 ) {
			percentMouse = 1;
		}
		if ( percentMouse < 0 ) {
			percentMouse = 0;
		}
		if ( this.orientation === "vertical" ) {
			percentMouse = 1 - percentMouse;
		}

		valueTotal = this._valueMax() - this._valueMin();
		valueMouse = this._valueMin() + percentMouse * valueTotal;

		return this._trimAlignValue( valueMouse );
	},

	_uiHash: function( index, value, values ) {
		var uiHash = {
			handle: this.handles[ index ],
			handleIndex: index,
			value: value !== undefined ? value : this.value()
		};

		if ( this._hasMultipleValues() ) {
			uiHash.value = value !== undefined ? value : this.values( index );
			uiHash.values = values || this.values();
		}

		return uiHash;
	},

	_hasMultipleValues: function() {
		return this.options.values && this.options.values.length;
	},

	_start: function( event, index ) {
		return this._trigger( "start", event, this._uiHash( index ) );
	},

	_slide: function( event, index, newVal ) {
		var allowed, otherVal,
			currentValue = this.value(),
			newValues = this.values();

		if ( this._hasMultipleValues() ) {
			otherVal = this.values( index ? 0 : 1 );
			currentValue = this.values( index );

			if ( this.options.values.length === 2 && this.options.range === true ) {
				newVal =  index === 0 ? Math.min( otherVal, newVal ) : Math.max( otherVal, newVal );
			}

			newValues[ index ] = newVal;
		}

		if ( newVal === currentValue ) {
			return;
		}

		allowed = this._trigger( "slide", event, this._uiHash( index, newVal, newValues ) );

		// A slide can be canceled by returning false from the slide callback
		if ( allowed === false ) {
			return;
		}

		if ( this._hasMultipleValues() ) {
			this.values( index, newVal );
		} else {
			this.value( newVal );
		}
	},

	_stop: function( event, index ) {
		this._trigger( "stop", event, this._uiHash( index ) );
	},

	_change: function( event, index ) {
		if ( !this._keySliding && !this._mouseSliding ) {

			//store the last changed value index for reference when handles overlap
			this._lastChangedValue = index;
			this._trigger( "change", event, this._uiHash( index ) );
		}
	},

	value: function( newValue ) {
		if ( arguments.length ) {
			this.options.value = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, 0 );
			return;
		}

		return this._value();
	},

	values: function( index, newValue ) {
		var vals,
			newValues,
			i;

		if ( arguments.length > 1 ) {
			this.options.values[ index ] = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, index );
			return;
		}

		if ( arguments.length ) {
			if ( $.isArray( arguments[ 0 ] ) ) {
				vals = this.options.values;
				newValues = arguments[ 0 ];
				for ( i = 0; i < vals.length; i += 1 ) {
					vals[ i ] = this._trimAlignValue( newValues[ i ] );
					this._change( null, i );
				}
				this._refreshValue();
			} else {
				if ( this._hasMultipleValues() ) {
					return this._values( index );
				} else {
					return this.value();
				}
			}
		} else {
			return this._values();
		}
	},

	_setOption: function( key, value ) {
		var i,
			valsLength = 0;

		if ( key === "range" && this.options.range === true ) {
			if ( value === "min" ) {
				this.options.value = this._values( 0 );
				this.options.values = null;
			} else if ( value === "max" ) {
				this.options.value = this._values( this.options.values.length - 1 );
				this.options.values = null;
			}
		}

		if ( $.isArray( this.options.values ) ) {
			valsLength = this.options.values.length;
		}

		this._super( key, value );

		switch ( key ) {
			case "orientation":
				this._detectOrientation();
				this._removeClass( "ui-slider-horizontal ui-slider-vertical" )
					._addClass( "ui-slider-" + this.orientation );
				this._refreshValue();
				if ( this.options.range ) {
					this._refreshRange( value );
				}

				// Reset positioning from previous orientation
				this.handles.css( value === "horizontal" ? "bottom" : "left", "" );
				break;
			case "value":
				this._animateOff = true;
				this._refreshValue();
				this._change( null, 0 );
				this._animateOff = false;
				break;
			case "values":
				this._animateOff = true;
				this._refreshValue();

				// Start from the last handle to prevent unreachable handles (#9046)
				for ( i = valsLength - 1; i >= 0; i-- ) {
					this._change( null, i );
				}
				this._animateOff = false;
				break;
			case "step":
			case "min":
			case "max":
				this._animateOff = true;
				this._calculateNewMax();
				this._refreshValue();
				this._animateOff = false;
				break;
			case "range":
				this._animateOff = true;
				this._refresh();
				this._animateOff = false;
				break;
		}
	},

	_setOptionDisabled: function( value ) {
		this._super( value );

		this._toggleClass( null, "ui-state-disabled", !!value );
	},

	//internal value getter
	// _value() returns value trimmed by min and max, aligned by step
	_value: function() {
		var val = this.options.value;
		val = this._trimAlignValue( val );

		return val;
	},

	//internal values getter
	// _values() returns array of values trimmed by min and max, aligned by step
	// _values( index ) returns single value trimmed by min and max, aligned by step
	_values: function( index ) {
		var val,
			vals,
			i;

		if ( arguments.length ) {
			val = this.options.values[ index ];
			val = this._trimAlignValue( val );

			return val;
		} else if ( this._hasMultipleValues() ) {

			// .slice() creates a copy of the array
			// this copy gets trimmed by min and max and then returned
			vals = this.options.values.slice();
			for ( i = 0; i < vals.length; i += 1 ) {
				vals[ i ] = this._trimAlignValue( vals[ i ] );
			}

			return vals;
		} else {
			return [];
		}
	},

	// Returns the step-aligned value that val is closest to, between (inclusive) min and max
	_trimAlignValue: function( val ) {
		if ( val <= this._valueMin() ) {
			return this._valueMin();
		}
		if ( val >= this._valueMax() ) {
			return this._valueMax();
		}
		var step = ( this.options.step > 0 ) ? this.options.step : 1,
			valModStep = ( val - this._valueMin() ) % step,
			alignValue = val - valModStep;

		if ( Math.abs( valModStep ) * 2 >= step ) {
			alignValue += ( valModStep > 0 ) ? step : ( -step );
		}

		// Since JavaScript has problems with large floats, round
		// the final value to 5 digits after the decimal point (see #4124)
		return parseFloat( alignValue.toFixed( 5 ) );
	},

	_calculateNewMax: function() {
		var max = this.options.max,
			min = this._valueMin(),
			step = this.options.step,
			aboveMin = Math.round( ( max - min ) / step ) * step;
		max = aboveMin + min;
		if ( max > this.options.max ) {

			//If max is not divisible by step, rounding off may increase its value
			max -= step;
		}
		this.max = parseFloat( max.toFixed( this._precision() ) );
	},

	_precision: function() {
		var precision = this._precisionOf( this.options.step );
		if ( this.options.min !== null ) {
			precision = Math.max( precision, this._precisionOf( this.options.min ) );
		}
		return precision;
	},

	_precisionOf: function( num ) {
		var str = num.toString(),
			decimal = str.indexOf( "." );
		return decimal === -1 ? 0 : str.length - decimal - 1;
	},

	_valueMin: function() {
		return this.options.min;
	},

	_valueMax: function() {
		return this.max;
	},

	_refreshRange: function( orientation ) {
		if ( orientation === "vertical" ) {
			this.range.css( { "width": "", "left": "" } );
		}
		if ( orientation === "horizontal" ) {
			this.range.css( { "height": "", "bottom": "" } );
		}
	},

	_refreshValue: function() {
		var lastValPercent, valPercent, value, valueMin, valueMax,
			oRange = this.options.range,
			o = this.options,
			that = this,
			animate = ( !this._animateOff ) ? o.animate : false,
			_set = {};

		if ( this._hasMultipleValues() ) {
			this.handles.each( function( i ) {
				valPercent = ( that.values( i ) - that._valueMin() ) / ( that._valueMax() -
					that._valueMin() ) * 100;
				_set[ that.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
				$( this ).stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );
				if ( that.options.range === true ) {
					if ( that.orientation === "horizontal" ) {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
								left: valPercent + "%"
							}, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( {
								width: ( valPercent - lastValPercent ) + "%"
							}, {
								queue: false,
								duration: o.animate
							} );
						}
					} else {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
								bottom: ( valPercent ) + "%"
							}, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( {
								height: ( valPercent - lastValPercent ) + "%"
							}, {
								queue: false,
								duration: o.animate
							} );
						}
					}
				}
				lastValPercent = valPercent;
			} );
		} else {
			value = this.value();
			valueMin = this._valueMin();
			valueMax = this._valueMax();
			valPercent = ( valueMax !== valueMin ) ?
					( value - valueMin ) / ( valueMax - valueMin ) * 100 :
					0;
			_set[ this.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
			this.handle.stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );

			if ( oRange === "min" && this.orientation === "horizontal" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
					width: valPercent + "%"
				}, o.animate );
			}
			if ( oRange === "max" && this.orientation === "horizontal" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
					width: ( 100 - valPercent ) + "%"
				}, o.animate );
			}
			if ( oRange === "min" && this.orientation === "vertical" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
					height: valPercent + "%"
				}, o.animate );
			}
			if ( oRange === "max" && this.orientation === "vertical" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
					height: ( 100 - valPercent ) + "%"
				}, o.animate );
			}
		}
	},

	_handleEvents: {
		keydown: function( event ) {
			var allowed, curVal, newVal, step,
				index = $( event.target ).data( "ui-slider-handle-index" );

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
				case $.ui.keyCode.END:
				case $.ui.keyCode.PAGE_UP:
				case $.ui.keyCode.PAGE_DOWN:
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					event.preventDefault();
					if ( !this._keySliding ) {
						this._keySliding = true;
						this._addClass( $( event.target ), null, "ui-state-active" );
						allowed = this._start( event, index );
						if ( allowed === false ) {
							return;
						}
					}
					break;
			}

			step = this.options.step;
			if ( this._hasMultipleValues() ) {
				curVal = newVal = this.values( index );
			} else {
				curVal = newVal = this.value();
			}

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
					newVal = this._valueMin();
					break;
				case $.ui.keyCode.END:
					newVal = this._valueMax();
					break;
				case $.ui.keyCode.PAGE_UP:
					newVal = this._trimAlignValue(
						curVal + ( ( this._valueMax() - this._valueMin() ) / this.numPages )
					);
					break;
				case $.ui.keyCode.PAGE_DOWN:
					newVal = this._trimAlignValue(
						curVal - ( ( this._valueMax() - this._valueMin() ) / this.numPages ) );
					break;
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
					if ( curVal === this._valueMax() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal + step );
					break;
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					if ( curVal === this._valueMin() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal - step );
					break;
			}

			this._slide( event, index, newVal );
		},
		keyup: function( event ) {
			var index = $( event.target ).data( "ui-slider-handle-index" );

			if ( this._keySliding ) {
				this._keySliding = false;
				this._stop( event, index );
				this._change( event, index );
				this._removeClass( $( event.target ), null, "ui-state-active" );
			}
		}
	}
} );

} ) );


/***/ }),

/***/ "jquery":
/*!*************************!*\
  !*** external "jQuery" ***!
  \*************************/
/***/ (function(module) {

"use strict";
module.exports = jQuery;

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/css-tag.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/css-tag.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CSSResult: function() { return /* binding */ CSSResult; },
/* harmony export */   adoptStyles: function() { return /* binding */ adoptStyles; },
/* harmony export */   css: function() { return /* binding */ css; },
/* harmony export */   getCompatibleStyle: function() { return /* binding */ getCompatibleStyle; },
/* harmony export */   supportsAdoptingStyleSheets: function() { return /* binding */ supportsAdoptingStyleSheets; },
/* harmony export */   unsafeCSS: function() { return /* binding */ unsafeCSS; }
/* harmony export */ });
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const NODE_MODE = false;
const global = NODE_MODE ? globalThis : window;
/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
const supportsAdoptingStyleSheets = global.ShadowRoot && (global.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) && 'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;
const constructionToken = Symbol();
const cssTagCache = new WeakMap();
/**
 * A container for a string of CSS text, that may be used to create a CSSStyleSheet.
 *
 * CSSResult is the return value of `css`-tagged template literals and
 * `unsafeCSS()`. In order to ensure that CSSResults are only created via the
 * `css` tag and `unsafeCSS()`, CSSResult cannot be constructed directly.
 */
class CSSResult {
  constructor(cssText, strings, safeToken) {
    // This property needs to remain unminified.
    this['_$cssResult$'] = true;
    if (safeToken !== constructionToken) {
      throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
    }
    this.cssText = cssText;
    this._strings = strings;
  }
  // This is a getter so that it's lazy. In practice, this means stylesheets
  // are not created until the first element instance is made.
  get styleSheet() {
    // If `supportsAdoptingStyleSheets` is true then we assume CSSStyleSheet is
    // constructable.
    let styleSheet = this._styleSheet;
    const strings = this._strings;
    if (supportsAdoptingStyleSheets && styleSheet === undefined) {
      const cacheable = strings !== undefined && strings.length === 1;
      if (cacheable) {
        styleSheet = cssTagCache.get(strings);
      }
      if (styleSheet === undefined) {
        (this._styleSheet = styleSheet = new CSSStyleSheet()).replaceSync(this.cssText);
        if (cacheable) {
          cssTagCache.set(strings, styleSheet);
        }
      }
    }
    return styleSheet;
  }
  toString() {
    return this.cssText;
  }
}
const textFromCSSResult = value => {
  // This property needs to remain unminified.
  if (value['_$cssResult$'] === true) {
    return value.cssText;
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(`Value passed to 'css' function must be a 'css' function result: ` + `${value}. Use 'unsafeCSS' to pass non-literal values, but take care ` + `to ensure page security.`);
  }
};
/**
 * Wrap a value for interpolation in a {@linkcode css} tagged template literal.
 *
 * This is unsafe because untrusted CSS text can be used to phone home
 * or exfiltrate data to an attacker controlled site. Take care to only use
 * this with trusted input.
 */
const unsafeCSS = value => new CSSResult(typeof value === 'string' ? value : String(value), undefined, constructionToken);
/**
 * A template literal tag which can be used with LitElement's
 * {@linkcode LitElement.styles} property to set element styles.
 *
 * For security reasons, only literal string values and number may be used in
 * embedded expressions. To incorporate non-literal values {@linkcode unsafeCSS}
 * may be used inside an expression.
 */
const css = (strings, ...values) => {
  const cssText = strings.length === 1 ? strings[0] : values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
  return new CSSResult(cssText, strings, constructionToken);
};
/**
 * Applies the given styles to a `shadowRoot`. When Shadow DOM is
 * available but `adoptedStyleSheets` is not, styles are appended to the
 * `shadowRoot` to [mimic spec behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
 * Note, when shimming is used, any styles that are subsequently placed into
 * the shadowRoot should be placed *before* any shimmed adopted styles. This
 * will match spec behavior that gives adopted sheets precedence over styles in
 * shadowRoot.
 */
const adoptStyles = (renderRoot, styles) => {
  if (supportsAdoptingStyleSheets) {
    renderRoot.adoptedStyleSheets = styles.map(s => s instanceof CSSStyleSheet ? s : s.styleSheet);
  } else {
    styles.forEach(s => {
      const style = document.createElement('style');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nonce = global['litNonce'];
      if (nonce !== undefined) {
        style.setAttribute('nonce', nonce);
      }
      style.textContent = s.cssText;
      renderRoot.appendChild(style);
    });
  }
};
const cssResultFromStyleSheet = sheet => {
  let cssText = '';
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};
const getCompatibleStyle = supportsAdoptingStyleSheets || NODE_MODE && global.CSSStyleSheet === undefined ? s => s : s => s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/base.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/base.js ***!
  \***************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   decorateProperty: function() { return /* binding */ decorateProperty; },
/* harmony export */   legacyPrototypeMethod: function() { return /* binding */ legacyPrototypeMethod; },
/* harmony export */   standardPrototypeMethod: function() { return /* binding */ standardPrototypeMethod; }
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const legacyPrototypeMethod = (descriptor, proto, name) => {
  Object.defineProperty(proto, name, descriptor);
};
const standardPrototypeMethod = (descriptor, element) => ({
  kind: 'method',
  placement: 'prototype',
  key: element.key,
  descriptor
});
/**
 * Helper for decorating a property that is compatible with both TypeScript
 * and Babel decorators. The optional `finisher` can be used to perform work on
 * the class. The optional `descriptor` should return a PropertyDescriptor
 * to install for the given property.
 *
 * @param finisher {function} Optional finisher method; receives the element
 * constructor and property key as arguments and has no return value.
 * @param descriptor {function} Optional descriptor method; receives the
 * property key as an argument and returns a property descriptor to define for
 * the given property.
 * @returns {ClassElement|void}
 */
const decorateProperty = ({
  finisher,
  descriptor
}) => (protoOrDescriptor, name
// Note TypeScript requires the return type to be `void|any`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => {
  var _a;
  // TypeScript / Babel legacy mode
  if (name !== undefined) {
    const ctor = protoOrDescriptor.constructor;
    if (descriptor !== undefined) {
      Object.defineProperty(protoOrDescriptor, name, descriptor(name));
    }
    finisher === null || finisher === void 0 ? void 0 : finisher(ctor, name);
    // Babel standard mode
  } else {
    // Note, the @property decorator saves `key` as `originalKey`
    // so try to use it here.
    const key =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_a = protoOrDescriptor.originalKey) !== null && _a !== void 0 ? _a : protoOrDescriptor.key;
    const info = descriptor != undefined ? {
      kind: 'method',
      placement: 'prototype',
      key,
      descriptor: descriptor(protoOrDescriptor.key)
    } : {
      ...protoOrDescriptor,
      key
    };
    if (finisher != undefined) {
      info.finisher = function (ctor) {
        finisher(ctor, key);
      };
    }
    return info;
  }
};

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/custom-element.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/custom-element.js ***!
  \*************************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   customElement: function() { return /* binding */ customElement; }
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const legacyCustomElement = (tagName, clazz) => {
  customElements.define(tagName, clazz);
  // Cast as any because TS doesn't recognize the return type as being a
  // subtype of the decorated class when clazz is typed as
  // `Constructor<HTMLElement>` for some reason.
  // `Constructor<HTMLElement>` is helpful to make sure the decorator is
  // applied to elements however.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return clazz;
};
const standardCustomElement = (tagName, descriptor) => {
  const {
    kind,
    elements
  } = descriptor;
  return {
    kind,
    elements,
    // This callback is called once the class is otherwise fully defined
    finisher(clazz) {
      customElements.define(tagName, clazz);
    }
  };
};
/**
 * Class decorator factory that defines the decorated class as a custom element.
 *
 * ```js
 * @customElement('my-element')
 * class MyElement extends LitElement {
 *   render() {
 *     return html``;
 *   }
 * }
 * ```
 * @category Decorator
 * @param tagName The tag name of the custom element to define.
 */
const customElement = tagName => classOrDescriptor => typeof classOrDescriptor === 'function' ? legacyCustomElement(tagName, classOrDescriptor) : standardCustomElement(tagName, classOrDescriptor);

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/event-options.js":
/*!************************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/event-options.js ***!
  \************************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   eventOptions: function() { return /* binding */ eventOptions; }
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/@lit/reactive-element/development/decorators/base.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Adds event listener options to a method used as an event listener in a
 * lit-html template.
 *
 * @param options An object that specifies event listener options as accepted by
 * `EventTarget#addEventListener` and `EventTarget#removeEventListener`.
 *
 * Current browsers support the `capture`, `passive`, and `once` options. See:
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Parameters
 *
 * ```ts
 * class MyElement {
 *   clicked = false;
 *
 *   render() {
 *     return html`
 *       <div @click=${this._onClick}>
 *         <button></button>
 *       </div>
 *     `;
 *   }
 *
 *   @eventOptions({capture: true})
 *   _onClick(e) {
 *     this.clicked = true;
 *   }
 * }
 * ```
 * @category Decorator
 */
function eventOptions(options) {
  return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.decorateProperty)({
    finisher: (ctor, name) => {
      Object.assign(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctor.prototype[name], options);
    }
  });
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/property.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/property.js ***!
  \*******************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   property: function() { return /* binding */ property; }
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const standardProperty = (options, element) => {
  // When decorating an accessor, pass it through and add property metadata.
  // Note, the `hasOwnProperty` check in `createProperty` ensures we don't
  // stomp over the user's accessor.
  if (element.kind === 'method' && element.descriptor && !('value' in element.descriptor)) {
    return {
      ...element,
      finisher(clazz) {
        clazz.createProperty(element.key, options);
      }
    };
  } else {
    // createProperty() takes care of defining the property, but we still
    // must return some kind of descriptor, so return a descriptor for an
    // unused prototype field. The finisher calls createProperty().
    return {
      kind: 'field',
      key: Symbol(),
      placement: 'own',
      descriptor: {},
      // store the original key so subsequent decorators have access to it.
      originalKey: element.key,
      // When @babel/plugin-proposal-decorators implements initializers,
      // do this instead of the initializer below. See:
      // https://github.com/babel/babel/issues/9260 extras: [
      //   {
      //     kind: 'initializer',
      //     placement: 'own',
      //     initializer: descriptor.initializer,
      //   }
      // ],
      initializer() {
        if (typeof element.initializer === 'function') {
          this[element.key] = element.initializer.call(this);
        }
      },
      finisher(clazz) {
        clazz.createProperty(element.key, options);
      }
    };
  }
};
const legacyProperty = (options, proto, name) => {
  proto.constructor.createProperty(name, options);
};
/**
 * A property decorator which creates a reactive property that reflects a
 * corresponding attribute value. When a decorated property is set
 * the element will update and render. A {@linkcode PropertyDeclaration} may
 * optionally be supplied to configure property features.
 *
 * This decorator should only be used for public fields. As public fields,
 * properties should be considered as primarily settable by element users,
 * either via attribute or the property itself.
 *
 * Generally, properties that are changed by the element should be private or
 * protected fields and should use the {@linkcode state} decorator.
 *
 * However, sometimes element code does need to set a public property. This
 * should typically only be done in response to user interaction, and an event
 * should be fired informing the user; for example, a checkbox sets its
 * `checked` property when clicked and fires a `changed` event. Mutating public
 * properties should typically not be done for non-primitive (object or array)
 * properties. In other cases when an element needs to manage state, a private
 * property decorated via the {@linkcode state} decorator should be used. When
 * needed, state properties can be initialized via public properties to
 * facilitate complex interactions.
 *
 * ```ts
 * class MyElement {
 *   @property({ type: Boolean })
 *   clicked = false;
 * }
 * ```
 * @category Decorator
 * @ExportDecoratedItems
 */
function property(options) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (protoOrDescriptor, name) => name !== undefined ? legacyProperty(options, protoOrDescriptor, name) : standardProperty(options, protoOrDescriptor);
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/query-all.js":
/*!********************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/query-all.js ***!
  \********************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   queryAll: function() { return /* binding */ queryAll; }
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/@lit/reactive-element/development/decorators/base.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * A property decorator that converts a class property into a getter
 * that executes a querySelectorAll on the element's renderRoot.
 *
 * @param selector A DOMString containing one or more selectors to match.
 *
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
 *
 * ```ts
 * class MyElement {
 *   @queryAll('div')
 *   divs: NodeListOf<HTMLDivElement>;
 *
 *   render() {
 *     return html`
 *       <div id="first"></div>
 *       <div id="second"></div>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
function queryAll(selector) {
  return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.decorateProperty)({
    descriptor: _name => ({
      get() {
        var _a, _b;
        return (_b = (_a = this.renderRoot) === null || _a === void 0 ? void 0 : _a.querySelectorAll(selector)) !== null && _b !== void 0 ? _b : [];
      },
      enumerable: true,
      configurable: true
    })
  });
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/query-assigned-elements.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/query-assigned-elements.js ***!
  \**********************************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   queryAssignedElements: function() { return /* binding */ queryAssignedElements; }
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/@lit/reactive-element/development/decorators/base.js");
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var _a;
/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

const NODE_MODE = false;
const global = NODE_MODE ? globalThis : window;
/**
 * A tiny module scoped polyfill for HTMLSlotElement.assignedElements.
 */
const slotAssignedElements = ((_a = global.HTMLSlotElement) === null || _a === void 0 ? void 0 : _a.prototype.assignedElements) != null ? (slot, opts) => slot.assignedElements(opts) : (slot, opts) => slot.assignedNodes(opts).filter(node => node.nodeType === Node.ELEMENT_NODE);
/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedElements` of the given `slot`. Provides a declarative
 * way to use
 * [`HTMLSlotElement.assignedElements`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedElements).
 *
 * Can be passed an optional {@linkcode QueryAssignedElementsOptions} object.
 *
 * Example usage:
 * ```ts
 * class MyElement {
 *   @queryAssignedElements({ slot: 'list' })
 *   listItems!: Array<HTMLElement>;
 *   @queryAssignedElements()
 *   unnamedSlotEls!: Array<HTMLElement>;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *       <slot></slot>
 *     `;
 *   }
 * }
 * ```
 *
 * Note, the type of this property should be annotated as `Array<HTMLElement>`.
 *
 * @category Decorator
 */
function queryAssignedElements(options) {
  const {
    slot,
    selector
  } = options !== null && options !== void 0 ? options : {};
  return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.decorateProperty)({
    descriptor: _name => ({
      get() {
        var _a;
        const slotSelector = `slot${slot ? `[name=${slot}]` : ':not([name])'}`;
        const slotEl = (_a = this.renderRoot) === null || _a === void 0 ? void 0 : _a.querySelector(slotSelector);
        const elements = slotEl != null ? slotAssignedElements(slotEl, options) : [];
        if (selector) {
          return elements.filter(node => node.matches(selector));
        }
        return elements;
      },
      enumerable: true,
      configurable: true
    })
  });
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/query-assigned-nodes.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/query-assigned-nodes.js ***!
  \*******************************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   queryAssignedNodes: function() { return /* binding */ queryAssignedNodes; }
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/@lit/reactive-element/development/decorators/base.js");
/* harmony import */ var _query_assigned_elements_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./query-assigned-elements.js */ "./node_modules/@lit/reactive-element/development/decorators/query-assigned-elements.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */


function queryAssignedNodes(slotOrOptions, flatten, selector) {
  // Normalize the overloaded arguments.
  let slot = slotOrOptions;
  let assignedNodesOptions;
  if (typeof slotOrOptions === 'object') {
    slot = slotOrOptions.slot;
    assignedNodesOptions = slotOrOptions;
  } else {
    assignedNodesOptions = {
      flatten
    };
  }
  // For backwards compatibility, queryAssignedNodes with a selector behaves
  // exactly like queryAssignedElements with a selector.
  if (selector) {
    return (0,_query_assigned_elements_js__WEBPACK_IMPORTED_MODULE_1__.queryAssignedElements)({
      slot: slot,
      flatten,
      selector
    });
  }
  return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.decorateProperty)({
    descriptor: _name => ({
      get() {
        var _a, _b;
        const slotSelector = `slot${slot ? `[name=${slot}]` : ':not([name])'}`;
        const slotEl = (_a = this.renderRoot) === null || _a === void 0 ? void 0 : _a.querySelector(slotSelector);
        return (_b = slotEl === null || slotEl === void 0 ? void 0 : slotEl.assignedNodes(assignedNodesOptions)) !== null && _b !== void 0 ? _b : [];
      },
      enumerable: true,
      configurable: true
    })
  });
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/query-async.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/query-async.js ***!
  \**********************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   queryAsync: function() { return /* binding */ queryAsync; }
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/@lit/reactive-element/development/decorators/base.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Note, in the future, we may extend this decorator to support the use case
// where the queried element may need to do work to become ready to interact
// with (e.g. load some implementation code). If so, we might elect to
// add a second argument defining a function that can be run to make the
// queried element loaded/updated/ready.
/**
 * A property decorator that converts a class property into a getter that
 * returns a promise that resolves to the result of a querySelector on the
 * element's renderRoot done after the element's `updateComplete` promise
 * resolves. When the queried property may change with element state, this
 * decorator can be used instead of requiring users to await the
 * `updateComplete` before accessing the property.
 *
 * @param selector A DOMString containing one or more selectors to match.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
 *
 * ```ts
 * class MyElement {
 *   @queryAsync('#first')
 *   first: Promise<HTMLDivElement>;
 *
 *   render() {
 *     return html`
 *       <div id="first"></div>
 *       <div id="second"></div>
 *     `;
 *   }
 * }
 *
 * // external usage
 * async doSomethingWithFirst() {
 *  (await aMyElement.first).doSomething();
 * }
 * ```
 * @category Decorator
 */
function queryAsync(selector) {
  return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.decorateProperty)({
    descriptor: _name => ({
      async get() {
        var _a;
        await this.updateComplete;
        return (_a = this.renderRoot) === null || _a === void 0 ? void 0 : _a.querySelector(selector);
      },
      enumerable: true,
      configurable: true
    })
  });
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/query.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/query.js ***!
  \****************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   query: function() { return /* binding */ query; }
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/@lit/reactive-element/development/decorators/base.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * A property decorator that converts a class property into a getter that
 * executes a querySelector on the element's renderRoot.
 *
 * @param selector A DOMString containing one or more selectors to match.
 * @param cache An optional boolean which when true performs the DOM query only
 *     once and caches the result.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
 *
 * ```ts
 * class MyElement {
 *   @query('#first')
 *   first: HTMLDivElement;
 *
 *   render() {
 *     return html`
 *       <div id="first"></div>
 *       <div id="second"></div>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
function query(selector, cache) {
  return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.decorateProperty)({
    descriptor: name => {
      const descriptor = {
        get() {
          var _a, _b;
          return (_b = (_a = this.renderRoot) === null || _a === void 0 ? void 0 : _a.querySelector(selector)) !== null && _b !== void 0 ? _b : null;
        },
        enumerable: true,
        configurable: true
      };
      if (cache) {
        const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
        descriptor.get = function () {
          var _a, _b;
          if (this[key] === undefined) {
            this[key] = (_b = (_a = this.renderRoot) === null || _a === void 0 ? void 0 : _a.querySelector(selector)) !== null && _b !== void 0 ? _b : null;
          }
          return this[key];
        };
      }
      return descriptor;
    }
  });
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/decorators/state.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/decorators/state.js ***!
  \****************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   state: function() { return /* binding */ state; }
/* harmony export */ });
/* harmony import */ var _property_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./property.js */ "./node_modules/@lit/reactive-element/development/decorators/property.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

/**
 * Declares a private or protected reactive property that still triggers
 * updates to the element when it changes. It does not reflect from the
 * corresponding attribute.
 *
 * Properties declared this way must not be used from HTML or HTML templating
 * systems, they're solely for properties internal to the element. These
 * properties may be renamed by optimization tools like closure compiler.
 * @category Decorator
 */
function state(options) {
  return (0,_property_js__WEBPACK_IMPORTED_MODULE_0__.property)({
    ...options,
    state: true
  });
}

/***/ }),

/***/ "./node_modules/@lit/reactive-element/development/reactive-element.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@lit/reactive-element/development/reactive-element.js ***!
  \****************************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CSSResult: function() { return /* reexport safe */ _css_tag_js__WEBPACK_IMPORTED_MODULE_0__.CSSResult; },
/* harmony export */   ReactiveElement: function() { return /* binding */ ReactiveElement; },
/* harmony export */   adoptStyles: function() { return /* reexport safe */ _css_tag_js__WEBPACK_IMPORTED_MODULE_0__.adoptStyles; },
/* harmony export */   css: function() { return /* reexport safe */ _css_tag_js__WEBPACK_IMPORTED_MODULE_0__.css; },
/* harmony export */   defaultConverter: function() { return /* binding */ defaultConverter; },
/* harmony export */   getCompatibleStyle: function() { return /* reexport safe */ _css_tag_js__WEBPACK_IMPORTED_MODULE_0__.getCompatibleStyle; },
/* harmony export */   notEqual: function() { return /* binding */ notEqual; },
/* harmony export */   supportsAdoptingStyleSheets: function() { return /* reexport safe */ _css_tag_js__WEBPACK_IMPORTED_MODULE_0__.supportsAdoptingStyleSheets; },
/* harmony export */   unsafeCSS: function() { return /* reexport safe */ _css_tag_js__WEBPACK_IMPORTED_MODULE_0__.unsafeCSS; }
/* harmony export */ });
/* harmony import */ var _css_tag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./css-tag.js */ "./node_modules/@lit/reactive-element/development/css-tag.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var _a, _b, _c, _d;
var _e;
/**
 * Use this module if you want to create your own base class extending
 * {@link ReactiveElement}.
 * @packageDocumentation
 */

// In the Node build, this import will be injected by Rollup:
// import {HTMLElement, customElements} from '@lit-labs/ssr-dom-shim';

const NODE_MODE = false;
const global = NODE_MODE ? globalThis : window;
if (NODE_MODE) {
  (_a = global.customElements) !== null && _a !== void 0 ? _a : global.customElements = customElements;
}
const DEV_MODE = true;
let requestUpdateThenable;
let issueWarning;
const trustedTypes = global.trustedTypes;
// Temporary workaround for https://crbug.com/993268
// Currently, any attribute starting with "on" is considered to be a
// TrustedScript source. Such boolean attributes must be set to the equivalent
// trusted emptyScript value.
const emptyStringForBooleanAttribute = trustedTypes ? trustedTypes.emptyScript : '';
const polyfillSupport = DEV_MODE ? global.reactiveElementPolyfillSupportDevMode : global.reactiveElementPolyfillSupport;
if (DEV_MODE) {
  // Ensure warnings are issued only 1x, even if multiple versions of Lit
  // are loaded.
  const issuedWarnings = (_b = global.litIssuedWarnings) !== null && _b !== void 0 ? _b : global.litIssuedWarnings = new Set();
  // Issue a warning, if we haven't already.
  issueWarning = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
  issueWarning('dev-mode', `Lit is in dev mode. Not recommended for production!`);
  // Issue polyfill support warning.
  if (((_c = global.ShadyDOM) === null || _c === void 0 ? void 0 : _c.inUse) && polyfillSupport === undefined) {
    issueWarning('polyfill-support-missing', `Shadow DOM is being polyfilled via \`ShadyDOM\` but ` + `the \`polyfill-support\` module has not been loaded.`);
  }
  requestUpdateThenable = name => ({
    then: (onfulfilled, _onrejected) => {
      issueWarning('request-update-promise', `The \`requestUpdate\` method should no longer return a Promise but ` + `does so on \`${name}\`. Use \`updateComplete\` instead.`);
      if (onfulfilled !== undefined) {
        onfulfilled(false);
      }
    }
  });
}
/**
 * Useful for visualizing and logging insights into what the Lit template system is doing.
 *
 * Compiled out of prod mode builds.
 */
const debugLogEvent = DEV_MODE ? event => {
  const shouldEmit = global.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global.dispatchEvent(new CustomEvent('lit-debug', {
    detail: event
  }));
} : undefined;
/*
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
/*@__INLINE__*/
const JSCompiler_renameProperty = (prop, _obj) => prop;
const defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        value = value ? emptyStringForBooleanAttribute : null;
        break;
      case Object:
      case Array:
        // if the value is `null` or `undefined` pass this through
        // to allow removing/no change behavior.
        value = value == null ? value : JSON.stringify(value);
        break;
    }
    return value;
  },
  fromAttribute(value, type) {
    let fromValue = value;
    switch (type) {
      case Boolean:
        fromValue = value !== null;
        break;
      case Number:
        fromValue = value === null ? null : Number(value);
        break;
      case Object:
      case Array:
        // Do *not* generate exception when invalid JSON is set as elements
        // don't normally complain on being mis-configured.
        // TODO(sorvell): Do generate exception in *dev mode*.
        try {
          // Assert to adhere to Bazel's "must type assert JSON parse" rule.
          fromValue = JSON.parse(value);
        } catch (e) {
          fromValue = null;
        }
        break;
    }
    return fromValue;
  }
};
/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
const notEqual = (value, old) => {
  // This ensures (old==NaN, value==NaN) always returns false
  return old !== value && (old === old || value === value);
};
const defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
/**
 * The Closure JS Compiler doesn't currently have good support for static
 * property semantics where "this" is dynamic (e.g.
 * https://github.com/google/closure-compiler/issues/3177 and others) so we use
 * this hack to bypass any rewriting by the compiler.
 */
const finalized = 'finalized';
/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 * @noInheritDoc
 */
class ReactiveElement
// In the Node build, this `extends` clause will be substituted with
// `(globalThis.HTMLElement ?? HTMLElement)`.
//
// This way, we will first prefer any global `HTMLElement` polyfill that the
// user has assigned, and then fall back to the `HTMLElement` shim which has
// been imported (see note at the top of this file about how this import is
// generated by Rollup). Note that the `HTMLElement` variable has been
// shadowed by this import, so it no longer refers to the global.
extends HTMLElement {
  constructor() {
    super();
    this.__instanceProperties = new Map();
    /**
     * True if there is a pending update as a result of calling `requestUpdate()`.
     * Should only be read.
     * @category updates
     */
    this.isUpdatePending = false;
    /**
     * Is set to `true` after the first update. The element code cannot assume
     * that `renderRoot` exists before the element `hasUpdated`.
     * @category updates
     */
    this.hasUpdated = false;
    /**
     * Name of currently reflecting property
     */
    this.__reflectingProperty = null;
    this.__initialize();
  }
  /**
   * Adds an initializer function to the class that is called during instance
   * construction.
   *
   * This is useful for code that runs against a `ReactiveElement`
   * subclass, such as a decorator, that needs to do work for each
   * instance, such as setting up a `ReactiveController`.
   *
   * ```ts
   * const myDecorator = (target: typeof ReactiveElement, key: string) => {
   *   target.addInitializer((instance: ReactiveElement) => {
   *     // This is run during construction of the element
   *     new MyController(instance);
   *   });
   * }
   * ```
   *
   * Decorating a field will then cause each instance to run an initializer
   * that adds a controller:
   *
   * ```ts
   * class MyElement extends LitElement {
   *   @myDecorator foo;
   * }
   * ```
   *
   * Initializers are stored per-constructor. Adding an initializer to a
   * subclass does not add it to a superclass. Since initializers are run in
   * constructors, initializers will run in order of the class hierarchy,
   * starting with superclasses and progressing to the instance's class.
   *
   * @nocollapse
   */
  static addInitializer(initializer) {
    var _a;
    this.finalize();
    ((_a = this._initializers) !== null && _a !== void 0 ? _a : this._initializers = []).push(initializer);
  }
  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   * @category attributes
   */
  static get observedAttributes() {
    // note: piggy backing on this to ensure we're finalized.
    this.finalize();
    const attributes = [];
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    this.elementProperties.forEach((v, p) => {
      const attr = this.__attributeNameForProperty(p, v);
      if (attr !== undefined) {
        this.__attributeToPropertyMap.set(attr, p);
        attributes.push(attr);
      }
    });
    return attributes;
  }
  /**
   * Creates a property accessor on the element prototype if one does not exist
   * and stores a {@linkcode PropertyDeclaration} for the property with the
   * given options. The property setter calls the property's `hasChanged`
   * property option or uses a strict identity check to determine whether or not
   * to request an update.
   *
   * This method may be overridden to customize properties; however,
   * when doing so, it's important to call `super.createProperty` to ensure
   * the property is setup correctly. This method calls
   * `getPropertyDescriptor` internally to get a descriptor to install.
   * To customize what properties do when they are get or set, override
   * `getPropertyDescriptor`. To customize the options for a property,
   * implement `createProperty` like this:
   *
   * ```ts
   * static createProperty(name, options) {
   *   options = Object.assign(options, {myOption: true});
   *   super.createProperty(name, options);
   * }
   * ```
   *
   * @nocollapse
   * @category properties
   */
  static createProperty(name, options = defaultPropertyDeclaration) {
    var _a;
    // if this is a state property, force the attribute to false.
    if (options.state) {
      // Cast as any since this is readonly.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options.attribute = false;
    }
    // Note, since this can be called by the `@property` decorator which
    // is called before `finalize`, we ensure finalization has been kicked off.
    this.finalize();
    this.elementProperties.set(name, options);
    // Do not generate an accessor if the prototype already has one, since
    // it would be lost otherwise and that would never be the user's intention;
    // Instead, we expect users to call `requestUpdate` themselves from
    // user-defined accessors. Note that if the super has an accessor we will
    // still overwrite it
    if (!options.noAccessor && !this.prototype.hasOwnProperty(name)) {
      const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
      const descriptor = this.getPropertyDescriptor(name, key, options);
      if (descriptor !== undefined) {
        Object.defineProperty(this.prototype, name, descriptor);
        if (DEV_MODE) {
          // If this class doesn't have its own set, create one and initialize
          // with the values in the set from the nearest ancestor class, if any.
          if (!this.hasOwnProperty('__reactivePropertyKeys')) {
            this.__reactivePropertyKeys = new Set((_a = this.__reactivePropertyKeys) !== null && _a !== void 0 ? _a : []);
          }
          this.__reactivePropertyKeys.add(name);
        }
      }
    }
  }
  /**
   * Returns a property descriptor to be defined on the given named property.
   * If no descriptor is returned, the property will not become an accessor.
   * For example,
   *
   * ```ts
   * class MyElement extends LitElement {
   *   static getPropertyDescriptor(name, key, options) {
   *     const defaultDescriptor =
   *         super.getPropertyDescriptor(name, key, options);
   *     const setter = defaultDescriptor.set;
   *     return {
   *       get: defaultDescriptor.get,
   *       set(value) {
   *         setter.call(this, value);
   *         // custom action.
   *       },
   *       configurable: true,
   *       enumerable: true
   *     }
   *   }
   * }
   * ```
   *
   * @nocollapse
   * @category properties
   */
  static getPropertyDescriptor(name, key, options) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get() {
        return this[key];
      },
      set(value) {
        const oldValue = this[name];
        this[key] = value;
        this.requestUpdate(name, oldValue, options);
      },
      configurable: true,
      enumerable: true
    };
  }
  /**
   * Returns the property options associated with the given property.
   * These options are defined with a `PropertyDeclaration` via the `properties`
   * object or the `@property` decorator and are registered in
   * `createProperty(...)`.
   *
   * Note, this method should be considered "final" and not overridden. To
   * customize the options for a given property, override
   * {@linkcode createProperty}.
   *
   * @nocollapse
   * @final
   * @category properties
   */
  static getPropertyOptions(name) {
    return this.elementProperties.get(name) || defaultPropertyDeclaration;
  }
  /**
   * Creates property accessors for registered properties, sets up element
   * styling, and ensures any superclasses are also finalized. Returns true if
   * the element was finalized.
   * @nocollapse
   */
  static finalize() {
    if (this.hasOwnProperty(finalized)) {
      return false;
    }
    this[finalized] = true;
    // finalize any superclasses
    const superCtor = Object.getPrototypeOf(this);
    superCtor.finalize();
    // Create own set of initializers for this class if any exist on the
    // superclass and copy them down. Note, for a small perf boost, avoid
    // creating initializers unless needed.
    if (superCtor._initializers !== undefined) {
      this._initializers = [...superCtor._initializers];
    }
    this.elementProperties = new Map(superCtor.elementProperties);
    // initialize Map populated in observedAttributes
    this.__attributeToPropertyMap = new Map();
    // make any properties
    // Note, only process "own" properties since this element will inherit
    // any properties defined on the superClass, and finalization ensures
    // the entire prototype chain is finalized.
    if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
      const props = this.properties;
      // support symbols in properties (IE11 does not support this)
      const propKeys = [...Object.getOwnPropertyNames(props), ...Object.getOwnPropertySymbols(props)];
      // This for/of is ok because propKeys is an array
      for (const p of propKeys) {
        // note, use of `any` is due to TypeScript lack of support for symbol in
        // index types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.createProperty(p, props[p]);
      }
    }
    this.elementStyles = this.finalizeStyles(this.styles);
    // DEV mode warnings
    if (DEV_MODE) {
      const warnRemovedOrRenamed = (name, renamed = false) => {
        if (this.prototype.hasOwnProperty(name)) {
          issueWarning(renamed ? 'renamed-api' : 'removed-api', `\`${name}\` is implemented on class ${this.name}. It ` + `has been ${renamed ? 'renamed' : 'removed'} ` + `in this version of LitElement.`);
        }
      };
      warnRemovedOrRenamed('initialize');
      warnRemovedOrRenamed('requestUpdateInternal');
      warnRemovedOrRenamed('_getUpdateComplete', true);
    }
    return true;
  }
  /**
   * Takes the styles the user supplied via the `static styles` property and
   * returns the array of styles to apply to the element.
   * Override this method to integrate into a style management system.
   *
   * Styles are deduplicated preserving the _last_ instance in the list. This
   * is a performance optimization to avoid duplicated styles that can occur
   * especially when composing via subclassing. The last item is kept to try
   * to preserve the cascade order with the assumption that it's most important
   * that last added styles override previous styles.
   *
   * @nocollapse
   * @category styles
   */
  static finalizeStyles(styles) {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      // Dedupe the flattened array in reverse order to preserve the last items.
      // Casting to Array<unknown> works around TS error that
      // appears to come from trying to flatten a type CSSResultArray.
      const set = new Set(styles.flat(Infinity).reverse());
      // Then preserve original order by adding the set items in reverse order.
      for (const s of set) {
        elementStyles.unshift((0,_css_tag_js__WEBPACK_IMPORTED_MODULE_0__.getCompatibleStyle)(s));
      }
    } else if (styles !== undefined) {
      elementStyles.push((0,_css_tag_js__WEBPACK_IMPORTED_MODULE_0__.getCompatibleStyle)(styles));
    }
    return elementStyles;
  }
  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */
  static __attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? undefined : typeof attribute === 'string' ? attribute : typeof name === 'string' ? name.toLowerCase() : undefined;
  }
  /**
   * Internal only override point for customizing work done when elements
   * are constructed.
   */
  __initialize() {
    var _a;
    this.__updatePromise = new Promise(res => this.enableUpdating = res);
    this._$changedProperties = new Map();
    this.__saveInstanceProperties();
    // ensures first update will be caught by an early access of
    // `updateComplete`
    this.requestUpdate();
    (_a = this.constructor._initializers) === null || _a === void 0 ? void 0 : _a.forEach(i => i(this));
  }
  /**
   * Registers a `ReactiveController` to participate in the element's reactive
   * update cycle. The element automatically calls into any registered
   * controllers during its lifecycle callbacks.
   *
   * If the element is connected when `addController()` is called, the
   * controller's `hostConnected()` callback will be immediately called.
   * @category controllers
   */
  addController(controller) {
    var _a, _b;
    ((_a = this.__controllers) !== null && _a !== void 0 ? _a : this.__controllers = []).push(controller);
    // If a controller is added after the element has been connected,
    // call hostConnected. Note, re-using existence of `renderRoot` here
    // (which is set in connectedCallback) to avoid the need to track a
    // first connected state.
    if (this.renderRoot !== undefined && this.isConnected) {
      (_b = controller.hostConnected) === null || _b === void 0 ? void 0 : _b.call(controller);
    }
  }
  /**
   * Removes a `ReactiveController` from the element.
   * @category controllers
   */
  removeController(controller) {
    var _a;
    // Note, if the indexOf is -1, the >>> will flip the sign which makes the
    // splice do nothing.
    (_a = this.__controllers) === null || _a === void 0 ? void 0 : _a.splice(this.__controllers.indexOf(controller) >>> 0, 1);
  }
  /**
   * Fixes any properties set on the instance before upgrade time.
   * Otherwise these would shadow the accessor and break these properties.
   * The properties are stored in a Map which is played back after the
   * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
   * (<=41), properties created for native platform properties like (`id` or
   * `name`) may not have default values set in the element constructor. On
   * these browsers native properties appear on instances and therefore their
   * default value will overwrite any element default (e.g. if the element sets
   * this.id = 'id' in the constructor, the 'id' will become '' since this is
   * the native platform default).
   */
  __saveInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    this.constructor.elementProperties.forEach((_v, p) => {
      if (this.hasOwnProperty(p)) {
        this.__instanceProperties.set(p, this[p]);
        delete this[p];
      }
    });
  }
  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   *
   * @return Returns a node into which to render.
   * @category rendering
   */
  createRenderRoot() {
    var _a;
    const renderRoot = (_a = this.shadowRoot) !== null && _a !== void 0 ? _a : this.attachShadow(this.constructor.shadowRootOptions);
    (0,_css_tag_js__WEBPACK_IMPORTED_MODULE_0__.adoptStyles)(renderRoot, this.constructor.elementStyles);
    return renderRoot;
  }
  /**
   * On first connection, creates the element's renderRoot, sets up
   * element styling, and enables updating.
   * @category lifecycle
   */
  connectedCallback() {
    var _a;
    // create renderRoot before first update.
    if (this.renderRoot === undefined) {
      this.renderRoot = this.createRenderRoot();
    }
    this.enableUpdating(true);
    (_a = this.__controllers) === null || _a === void 0 ? void 0 : _a.forEach(c => {
      var _a;
      return (_a = c.hostConnected) === null || _a === void 0 ? void 0 : _a.call(c);
    });
  }
  /**
   * Note, this method should be considered final and not overridden. It is
   * overridden on the element instance with a function that triggers the first
   * update.
   * @category updates
   */
  enableUpdating(_requestedUpdate) {}
  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   * @category lifecycle
   */
  disconnectedCallback() {
    var _a;
    (_a = this.__controllers) === null || _a === void 0 ? void 0 : _a.forEach(c => {
      var _a;
      return (_a = c.hostDisconnected) === null || _a === void 0 ? void 0 : _a.call(c);
    });
  }
  /**
   * Synchronizes property values when attributes change.
   *
   * Specifically, when an attribute is set, the corresponding property is set.
   * You should rarely need to implement this callback. If this method is
   * overridden, `super.attributeChangedCallback(name, _old, value)` must be
   * called.
   *
   * See [using the lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)
   * on MDN for more information about the `attributeChangedCallback`.
   * @category attributes
   */
  attributeChangedCallback(name, _old, value) {
    this._$attributeToProperty(name, value);
  }
  __propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
    var _a;
    const attr = this.constructor.__attributeNameForProperty(name, options);
    if (attr !== undefined && options.reflect === true) {
      const converter = ((_a = options.converter) === null || _a === void 0 ? void 0 : _a.toAttribute) !== undefined ? options.converter : defaultConverter;
      const attrValue = converter.toAttribute(value, options.type);
      if (DEV_MODE && this.constructor.enabledWarnings.indexOf('migration') >= 0 && attrValue === undefined) {
        issueWarning('undefined-attribute-value', `The attribute value for the ${name} property is ` + `undefined on element ${this.localName}. The attribute will be ` + `removed, but in the previous version of \`ReactiveElement\`, ` + `the attribute would not have changed.`);
      }
      // Track if the property is being reflected to avoid
      // setting the property again via `attributeChangedCallback`. Note:
      // 1. this takes advantage of the fact that the callback is synchronous.
      // 2. will behave incorrectly if multiple attributes are in the reaction
      // stack at time of calling. However, since we process attributes
      // in `update` this should not be possible (or an extreme corner case
      // that we'd like to discover).
      // mark state reflecting
      this.__reflectingProperty = name;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      }
      // mark state not reflecting
      this.__reflectingProperty = null;
    }
  }
  /** @internal */
  _$attributeToProperty(name, value) {
    var _a;
    const ctor = this.constructor;
    // Note, hint this as an `AttributeMap` so closure clearly understands
    // the type; it has issues with tracking types through statics
    const propName = ctor.__attributeToPropertyMap.get(name);
    // Use tracking info to avoid reflecting a property value to an attribute
    // if it was just set because the attribute changed.
    if (propName !== undefined && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName);
      const converter = typeof options.converter === 'function' ? {
        fromAttribute: options.converter
      } : ((_a = options.converter) === null || _a === void 0 ? void 0 : _a.fromAttribute) !== undefined ? options.converter : defaultConverter;
      // mark state reflecting
      this.__reflectingProperty = propName;
      this[propName] = converter.fromAttribute(value, options.type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      );
      // mark state not reflecting
      this.__reflectingProperty = null;
    }
  }
  /**
   * Requests an update which is processed asynchronously. This should be called
   * when an element should update based on some state not triggered by setting
   * a reactive property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored.
   *
   * @param name name of requesting property
   * @param oldValue old value of requesting property
   * @param options property options to use instead of the previously
   *     configured options
   * @category updates
   */
  requestUpdate(name, oldValue, options) {
    let shouldRequestUpdate = true;
    // If we have a property key, perform property update steps.
    if (name !== undefined) {
      options = options || this.constructor.getPropertyOptions(name);
      const hasChanged = options.hasChanged || notEqual;
      if (hasChanged(this[name], oldValue)) {
        if (!this._$changedProperties.has(name)) {
          this._$changedProperties.set(name, oldValue);
        }
        // Add to reflecting properties set.
        // Note, it's important that every change has a chance to add the
        // property to `_reflectingProperties`. This ensures setting
        // attribute + property reflects correctly.
        if (options.reflect === true && this.__reflectingProperty !== name) {
          if (this.__reflectingProperties === undefined) {
            this.__reflectingProperties = new Map();
          }
          this.__reflectingProperties.set(name, options);
        }
      } else {
        // Abort the request if the property should not be considered changed.
        shouldRequestUpdate = false;
      }
    }
    if (!this.isUpdatePending && shouldRequestUpdate) {
      this.__updatePromise = this.__enqueueUpdate();
    }
    // Note, since this no longer returns a promise, in dev mode we return a
    // thenable which warns if it's called.
    return DEV_MODE ? requestUpdateThenable(this.localName) : undefined;
  }
  /**
   * Sets up the element to asynchronously update.
   */
  async __enqueueUpdate() {
    this.isUpdatePending = true;
    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await this.__updatePromise;
    } catch (e) {
      // Refire any previous errors async so they do not disrupt the update
      // cycle. Errors are refired so developers have a chance to observe
      // them, and this can be done by implementing
      // `window.onunhandledrejection`.
      Promise.reject(e);
    }
    const result = this.scheduleUpdate();
    // If `scheduleUpdate` returns a Promise, we await it. This is done to
    // enable coordinating updates with a scheduler. Note, the result is
    // checked to avoid delaying an additional microtask unless we need to.
    if (result != null) {
      await result;
    }
    return !this.isUpdatePending;
  }
  /**
   * Schedules an element update. You can override this method to change the
   * timing of updates by returning a Promise. The update will await the
   * returned Promise, and you should resolve the Promise to allow the update
   * to proceed. If this method is overridden, `super.scheduleUpdate()`
   * must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```ts
   * override protected async scheduleUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.scheduleUpdate();
   * }
   * ```
   * @category updates
   */
  scheduleUpdate() {
    return this.performUpdate();
  }
  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * Call `performUpdate()` to immediately process a pending update. This should
   * generally not be needed, but it can be done in rare cases when you need to
   * update synchronously.
   *
   * Note: To ensure `performUpdate()` synchronously completes a pending update,
   * it should not be overridden. In LitElement 2.x it was suggested to override
   * `performUpdate()` to also customizing update scheduling. Instead, you should now
   * override `scheduleUpdate()`. For backwards compatibility with LitElement 2.x,
   * scheduling updates via `performUpdate()` continues to work, but will make
   * also calling `performUpdate()` to synchronously process updates difficult.
   *
   * @category updates
   */
  performUpdate() {
    var _a, _b;
    // Abort any update if one is not pending when this is called.
    // This can happen if `performUpdate` is called early to "flush"
    // the update.
    if (!this.isUpdatePending) {
      return;
    }
    debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
      kind: 'update'
    });
    // create renderRoot before first update.
    if (!this.hasUpdated) {
      // Produce warning if any class properties are shadowed by class fields
      if (DEV_MODE) {
        const shadowedProperties = [];
        (_a = this.constructor.__reactivePropertyKeys) === null || _a === void 0 ? void 0 : _a.forEach(p => {
          var _a;
          if (this.hasOwnProperty(p) && !((_a = this.__instanceProperties) === null || _a === void 0 ? void 0 : _a.has(p))) {
            shadowedProperties.push(p);
          }
        });
        if (shadowedProperties.length) {
          throw new Error(`The following properties on element ${this.localName} will not ` + `trigger updates as expected because they are set using class ` + `fields: ${shadowedProperties.join(', ')}. ` + `Native class fields and some compiled output will overwrite ` + `accessors used for detecting changes. See ` + `https://lit.dev/msg/class-field-shadowing ` + `for more information.`);
        }
      }
    }
    // Mixin instance properties once, if they exist.
    if (this.__instanceProperties) {
      // Use forEach so this works even if for/of loops are compiled to for loops
      // expecting arrays
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.__instanceProperties.forEach((v, p) => this[p] = v);
      this.__instanceProperties = undefined;
    }
    let shouldUpdate = false;
    const changedProperties = this._$changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.willUpdate(changedProperties);
        (_b = this.__controllers) === null || _b === void 0 ? void 0 : _b.forEach(c => {
          var _a;
          return (_a = c.hostUpdate) === null || _a === void 0 ? void 0 : _a.call(c);
        });
        this.update(changedProperties);
      } else {
        this.__markUpdated();
      }
    } catch (e) {
      // Prevent `firstUpdated` and `updated` from running when there's an
      // update exception.
      shouldUpdate = false;
      // Ensure element can accept additional updates after an exception.
      this.__markUpdated();
      throw e;
    }
    // The update is no longer considered pending and further updates are now allowed.
    if (shouldUpdate) {
      this._$didUpdate(changedProperties);
    }
  }
  /**
   * Invoked before `update()` to compute values needed during the update.
   *
   * Implement `willUpdate` to compute property values that depend on other
   * properties and are used in the rest of the update process.
   *
   * ```ts
   * willUpdate(changedProperties) {
   *   // only need to check changed properties for an expensive computation.
   *   if (changedProperties.has('firstName') || changedProperties.has('lastName')) {
   *     this.sha = computeSHA(`${this.firstName} ${this.lastName}`);
   *   }
   * }
   *
   * render() {
   *   return html`SHA: ${this.sha}`;
   * }
   * ```
   *
   * @category updates
   */
  willUpdate(_changedProperties) {}
  // Note, this is an override point for polyfill-support.
  // @internal
  _$didUpdate(changedProperties) {
    var _a;
    (_a = this.__controllers) === null || _a === void 0 ? void 0 : _a.forEach(c => {
      var _a;
      return (_a = c.hostUpdated) === null || _a === void 0 ? void 0 : _a.call(c);
    });
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changedProperties);
    }
    this.updated(changedProperties);
    if (DEV_MODE && this.isUpdatePending && this.constructor.enabledWarnings.indexOf('change-in-update') >= 0) {
      issueWarning('change-in-update', `Element ${this.localName} scheduled an update ` + `(generally because a property was set) ` + `after an update completed, causing a new update to be scheduled. ` + `This is inefficient and should be avoided unless the next update ` + `can only be scheduled as a side effect of the previous update.`);
    }
  }
  __markUpdated() {
    this._$changedProperties = new Map();
    this.isUpdatePending = false;
  }
  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * To await additional asynchronous work, override the `getUpdateComplete`
   * method. For example, it is sometimes useful to await a rendered element
   * before fulfilling this Promise. To do this, first await
   * `super.getUpdateComplete()`, then any subsequent state.
   *
   * @return A promise of a boolean that resolves to true if the update completed
   *     without triggering another update.
   * @category updates
   */
  get updateComplete() {
    return this.getUpdateComplete();
  }
  /**
   * Override point for the `updateComplete` promise.
   *
   * It is not safe to override the `updateComplete` getter directly due to a
   * limitation in TypeScript which means it is not possible to call a
   * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
   * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
   * This method should be overridden instead. For example:
   *
   * ```ts
   * class MyElement extends LitElement {
   *   override async getUpdateComplete() {
   *     const result = await super.getUpdateComplete();
   *     await this._myChild.updateComplete;
   *     return result;
   *   }
   * }
   * ```
   *
   * @return A promise of a boolean that resolves to true if the update completed
   *     without triggering another update.
   * @category updates
   */
  getUpdateComplete() {
    return this.__updatePromise;
  }
  /**
   * Controls whether or not `update()` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  shouldUpdate(_changedProperties) {
    return true;
  }
  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  update(_changedProperties) {
    if (this.__reflectingProperties !== undefined) {
      // Use forEach so this works even if for/of loops are compiled to for
      // loops expecting arrays
      this.__reflectingProperties.forEach((v, k) => this.__propertyToAttribute(k, this[k], v));
      this.__reflectingProperties = undefined;
    }
    this.__markUpdated();
  }
  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  updated(_changedProperties) {}
  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * ```ts
   * firstUpdated() {
   *   this.renderRoot.getElementById('my-text-area').focus();
   * }
   * ```
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  firstUpdated(_changedProperties) {}
}
_e = finalized;
/**
 * Marks class as having finished creating properties.
 */
ReactiveElement[_e] = true;
/**
 * Memoized list of all element properties, including any superclass properties.
 * Created lazily on user subclasses when finalizing the class.
 * @nocollapse
 * @category properties
 */
ReactiveElement.elementProperties = new Map();
/**
 * Memoized list of all element styles.
 * Created lazily on user subclasses when finalizing the class.
 * @nocollapse
 * @category styles
 */
ReactiveElement.elementStyles = [];
/**
 * Options used when calling `attachShadow`. Set this property to customize
 * the options for the shadowRoot; for example, to create a closed
 * shadowRoot: `{mode: 'closed'}`.
 *
 * Note, these options are used in `createRenderRoot`. If this method
 * is customized, options should be respected if possible.
 * @nocollapse
 * @category rendering
 */
ReactiveElement.shadowRootOptions = {
  mode: 'open'
};
// Apply polyfills if available
polyfillSupport === null || polyfillSupport === void 0 ? void 0 : polyfillSupport({
  ReactiveElement
});
// Dev mode warnings...
if (DEV_MODE) {
  // Default warning set.
  ReactiveElement.enabledWarnings = ['change-in-update'];
  const ensureOwnWarnings = function (ctor) {
    if (!ctor.hasOwnProperty(JSCompiler_renameProperty('enabledWarnings', ctor))) {
      ctor.enabledWarnings = ctor.enabledWarnings.slice();
    }
  };
  ReactiveElement.enableWarning = function (warning) {
    ensureOwnWarnings(this);
    if (this.enabledWarnings.indexOf(warning) < 0) {
      this.enabledWarnings.push(warning);
    }
  };
  ReactiveElement.disableWarning = function (warning) {
    ensureOwnWarnings(this);
    const i = this.enabledWarnings.indexOf(warning);
    if (i >= 0) {
      this.enabledWarnings.splice(i, 1);
    }
  };
}
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for ReactiveElement usage.
((_d = global.reactiveElementVersions) !== null && _d !== void 0 ? _d : global.reactiveElementVersions = []).push('1.6.3');
if (DEV_MODE && global.reactiveElementVersions.length > 1) {
  issueWarning('multiple-versions', `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
}

/***/ }),

/***/ "./node_modules/lit-element/development/lit-element.js":
/*!*************************************************************!*\
  !*** ./node_modules/lit-element/development/lit-element.js ***!
  \*************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CSSResult: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.CSSResult; },
/* harmony export */   LitElement: function() { return /* binding */ LitElement; },
/* harmony export */   ReactiveElement: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.ReactiveElement; },
/* harmony export */   UpdatingElement: function() { return /* binding */ UpdatingElement; },
/* harmony export */   _$LE: function() { return /* binding */ _$LE; },
/* harmony export */   _$LH: function() { return /* reexport safe */ lit_html__WEBPACK_IMPORTED_MODULE_1__._$LH; },
/* harmony export */   adoptStyles: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.adoptStyles; },
/* harmony export */   css: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.css; },
/* harmony export */   defaultConverter: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.defaultConverter; },
/* harmony export */   getCompatibleStyle: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.getCompatibleStyle; },
/* harmony export */   html: function() { return /* reexport safe */ lit_html__WEBPACK_IMPORTED_MODULE_1__.html; },
/* harmony export */   noChange: function() { return /* reexport safe */ lit_html__WEBPACK_IMPORTED_MODULE_1__.noChange; },
/* harmony export */   notEqual: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.notEqual; },
/* harmony export */   nothing: function() { return /* reexport safe */ lit_html__WEBPACK_IMPORTED_MODULE_1__.nothing; },
/* harmony export */   render: function() { return /* reexport safe */ lit_html__WEBPACK_IMPORTED_MODULE_1__.render; },
/* harmony export */   supportsAdoptingStyleSheets: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.supportsAdoptingStyleSheets; },
/* harmony export */   svg: function() { return /* reexport safe */ lit_html__WEBPACK_IMPORTED_MODULE_1__.svg; },
/* harmony export */   unsafeCSS: function() { return /* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.unsafeCSS; }
/* harmony export */ });
/* harmony import */ var _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lit/reactive-element */ "./node_modules/@lit/reactive-element/development/reactive-element.js");
/* harmony import */ var lit_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lit-html */ "./node_modules/lit-html/development/lit-html.js");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var _a, _b, _c;
/**
 * The main LitElement module, which defines the {@linkcode LitElement} base
 * class and related APIs.
 *
 *  LitElement components can define a template and a set of observed
 * properties. Changing an observed property triggers a re-render of the
 * element.
 *
 *  Import {@linkcode LitElement} and {@linkcode html} from this module to
 * create a component:
 *
 *  ```js
 * import {LitElement, html} from 'lit-element';
 *
 * class MyElement extends LitElement {
 *
 *   // Declare observed properties
 *   static get properties() {
 *     return {
 *       adjective: {}
 *     }
 *   }
 *
 *   constructor() {
 *     this.adjective = 'awesome';
 *   }
 *
 *   // Define the element's template
 *   render() {
 *     return html`<p>your ${adjective} template here</p>`;
 *   }
 * }
 *
 * customElements.define('my-element', MyElement);
 * ```
 *
 * `LitElement` extends {@linkcode ReactiveElement} and adds lit-html
 * templating. The `ReactiveElement` class is provided for users that want to
 * build their own custom element base classes that don't use lit-html.
 *
 * @packageDocumentation
 */




// For backwards compatibility export ReactiveElement as UpdatingElement. Note,
// IE transpilation requires exporting like this.
const UpdatingElement = _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.ReactiveElement;
const DEV_MODE = true;
let issueWarning;
if (DEV_MODE) {
  // Ensure warnings are issued only 1x, even if multiple versions of Lit
  // are loaded.
  const issuedWarnings = (_a = globalThis.litIssuedWarnings) !== null && _a !== void 0 ? _a : globalThis.litIssuedWarnings = new Set();
  // Issue a warning, if we haven't already.
  issueWarning = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
}
/**
 * Base element class that manages element properties and attributes, and
 * renders a lit-html template.
 *
 * To define a component, subclass `LitElement` and implement a
 * `render` method to provide the component's template. Define properties
 * using the {@linkcode LitElement.properties properties} property or the
 * {@linkcode property} decorator.
 */
class LitElement extends _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.ReactiveElement {
  constructor() {
    super(...arguments);
    /**
     * @category rendering
     */
    this.renderOptions = {
      host: this
    };
    this.__childPart = undefined;
  }
  /**
   * @category rendering
   */
  createRenderRoot() {
    var _a;
    var _b;
    const renderRoot = super.createRenderRoot();
    // When adoptedStyleSheets are shimmed, they are inserted into the
    // shadowRoot by createRenderRoot. Adjust the renderBefore node so that
    // any styles in Lit content render before adoptedStyleSheets. This is
    // important so that adoptedStyleSheets have precedence over styles in
    // the shadowRoot.
    (_a = (_b = this.renderOptions).renderBefore) !== null && _a !== void 0 ? _a : _b.renderBefore = renderRoot.firstChild;
    return renderRoot;
  }
  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * @param changedProperties Map of changed properties with old values
   * @category updates
   */
  update(changedProperties) {
    // Setting properties in `render` should not trigger an update. Since
    // updates are allowed after super.update, it's important to call `render`
    // before that.
    const value = this.render();
    if (!this.hasUpdated) {
      this.renderOptions.isConnected = this.isConnected;
    }
    super.update(changedProperties);
    this.__childPart = (0,lit_html__WEBPACK_IMPORTED_MODULE_1__.render)(value, this.renderRoot, this.renderOptions);
  }
  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   *
   * ```ts
   * connectedCallback() {
   *   super.connectedCallback();
   *   addEventListener('keydown', this._handleKeydown);
   * }
   * ```
   *
   * Typically, anything done in `connectedCallback()` should be undone when the
   * element is disconnected, in `disconnectedCallback()`.
   *
   * @category lifecycle
   */
  connectedCallback() {
    var _a;
    super.connectedCallback();
    (_a = this.__childPart) === null || _a === void 0 ? void 0 : _a.setConnected(true);
  }
  /**
   * Invoked when the component is removed from the document's DOM.
   *
   * This callback is the main signal to the element that it may no longer be
   * used. `disconnectedCallback()` should ensure that nothing is holding a
   * reference to the element (such as event listeners added to nodes external
   * to the element), so that it is free to be garbage collected.
   *
   * ```ts
   * disconnectedCallback() {
   *   super.disconnectedCallback();
   *   window.removeEventListener('keydown', this._handleKeydown);
   * }
   * ```
   *
   * An element may be re-connected after being disconnected.
   *
   * @category lifecycle
   */
  disconnectedCallback() {
    var _a;
    super.disconnectedCallback();
    (_a = this.__childPart) === null || _a === void 0 ? void 0 : _a.setConnected(false);
  }
  /**
   * Invoked on each update to perform rendering tasks. This method may return
   * any value renderable by lit-html's `ChildPart` - typically a
   * `TemplateResult`. Setting properties inside this method will *not* trigger
   * the element to update.
   * @category rendering
   */
  render() {
    return lit_html__WEBPACK_IMPORTED_MODULE_1__.noChange;
  }
}
/**
 * Ensure this class is marked as `finalized` as an optimization ensuring
 * it will not needlessly try to `finalize`.
 *
 * Note this property name is a string to prevent breaking Closure JS Compiler
 * optimizations. See @lit/reactive-element for more information.
 */
LitElement['finalized'] = true;
// This property needs to remain unminified.
LitElement['_$litElement$'] = true;
// Install hydration if available
(_b = globalThis.litElementHydrateSupport) === null || _b === void 0 ? void 0 : _b.call(globalThis, {
  LitElement
});
// Apply polyfills if available
const polyfillSupport = DEV_MODE ? globalThis.litElementPolyfillSupportDevMode : globalThis.litElementPolyfillSupport;
polyfillSupport === null || polyfillSupport === void 0 ? void 0 : polyfillSupport({
  LitElement
});
// DEV mode warnings
if (DEV_MODE) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  // Note, for compatibility with closure compilation, this access
  // needs to be as a string property index.
  LitElement['finalize'] = function () {
    const finalized = _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.ReactiveElement.finalize.call(this);
    if (!finalized) {
      return false;
    }
    const warnRemovedOrRenamed = (obj, name, renamed = false) => {
      if (obj.hasOwnProperty(name)) {
        const ctorName = (typeof obj === 'function' ? obj : obj.constructor).name;
        issueWarning(renamed ? 'renamed-api' : 'removed-api', `\`${name}\` is implemented on class ${ctorName}. It ` + `has been ${renamed ? 'renamed' : 'removed'} ` + `in this version of LitElement.`);
      }
    };
    warnRemovedOrRenamed(this, 'render');
    warnRemovedOrRenamed(this, 'getStyles', true);
    warnRemovedOrRenamed(this.prototype, 'adoptStyles');
    return true;
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * Private exports for use by other Lit packages, not intended for use by
 * external users.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports  mangled in the
 * client side code, we export a _$LE object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 *
 * This has a unique name, to disambiguate it from private exports in
 * lit-html, since this module re-exports all of lit-html.
 *
 * @private
 */
const _$LE = {
  _$attributeToProperty: (el, name, value) => {
    // eslint-disable-next-line
    el._$attributeToProperty(name, value);
  },
  // eslint-disable-next-line
  _$changedProperties: el => el._$changedProperties
};
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
((_c = globalThis.litElementVersions) !== null && _c !== void 0 ? _c : globalThis.litElementVersions = []).push('3.3.3');
if (DEV_MODE && globalThis.litElementVersions.length > 1) {
  issueWarning('multiple-versions', `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
}

/***/ }),

/***/ "./node_modules/lit-html/development/directive.js":
/*!********************************************************!*\
  !*** ./node_modules/lit-html/development/directive.js ***!
  \********************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Directive: function() { return /* binding */ Directive; },
/* harmony export */   PartType: function() { return /* binding */ PartType; },
/* harmony export */   directive: function() { return /* binding */ directive; }
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const PartType = {
  ATTRIBUTE: 1,
  CHILD: 2,
  PROPERTY: 3,
  BOOLEAN_ATTRIBUTE: 4,
  EVENT: 5,
  ELEMENT: 6
};
/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 */
const directive = c => (...values) => ({
  // This property needs to remain unminified.
  ['_$litDirective$']: c,
  values
});
/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
class Directive {
  constructor(_partInfo) {}
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  /** @internal */
  _$initialize(part, parent, attributeIndex) {
    this.__part = part;
    this._$parent = parent;
    this.__attributeIndex = attributeIndex;
  }
  /** @internal */
  _$resolve(part, props) {
    return this.update(part, props);
  }
  update(_part, props) {
    return this.render(...props);
  }
}

/***/ }),

/***/ "./node_modules/lit-html/development/directives/style-map.js":
/*!*******************************************************************!*\
  !*** ./node_modules/lit-html/development/directives/style-map.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   styleMap: function() { return /* binding */ styleMap; }
/* harmony export */ });
/* harmony import */ var _lit_html_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lit-html.js */ "./node_modules/lit-html/development/lit-html.js");
/* harmony import */ var _directive_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../directive.js */ "./node_modules/lit-html/development/directive.js");
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */


const important = 'important';
// The leading space is important
const importantFlag = ' !' + important;
// How many characters to remove from a value, as a negative number
const flagTrim = 0 - importantFlag.length;
class StyleMapDirective extends _directive_js__WEBPACK_IMPORTED_MODULE_1__.Directive {
  constructor(partInfo) {
    var _a;
    super(partInfo);
    if (partInfo.type !== _directive_js__WEBPACK_IMPORTED_MODULE_1__.PartType.ATTRIBUTE || partInfo.name !== 'style' || ((_a = partInfo.strings) === null || _a === void 0 ? void 0 : _a.length) > 2) {
      throw new Error('The `styleMap` directive must be used in the `style` attribute ' + 'and must be the only part in the attribute.');
    }
  }
  render(styleInfo) {
    return Object.keys(styleInfo).reduce((style, prop) => {
      const value = styleInfo[prop];
      if (value == null) {
        return style;
      }
      // Convert property names from camel-case to dash-case, i.e.:
      //  `backgroundColor` -> `background-color`
      // Vendor-prefixed names need an extra `-` appended to front:
      //  `webkitAppearance` -> `-webkit-appearance`
      // Exception is any property name containing a dash, including
      // custom properties; we assume these are already dash-cased i.e.:
      //  `--my-button-color` --> `--my-button-color`
      prop = prop.includes('-') ? prop : prop.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, '-$&').toLowerCase();
      return style + `${prop}:${value};`;
    }, '');
  }
  update(part, [styleInfo]) {
    const {
      style
    } = part.element;
    if (this._previousStyleProperties === undefined) {
      this._previousStyleProperties = new Set();
      for (const name in styleInfo) {
        this._previousStyleProperties.add(name);
      }
      return this.render(styleInfo);
    }
    // Remove old properties that no longer exist in styleInfo
    // We use forEach() instead of for-of so that re don't require down-level
    // iteration.
    this._previousStyleProperties.forEach(name => {
      // If the name isn't in styleInfo or it's null/undefined
      if (styleInfo[name] == null) {
        this._previousStyleProperties.delete(name);
        if (name.includes('-')) {
          style.removeProperty(name);
        } else {
          // Note reset using empty string (vs null) as IE11 does not always
          // reset via null (https://developer.mozilla.org/en-US/docs/Web/API/ElementCSSInlineStyle/style#setting_styles)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style[name] = '';
        }
      }
    });
    // Add or update properties
    for (const name in styleInfo) {
      const value = styleInfo[name];
      if (value != null) {
        this._previousStyleProperties.add(name);
        const isImportant = typeof value === 'string' && value.endsWith(importantFlag);
        if (name.includes('-') || isImportant) {
          style.setProperty(name, isImportant ? value.slice(0, flagTrim) : value, isImportant ? important : '');
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style[name] = value;
        }
      }
    }
    return _lit_html_js__WEBPACK_IMPORTED_MODULE_0__.noChange;
  }
}
/**
 * A directive that applies CSS properties to an element.
 *
 * `styleMap` can only be used in the `style` attribute and must be the only
 * expression in the attribute. It takes the property names in the
 * {@link StyleInfo styleInfo} object and adds the properties to the inline
 * style of the element.
 *
 * Property names with dashes (`-`) are assumed to be valid CSS
 * property names and set on the element's style object using `setProperty()`.
 * Names without dashes are assumed to be camelCased JavaScript property names
 * and set on the element's style object using property assignment, allowing the
 * style object to translate JavaScript-style names to CSS property names.
 *
 * For example `styleMap({backgroundColor: 'red', 'border-top': '5px', '--size':
 * '0'})` sets the `background-color`, `border-top` and `--size` properties.
 *
 * @param styleInfo
 * @see {@link https://lit.dev/docs/templates/directives/#stylemap styleMap code samples on Lit.dev}
 */
const styleMap = (0,_directive_js__WEBPACK_IMPORTED_MODULE_1__.directive)(StyleMapDirective);

/***/ }),

/***/ "./node_modules/lit-html/development/is-server.js":
/*!********************************************************!*\
  !*** ./node_modules/lit-html/development/is-server.js ***!
  \********************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isServer: function() { return /* binding */ isServer; }
/* harmony export */ });
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @fileoverview
 *
 * This file exports a boolean const whose value will depend on what environment
 * the module is being imported from.
 */
const NODE_MODE = false;
/**
 * A boolean that will be `true` in server environments like Node, and `false`
 * in browser environments. Note that your server environment or toolchain must
 * support the `"node"` export condition for this to be `true`.
 *
 * This can be used when authoring components to change behavior based on
 * whether or not the component is executing in an SSR context.
 */
const isServer = NODE_MODE;

/***/ }),

/***/ "./node_modules/lit-html/development/lit-html.js":
/*!*******************************************************!*\
  !*** ./node_modules/lit-html/development/lit-html.js ***!
  \*******************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _$LH: function() { return /* binding */ _$LH; },
/* harmony export */   html: function() { return /* binding */ html; },
/* harmony export */   noChange: function() { return /* binding */ noChange; },
/* harmony export */   nothing: function() { return /* binding */ nothing; },
/* harmony export */   render: function() { return /* binding */ render; },
/* harmony export */   svg: function() { return /* binding */ svg; }
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var _a, _b, _c, _d;
const DEV_MODE = true;
const ENABLE_EXTRA_SECURITY_HOOKS = true;
const ENABLE_SHADYDOM_NOPATCH = true;
const NODE_MODE = false;
// Use window for browser builds because IE11 doesn't have globalThis.
const global = NODE_MODE ? globalThis : window;
/**
 * Useful for visualizing and logging insights into what the Lit template system is doing.
 *
 * Compiled out of prod mode builds.
 */
const debugLogEvent = DEV_MODE ? event => {
  const shouldEmit = global.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global.dispatchEvent(new CustomEvent('lit-debug', {
    detail: event
  }));
} : undefined;
// Used for connecting beginRender and endRender events when there are nested
// renders when errors are thrown preventing an endRender event from being
// called.
let debugLogRenderId = 0;
let issueWarning;
if (DEV_MODE) {
  (_a = global.litIssuedWarnings) !== null && _a !== void 0 ? _a : global.litIssuedWarnings = new Set();
  // Issue a warning, if we haven't already.
  issueWarning = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : '';
    if (!global.litIssuedWarnings.has(warning)) {
      console.warn(warning);
      global.litIssuedWarnings.add(warning);
    }
  };
  issueWarning('dev-mode', `Lit is in dev mode. Not recommended for production!`);
}
const wrap = ENABLE_SHADYDOM_NOPATCH && ((_b = global.ShadyDOM) === null || _b === void 0 ? void 0 : _b.inUse) && ((_c = global.ShadyDOM) === null || _c === void 0 ? void 0 : _c.noPatch) === true ? global.ShadyDOM.wrap : node => node;
const trustedTypes = global.trustedTypes;
/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = trustedTypes ? trustedTypes.createPolicy('lit-html', {
  createHTML: s => s
}) : undefined;
const identityFunction = value => value;
const noopSanitizer = (_node, _name, _type) => identityFunction;
/** Sets the global sanitizer factory. */
const setSanitizer = newSanitizer => {
  if (!ENABLE_EXTRA_SECURITY_HOOKS) {
    return;
  }
  if (sanitizerFactoryInternal !== noopSanitizer) {
    throw new Error(`Attempted to overwrite existing lit-html security policy.` + ` setSanitizeDOMValueFactory should be called at most once.`);
  }
  sanitizerFactoryInternal = newSanitizer;
};
/**
 * Only used in internal tests, not a part of the public API.
 */
const _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
  sanitizerFactoryInternal = noopSanitizer;
};
const createSanitizer = (node, name, type) => {
  return sanitizerFactoryInternal(node, name, type);
};
// Added to an attribute name to mark the attribute as bound so we can find
// it easily.
const boundAttributeSuffix = '$lit$';
// This marker is used in many syntactic positions in HTML, so it must be
// a valid element name and attribute name. We don't support dynamic names (yet)
// but this at least ensures that the parse tree is closer to the template
// intention.
const marker = `lit$${String(Math.random()).slice(9)}$`;
// String used to tell if a comment is a marker comment
const markerMatch = '?' + marker;
// Text used to insert a comment marker node. We use processing instruction
// syntax because it's slightly smaller, but parses as a comment node.
const nodeMarker = `<${markerMatch}>`;
const d = NODE_MODE && global.document === undefined ? {
  createTreeWalker() {
    return {};
  }
} : document;
// Creates a dynamic marker. We never have to search for these in the DOM.
const createMarker = () => d.createComment('');
const isPrimitive = value => value === null || typeof value != 'object' && typeof value != 'function';
const isArray = Array.isArray;
const isIterable = value => isArray(value) ||
// eslint-disable-next-line @typescript-eslint/no-explicit-any
typeof (value === null || value === void 0 ? void 0 : value[Symbol.iterator]) === 'function';
const SPACE_CHAR = `[ \t\n\f\r]`;
const ATTR_VALUE_CHAR = `[^ \t\n\f\r"'\`<>=]`;
const NAME_CHAR = `[^\\s"'>=/]`;
// These regexes represent the five parsing states that we care about in the
// Template's HTML scanner. They match the *end* of the state they're named
// after.
// Depending on the match, we transition to a new state. If there's no match,
// we stay in the same state.
// Note that the regexes are stateful. We utilize lastIndex and sync it
// across the multiple regexes used. In addition to the five regexes below
// we also dynamically create a regex to find the matching end tags for raw
// text elements.
/**
 * End of text is: `<` followed by:
 *   (comment start) or (tag) or (dynamic tag binding)
 */
const textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
const COMMENT_START = 1;
const TAG_NAME = 2;
const DYNAMIC_TAG_NAME = 3;
const commentEndRegex = /-->/g;
/**
 * Comments not started with <!--, like </{, can be ended by a single `>`
 */
const comment2EndRegex = />/g;
/**
 * The tagEnd regex matches the end of the "inside an opening" tag syntax
 * position. It either matches a `>`, an attribute-like sequence, or the end
 * of the string after a space (attribute-name position ending).
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \t\n\f\r" are HTML space characters:
 * https://infra.spec.whatwg.org/#ascii-whitespace
 *
 * So an attribute is:
 *  * The name: any character except a whitespace character, ("), ('), ">",
 *    "=", or "/". Note: this is different from the HTML spec which also excludes control characters.
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const tagEndRegex = new RegExp(`>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`, 'g');
const ENTIRE_MATCH = 0;
const ATTRIBUTE_NAME = 1;
const SPACES_AND_EQUALS = 2;
const QUOTE_CHAR = 3;
const singleQuoteAttrEndRegex = /'/g;
const doubleQuoteAttrEndRegex = /"/g;
/**
 * Matches the raw text elements.
 *
 * Comments are not parsed within raw text elements, so we need to search their
 * text content for marker strings.
 */
const rawTextElement = /^(?:script|style|textarea|title)$/i;
/** TemplateResult types */
const HTML_RESULT = 1;
const SVG_RESULT = 2;
// TemplatePart types
// IMPORTANT: these must match the values in PartType
const ATTRIBUTE_PART = 1;
const CHILD_PART = 2;
const PROPERTY_PART = 3;
const BOOLEAN_ATTRIBUTE_PART = 4;
const EVENT_PART = 5;
const ELEMENT_PART = 6;
const COMMENT_PART = 7;
/**
 * Generates a template literal tag function that returns a TemplateResult with
 * the given result type.
 */
const tag = type => (strings, ...values) => {
  // Warn against templates octal escape sequences
  // We do this here rather than in render so that the warning is closer to the
  // template definition.
  if (DEV_MODE && strings.some(s => s === undefined)) {
    console.warn('Some template strings are undefined.\n' + 'This is probably caused by illegal octal escape sequences.');
  }
  return {
    // This property needs to remain unminified.
    ['_$litType$']: type,
    strings,
    values
  };
};
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * ```ts
 * const header = (title: string) => html`<h1>${title}</h1>`;
 * ```
 *
 * The `html` tag returns a description of the DOM to render as a value. It is
 * lazy, meaning no work is done until the template is rendered. When rendering,
 * if a template comes from the same expression as a previously rendered result,
 * it's efficiently updated instead of replaced.
 */
const html = tag(HTML_RESULT);
/**
 * Interprets a template literal as an SVG fragment that can efficiently
 * render to and update a container.
 *
 * ```ts
 * const rect = svg`<rect width="10" height="10"></rect>`;
 *
 * const myImage = html`
 *   <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
 *     ${rect}
 *   </svg>`;
 * ```
 *
 * The `svg` *tag function* should only be used for SVG fragments, or elements
 * that would be contained **inside** an `<svg>` HTML element. A common error is
 * placing an `<svg>` *element* in a template tagged with the `svg` tag
 * function. The `<svg>` element is an HTML element and should be used within a
 * template tagged with the {@linkcode html} tag function.
 *
 * In LitElement usage, it's invalid to return an SVG fragment from the
 * `render()` method, as the SVG fragment will be contained within the element's
 * shadow root and thus cannot be used within an `<svg>` HTML element.
 */
const svg = tag(SVG_RESULT);
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = Symbol.for('lit-noChange');
/**
 * A sentinel value that signals a ChildPart to fully clear its content.
 *
 * ```ts
 * const button = html`${
 *  user.isAdmin
 *    ? html`<button>DELETE</button>`
 *    : nothing
 * }`;
 * ```
 *
 * Prefer using `nothing` over other falsy values as it provides a consistent
 * behavior between various expression binding contexts.
 *
 * In child expressions, `undefined`, `null`, `''`, and `nothing` all behave the
 * same and render no nodes. In attribute expressions, `nothing` _removes_ the
 * attribute, while `undefined` and `null` will render an empty string. In
 * property expressions `nothing` becomes `undefined`.
 */
const nothing = Symbol.for('lit-nothing');
/**
 * The cache of prepared templates, keyed by the tagged TemplateStringsArray
 * and _not_ accounting for the specific template tag used. This means that
 * template tags cannot be dynamic - the must statically be one of html, svg,
 * or attr. This restriction simplifies the cache lookup, which is on the hot
 * path for rendering.
 */
const templateCache = new WeakMap();
const walker = d.createTreeWalker(d, 129 /* NodeFilter.SHOW_{ELEMENT|COMMENT} */, null, false);
let sanitizerFactoryInternal = noopSanitizer;
function trustFromTemplateString(tsa, stringFromTSA) {
  // A security check to prevent spoofing of Lit template results.
  // In the future, we may be able to replace this with Array.isTemplateObject,
  // though we might need to make that check inside of the html and svg
  // functions, because precompiled templates don't come in as
  // TemplateStringArray objects.
  if (!Array.isArray(tsa) || !tsa.hasOwnProperty('raw')) {
    let message = 'invalid template strings array';
    if (DEV_MODE) {
      message = `
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.
          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        `.trim().replace(/\n */g, '\n');
    }
    throw new Error(message);
  }
  return policy !== undefined ? policy.createHTML(stringFromTSA) : stringFromTSA;
}
/**
 * Returns an HTML string for the given TemplateStringsArray and result type
 * (HTML or SVG), along with the case-sensitive bound attribute names in
 * template order. The HTML contains comment markers denoting the `ChildPart`s
 * and suffixes on bound attributes denoting the `AttributeParts`.
 *
 * @param strings template strings array
 * @param type HTML or SVG
 * @return Array containing `[html, attrNames]` (array returned for terseness,
 *     to avoid object fields since this code is shared with non-minified SSR
 *     code)
 */
const getTemplateHtml = (strings, type) => {
  // Insert makers into the template HTML to represent the position of
  // bindings. The following code scans the template strings to determine the
  // syntactic position of the bindings. They can be in text position, where
  // we insert an HTML comment, attribute value position, where we insert a
  // sentinel string and re-write the attribute name, or inside a tag where
  // we insert the sentinel string.
  const l = strings.length - 1;
  // Stores the case-sensitive bound attribute names in the order of their
  // parts. ElementParts are also reflected in this array as undefined
  // rather than a string, to disambiguate from attribute bindings.
  const attrNames = [];
  let html = type === SVG_RESULT ? '<svg>' : '';
  // When we're inside a raw text tag (not it's text content), the regex
  // will still be tagRegex so we can find attributes, but will switch to
  // this regex when the tag ends.
  let rawTextEndRegex;
  // The current parsing state, represented as a reference to one of the
  // regexes
  let regex = textEndRegex;
  for (let i = 0; i < l; i++) {
    const s = strings[i];
    // The index of the end of the last attribute name. When this is
    // positive at end of a string, it means we're in an attribute value
    // position and need to rewrite the attribute name.
    // We also use a special value of -2 to indicate that we encountered
    // the end of a string in attribute name position.
    let attrNameEndIndex = -1;
    let attrName;
    let lastIndex = 0;
    let match;
    // The conditions in this loop handle the current parse state, and the
    // assignments to the `regex` variable are the state transitions.
    while (lastIndex < s.length) {
      // Make sure we start searching from where we previously left off
      regex.lastIndex = lastIndex;
      match = regex.exec(s);
      if (match === null) {
        break;
      }
      lastIndex = regex.lastIndex;
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === '!--') {
          regex = commentEndRegex;
        } else if (match[COMMENT_START] !== undefined) {
          // We started a weird comment, like </{
          regex = comment2EndRegex;
        } else if (match[TAG_NAME] !== undefined) {
          if (rawTextElement.test(match[TAG_NAME])) {
            // Record if we encounter a raw-text element. We'll switch to
            // this regex at the end of the tag.
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, 'g');
          }
          regex = tagEndRegex;
        } else if (match[DYNAMIC_TAG_NAME] !== undefined) {
          if (DEV_MODE) {
            throw new Error('Bindings in tag names are not supported. Please use static templates instead. ' + 'See https://lit.dev/docs/templates/expressions/#static-expressions');
          }
          regex = tagEndRegex;
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === '>') {
          // End of a tag. If we had started a raw-text element, use that
          // regex
          regex = rawTextEndRegex !== null && rawTextEndRegex !== void 0 ? rawTextEndRegex : textEndRegex;
          // We may be ending an unquoted attribute value, so make sure we
          // clear any pending attrNameEndIndex
          attrNameEndIndex = -1;
        } else if (match[ATTRIBUTE_NAME] === undefined) {
          // Attribute name position
          attrNameEndIndex = -2;
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
          attrName = match[ATTRIBUTE_NAME];
          regex = match[QUOTE_CHAR] === undefined ? tagEndRegex : match[QUOTE_CHAR] === '"' ? doubleQuoteAttrEndRegex : singleQuoteAttrEndRegex;
        }
      } else if (regex === doubleQuoteAttrEndRegex || regex === singleQuoteAttrEndRegex) {
        regex = tagEndRegex;
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex;
      } else {
        // Not one of the five state regexes, so it must be the dynamically
        // created raw text regex and we're at the close of that element.
        regex = tagEndRegex;
        rawTextEndRegex = undefined;
      }
    }
    if (DEV_MODE) {
      // If we have a attrNameEndIndex, which indicates that we should
      // rewrite the attribute name, assert that we're in a valid attribute
      // position - either in a tag, or a quoted attribute value.
      console.assert(attrNameEndIndex === -1 || regex === tagEndRegex || regex === singleQuoteAttrEndRegex || regex === doubleQuoteAttrEndRegex, 'unexpected parse state B');
    }
    // We have four cases:
    //  1. We're in text position, and not in a raw text element
    //     (regex === textEndRegex): insert a comment marker.
    //  2. We have a non-negative attrNameEndIndex which means we need to
    //     rewrite the attribute name to add a bound attribute suffix.
    //  3. We're at the non-first binding in a multi-binding attribute, use a
    //     plain marker.
    //  4. We're somewhere else inside the tag. If we're in attribute name
    //     position (attrNameEndIndex === -2), add a sequential suffix to
    //     generate a unique attribute name.
    // Detect a binding next to self-closing tag end and insert a space to
    // separate the marker from the tag end:
    const end = regex === tagEndRegex && strings[i + 1].startsWith('/>') ? ' ' : '';
    html += regex === textEndRegex ? s + nodeMarker : attrNameEndIndex >= 0 ? (attrNames.push(attrName), s.slice(0, attrNameEndIndex) + boundAttributeSuffix + s.slice(attrNameEndIndex)) + marker + end : s + marker + (attrNameEndIndex === -2 ? (attrNames.push(undefined), i) : end);
  }
  const htmlResult = html + (strings[l] || '<?>') + (type === SVG_RESULT ? '</svg>' : '');
  // Returned as an array for terseness
  return [trustFromTemplateString(strings, htmlResult), attrNames];
};
class Template {
  constructor(
  // This property needs to remain unminified.
  {
    strings,
    ['_$litType$']: type
  }, options) {
    this.parts = [];
    let node;
    let nodeIndex = 0;
    let attrNameIndex = 0;
    const partCount = strings.length - 1;
    const parts = this.parts;
    // Create template element
    const [html, attrNames] = getTemplateHtml(strings, type);
    this.el = Template.createElement(html, options);
    walker.currentNode = this.el.content;
    // Reparent SVG nodes into template root
    if (type === SVG_RESULT) {
      const content = this.el.content;
      const svgElement = content.firstChild;
      svgElement.remove();
      content.append(...svgElement.childNodes);
    }
    // Walk the template to find binding markers and create TemplateParts
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (node.nodeType === 1) {
        if (DEV_MODE) {
          const tag = node.localName;
          // Warn if `textarea` includes an expression and throw if `template`
          // does since these are not supported. We do this by checking
          // innerHTML for anything that looks like a marker. This catches
          // cases like bindings in textarea there markers turn into text nodes.
          if (/^(?:textarea|template)$/i.test(tag) && node.innerHTML.includes(marker)) {
            const m = `Expressions are not supported inside \`${tag}\` ` + `elements. See https://lit.dev/msg/expression-in-${tag} for more ` + `information.`;
            if (tag === 'template') {
              throw new Error(m);
            } else issueWarning('', m);
          }
        }
        // TODO (justinfagnani): for attempted dynamic tag names, we don't
        // increment the bindingIndex, and it'll be off by 1 in the element
        // and off by two after it.
        if (node.hasAttributes()) {
          // We defer removing bound attributes because on IE we might not be
          // iterating attributes in their template order, and would sometimes
          // remove an attribute that we still need to create a part for.
          const attrsToRemove = [];
          for (const name of node.getAttributeNames()) {
            // `name` is the name of the attribute we're iterating over, but not
            // _necessarily_ the name of the attribute we will create a part
            // for. They can be different in browsers that don't iterate on
            // attributes in source order. In that case the attrNames array
            // contains the attribute name we'll process next. We only need the
            // attribute name here to know if we should process a bound attribute
            // on this element.
            if (name.endsWith(boundAttributeSuffix) || name.startsWith(marker)) {
              const realName = attrNames[attrNameIndex++];
              attrsToRemove.push(name);
              if (realName !== undefined) {
                // Lowercase for case-sensitive SVG attributes like viewBox
                const value = node.getAttribute(realName.toLowerCase() + boundAttributeSuffix);
                const statics = value.split(marker);
                const m = /([.?@])?(.*)/.exec(realName);
                parts.push({
                  type: ATTRIBUTE_PART,
                  index: nodeIndex,
                  name: m[2],
                  strings: statics,
                  ctor: m[1] === '.' ? PropertyPart : m[1] === '?' ? BooleanAttributePart : m[1] === '@' ? EventPart : AttributePart
                });
              } else {
                parts.push({
                  type: ELEMENT_PART,
                  index: nodeIndex
                });
              }
            }
          }
          for (const name of attrsToRemove) {
            node.removeAttribute(name);
          }
        }
        // TODO (justinfagnani): benchmark the regex against testing for each
        // of the 3 raw text element names.
        if (rawTextElement.test(node.tagName)) {
          // For raw text elements we need to split the text content on
          // markers, create a Text node for each segment, and create
          // a TemplatePart for each marker.
          const strings = node.textContent.split(marker);
          const lastIndex = strings.length - 1;
          if (lastIndex > 0) {
            node.textContent = trustedTypes ? trustedTypes.emptyScript : '';
            // Generate a new text node for each literal section
            // These nodes are also used as the markers for node parts
            // We can't use empty text nodes as markers because they're
            // normalized when cloning in IE (could simplify when
            // IE is no longer supported)
            for (let i = 0; i < lastIndex; i++) {
              node.append(strings[i], createMarker());
              // Walk past the marker node we just added
              walker.nextNode();
              parts.push({
                type: CHILD_PART,
                index: ++nodeIndex
              });
            }
            // Note because this marker is added after the walker's current
            // node, it will be walked to in the outer loop (and ignored), so
            // we don't need to adjust nodeIndex here
            node.append(strings[lastIndex], createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = node.data;
        if (data === markerMatch) {
          parts.push({
            type: CHILD_PART,
            index: nodeIndex
          });
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            // Comment node has a binding marker inside, make an inactive part
            // The binding won't work, but subsequent bindings will
            parts.push({
              type: COMMENT_PART,
              index: nodeIndex
            });
            // Move to the end of the match
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }
    // We could set walker.currentNode to another node here to prevent a memory
    // leak, but every time we prepare a template, we immediately render it
    // and re-use the walker in new TemplateInstance._clone().
    debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
      kind: 'template prep',
      template: this,
      clonableTemplate: this.el,
      parts: this.parts,
      strings
    });
  }
  // Overridden via `litHtmlPolyfillSupport` to provide platform support.
  /** @nocollapse */
  static createElement(html, _options) {
    const el = d.createElement('template');
    el.innerHTML = html;
    return el;
  }
}
function resolveDirective(part, value, parent = part, attributeIndex) {
  var _a, _b, _c;
  var _d;
  // Bail early if the value is explicitly noChange. Note, this means any
  // nested directive is still attached and is not run.
  if (value === noChange) {
    return value;
  }
  let currentDirective = attributeIndex !== undefined ? (_a = parent.__directives) === null || _a === void 0 ? void 0 : _a[attributeIndex] : parent.__directive;
  const nextDirectiveConstructor = isPrimitive(value) ? undefined :
  // This property needs to remain unminified.
  value['_$litDirective$'];
  if ((currentDirective === null || currentDirective === void 0 ? void 0 : currentDirective.constructor) !== nextDirectiveConstructor) {
    // This property needs to remain unminified.
    (_b = currentDirective === null || currentDirective === void 0 ? void 0 : currentDirective['_$notifyDirectiveConnectionChanged']) === null || _b === void 0 ? void 0 : _b.call(currentDirective, false);
    if (nextDirectiveConstructor === undefined) {
      currentDirective = undefined;
    } else {
      currentDirective = new nextDirectiveConstructor(part);
      currentDirective._$initialize(part, parent, attributeIndex);
    }
    if (attributeIndex !== undefined) {
      ((_c = (_d = parent).__directives) !== null && _c !== void 0 ? _c : _d.__directives = [])[attributeIndex] = currentDirective;
    } else {
      parent.__directive = currentDirective;
    }
  }
  if (currentDirective !== undefined) {
    value = resolveDirective(part, currentDirective._$resolve(part, value.values), currentDirective, attributeIndex);
  }
  return value;
}
/**
 * An updateable instance of a Template. Holds references to the Parts used to
 * update the template instance.
 */
class TemplateInstance {
  constructor(template, parent) {
    this._$parts = [];
    /** @internal */
    this._$disconnectableChildren = undefined;
    this._$template = template;
    this._$parent = parent;
  }
  // Called by ChildPart parentNode getter
  get parentNode() {
    return this._$parent.parentNode;
  }
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  // This method is separate from the constructor because we need to return a
  // DocumentFragment and we don't want to hold onto it with an instance field.
  _clone(options) {
    var _a;
    const {
      el: {
        content
      },
      parts: parts
    } = this._$template;
    const fragment = ((_a = options === null || options === void 0 ? void 0 : options.creationScope) !== null && _a !== void 0 ? _a : d).importNode(content, true);
    walker.currentNode = fragment;
    let node = walker.nextNode();
    let nodeIndex = 0;
    let partIndex = 0;
    let templatePart = parts[0];
    while (templatePart !== undefined) {
      if (nodeIndex === templatePart.index) {
        let part;
        if (templatePart.type === CHILD_PART) {
          part = new ChildPart(node, node.nextSibling, this, options);
        } else if (templatePart.type === ATTRIBUTE_PART) {
          part = new templatePart.ctor(node, templatePart.name, templatePart.strings, this, options);
        } else if (templatePart.type === ELEMENT_PART) {
          part = new ElementPart(node, this, options);
        }
        this._$parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (nodeIndex !== (templatePart === null || templatePart === void 0 ? void 0 : templatePart.index)) {
        node = walker.nextNode();
        nodeIndex++;
      }
    }
    // We need to set the currentNode away from the cloned tree so that we
    // don't hold onto the tree even if the tree is detached and should be
    // freed.
    walker.currentNode = d;
    return fragment;
  }
  _update(values) {
    let i = 0;
    for (const part of this._$parts) {
      if (part !== undefined) {
        debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
          kind: 'set part',
          part,
          value: values[i],
          valueIndex: i,
          values,
          templateInstance: this
        });
        if (part.strings !== undefined) {
          part._$setValue(values, part, i);
          // The number of values the part consumes is part.strings.length - 1
          // since values are in between template spans. We increment i by 1
          // later in the loop, so increment it by part.strings.length - 2 here
          i += part.strings.length - 2;
        } else {
          part._$setValue(values[i]);
        }
      }
      i++;
    }
  }
}
class ChildPart {
  constructor(startNode, endNode, parent, options) {
    var _a;
    this.type = CHILD_PART;
    this._$committedValue = nothing;
    // The following fields will be patched onto ChildParts when required by
    // AsyncDirective
    /** @internal */
    this._$disconnectableChildren = undefined;
    this._$startNode = startNode;
    this._$endNode = endNode;
    this._$parent = parent;
    this.options = options;
    // Note __isConnected is only ever accessed on RootParts (i.e. when there is
    // no _$parent); the value on a non-root-part is "don't care", but checking
    // for parent would be more code
    this.__isConnected = (_a = options === null || options === void 0 ? void 0 : options.isConnected) !== null && _a !== void 0 ? _a : true;
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      // Explicitly initialize for consistent class shape.
      this._textSanitizer = undefined;
    }
  }
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    var _a, _b;
    // ChildParts that are not at the root should always be created with a
    // parent; only RootChildNode's won't, so they return the local isConnected
    // state
    return (_b = (_a = this._$parent) === null || _a === void 0 ? void 0 : _a._$isConnected) !== null && _b !== void 0 ? _b : this.__isConnected;
  }
  /**
   * The parent node into which the part renders its content.
   *
   * A ChildPart's content consists of a range of adjacent child nodes of
   * `.parentNode`, possibly bordered by 'marker nodes' (`.startNode` and
   * `.endNode`).
   *
   * - If both `.startNode` and `.endNode` are non-null, then the part's content
   * consists of all siblings between `.startNode` and `.endNode`, exclusively.
   *
   * - If `.startNode` is non-null but `.endNode` is null, then the part's
   * content consists of all siblings following `.startNode`, up to and
   * including the last child of `.parentNode`. If `.endNode` is non-null, then
   * `.startNode` will always be non-null.
   *
   * - If both `.endNode` and `.startNode` are null, then the part's content
   * consists of all child nodes of `.parentNode`.
   */
  get parentNode() {
    let parentNode = wrap(this._$startNode).parentNode;
    const parent = this._$parent;
    if (parent !== undefined && (parentNode === null || parentNode === void 0 ? void 0 : parentNode.nodeType) === 11 /* Node.DOCUMENT_FRAGMENT */) {
      // If the parentNode is a DocumentFragment, it may be because the DOM is
      // still in the cloned fragment during initial render; if so, get the real
      // parentNode the part will be committed into by asking the parent.
      parentNode = parent.parentNode;
    }
    return parentNode;
  }
  /**
   * The part's leading marker node, if any. See `.parentNode` for more
   * information.
   */
  get startNode() {
    return this._$startNode;
  }
  /**
   * The part's trailing marker node, if any. See `.parentNode` for more
   * information.
   */
  get endNode() {
    return this._$endNode;
  }
  _$setValue(value, directiveParent = this) {
    var _a;
    if (DEV_MODE && this.parentNode === null) {
      throw new Error(`This \`ChildPart\` has no \`parentNode\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \`innerHTML\` or \`textContent\` can do this.`);
    }
    value = resolveDirective(this, value, directiveParent);
    if (isPrimitive(value)) {
      // Non-rendering child values. It's important that these do not render
      // empty text nodes to avoid issues with preventing default <slot>
      // fallback content.
      if (value === nothing || value == null || value === '') {
        if (this._$committedValue !== nothing) {
          debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
            kind: 'commit nothing to child',
            start: this._$startNode,
            end: this._$endNode,
            parent: this._$parent,
            options: this.options
          });
          this._$clear();
        }
        this._$committedValue = nothing;
      } else if (value !== this._$committedValue && value !== noChange) {
        this._commitText(value);
      }
      // This property needs to remain unminified.
    } else if (value['_$litType$'] !== undefined) {
      this._commitTemplateResult(value);
    } else if (value.nodeType !== undefined) {
      if (DEV_MODE && ((_a = this.options) === null || _a === void 0 ? void 0 : _a.host) === value) {
        this._commitText(`[probable mistake: rendered a template's host in itself ` + `(commonly caused by writing \${this} in a template]`);
        console.warn(`Attempted to render the template host`, value, `inside itself. This is almost always a mistake, and in dev mode `, `we render some warning text. In production however, we'll `, `render it, which will usually result in an error, and sometimes `, `in the element disappearing from the DOM.`);
        return;
      }
      this._commitNode(value);
    } else if (isIterable(value)) {
      this._commitIterable(value);
    } else {
      // Fallback, will render the string representation
      this._commitText(value);
    }
  }
  _insert(node) {
    return wrap(wrap(this._$startNode).parentNode).insertBefore(node, this._$endNode);
  }
  _commitNode(value) {
    var _a;
    if (this._$committedValue !== value) {
      this._$clear();
      if (ENABLE_EXTRA_SECURITY_HOOKS && sanitizerFactoryInternal !== noopSanitizer) {
        const parentNodeName = (_a = this._$startNode.parentNode) === null || _a === void 0 ? void 0 : _a.nodeName;
        if (parentNodeName === 'STYLE' || parentNodeName === 'SCRIPT') {
          let message = 'Forbidden';
          if (DEV_MODE) {
            if (parentNodeName === 'STYLE') {
              message = `Lit does not support binding inside style nodes. ` + `This is a security risk, as style injection attacks can ` + `exfiltrate data and spoof UIs. ` + `Consider instead using css\`...\` literals ` + `to compose styles, and make do dynamic styling with ` + `css custom properties, ::parts, <slot>s, ` + `and by mutating the DOM rather than stylesheets.`;
            } else {
              message = `Lit does not support binding inside script nodes. ` + `This is a security risk, as it could allow arbitrary ` + `code execution.`;
            }
          }
          throw new Error(message);
        }
      }
      debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
        kind: 'commit node',
        start: this._$startNode,
        parent: this._$parent,
        value: value,
        options: this.options
      });
      this._$committedValue = this._insert(value);
    }
  }
  _commitText(value) {
    // If the committed value is a primitive it means we called _commitText on
    // the previous render, and we know that this._$startNode.nextSibling is a
    // Text node. We can now just replace the text content (.data) of the node.
    if (this._$committedValue !== nothing && isPrimitive(this._$committedValue)) {
      const node = wrap(this._$startNode).nextSibling;
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(node, 'data', 'property');
        }
        value = this._textSanitizer(value);
      }
      debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
        kind: 'commit text',
        node,
        value,
        options: this.options
      });
      node.data = value;
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        const textNode = d.createTextNode('');
        this._commitNode(textNode);
        // When setting text content, for security purposes it matters a lot
        // what the parent is. For example, <style> and <script> need to be
        // handled with care, while <span> does not. So first we need to put a
        // text node into the document, then we can sanitize its content.
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(textNode, 'data', 'property');
        }
        value = this._textSanitizer(value);
        debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
          kind: 'commit text',
          node: textNode,
          value,
          options: this.options
        });
        textNode.data = value;
      } else {
        this._commitNode(d.createTextNode(value));
        debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
          kind: 'commit text',
          node: wrap(this._$startNode).nextSibling,
          value,
          options: this.options
        });
      }
    }
    this._$committedValue = value;
  }
  _commitTemplateResult(result) {
    var _a;
    // This property needs to remain unminified.
    const {
      values,
      ['_$litType$']: type
    } = result;
    // If $litType$ is a number, result is a plain TemplateResult and we get
    // the template from the template cache. If not, result is a
    // CompiledTemplateResult and _$litType$ is a CompiledTemplate and we need
    // to create the <template> element the first time we see it.
    const template = typeof type === 'number' ? this._$getTemplate(result) : (type.el === undefined && (type.el = Template.createElement(trustFromTemplateString(type.h, type.h[0]), this.options)), type);
    if (((_a = this._$committedValue) === null || _a === void 0 ? void 0 : _a._$template) === template) {
      debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
        kind: 'template updating',
        template,
        instance: this._$committedValue,
        parts: this._$committedValue._$parts,
        options: this.options,
        values
      });
      this._$committedValue._update(values);
    } else {
      const instance = new TemplateInstance(template, this);
      const fragment = instance._clone(this.options);
      debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
        kind: 'template instantiated',
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      instance._update(values);
      debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
        kind: 'template instantiated and updated',
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      this._commitNode(fragment);
      this._$committedValue = instance;
    }
  }
  // Overridden via `litHtmlPolyfillSupport` to provide platform support.
  /** @internal */
  _$getTemplate(result) {
    let template = templateCache.get(result.strings);
    if (template === undefined) {
      templateCache.set(result.strings, template = new Template(result));
    }
    return template;
  }
  _commitIterable(value) {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
    // If value is an array, then the previous render was of an
    // iterable and value will contain the ChildParts from the previous
    // render. If value is not an array, clear this part and make a new
    // array for ChildParts.
    if (!isArray(this._$committedValue)) {
      this._$committedValue = [];
      this._$clear();
    }
    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = this._$committedValue;
    let partIndex = 0;
    let itemPart;
    for (const item of value) {
      if (partIndex === itemParts.length) {
        // If no existing part, create a new one
        // TODO (justinfagnani): test perf impact of always creating two parts
        // instead of sharing parts between nodes
        // https://github.com/lit/lit/issues/1266
        itemParts.push(itemPart = new ChildPart(this._insert(createMarker()), this._insert(createMarker()), this, this.options));
      } else {
        // Reuse an existing part
        itemPart = itemParts[partIndex];
      }
      itemPart._$setValue(item);
      partIndex++;
    }
    if (partIndex < itemParts.length) {
      // itemParts always have end nodes
      this._$clear(itemPart && wrap(itemPart._$endNode).nextSibling, partIndex);
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex;
    }
  }
  /**
   * Removes the nodes contained within this Part from the DOM.
   *
   * @param start Start node to clear from, for clearing a subset of the part's
   *     DOM (used when truncating iterables)
   * @param from  When `start` is specified, the index within the iterable from
   *     which ChildParts are being removed, used for disconnecting directives in
   *     those Parts.
   *
   * @internal
   */
  _$clear(start = wrap(this._$startNode).nextSibling, from) {
    var _a;
    (_a = this._$notifyConnectionChanged) === null || _a === void 0 ? void 0 : _a.call(this, false, true, from);
    while (start && start !== this._$endNode) {
      const n = wrap(start).nextSibling;
      wrap(start).remove();
      start = n;
    }
  }
  /**
   * Implementation of RootPart's `isConnected`. Note that this metod
   * should only be called on `RootPart`s (the `ChildPart` returned from a
   * top-level `render()` call). It has no effect on non-root ChildParts.
   * @param isConnected Whether to set
   * @internal
   */
  setConnected(isConnected) {
    var _a;
    if (this._$parent === undefined) {
      this.__isConnected = isConnected;
      (_a = this._$notifyConnectionChanged) === null || _a === void 0 ? void 0 : _a.call(this, isConnected);
    } else if (DEV_MODE) {
      throw new Error('part.setConnected() may only be called on a ' + 'RootPart returned from render().');
    }
  }
}
class AttributePart {
  constructor(element, name, strings, parent, options) {
    this.type = ATTRIBUTE_PART;
    /** @internal */
    this._$committedValue = nothing;
    /** @internal */
    this._$disconnectableChildren = undefined;
    this.element = element;
    this.name = name;
    this._$parent = parent;
    this.options = options;
    if (strings.length > 2 || strings[0] !== '' || strings[1] !== '') {
      this._$committedValue = new Array(strings.length - 1).fill(new String());
      this.strings = strings;
    } else {
      this._$committedValue = nothing;
    }
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._sanitizer = undefined;
    }
  }
  get tagName() {
    return this.element.tagName;
  }
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  /**
   * Sets the value of this part by resolving the value from possibly multiple
   * values and static strings and committing it to the DOM.
   * If this part is single-valued, `this._strings` will be undefined, and the
   * method will be called with a single value argument. If this part is
   * multi-value, `this._strings` will be defined, and the method is called
   * with the value array of the part's owning TemplateInstance, and an offset
   * into the value array from which the values should be read.
   * This method is overloaded this way to eliminate short-lived array slices
   * of the template instance values, and allow a fast-path for single-valued
   * parts.
   *
   * @param value The part value, or an array of values for multi-valued parts
   * @param valueIndex the index to start reading values from. `undefined` for
   *   single-valued parts
   * @param noCommit causes the part to not commit its value to the DOM. Used
   *   in hydration to prime attribute parts with their first-rendered value,
   *   but not set the attribute, and in SSR to no-op the DOM operation and
   *   capture the value for serialization.
   *
   * @internal
   */
  _$setValue(value, directiveParent = this, valueIndex, noCommit) {
    const strings = this.strings;
    // Whether any of the values has changed, for dirty-checking
    let change = false;
    if (strings === undefined) {
      // Single-value binding case
      value = resolveDirective(this, value, directiveParent, 0);
      change = !isPrimitive(value) || value !== this._$committedValue && value !== noChange;
      if (change) {
        this._$committedValue = value;
      }
    } else {
      // Interpolation case
      const values = value;
      value = strings[0];
      let i, v;
      for (i = 0; i < strings.length - 1; i++) {
        v = resolveDirective(this, values[valueIndex + i], directiveParent, i);
        if (v === noChange) {
          // If the user-provided value is `noChange`, use the previous value
          v = this._$committedValue[i];
        }
        change || (change = !isPrimitive(v) || v !== this._$committedValue[i]);
        if (v === nothing) {
          value = nothing;
        } else if (value !== nothing) {
          value += (v !== null && v !== void 0 ? v : '') + strings[i + 1];
        }
        // We always record each value, even if one is `nothing`, for future
        // change detection.
        this._$committedValue[i] = v;
      }
    }
    if (change && !noCommit) {
      this._commitValue(value);
    }
  }
  /** @internal */
  _commitValue(value) {
    if (value === nothing) {
      wrap(this.element).removeAttribute(this.name);
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._sanitizer === undefined) {
          this._sanitizer = sanitizerFactoryInternal(this.element, this.name, 'attribute');
        }
        value = this._sanitizer(value !== null && value !== void 0 ? value : '');
      }
      debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
        kind: 'commit attribute',
        element: this.element,
        name: this.name,
        value,
        options: this.options
      });
      wrap(this.element).setAttribute(this.name, value !== null && value !== void 0 ? value : '');
    }
  }
}
class PropertyPart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = PROPERTY_PART;
  }
  /** @internal */
  _commitValue(value) {
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      if (this._sanitizer === undefined) {
        this._sanitizer = sanitizerFactoryInternal(this.element, this.name, 'property');
      }
      value = this._sanitizer(value);
    }
    debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
      kind: 'commit property',
      element: this.element,
      name: this.name,
      value,
      options: this.options
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.element[this.name] = value === nothing ? undefined : value;
  }
}
// Temporary workaround for https://crbug.com/993268
// Currently, any attribute starting with "on" is considered to be a
// TrustedScript source. Such boolean attributes must be set to the equivalent
// trusted emptyScript value.
const emptyStringForBooleanAttribute = trustedTypes ? trustedTypes.emptyScript : '';
class BooleanAttributePart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = BOOLEAN_ATTRIBUTE_PART;
  }
  /** @internal */
  _commitValue(value) {
    debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
      kind: 'commit boolean attribute',
      element: this.element,
      name: this.name,
      value: !!(value && value !== nothing),
      options: this.options
    });
    if (value && value !== nothing) {
      wrap(this.element).setAttribute(this.name, emptyStringForBooleanAttribute);
    } else {
      wrap(this.element).removeAttribute(this.name);
    }
  }
}
class EventPart extends AttributePart {
  constructor(element, name, strings, parent, options) {
    super(element, name, strings, parent, options);
    this.type = EVENT_PART;
    if (DEV_MODE && this.strings !== undefined) {
      throw new Error(`A \`<${element.localName}>\` has a \`@${name}=...\` listener with ` + 'invalid content. Event listeners in templates must have exactly ' + 'one expression and no surrounding text.');
    }
  }
  // EventPart does not use the base _$setValue/_resolveValue implementation
  // since the dirty checking is more complex
  /** @internal */
  _$setValue(newListener, directiveParent = this) {
    var _a;
    newListener = (_a = resolveDirective(this, newListener, directiveParent, 0)) !== null && _a !== void 0 ? _a : nothing;
    if (newListener === noChange) {
      return;
    }
    const oldListener = this._$committedValue;
    // If the new value is nothing or any options change we have to remove the
    // part as a listener.
    const shouldRemoveListener = newListener === nothing && oldListener !== nothing || newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive;
    // If the new value is not nothing and we removed the listener, we have
    // to add the part as a listener.
    const shouldAddListener = newListener !== nothing && (oldListener === nothing || shouldRemoveListener);
    debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
      kind: 'commit event listener',
      element: this.element,
      name: this.name,
      value: newListener,
      options: this.options,
      removeListener: shouldRemoveListener,
      addListener: shouldAddListener,
      oldListener
    });
    if (shouldRemoveListener) {
      this.element.removeEventListener(this.name, this, oldListener);
    }
    if (shouldAddListener) {
      // Beware: IE11 and Chrome 41 don't like using the listener as the
      // options object. Figure out how to deal w/ this in IE11 - maybe
      // patch addEventListener?
      this.element.addEventListener(this.name, this, newListener);
    }
    this._$committedValue = newListener;
  }
  handleEvent(event) {
    var _a, _b;
    if (typeof this._$committedValue === 'function') {
      this._$committedValue.call((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.host) !== null && _b !== void 0 ? _b : this.element, event);
    } else {
      this._$committedValue.handleEvent(event);
    }
  }
}
class ElementPart {
  constructor(element, parent, options) {
    this.element = element;
    this.type = ELEMENT_PART;
    /** @internal */
    this._$disconnectableChildren = undefined;
    this._$parent = parent;
    this.options = options;
  }
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _$setValue(value) {
    debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
      kind: 'commit to element binding',
      element: this.element,
      value,
      options: this.options
    });
    resolveDirective(this, value);
  }
}
/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * Private exports for use by other Lit packages, not intended for use by
 * external users.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports  mangled in the
 * client side code, we export a _$LH object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 *
 * This has a unique name, to disambiguate it from private exports in
 * lit-element, which re-exports all of lit-html.
 *
 * @private
 */
const _$LH = {
  // Used in lit-ssr
  _boundAttributeSuffix: boundAttributeSuffix,
  _marker: marker,
  _markerMatch: markerMatch,
  _HTML_RESULT: HTML_RESULT,
  _getTemplateHtml: getTemplateHtml,
  // Used in tests and private-ssr-support
  _TemplateInstance: TemplateInstance,
  _isIterable: isIterable,
  _resolveDirective: resolveDirective,
  _ChildPart: ChildPart,
  _AttributePart: AttributePart,
  _BooleanAttributePart: BooleanAttributePart,
  _EventPart: EventPart,
  _PropertyPart: PropertyPart,
  _ElementPart: ElementPart
};
// Apply polyfills if available
const polyfillSupport = DEV_MODE ? global.litHtmlPolyfillSupportDevMode : global.litHtmlPolyfillSupport;
polyfillSupport === null || polyfillSupport === void 0 ? void 0 : polyfillSupport(Template, ChildPart);
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
((_d = global.litHtmlVersions) !== null && _d !== void 0 ? _d : global.litHtmlVersions = []).push('2.8.0');
if (DEV_MODE && global.litHtmlVersions.length > 1) {
  issueWarning('multiple-versions', `Multiple versions of Lit loaded. ` + `Loading multiple versions is not recommended.`);
}
/**
 * Renders a value, usually a lit-html TemplateResult, to the container.
 *
 * This example renders the text "Hello, Zoe!" inside a paragraph tag, appending
 * it to the container `document.body`.
 *
 * ```js
 * import {html, render} from 'lit';
 *
 * const name = "Zoe";
 * render(html`<p>Hello, ${name}!</p>`, document.body);
 * ```
 *
 * @param value Any [renderable
 *   value](https://lit.dev/docs/templates/expressions/#child-expressions),
 *   typically a {@linkcode TemplateResult} created by evaluating a template tag
 *   like {@linkcode html} or {@linkcode svg}.
 * @param container A DOM container to render to. The first render will append
 *   the rendered value to the container, and subsequent renders will
 *   efficiently update the rendered value if the same result type was
 *   previously rendered there.
 * @param options See {@linkcode RenderOptions} for options documentation.
 * @see
 * {@link https://lit.dev/docs/libraries/standalone-templates/#rendering-lit-html-templates| Rendering Lit HTML Templates}
 */
const render = (value, container, options) => {
  var _a, _b;
  if (DEV_MODE && container == null) {
    // Give a clearer error message than
    //     Uncaught TypeError: Cannot read properties of null (reading
    //     '_$litPart$')
    // which reads like an internal Lit error.
    throw new TypeError(`The container to render into may not be ${container}`);
  }
  const renderId = DEV_MODE ? debugLogRenderId++ : 0;
  const partOwnerNode = (_a = options === null || options === void 0 ? void 0 : options.renderBefore) !== null && _a !== void 0 ? _a : container;
  // This property needs to remain unminified.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let part = partOwnerNode['_$litPart$'];
  debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
    kind: 'begin render',
    id: renderId,
    value,
    container,
    options,
    part
  });
  if (part === undefined) {
    const endNode = (_b = options === null || options === void 0 ? void 0 : options.renderBefore) !== null && _b !== void 0 ? _b : null;
    // This property needs to remain unminified.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    partOwnerNode['_$litPart$'] = part = new ChildPart(container.insertBefore(createMarker(), endNode), endNode, undefined, options !== null && options !== void 0 ? options : {});
  }
  part._$setValue(value);
  debugLogEvent === null || debugLogEvent === void 0 ? void 0 : debugLogEvent({
    kind: 'end render',
    id: renderId,
    value,
    container,
    options,
    part
  });
  return part;
};
if (ENABLE_EXTRA_SECURITY_HOOKS) {
  render.setSanitizer = setSanitizer;
  render.createSanitizer = createSanitizer;
  if (DEV_MODE) {
    render._testOnlyClearSanitizerFactoryDoNotCallOrElse = _testOnlyClearSanitizerFactoryDoNotCallOrElse;
  }
}

/***/ }),

/***/ "./node_modules/lit/decorators.js":
/*!****************************************!*\
  !*** ./node_modules/lit/decorators.js ***!
  \****************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   customElement: function() { return /* reexport safe */ _lit_reactive_element_decorators_custom_element_js__WEBPACK_IMPORTED_MODULE_0__.customElement; },
/* harmony export */   eventOptions: function() { return /* reexport safe */ _lit_reactive_element_decorators_event_options_js__WEBPACK_IMPORTED_MODULE_3__.eventOptions; },
/* harmony export */   property: function() { return /* reexport safe */ _lit_reactive_element_decorators_property_js__WEBPACK_IMPORTED_MODULE_1__.property; },
/* harmony export */   query: function() { return /* reexport safe */ _lit_reactive_element_decorators_query_js__WEBPACK_IMPORTED_MODULE_4__.query; },
/* harmony export */   queryAll: function() { return /* reexport safe */ _lit_reactive_element_decorators_query_all_js__WEBPACK_IMPORTED_MODULE_5__.queryAll; },
/* harmony export */   queryAssignedElements: function() { return /* reexport safe */ _lit_reactive_element_decorators_query_assigned_elements_js__WEBPACK_IMPORTED_MODULE_7__.queryAssignedElements; },
/* harmony export */   queryAssignedNodes: function() { return /* reexport safe */ _lit_reactive_element_decorators_query_assigned_nodes_js__WEBPACK_IMPORTED_MODULE_8__.queryAssignedNodes; },
/* harmony export */   queryAsync: function() { return /* reexport safe */ _lit_reactive_element_decorators_query_async_js__WEBPACK_IMPORTED_MODULE_6__.queryAsync; },
/* harmony export */   state: function() { return /* reexport safe */ _lit_reactive_element_decorators_state_js__WEBPACK_IMPORTED_MODULE_2__.state; }
/* harmony export */ });
/* harmony import */ var _lit_reactive_element_decorators_custom_element_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lit/reactive-element/decorators/custom-element.js */ "./node_modules/@lit/reactive-element/development/decorators/custom-element.js");
/* harmony import */ var _lit_reactive_element_decorators_property_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lit/reactive-element/decorators/property.js */ "./node_modules/@lit/reactive-element/development/decorators/property.js");
/* harmony import */ var _lit_reactive_element_decorators_state_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lit/reactive-element/decorators/state.js */ "./node_modules/@lit/reactive-element/development/decorators/state.js");
/* harmony import */ var _lit_reactive_element_decorators_event_options_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @lit/reactive-element/decorators/event-options.js */ "./node_modules/@lit/reactive-element/development/decorators/event-options.js");
/* harmony import */ var _lit_reactive_element_decorators_query_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @lit/reactive-element/decorators/query.js */ "./node_modules/@lit/reactive-element/development/decorators/query.js");
/* harmony import */ var _lit_reactive_element_decorators_query_all_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @lit/reactive-element/decorators/query-all.js */ "./node_modules/@lit/reactive-element/development/decorators/query-all.js");
/* harmony import */ var _lit_reactive_element_decorators_query_async_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @lit/reactive-element/decorators/query-async.js */ "./node_modules/@lit/reactive-element/development/decorators/query-async.js");
/* harmony import */ var _lit_reactive_element_decorators_query_assigned_elements_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @lit/reactive-element/decorators/query-assigned-elements.js */ "./node_modules/@lit/reactive-element/development/decorators/query-assigned-elements.js");
/* harmony import */ var _lit_reactive_element_decorators_query_assigned_nodes_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @lit/reactive-element/decorators/query-assigned-nodes.js */ "./node_modules/@lit/reactive-element/development/decorators/query-assigned-nodes.js");










/***/ }),

/***/ "./node_modules/lit/directives/style-map.js":
/*!**************************************************!*\
  !*** ./node_modules/lit/directives/style-map.js ***!
  \**************************************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   styleMap: function() { return /* reexport safe */ lit_html_directives_style_map_js__WEBPACK_IMPORTED_MODULE_0__.styleMap; }
/* harmony export */ });
/* harmony import */ var lit_html_directives_style_map_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lit-html/directives/style-map.js */ "./node_modules/lit-html/development/directives/style-map.js");


/***/ }),

/***/ "./node_modules/lit/index.js":
/*!***********************************!*\
  !*** ./node_modules/lit/index.js ***!
  \***********************************/
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CSSResult: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.CSSResult; },
/* harmony export */   LitElement: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.LitElement; },
/* harmony export */   ReactiveElement: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.ReactiveElement; },
/* harmony export */   UpdatingElement: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.UpdatingElement; },
/* harmony export */   _$LE: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__._$LE; },
/* harmony export */   _$LH: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__._$LH; },
/* harmony export */   adoptStyles: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.adoptStyles; },
/* harmony export */   css: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.css; },
/* harmony export */   defaultConverter: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.defaultConverter; },
/* harmony export */   getCompatibleStyle: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.getCompatibleStyle; },
/* harmony export */   html: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.html; },
/* harmony export */   isServer: function() { return /* reexport safe */ lit_html_is_server_js__WEBPACK_IMPORTED_MODULE_3__.isServer; },
/* harmony export */   noChange: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.noChange; },
/* harmony export */   notEqual: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.notEqual; },
/* harmony export */   nothing: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.nothing; },
/* harmony export */   render: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.render; },
/* harmony export */   supportsAdoptingStyleSheets: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.supportsAdoptingStyleSheets; },
/* harmony export */   svg: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.svg; },
/* harmony export */   unsafeCSS: function() { return /* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.unsafeCSS; }
/* harmony export */ });
/* harmony import */ var _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lit/reactive-element */ "./node_modules/@lit/reactive-element/development/reactive-element.js");
/* harmony import */ var lit_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lit-html */ "./node_modules/lit-html/development/lit-html.js");
/* harmony import */ var lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lit-element/lit-element.js */ "./node_modules/lit-element/development/lit-element.js");
/* harmony import */ var lit_html_is_server_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lit-html/is-server.js */ "./node_modules/lit-html/development/is-server.js");





/***/ }),

/***/ "./package.json":
/*!**********************!*\
  !*** ./package.json ***!
  \**********************/
/***/ (function(module) {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"name":"@internetarchive/bookreader","version":"5.0.0-88","description":"The Internet Archive BookReader.","repository":{"type":"git","url":"git+https://github.com/internetarchive/bookreader.git"},"publishConfig":{"access":"public"},"module":"src/ia-bookreader/ia-bookreader.js","keywords":["online","bookreader","interface","ebooks","internet archive"],"author":"Internet Archive","license":"AGPL-3.0","bugs":{"url":"https://github.com/internetarchive/bookreader/issues"},"homepage":"https://github.com/internetarchive/bookreader#readme","private":false,"dependencies":{"@internetarchive/ia-activity-indicator":"^0.0.4","@internetarchive/ia-item-navigator":"^2.1.2","@internetarchive/icon-bookmark":"^1.3.4","@internetarchive/icon-dl":"^1.3.4","@internetarchive/icon-edit-pencil":"^1.3.4","@internetarchive/icon-magnify-minus":"^1.3.4","@internetarchive/icon-magnify-plus":"^1.3.4","@internetarchive/icon-search":"^1.3.4","@internetarchive/icon-toc":"^1.3.4","@internetarchive/icon-visual-adjustment":"^1.3.4","@internetarchive/modal-manager":"^0.2.12","@internetarchive/shared-resize-observer":"^0.2.0","lit":"^2.5.0"},"devDependencies":{"@babel/core":"7.25.8","@babel/eslint-parser":"7.25.7","@babel/plugin-proposal-class-properties":"7.18.6","@babel/plugin-proposal-decorators":"7.25.7","@babel/preset-env":"7.25.8","@iiif/presentation-2":"^1.0.4","@iiif/presentation-3":"^2.1.3","@open-wc/testing-helpers":"3.0.1","@types/jest":"29.5.14","@webcomponents/webcomponentsjs":"^2.6.0","babel-loader":"9.2.1","concurrently":"9.0.1","core-js":"3.38.1","cpx2":"8.0.0","eslint":"^7.32.0","eslint-plugin-no-jquery":"^2.7.0","eslint-plugin-testcafe":"^0.2.1","http-server":"14.1.1","interactjs":"^1.10.18","iso-language-codes":"1.1.0","jest":"29.7.0","jest-environment-jsdom":"^29.7.0","jquery":"3.6.1","jquery-colorbox":"1.6.4","jquery-ui":"1.12.1","jquery-ui-touch-punch":"0.2.3","jquery.browser":"0.1.0","live-server":"1.2.2","regenerator-runtime":"0.14.1","sass":"1.79.5","sinon":"19.0.2","soundmanager2":"2.97.20170602","svgo":"3.3.2","testcafe":"3.6.2","testcafe-browser-provider-browserstack":"^1.13.2-alpha.1","webpack":"5.95.0","webpack-cli":"5.1.4"},"jest":{"testEnvironment":"jsdom","transformIgnorePatterns":["node_modules/(?!(sinon|lit-html|lit-element|lit|@lit|@internetarchive|@open-wc)/)"],"moduleNameMapper":{"^@/(.*)$":"<rootDir>/$1"},"setupFiles":["./src/jquery-wrapper.js","./tests/jest/setup.js"],"roots":["<rootDir>/src/","<rootDir>/tests/jest/"]},"scripts":{"preversion":"npm run test && node scripts/preversion.js","version":"node scripts/version.js","postversion":"node scripts/postversion.js","build":"npm run clean && npx concurrently --group npm:build-js npm:build-css npm:build-assets","build-assets":"npx cpx \\"src/assets/**/*\\" BookReader && npx svgo -f BookReader/icons && npx svgo -f BookReader/images","build-assets:watch":"npx cpx --watch --verbose \\"src/assets/**/*\\" BookReader","build-js":"npx webpack","build-js:watch":"npx webpack --mode=development --watch","build-css":"npx sass --no-source-map ./src/css/BookReader.scss ./BookReader/BookReader.css","build-css:watch":"npx sass --watch --no-source-map ./src/css/BookReader.scss ./BookReader/BookReader.css","clean":"rm -r BookReader/ || true","lint":"npx eslint src/ tests/ *.js","lint:fix":"npx eslint --fix src/ tests/ *.js","serve":"npx http-server . --port=8000","serve-live":"npx live-server . --cors --port=8000 --watch=index.html,BookReader,BookReaderDemo","serve-dev":"env NODE_ENV=\'development\' npm run build-css && env NODE_ENV=\'development\' npx concurrently --kill-others npm:serve-live npm:build-*:watch","test":"npx jest --coverage --colors","test:watch":"npx jest --watch","test:e2e":"npm run build && npx testcafe","test:e2e:dev":"npx testcafe --live --dev","DOCS:update:test-deps":"If CI succeeds, these should be good to update","update:test-deps":"npm i @babel/eslint-parser@latest @open-wc/testing-helpers@latest @types/jest@latest eslint@7 eslint-plugin-testcafe@latest jest@latest sinon@latest testcafe@latest","DOCS:update:build-deps":"These can cause strange changes, so do an npm run build + check file size (git diff --stat), and check the site is as expected","update:build-deps":"npm i @babel/core@latest @babel/preset-env@latest @babel/plugin-proposal-class-properties@latest @babel/plugin-proposal-decorators@latest babel-loader@latest core-js@latest regenerator-runtime@latest sass@latest svgo@latest webpack@latest webpack-cli@latest"}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	!function() {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	!function() {
/******/ 		__webpack_require__.nmd = function(module) {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	!function() {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"BookReader.js": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = function(chunkId) { return installedChunks[chunkId] === 0; };
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = function(parentChunkLoadingFunction, data) {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some(function(id) { return installedChunks[id] !== 0; })) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunk_internetarchive_bookreader"] = self["webpackChunk_internetarchive_bookreader"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
!function() {
"use strict";
/*!***************************!*\
  !*** ./src/BookReader.js ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _modeStringToNumber: function() { return /* binding */ _modeStringToNumber; },
/* harmony export */   "default": function() { return /* binding */ BookReader; }
/* harmony export */ });
/* harmony import */ var jquery_ui_ui_widget_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jquery-ui/ui/widget.js */ "./node_modules/jquery-ui/ui/widget.js");
/* harmony import */ var jquery_ui_ui_widget_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jquery_ui_ui_widget_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var jquery_ui_ui_widgets_mouse_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jquery-ui/ui/widgets/mouse.js */ "./node_modules/jquery-ui/ui/widgets/mouse.js");
/* harmony import */ var jquery_ui_ui_widgets_mouse_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(jquery_ui_ui_widgets_mouse_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var jquery_ui_touch_punch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jquery-ui-touch-punch */ "./node_modules/jquery-ui-touch-punch/jquery.ui.touch-punch.js");
/* harmony import */ var jquery_ui_touch_punch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(jquery_ui_touch_punch__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../package.json */ "./package.json");
/* harmony import */ var _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./BookReader/utils.js */ "./src/BookReader/utils.js");
/* harmony import */ var _BookReader_utils_classes_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./BookReader/utils/classes.js */ "./src/BookReader/utils/classes.js");
/* harmony import */ var _BookReader_Navbar_Navbar_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./BookReader/Navbar/Navbar.js */ "./src/BookReader/Navbar/Navbar.js");
/* harmony import */ var _BookReader_options_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./BookReader/options.js */ "./src/BookReader/options.js");
/* harmony import */ var _BookReader_events_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./BookReader/events.js */ "./src/BookReader/events.js");
/* harmony import */ var _BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./BookReader/Toolbar/Toolbar.js */ "./src/BookReader/Toolbar/Toolbar.js");
/* harmony import */ var _BookReader_BookModel_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./BookReader/BookModel.js */ "./src/BookReader/BookModel.js");
/* harmony import */ var _BookReader_Mode1Up_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./BookReader/Mode1Up.js */ "./src/BookReader/Mode1Up.js");
/* harmony import */ var _BookReader_Mode2Up_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./BookReader/Mode2Up.js */ "./src/BookReader/Mode2Up.js");
/* harmony import */ var _BookReader_ModeThumb__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./BookReader/ModeThumb */ "./src/BookReader/ModeThumb.js");
/* harmony import */ var _BookReader_ImageCache_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./BookReader/ImageCache.js */ "./src/BookReader/ImageCache.js");
/* harmony import */ var _BookReader_PageContainer_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./BookReader/PageContainer.js */ "./src/BookReader/PageContainer.js");
/* harmony import */ var _BookReader_ReduceSet__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./BookReader/ReduceSet */ "./src/BookReader/ReduceSet.js");
/* provided dependency */ var jQuery = __webpack_require__(/*! jquery */ "jquery");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
/*
Copyright(c)2008-2019 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.

    BookReader is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    BookReader is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with BookReader.  If not, see <http://www.gnu.org/licenses/>.

    The BookReader source is hosted at http://github.com/internetarchive/bookreader/

*/
// Needed by touch-punch








/** @typedef {import('./BookReader/options.js').BookReaderOptions} BookReaderOptions */
/** @typedef {import('./BookReader/options.js').ReductionFactor} ReductionFactor */
/** @typedef {import('./BookReader/BookModel.js').PageIndex} PageIndex */










/**
 * BookReader
 * @param {BookReaderOptions} options
 * TODO document all options properties
 * @constructor
 */
function BookReader(overrides = {}) {
  const options = jQuery.extend(true, {}, BookReader.defaultOptions, overrides, BookReader.optionOverrides);
  this.setup(options);
}
BookReader.version = _package_json__WEBPACK_IMPORTED_MODULE_3__.version;

// Mode constants
/** 1 page view */
BookReader.constMode1up = 1;
/** 2 pages view */
BookReader.constMode2up = 2;
/** thumbnails view */
BookReader.constModeThumb = 3;

// Although this can actualy have any BookReaderPlugin subclass as value, we
// hardcode the known plugins here for type checking
BookReader.PLUGINS = {
  /** @type {typeof import('./plugins/plugin.archive_analytics.js').ArchiveAnalyticsPlugin | null}*/
  archiveAnalytics: null,
  /** @type {typeof import('./plugins/plugin.text_selection.js').TextSelectionPlugin | null}*/
  textSelection: null
};

/**
 * @param {string} pluginName
 * @param {typeof import('./BookReaderPlugin.js').BookReaderPlugin} plugin
 */
BookReader.registerPlugin = function (pluginName, plugin) {
  if (BookReader.PLUGINS[pluginName]) {
    console.warn(`Plugin ${pluginName} already registered. Overwriting.`);
  }
  BookReader.PLUGINS[pluginName] = plugin;
};

/** image cache */
BookReader.imageCache = null;

// Animation constants
BookReader.constNavAnimationDuration = 300;
BookReader.constResizeAnimationDuration = 100;

// Names of events that can be triggered via BookReader.prototype.trigger()
BookReader.eventNames = _BookReader_events_js__WEBPACK_IMPORTED_MODULE_8__.EVENTS;
BookReader.defaultOptions = _BookReader_options_js__WEBPACK_IMPORTED_MODULE_7__.DEFAULT_OPTIONS;

/**
 * @type {BookReaderOptions}
 * This is here, just in case you need to absolutely override an option.
 */
BookReader.optionOverrides = {};

/**
 * Setup
 * It is separate from the constructor, so plugins can extend.
 * @param {BookReaderOptions} options
 */
BookReader.prototype.setup = function (options) {
  // Store the options used to setup bookreader
  this.options = options;

  /** @type {number} @deprecated some past iterations set this */
  this.numLeafs = undefined;

  /** Overridden by plugin.search.js */
  this.enableSearch = false;

  /**
   * Store viewModeOrder states
   * @var {boolean}
   */
  this.viewModeOrder = [];

  /**
   * Used to suppress fragment change for init with canonical URLs
   * @var {boolean}
   */
  this.suppressFragmentChange = false;

  /** @type {function(): void} */
  this.animationFinishedCallback = null;

  // @deprecated: Instance constants. Use Class constants instead
  /** 1 page view */
  this.constMode1up = BookReader.constMode1up;
  /** 2 pages view */
  this.constMode2up = BookReader.constMode2up;
  /** thumbnails view */
  this.constModeThumb = BookReader.constModeThumb;

  // Private properties below. Configuration should be done with options.
  /** @type {number} TODO: Make private */
  this.reduce = 8; /* start very small */
  this.defaults = options.defaults;
  this.padding = options.padding;
  this.reduceSet = _BookReader_ReduceSet__WEBPACK_IMPORTED_MODULE_16__.NAMED_REDUCE_SETS[options.reduceSet];
  if (!this.reduceSet) {
    console.warn(`Invalid reduceSet ${options.reduceSet}. Ignoring.`);
    this.reduceSet = _BookReader_ReduceSet__WEBPACK_IMPORTED_MODULE_16__.NAMED_REDUCE_SETS[_BookReader_options_js__WEBPACK_IMPORTED_MODULE_7__.DEFAULT_OPTIONS.reduceSet];
  }

  /** @type {number}
   * can be 1 or 2 or 3 based on the display mode const value
   */
  this.mode = null;
  this.prevReadMode = null;
  this.ui = options.ui;
  this.uiAutoHide = options.uiAutoHide;
  this.thumbWidth = 100; // will be overridden during this._modes.modeThumb.prepare();
  this.thumbRowBuffer = options.thumbRowBuffer;
  this.thumbColumns = options.thumbColumns;
  this.thumbMaxLoading = options.thumbMaxLoading;
  this.thumbPadding = options.thumbPadding;
  this.displayedRows = [];
  this.displayedIndices = [];
  this.animating = false;
  this.flipSpeed = typeof options.flipSpeed === 'number' ? options.flipSpeed : {
    'fast': 200,
    'slow': 600
  }[options.flipSpeed] || 400;
  this.flipDelay = options.flipDelay;

  /**
     * Represents the first displayed index
     * In 2up mode it will be the left page
     * In 1 up mode it is the highest page
     * @property {number|null} firstIndex
     */
  this.firstIndex = null;
  this.isFullscreenActive = options.startFullscreen || false;
  this.lastScroll = null;
  this.showLogo = options.showLogo;
  this.logoURL = options.logoURL;
  this.imagesBaseURL = options.imagesBaseURL;
  this.reductionFactors = options.reductionFactors;
  this.onePage = options.onePage;
  /** @type {import('./BookReader/Mode2Up').TwoPageState} */
  this.twoPage = options.twoPage;
  this.onePageMinBreakpoint = options.onePageMinBreakpoint;
  this.bookTitle = options.bookTitle;
  this.bookUrl = options.bookUrl;
  this.bookUrlText = options.bookUrlText;
  this.bookUrlTitle = options.bookUrlTitle;
  this.titleLeaf = options.titleLeaf;
  this.metadata = options.metadata;
  this.thumbnail = options.thumbnail;
  this.bookUrlMoreInfo = options.bookUrlMoreInfo;
  this.enableExperimentalControls = options.enableExperimentalControls;
  this.el = options.el;
  this.pageProgression = options.pageProgression;
  this.protected = options.protected;
  this.getEmbedCode = options.getEmbedCode;
  this.popup = null;

  // Assign the data methods
  this.data = options.data;

  /** @type {{[name: string]: JQuery}} */
  this.refs = {};

  /** The book being displayed in BookReader*/
  this.book = new _BookReader_BookModel_js__WEBPACK_IMPORTED_MODULE_10__.BookModel(this);
  if (options.getNumLeafs) this.book.getNumLeafs = options.getNumLeafs.bind(this);
  if (options.getPageWidth) this.book.getPageWidth = options.getPageWidth.bind(this);
  if (options.getPageHeight) this.book.getPageHeight = options.getPageHeight.bind(this);
  if (options.getPageURI) this.book.getPageURI = options.getPageURI.bind(this);
  if (options.getPageSide) this.book.getPageSide = options.getPageSide.bind(this);
  if (options.getPageNum) this.book.getPageNum = options.getPageNum.bind(this);
  if (options.getPageProp) this.book.getPageProp = options.getPageProp.bind(this);
  if (options.getSpreadIndices) this.book.getSpreadIndices = options.getSpreadIndices.bind(this);
  if (options.leafNumToIndex) this.book.leafNumToIndex = options.leafNumToIndex.bind(this);

  /**
   * @private Components are 'subchunks' of bookreader functionality, usually UI related
   * They should be relatively decoupled from each other/bookreader.
   * Note there are no hooks right now; components just provide methods that bookreader
   * calls at the correct moments.
   **/
  this._components = {
    navbar: new _BookReader_Navbar_Navbar_js__WEBPACK_IMPORTED_MODULE_6__.Navbar(this),
    toolbar: new _BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar(this)
  };
  this._modes = {
    mode1Up: new _BookReader_Mode1Up_js__WEBPACK_IMPORTED_MODULE_11__.Mode1Up(this, this.book),
    mode2Up: new _BookReader_Mode2Up_js__WEBPACK_IMPORTED_MODULE_12__.Mode2Up(this, this.book),
    modeThumb: new _BookReader_ModeThumb__WEBPACK_IMPORTED_MODULE_13__.ModeThumb(this, this.book)
  };

  /** Stores classes which we want to expose (selectively) some methods as overridable */
  this._overrideable = {
    'book': this.book,
    '_components.navbar': this._components.navbar,
    '_components.toolbar': this._components.toolbar,
    '_modes.mode1Up': this._modes.mode1Up,
    '_modes.mode2Up': this._modes.mode2Up,
    '_modes.modeThumb': this._modes.modeThumb
  };

  // Construct the usual suspects first to get type hints
  this._plugins = {
    archiveAnalytics: BookReader.PLUGINS.archiveAnalytics ? new BookReader.PLUGINS.archiveAnalytics(this) : null,
    textSelection: BookReader.PLUGINS.textSelection ? new BookReader.PLUGINS.textSelection(this) : null
  };

  // Delete anything that's null
  for (const [pluginName, plugin] of Object.entries(this._plugins)) {
    if (!plugin) delete this._plugins[pluginName];
  }

  // Now construct the rest of the plugins
  for (const [pluginName, PluginClass] of Object.entries(BookReader.PLUGINS)) {
    if (this._plugins[pluginName] || !PluginClass) continue;
    this._plugins[pluginName] = new PluginClass(this);
  }

  // And call setup on them
  for (const [pluginName, plugin] of Object.entries(this._plugins)) {
    try {
      plugin.setup(this.options.plugins?.[pluginName] ?? {});
      // Write the options back; this way the plugin is the source of truth,
      // and BR just contains a reference to it.
      this.options.plugins[pluginName] = plugin.options;
    } catch (e) {
      console.error(`Error setting up plugin ${pluginName}`, e);
    }
  }

  /** Image cache for general image fetching */
  this.imageCache = new _BookReader_ImageCache_js__WEBPACK_IMPORTED_MODULE_14__.ImageCache(this.book, {
    useSrcSet: this.options.useSrcSet,
    reduceSet: this.reduceSet
  });

  /**
   * Flag if BookReader has "focus" for keyboard shortcuts
   * Initially true, set to false when:
   * - BookReader scrolled out of view
   * Set to true when:
   * - BookReader scrolled into view
   */
  this.hasKeyFocus = true;
};

/**
 * Get all the HTML Elements that are being/can be rendered.
 * Includes cached elements which might be rendered again.
 */
BookReader.prototype.getActivePageContainerElements = function () {
  let containerEls = Object.values(this._modes.mode2Up.mode2UpLit.pageContainerCache).map(pc => pc.$container[0]).concat(Object.values(this._modes.mode1Up.mode1UpLit.pageContainerCache).map(pc => pc.$container[0]));
  if (this.mode == this.constModeThumb) {
    containerEls = containerEls.concat(this.$('.BRpagecontainer').toArray());
  }
  return containerEls;
};

/**
 * Get the HTML Elements for the rendered page. Note there can be more than one, since
 * (at least as of writing) different modes can maintain different caches.
 * @param {PageIndex} pageIndex
 */
BookReader.prototype.getActivePageContainerElementsForIndex = function (pageIndex) {
  return [this._modes.mode2Up.mode2UpLit.pageContainerCache[pageIndex]?.$container?.[0], this._modes.mode1Up.mode1UpLit.pageContainerCache[pageIndex]?.$container?.[0], ...(this.mode == this.constModeThumb ? this.$(`.pagediv${pageIndex}`).toArray() : [])].filter(x => x);
};
Object.defineProperty(BookReader.prototype, 'activeMode', {
  /** @return {Mode1Up | Mode2Up | ModeThumb} */
  get() {
    return {
      1: this._modes.mode1Up,
      2: this._modes.mode2Up,
      3: this._modes.modeThumb
    }[this.mode];
  }
});

/**
 * BookReader.util are static library functions
 * At top of file so they can be used below
 */
BookReader.util = _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__;

/**
 * Helper to merge in params in to a params object.
 * It normalizes "page" into the "index" field to disambiguate and prevent concflicts
 * @private
 */
BookReader.prototype.extendParams = function (params, newParams) {
  const modifiedNewParams = $.extend({}, newParams);
  if ('undefined' != typeof modifiedNewParams.page) {
    const pageIndex = this.book.parsePageString(modifiedNewParams.page);
    if (!isNaN(pageIndex)) modifiedNewParams.index = pageIndex;
    delete modifiedNewParams.page;
  }
  $.extend(params, modifiedNewParams);
};

/**
 * Parses params from from various initialization contexts (url, cookie, options)
 * @private
 * @return {object} the parsed params
 */
BookReader.prototype.initParams = function () {
  const params = {};
  // Flag initializing for updateFromParams()
  params.init = true;

  // Flag if page given in defaults or URL (not cookie)
  // Used for overriding goToFirstResult in plugin.search.js
  // Note: extendParams() converts params.page to index and gets rid of page
  // so check and set before extendParams()
  params.pageFound = false;

  // True if changing the URL
  params.fragmentChange = false;

  // This is ordered from lowest to highest priority

  // If we have a title leaf, use that as the default instead of index 0,
  // but only use as default if book has a few pages
  if ('undefined' != typeof this.titleLeaf && this.book.getNumLeafs() > 2) {
    params.index = this.book.leafNumToIndex(this.titleLeaf);
  } else {
    params.index = 0;
  }

  // this.defaults is a string passed in the url format. eg "page/1/mode/1up"
  if (this.defaults) {
    const defaultParams = this.paramsFromFragment(this.defaults);
    if ('undefined' != typeof defaultParams.page) {
      params.pageFound = true;
    }
    this.extendParams(params, defaultParams);
  }

  // Check for Resume plugin
  if (this.options.enablePageResume) {
    // Check cookies
    const val = this.getResumeValue();
    if (val !== null) {
      // If page index different from default
      if (params.index !== val) {
        // Show in URL
        params.fragmentChange = true;
      }
      params.index = val;
    }
  }

  // Check for URL plugin
  if (this.options.enableUrlPlugin) {
    // Params explicitly set in URL take precedence over all other methods
    let urlParams = this.paramsFromFragment(this.urlReadFragment());

    // Get params if hash fragment available with 'history' urlMode
    const hasHashURL = !Object.keys(urlParams).length && this.urlReadHashFragment();
    if (hasHashURL && this.options.urlMode === 'history') {
      urlParams = this.paramsFromFragment(this.urlReadHashFragment());
    }

    // If there were any parameters
    if (Object.keys(urlParams).length) {
      if ('undefined' != typeof urlParams.page) {
        params.pageFound = true;
      }
      this.extendParams(params, urlParams);
      // Show in URL
      params.fragmentChange = true;
    }
  }

  // Check for Search plugin
  if (this.options.enableSearch) {
    // Go to first result only if no default or URL page
    this.options.goToFirstResult = !params.pageFound;

    // If initialSearchTerm not set
    if (!this.options.initialSearchTerm) {
      // Look for any term in URL
      if (params.search) {
        // Old style: /search/[term]
        this.options.initialSearchTerm = params.search;
        this.searchTerm = params.search;
      } else {
        // If we have a query string: q=[term]
        const searchParams = new URLSearchParams(this.readQueryString());
        const searchTerm = searchParams.get('q');
        if (searchTerm) {
          this.options.initialSearchTerm = _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__.decodeURIComponentPlus(searchTerm);
        }
      }
    }
  }

  // Set for init process, return to false at end of init()
  this.suppressFragmentChange = !params.fragmentChange;
  return params;
};

/**
 * Allow mocking of window.location.search
 */
BookReader.prototype.getLocationSearch = function () {
  return window.location.search;
};

/**
 * Allow mocking of window.location.hash
 */
BookReader.prototype.getLocationHash = function () {
  return window.location.hash;
};

/**
 * Return URL or fragment querystring
 */
BookReader.prototype.readQueryString = function () {
  const queryString = this.getLocationSearch();
  if (queryString) {
    return queryString;
  }
  const hash = this.getLocationHash();
  const found = hash.search(/\?\w+=/);
  return found > -1 ? hash.slice(found) : '';
};

/**
 * Determines the initial mode for starting if a mode is not already
 * present in the params argument
 * @param {object} params
 * @return {1 | 2 | 3} the initial mode
 */
BookReader.prototype.getInitialMode = function (params) {
  // if mobile breakpoint, we always show this.constMode1up mode
  const windowWidth = $(window).width();
  const isMobile = windowWidth && windowWidth <= this.onePageMinBreakpoint;
  let initialMode;
  if (params.mode) {
    initialMode = params.mode;
  } else if (isMobile) {
    initialMode = this.constMode1up;
  } else {
    initialMode = this.constMode2up;
  }
  if (!this.canSwitchToMode(initialMode)) {
    initialMode = this.constMode1up;
  }

  // override defaults mode via `options.defaults` metadata
  if (this.options.defaults) {
    try {
      initialMode = _modeStringToNumber(this.options.defaults);
    } catch (e) {
      // Can ignore this error
    }
  }
  return initialMode;
};

/**
 * Converts a mode string to a the mode numeric constant
 * @param {'mode/1up'|'mode/2up'|'mode/thumb'} modeString
 * @return {1 | 2 | 3}
 */
function _modeStringToNumber(modeString) {
  const MAPPING = {
    'mode/1up': 1,
    'mode/2up': 2,
    'mode/thumb': 3
  };
  if (!(modeString in MAPPING)) {
    throw new _BookReader_options_js__WEBPACK_IMPORTED_MODULE_7__.OptionsParseError(`Invalid mode string: ${modeString}`);
  }
  return MAPPING[modeString];
}

/**
 * This is called by the client to initialize BookReader.
 * It renders onto the DOM. It should only be called once.
 */
BookReader.prototype.init = function () {
  this.init.initComplete = false;
  this.pageScale = this.reduce; // preserve current reduce

  const params = this.initParams();
  this.firstIndex = params.index ? params.index : 0;

  // Setup Navbars and other UI
  this.isTouchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);
  this.refs.$br = $(this.el).empty().removeClass().addClass("ui-" + this.ui).addClass("br-ui-" + this.ui).addClass('BookReader');

  // Add a class if this is a touch enabled device
  if (this.isTouchDevice) {
    this.refs.$br.addClass("touch");
  } else {
    this.refs.$br.addClass("no-touch");
  }
  this.refs.$brContainer = $("<div class='BRcontainer' dir='ltr'></div>");
  this.refs.$br.append(this.refs.$brContainer);

  // Explicitly ensure params.mode exists for updateFromParams() below
  params.mode = this.getInitialMode(params);

  // Explicitly ensure this.mode exists for initNavbar() below
  this.mode = params.mode;

  // Display Navigation
  if (this.options.showToolbar) {
    this.initToolbar(this.mode, this.ui); // Build inside of toolbar div
  }
  if (this.options.showNavbar) {
    // default navigation
    this.initNavbar();
  }

  // Switch navbar controls on mobile/desktop
  this._components.navbar.switchNavbarControls();
  this.resizeBRcontainer();
  this.updateFromParams(params);
  this.initUIStrings();

  // Bind to events

  this.bindNavigationHandlers();
  this.setupKeyListeners();
  this.lastScroll = new Date().getTime();
  this.refs.$brContainer.on('scroll', this, function (e) {
    // Note, this scroll event fires for both user, and js generated calls
    // It is functioning in some cases as the primary triggerer for rendering
    e.data.lastScroll = new Date().getTime();
    if (e.data.constModeThumb == e.data.mode) {
      e.data.drawLeafsThrottled();
    }
  });
  if (this.options.autoResize) {
    $(window).on('resize', this, function (e) {
      e.data.resize();
    });
    $(window).on("orientationchange", this, function (e) {
      e.data.resize();
    }.bind(this));
  }
  if (this.protected) {
    this.$('.BRicon.share').hide();
  }

  // If not searching, set to allow on-going fragment changes
  if (!this.options.initialSearchTerm) {
    this.suppressFragmentChange = false;
  }
  if (this.options.startFullscreen) {
    this.enterFullscreen(true);
  }

  // Init plugins
  for (const [pluginName, plugin] of Object.entries(this._plugins)) {
    try {
      plugin.init();
    } catch (e) {
      console.error(`Error initializing plugin ${pluginName}`, e);
    }
  }
  this.init.initComplete = true;
  this.trigger(BookReader.eventNames.PostInit);

  // Must be called after this.init.initComplete set to true to allow
  // BookReader.prototype.resize to run.
};

/**
 * @param {EVENTS} name
 * @param {array | object} [props]
 */
BookReader.prototype.trigger = function (name, props = this) {
  const eventName = 'BookReader:' + name;
  _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__.polyfillCustomEvent(window);
  window.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    composed: true,
    detail: {
      props
    }
  }));
  $(document).trigger(eventName, props);
};
BookReader.prototype.bind = function (name, callback) {
  $(document).on('BookReader:' + name, callback);
};
BookReader.prototype.unbind = function (name, callback) {
  $(document).off('BookReader:' + name, callback);
};

/**
 * Resizes based on the container width and height
 */
BookReader.prototype.resize = function () {
  if (!this.init.initComplete) return;
  this.resizeBRcontainer();

  // Switch navbar controls on mobile/desktop
  this._components.navbar.switchNavbarControls();
  if (this.constMode1up == this.mode) {
    if (this.onePage.autofit != 'none') {
      this._modes.mode1Up.resizePageView();
      this.centerPageView();
    } else {
      this.centerPageView();
      this.displayedIndices = [];
      this.drawLeafsThrottled();
    }
  } else if (this.constModeThumb == this.mode) {
    this._modes.modeThumb.prepare();
  } else {
    this._modes.mode2Up.resizePageView();
  }
  this.trigger(BookReader.eventNames.resize);
};

/**
 * Binds keyboard and keyboard focus event listeners
 */
BookReader.prototype.setupKeyListeners = function () {
  // Keyboard focus by BookReader in viewport
  //
  // Intersection observer and callback sets BookReader keyboard
  // "focus" flag off when the BookReader is not in the viewport.
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio === 0) {
          this.hasKeyFocus = false;
        } else {
          this.hasKeyFocus = true;
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.05, 1]
    });
    observer.observe(this.refs.$br[0]);
  }

  // Keyboard listeners
  document.addEventListener('keydown', e => {
    // Ignore if BookReader "focus" flag not set
    if (!this.hasKeyFocus) {
      return;
    }

    // Ignore if modifiers are active.
    if (e.getModifierState('Control') || e.getModifierState('Alt') || e.getModifierState('Meta') || e.getModifierState('Win') /* hack for IE */) {
      return;
    }

    // Ignore in input elements
    if (_BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__.isInputActive()) {
      return;
    }

    // KeyboardEvent code values:
    //   https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
    switch (e.key) {
      // Page navigation
      case "Home":
        e.preventDefault();
        this.first();
        break;
      case "End":
        e.preventDefault();
        this.last();
        break;
      case "ArrowDown":
      case "PageDown":
      case "Down":
        // hack for IE and old Gecko
        // In 1up and thumb mode page scrolling handled by browser
        if (this.constMode2up === this.mode) {
          e.preventDefault();
          this.next();
        }
        break;
      case "ArrowUp":
      case "PageUp":
      case "Up":
        // hack for IE and old Gecko
        // In 1up and thumb mode page scrolling handled by browser
        if (this.constMode2up === this.mode) {
          e.preventDefault();
          this.prev();
        }
        break;
      case "ArrowLeft":
      case "Left":
        // hack for IE and old Gecko
        // No y-scrolling in thumb mode
        if (this.constModeThumb != this.mode) {
          e.preventDefault();
          this.left();
        }
        break;
      case "ArrowRight":
      case "Right":
        // hack for IE and old Gecko
        // No y-scrolling in thumb mode
        if (this.constModeThumb != this.mode) {
          e.preventDefault();
          this.right();
        }
        break;
      // Zoom
      case '-':
      case 'Subtract':
        e.preventDefault();
        this.zoom(-1);
        break;
      case '+':
      case '=':
      case 'Add':
        e.preventDefault();
        this.zoom(1);
        break;
      // Fullscreen
      case 'F':
      case 'f':
        e.preventDefault();
        this.toggleFullscreen();
        break;
    }
  });
};
BookReader.prototype.drawLeafs = function () {
  if (this.constMode1up == this.mode) {
    // Not needed for Mode1Up anymore
    return;
  } else {
    this.activeMode.drawLeafs();
  }
};

/**
 * @protected
 * @param {PageIndex} index
 */
BookReader.prototype._createPageContainer = function (index) {
  const pageContainer = new _BookReader_PageContainer_js__WEBPACK_IMPORTED_MODULE_15__.PageContainer(this.book.getPage(index, false), {
    isProtected: this.protected,
    imageCache: this.imageCache,
    loadingImage: this.imagesBaseURL + 'loading.gif'
  });

  // Call plugin handlers
  for (const plugin of Object.values(this._plugins)) {
    plugin._configurePageContainer(pageContainer);
  }
  return pageContainer;
};
BookReader.prototype.bindGestures = function (jElement) {
  // TODO support gesture change is only iOS. Support android.
  // HACK(2017-01-20) - Momentum scrolling is causing the scroll position
  // to jump after zooming in on mobile device. I am able to reproduce
  // when you move the book with one finger and then add another
  // finger to pinch. Gestures are aware of scroll state.

  const self = this;
  let numTouches = 1;
  jElement.unbind('touchmove').bind('touchmove', function (e) {
    if (e.originalEvent.cancelable) numTouches = e.originalEvent.touches.length;
    e.stopPropagation();
  });
  jElement.unbind('gesturechange').bind('gesturechange', function (e) {
    e.preventDefault();
    // These are two very important fixes to adjust for the scroll position
    // issues described below
    if (!(numTouches !== 2 || new Date().getTime() - self.lastScroll < 500)) {
      if (e.originalEvent.scale > 1.5) {
        self.zoom(1);
      } else if (e.originalEvent.scale < 0.6) {
        self.zoom(-1);
      }
    }
  });
};

/**
 * A throttled version of drawLeafs
 */
BookReader.prototype.drawLeafsThrottled = _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__.throttle(BookReader.prototype.drawLeafs, 250 // 250 ms gives quick feedback, but doesn't eat cpu
);

/**
 * @param {number} direction Pass 1 to zoom in, anything else to zoom out
 */
BookReader.prototype.zoom = function (direction) {
  if (direction == 1) {
    this.activeMode.zoom('in');
  } else {
    this.activeMode.zoom('out');
  }
  this._plugins.textSelection?.stopPageFlip(this.refs.$brContainer);
  return;
};

/**
 * Resizes the inner container to fit within the visible space to prevent
 * the top toolbar and bottom navbar from clipping the visible book
 *
 * @param { boolean } animate - optional
 * When used, BookReader will fill the main container with the book's content.
 * This is primarily for 1up view - a follow up animation to the nav animation
 * So resize isn't perceived sharp/jerky
 */
BookReader.prototype.resizeBRcontainer = function (animate) {
  if (animate) {
    this.refs.$brContainer.animate({
      top: this.getToolBarHeight(),
      bottom: this.getFooterHeight()
    }, this.constResizeAnimationDuration, 'linear');
  } else {
    this.refs.$brContainer.css({
      top: this.getToolBarHeight(),
      bottom: this.getFooterHeight()
    });
  }
};
BookReader.prototype.centerPageView = function () {
  const scrollWidth = this.refs.$brContainer.prop('scrollWidth');
  const clientWidth = this.refs.$brContainer.prop('clientWidth');
  if (scrollWidth > clientWidth) {
    this.refs.$brContainer.prop('scrollLeft', (scrollWidth - clientWidth) / 2);
  }
};

/**
 * Quantizes the given reduction factor to closest power of two from set from 12.5% to 200%
 * @param {number} reduce
 * @param {ReductionFactor[]} reductionFactors
 * @return {number}
 */
BookReader.prototype.quantizeReduce = function (reduce, reductionFactors) {
  let quantized = reductionFactors[0].reduce;
  let distance = Math.abs(reduce - quantized);
  for (let i = 1; i < reductionFactors.length; i++) {
    const newDistance = Math.abs(reduce - reductionFactors[i].reduce);
    if (newDistance < distance) {
      distance = newDistance;
      quantized = reductionFactors[i].reduce;
    }
  }
  return quantized;
};

/**
 * @param {number} currentReduce
 * @param {'in' | 'out' | 'auto' | 'height' | 'width'} direction
 * @param {ReductionFactor[]} reductionFactors Must be sorted
 * @returns {ReductionFactor}
 */
BookReader.prototype.nextReduce = function (currentReduce, direction, reductionFactors) {
  // XXX add 'closest', to replace quantize function

  if (direction === 'in') {
    let newReduceIndex = 0;
    for (let i = 1; i < reductionFactors.length; i++) {
      if (reductionFactors[i].reduce < currentReduce) {
        newReduceIndex = i;
      }
    }
    return reductionFactors[newReduceIndex];
  } else if (direction === 'out') {
    const lastIndex = reductionFactors.length - 1;
    let newReduceIndex = lastIndex;
    for (let i = lastIndex; i >= 0; i--) {
      if (reductionFactors[i].reduce > currentReduce) {
        newReduceIndex = i;
      }
    }
    return reductionFactors[newReduceIndex];
  } else if (direction === 'auto') {
    // If an 'auto' is specified, use that
    const autoMatch = reductionFactors.find(rf => rf.autofit == 'auto');
    if (autoMatch) return autoMatch;

    // Otherwise, choose the least reduction from height/width
    const candidates = reductionFactors.filter(({
      autofit
    }) => autofit == 'height' || autofit == 'width');
    let choice = null;
    for (let i = 0; i < candidates.length; i++) {
      if (choice === null || choice.reduce < candidates[i].reduce) {
        choice = candidates[i];
      }
    }
    if (choice) return choice;
  } else if (direction === 'height' || direction === 'width') {
    // Asked for specific autofit mode
    const match = reductionFactors.find(rf => rf.autofit == direction);
    if (match) return match;
  }
  return reductionFactors[0];
};

/**
 * @param {ReductionFactor} a
 * @param {ReductionFactor} b
 */
BookReader.prototype._reduceSort = (a, b) => a.reduce - b.reduce;

/**
 * Attempts to jump to page
 * @param {string}
 * @return {boolean} Returns true if page could be found, false otherwise.
 */
BookReader.prototype.jumpToPage = function (pageNum) {
  const pageIndex = this.book.parsePageString(pageNum);
  if ('undefined' != typeof pageIndex) {
    this.jumpToIndex(pageIndex);
    return true;
  }

  // Page not found
  return false;
};

/**
 * Check whether the specified index is currently displayed
 * @param {PageIndex} index
 */
BookReader.prototype._isIndexDisplayed = function (index) {
  return this.displayedIndices ? this.displayedIndices.includes(index) : this.currentIndex() == index;
};

/**
 * Changes the current page
 * @param {PageIndex} index
 * @param {number} [pageX]
 * @param {number} [pageY]
 * @param {boolean} [noAnimate]
 */
BookReader.prototype.jumpToIndex = function (index, pageX, pageY, noAnimate) {
  // Don't jump into specific unviewable page
  const page = this.book.getPage(index);
  if (!page.isViewable && page.unviewablesStart != page.index) {
    // If already in unviewable range, jump to end of that range
    const alreadyInPreview = this._isIndexDisplayed(page.unviewablesStart);
    const newIndex = alreadyInPreview ? page.findNext({
      combineConsecutiveUnviewables: true
    }).index : page.unviewablesStart;
    return this.jumpToIndex(newIndex, pageX, pageY, noAnimate);
  }
  this.trigger(BookReader.eventNames.stop);
  this.activeMode.jumpToIndex(index, pageX, pageY, noAnimate);
};

/**
 * Return mode or 1up if initial thumb
 * @param {number}
 */
BookReader.prototype.getPrevReadMode = function (mode) {
  if (mode === BookReader.constMode1up || mode === BookReader.constMode2up) {
    return mode;
  } else if (this.prevReadMode === null) {
    // Initial thumb, return 1up
    return BookReader.constMode1up;
  }
};

/**
 * Switches the mode (eg 1up 2up thumb)
 * @param {number}
 * @param {object} [options]
 * @param {boolean} [options.suppressFragmentChange = false]
 * @param {boolean} [options.onInit = false] - this
 */
BookReader.prototype.switchMode = function (mode, {
  suppressFragmentChange = false,
  init = false,
  pageFound = false
} = {}) {
  // Skip checks before init() complete
  if (this.init.initComplete) {
    if (mode === this.mode) {
      return;
    }
    if (!this.canSwitchToMode(mode)) {
      return;
    }
  }
  this.trigger(BookReader.eventNames.stop);
  this.prevReadMode = this.getPrevReadMode(this.mode);
  if (this.mode != mode) {
    this.activeMode.unprepare?.();
  }
  this.mode = mode;

  // reinstate scale if moving from thumbnail view
  if (this.pageScale !== this.reduce) {
    this.reduce = this.pageScale;
  }

  // $$$ TODO preserve center of view when switching between mode
  //     See https://bugs.edge.launchpad.net/gnubook/+bug/416682

  // XXX maybe better to preserve zoom in each mode
  if (this.constMode1up == mode) {
    this._modes.mode1Up.prepare();
  } else if (this.constModeThumb == mode) {
    this.reduce = this.quantizeReduce(this.reduce, this.reductionFactors);
    this._modes.modeThumb.prepare();
  } else {
    this._modes.mode2Up.prepare();
  }
  if (!(this.suppressFragmentChange || suppressFragmentChange)) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }
  const eventName = mode + 'PageViewSelected';
  this.trigger(BookReader.eventNames[eventName]);
  this._plugins.textSelection?.stopPageFlip(this.refs.$brContainer);
};
BookReader.prototype.updateBrClasses = function () {
  const modeToClass = {};
  modeToClass[this.constMode1up] = 'BRmode1up';
  modeToClass[this.constMode2up] = 'BRmode2up';
  modeToClass[this.constModeThumb] = 'BRmodeThumb';
  this.refs.$br.removeClass('BRmode1up BRmode2up BRmodeThumb').addClass(modeToClass[this.mode]);
  if (this.isFullscreen()) {
    this.refs.$br.addClass('fullscreenActive');
    $(document.body).addClass('BRfullscreenActive');
  } else {
    this.refs.$br.removeClass('fullscreenActive');
    $(document.body).removeClass('BRfullscreenActive');
  }
};
BookReader.prototype.isFullscreen = function () {
  return this.isFullscreenActive;
};

/**
 * Toggles fullscreen
 * @param { boolean } bindKeyboardControls
 */
BookReader.prototype.toggleFullscreen = async function (bindKeyboardControls = true) {
  if (this.isFullscreen()) {
    await this.exitFullScreen();
  } else {
    await this.enterFullscreen(bindKeyboardControls);
  }
};

/**
 * Enters fullscreen
 * including:
 * - binds keyboard controls
 * - fires custom event
 * @param { boolean } bindKeyboardControls
 */
BookReader.prototype.enterFullscreen = async function (bindKeyboardControls = true) {
  this.refs.$br.addClass('BRfullscreenAnimation');
  const currentIndex = this.currentIndex();
  if (bindKeyboardControls) {
    this._fullscreenCloseHandler = e => {
      if (e.keyCode === 27) this.toggleFullscreen();
    };
    $(document).on("keyup", this._fullscreenCloseHandler);
  }
  const windowWidth = $(window).width();
  if (windowWidth <= this.onePageMinBreakpoint) {
    this.switchMode(this.constMode1up);
  }
  this.isFullscreenActive = true;
  // prioritize class updates so CSS can propagate
  this.updateBrClasses();
  if (this.activeMode instanceof _BookReader_Mode1Up_js__WEBPACK_IMPORTED_MODULE_11__.Mode1Up) {
    this.activeMode.mode1UpLit.scale = this.activeMode.mode1UpLit.computeDefaultScale(this.book.getPage(currentIndex));
    // Need the new scale to be applied before calling jumpToIndex
    this.activeMode.mode1UpLit.requestUpdate();
    await this.activeMode.mode1UpLit.updateComplete;
  }
  this.jumpToIndex(currentIndex);
  this._plugins.textSelection?.stopPageFlip(this.refs.$brContainer);
  // Add "?view=theater"
  this.trigger(BookReader.eventNames.fragmentChange);
  // trigger event here, so that animations,
  // class updates happen before book-nav relays to web components
  this.trigger(BookReader.eventNames.fullscreenToggled);

  // resize book after all events & css updates
  await new Promise(resolve => setTimeout(resolve, 0));
  this.resize();
  this.refs.$br.removeClass('BRfullscreenAnimation');
};

/**
 * Exits fullscreen
 * - toggles fullscreen
 * - binds keyboard controls
 * - fires custom event
 * @param { boolean } bindKeyboardControls
 */
BookReader.prototype.exitFullScreen = async function () {
  this.refs.$br.addClass('BRfullscreenAnimation');
  $(document).off('keyup', this._fullscreenCloseHandler);
  const windowWidth = $(window).width();
  const canShow2up = this.options.controls.twoPage.visible;
  if (canShow2up && windowWidth <= this.onePageMinBreakpoint) {
    this.switchMode(this.constMode2up);
  }
  this.isFullscreenActive = false;
  // Trigger fullscreen event immediately
  // so that book-nav can relay to web components
  this.trigger(BookReader.eventNames.fullscreenToggled);
  this.updateBrClasses();
  await new Promise(resolve => setTimeout(resolve, 0));
  this.resize();
  if (this.activeMode instanceof _BookReader_Mode1Up_js__WEBPACK_IMPORTED_MODULE_11__.Mode1Up) {
    this.activeMode.mode1UpLit.scale = this.activeMode.mode1UpLit.computeDefaultScale(this.book.getPage(this.currentIndex()));
    this.activeMode.mode1UpLit.requestUpdate();
    await this.activeMode.mode1UpLit.updateComplete;
  }
  this._plugins.textSelection?.stopPageFlip(this.refs.$brContainer);
  // Remove "?view=theater"
  this.trigger(BookReader.eventNames.fragmentChange);
  this.refs.$br.removeClass('BRfullscreenAnimation');
};

/**
 * Returns the currently active index
 * @return {number}
 * @throws
 */
BookReader.prototype.currentIndex = function () {
  // $$$ we should be cleaner with our idea of which index is active in 1up/2up
  if (this.mode == this.constMode1up || this.mode == this.constModeThumb) {
    return this.firstIndex; // $$$ TODO page in center of view would be better
  } else if (this.mode == this.constMode2up) {
    // Only allow indices that are actually present in book
    return _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__.clamp(this.firstIndex, 0, this.book.getNumLeafs() - 1);
  } else {
    throw 'currentIndex called for unimplemented mode ' + this.mode;
  }
};

/**
 * Setter for this.firstIndex
 * Also triggers an event and updates the navbar slider position
 * @param {number} index
 * @param {object} [options]
 * @param {boolean} [options.suppressFragmentChange = false]
 */
BookReader.prototype.updateFirstIndex = function (index, {
  suppressFragmentChange = false
} = {}) {
  // If there's no change, do nothing
  if (this.firstIndex === index) return;
  this.firstIndex = index;
  if (!(this.suppressFragmentChange || suppressFragmentChange)) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }
  // If there's an initial search we stop suppressing global URL changes
  // when local suppression ends
  // This seems to correctly handle multiple calls during mode/1up
  if (this.options.initialSearchTerm && !suppressFragmentChange) {
    this.suppressFragmentChange = false;
  }
  this.trigger(BookReader.eventNames.pageChanged);

  // event to know if user is actively reading
  this.trigger(BookReader.eventNames.userAction);
  this._components.navbar.updateNavIndexThrottled(index);
};

/**
 * Flip the right page over onto the left
 */
BookReader.prototype.right = function () {
  if ('rl' != this.pageProgression) {
    this.next();
  } else {
    this.prev();
  }
};

/**
 * Flip to the rightmost page
 */
BookReader.prototype.rightmost = function () {
  if ('rl' != this.pageProgression) {
    this.last();
  } else {
    this.first();
  }
};

/**
 * Flip the left page over onto the right
 */
BookReader.prototype.left = function () {
  if ('rl' != this.pageProgression) {
    this.prev();
  } else {
    this.next();
  }
};

/**
 * Flip to the leftmost page
 */
BookReader.prototype.leftmost = function () {
  if ('rl' != this.pageProgression) {
    this.first();
  } else {
    this.last();
  }
};
BookReader.prototype.next = function ({
  triggerStop = true
} = {}) {
  if (this.constMode2up == this.mode) {
    if (triggerStop) this.trigger(BookReader.eventNames.stop);
    this._modes.mode2Up.mode2UpLit.flipAnimation('next');
  } else {
    if (this.firstIndex < this.book.getNumLeafs() - 1) {
      this.jumpToIndex(this.firstIndex + 1);
    }
  }
};
BookReader.prototype.prev = function ({
  triggerStop = true
} = {}) {
  const isOnFrontPage = this.firstIndex < 1;
  if (isOnFrontPage) return;
  if (this.constMode2up == this.mode) {
    if (triggerStop) this.trigger(BookReader.eventNames.stop);
    this._modes.mode2Up.mode2UpLit.flipAnimation('prev');
  } else {
    if (this.firstIndex >= 1) {
      this.jumpToIndex(this.firstIndex - 1);
    }
  }
};
BookReader.prototype.first = function () {
  this.jumpToIndex(0);
};
BookReader.prototype.last = function () {
  this.jumpToIndex(this.book.getNumLeafs() - 1);
};

/**
 * @template TClass extends { br: BookReader }
 * Helper method to expose a method onto BookReader from a composed class.
 * Only composed classes in BookReader._overridable can be exposed in this
 * way.
 * @param {new () => TClass} Class
 * @param {keyof BookReader['_overrideable']} classKey
 * @param {keyof TClass} method
 * @param {string} [brMethod]
 */
function exposeOverrideableMethod(Class, classKey, method, brMethod = method) {
  /** @type {function(TClass): BookReader} */
  const classToBr = cls => cls.br;
  /** @type {function(BookReader): TClass} */
  const brToClass = br => br._overrideable[classKey];
  (0,_BookReader_utils_classes_js__WEBPACK_IMPORTED_MODULE_5__.exposeOverrideable)(Class, method, classToBr, BookReader, brMethod, brToClass);
}

/***********************/
/** Navbar extensions **/
/***********************/
/** This cannot be removed yet because plugin.tts.js overrides it */
BookReader.prototype.initNavbar = _BookReader_Navbar_Navbar_js__WEBPACK_IMPORTED_MODULE_6__.Navbar.prototype.init;
exposeOverrideableMethod(_BookReader_Navbar_Navbar_js__WEBPACK_IMPORTED_MODULE_6__.Navbar, '_components.navbar', 'init', 'initNavbar');

/************************/
/** Toolbar extensions **/
/************************/
BookReader.prototype.buildToolbarElement = _BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar.prototype.buildToolbarElement;
exposeOverrideableMethod(_BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar, '_components.toolbar', 'buildToolbarElement');
BookReader.prototype.initToolbar = _BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar.prototype.initToolbar;
exposeOverrideableMethod(_BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar, '_components.toolbar', 'initToolbar');
BookReader.prototype.buildShareDiv = _BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar.prototype.buildShareDiv;
exposeOverrideableMethod(_BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar, '_components.toolbar', 'buildShareDiv');
BookReader.prototype.buildInfoDiv = _BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar.prototype.buildInfoDiv;
exposeOverrideableMethod(_BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar, '_components.toolbar', 'buildInfoDiv');
BookReader.prototype.getToolBarHeight = _BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar.prototype.getToolBarHeight;
exposeOverrideableMethod(_BookReader_Toolbar_Toolbar_js__WEBPACK_IMPORTED_MODULE_9__.Toolbar, '_components.toolbar', 'getToolBarHeight');

/**
 * Bind navigation handlers
 */
BookReader.prototype.bindNavigationHandlers = function () {
  const self = this;
  const jIcons = this.$('.BRicon');

  // Map of jIcon class -> click handler
  const navigationControls = {
    book_left: () => {
      this.trigger(BookReader.eventNames.stop);
      this.left();
    },
    book_right: () => {
      this.trigger(BookReader.eventNames.stop);
      this.right();
    },
    book_top: this.first.bind(this),
    book_bottom: this.last.bind(this),
    book_leftmost: this.leftmost.bind(this),
    book_rightmost: this.rightmost.bind(this),
    onepg: () => {
      this.switchMode(self.constMode1up);
    },
    thumb: () => {
      this.switchMode(self.constModeThumb);
    },
    twopg: () => {
      this.switchMode(self.constMode2up);
    },
    zoom_in: () => {
      this.trigger(BookReader.eventNames.stop);
      this.zoom(1);
      this.trigger(BookReader.eventNames.zoomIn);
    },
    zoom_out: () => {
      this.trigger(BookReader.eventNames.stop);
      this.zoom(-1);
      this.trigger(BookReader.eventNames.zoomOut);
    },
    full: () => {
      if (this.ui == 'embed') {
        const url = this.$('.BRembedreturn a').attr('href');
        window.open(url);
      } else {
        this.toggleFullscreen();
      }
    }
  };

  // custom event for auto-loan-renew in ia-book-actions
  // - to know if user is actively reading
  this.$('nav.BRcontrols li button').on('click', () => {
    this.trigger(BookReader.eventNames.userAction);
  });
  for (const control in navigationControls) {
    jIcons.filter(`.${control}`).on('click.bindNavigationHandlers', () => {
      navigationControls[control]();
      return false;
    });
  }
  const $brNavCntlBtmEl = this.$('.BRnavCntlBtm');
  const $brNavCntlTopEl = this.$('.BRnavCntlTop');
  this.$('.BRnavCntl').click(function () {
    const promises = [];
    // TODO don't use magic constants
    // TODO move this to a function
    if ($brNavCntlBtmEl.hasClass('BRdn')) {
      if (self.refs.$BRtoolbar) promises.push(self.refs.$BRtoolbar.animate({
        top: self.getToolBarHeight() * -1
      }).promise());
      promises.push(self.$('.BRfooter').animate({
        bottom: self.getFooterHeight() * -1
      }).promise());
      $brNavCntlBtmEl.addClass('BRup').removeClass('BRdn');
      $brNavCntlTopEl.addClass('BRdn').removeClass('BRup');
      self.$('.BRnavCntlBtm.BRnavCntl').animate({
        height: '45px'
      });
      self.$('.BRnavCntl').delay(1000).animate({
        opacity: .75
      }, 1000);
    } else {
      if (self.refs.$BRtoolbar) promises.push(self.refs.$BRtoolbar.animate({
        top: 0
      }).promise());
      promises.push(self.$('.BRfooter').animate({
        bottom: 0
      }).promise());
      $brNavCntlBtmEl.addClass('BRdn').removeClass('BRup');
      $brNavCntlTopEl.addClass('BRup').removeClass('BRdn');
      self.$('.BRnavCntlBtm.BRnavCntl').animate({
        height: '30px'
      });
      self.$('.BRvavCntl').animate({
        opacity: 1
      });
    }
    $.when.apply($, promises).done(function () {
      // Only do full resize in auto mode and need to recalc. size
      if (self.mode == self.constMode2up && self.twoPage.autofit != null && self.twoPage.autofit != 'none') {
        self.resize();
      } else if (self.mode == self.constMode1up && self.onePage.autofit != null && self.onePage.autofit != 'none') {
        self.resize();
      } else {
        // Don't do a full resize to avoid redrawing images
        self.resizeBRcontainer();
      }
    });
  });
  $brNavCntlBtmEl.on("mouseover", function () {
    if ($(this).hasClass('BRup')) {
      self.$('.BRnavCntl').animate({
        opacity: 1
      }, 250);
    }
  }).on("mouseleave", function () {
    if ($(this).hasClass('BRup')) {
      self.$('.BRnavCntl').animate({
        opacity: .75
      }, 250);
    }
  });
  $brNavCntlTopEl.on("mouseover", function () {
    if ($(this).hasClass('BRdn')) {
      self.$('.BRnavCntl').animate({
        opacity: 1
      }, 250);
    }
  }).on("mouseleave", function () {
    if ($(this).hasClass('BRdn')) {
      self.$('.BRnavCntl').animate({
        opacity: .75
      }, 250);
    }
  });
};

/**************************/
/** BookModel extensions **/
/**************************/
// Must modify petabox extension, which expects this on the prototype
// before removing.
BookReader.prototype.getPageURI = _BookReader_BookModel_js__WEBPACK_IMPORTED_MODULE_10__.BookModel.prototype.getPageURI;
exposeOverrideableMethod(_BookReader_BookModel_js__WEBPACK_IMPORTED_MODULE_10__.BookModel, 'book', 'getPageURI');

// Parameter related functions

/**
 * Update from the params object
 * @param {Object}
 */
BookReader.prototype.updateFromParams = function (params) {
  // Set init, fragment change options for switchMode()
  const {
    mode = 0,
    init = false,
    fragmentChange = false
  } = params;
  if (mode) {
    this.switchMode(mode, {
      init: init,
      suppressFragmentChange: !fragmentChange
    });
  }

  // $$$ process /zoom
  // We only respect page if index is not set
  if ('undefined' != typeof params.index) {
    if (params.index != this.currentIndex()) {
      this.jumpToIndex(params.index);
    }
  } else if ('undefined' != typeof params.page) {
    // $$$ this assumes page numbers are unique
    if (params.page != this.book.getPageNum(this.currentIndex())) {
      this.jumpToPage(params.page);
    }
  }

  // process /search
  // @deprecated for urlMode 'history'
  // Continues to work for urlMode 'hash'
  if (this.enableSearch && 'undefined' != typeof params.search) {
    if (this.searchTerm !== params.search) {
      this.$('.BRsearchInput').val(params.search);
    }
  }

  // $$$ process /region
  // $$$ process /highlight

  // $$$ process /theme
  if (this.enableThemesPlugin && 'undefined' != typeof params.theme) {
    this.updateTheme(params.theme);
  }
};

/**
 * Returns true if we can switch to the requested mode
 * @param {number} mode
 * @return {boolean}
 */
BookReader.prototype.canSwitchToMode = function (mode) {
  if (mode == this.constMode2up || mode == this.constModeThumb) {
    // check there are enough pages to display
    // $$$ this is a workaround for the mis-feature that we can't display
    //     short books in 2up mode
    if (this.book.getNumLeafs() < 2) {
      return false;
    }
  }
  return true;
};

/**
 * Returns the page URI or transparent image if out of range
 * Also makes the reduce argument optional
 * @param {number} index
 * @param {number} [reduce]
 * @param {number} [rotate]
 * @return {string}
 */
BookReader.prototype._getPageURI = function (index, reduce, rotate) {
  const page = this.book.getPage(index, false);
  // Synthesize page
  if (!page) return this.imagesBaseURL + "transparent.png";
  if ('undefined' == typeof reduce) {
    // reduce not passed in
    // $$$ this probably won't work for thumbnail mode
    reduce = page.height / this.twoPage.height;
  }
  return page.getURI(reduce, rotate);
};

/**
 * @param {string} msg
 * @param {function|undefined} onCloseCallback
 */
BookReader.prototype.showProgressPopup = function (msg, onCloseCallback) {
  if (this.popup) return;
  this.popup = document.createElement("div");
  $(this.popup).prop('className', 'BRprogresspopup');
  if (typeof onCloseCallback === 'function') {
    const closeButton = document.createElement('button');
    closeButton.setAttribute('title', 'close');
    closeButton.setAttribute('class', 'close-popup');
    const icon = document.createElement('span');
    icon.setAttribute('class', 'icon icon-close-dark');
    $(closeButton).append(icon);
    closeButton.addEventListener('click', () => {
      onCloseCallback();
      this.removeProgressPopup();
    });
    $(this.popup).append(closeButton);
  }
  const bar = document.createElement("div");
  $(bar).css({
    height: '20px'
  }).prop('className', 'BRprogressbar');
  $(this.popup).append(bar);
  if (msg) {
    const msgdiv = document.createElement("div");
    msgdiv.innerHTML = msg;
    $(this.popup).append(msgdiv);
  }
  $(this.popup).appendTo(this.refs.$br);
};
BookReader.prototype.removeProgressPopup = function () {
  $(this.popup).remove();
  this.$('.BRprogresspopup').remove();
  this.popup = null;
};

/**
 * Can be overridden
 */
BookReader.prototype.initUIStrings = function () {
  // Navigation handlers will be bound after all UI is in place -- makes moving icons between
  // the toolbar and nav bar easier

  // Setup tooltips -- later we could load these from a file for i18n
  const titles = {
    '.logo': 'Go to Archive.org',
    // $$$ update after getting OL record
    '.zoom_in': 'Zoom in',
    '.zoom_out': 'Zoom out',
    '.onepg': 'One-page view',
    '.twopg': 'Two-page view',
    '.thumb': 'Thumbnail view',
    '.print': 'Print this page',
    '.embed': 'Embed BookReader',
    '.link': 'Link to this book (and page)',
    '.bookmark': 'Bookmark this page',
    '.share': 'Share this book',
    '.info': 'About this book',
    '.full': 'Toggle fullscreen',
    '.book_left': 'Flip left',
    '.book_right': 'Flip right',
    '.play': 'Play',
    '.pause': 'Pause',
    '.BRdn': 'Show/hide nav bar',
    // Would have to keep updating on state change to have just "Hide nav bar"
    '.BRup': 'Show/hide nav bar',
    '.book_top': 'First page',
    '.book_bottom': 'Last page',
    '.book_leftmost': 'First page',
    '.book_rightmost': 'Last page'
  };
  if ('rl' == this.pageProgression) {
    titles['.book_leftmost'] = 'Last page';
    titles['.book_rightmost'] = 'First page';
  }
  for (const icon in titles) {
    this.$(icon).prop('title', titles[icon]);
  }
};

/**
 * Reloads images. Useful when some images might have failed.
 */
BookReader.prototype.reloadImages = function () {
  this.refs.$brContainer.find('img').each(function (index, elem) {
    if (!elem.complete || elem.naturalHeight === 0) {
      const src = elem.src;
      elem.src = '';
      setTimeout(function () {
        elem.src = src;
      }, 1000);
    }
  });
};

/**
 * @param {boolean} ignoreDisplay - bypass the display check
 * @return {number}
 */
BookReader.prototype.getFooterHeight = function () {
  const $heightEl = this.mode == this.constMode2up ? this.refs.$BRfooter : this.refs.$BRnav;
  if ($heightEl && this.refs.$BRfooter) {
    const outerHeight = $heightEl.outerHeight();
    const bottom = parseInt(this.refs.$BRfooter.css('bottom'));
    if (!isNaN(outerHeight) && !isNaN(bottom)) {
      return outerHeight + bottom;
    }
  }
  return 0;
};

// Basic Usage built-in Methods (can be overridden through options)
// This implementation uses options.data value for populating BookReader

/**
 * Create a params object from the current parameters.
 * @return {Object}
 */
BookReader.prototype.paramsFromCurrent = function () {
  const params = {};

  // Path params
  const index = this.currentIndex();
  const pageNum = this.book.getPageNum(index);
  if (pageNum === 0 || pageNum) {
    params.page = pageNum;
  }
  params.index = index;
  params.mode = this.mode;

  // Unused params
  // $$$ highlight
  // $$$ region

  // Querystring params
  // View
  const fullscreenView = 'theater';
  if (this.isFullscreenActive) {
    params.view = fullscreenView;
  }
  // Search
  if (this.enableSearch) {
    params.search = this.searchTerm;
  }
  return params;
};

/**
 * Return an object with configuration parameters from a fragment string.
 *
 * Fragments are formatted as a URL path but may be used outside of URLs as a
 * serialization format for BookReader parameters
 *
 * @see http://openlibrary.org/dev/docs/bookurls for fragment syntax
 *
 * @param {string} fragment initial # is allowed for backwards compatibility
 *                          but is deprecated
 * @return {Object}
 */
BookReader.prototype.paramsFromFragment = function (fragment) {
  const params = {};

  // For backwards compatibility we allow an initial # character
  // (as from window.location.hash) but don't require it
  if (fragment.substr(0, 1) == '#') {
    fragment = fragment.substr(1);
  }

  // Simple #nn syntax
  const oldStyleLeafNum = parseInt(/^\d+$/.exec(fragment));
  if (!isNaN(oldStyleLeafNum)) {
    params.index = oldStyleLeafNum;

    // Done processing if using old-style syntax
    return params;
  }

  // Split into key-value pairs
  const urlArray = fragment.split('/');
  const urlHash = {};
  for (let i = 0; i < urlArray.length; i += 2) {
    urlHash[urlArray[i]] = urlArray[i + 1];
  }

  // Mode
  if ('1up' == urlHash['mode']) {
    params.mode = this.constMode1up;
  } else if ('2up' == urlHash['mode']) {
    params.mode = this.constMode2up;
  } else if ('thumb' == urlHash['mode']) {
    params.mode = this.constModeThumb;
  }

  // Index and page
  if ('undefined' != typeof urlHash['page']) {
    // page was set -- may not be int
    params.page = decodeURIComponent(urlHash['page']);
  }

  // $$$ process /region
  // $$$ process /search

  if (urlHash['search'] != undefined) {
    params.search = _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__.decodeURIComponentPlus(urlHash['search']);
  }

  // $$$ process /highlight

  // $$$ process /theme
  if (urlHash['theme'] != undefined) {
    params.theme = urlHash['theme'];
  }
  return params;
};

/**
 * Create a fragment string from the params object.
 *
 * Fragments are formatted as a URL path but may be used outside of URLs as a
 * serialization format for BookReader parameters
 *
 * @see https://openlibrary.org/dev/docs/bookurls for fragment syntax
 *
 * @param {Object} params
 * @param {string} [urlMode]
 * @return {string}
 */
BookReader.prototype.fragmentFromParams = function (params, urlMode = 'hash') {
  const fragments = [];
  if ('undefined' != typeof params.page) {
    fragments.push('page', encodeURIComponent(params.page));
  } else {
    if ('undefined' != typeof params.index) {
      // Don't have page numbering but we do have the index
      fragments.push('page', 'n' + params.index);
    }
  }

  // $$$ highlight
  // $$$ region

  // mode
  if ('undefined' != typeof params.mode) {
    if (params.mode == this.constMode1up) {
      fragments.push('mode', '1up');
    } else if (params.mode == this.constMode2up) {
      fragments.push('mode', '2up');
    } else if (params.mode == this.constModeThumb) {
      fragments.push('mode', 'thumb');
    } else {
      throw 'fragmentFromParams called with unknown mode ' + params.mode;
    }
  }

  // search
  if (params.search && urlMode === 'hash') {
    fragments.push('search', _BookReader_utils_js__WEBPACK_IMPORTED_MODULE_4__.encodeURIComponentPlus(params.search));
  }
  return fragments.join('/');
};

/**
 * Create, update querystring from the params object
 *
 * Handles:
 *  view=
 *  q=
 * @param {Object} params
 * @param {string} currQueryString
 * @param {string} [urlMode]
 * @return {string}
 */
BookReader.prototype.queryStringFromParams = function (params, currQueryString, urlMode = 'hash') {
  const newParams = new URLSearchParams(currQueryString);
  if (params.view) {
    // Set ?view=theater when fullscreen
    newParams.set('view', params.view);
  } else {
    // Remove
    newParams.delete('view');
  }
  if (params.search && urlMode === 'history') {
    newParams.set('q', params.search);
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString
  // Note: This method returns the query string without the question mark.
  const result = newParams.toString();
  return result ? '?' + result : '';
};

/**
 * Helper to select within instance's elements
 */
BookReader.prototype.$ = function (selector) {
  return this.refs.$br.find(selector);
};
window.BookReader = BookReader;
}();
__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ })()
;
//# sourceMappingURL=BookReader.js.map