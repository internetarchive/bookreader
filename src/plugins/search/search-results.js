/* eslint-disable class-methods-use-this */
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { css, html, LitElement, nothing } from 'lit';
import '@internetarchive/ia-activity-indicator/ia-activity-indicator.js';
import checkmarkIconTemplate from '../../css/icon_checkmark.js';
import closeIconTemplate from '@internetarchive/icon-close/index.js';
import buttonCSS from '../../css/button-base.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { sharedStyles } from '../../css/sharedStyles.js';
import { svgToDataUrl } from '../../util/lit.js';
/** @typedef {import('@/src/plugins/search/plugin.search.js').SearchInsideMatch} SearchInsideMatch */

const checkmarkIconData = svgToDataUrl(checkmarkIconTemplate.strings[0]);
const closeIconData = svgToDataUrl(closeIconTemplate.strings[0]);

export class IABookSearchResults extends LitElement {
  static get properties() {
    return {
      results: { type: Array },
      query: { type: String },
      queryInProgress: { type: Boolean },
      renderHeader: { type: Boolean },
      renderSearchAllFiles: { type: Boolean },
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
    return count ? `${count} result${count > 1 ? 's' : ''}` : nothing;
  }

  get headerSection() {
    const header = html`<header>
      <h3>Search inside</h3>
      ${this.resultsCount ? html`(${this.resultsCount})` : nothing}
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
        <ia-activity-indicator mode="processing" aria-hidden="true" role="presentation"></ia-activity-indicator>
        <p>Searching</p>
        <button class="ia-button external cancel-search" @click=${this.cancelSearch}>Cancel</button>
      </div>
    `;
  }

  get resultsSet() {
    return html`
    <nav aria-label="Search results">
      <div>
        ${this.resultsCount}
        <a
          href="#"
          class="skip-link"
          @click=${(e) => {
      e.preventDefault();
      this.shadowRoot.querySelector('.results li:last-child .result-item').focus();
    }}
        >Skip to last result</a>
      </div>
      <ul class="results">
        ${this.results.map(match => html`
            <li>
              <button class="result-item" @click=${this.selectResult.bind(this, match)}>
                <span class="page-num">Page ${match.displayPageNumber}</span> — <span lang=${ifDefined(match.lang)}>${unsafeHTML(match.html)}</span>
              </button>
            </li>
          `)}
      </ul>
        <a
          href="#"
          class="skip-link"
          @click=${(e) => {
      e.preventDefault();
      this.shadowRoot.querySelector('.results li:first-child .result-item').focus();
    }}
        >Skip to first result</a>
    </nav>
    `;
  }

  get setErrorMessage() {
    return html`
      <p class="error-message">${this.errorMessage}</p>
    `;
  }

  render() {
    const showSearchCTA = (!this.queryInProgress && !this.errorMessage)
    && (!this.queryInProgress && !this.results.length);
    return html`
      ${this.headerSection}
      <form action="" method="get" @submit=${this.performSearch}>
        ${this.searchMultipleControls}
        <input
          type="search"
          name="query"
          id="br-search-input"
          @keyup=${this.setQuery}
          @search=${this.setQuery}
          .value=${this.query}
        />
        <label class="search-cta ${showSearchCTA ? '' : 'sr-only'}" for="br-search-input">
          Please enter text to search for
        </label>
      </form>
      <div class="results-container" aria-live="polite">
        ${this.queryInProgress ? this.loadingIndicator : nothing}
        ${this.errorMessage ? this.setErrorMessage : nothing}
        ${this.results.length ? this.resultsSet : nothing}
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

      .skip-link {
        position: absolute;
        left: -9999px;
      }
      .skip-link:focus {
        position: static;
        left: auto;
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

      form {
        padding: 0 0 1rem 0;
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
        background-image: url('${checkmarkIconData}');
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
        padding: 0 10px;
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
        margin-right: -5px;
        -webkit-appearance: none;
        appearance: none;
        -webkit-mask: url('${closeIconData}') 0 0 no-repeat;
        mask: url('${closeIconData}') 0 0 no-repeat;
        -webkit-mask-size: 100%;
        mask-size: 100%;
        background: #fff;
      }

      .page-num {
        font-weight: bold;
        padding-bottom: 0;
      }

      .search-cta {
        padding: 10px 0;
        text-align: center;
        font-style: italic;
      }

      .results-container {
        padding-bottom: 2rem;
      }

      ul {
        padding: 0 0 2rem 0;
        margin: 0;
        list-style: none;
      }

      .result-item {
        cursor: pointer;
        margin-top: 8px;
        font-size: 12px;
        padding: 5px;
        border-radius: 4px;
        display: block;
        width: 100%;
        /* Reset button styles */
        background: none;
        border: none;
        text-align: left;
        font-family: inherit;
        transition: background-color 0.2s;
      }

      .result-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
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
    return [sharedStyles, buttonCSS, mainCSS];
  }
}
customElements.define('ia-book-search-results', IABookSearchResults);
