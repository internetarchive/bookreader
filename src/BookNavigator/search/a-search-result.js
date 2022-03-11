import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
/** @typedef {import('@/src/plugins/search/plugin.search.js').SearchInsideMatch} SearchInsideMatch */

export class BookSearchResult extends LitElement {
  static get properties() {
    return {
      match: { type: Object },
    };
  }

  constructor() {
    super();

    this.matchRegex = new RegExp('{{{(.+?)}}}', 'g');
  }

  createRenderRoot() {
    return this;
  }

  highlightedHit(hit) {
    return html`
      <p>${unsafeHTML(hit.replace(this.matchRegex, '<mark>$1</mark>'))}</p>
    `;
  }

  resultSelected() {
    this.dispatchEvent(new CustomEvent('resultSelected', {
      bubbles: true,
      composed: true,
      detail: {
        match: this.match,
      },
    }));
  }

  render() {
    /** @type {SearchInsideMatch} */
    const match = this.match;
    // TODO: Make this not use the global br instance
    const pageIndex = window.br.leafNumToIndex(match.par[0].page);
    const pageNumber = window.br.getPageNum(pageIndex);
    const coverImage = html`<img src="${match.cover}" />`;
    return html`
      <li @click=${this.resultSelected}>
        ${match.cover ? coverImage : nothing}
        <h4>${match.title || nothing}</h4>
        <p class="page-num">Page ${pageNumber}</p>
        ${this.highlightedHit(match.text)}
      </li>
    `;
  }
}
customElements.define('book-search-result', BookSearchResult);
