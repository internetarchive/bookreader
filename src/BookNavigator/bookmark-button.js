import { LitElement, html, css } from 'lit-element';

export default class BookmarkButton extends LitElement {
  static get styles() {
    return css`
      button {
        -webkit-appearance: none;
        appearance: none;
        outline: 0;
        border: none;
        padding: 0;
        height: 4rem;
        width: 4rem;
        background: transparent;
        cursor: url('/images/bookreader/bookmark-add.png'), pointer;
        position: relative;
      }
      button > * {
        display: block;
        position: absolute;
        top: 0.2rem;
      }
      button.left > * {
        left: 0.2rem;
      }

      button.right > * {
        right: 0.2rem;
      }
    `;
  }

  static get properties() {
    return {
      side: { type: String },
      state: { type: String },
    };
  }

  constructor() {
    super();
    this.state = 'hollow';
  }

  handleClick(e) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('bookmarkButtonClicked'));
  }

  get title() {
    return `${this.state === 'hollow' ? 'Add' : 'Remove'} bookmark`;
  }

  render() {
    const position = this.side || 'right';
    return html`
      <button title=${this.title} @click=${this.handleClick} class=${position}>
        <icon-bookmark state=${this.state}></icon-bookmark>
      </button>
    `;
  }
}

customElements.define('bookmark-button', BookmarkButton);
