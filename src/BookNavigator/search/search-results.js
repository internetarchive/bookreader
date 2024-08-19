/* eslint-disable class-methods-use-this */
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { css, html, LitElement, nothing } from 'lit';
import '@internetarchive/ia-activity-indicator/ia-activity-indicator';
import checkmarkIcon from '../assets/icon_checkmark.js';
import closeIcon from '../assets/icon_close.js';
import buttonCSS from '../assets/button-base.js';
/** @typedef {import('@/src/plugins/search/plugin.search.js').SearchInsideMatch} SearchInsideMatch */

export class IABookSearchResults extends LitElement {
  static get properties() {
    return {
      results: { type: Array },
      query: { type: String },
      queryInProgress: { type: Boolean },
      renderHeader: { type: Boolean },
      renderSearchAllFiles: { type: Boolean },
      displayResultImages: { type: Boolean },
      errorMessage: { type: String },
    };
  }

  constructor() {
    super();

    /** @type {SearchInsideMatch[]} */
    this.results = [];
    this.query = '';
    this.queryInProgress = false;
    this.renderHeader = false;
    this.renderSearchAllFiles = false;
    this.displayResultImages = false;
    this.errorMessage = '';

    this.bindBookReaderListeners();
  }

  /** @inheritdoc */
  updated() {
    this.focusOnInputIfNecessary();
  }

  bindBookReaderListeners() {
    document.addEventListener('BookReader:SearchCallback', this.setResults.bind(this));
  }

  /**
   * Provide immediate input focus if there aren't any results displayed
   */
  focusOnInputIfNecessary() {
    if (this.results.length) {
      return;
    }
    const searchInput = this.shadowRoot.querySelector('input[type=\'search\']');
    searchInput.focus();
  }

  setResults({ detail }) {
    this.results = detail.results;
  }

  setQuery(e) {
    this.query = e.currentTarget.value;
    if (!this.query) {
      this.cancelSearch();
    }
  }

  performSearch(e) {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input[type="search"]');
    if (!input || !input.value) {
      return;
    }
    this.dispatchEvent(new CustomEvent('bookSearchInitiated', {
      bubbles: true,
      composed: true,
      detail: {
        query: this.query,
      },
    }));
  }

  /**
   * @param {SearchInsideMatch} match
   */
  selectResult(match) {
    this.dispatchEvent(new CustomEvent('resultSelected', {
      bubbles: true,
      composed: true,
      detail: { match },
    }));
    this.dispatchEvent(new CustomEvent('closeMenu', {
      bubbles: true,
      composed: true,
    }));
  }

  cancelSearch() {
    this.queryInProgress = false;
    this.dispatchSearchCanceled();
  }

  dispatchSearchCanceled() {
    this.dispatchEvent(new Event('bookSearchCanceled'));
  }

  get resultsCount() {
    const count = this.results.length;
    return count ? html`<p>(${count} result${count > 1 ? 's' : ''})</p>` : nothing;
  }

  get headerSection() {
    const header = html`<header>
      <h3>Search inside</h3>
      ${this.resultsCount}
    </header>`;
    return this.renderHeader ? header : nothing;
  }

  get searchMultipleControls() {
    const controls = html`
      <input name="all_files" id="all_files" type="checkbox" />
      <label class="checkbox" for="all_files">Search all files</label>
    `;
    return this.renderSearchAllFiles ? controls : nothing;
  }

  get loadingIndicator() {
    return html`
      <div class="loading">
        <ia-activity-indicator mode="processing"></ia-activity-indicator>
        <p>Searching</p>
        <button class="ia-button external cancel-search" @click=${this.cancelSearch}>Cancel</button>
      </div>
    `;
  }

  get resultsSet() {
    const resultsClass = this.displayResultImages ? 'show-image' : '';
    return html`
      <ul class="results ${resultsClass}">
        ${this.results.map(match => html`
            <li @click=${this.selectResult.bind(this, match)}>
              ${match.cover ? html`<img src="${match.cover}" />` : nothing}
              <h4>${match.title || nothing}</h4>
              <p class="page-num">Page ${match.displayPageNumber}</p>
              <p>${unsafeHTML(match.html)}</p>
            </li>
          `)}
      </ul>
    `;
  }

  get searchForm() {
    return html`
      <form action="" method="get" @submit=${this.performSearch}>
        <fieldset>
          ${this.searchMultipleControls}
          <input
            type="search"
            name="query"
            alt="Search inside this book."
            @keyup=${this.setQuery}
            @search=${this.setQuery}
            .value=${this.query}
          />
        </fieldset>
      </form>
    `;
  }

