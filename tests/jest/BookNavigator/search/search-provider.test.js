import { fixtureCleanup, fixtureSync } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import searchProvider from '@/src/BookNavigator/search/search-provider';

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('Search Provider', () => {
  describe('constructor', () => {
    const provider = new searchProvider({
      onProviderChange: sinon.fake(),
      bookreader: {}
    });

    expect(provider.bookreader).toBeDefined();
    expect(provider.onProviderChange).toBeDefined();
    expect(provider.id).toEqual('search');
    expect(provider.icon).toBeDefined();
    expect(fixtureSync(provider.icon).tagName).toEqual('IA-ICON-SEARCH');
    expect(provider.label).toEqual('Search inside');
    expect(provider.menuDetails).toBeDefined();
    expect(provider.component).toBeDefined();
  });
  describe('Search request life cycles', () => {
    test('Event: catches `BookReader:SearchStarted`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'updateMenu');
      window.dispatchEvent(new CustomEvent('BookReader:SearchStarted', { detail: { props: { term: 'foo' }}}));
      expect(provider.updateMenu.callCount).toEqual(1);
    });
    test('Event: catches `BookReader:SearchCallback`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'updateMenu');
      const brStub = {};
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallback', { detail: { props: { instance: brStub, results: { matches: []} }}}));
      expect(provider.updateMenu.callCount).toEqual(1);
      expect(provider.bookreader).toEqual(brStub);
    });
    test('Event: catches `BookReader:SearchCallbackEmpty`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'onSearchRequestError');
      sinon.spy(provider, 'updateMenu');
      const brStub = {};
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallbackEmpty', { detail: { props: { instance: brStub }}}));
      expect(provider.onSearchRequestError.getCall(0).args[1]).toEqual('noResults');
      expect(provider.updateMenu.callCount).toEqual(1);
      expect(provider.bookreader).toEqual(brStub);
    });
    test('Event: catches `BookReader:SearchCallbackNotIndexed`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      const brStub = {};
      sinon.spy(provider, 'onSearchRequestError');
      sinon.spy(provider, 'updateMenu');
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallbackNotIndexed', { detail: { props: { instance: brStub }}}));
      expect(provider.onSearchRequestError.getCall(0).args[1]).toEqual('notIndexed');
      expect(provider.updateMenu.callCount).toEqual(1);
      expect(provider.bookreader).toEqual(brStub);
    });
    test('Event: catches `BookReader:SearchCallbackError`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'onSearchRequestError');
      sinon.spy(provider, 'updateMenu');
      const brStub = {};
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallbackError', { detail: { props: { instance: brStub }}}));
      expect(provider.onSearchRequestError.getCall(0).args[1]).toEqual(undefined);
      expect(provider.updateMenu.callCount).toEqual(1);
      expect(provider.bookreader).toEqual(brStub);
    });
    test('Event: catches `component@resultSelected` - user clicks result in side panel - & turns page', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {
          leafNumToIndex: sinon.fake(),
          _searchPluginGoToResult: sinon.fake()
        }
      });

      const searchResultStub = {
        match: { par: [{ text: 'foo', page: 3 }] },
      };
      fixtureSync(provider.component).dispatchEvent(
        new CustomEvent('resultSelected',
          { detail: searchResultStub })
      );

      expect(provider.bookreader._searchPluginGoToResult.callCount).toEqual(1);
    });
    test('update url when search is cancelled or input cleared', async() => {
      const urlPluginMock = {
        pullFromAddressBar: sinon.fake(),
        removeUrlParam: sinon.fake()
      };
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {
          leafNumToIndex: sinon.fake(),
          _searchPluginGoToResult: sinon.fake(),
          urlPlugin: urlPluginMock
        }
      });

      provider.onSearchCanceled();
      await provider.updateComplete;

      expect(urlPluginMock.pullFromAddressBar.callCount).toEqual(1);
      expect(urlPluginMock.removeUrlParam.callCount).toEqual(1);

      provider.onSearchCanceled();
      await provider.updateComplete;

      expect(urlPluginMock.pullFromAddressBar.callCount).toEqual(2);
      expect(urlPluginMock.removeUrlParam.callCount).toEqual(2);
    });
    it('updateSearchInUrl', async () => {
      let fieldToSet;
      let valueOfFieldToSet;
      let setUrlParamCalled = false;
      const urlPluginMock = {
        pullFromAddressBar: sinon.fake(),
        removeUrlParam: sinon.fake(),
        setUrlParam: (field, val) => {
          fieldToSet = field;
          valueOfFieldToSet = val;
          setUrlParamCalled = true;
        }
      };
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {
          leafNumToIndex: sinon.fake(),
          _searchPluginGoToResult: sinon.fake(),
          urlPlugin: urlPluginMock,
          search: sinon.fake()
        }
      });

      const searchInitiatedEvent = new CustomEvent('bookSearchInitiated', { detail: { query: 'foobar' } });
      // set initial seachState with a query
      provider.onBookSearchInitiated(searchInitiatedEvent);
      await provider.updateComplete;
      // checking this fn:
      provider.updateSearchInUrl();
      await provider.updateComplete;

      expect(fieldToSet).toEqual('q');
      expect(valueOfFieldToSet).toEqual('foobar');
      expect(setUrlParamCalled).toBe(true);
    });
  });
});
