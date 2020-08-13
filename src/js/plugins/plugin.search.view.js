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
      <li data-page="${match.par[0].page}">
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
      this.clearSearchFieldAndResults();
    });
  }
}

export default SearchView;
