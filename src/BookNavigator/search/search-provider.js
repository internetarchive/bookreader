import { html } from 'lit-element';
import { nothing } from 'lit-html';
import '@internetarchive/icon-search/icon-search';
import './search-results';

let searchState = {
  query: '',
  results: [],
  resultsCount: 0,
  queryInProgress: false,
  errorMessage: '',
};
export default class {
  constructor(onSearchChange = () => {}, brInstance) {
    /* search menu events */
    this.onBookSearchInitiated = this.onBookSearchInitiated.bind(this);
    /* bookreader search events */
    this.onSearchStarted = this.onSearchStarted.bind(this);
    this.onSearchRequestError = this.onSearchRequestError.bind(this);
    this.onSearchResultsClicked = this.onSearchResultsClicked.bind(this);
    this.onSearchResultsChange = this.onSearchResultsChange.bind(this);
    this.onSearchResultsCleared = this.onSearchResultsCleared.bind(this);
    this.searchCanceledInMenu = this.searchCanceledInMenu.bind(this);

    /* class methods */
    this.bindEventListeners = this.bindEventListeners.bind(this);
    this.getMenuDetails = this.getMenuDetails.bind(this);
    this.getComponent = this.getComponent.bind(this);
    this.advanceToPage = this.advanceToPage.bind(this);
    this.updateMenu = this.updateMenu.bind(this);

    this.onSearchChange = onSearchChange;
    this.bookreader = brInstance;
    this.icon = html`<ia-icon-search style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-search>`;
    this.label = 'Search inside';
    this.menuDetails = this.getMenuDetails();
    this.id = 'search';
    this.component = this.getComponent();
    this.bindEventListeners();
  }

  getMenuDetails() {
    const { resultsCount, query, queryInProgress } = searchState;
    if (queryInProgress || !query) { return nothing; }
    const unit = resultsCount === 1 ? 'result' : 'results';
    return html`(${resultsCount} ${unit})`;
  }

  bindEventListeners() {
    window.addEventListener('BookReader:SearchStarted', this.onSearchStarted);
    window.addEventListener('BookReader:SearchCallback', this.onSearchResultsChange);
    window.addEventListener('BookReader:SearchCallbackEmpty', (event) => { this.onSearchRequestError(event, 'noResults'); });
    window.addEventListener('BookReader:SearchCallbackNotIndexed', (event) => { this.onSearchRequestError(event, 'notIndexed'); });
    window.addEventListener('BookReader:SearchCallbackError', (event) => { this.onSearchRequestError(event); });
    window.addEventListener('BookReader:SearchResultsCleared', () => { this.onSearchResultsCleared(); });
    window.addEventListener('BookReader:SearchCanceled', (e) => { this.onSearchCanceled(e); });
  }

  /**
   * Cancel search handler
   * resets `searchState`
   */
  onSearchCanceled() {
    searchState = {
      query: '',
      results: [],
      resultsCount: 0,
      queryInProgress: false,
      errorMessage: '',
    };
    const updateMenuFor = {
      searchCanceled: true
    };
    this.updateMenu(updateMenuFor);
  }

  onSearchStarted(e) {
    const { term = '' } = e.detail.props;
    searchState.query = term;
    searchState.results = [];
    searchState.resultsCount = 0;
    searchState.queryInProgress = true;
    searchState.errorMessage = '';
    this.updateMenu();
  }

  onBookSearchInitiated({ detail }) {
    searchState.query = detail.query;
    this.bookreader.search(searchState.query);
  }

  onSearchRequestError(event, errorType = 'default') {
    const { detail: { props = {} } } = event;
    const { instance = null } = props;
    if (instance) {
      /* keep bookreader instance reference up-to-date */
      this.bookreader = instance;
    }
    const errorMessages = {
      noResults: '0 results',
      notIndexed: `This book hasn't been indexed for searching yet.  We've just started indexing it,
       so search should be available soon.  Please try again later.  Thanks!`,
      default: 'Sorry, there was an error with your search.  Please try again.',
    };

    const messageToShow = errorMessages[errorType] ?? errorMessages.default;
    searchState.results = [];
    searchState.resultsCount = 0;
    searchState.queryInProgress = false;
    searchState.errorMessage = html`<p class="error">${messageToShow}</p>`;
    this.updateMenu();
  }

  onSearchResultsChange({ detail: { props = {} } }) {
    const { instance = null, results: searchResults = [] } = props;
    if (instance) {
      /* keep bookreader instance reference up-to-date */
      this.bookreader = instance;
    }
    const results = searchResults.matches || [];
    const resultsCount = results.length;
    const query = searchResults.q;
    const queryInProgress = false;
    searchState = { results, resultsCount, query, queryInProgress, errorMessage: '' };
    this.updateMenu();
  }

  searchCanceledInMenu() {
    this.bookreader?.cancelSearchRequest();
  }

  onSearchResultsCleared() {
    searchState = {
      query: '',
      results: [],
      resultsCount: 0,
      queryInProgress: false,
      errorMessage: '',
    };
    this.updateMenu();
    this.bookreader?.searchView?.clearSearchFieldAndResults();
  }

  /**
   * Relays how to update side menu given the context of a search update
    @param {{searchCanceled: boolean}} searchUpdates
   */
  updateMenu(searchUpdates = {}) {
    this.menuDetails = this.getMenuDetails();
    this.component = this.getComponent();
    this.onSearchChange(this.bookreader, searchUpdates);
  }

  getComponent() {
    const { query, results, queryInProgress, errorMessage } = searchState;
    return html`
    <ia-book-search-results
      .query=${query}
      .results=${results}
      .errorMessage=${errorMessage}
      ?queryInProgress=${queryInProgress}
      ?renderSearchAllFiles=${false}
      @resultSelected=${this.onSearchResultsClicked}
      @bookSearchInitiated=${this.onBookSearchInitiated}
      @bookSearchResultsCleared=${this.onSearchResultsCleared}
      @bookSearchCanceled=${this.searchCanceledInMenu}
    ></ia-book-search-results>
  `;
  }

  onSearchResultsClicked({ detail }) {
    const page = detail.match.par[0].page;
    this.advanceToPage(page);
  }

  advanceToPage(leaf) {
    const page = this.bookreader.leafNumToIndex(leaf);
    this.bookreader._searchPluginGoToResult(page);
  }
}
