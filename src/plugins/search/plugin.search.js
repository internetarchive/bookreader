// @ts-check
/* global BookReader */
/**
 * Plugin for Archive.org book search
 * NOTE: This script must be loaded AFTER `plugin.mobile_nav.js`
 * as it mutates mobile nav drawer
 *
 * Events fired at various points throughout search processing are published
 * on the document DOM element. These can be subscribed to using jQuery's event
 * binding method `$.fn.on`. All of the events are prefixed with a BookReader
 * namespace. The events are:
 *
 * @event BookReader:SearchStarted - When a search form is submitted, immediately
 *   before an AJAX call is made to request search results
 * @event BookReader:SearchCallback - When the search AJAX call is returned and at
 *   least one result is returned. The event callback receives an object
 *   with the `results`, plugin `options`, and the BookReader `instance`
 * @event BookReader:SearchCallbackError - When the AJAX request returns an error.
 *   Receives the `results` and `instance`
 * @event BookReader:SearchCallbackNotIndexed - When a message is received that
 *   the book has not had OCR text indexed yet. Receives `instance`
 * @event BookReader:SearchCallbackEmpty - When no results found. Receives
 *   `instance`
 * @event BookReader:SearchCanceled - When no results found. Receives
 *   `instance`
 */
import { poll } from '../../BookReader/utils.js';
import { renderBoxesInPageContainerLayer } from '../../BookReader/PageContainer.js';
import SearchView from './view.js';
/** @typedef {import('../../BookReader/PageContainer').PageContainer} PageContainer */
/** @typedef {import('../../BookReader/BookModel').PageIndex} PageIndex */
/** @typedef {import('../../BookReader/BookModel').LeafNum} LeafNum */
/** @typedef {import('../../BookReader/BookModel').PageNumString} PageNumString */

jQuery.extend(BookReader.defaultOptions, {
  server: 'ia600609.us.archive.org',
  bookId: '',
  subPrefix: '',
  bookPath: '',
  enableSearch: true,
  searchInsideUrl: '/fulltext/inside.php',
  initialSearchTerm: null,
});

/** @override */
BookReader.prototype.setup = (function (super_) {
  return function (options) {
    super_.call(this, options);

    this.searchTerm = '';
    this.searchResults = null;
    this.searchInsideUrl = options.searchInsideUrl;
    this.enableSearch = options.enableSearch;

    // Base server used by some api calls
    this.bookId = options.bookId;
    this.server = options.server;
    this.subPrefix = options.subPrefix;
    this.bookPath = options.bookPath;

    this.searchXHR = null;
    this._cancelSearch.bind(this);
    this.cancelSearchRequest.bind(this);

    /** @type { {[pageIndex: number]: SearchInsideMatchBox[]} } */
    this._searchBoxesByIndex = {};

    this.searchView = undefined;
  };
})(BookReader.prototype.setup);

/** @override */
BookReader.prototype.init = (function (super_) {
  return function () {
    super_.call(this);
    // give SearchView the most complete bookreader state
    this.searchView = new SearchView({
      br: this,
      searchCancelledCallback: () => {
        this._cancelSearch();
        this.trigger('SearchCanceled', { term: this.searchTerm, instance: this });
      }
    });
    if (this.options.enableSearch && this.options.initialSearchTerm) {
      /**
       * this.search() take two parameter
       * 1. this.options.initialSearchTerm - search term
       * 2. {
       *  goToFirstResult: this.options.goToFirstResult,
       *  suppressFragmentChange: false // always want to change fragment in URL
       * }
       */
      this.search(
        this.options.initialSearchTerm,
        { goToFirstResult: this.options.goToFirstResult, suppressFragmentChange: false }
      );
    }
  };
})(BookReader.prototype.init);

/** @override */
BookReader.prototype.buildToolbarElement = (function (super_) {
  return function () {
    const $el = super_.call(this);
    if (!this.enableSearch) { return; }
    if (this.searchView.dom.toolbarSearch) {
      $el.find('.BRtoolbarSectionInfo').after(this.searchView.dom.toolbarSearch);
    }
    return $el;
  };
})(BookReader.prototype.buildToolbarElement);

