import { fixtureCleanup, fixtureSync } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import bookmarksProvider from '@/src/plugins/bookmarks/bookmarks-provider.js';

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

const options = {
  baseHost: 'example.org',
  signedIn: true,
  bookreader: {},
  modal: {},
  onProviderChange: sinon.fake(),
};

describe('Bookmarks Provider', () => {
  test('constructor', () => {
    const provider = new bookmarksProvider(options);
    const providerForNonUser = new bookmarksProvider({ signedIn: false, bookreader: {} });
    const { component } = provider;

    expect(provider.id).toEqual('bookmarks');
    expect(provider.label).toEqual('Bookmarks');
    expect(fixtureSync(provider.icon).tagName).toEqual('ICON-BOOKMARK');
    expect(provider.onProviderChange).toBeDefined();

    expect(component.bookreader).toBeDefined();
    expect(component.modal).toBeDefined();
    expect(component.loginOptions.loginClicked).toBeDefined();
    expect(component.loginOptions.loginUrl).toContain('https://example.org/account/login?referer=');

    expect(component.displayMode).toEqual('bookmarks');
    expect(providerForNonUser.component.displayMode).toEqual('login');
  });

  test('`updateMenu()` sets `.menuDetails`', () =>{
    const provider = new bookmarksProvider(options);

    expect(provider.menuDetails).toEqual('(0)');

    provider.updateMenu(1);
    expect(provider.menuDetails).toEqual('(1)');

    provider.updateMenu(10);
    expect(provider.menuDetails).toEqual('(10)');
  });

  test('`bookmarksChanged()` updates `.menuDetails` and calls `onProviderChange()`', () => {
    const provider = new bookmarksProvider(options);
    const detailObject = {
      detail: {
        bookmarks: [ 1, 2 ],
        showSidePanel: true,
      },
    };

    expect(provider.menuDetails).toEqual('(0)');
    expect(provider.onProviderChange.calledOnce).toBe(false);

    provider.bookmarksChanged(detailObject);
    expect(provider.menuDetails).toEqual('(2)');
    expect(provider.onProviderChange.calledOnce).toBe(true);
    expect(provider.onProviderChange.firstArg).toEqual([1, 2]);
    expect(provider.onProviderChange.lastArg).toBe(true);

  });

  test('`bookmarksLoginClicked()` fires off analytics', () => {
    const provider = new bookmarksProvider(options);

    window.archive_analytics = {
      send_event_no_sampling: sinon.fake(),
      send_event: sinon.fake(),
    };

    expect(window.archive_analytics?.send_event_no_sampling.calledOnce).toBe(false);

    provider.bookmarksLoginClicked();
    expect(window.archive_analytics?.send_event_no_sampling.calledOnce).toBe(true);
  });
});
