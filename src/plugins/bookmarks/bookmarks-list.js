import { repeat } from 'lit/directives/repeat.js';
import { css, html, LitElement, nothing } from 'lit';
import './bookmark-edit.js';
import '@internetarchive/icon-edit-pencil/icon-edit-pencil.js';
import bookmarkColorsCSS from './bookmark-colors.js';

export class IABookmarksList extends LitElement {
  static get properties() {
    return {
      activeBookmarkID: { type: Number },
      bookmarkColors: { type: Array },
      defaultBookmarkColor: { type: Object },
      bookmarks: { type: Object },
      editedBookmark: { type: Object },
      renderHeader: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.activeBookmarkID = undefined;
    this.bookmarkColors = [];
    this.defaultBookmarkColor = {};
    this.bookmarks = {};
    this.editedBookmark = {};
    this.renderHeader = false;
  }

  emitEditEvent(e, bookmark) {
    this.dispatchEvent(new CustomEvent('bookmarkEdited', {
      detail: {
        bookmark,
      },
    }));
  }

  emitSelectedEvent(bookmark) {
    this.activeBookmarkID = bookmark.id;
    this.dispatchEvent(new CustomEvent('bookmarkSelected', {
      detail: {
        bookmark,
      },
    }));
  }

  emitSaveBookmark(bookmark) {
    this.dispatchEvent(new CustomEvent('saveBookmark', {
      detail: {
        bookmark,
      },
    }));
  }

  emitDeleteBookmark(id) {
    this.dispatchEvent(new CustomEvent('deleteBookmark', {
      detail: {
        id,
      },
    }));
  }

  emitBookmarkColorChanged({ detail }) {
    const { bookmarkId, colorId } = detail;
    this.dispatchEvent(new CustomEvent('bookmarkColorChanged', {
      detail: {
        bookmarkId,
        colorId,
      },
    }));
  }

  emitAddBookmark() {
    this.dispatchEvent(new CustomEvent('addBookmark'));
  }

  editBookmark(e, bookmark) {
    this.emitEditEvent(e, bookmark);
    this.editedBookmark = this.editedBookmark === bookmark ? {} : bookmark;
  }

  saveBookmark({ detail }) {
    const { bookmark } = detail;
    this.editedBookmark = {};
    this.emitSaveBookmark(bookmark);
  }

  deleteBookmark({ detail }) {
    const { id } = detail;
    this.editedBookmark = {};
    this.emitDeleteBookmark(id);
  }

  bookmarkColorInfo(colorVal = 0) {
    return this.bookmarkColors.find(labelInfo => labelInfo?.id === colorVal);
  }

  bookmarkItem(bookmark) {
    const editMode = this.editedBookmark.id === bookmark.id;
    const { className } = this.bookmarkColorInfo(bookmark.color);
    const activeClass = bookmark.id === this.activeBookmarkID ? 'active' : '';
    return html`
      <li data-pageIndex=${bookmark.id}>
        <div class="separator"></div>
        <div class="bookmark-card ${activeClass}">
          <div class="bookmark-header" @click=${() => this.emitSelectedEvent(bookmark)}>
            <button>
              <icon-bookmark class=${className} aria-label="${className} bookmark"></icon-bookmark>
              <span> Page ${bookmark.page}</span>
            </button>
            <button
              class="edit"
              @click=${e => this.editBookmark(e, bookmark)}
              title="Edit this bookmark"
              aria-expanded=${editMode ? 'true' : 'false'}
            >
              <ia-icon-edit-pencil aria-hidden="true"></ia-icon-edit-pencil>
            </button>
          </div>
          ${!editMode && bookmark.note ? html`<p>${bookmark.note}</p>` : nothing}
          ${editMode ? this.editBookmarkComponent : nothing}
        </div>
      </li>
    `;
  }

  get editBookmarkComponent() {
    const showBookmark = false;
    return html`
      <ia-bookmark-edit
        .bookmark=${this.editedBookmark}
        .bookmarkColors=${this.bookmarkColors}
        .defaultBookmarkColor=${this.defaultBookmarkColor}
        .showBookmark=${showBookmark}
        @saveBookmark=${this.saveBookmark}
        @deleteBookmark=${this.deleteBookmark}
        @bookmarkColorChanged=${this.emitBookmarkColorChanged}
      ></ia-bookmark-edit>
    `;
  }

  sortBookmarks() {
    const sortedKeys = Object.keys(this.bookmarks).sort((a, b) => {
      if (+a > +b) { return 1; }
      if (+a < +b) { return -1; }
      return 0;
    });
    const sortedBookmarks = sortedKeys.map(key => this.bookmarks[key]);
    return sortedBookmarks;
  }

  get bookmarksCount() {
    const count = this.bookmarks.length;
    return html`<small>(${count})</small>`;
  }

  get headerSection() {
    return html`<header>
      <h3>
        Bookmarks
        ${this.bookmarks.length ? this.bookmarksCount : nothing}
      </h3>
    </header>`;
  }

  get bookmarkslist() {
    const sortedBookmarks = this.sortBookmarks();
    const bookmarks = repeat(sortedBookmarks, bookmark => bookmark?.id, this.bookmarkItem.bind(this));
    return html`
      <ul>
        ${bookmarks}
        <div class="separator"></div>
      </ul>
    `;
  }

  render() {
    return html`
      ${this.renderHeader ? this.headerSection : nothing}
      ${Object.keys(this.bookmarks).length ? this.bookmarkslist : nothing}
    `;
  }

  static get styles() {
    const main = css`
      :host {
        display: block;
        overflow-y: auto;
        box-sizing: border-box;
        color: var(--primaryTextColor);
        margin-bottom: 2rem;
        --activeBorderWidth: 2px;
      }

      icon-bookmark {
        width: 16px;
        height: 24px;
      }

      .separator {
        background-color: var(--secondaryBGColor);
        width: 98%;
        margin: 1px auto;
        height: 1px;
      }

      small {
        font-style: italic;
      }

      .bookmark-header {
        display: flex;
        align-items: center;
        margin: 0;
        font-size: 1.4rem;
        font-weight: bold;
      }

      .bookmark-header > button:first-child {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px;
      }

      ia-icon-edit-pencil {
        pointer-events: none;
      }

      p {
        padding: 0;
        margin: 5px 0 0 0;
        width: 98%;
        overflow-wrap: break-word;
      }

      ia-bookmark-edit {
        margin: 5px 5px 3px 6px;
      }

      ul {
        padding: 0;
        list-style: none;
        margin: var(--activeBorderWidth) 0.5rem 1rem 0;
      }
      ul > li:first-child .separator {
        display: none;
      }
      li {
        position: relative;
      }

      li .bookmark-card {
        border: var(--activeBorderWidth) solid transparent;
        border-radius: 4px;
      }

      li .bookmark-card.active {
        border: var(--activeBorderWidth) solid #538bc5;
      }

      .bookmark-header button {
        background: transparent;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
        box-sizing: border-box;
        border: none;
        padding: 0;
        text-align: left;
      }

      li button.edit {
        height: 34px;
        width: 34px;
        flex-shrink: 0;
        text-align: center;
      }
    `;

    return [main, bookmarkColorsCSS];
  }
}
customElements.define('ia-bookmarks-list', IABookmarksList);
