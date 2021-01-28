import { render } from 'lit-html';
import { LitElement, html, css } from 'lit-element';

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
      renderHeader: { type: Boolean },
      renderAddBookmarkButton: { type: Boolean },
      disableAddBookmarkButton: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      .list ia-bookmark-edit {
        display: none;
      }

      .edit ia-bookmarks-list {
        display: none;
      }
    `;
  }

  static formatPage(page) {
    return isNaN(+page) ? `(${page.replace(/\D/g, '')})` : page;
  }

  constructor() {
    super();
    this.bookmarks = [];
    this.bookreader = {};
    this.editedBookmark = {};
    this.renderHeader = false;
    this.renderAddBookmarkButton = true;
    this.disableAddBookmarkButton = false;

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

  setup() {
    this.api.identifier = this.bookreader.bookId;
    this.fetchBookmarks().then(() => this.initializeBookmarks());
  }

  initializeBookmarks() {
    ['pageChanged', '1PageViewSelected', '2PageViewSelected', '3PageViewSelected'].forEach((event) => {
      window.addEventListener(`BookReader:${event}`, (e) => {
        setTimeout(() => {
          // wait a lil bit so bookreader can draw its DOM to attach onto
          this.renderBookmarkButtons();
          this.toggleAddBookmarkButton();
          this.markActiveBookmark();
          this.toggleAddBookmarkButtonBehavior();
        }, 100);
      });
    });
    ['zoomOut', 'zoomIn', 'resize'].forEach((event) => {
      window.addEventListener(`BookReader:${event}`, () => {
        if (this.bookreader.mode === this.bookreader.constModeThumb) {
          this.renderBookmarkButtons();
          this.toggleAddBookmarkButton();
        }
      });
    });

    this.renderBookmarkButtons();
    this.markActiveBookmark();
    this.toggleAddBookmarkButton();
    this.toggleAddBookmarkButtonBehavior();
    this.emitBookmarksChanged();
  }

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
      id: `${leafNum}`,
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

      const bookmarks = Object.keys(bkmrks).map((leafNum) => {
        const bookmark = bkmrks[leafNum];
        return this.formatBookmark({ ...bookmark, leafNum });
      });

      this.bookmarks = bookmarks;
      return bookmarks;
    });
  }

  firstUpdated() {
    this.toggleAddBookmarkButton();
  }

  updated() {
    this.emitBookmarksChanged();
  }

  toggleAddBookmarkButton() {
    this.renderAddBookmarkButton = this.bookreader.mode !== this.bookreader.constModeThumb;
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

  markActiveBookmark() {
    const currentIndex = this.bookreader.currentIndex();
    if (Number.parseInt(this.activeBookmarkID, 10) !== currentIndex) {
      this.activeBookmarkID = '';
    }

    // If a bookmark exists with the current index, set it as active
    if (this.bookmarks.find((m) => +m.id === currentIndex)) {
      this.activeBookmarkID = `${currentIndex}`;
      return;
    }
    // If in 2up, need to check the page after current index as well
    if (this.bookreader.mode === this.bookreader.constMode2up) {
      if (this.bookmarks.find((m) => +m.id === currentIndex + 1)) {
        this.activeBookmarkID = `${currentIndex + 1}`;
        return;
      }
    }
    // If thumbnails, need to find first bookmark whose index is displayed
    if (this.bookreader.mode === this.bookreader.constModeThumb) {
      const firstActiveBookmark = this.bookmarks.find((m) => (
        // eslint-disable-next-line
        this.bookreader._isIndexDisplayed(+m.id)
      ));
      this.activeBookmarkID = firstActiveBookmark ? `${firstActiveBookmark.id}` : '';
    }
    // No bookmark for this page
    this.activeBookmarkID = '';
  }

  bookmarkEdited({ detail }) {
    this.editedBookmark = detail.bookmark;
  }

  getBookmark(id) {
    return this.bookmarks.find((m) => +m.id === id);
  }

  getBookmarkColor(id) {
    return this.bookmarkColors.find((m) => m.id === id)?.className;
  }

  addBookmarkButtonClicked() {
    let pageID = this.bookreader.currentIndex();
    if (this.bookreader.mode === this.bookreader.constMode2up) {
      pageID += 1;
    }
    this.createBookmark(pageID);
  }

  createBookmark(pageID) {
    const existingBookmark = this.getBookmark(pageID);
    if (existingBookmark) {
      this.bookmarkEdited({ detail: { bookmark: existingBookmark } });
      this.emitBookmarkButtonClicked();
      return;
    }

    this.editedBookmark = this.formatBookmark({ leafNum: pageID });

    this.api.post(this.editedBookmark);
    this.bookmarks.push(this.editedBookmark);
    this.sortBookmarks();
    this.activeBookmarkID = `${pageID}`;
    this.disableAddBookmarkButton = true;
    this.renderBookmarkButtons();
    this.emitBookmarkButtonClicked();
  }

  sortBookmarks() {
    this.bookmarks = [...this.bookmarks].sort((a, b) => {
      if (+a.id > +b.id) { return 1; }
      if (+a.id < +b.id) { return -1; }
      return 0;
    });
  }

  bookmarkSelected({ detail }) {
    const { leafNum } = detail.bookmark;
    this.bookreader.jumpToPage(`${this.bookreader.getPageNum(`${leafNum}`.replace(/\D/g, ''))}`);
    this.activeBookmarkID = leafNum;
    this.disableAddBookmarkButton = true;
  }

  saveBookmark({ detail }) {
    const existingBookmark = this.bookmarks.find((m) => m.id === detail.bookmark.id);
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
    this.bookmarks = this.bookmarks.filter((m) => m.id !== detail.id);
    this.api.delete(detail.id);
    this.editedBookmark = {};
    this.emitCloseModal();
    this.renderBookmarkButtons();
  }

  /**
   * confirm that page can add a bookmark
   * @return boolean
   */
  toggleAddBookmarkButtonBehavior() {
    const isThumbnailView = this.bookreader.mode === this.bookreader.constModeThumb;
    if (isThumbnailView) { return; }

    const is2UpView = this.bookreader.mode === this.bookreader.constMode2up;
    if (is2UpView) {
      const activeBookmarkID = Number.parseInt(this.activeBookmarkID, 10);
      const pagesInView = this.bookreader.displayedIndices;
      const defaultPageIndex = Math.max(...pagesInView);
      const activeBookmarkIsDefaultPage = defaultPageIndex === activeBookmarkID;
      const defaultPageAlsoHasBookmark = !!this.bookmarks.find((m) => +m.id === defaultPageIndex);
      this.disableAddBookmarkButton = activeBookmarkIsDefaultPage || defaultPageAlsoHasBookmark;
      return;
    }

    const currentIndex = this.bookreader.currentIndex();
    const currentIndexHasBookmark = this.bookmarks.find((m) => +m.id === currentIndex);
    this.disableAddBookmarkButton = !!currentIndexHasBookmark;
  }

  render() {
    return html`
      <ia-bookmarks-list
        @addBookmark=${this.addBookmarkButtonClicked}
        @bookmarkEdited=${this.bookmarkEdited}
        @bookmarkSelected=${this.bookmarkSelected}
        @saveBookmark=${this.saveBookmark}
        @deleteBookmark=${this.deleteBookmark}
        .editedBookmark=${this.editedBookmark}
        ?renderAddBookmarkButton=${this.renderAddBookmarkButton}
        ?disableAddBookmarkButton=${this.disableAddBookmarkButton}
        .renderHeader=${this.renderHeader}
        .bookmarkColors=${this.bookmarkColors}
        .defaultBookmarkColor=${this.defaultColor}
        .bookmarks=${this.bookmarks}
        .activeBookmarkID=${this.activeBookmarkID}
      ></ia-bookmarks-list>
    `;
  }
}

customElements.define('ia-bookmarks', IABookmarks);
