import { html, LitElement, nothing } from 'lit';
/** @typedef {import('@/src/plugins/search/plugin.search.js').SearchInsideMatch} SearchInsideMatch */

export class BookSearchResult extends LitElement {
  static get properties() {
    return {
      match: { type: Object },
    };
  }

  constructor() {
    super();

    this.matchRegex = new RegExp('{{{(.+?)}}}', 'gs');
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
    const matches = hit.matchAll(this.matchRegex);
    const templates = [];

    // Convert each match into an HTML template that includes:
    //  - Everything from the end of the previous match (or the beginning of the
    //      string) up to the current match, as raw text.
    //  - The current match (excluding the curly braces) wrapped in a `<mark>` tag.
    let index = 0;
    for (const match of matches) {
      if (match.index != null) {
        templates.push(html`
          ${hit.slice(index, match.index)}
          <mark>${match[1]}</mark>
        `);
        index = match.index + match[0].length;
      }
    }

    // Include any text from the last match to the end
    templates.push(html`${hit.slice(index)}`);

    // Squash everything into a single p template
    return html`<p>${templates}</p>`;
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
