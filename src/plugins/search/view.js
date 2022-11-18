import { escapeHTML } from "../../BookReader/utils.js";

class SearchView {
  /**
   * @param {object} params
   * @param {object} params.br The BookReader instance
   * @param {function} params.cancelSearch callback when a user wants to cancel search
   *
   * @event BookReader:SearchResultsCleared - when the search results nav gets cleared
   * @event BookReader:ToggleSearchMenu - when search results menu should toggle
   */
  constructor({ br, searchCancelledCallback = () => {} }) {
    this.br = br;

    // Search results are returned as a text blob with the hits wrapped in
    // triple mustaches. Hits occasionally include text beyond the search
    // term, so everything within the staches is captured and wrapped.
    this.matcher = new RegExp('{{{(.+?)}}}', 'gs');
    this.matches = [];
    this.cacheDOMElements();
    this.bindEvents();
    this.cancelSearch = searchCancelledCallback;
  }

  cacheDOMElements() {
    this.dom = {};
    // Search input within the top toolbar. Will be removed once the mobile menu is replaced.
    this.dom.toolbarSearch = this.buildToolbarSearch();
  }

  /**
   * @param {string} query
   */
  setQuery(query) {
    this.br.$('[name="query"]').val(query);
  }

  emptyMatches() {
    this.matches = [];
  }

  removeResultPins() {
    this.br.$('.BRnavpos .BRsearch').remove();
  }

  clearSearchFieldAndResults(dispatchEventWhenComplete = true) {
    this.br.removeSearchResults();
    this.removeResultPins();
    this.emptyMatches();
    this.setQuery('');
    this.teardownSearchNavigation();
    if (dispatchEventWhenComplete) {
      this.br.trigger('SearchResultsCleared');
    }
  }

  toggleSidebar() {
    this.br.trigger('ToggleSearchMenu');
  }

  renderSearchNavigation() {
    const selector = 'BRsearch-navigation';
    $('.BRnav').before(`
      <div class="${selector}">
        <button class="toggle-sidebar">
          <h4>
            <span class="icon icon-search"></span> Results
          </h4>
        </button>
        <div class="pagination">
          <button class="prev" title="Previous result"><span class="icon icon-chevron hflip"></span></button>
          <span data-id="resultsCount">${this.resultsPosition()}</span>
          <button class="next" title="Next result"><span class="icon icon-chevron"></button>
        </div>
        <button class="clear" title="Clear search results">
          <span class="icon icon-close"></span>
        </button>
      </div>
    `);
    this.dom.searchNavigation = $(`.${selector}`);
  }

  resultsPosition() {
    let positionMessage = `${this.matches.length} result${this.matches.length === 1 ? '' : 's'}`;
    if (~this.currentMatchIndex) {
      positionMessage = `${this.currentMatchIndex + 1} / ${this.matches.length}`;
    }
    return positionMessage;
  }

  bindSearchNavigationEvents() {
    if (!this.dom.searchNavigation) { return; }
    const namespace = 'searchNavigation';

    this.dom.searchNavigation
      .on(`click.${namespace}`, '.clear', this.clearSearchFieldAndResults.bind(this))
      .on(`click.${namespace}`, '.prev', this.showPrevResult.bind(this))
      .on(`click.${namespace}`, '.next', this.showNextResult.bind(this))
      .on(`click.${namespace}`, '.toggle-sidebar', this.toggleSidebar.bind(this))
      .on(`click.${namespace}`, false);
  }

  showPrevResult() {
    if (this.currentMatchIndex === 0) { return; }
    if (this.br.mode === this.br.constModeThumb) { this.br.switchMode(this.br.constMode1up); }
    if (!~this.currentMatchIndex) {
      this.currentMatchIndex = this.getClosestMatchIndex((start, end, comparator) => end[0] > comparator) + 1;
    }
    this.br.$('.BRnavline .BRsearch').eq(--this.currentMatchIndex).click();
    this.updateResultsPosition();
    this.updateSearchNavigationButtons();
  }

  showNextResult() {
    if (this.currentMatchIndex + 1 === this.matches.length) { return; }
    if (this.br.mode === this.br.constModeThumb) { this.br.switchMode(this.br.constMode1up); }
    if (!~this.currentMatchIndex) {
      this.currentMatchIndex = this.getClosestMatchIndex((start, end, comparator) => start[start.length - 1] > comparator) - 1;
    }
    this.br.$('.BRnavline .BRsearch').eq(++this.currentMatchIndex).click();
    this.updateResultsPosition();
    this.updateSearchNavigationButtons();
  }