  get setErrorMessage() {
    return html`
      <p class="error-message">${this.errorMessage}</p>
    `;
  }

  get searchCTA() {
    return html`<p class="search-cta"><em>Please enter text to search for</em></p>`;
  }

  render() {
    const showSearchCTA = (!this.queryInProgress && !this.errorMessage)
    && (!this.queryInProgress && !this.results.length);
    return html`
      ${this.headerSection}
      ${this.searchForm}
      <div class="results-container">
        ${this.queryInProgress ? this.loadingIndicator : nothing}
        ${this.errorMessage ? this.setErrorMessage : nothing}
        ${this.results.length ? this.resultsSet : nothing}
        ${showSearchCTA ? this.searchCTA : nothing}
      </div>
    `;
  }

  static get styles() {
    const searchResultText = css`var(--searchResultText, #adaedc)`;
    const searchResultBg = css`var(--searchResultBg, #272958)`;
    const searchResultBorder = css`var(--searchResultBorder, #adaedc)`;
    const activeButtonBg = css`(--tertiaryBGColor, #333)`;

    const mainCSS = css`
      :host {
        display: block;
        height: 100%;
        padding: 1.5rem 1rem 2rem 0;
        overflow-y: auto;
        font-size: 1.4rem;
        box-sizing: border-box;
      }

      mark {
        padding: 0 .2rem;
        color: ${searchResultText};
        background: ${searchResultBg};
        border: 1px solid ${searchResultBorder};
        border-radius: 2px;
      }

      h3 {
        padding: 0;
        margin: 0 1rem 0 0;
        font-size: 2rem;
      }

      header {
        display: flex;
        align-items: center;
        padding: 0 2rem 0 0;
      }
      header p {
        padding: 0;
        margin: 0;
        font-size: 1.2rem;
        font-weight: bold;
        font-style: italic;
      }

      fieldset {
        padding: 0 0 1rem 0;
        border: none;
      }

      [type="checkbox"] {
        display: none;
      }

      label {
        display: block;
        text-align: center;
      }

      label.checkbox {
        padding-bottom: .5rem;
        font-size: 1.6rem;
        line-height: 150%;
        vertical-align: middle;
      }

      label.checkbox:after {
        display: inline-block;
        width: 14px;
        height: 14px;
        margin-left: .7rem;
        content: "";
        border-radius: 2px;
      }
      :checked + label.checkbox:after {
        background-image: url('${checkmarkIcon}');
      }

      label.checkbox[for="all_files"]:after {
        background: ${activeButtonBg} 50% 50% no-repeat;
        border: 1px solid var(--primaryTextColor);
      }

      [type="search"] {
        color: var(--primaryTextColor);
        border: 1px solid var(--primaryTextColor);
        -webkit-appearance: textfield;
        width: 100%;
        height: 3rem;
        padding: 0 1.5rem;
        box-sizing: border-box;
        font: normal 1.6rem "Helvetica qNeue", Helvetica, Arial, sans-serif;
        border-radius: 1.5rem;
        background: transparent;
      }
      [type="search"]:focus {
        outline: none;
      }
      [type="search"]::-webkit-search-cancel-button {
        width: 18px;
        height: 18px;
        -webkit-appearance: none;
        appearance: none;
        -webkit-mask: url('${closeIcon}') 0 0 no-repeat;
        mask: url('${closeIcon}') 0 0 no-repeat;
        -webkit-mask-size: 100%;
        mask-size: 100%;
        background: #fff;
      }

      p.page-num {
        font-weight: bold;
        padding-bottom: 0;
      }

      p.search-cta {
        text-align: center;
      }

      .results-container {
        padding-bottom: 2rem;
      }

      ul {
        padding: 0 0 2rem 0;
        margin: 0;
        list-style: none;
      }

      ul.show-image li {
        display: grid;
      }

      li {
        cursor: pointer;
        grid-template-columns: 30px 1fr;
        grid-gap: 0 .5rem;
      }

      li img {
        display: block;
        width: 100%;
      }

      li h4 {
        grid-column: 2 / 3;
        padding: 0 0 2rem 0;
        margin: 0;
        font-weight: normal;
      }

      li p {
        grid-column: 2 / 3;
        padding: 0 0 1.5rem 0;
        margin: 0;
        font-size: 1.2rem;
      }

      .loading {
        text-align: center;
      }

      .loading p {
        padding: 0 0 1rem 0;
        margin: 0;
        font-size: 1.2rem;
      }

      ia-activity-indicator {
        display: block;
        width: 40px;
        height: 40px;
        margin: 0 auto;
      }
    `;
    return [buttonCSS, mainCSS];
  }
}
customElements.define('ia-book-search-results', IABookSearchResults);
