import { escapeHTML } from '../../BookReader/utils.js';
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

    this.matchRegex = new RegExp('{{{([^]+?)}}}', 'g'); // [^] matches any character, including line breaks
  }

  createRenderRoot() {
    return this;
  }

  /**
   * Converts the search hit to a `<p>` template containing the full search result with all of
   * its `{{{triple-brace-delimited}}}` matches replaced by `<mark>HTML mark tags</mark>`.
   *
   * This approach safely avoids the use of `unsafeHTML` and leaves any existing HTML tags
   * in the snippets intact (as inert text), rather than stripping them away with DOMPurify.
   */
  highlightedHit(hit) {
    return html`<p>
      ${unsafeHTML(escapeHTML(hit).replace(this.matchRegex, '<mark>$1</mark>'))}
    </p>`;
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
    const coverImage = html`<img src="${match.cover}" />`;
    return html`
      <li @click=${this.resultSelected}>
        ${match.cover ? coverImage : nothing}
        <h4>${match.title || nothing}</h4>
        <p class="page-num">Page ${match.displayPageNumber}</p>
        ${this.highlightedHit(match.text)}
      </li>
    `;
  }
}
customElements.define('book-search-result', BookSearchResult);
