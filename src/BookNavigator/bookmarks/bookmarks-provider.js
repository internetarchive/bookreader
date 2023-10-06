import { html } from 'lit';
import '../delete-modal-actions.js';
import './bookmark-button.js';
import './ia-bookmarks.js';

import './bookmark-edit.js';
import './bookmarks-list.js';
import '@internetarchive/icon-bookmark';


export default class BookmarksProvider {
  constructor(options) {
    const {
      baseHost,
      signedIn,
      bookreader,
      modal,
      onProviderChange,
    } = options;

    const referrerStr = `referer=${encodeURIComponent(location.href)}`;
    const loginUrl = `https://${baseHost}/account/login?${referrerStr}`;

    this.component = document.createElement('ia-bookmarks');
    this.component.bookreader = bookreader;
    this.component.displayMode = signedIn ? 'bookmarks' : 'login';
    this.component.modal = modal;
    this.component.loginOptions = {
      loginClicked: this.bookmarksLoginClicked,
      loginUrl
    };
    this.bindEvents();

    this.icon = html`<icon-bookmark state="hollow" style="--iconWidth: 16px; --iconHeight: 24px;"></icon-bookmark>`;
    this.label = 'Bookmarks';
    this.id = 'bookmarks';
    this.onProviderChange = onProviderChange;
    this.component.setup();
    this.updateMenu(this.component.bookmarks.length);
  }

  updateMenu(count) {
    this.menuDetails = `(${count})`;
  }

  bindEvents() {
    this.component.addEventListener('bookmarksChanged', this.bookmarksChanged.bind(this));
  }

  bookmarksChanged({ detail }) {
    const bookmarksLength = Object.keys(detail.bookmarks).length;
    this.updateMenu(bookmarksLength);
    this.onProviderChange(detail.bookmarks, detail.showSidePanel);
  }

  bookmarksLoginClicked() {
    window.archive_analytics?.send_event_no_sampling(
      'BookReader',
      `BookmarksLogin`,
      window.location.path,
    );
  }
}
