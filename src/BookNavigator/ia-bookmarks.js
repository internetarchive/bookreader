/* eslint-disable compat/compat */
import { render, nothing } from 'lit-html';
import { LitElement, html, css } from 'lit-element';
import buttonStyles from './styles/button-base.js';

const api = {
  endpoint: '/services/bookmarks.php',
  headers: {
    'Content-Type': 'application/json',
  },
  delete(page) {
    return fetch(`${this.endpoint}?identifier=${this.identifier}&page_num=${page}`, {
      credentials: 'same-origin',
      method: 'DELETE',
      headers: this.headers,
    });
  },
  get(page) {
    return fetch(`${this.endpoint}?identifier=${this.identifier}&page_num=${page}`, {
      credentials: 'same-origin',
      method: 'GET',
      headers: this.headers,
    });
  },
  getAll() {
    return fetch(`${this.endpoint}?identifier=${this.identifier}`, {
      credentials: 'same-origin',
      method: 'GET',
      headers: this.headers,
    });
  },
  post(bookmark) {
    return this.sendBookmarkData(bookmark, 'POST');
  },
  put(bookmark) {
    return this.sendBookmarkData(bookmark, 'POST');
  },
  sendBookmarkData(bookmark, method) {
    const notes = {
      note: bookmark.note,
      color: bookmark.color,
    };
    return fetch(`${this.endpoint}?identifier=${this.identifier}&page_num=${bookmark.id}`, {
      credentials: 'same-origin',
      method,
      headers: this.headers,
      body: JSON.stringify({
        notes,
      }),
    });
  },
};

class IABookmarks extends LitElement {
  static get properties() {
    return {
      activeBookmarkID: { type: String },
      bookmarks: { type: Array },
      bookreader: { type: Object },
      editedBookmark: { type: Object },
    };
  }

  static get styles() {
    const mainCss = css`
      .bookmarks {
        height: 100%;
        overflow: hidden;
        padding-bottom: 20px;
      }

      .list ia-bookmark-edit {
        display: none;
      }

      .edit ia-bookmarks-list {
        display: none;
      }
      
    `;

    return [buttonStyles, mainCss];
  }

  static formatPage(page) {
    return isNaN(+page) ? `(${page.replace(/\D/g, '')})` : page;
  }

  constructor() {
    super();
    this.bookmarks = [];
    this.bookreader = {};
    this.editedBookmark = {};

    this.bookmarkColors = [{
      id: 0,
      className: 'red',
    }, {
      id: 1,
      className: 'blue',
    }, {
      id: 2,
      className: 'green',
    }];

    // eslint-disable-next-line
    this.defaultColor = this.bookmarkColors[0];
    this.api = api;
  }

  updated(changed) {
    this.emitBookmarksChanged();
  }

  setup() {
    this.api.identifier = this.bookreader.bookId;
    this.fetchBookmarks().then(() => this.initializeBookmarks());
  }

  initializeBookmarks() {
    ['3PageViewSelected'].forEach((event) => {
      window.addEventListener(`BookReader:${event}`, (e) => {
        setTimeout(() => {
          // wait a lil bit so bookreader can draw its DOM to attach onto
          this.renderBookmarkButtons();
        }, 100);
      });
    });
    ['pageChanged', '1PageViewSelected', '2PageViewSelected'].forEach((event) => {
      window.addEventListener(`BookReader:${event}`, (e) => {
        setTimeout(() => {
          // wait a lil bit so bookreader can draw its DOM to attach onto
          this.renderBookmarkButtons();
          this.markActiveBookmark();
        }, 100);
      });
    });
    ['zoomOut', 'zoomIn', 'resize'].forEach((event) => {
      window.addEventListener(`BookReader:${event}`, () => {
        if (this.bookreader.mode === this.bookreader.constModeThumb) {
          this.renderBookmarkButtons();
        }
      });
    });

    this.renderBookmarkButtons();
    this.markActiveBookmark(true);
    this.emitBookmarksChanged();
  }

  /**
   * @typedef {object} Bookmark
   * @property {number} id - bookreader page index, becomes key store
   * @property {number} color - color number
   * @property {string} page - bookmark's page label to display
   * @property {string} note - optional, note that one can add
   * @property {string} thumbnail - optional, image url
   */
  /**
   * Formats bookmark view model
   * @param {Object} bookmarkAttrs
   * @param {number} bookmarkAttrs.leafNum
   * @param {string} bookmarkAttrs.notes
   *
   * @returns Bookmark
   */
  formatBookmark({ leafNum = '', notes = {} }) {
    const { note = '', color } = notes;
    const nomalizedParams = {
      note,
      color: this.getBookmarkColor(color) ? color : this.defaultColor.id,
    };

    const page = IABookmarks.formatPage(this.bookreader.getPageNum(leafNum));
    const thumbnail = this.bookreader.getPageURI(`${leafNum}`.replace(/\D/g, ''), 32); // Request thumbnail 1/32 the size of original image
    const bookmark = {
      ...nomalizedParams,
      id: leafNum,
      leafNum,
      page,
      thumbnail,
    };

    return bookmark;
  }