/** @override */
BookReader.prototype._createPageContainer = (function (super_) {
  return function (index) {
    const pageContainer = super_.call(this, index);
    if (this.enableSearch && pageContainer.page && index in this._searchBoxesByIndex) {
      const pageIndex = pageContainer.page.index;
      const boxes = this._searchBoxesByIndex[pageIndex];
      renderBoxesInPageContainerLayer(
        'searchHiliteLayer',
        boxes,
        pageContainer.page,
        pageContainer.$container[0],
        boxes.map(b => `match-index-${b.matchIndex}`),
      );
    }
    return pageContainer;
  };
})(BookReader.prototype._createPageContainer);

/**
 * @typedef {object} SearchOptions
 * @property {boolean} goToFirstResult
 * @property {boolean} disablePopup
 * @property {(null|function)} error - @deprecated at v.5.0
 * @property {(null|function)} success - @deprecated at v.5.0
 */

/**
 * Submits search request
 *
 * @param {string} term
 * @param {SearchOptions} overrides
 */
BookReader.prototype.search = async function(term = '', overrides = {}) {
  /** @type {SearchOptions} */
  const defaultOptions = {
    goToFirstResult: false, /* jump to the first result (default=false) */
    disablePopup: false,    /* don't show the modal progress (default=false) */
    suppressFragmentChange: false, /* don't change the URL on initial load */
    error: null,            /* optional error handler (default=null) */
    success: null,          /* optional success handler (default=null) */

  };
  const options = jQuery.extend({}, defaultOptions, overrides);
  this.suppressFragmentChange = options.suppressFragmentChange;
  this.searchCancelled = false;

  // strip slashes, since this goes in the url
  this.searchTerm = term.replace(/\//g, ' ');

  if (!options.suppressFragmentChange) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }

  // Add quotes to the term. This is to compenstate for the backends default OR query
  // term = term.replace(/['"]+/g, '');
  // term = '"' + term + '"';

  // Remove the port and userdir
  const serverPath = this.server.replace(/:.+/, '');
  const baseUrl = `https://${serverPath}${this.searchInsideUrl}?`;

  // Remove subPrefix from end of path
  let path = this.bookPath;
  const subPrefixWithSlash = `/${this.subPrefix}`;
  if (this.bookPath.length - this.bookPath.lastIndexOf(subPrefixWithSlash) == subPrefixWithSlash.length) {
    path = this.bookPath.substr(0, this.bookPath.length - subPrefixWithSlash.length);
  }

  const urlParams = {
    item_id: this.bookId,
    doc: this.subPrefix,
    path,
    q: term,
  };

  // NOTE that the API does not expect / (slashes) to be encoded. (%2F) won't work
  const paramStr = $.param(urlParams).replace(/%2F/g, '/');

  const url = `${baseUrl}${paramStr}`;

  const callSearchResultsCallback = (searchInsideResults) => {
    if (this.searchCancelled) {
      return;
    }
    const responseHasError = searchInsideResults.error || !searchInsideResults.matches.length;
    const hasCustomError = typeof options.error === 'function';
    const hasCustomSuccess = typeof options.success === 'function';

    if (responseHasError) {
      console.error('Search Inside Response Error', searchInsideResults.error || 'matches.length == 0');
      hasCustomError
        ? options.error.call(this, searchInsideResults, options)
        : this.BRSearchCallbackError(searchInsideResults, options);
    } else {
      hasCustomSuccess
        ? options.success.call(this, searchInsideResults, options)
        : this.BRSearchCallback(searchInsideResults, options);
    }
  };

  this.trigger('SearchStarted', { term: this.searchTerm, instance: this });
  callSearchResultsCallback(await $.ajax({
    url: url,
    dataType: 'jsonp',
    cache: true,
    beforeSend: xhr => { this.searchXHR = xhr; },
  }));
};

/**
 * cancels AJAX Call
 * emits custom event
 */
BookReader.prototype._cancelSearch = function () {
  this.searchXHR?.abort();
  this.searchView.clearSearchFieldAndResults(false);
  this.searchTerm = '';
  this.searchXHR = null;
  this.searchCancelled = true;
  this.searchResults = [];
};

/**
 * External function to cancel search
 * checks for term & xhr in flight before running
 */
