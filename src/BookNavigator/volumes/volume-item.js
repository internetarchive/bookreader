import { css, html, LitElement } from 'lit-element';

export class VolumeItem extends LitElement {
  static get properties() {
    return {
      item: { type: Object },
    };
  }

  constructor() {
    super();
    console.log("******** viewitem: ", this.item);
  }

  render() {
    return html`
      <section>
        <a>
          <img src="">
          <p>Name</p>
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
    `;
  }
}

customElements.define('viewable-item', VolumeItem);
