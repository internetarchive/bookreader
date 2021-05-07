import { css, html, LitElement } from 'lit-element';

import './volume-item.js';

export class Volumes extends LitElement {
  static get properties() {
    return {
      hostUrl: { type: String },
      viewableFiles: { type: Object },
    };
  }

  constructor() {
    super();
    this.viewableFiles = {};
    this.hostUrl = '';
  }

  render() {
    return html`
      ${Object.keys(this.viewableFiles).map(item => html`
        <viewable-item .item=${this.viewableFiles[item]} .hostUrl=${this.hostUrl}></viewable-item>
      `)}
    `
  }

  static get styles() {
    return css`
      :host {
        display: block;
        overflow-y: auto;
        box-sizing: border-box;
        color: var(--primaryTextColor);
        margin-bottom: 2rem;
        --activeBorderWidth: 2px;
      }

      section {
        margin-top: 14px;
      }
    `;
  }
}

customElements.define('viewable-files', Volumes);