BookReader.prototype.cancelSearchRequest = function () {
  this.searchCancelled = true;
  if (this.searchXHR !== null) {
    this._cancelSearch();
    this.searchView.toggleSearchPending();
    this.trigger('SearchCanceled', { term: this.searchTerm, instance: this });
  }
};

/**
  * @typedef {object} SearchInsideMatchBox
  * @property {number} page
  * @property {number} r
  * @property {number} l
  * @property {number} b
  * @property {number} t
  * @property {HTMLDivElement} [div]
  * @property {number} matchIndex This is a fake field! not part of the API response. The index of the match that contains this box in total search results matches.
  */

/**
 * @typedef {object} SearchInsideMatch
 * @property {number} matchIndex This is a fake field! Not part of the API response. It is added by the JS.
 * @property {string} displayPageNumber (fake field) The page number as it should be displayed in the UI.
 * @property {string} text
 * @property {Array<{ page: number, boxes: SearchInsideMatchBox[] }>} par
 */

/**
 * @typedef {object} SearchInsideResults
 * @property {string} error
 * @property {SearchInsideMatch[]} matches
 * @property {boolean} indexed
 */

/**
 * Attach some fields to search inside results
 * @param {SearchInsideResults} results
 * @param {(pageNum: LeafNum) => PageNumString} displayPageNumberFn
 */
export function marshallSearchResults(results, displayPageNumberFn) {
  // Attach matchIndex to a few things to make it easier to identify
  // an active/selected match
  for (const [index, match] of results.matches.entries()) {
    match.matchIndex = index;
    match.displayPageNumber = displayPageNumberFn(match.par[0].page);
    for (const par of match.par) {
      for (const box of par.boxes) {
        box.matchIndex = index;
      }
    }
  }
}

/**
 * Search Results return handler
 * @param {SearchInsideResults} results
 * @param {object} options
 * @param {boolean} options.goToFirstResult
 */
BookReader.prototype.BRSearchCallback = function(results, options) {
  marshallSearchResults(results, pageNum => this.book.getPageNum(this.book.leafNumToIndex(pageNum)));
  this.searchResults = results || [];

  this.updateSearchHilites();
  this.removeProgressPopup();
  if (options.goToFirstResult) {
    this._searchPluginGoToResult(0);
  }
  this.trigger('SearchCallback', { results, options, instance: this });
};

/**
 * Main search results error handler
 * @callback
 * @param {SearchInsideResults} results
 */
BookReader.prototype.BRSearchCallbackError = function(results) {
  this._BRSearchCallbackError(results);
};

/**
 * @private draws search results error
 * @callback
 * @param {SearchInsideResults} results
 * @param {jQuery} $el
 * @param {boolean} fade
 */
BookReader.prototype._BRSearchCallbackError = function(results) {
  this.searchResults = results;
  const basePayload = {
    term: this.searchTerm,
    instance: this,
  };
  if (results.error) {
    const payload = Object.assign({}, basePayload, { results });
    this.trigger('SearchCallbackError', payload);
  } else if (0 == results.matches.length) {
    if (false === results.indexed) {
      this.trigger('SearchCallbackBookNotIndexed', basePayload);
      return;
    }
    this.trigger('SearchCallbackEmpty', basePayload);
  }
};

/**
 * updates search on-page highlights controller
 */
BookReader.prototype.updateSearchHilites = function() {
  /** @type {SearchInsideMatch[]} */
  const matches = this.searchResults?.matches || [];
  /** @type { {[pageIndex: number]: SearchInsideMatchBox[]} } */
  const boxesByIndex = {};

  // Clear any existing svg layers
  this.removeSearchHilites();

  // Group by pageIndex
  for (const match of matches) {
    for (const box of match.par[0].boxes) {
      const pageIndex = this.book.leafNumToIndex(box.page);
      const pageBoxes = boxesByIndex[pageIndex] || (boxesByIndex[pageIndex] = []);
      pageBoxes.push(box);
    }
  }

  // update any already created pages
  for (const [pageIndexString, boxes] of Object.entries(boxesByIndex)) {
    const pageIndex = parseFloat(pageIndexString);
    const page = this.book.getPage(pageIndex);
    const pageContainers = this.getActivePageContainerElementsForIndex(pageIndex);
    for (const container of pageContainers) {
      renderBoxesInPageContainerLayer('searchHiliteLayer', boxes, page, container, boxes.map(b => `match-index-${b.matchIndex}`));
    }
  }

  this._searchBoxesByIndex = boxesByIndex;
};

