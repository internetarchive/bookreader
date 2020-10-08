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
 */
import SearchView from './view.js';

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
    this.goToFirstResult = false;

    // Base server used by some api calls
    this.bookId = options.bookId;
    this.server = options.server;
    this.subPrefix = options.subPrefix;
    this.bookPath = options.bookPath;

    if (this.searchView) { return; }
    this.searchView = new SearchView({
      br: this,
      selector: '#BRsearch_tray',
    });
  };
})(BookReader.prototype.setup);

/** @override */
BookReader.prototype.init = (function (super_) {
  return function () {
    super_.call(this);

    if (this.options.enableSearch && this.options.initialSearchTerm) {
      this.search(
        this.options.initialSearchTerm,
        { goToFirstResult: this.goToFirstResult, suppressFragmentChange: true }
      );
    }
  };
})(BookReader.prototype.init);

/** @override */
BookReader.prototype.buildMobileDrawerElement = (function (super_) {
  return function () {
    const $el = super_.call(this);
    if (!this.enableSearch) { return; }
    if (this.searchView.dom.mobileSearch) {
      $el.find('.BRmobileMenu__moreInfoRow').after(this.searchView.dom.mobileSearch);
    }
    return $el;
  };
})(BookReader.prototype.buildMobileDrawerElement);

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
BookReader.prototype.search = function(term = '', overrides = {}) {
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

  const processSearchResults = (searchInsideResults) => {
    const responseHasError = searchInsideResults.error || !searchInsideResults.matches.length;
    const hasCustomError = typeof options.error === 'function';
    const hasCustomSuccess = typeof options.success === 'function';

    if (responseHasError) {
      hasCustomError
        ? options.error.call(this, searchInsideResults, options)
        : this.BRSearchCallbackError(searchInsideResults, options);
    } else {
      hasCustomSuccess
        ? options.success.call(this, searchInsideResults, options)
        : this.BRSearchCallback(searchInsideResults, options);
    }
  };

  this.trigger('SearchStarted', { term: this.searchTerm });
  return $.ajax({
    url: url,
    dataType: 'jsonp'
  }).then(processSearchResults);
};

/**
  * @typedef {object} SearchInsideMatchBox
  * @property {number} page
  * @property {number} r
  * @property {number} l
  * @property {number} b
  * @property {number} t
  * @property {HTMLDivElement} [div]
  */

/**
 * @typedef {object} SearchInsideMatch
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
 * Search Results return handler
 * @callback
 * @param {SearchInsideResults} results
 * @param {object} options
 * @param {boolean} options.goToFirstResult
 */
BookReader.prototype.BRSearchCallback = function(results, options) {
  this.searchResults = results;

  this.updateSearchHilites();
  this.removeProgressPopup();
  if (options.goToFirstResult) {
    this._searchPluginGoToResult(results.matches[0].par[0].page);
  }
  this.trigger('SearchCallback', { results, options, instance: this });
}

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
  if (results.error) {
    this.trigger('SearchCallbackError', { term: this.searchTerm, results, instance: this });
  } else if (0 == results.matches.length) {
    if (false === results.indexed) {
      this.trigger('SearchCallbackBookNotIndexed', { term: this.searchTerm, instance: this });
      return;
    }
    this.trigger('SearchCallbackEmpty', { term: this.searchTerm, instance: this });
  }
};

/**
 * updates search on-page highlights controller
 */
BookReader.prototype.updateSearchHilites = function() {
  if (this.constMode2up == this.mode) {
    this.updateSearchHilites2UP();
    return;
  }
  this.updateSearchHilites1UP();
};

/**
 * update search on-page highlights in 1up mode
 */
BookReader.prototype.updateSearchHilites1UP = function() {
  const results = this.searchResults;
  if (null == results) return;
  results.matches.forEach(match => {
    match.par[0].boxes.forEach(box => {
      const pageIndex = this.leafNumToIndex(box.page);
      const pageIsInView = jQuery.inArray(pageIndex, this.displayedIndices) >= 0;
      if (pageIsInView) {
        if (!box.div) {
          //create a div for the search highlight, and stash it in the box object
          box.div = document.createElement('div');
          $(box.div).prop('className', 'BookReaderSearchHilite').appendTo(this.$(`.pagediv${pageIndex}`));
        }
        const highlight = {
          width:  `${(box.r - box.l) / this.reduce}px`,
          height: `${(box.b - box.t) / this.reduce}px`,
          left:   `${(box.l) / this.reduce}px`,
          top:    `${(box.t) / this.reduce}px`
        };
        $(box.div).css(highlight);
      } else {
        if (box.div) {
          $(box.div).remove();
          box.div = null;
        }
      }
    });
  });
};

/**
 * update search on-page highlights in 2up mode
 */
BookReader.prototype.updateSearchHilites2UP = function() {
  const results = this.searchResults;

  if (results === null) return;

  const { matches } = results;
  matches.forEach((match) => {
    match.par[0].boxes.forEach(box => {
      const pageIndex = this.leafNumToIndex(match.par[0].page);
      const pageIsInView = jQuery.inArray(pageIndex, this.displayedIndices) >= 0;
      const { isViewable } = this._models.book.getPage(pageIndex);

      if (pageIsInView && isViewable) {
        if (!box.div) {
          //create a div for the search highlight, and stash it in the box object
          box.div = document.createElement('div');
          $(box.div).addClass('BookReaderSearchHilite')
            .appendTo(this.refs.$brTwoPageView);
        }
        this.setHilightCss2UP(box.div, pageIndex, box.l, box.r, box.t, box.b);
      } else {
        // clear stale reference
        if (box.div) {
          $(box.div).remove();
          box.div = null;
        }
      }
    });
  });
};

/**
 * remove search highlights
 */
BookReader.prototype.removeSearchHilites = function() {
  const results = this.searchResults;
  if (null == results || !results.matches) { return; }
  results.matches.forEach(match => {
    match.par[0].boxes.forEach(box => {
      if (null != box.div) {
        $(box.div).remove();
        box.div = null;
      }
    });
  });
};

/**
 * @private
 * Goes to the page specified. If the page is not viewable, tries to load the page
 * FIXME Most of this logic is IA specific, and should be less integrated into here
 * or at least more configurable.
 * @param {PageIndex} pageIndex
 */
BookReader.prototype._searchPluginGoToResult = async function (pageIndex) {
  const { book } = this._models;
  const page = book.getPage(pageIndex);
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
  }
  this.jumpToIndex(pageIndex);

  // Reset it to unviewable if it wasn't resolved
  if (makeUnviewableAtEnd) {
    book.getPage(pageIndex).makeViewable(false);
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
      const pageIndex = this.leafNumToIndex(box.page);
      if (jQuery.inArray(pageIndex, visiblePages) >= 0) {
        return true;
      }
    });
  });

  return false;
};