  fetchBookmarks() {
    return this.api.getAll().then((res) => res.json()).then(({
      success,
      error = 'Something happened while fetching bookmarks.',
      value: bkmrks = [],
    }) => {
      if (!success) {
        throw new Error(`Failed to load bookmarks: ${error}`);
      }

      const bookmarks = {};
      Object.keys(bkmrks).forEach((leafNum) => {
        const bookmark = bkmrks[leafNum];
        const formattedLeafNum = parseInt(leafNum, 10);
        const formattedBookmark = this.formatBookmark({ ...bookmark, leafNum: formattedLeafNum });
        bookmarks[leafNum] = formattedBookmark;
      });

      this.bookmarks = bookmarks;
      return bookmarks;
    });
  }

  emitBookmarksChanged() {
    this.dispatchEvent(new CustomEvent('bookmarksChanged', {
      bubbles: true,
      composed: true,
      detail: {
        bookmarks: this.bookmarks,
      },
    }));
  }

  emitBookmarkButtonClicked() {
    this.dispatchEvent(new CustomEvent('bookmarkButtonClicked', {
      bubbles: true,
      composed: true,
      detail: {
        editedBookmark: this.editedBookmark,
      },
    }));
  }

  bookmarkButtonClicked(pageID) {
    if (this.getBookmark(pageID)) {
      this.confirmDeletion(pageID);
    } else {
      this.createBookmark(pageID);
    }
  }

  renderBookmarkButtons() {
    const pages = this.bookreader.$('.BRpagecontainer').not('.BRemptypage').get();

    pages.forEach((pageEl) => {
      const existingButton = pageEl.querySelector('.bookmark-button');
      if (existingButton) { existingButton.remove(); }
      const pageID = +pageEl.classList.value.match(/pagediv\d+/)[0].replace(/\D/g, '');
      const pageBookmark = this.getBookmark(pageID);
      const bookmarkState = pageBookmark ? 'filled' : 'hollow';
      // eslint-disable-next-line
      const pageData = this.bookreader._models.book.getPage(pageID);
      const { isViewable } = pageData;

      if (!isViewable) { return; }

      const bookmarkButton = document.createElement('div');
      ['mousedown', 'mouseup'].forEach((event) => {
        bookmarkButton.addEventListener(event, (e) => e.stopPropagation());
      });
      bookmarkButton.classList.add('bookmark-button', bookmarkState);
      if (pageBookmark) {
        bookmarkButton.classList.add(this.getBookmarkColor(pageBookmark.color));
      }
      const pageSide = (pageEl.getAttribute('data-side') === 'L' && this.bookreader.mode === this.bookreader.constMode2up)
        ? 'left' : 'right';

      render(html`
        <bookmark-button
          @bookmarkButtonClicked=${() => this.bookmarkButtonClicked(pageID)}
          state=${bookmarkState}
          side=${pageSide}
        ></bookmark-button>`, bookmarkButton);
      pageEl.appendChild(bookmarkButton);
    });
  }

  /**
   * Notes which bookmark is active
   *
   * @param {boolean} atSetup - denotes the first time this is fired
   */
  markActiveBookmark(atSetup = false) {
    const { mode, constMode2up, constModeThumb } = this.bookreader;
    const currentIndex = this.bookreader.currentIndex();

    if (mode === constModeThumb) {
      // keep active bookmark the same
      // no syncing until we can verify when a bookmark is "in view"
      const requestedPageHasBookmark = this.bookmarks[currentIndex];
      if (atSetup && requestedPageHasBookmark) {
        this.activeBookmarkID = currentIndex;
      }
      return;
    }
    // In 2up, we prefer the right side of the page to bookmark
    // so let's make sure we light that one up.
    if (mode === constMode2up) {
      const pagesInView = this.bookreader.displayedIndices;
      const pagesHaveActiveBookmark = pagesInView.includes(+this.activeBookmarkID);
      if (pagesHaveActiveBookmark) {
        return;
      }
    }

    // If a bookmark exists with the current index, set it as active
    if (this.bookmarks[currentIndex]) {
      this.activeBookmarkID = currentIndex;
      return;
    }

    // No bookmark for this page
    this.activeBookmarkID = '';
  }

  bookmarkEdited({ detail }) {
    const closeEdit = detail.bookmark.id === this.editedBookmark.id;
    this.editedBookmark = closeEdit ? {} : detail.bookmark;
  }

