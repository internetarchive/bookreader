import { html } from 'lit-element';

import '../bookmark-button.js';
import '../delete-modal-actions.js';
import '../ia-bookmarks.js';

import { IABookmarksList } from '../../iaux-bookmarks/src/ia-bookmarks-list.js';
import { IAIconBookmark } from '@internetarchive/icon-bookmark';

customElements.define('ia-bookmarks-list', IABookmarksList);
customElements.define('icon-bookmark', IAIconBookmark);

export default class BookmarksProvider {
  constructor(options, bookreader) {
    Object.assign(this, options);
    this.component = document.createElement('ia-bookmarks');
    this.component.bookreader = bookreader;
    this.bindEvents();
    this.component.setup();

    this.icon = html`<icon-bookmark state="hollow" style="--iconWidth: 16px; --iconHeight: 24px;"></icon-bookmark>`;
    this.label = 'Bookmarks';
    this.id = 'bookmarks';
    this.updateMenu(this.component.bookmarks.length);
  }

  updateMenu(count) {
    this.menuDetails = `(${count})`;
  }

  bindEvents() {
    this.component.addEventListener('bookmarksChanged', this.bookmarksChanged.bind(this));
    this.component.addEventListener('showItemNavigatorModal', this.showItemNavigatorModal);
    this.component.addEventListener('closeItemNavigatorModal', this.closeItemNavigatorModal);
  }

  bookmarksChanged({ detail }) {
    const bookmarksLength = Object.keys(detail.bookmarks).length;
    this.updateMenu(bookmarksLength);
    this.onBookmarksChanged(detail.bookmarks);
  }
}
