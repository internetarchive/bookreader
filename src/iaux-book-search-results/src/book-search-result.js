import { nothing } from 'lit-html';
import { html, LitElement } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

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
    const { match } = this;
    const { par = [] } = match;
    const [resultDetails = {}] = par;
    const pageNumber = Number.isInteger(resultDetails.page)
      ? html`<p class="page-num">Page -${resultDetails.page}-</p>` : nothing;
    const coverImage = html`<img src="${match.cover}" />`;
    return html`
      <li @click=${this.resultSelected}>
        ${match.cover ? coverImage : nothing}
        <h4>${match.title || nothing}</h4>
        ${pageNumber}
        ${this.highlightedHit(match.text)}
      </li>
    `;
  }
}
