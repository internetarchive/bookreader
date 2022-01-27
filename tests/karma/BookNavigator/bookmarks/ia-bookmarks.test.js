import {
  html,
  fixtureSync,
  expect,
  fixtureCleanup,
} from '@open-wc/testing';
import '../../../../src/BookNavigator/bookmarks/ia-bookmarks.js';
import sinon from 'sinon';

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('<ia-bookmarks>', () => {
  it('uses `setup` to start component', async () => {
    const el = fixtureSync(html`<ia-bookmarks></ia-bookmarks>`);
    await el.updateComplete;

    let fetchHappened = false;
    el.bookreader.bookId = 'foo';
    el.displayMode = 'bookmarks';

    el.fetchBookmarks = async () => {
      fetchHappened = true;
      return await Promise.resolve();
    };

    const fetchSpy = sinon.spy(el, 'fetchUserBookmarks');

    el.setup();
    await el.updateComplete;

    expect(fetchSpy.callCount).to.equal(1);
    expect(fetchHappened).to.equal(true);
  });
  it('does not fetch user bookmarks if displayMode = login', async () => {
    const el = fixtureSync(html`<ia-bookmarks></ia-bookmarks>`);
    await el.updateComplete;

    let fetchHappened = false;
    el.displayMode = 'login';

    el.fetchBookmarks = async () => {
      fetchHappened = true;
      return await Promise.resolve();
    };

    const fetchSpy = sinon.spy(el, 'fetchUserBookmarks');

    el.setup();
    await el.updateComplete;

    expect(fetchSpy.callCount).to.equal(0);
    expect(fetchHappened).to.equal(false);
  });
});
