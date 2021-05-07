import { css, html, LitElement } from 'lit-element';

export class VolumeItem extends LitElement {
  static get properties() {
    return {
      item: { type: Object },
      hostUrl: { type: String }
    };
  }

  constructor() {
    super();
    this.item = {};
    this.hostUrl = '';
  }

  render() {
    return html`
      <section>
        <a href="${this.hostUrl}${this.item.url_path}">
          <img src="">
          <p>${this.item.title}</p>
          <p>by: Author</p>
        </a>
      </section>
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

      a {
        color: #ffffff;
        text-decoration: none
      }
    `;
  }
}

customElements.define('viewable-item', VolumeItem);
