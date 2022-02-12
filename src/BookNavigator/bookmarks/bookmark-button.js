import { LitElement, html, css } from 'lit';

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
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 16 24' width='16'%3E%3Cg fill='%23333' fill-rule='evenodd'%3E%3Cpath d='m15 0c.5522847 0 1 .44771525 1 1v23l-8-5.4545455-8 5.4545455v-23c0-.55228475.44771525-1 1-1zm-2 2h-10c-.51283584 0-.93550716.38604019-.99327227.88337887l-.00672773.11662113v18l6-4.3181818 6 4.3181818v-18c0-.51283584-.3860402-.93550716-.8833789-.99327227z'/%3E%3Cpath d='m8.75 6v2.25h2.25v1.5h-2.25v2.25h-1.5v-2.25h-2.25v-1.5h2.25v-2.25z' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E"), pointer;
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
    this.side = undefined;
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
