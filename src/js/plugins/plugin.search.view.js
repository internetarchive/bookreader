class SearchView {
  constructor(params) {
    if (!params.selector) {
      console.warn('BookReader::Search - SearchView must be passed a valid CSS selector');
      return;
    }

    this.br = params.br;

    if (this.br.options.initialSearchTerm) {
      this.setQuery(params.query);
    }

    this.matcher = new RegExp('{{{(.+?)}}}', 'g');
    this.dom = {
      searchTray: document.querySelector(params.selector),
    };
    this.cacheDOMElements();

    this.bindEvents();
  }

  cacheDOMElements() {
    this.dom.results = this.dom.searchTray.querySelector('[data-id="results"]');
    this.dom.resultsCount = this.dom.searchTray.querySelector('[data-id="results_count"]');
    this.dom.searchField = this.dom.searchTray.querySelector('[name="query"]');
    this.dom.searchPending = this.dom.searchTray.querySelector('[data-id="searchPending"]');
  }

  toggleSearchTray(bool) {
    const state = typeof bool !== 'boolean' ? this.dom.searchTray.classList.contains('hidden') : bool;
    this.dom.searchTray.classList.toggle('hidden', !state);
  }

  updateResultsCount(results) {
    this.dom.resultsCount.innerText = `(${results} result${results != 1 ? 's' : ''})`;
    this.dom.resultsCount.classList.add('visible');
  }

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
    this.removeResultPins();
    this.emptyMatches();
    this.setQuery('');
  }

  renderMatches(matches) {
    const items = matches.map((match) => `
      <li data-page="${match.par[0].page}" data-page-index="${this.br.leafNumToIndex(match.par[0].page)}">
        ${match.cover ? coverImage : ''}
        <h4>Page ${match.par[0].page}</h4>
        <p>${match.text.replace(this.matcher, '<mark>$1</mark>')}</p>
      </li>
    `);
    this.dom.results.innerHTML = items.join('');
  }

  togglePinsFor(instance, bool) {
    const pinsVisibleState = bool ? 'visible' : 'hidden';
    instance.refs.$BRfooter.find('.BRsearch').css({ visibility: pinsVisibleState });
  }

  buildMobileDrawer(el) {
    if (!this.br.enableSearch) { return; }
    this.dom.mobileSearch = document.createElement('li');
    this.dom.mobileSearch.classList.add('BRmobileMenu__search');
    this.dom.mobileSearch.innerHTML = `
      <span>
        <span class="DrawerIconWrapper">
          <img class="DrawerIcon" src="${this.br.imagesBaseURL}icon_search_button_blue.svg" alt="Icon of a magnifying glass" />
        </span>
        Search
      </span>
      <div>
        <form class="BRbooksearch mobile">
          <input type="search" class="BRsearchInput" placeholder="Search inside"/>
          <button type="submit" class="BRsearchSubmit"></button>
        </form>
        <div class="BRmobileSearchResultWrapper">Enter your search above.</div>
      </div>
    `;
    el.querySelector('.BRmobileMenu__moreInfoRow').after(this.dom.mobileSearch);
  }

  renderPins(matches) {
    matches.forEach((match) => {
      const queryString = match.text;
      const pageIndex = this.br.leafNumToIndex(match.par[0].page);
      const pageNumber = this.br.getPageNum(pageIndex);
      const uiStringSearch = "Search result"; // i18n
      const uiStringPage = "Page"; // i18n

      const percentThrough = BookReader.util.cssPercentage(pageIndex, this.br.getNumLeafs() - 1);
      const pageDisplayString = `${uiStringPage} ${this.br.getNavPageNumString(pageIndex, true)}`;

      const queryStringWithB = queryString.replace(this.matcher, '<b>$1</b>');

      let queryStringWithBTruncated = queryString.replace(this.matcher, '<b>$1</b>');

      if (queryString.length > 100) {
        queryStringWithBTruncated = queryString
          .replace(/^(.{100}[^\s]*).*/, "$1")
          .replace(this.matcher, '<b>$1</b>')
                + '...';
      }

      // draw marker
      const markerTopValue = -this.br.refs.$brContainer.height();
      $('<div>')
        .addClass('BRsearch')
        .css({
          top: `${markerTopValue}px`,
          left: percentThrough,
        })
        .attr('title', uiStringSearch)
        .append(`
          <div class="BRquery">
            <div>${queryStringWithB}</div>
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
        }.bind(this))
        .animate({top:'-25px'}, 'slow');
    });
  }

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

  renderModalMessage(messageHTML) {
    const modal = document.createElement('div');
    modal.classList.add('BRprogresspopup', 'search_modal');
    modal.innerHTML = messageHTML;
    document.querySelector(this.br.el).append(modal);
  }

  delayModalRemovalFor(timeoutMS) {
    setTimeout(this.br.removeProgressPopup.bind(this.br), timeoutMS);
  }

  submitHandler(e) {
    e.preventDefault();
    const query = this.dom.searchField.value;
    if (!query.length) { return false; }
    this.br.search(query);
    this.dom.searchField.blur();
    this.emptyMatches();
    this.toggleSearchPending(true);
    return false;
  }

  bindEvents() {
    const namespace = 'BookReader:';
    document.querySelector('[data-id="searchTrayToggle"]').addEventListener('click', this.toggleSearchTray.bind(this));

    $(document).on(`${namespace}SearchCallback`, (e, { results }) => {
      this.renderMatches(results.matches);
      this.renderPins(results.matches);
      this.updateResultsCount(results.matches.length);
      this.toggleSearchPending(false);
      this.toggleSearchTray(true);
    }).on(`${namespace}navToggled`, (e, instance) => {
      const is_visible = instance.navigationIsVisible();
      this.togglePinsFor(instance, is_visible);
      this.toggleSearchTray(is_visible ? !!this.dom.results.querySelector('li') : false);
    }).on(`${namespace}SearchStarted`, () => {
      this.toggleSearchPending(true);
      this.setQuery(this.br.searchTerm);
    }).on(`${namespace}SearchCallbackError`, (e, { results }) => {
      this.toggleSearchPending(false);
      this.renderErrorModal();
    }).on(`${namespace}SearchCallbackBookNotIndexed`, () => {
      this.toggleSearchPending(false);
      this.renderBookNotIndexedModal();
    }).on(`${namespace}SearchCallbackEmpty`, () => {
      this.toggleSearchPending(false);
      this.renderResultsEmptyModal();
    });

    this.dom.searchTray.addEventListener('submit', this.submitHandler.bind(this));
    this.dom.searchField.addEventListener('search', () => {
      if (this.dom.searchField.value) { return; }
      this.br.removeSearchResults();
      this.clearSearchFieldAndResults();
    });

    $(this.dom.results).on('click', 'li', (e) => {
      this.br._searchPluginGoToResult(+e.currentTarget.dataset.pageIndex);
      this.br.updateSearchHilites();
    });
  }
}

export default SearchView;
