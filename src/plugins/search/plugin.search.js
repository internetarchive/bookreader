// @ts-check
/**
 * Plugin for Archive.org book search
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
import { marshallSearchResults } from './utils.js';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
/** @typedef {import('../../BookReader/PageContainer').PageContainer} PageContainer */
/** @typedef {import('../../BookReader/BookModel').PageIndex} PageIndex */
/** @typedef {import('../../BookReader/BookModel').LeafNum} LeafNum */
/** @typedef {import('../../BookReader/BookModel').PageNumString} PageNumString */

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

export class SearchPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    searchInsideProtocol: 'https',
    searchInsideUrl: '/fulltext/inside.php',
    searchInsidePreTag: '{{{',
    searchInsidePostTag: '}}}',
    /** @type {string} */
    initialSearchTerm: null,
    goToFirstResult: false,
  }

  /**
   * @override
   * @param {Partial<SearchPlugin['options']>} options
   **/
  setup(options) {
    super.setup(options);

    this.searchTerm = '';
    /** @type {SearchInsideResults | null} */
    this.searchResults = null;
    this.searchInsideUrl = this.options.searchInsideUrl;
    this.enabled = this.options.enabled;
    this.searchXHR = null;

    /** @type { {[pageIndex: number]: SearchInsideMatchBox[]} } */
    this._searchBoxesByIndex = {};

    if (this.enabled) {
      this.searchView = new SearchView({
        br: this.br,
        searchCancelledCallback: () => {
          this._cancelSearch();
          this.br.trigger('SearchCanceled', { term: this.searchTerm, instance: this.br });
        },
      });
    } else {
      this.searchView = null;
    }
  }

  /** @override */
  init() {
    super.init();

    if (!this.enabled) return;

    this.searchView.init();
    if (this.options.initialSearchTerm) {
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
        { goToFirstResult: this.options.goToFirstResult, suppressFragmentChange: false },
      );
    }
  }

  /**
   * @override
   * @protected
   * @param {JQuery<HTMLElement>} $toolbarElement
   */
  _configureToolbar($toolbarElement) {
    if (!this.enabled) { return; }
    if (this.searchView.dom.toolbarSearch) {
      $toolbarElement.find('.BRtoolbarSectionInfo').after(this.searchView.dom.toolbarSearch);
    }
    return $toolbarElement;
  }

  /**
   * @override
   * @param {import ("@/src/BookReader/PageContainer.js").PageContainer} pageContainer
   */
  _configurePageContainer(pageContainer) {
    if (this.enabled && pageContainer.page && pageContainer.page.index in this._searchBoxesByIndex) {
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
  }

  /**
   * Submits search request
   *
   * @param {string} term
   * @param {Partial<SearchOptions>} overrides
   */
  async search(term = '', overrides = {}) {
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
      this.br.trigger(BookReader.eventNames.fragmentChange);
    }

    // Add quotes to the term. This is to compenstate for the backends default OR query
    // term = term.replace(/['"]+/g, '');
    // term = '"' + term + '"';

    // Remove the port and userdir
    const serverPath = this.br.server.replace(/:.+/, '');
    const baseUrl = `${this.options.searchInsideProtocol}://${serverPath}${this.searchInsideUrl}?`;

    // Remove subPrefix from end of path
    let path = this.br.bookPath;
    const subPrefixWithSlash = `/${this.br.subPrefix}`;
    if (this.br.bookPath.length - this.br.bookPath.lastIndexOf(subPrefixWithSlash) == subPrefixWithSlash.length) {
      path = this.br.bookPath.substr(0, this.br.bookPath.length - subPrefixWithSlash.length);
    }

    const urlParams = {
      item_id: this.br.bookId,
      doc: this.br.subPrefix,
      path,
      q: term,
      pre_tag: this.options.searchInsidePreTag,
      post_tag: this.options.searchInsidePostTag,
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
          : this.BRSearchCallbackError(searchInsideResults);
      } else {
        hasCustomSuccess
          ? options.success.call(this, searchInsideResults, options)
          : this.BRSearchCallback(searchInsideResults, options);
      }
    };

    this.br.trigger('SearchStarted', { term: this.searchTerm, instance: this.br });
    callSearchResultsCallback(await $.ajax({
      url: url,
      cache: true,
      xhrFields: {
        withCredentials: this.br.protected,
      },
      beforeSend: xhr => { this.searchXHR = xhr; },
    }));
  }

  /**
   * cancels AJAX Call
   * emits custom event
   */
  _cancelSearch() {
    this.searchXHR?.abort();
    this.searchView.clearSearchFieldAndResults(false);
    this.searchTerm = '';
    this.searchXHR = null;
    this.searchCancelled = true;
    this.searchResults = null;
  }

  /**
   * External function to cancel search
   * checks for term & xhr in flight before running
   */
  cancelSearchRequest() {
    this.searchCancelled = true;
    if (this.searchXHR !== null) {
      this._cancelSearch();
      this.searchView.toggleSearchPending();
      this.br.trigger('SearchCanceled', { term: this.searchTerm, instance: this.br });
    }
  }

  /**
   * Search Results return handler
   * @param {SearchInsideResults} results
   * @param {object} options
   * @param {boolean} options.goToFirstResult
   */
  BRSearchCallback(results, options) {
    marshallSearchResults(
      results,
      pageNum => this.br.book.getPageNum(this.br.book.leafNumToIndex(pageNum)),
      this.options.searchInsidePreTag,
      this.options.searchInsidePostTag,
    );
    this.searchResults = results || null;

    this.updateSearchHilites();
    this.br.removeProgressPopup();
    if (options.goToFirstResult) {
      this.jumpToMatch(0);
    }
    this.br.trigger('SearchCallback', { results, options, instance: this.br });
  }

  /**
   * Main search results error handler
   * @param {SearchInsideResults} results
   */
  BRSearchCallbackError(results) {
    this._BRSearchCallbackError(results);
  }

  /**
   * @private draws search results error
   * @param {SearchInsideResults} results
   */
  _BRSearchCallbackError(results) {
    this.searchResults = results;
    const payload = {
      term: this.searchTerm,
      results,
      instance: this.br,
    };
    if (results.error) {
      this.br.trigger('SearchCallbackError', payload);
    } else if (0 == results.matches.length) {
      if (false === results.indexed) {
        this.br.trigger('SearchCallbackBookNotIndexed', payload);
        return;
      }
      this.br.trigger('SearchCallbackEmpty', payload);
    }
  }

  /**
   * updates search on-page highlights controller
   */
  updateSearchHilites() {
    /** @type {SearchInsideMatch[]} */
    const matches = this.searchResults?.matches || [];
    /** @type { {[pageIndex: number]: SearchInsideMatchBox[]} } */
    const boxesByIndex = {};

    // Clear any existing svg layers
    this.removeSearchHilites();

    // Group by pageIndex
    for (const match of matches) {
      for (const box of match.par[0].boxes) {
        const pageIndex = this.br.book.leafNumToIndex(box.page);
        const pageBoxes = boxesByIndex[pageIndex] || (boxesByIndex[pageIndex] = []);
        pageBoxes.push(box);
      }
    }

    // update any already created pages
    for (const [pageIndexString, boxes] of Object.entries(boxesByIndex)) {
      const pageIndex = parseFloat(pageIndexString);
      const page = this.br.book.getPage(pageIndex);
      const pageContainers = this.br.getActivePageContainerElementsForIndex(pageIndex);
      for (const container of pageContainers) {
        renderBoxesInPageContainerLayer('searchHiliteLayer', boxes, page, container, boxes.map(b => `match-index-${b.matchIndex}`));
      }
    }

    this._searchBoxesByIndex = boxesByIndex;
  }

  /**
   * remove search highlights
   */
  removeSearchHilites() {
    $(this.br.getActivePageContainerElements()).find('.searchHiliteLayer').remove();
  }

  /**
   * Goes to the page specified. If the page is not viewable, tries to load the page
   * FIXME Most of this logic is IA specific, and should be less integrated into here
   * or at least more configurable.
   * @param {number} matchIndex
   */
  async jumpToMatch(matchIndex) {
    const match = this.searchResults?.matches[matchIndex];
    const book = this.br.book;
    const pageIndex = book.leafNumToIndex(match.par[0].page);
    const page = book.getPage(pageIndex);
    const onNearbyPage = Math.abs(this.br.currentIndex() - pageIndex) < 3;
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
      this.br._modes.mode1Up.mode1UpLit.updatePages();
      if (this.br.activeMode == this.br._modes.mode1Up) {
        await this.br._modes.mode1Up.mode1UpLit.updateComplete;
      }
    }
    /* this updates the URL */
    if (!this.br._isIndexDisplayed(pageIndex)) {
      this.suppressFragmentChange = false;
      this.br.jumpToIndex(pageIndex);
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
        block: this.br.constMode1up == this.br.mode || this.br.isFullscreenActive ? 'center' : 'nearest',
        inline: 'center',
        behavior: onNearbyPage ? 'smooth' : 'auto',
      });
      // wait for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
      $boxes.removeAttr("style");
    }
  }

  /**
   * Removes all search pins
   */
  removeSearchResults(suppressFragmentChange = false) {
    this.removeSearchHilites(); //be sure to set all box.divs to null
    this.searchTerm = null;
    this.searchResults = null;
    if (!suppressFragmentChange) {
      this.br.trigger(BookReader.eventNames.fragmentChange);
    }
  }
}
BookReader?.registerPlugin('search', SearchPlugin);

/**
 * @typedef {object} SearchOptions
 * @property {boolean} goToFirstResult
 * @property {boolean} disablePopup
 * @property {boolean} suppressFragmentChange
 * @property {(null|function)} error (deprecated)
 * @property {(null|function)} success (deprecated)
 */

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
 * @property {string} html (computed field) The html-escaped raw html to display in the UI.
 * @property {string} text
 * @property {Array<{ page: number, boxes: SearchInsideMatchBox[] }>} par
 */

/**
 * @typedef {object} SearchInsideResults
 * @property {string} q
 * @property {string} error
 * @property {SearchInsideMatch[]} matches
 * @property {boolean} indexed
 */