  /**
   * Gets bookmark by pageindex
   * @param {number} id
   */
  getBookmark(id) {
    return this.bookmarks[id];
  }

  getBookmarkColor(id) {
    return this.bookmarkColors.find((m) => m.id === id)?.className;
  }

  /**
   * Adds bookmark for current page
   */
  addBookmark() {
    let pageID = this.bookreader.currentIndex();
    if (this.bookreader.mode === this.bookreader.constMode2up) {
      const pagesInView = this.bookreader.displayedIndices;

      // add bookmark to right hand page
      pageID = pagesInView[pagesInView.length - 1];
    }
    this.createBookmark(pageID);
  }

  /**
   * Creates bookmark for a given page
   * @param {number} pageID
   */
  createBookmark(pageID) {
    const existingBookmark = this.getBookmark(pageID);
    if (existingBookmark) {
      this.bookmarkEdited({ detail: { bookmark: existingBookmark } });
      this.emitBookmarkButtonClicked();
      return;
    }

    this.editedBookmark = this.formatBookmark({ leafNum: pageID });

    this.api.post(this.editedBookmark);

    this.bookmarks[pageID] = this.editedBookmark;
    this.activeBookmarkID = pageID;
    this.disableAddBookmarkButton = true;
    this.renderBookmarkButtons();
    this.emitBookmarkButtonClicked();
  }

  bookmarkSelected({ detail }) {
    const { leafNum } = detail.bookmark;
    this.bookreader.jumpToPage(`${this.bookreader.getPageNum(`${leafNum}`.replace(/\D/g, ''))}`);
    this.activeBookmarkID = leafNum;
  }

  saveBookmark({ detail }) {
    const existingBookmark = this.bookmarks[detail.bookmark.id];
    Object.assign(existingBookmark, detail.bookmark);
    this.api.put(existingBookmark);
    this.editedBookmark = {};
    this.renderBookmarkButtons();
  }

  confirmDeletion(pageID) {
    const existingBookmark = this.getBookmark(pageID);
    if (existingBookmark.note) {
      this.emitShowModal(pageID);
      return;
    }
    this.deleteBookmark({ detail: { id: `${pageID}` } });
  }

  emitShowModal(pageID) {
    this.dispatchEvent(new CustomEvent('showItemNavigatorModal', {
      bubbles: true,
      composed: true,
      detail: {
        customModalContent: html`
          <delete-modal-actions
            .deleteAction=${() => this.deleteBookmark({ detail: { id: `${pageID}` } })}
            .cancelAction=${() => this.emitCloseModal()}
            .pageID=${pageID}
          ></delete-modal-actions>
        `,
      },
    }));
  }

  emitCloseModal() {
    this.dispatchEvent(new CustomEvent('closeItemNavigatorModal', {
      bubbles: true,
      composed: true,
    }));
  }

  deleteBookmark({ detail }) {
    const { id } = detail;
    const currBookmarks = this.bookmarks;
    delete currBookmarks[id];
    this.bookmarks = { ...currBookmarks };

    this.api.delete(detail.id);
    this.editedBookmark = {};
    this.emitCloseModal();
    this.renderBookmarkButtons();
  }


  /**
   * Tells us if we should allow user to add bookmark via menu panel
   * returns { Boolean }
   */
  get shouldEnableAddBookmarkButton() {
    const pageToCheck = this.bookreader.mode === this.bookreader.constMode2up
      ? this.bookreader.displayedIndices[this.bookreader.displayedIndices.length - 1]
      : this.bookreader.currentIndex();
    const pageHasBookmark = this.getBookmark(pageToCheck);
    return !!pageHasBookmark;
  }


  get allowAddingBookmark() {
    return this.bookreader.mode !== this.bookreader.constModeThumb;
  }

  render() {
    const enableAddBookmark = this.shouldEnableAddBookmarkButton;

    const addBookmarkButton = html`
      <button
        class="ia-button primary"
        ?disabled=${enableAddBookmark}
        @click=${this.addBookmark}
      >Add bookmark</button>
    `;

    return html`
      <section class="bookmarks">
        <ia-bookmarks-list
          @bookmarkEdited=${this.bookmarkEdited}
          @bookmarkSelected=${this.bookmarkSelected}
          @saveBookmark=${this.saveBookmark}
          @deleteBookmark=${this.deleteBookmark}

          .editedBookmark=${this.editedBookmark}
          .bookmarks=${{ ...this.bookmarks }}
          .activeBookmarkID=${this.activeBookmarkID}

          .bookmarkColors=${this.bookmarkColors}
          .defaultBookmarkColor=${this.defaultColor}
        ></ia-bookmarks-list>
        ${this.allowAddingBookmark ? addBookmarkButton : nothing}
      </section
    `;
  }
}

customElements.define('ia-bookmarks', IABookmarks);
