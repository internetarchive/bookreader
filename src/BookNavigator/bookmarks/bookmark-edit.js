import { repeat } from 'lit/directives/repeat.js';
import { css, html, LitElement, nothing } from 'lit';
import bookmarkColorsCSS from '../assets/bookmark-colors.js';
import buttonCSS from '../assets/button-base.js';

export class IABookmarkEdit extends LitElement {
  static get properties() {
    return {
      bookmark: { type: Object },
      bookmarkColors: { type: Array },
      renderHeader: { type: Boolean },
      showBookmark: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.bookmark = {};
    this.bookmarkColors = [];
    this.renderHeader = false;
    this.showBookmark = true;
  }

  emitSaveEvent(e) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('saveBookmark', {
      detail: {
        bookmark: this.bookmark,
      },
    }));
  }

  emitDeleteEvent() {
    this.dispatchEvent(new CustomEvent('deleteBookmark', {
      detail: {
        id: this.bookmark.id,
      },
    }));
  }

  emitColorChangedEvent(colorId) {
    this.dispatchEvent(new CustomEvent('bookmarkColorChanged', {
      detail: {
        bookmarkId: this.bookmark.id,
        colorId,
      },
    }));
  }

  changeColorTo(id) {
    this.bookmark.color = id;
    this.emitColorChangedEvent(id);
  }

  updateNote(e) {
    this.bookmark.note = e.currentTarget.value;
  }

  static get headerSection() {
    return html`<header>
      <h3>Edit Bookmark</h3>
    </header>`;
  }

  bookmarkColor(color) {
    return html`
      <li>
        <input type="radio" name="color" id="color_${color.id}" .value=${color.id} @change=${() => this.changeColorTo(color.id)} ?checked=${this.bookmark.color === color.id}>
        <label for="color_${color.id}">
          <icon-bookmark class=${color.className}></icon-bookmark>
        </label>
      </li>
    `;
  }

  get bookmarkTemplate() {
    return html`
      <div class="bookmark">
        <img src=${this.bookmark.thumbnail} />
        <h4>Page ${this.bookmark.page}</h4>
      </div>
    `;
  }

  render() {
    return html`
      ${this.renderHeader ? IABookmarkEdit.headerSection : nothing}
      ${this.showBookmark ? this.bookmarkTemplate : nothing}
      <form action="" method="put" @submit=${this.emitSaveEvent}>
        <fieldset>
          <label for="note">Note <small>(optional)</small></label>
          <textarea rows="4" cols="80" name="note" id="note" @change=${this.updateNote}>${this.bookmark.note}</textarea>
          <label for="color">Bookmark color</label>
          <ul>
            ${repeat(this.bookmarkColors, color => color.id, this.bookmarkColor.bind(this))}
          </ul>
          <div class="actions">
            <button type="button" class="ia-button cancel" @click=${this.emitDeleteEvent}>Delete</button>
            <input class="ia-button" type="submit" value="Save">
          </div>
        </fieldset>
      </form>
    `;
  }

  static get styles() {
    const bookmarkEditCSS = css`
    :host {
      display: block;
      padding: 0 1rem 2rem 1rem;
      color: var(--primaryTextColor);
    }

    small {
      font-style: italic;
    }

    .bookmark {
      display: grid;
      grid-template-columns: 37px 1fr;
      grid-gap: 0 1rem;
      align-items: center;
    }

    h4 {
      margin: 0;
      font-size: 1.4rem;
    }

    fieldset {
      padding: 2rem 0 0 0;
      border: none;
    }

    label {
      display: block;
      font-weight: bold;
    }

    p {
      padding: 0;
      margin: .5rem 0;
      font-size: 1.2rem;
      line-height: 120%;
    }

    textarea {
      width: 100%;
      margin-bottom: 2rem;
      box-sizing: border-box;
      font: normal 1.4rem "Helvetica Neue", Helvetica, Arial, sans-serif;
      resize: vertical;
    }

    ul {
      display: grid;
      grid-template-columns: repeat(3, auto);
      grid-gap: 0 2rem;
      justify-content: start;
      padding: 1rem 0 0 0;
      margin: 0 0 2rem 0;
      list-style: none;
    }

    li input {
      display: none;
    }

    li label {
      display: block;
      min-width: 50px;
      padding-top: .4rem;
      text-align: center;
      border: 1px solid transparent;
      border-radius: 4px;
      cursor: pointer;
    }

    li input:checked + label {
      border-color: var(--primaryTextColor);
    }

    input[type="submit"] {
      background: var(--primaryCTAFill);
      border-color: var(--primaryCTABorder);
    }

    button {
      background: var(--primaryErrorCTAFill);
      border-color: var(--primaryErrorCTABorder);
    }

    .button {
      -webkit-appearance: none;
      appearance: none;
      padding: .5rem 1rem;
      box-sizing: border-box;
      color: var(--primaryTextColor);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .actions {
      display: grid;
      grid-template-columns: auto auto;
      grid-gap: 0 1rem;
      justify-items: stretch;
    }
    `;
    return [buttonCSS, bookmarkColorsCSS, bookmarkEditCSS];
  }
}
customElements.define('ia-bookmark-edit', IABookmarkEdit);
