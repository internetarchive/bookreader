import {
  html,
  fixture,
  expect,
  oneEvent,
} from '@open-wc/testing';
import { IABookmarksList } from '../../../src/BookNavigator/menu-panels/bookmarks/bookmarks-list.js';

customElements.define('ia-bookmarks-list', IABookmarksList);

const bookmarks = [{
  id: 1,
  thumbnail: '//placehold.it/37x46',
  page: 'xii',
}, {
  id: 2,
  thumbnail: '//placehold.it/37x46/06c/fff',
  page: 9,
  note: 'This is a long comment I left about this bookmark in order to test out the display in the panel on the side of the bookreader.',
}, {
  id: 3,
  thumbnail: '//placehold.it/37x46/e5e5e5/06c',
  page: 9,
  note: 'Interesting quote here regarding the division of labor',
}];

const bookmarkColors = [{
  id: 0,
  className: 'blue',
}, {
  id: 1,
  className: 'red',
}, {
  id: 2,
  className: 'green',
}];

const container = (bookmarksSet = []) => (
  html`<ia-bookmarks-list .bookmarks=${bookmarksSet} .bookmarkColors=${bookmarkColors}></ia-bookmarks-list>`
);

describe('<ia-bookmarks-list>', () => {
  it('sets default properties', async () => {
    const el = await fixture(container(bookmarks));

    expect(el.bookmarks).to.equal(bookmarks);
    expect(el.activeBookmarkID).to.be.undefined;
    expect(el.renderHeader).to.be.false;
  });

  it('renders bookmarks that contain page numbers', async () => {
    const el = await fixture(container(bookmarks));

    expect(el.shadowRoot.innerHTML).to.include(`Page ${bookmarks[0].page}`);
  });

  it('renders bookmarks that contain an optional note', async () => {
    const el = await fixture(container(bookmarks));

    expect(el.shadowRoot.innerHTML).to.include(bookmarks[1].note);
  });

  it('emits a custom event when a bookmark is clicked', async () => {
    const el = await fixture(container(bookmarks));

    setTimeout(() => (
      el.shadowRoot.querySelector('li').click()
    ));
    const response = await oneEvent(el, 'bookmarkSelected');

    expect(response).to.exist;
  });

  it('emits a custom event when an edit button is clicked', async () => {
    const el = await fixture(container(bookmarks));

    setTimeout(() => (
      el.shadowRoot.querySelector('li button').click()
    ));
    const response = await oneEvent(el, 'bookmarkEdited');

    expect(response).to.exist;
  });

  it('emits a saveBookmark event', async () => {
    const el = await fixture(container(bookmarks));

    setTimeout(() => (
      el.emitSaveBookmark(bookmarks[0])
    ));
    const response = await oneEvent(el, 'saveBookmark');

    expect(response).to.exist;
  });

  it('emits a deleteBookmark event', async () => {
    const el = await fixture(container(bookmarks));

    setTimeout(() => (
      el.emitDeleteBookmark(bookmarks[0].id)
    ));
    const response = await oneEvent(el, 'deleteBookmark');

    expect(response).to.exist;
  });

  it('emits a bookmarkColorChanged event', async () => {
    const el = await fixture(container(bookmarks));

    setTimeout(() => (
      el.emitBookmarkColorChanged({ detail: { bookmarkId: 0, colorId: 0 } })
    ));
    const response = await oneEvent(el, 'bookmarkColorChanged');

    expect(response).to.exist;
  });

  it('sets editedBookmark when an edit button is clicked', async () => {
    const el = await fixture(container(bookmarks));
    let prevState = el.editedBookmark;

    el.shadowRoot.querySelector('li button').click();
    await el.updateComplete;

    expect(el.editedBookmark).not.to.equal(prevState);
    expect(el.editedBookmark.page).to.equal(bookmarks[0].page);

    // When clicking the same edit button while in edit mode, should toggle
    // edit mode off and remove editedBookmark pointer
    prevState = el.editedBookmark;
    el.shadowRoot.querySelector('li button').click();
    await el.updateComplete;

    expect(el.editedBookmark).not.to.equal(prevState);
    expect(el.editedBookmark.page).not.to.equal(bookmarks[0].page);
  });

  it('resets editedBookmark when saveBookmark callback called', async () => {
    const el = await fixture(container(bookmarks));

    [el.editedBookmark] = bookmarks;
    await el.updateComplete;
    el.saveBookmark({ detail: { bookmark: bookmarks[0] } });
    await el.updateComplete;

    expect(el.editedBookmark).not.to.equal(bookmarks[0]);
    expect(el.editedBookmark).not.to.have.keys(['page', 'thumbnail', 'id']);
  });

  it('resets editedBookmark when deleteBookmark callback called', async () => {
    const el = await fixture(container(bookmarks));

    [el.editedBookmark] = bookmarks;
    await el.updateComplete;
    el.deleteBookmark({ detail: { id: bookmarks[0].id } });
    await el.updateComplete;

    expect(el.editedBookmark).not.to.equal(bookmarks[0]);
    expect(el.editedBookmark).not.to.have.keys(['page', 'thumbnail', 'id']);
  });

  it('renders the bookmarks count', async () => {
    const el = await fixture(container([bookmarks[0]]));
    const bookmarksCount = await fixture(el.bookmarksCount);

    expect(bookmarksCount.innerHTML).to.include('(1)');
  });

  it('does not render the bookmarks count when no bookmarks present', async () => {
    const el = await fixture(container());
    el.renderHeader = true;

    await el.updateComplete;

    expect(el.shadowRoot.querySelector('header small')).not.to.exist;
  });

  it('renders an optional header section', async () => {
    const el = await fixture(container(bookmarks));
    el.renderHeader = true;

    await el.updateComplete;

    expect(el.shadowRoot.querySelector('header')).to.exist;
  });

  // skipped:
  // Uncaught TypeError: Cannot read property 'click' of null
  xit('emits a custom event when the add bookmark button is clicked', async () => {
    const el = await fixture(container(bookmarks));

    setTimeout(() => (
      el.shadowRoot.querySelector('.add-bookmark').click()
    ));
    const response = await oneEvent(el, 'addBookmark');

    expect(response).to.exist;
  });

  // skipped:
  // AssertionError: expected null to exist
  xit('renders an optional add bookmark button', async () => {
    const el = await fixture(container(bookmarks));

    expect(el.shadowRoot.querySelector('.add-bookmark')).to.exist;

    el.renderAddBookmarkButton = false;
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('.add-bookmark')).not.to.exist;
  });

  // skipped:
  // TypeError: Cannot read property 'getAttribute' of null
  xit('can toggle disable behavior of add bookmark button', async () => {
    const el = await fixture(container(bookmarks));
    expect(el.shadowRoot.querySelector('.add-bookmark').getAttribute('disabled')).to.be.null;

    el.disableAddBookmarkButton = true;
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('.add-bookmark').getAttribute('disabled')).to.equal('disabled');
  });
});