  /**
   * Obtains closest match based on the logical comparison function passed in.
   * When the comparison function returns true, the starting (left) half of the
   * matches array is used in the binary split, else the ending (right) half is
   * used. A recursive call is made to perform the same split and comparison
   * on the winning half of the matches. This is traditionally known as binary
   * search (https://en.wikipedia.org/wiki/Binary_search_algorithm), and in
   * most cases (medium to large search result arrays) should outperform
   * traversing the array from start to finish. In the case of small arrays,
   * the speed difference is negligible.
   *
   * @param {function} comparisonFn
   * @return {number} matchIndex
   */
  getClosestMatchIndex(comparisonFn) {
    const matchPages = this.matches.map((m) => m.par[0].page);
    const currentPage = this.br.currentIndex() + 1;
    const closestTo = (pool, comparator) => {
      if (pool.length === 1) { return pool[0]; }
      const start = pool.slice(0, pool.length / 2);
      const end = pool.slice(pool.length / 2);
      return closestTo((comparisonFn(start, end, comparator) ? start : end), comparator);
    };

    const closestPage = closestTo(matchPages, currentPage);
    return this.matches.indexOf(this.matches.find((m) => m.par[0].page === closestPage));
  }

  updateResultsPosition() {
    if (!this.dom.searchNavigation) return;
    this.dom.searchNavigation.find('[data-id=resultsCount]').text(this.resultsPosition());
  }

  updateSearchNavigationButtons() {
    if (!this.dom.searchNavigation) return;
    this.dom.searchNavigation.find('.prev').attr('disabled', !this.currentMatchIndex);
    this.dom.searchNavigation.find('.next').attr('disabled', this.currentMatchIndex + 1 === this.matches.length);
  }

  teardownSearchNavigation() {
    if (!this.dom.searchNavigation) {
      this.dom.searchNavigation = $('.BRsearch-navigation');
    }
    if (!this.dom.searchNavigation.length) { return; }

    this.dom.searchNavigation.off('.searchNavigation').remove();
    this.dom.searchNavigation = null;
    this.br.resize();
  }

  setCurrentMatchIndex() {
    let matchingSearchResult;
    if (this.br.mode === this.br.constModeThumb) {
      this.currentMatchIndex = -1;
      return;
    }
    if (this.br.mode === this.br.constMode2up) {
      matchingSearchResult = this.find2upMatchingSearchResult();
    }
    else {
      matchingSearchResult = this.find1upMatchingSearchResult();
    }
    this.currentMatchIndex = this.matches.indexOf(matchingSearchResult);
  }

  find1upMatchingSearchResult() {
    return this.matches.find((m) => this.br.currentIndex() === m.par[0].page - 1);
  }

  find2upMatchingSearchResult() {
    return this.matches.find((m) => this.br._isIndexDisplayed(m.par[0].page - 1));
  }

  updateSearchNavigation() {
    if (!this.matches.length) { return; }

    this.setCurrentMatchIndex();
    this.updateResultsPosition();
    this.updateSearchNavigationButtons();
  }

  /**
   * @param {boolean} bool
   */
  togglePinsFor(bool) {
    const pinsVisibleState = bool ? 'visible' : 'hidden';
    this.br.refs.$BRfooter.find('.BRsearch').css({ visibility: pinsVisibleState });
  }

  buildToolbarSearch() {
    const toolbarSearch = document.createElement('span');
    toolbarSearch.classList.add('BRtoolbarSection', 'BRtoolbarSectionSearch');
    toolbarSearch.innerHTML = `
      <form class="BRbooksearch desktop">
        <input type="search" name="query" class="BRsearchInput" value="" placeholder="Search inside"/>
        <button type="submit" class="BRsearchSubmit">
          <img src="${this.br.imagesBaseURL}icon_search_button.svg" />
        </button>
      </form>
    `;
    return toolbarSearch;
  }

  /**
   * @param {array} matches
   */
  renderPins(matches) {
    matches.forEach((match) => {
      const queryString = match.text;
      const pageIndex = this.br.book.leafNumToIndex(match.par[0].page);
      const uiStringSearch = "Search result"; // i18n

      const percentThrough = this.br.constructor.util.cssPercentage(pageIndex, this.br.book.getNumLeafs() - 1);

      const escapedQueryString = escapeHTML(queryString);
      const queryStringWithB = escapedQueryString.replace(this.matcher, '<b>$1</b>');

      let queryStringWithBTruncated = '';

      if (queryString.length > 100) {
        queryStringWithBTruncated = queryString.replace(/^(.{100}[^\s]*).*/, "$1");

        // If truncating, we must escape *after* truncation occurs (but before wrapping in <b>)
        queryStringWithBTruncated = escapeHTML(queryStringWithBTruncated)
          .replace(this.matcher, '<b>$1</b>')
          + '...';
      }

      // draw marker
      $('<div>')
        .addClass('BRsearch')
        .css({
          left: percentThrough,
        })
        .attr('title', uiStringSearch)
        .append(`
          <div class="BRquery">
            <div>${queryStringWithBTruncated || queryStringWithB}</div>
            <div>Page ${match.displayPageNumber}</div>
          </div>
        `)
        .appendTo(this.br.$('.BRnavline'))
        .on("mouseenter", (event) => {
          // remove from other markers then turn on just for this
          // XXX should be done when nav slider moves
          const marker = event.currentTarget;
          const tooltip = marker.querySelector('.BRquery');
          const tooltipOffset = tooltip.getBoundingClientRect();
          const targetOffset = marker.getBoundingClientRect();
          const boxSizeAdjust = parseInt(getComputedStyle(tooltip).paddingLeft) * 2;
          if (tooltipOffset.x - boxSizeAdjust < 0) {
            tooltip.style.setProperty('transform', `translateX(-${targetOffset.left - boxSizeAdjust}px)`);
          }
          $('.BRsearch,.BRchapter').removeClass('front');
          $(event.target).addClass('front');
        })
        .on("mouseleave", (event) => $(event.target).removeClass('front'))
        .on("click", () => { this.br._searchPluginGoToResult(match.matchIndex); });
    });
  }

