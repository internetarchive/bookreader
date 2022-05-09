import {
  html,
  fixtureSync,
  fixtureCleanup,
} from '@open-wc/testing-helpers';
import '@/src/BookNavigator/bookmarks/ia-bookmarks.js';
import sinon from 'sinon';

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('<ia-bookmarks>', () => {
  test('uses `setup` to start component', async () => {
    const el = fixtureSync(html`<ia-bookmarks displayMode="bookmarks"></ia-bookmarks>`);
    el.bookreader = {
      bookId: 'foo',
      $,
      currentIndex: () => 0,
    };
    await el.updateComplete;
    const fetchUserBookmarks = sinon.spy(el, 'fetchUserBookmarks');
    const fetchBookmarks = sinon.stub(el, 'fetchBookmarks');

    el.setup();
    await el.updateComplete;

    expect(fetchUserBookmarks.callCount).toEqual(1);
    expect(fetchBookmarks.callCount).toEqual(1);
  });

  test('does not fetch user bookmarks if displayMode = login', async () => {
    const el = fixtureSync(html`<ia-bookmarks displayMode="login"></ia-bookmarks>`);
    await el.updateComplete;
    const fetchSpy = sinon.spy(el, 'fetchUserBookmarks');
    const fetchBookmarks = sinon.stub(el, 'fetchBookmarks');

    el.setup();
    await el.updateComplete;

    expect(fetchSpy.callCount).toEqual(0);
    expect(fetchBookmarks.callCount).toEqual(0);
  });
});
