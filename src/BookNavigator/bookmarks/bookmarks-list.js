import { repeat } from 'lit/directives/repeat.js';
import { css, html, LitElement, nothing } from 'lit';
import './bookmark-edit.js';
import '@internetarchive/icon-edit-pencil/icon-edit-pencil.js';
import bookmarkColorsCSS from '../assets/bookmark-colors.js';

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
      <li
        @click=${() => this.emitSelectedEvent(bookmark)}
        tabindex="0"
        data-pageIndex=${bookmark.id}
      >
        <div class="separator"></div>
        <div class="content ${activeClass}">
          <button
            class="edit"
            @click=${e => this.editBookmark(e, bookmark)}
            title="Edit this bookmark"
          >
            <ia-icon-edit-pencil></ia-icon-edit-pencil>
          </button>
          <h4>
            <icon-bookmark class=${className}></icon-bookmark>
            <span> Page ${bookmark.page}</span>
          </h4>
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

      h4 {
        margin: 0;
        font-size: 1.4rem;
      }
      h4 * {
        display: inline-block;
      }
      h4 icon-bookmark {
        vertical-align: bottom;
      }
      h4 span {
        vertical-align: top;
        padding-top: 1%;
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
        cursor: pointer;
        outline: none;
        position: relative;
      }
      li .content {
        padding: 2px 0 4px 2px;
        border: var(--activeBorderWidth) solid transparent;
        padding: .2rem 0 .4rem .2rem;
      }
      li .content.active {
        border: var(--activeBorderWidth) solid #538bc5;
      }
      li button.edit {
        padding: 5px 2px 0 0;
        background: transparent;
        cursor: pointer;
        height: 40px;
        width: 40px;
        position: absolute;
        right: 2px;
        top: 2px;
        text-align: right;
        -webkit-appearance: none;
        appearance: none;
        outline: none;
        box-sizing: border-box;
        border: none;
      }
      li button.edit > * {
        display: block;
        height: 100%;
        width: 100%;
      }
    `;

    return [main, bookmarkColorsCSS];
  }
}
customElements.define('ia-bookmarks-list', IABookmarksList);
