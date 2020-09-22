class SearchView {
  /**
   * @param {object} params
   *   @param {string} params.selector A selector for the element that the search tray will be rendered in
   *   @param {string} params.query An existing query string
   *   @param {object} params.br The BookReader instance
   */
  constructor(params) {
    if (!params.selector) {
      console.warn('BookReader::Search - SearchView must be passed a valid CSS selector');
      return;
    }

    this.br = params.br;

    // Search results are returned as a text blob with the hits wrapped in
    // triple mustaches. Hits occasionally include text beyond the search
    // term, so everything within the staches is captured and wrapped.
    this.matcher = new RegExp('{{{(.+?)}}}', 'g');
    this.cacheDOMElements(params.selector);
    this.bindEvents();

    if (this.br.options.initialSearchTerm) {
      this.setQuery(params.query);
    }
  }

  /**
   * @param {string} selector A selector for the element that the search tray will be rendered in
   */
  cacheDOMElements(selector) {
    this.dom = {};

    // The parent search tray in mobile menu
    this.dom.searchTray = this.renderSearchTray(selector);
    // Container for rendered search results
    this.dom.results = this.dom.searchTray.querySelector('[data-id="results"]');
    // Element used to display number of results
    this.dom.resultsCount = this.dom.searchTray.querySelector('[data-id="results_count"]');
    // Search input within the mobile search tray
    this.dom.searchField = this.dom.searchTray.querySelector('[name="query"]');
    // Waiting indicator displayed while waiting for a search request
    this.dom.searchPending = this.dom.searchTray.querySelector('[data-id="searchPending"]');
    // The element added to the mobile menu that is animated into view when
    // the "search" nav item is clicked
    this.dom.mobileSearch = this.buildMobileDrawer();
    // Search input within the top toolbar. Will be removed once the mobile menu is replaced.
    this.dom.toolbarSearch = this.buildToolbarSearch();
  }

  /**
   * @param {boolean} bool
   */
  toggleSearchTray(bool = this.dom.searchTray.classList.contains('hidden')) {
    this.dom.searchTray.classList.toggle('hidden', !bool);
  }

  /**
   * @param {boolean} bool
   */
  toggleResultsCount(bool) {
    this.dom.resultsCount.classList.toggle('visible', bool);
  }

  /**
   * @param {SearchInsideResults} results
   */
  updateResultsCount(results) {
    this.dom.resultsCount.innerText = `(${results} result${results != 1 ? 's' : ''})`;
    this.toggleResultsCount(true);
  }

  /**
   * @param {string} query
   */
  setQuery(query) {
    this.dom.searchField.value = query;
  }

  emptyMatches() {
    this.dom.results.innerHTML = '';
  }

  removeResultPins() {
    this.br.$('.BRnavpos .BRsearch').remove();
  }

  clearSearchFieldAndResults() {
    this.toggleResultsCount(false);
    this.removeResultPins();
    this.emptyMatches();
    this.setQuery('');
  }

  /**
   * @param {string} selector The ID attribute to be used for the search tray
   */
  renderSearchTray(selector) {
    const searchTray = document.createElement('div');
    searchTray.setAttribute('id', selector.replace(/^#/, ''));
    searchTray.innerHTML = `
      <header>
        <div>
          <h3>Search inside</h3>
          <p data-id="results_count"></p>
        </div>
        <a href="#" class="close"></a>
      </header>
      <form action="" method="get">
        <fieldset>
          <input name="all_files" id="all_files" type="checkbox" />
          <label class="checkbox" for="all_files">Search all files</label>
          <input type="search" name="query" placeholder="Enter a search term" />
        </fieldset>
      </form>
      <div data-id="searchPending" id="search_pending">
        <p>Your search results will appear below</p>
        <div class="loader tc mt20"></div>
      </div>
      <ul data-id="results"></ul>
    `;
    return searchTray;
  }

  /**
   * @param {array} matches
   */
  renderMatches(matches) {
    const items = matches.map((match) => `
      <li data-page="${match.par[0].page}" data-page-index="${this.br.leafNumToIndex(match.par[0].page)}">
        <h4>Page ${match.par[0].page}</h4>
        <p>${match.text.replace(this.matcher, '<mark>$1</mark>')}</p>
      </li>
    `);
    this.dom.results.innerHTML = items.join('');
  }

  /**
   * @param {boolean} bool
   */
  togglePinsFor(bool) {
    const pinsVisibleState = bool ? 'visible' : 'hidden';
    this.br.refs.$BRfooter.find('.BRsearch').css({ visibility: pinsVisibleState });
  }

  buildMobileDrawer() {
    const mobileSearch = document.createElement('li');
    mobileSearch.innerHTML = `
      <span>
        <span class="DrawerIconWrapper">
          <img class="DrawerIcon" src="${this.br.imagesBaseURL}icon_search_button.svg" />
        </span>
        Search
      </span>
      <div data-id="search_slot">
      </div>
    `;
    mobileSearch.querySelector('[data-id="search_slot"]').appendChild(this.dom.searchTray);
    mobileSearch.classList.add('BRmobileMenu__search');
    return mobileSearch;
  }

  buildToolbarSearch() {
    const toolbarSearch = document.createElement('span');
    toolbarSearch.classList.add('BRtoolbarSection', 'BRtoolbarSectionSearch');
    toolbarSearch.innerHTML = `
      <form class="BRbooksearch desktop">
        <input type="search" name="query" class="BRsearchInput" val="" placeholder="Search inside"/>
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
      const pageIndex = this.br.leafNumToIndex(match.par[0].page);
      const pageNumber = this.br.getPageNum(pageIndex);
      const uiStringSearch = "Search result"; // i18n
      const uiStringPage = "Page"; // i18n

      const percentThrough = this.br.constructor.util.cssPercentage(pageIndex, this.br.getNumLeafs() - 1);

      const queryStringWithB = queryString.replace(this.matcher, '<b>$1</b>');

      let queryStringWithBTruncated = '';

      if (queryString.length > 100) {
        queryStringWithBTruncated = queryString
          .replace(/^(.{100}[^\s]*).*/, "$1")
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
            <div>${uiStringPage} ${pageNumber}</div>
          </div>
        `)
        .data({ pageIndex })
        .appendTo(this.br.$('.BRnavline'))
        .hover(
          (event) => {
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
          },
          (event) => $(event.target).removeClass('front'))
        .click(function (event) {
          // closures are nested and deep, using an arrow function breaks references.
          // Todo: update to arrow function & clean up closures
          // to remove `bind` dependency
          this.br._searchPluginGoToResult(+$(event.target).data('pageIndex'));
          this.br.updateSearchHilites();
        }.bind(this));
    });
  }

  /**
   * @param {boolean} bool
   */
  toggleSearchPending(bool) {
    this.dom.searchPending.classList.toggle('visible', bool);
    if (bool) {
      this.br.showProgressPopup(
        `<img class="searchmarker" src="${this.br.imagesBaseURL}marker_srch-on.svg" />
        Search results will appear below...`
      );
    }
    else {
      this.br.removeProgressPopup();
    }
  }

  renderErrorModal() {
    this.renderModalMessage('Sorry, there was an error with your search.<br />The text may still be processing.');
    this.delayModalRemovalFor(4000);
  }

  renderBookNotIndexedModal() {
    this.renderModalMessage(`
      <p>
         This book hasn't been indexed for searching yet.
         We've just started indexing it, so search should be available soon.
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

  openMobileMenu() {
    this.br.refs.$mmenu.data('mmenu').open();
  }

  closeMobileMenu() {
    this.br.refs.$mmenu.data('mmenu').close();
  }

  /**
   * @param {Event} e
   */
  submitHandler(e) {
    e.preventDefault();
    const query = e.target.querySelector('[name="query"]').value;
    if (!query.length) { return false; }
    this.br.search(query);
    this.dom.searchField.blur();
    this.emptyMatches();
    this.toggleSearchPending(true);
    return false;
  }

  /**
   * @param {Event} e
   * @param {object} properties
   *   @param {object} properties.results
   */
  handleSearchCallback(e, { results }) {
    this.renderMatches(results.matches);
    this.renderPins(results.matches);
    this.updateResultsCount(results.matches.length);
    this.toggleSearchPending(false);
  }

  /**
   * @param {Event} e
   */
  handleNavToggledCallback(e) {
    const is_visible = this.br.navigationIsVisible();
    this.togglePinsFor(is_visible);
    this.toggleSearchTray(is_visible ? !!this.dom.results.querySelector('li') : false);
  }

  handleSearchStarted() {
    this.br.removeSearchHilites();
    this.removeResultPins();
    this.toggleSearchPending(true);
    this.setQuery(this.br.searchTerm);
  }

  handleSearchCallbackError() {
    this.toggleSearchPending(false);
    this.renderErrorModal();
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

    $(document).on(`${namespace}SearchCallback`, this.handleSearchCallback.bind(this))
      .on(`${namespace}navToggled`, this.handleNavToggledCallback.bind(this))
      .on(`${namespace}SearchStarted`, this.handleSearchStarted.bind(this))
      .on(`${namespace}SearchCallbackError`, this.handleSearchCallbackError.bind(this))
      .on(`${namespace}SearchCallbackBookNotIndexed`, this.handleSearchCallbackBookNotIndexed.bind(this))
      .on(`${namespace}SearchCallbackEmpty`, this.handleSearchCallbackEmpty.bind(this));

    this.dom.searchTray.addEventListener('submit', this.submitHandler.bind(this));
    this.dom.toolbarSearch.querySelector('form').addEventListener('submit', this.submitHandler.bind(this));
    this.dom.searchField.addEventListener('search', () => {
      if (this.dom.searchField.value) { return; }
      this.br.removeSearchResults();
      this.clearSearchFieldAndResults();
    });

    $(this.dom.results).on('click', 'li', (e) => {
      this.br._searchPluginGoToResult(+e.currentTarget.dataset.pageIndex);
      this.br.updateSearchHilites();
      this.closeMobileMenu();
    });
  }
}

export default SearchView;