/**
 * remove search highlights
 */
BookReader.prototype.removeSearchHilites = function() {
  $(this.getActivePageContainerElements()).find('.searchHiliteLayer').remove();
};

/**
 * @private
 * Goes to the page specified. If the page is not viewable, tries to load the page
 * FIXME Most of this logic is IA specific, and should be less integrated into here
 * or at least more configurable.
 * @param {number} matchIndex
 */
BookReader.prototype._searchPluginGoToResult = async function (matchIndex) {
  const match = this.searchResults?.matches[matchIndex];
  const book = this.book;
  const pageIndex = book.leafNumToIndex(match.par[0].page);
  const page = book.getPage(pageIndex);
  const onNearbyPage = Math.abs(this.currentIndex() - pageIndex) < 3;
  let makeUnviewableAtEnd = false;
  if (!page.isViewable) {
    const resp = await fetch('/services/bookreader/request_page?' + new URLSearchParams({
      id: this.options.bookId,
      subprefix: this.options.subPrefix,
      leafNum: page.leafNum,
    })).then(r => r.json());

    for (const leafNum of resp.value) {
      book.getPage(book.leafNumToIndex(leafNum)).makeViewable();
    }

    // not able to show page; make the page viewable anyways so that it can
    // actually open. On IA, it has a fallback to a special error page.
    if (!resp.value.length) {
      book.getPage(pageIndex).makeViewable();
      makeUnviewableAtEnd = true;
    }

    // Trigger an update of book
    this._modes.mode1Up.mode1UpLit.updatePages();
    await this._modes.mode1Up.mode1UpLit.updateComplete;
  }
  /* this updates the URL */
  if (!this._isIndexDisplayed(pageIndex)) {
    this.suppressFragmentChange = false;
    this.jumpToIndex(pageIndex);
  }

  // Reset it to unviewable if it wasn't resolved
  if (makeUnviewableAtEnd) {
    book.getPage(pageIndex).makeViewable(false);
  }

  // Scroll/flash in the ui
  const $boxes = await poll(() => $(`rect.match-index-${match.matchIndex}`), { until: result => result.length > 0 });
  if ($boxes.length) {
    $boxes.css('animation', 'none');
    $boxes[0].scrollIntoView({
      // Only vertically center the highlight if we're in 1up or in full screen. In
      // 2up, if we're not fullscreen, the whole body gets scrolled around to try to
      // center the highlight 🙄 See:
      // https://stackoverflow.com/questions/11039885/scrollintoview-causing-the-whole-page-to-move/11041376
      // Note: nearest doesn't quite work great, because the ReadAloud toolbar is now
      // full-width, and covers up the last line of the highlight.
      block: this.constMode1up == this.mode || this.isFullscreenActive ? 'center' : 'nearest',
      inline: 'center',
      behavior: onNearbyPage ? 'smooth' : 'auto',
    });
    // wait for animation to start
    await new Promise(resolve => setTimeout(resolve, 100));
    $boxes.removeAttr("style");
  }
};

/**
 * Removes all search pins
 */
BookReader.prototype.removeSearchResults = function(suppressFragmentChange = false) {
  this.removeSearchHilites(); //be sure to set all box.divs to null
  this.searchTerm = null;
  this.searchResults = null;
  if (!suppressFragmentChange) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }
};

/**
 * Returns true if a search highlight is currently being displayed
 * @returns {boolean}
 */
BookReader.prototype.searchHighlightVisible = function() {
  const results = this.searchResults;
  let visiblePages = [];
  if (null == results) return false;

  if (this.constMode2up == this.mode) {
    visiblePages = [this.twoPage.currentIndexL, this.twoPage.currentIndexR];
  } else if (this.constMode1up == this.mode) {
    visiblePages = [this.currentIndex()];
  } else {
    return false;
  }

  results.matches.some(match => {
    return match.par[0].boxes.some(box => {
      const pageIndex = this.book.leafNumToIndex(box.page);
      if (jQuery.inArray(pageIndex, visiblePages) >= 0) {
        return true;
      }
    });
  });

  return false;
};
