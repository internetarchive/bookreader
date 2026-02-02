import { LitElement, html, css } from 'lit';

export default class DeleteModalActions extends LitElement {
  static get styles() {
    return css`
      div {
        display: flex;
        justify-content: center;
        padding-top: 2rem;
      }

      button {
        appearance: none;
        padding: 0.5rem 1rem;
        margin: 0 .5rem;
        box-sizing: border-box;
        font: 1.3rem "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: var(--primaryTextColor);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: var(--primaryCTAFill);
      }

      .delete {
        background: var(--primaryErrorCTAFill);
      }
    `;
  }

  static get properties() {
    return {
      cancelAction: { type: Function },
      deleteAction: { type: Function },
      pageID: { type: String },
    };
  }

  render() {
    return html`
      <div>
        <button class="delete" @click=${() => this.deleteAction({ detail: { id: `${this.pageID}` } })}>Delete</button>
        <button @click=${() => this.cancelAction()}>Cancel</button>
      </div>
    `;
  }
}

customElements.define('delete-modal-actions', DeleteModalActions);
