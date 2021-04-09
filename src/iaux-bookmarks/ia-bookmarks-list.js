import { nothing } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { html, LitElement } from 'lit-element';
import './ia-bookmarks-edit.js';
import '@internetarchive/icon-edit-pencil';
import bookmarksListCSS from './styles/ia-bookmarks-list.js';

export class IABookmarksList extends LitElement {
  static get styles() {
    return bookmarksListCSS;
  }

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
    return html`<ul>
        ${repeat(sortedBookmarks, bookmark => bookmark?.id, this.bookmarkItem.bind(this))}
        <div class="separator"></div>
      </ul>`;
  }

  render() {
    return html`
      ${this.renderHeader ? this.headerSection : nothing}
      ${Object.keys(this.bookmarks).length ? this.bookmarkslist : nothing}
    `;
  }
}