  /**
   * @param {boolean} bool
   */
  toggleSearchPending(bool) {
    if (bool) {
      this.br.showProgressPopup("Search results will appear below...", () => this.progressPopupClosed());
    }
    else {
      this.br.removeProgressPopup();
    }
  }

  /**
   * Primary callback when user cancels search popup
   */
  progressPopupClosed() {
    this.toggleSearchPending();
    this.cancelSearch();
  }

  renderErrorModal(textIsProcessing = false) {
    const errorDetails = `${!textIsProcessing ? 'The text may still be processing. ' : ''}Please try again.`;
    this.renderModalMessage(`
      Sorry, there was an error with your search.
      <br />
      ${errorDetails}
    `);
    this.delayModalRemovalFor(4000);
  }

  renderBookNotIndexedModal() {
    this.renderModalMessage(`
      <p>
         This book hasn't been indexed for searching yet.
         We've just started indexing it, so search should be available soon.
         <br />
         Please try again later. Thanks!
      </p>
    `);
    this.delayModalRemovalFor(5000);
  }

  renderResultsEmptyModal() {
    this.renderModalMessage('No matches were found.');
    this.delayModalRemovalFor(2000);
  }

  /**
   * @param {string} messageHTML The innerHTML string used to popupate the modal contents
   */
  renderModalMessage(messageHTML) {
    const modal = document.createElement('div');
    modal.classList.add('BRprogresspopup', 'search_modal');
    modal.innerHTML = messageHTML;
    document.querySelector(this.br.el).append(modal);
  }

  /**
   * @param {number} timeoutMS
   */
  delayModalRemovalFor(timeoutMS) {
    setTimeout(this.br.removeProgressPopup.bind(this.br), timeoutMS);
  }

  /**
   * @param {Event} e
   */
  submitHandler(e) {
    e.preventDefault();
    const query = e.target.querySelector('[name="query"]').value;
    if (!query.length) { return false; }
    this.br.search(query);
    this.emptyMatches();
    this.toggleSearchPending(true);
    return false;
  }

  /**
   * @param {Event} e
   * @param {object} properties
   *   @param {object} properties.results
   *   @param {object} properties.options
   */
  handleSearchCallback(e, { results, options }) {
    this.matches = results.matches;
    this.setCurrentMatchIndex();
    this.teardownSearchNavigation();
    this.renderSearchNavigation();
    this.bindSearchNavigationEvents();
    this.renderPins(results.matches);
    this.toggleSearchPending(false);
    if (options.goToFirstResult) {
      $(document).one('BookReader:pageChanged', () => {
        this.br.resize();
      });
    } else {
      this.br.resize();
    }
  }

  /**
   * @param {Event} e
   */
  handleNavToggledCallback(e) {
    const is_visible = this.br.navigationIsVisible();
    this.togglePinsFor(is_visible);
  }

  handleSearchStarted() {
    this.emptyMatches();
    this.br.removeSearchHilites();
    this.removeResultPins();
    this.toggleSearchPending(true);
    this.teardownSearchNavigation();
    this.setQuery(this.br.searchTerm);
  }

  /**
   * Event listener for: `BookReader:SearchCallbackError`
   * @param {CustomEvent} event
   */
  handleSearchCallbackError(event = {}) {
    this.toggleSearchPending(false);
    const isIndexed = event?.detail?.props?.results?.indexed;
    this.renderErrorModal(isIndexed);
  }

  handleSearchCallbackBookNotIndexed() {
    this.toggleSearchPending(false);
    this.renderBookNotIndexedModal();
  }

  handleSearchCallbackEmpty() {
    this.toggleSearchPending(false);
    this.renderResultsEmptyModal();
  }

  bindEvents() {
    const namespace = 'BookReader:';

    window.addEventListener(`${namespace}SearchCallbackError`, this.handleSearchCallbackError.bind(this));
    $(document).on(`${namespace}SearchCallback`, this.handleSearchCallback.bind(this))
      .on(`${namespace}navToggled`, this.handleNavToggledCallback.bind(this))
      .on(`${namespace}SearchStarted`, this.handleSearchStarted.bind(this))
      .on(`${namespace}SearchCallbackBookNotIndexed`, this.handleSearchCallbackBookNotIndexed.bind(this))
      .on(`${namespace}SearchCallbackEmpty`, this.handleSearchCallbackEmpty.bind(this))
      .on(`${namespace}pageChanged`, this.updateSearchNavigation.bind(this));

    this.dom.toolbarSearch.querySelector('form').addEventListener('submit', this.submitHandler.bind(this));
  }
}

export default SearchView;
