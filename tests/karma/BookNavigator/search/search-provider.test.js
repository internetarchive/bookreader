import { expect, fixtureCleanup, fixtureSync } from '@open-wc/testing';
import sinon from 'sinon';
import searchProvider from '../../../../src/BookNavigator/search/search-provider';

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

    expect(provider.bookreader).to.exist;
    expect(provider.onProviderChange).to.exist;
    expect(provider.id).to.equal('search');
    expect(provider.icon).to.exist;
    expect(fixtureSync(provider.icon).tagName).to.equal('IA-ICON-SEARCH');
    expect(provider.label).to.equal('Search inside');
    expect(provider.menuDetails).to.exist;
    expect(provider.component).to.exist;
  });
  describe('BR calls', () => {
    it('`advanceToPage', () => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {
          leafNumToIndex: sinon.fake(),
          _searchPluginGoToResult: sinon.fake()
        }
      });

      provider.advanceToPage(1);
      expect(provider?.bookreader.leafNumToIndex.callCount).to.equal(1);
      expect(provider?.bookreader._searchPluginGoToResult.callCount).to.equal(1);
    });
  });
  describe('Search request life cycles', () => {
    it('Event: catches `BookReader:SearchStarted`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'updateMenu');
      window.dispatchEvent(new CustomEvent('BookReader:SearchStarted', { detail: { props: { term: 'foo' }}}));
      expect(provider.updateMenu.callCount).to.equal(1);
    });
    it('Event: catches `BookReader:SearchCallback`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'updateMenu');
      const brStub = {};
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallback', { detail: { props: { instance: brStub, results: { matches: []} }}}));
      expect(provider.updateMenu.callCount).to.equal(1);
      expect(provider.bookreader).to.equal(brStub);
    });
    it('Event: catches `BookReader:SearchCallbackEmpty`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'onSearchRequestError');
      sinon.spy(provider, 'updateMenu');
      const brStub = {};
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallbackEmpty', { detail: { props: { instance: brStub }}}));
      expect(provider.onSearchRequestError.getCall(0).args[1]).to.equal('noResults');
      expect(provider.updateMenu.callCount).to.equal(1);
      expect(provider.bookreader).to.equal(brStub);
    });
    it('Event: catches `BookReader:SearchCallbackNotIndexed`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      const brStub = {};
      sinon.spy(provider, 'onSearchRequestError');
      sinon.spy(provider, 'updateMenu');
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallbackNotIndexed', { detail: { props: { instance: brStub }}}));
      expect(provider.onSearchRequestError.getCall(0).args[1]).to.equal('notIndexed');
      expect(provider.updateMenu.callCount).to.equal(1);
      expect(provider.bookreader).to.equal(brStub);
    });
    it('Event: catches `BookReader:SearchCallbackError`', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {}
      });
      sinon.spy(provider, 'onSearchRequestError');
      sinon.spy(provider, 'updateMenu');
      const brStub = {};
      window.dispatchEvent(new CustomEvent('BookReader:SearchCallbackError', { detail: { props: { instance: brStub }}}));
      expect(provider.onSearchRequestError.getCall(0).args[1]).to.equal(undefined);
      expect(provider.updateMenu.callCount).to.equal(1);
      expect(provider.bookreader).to.equal(brStub);
    });
    it('Event: catches `component@resultSelected` - user clicks result in side panel - & turns page', async() => {
      const provider = new searchProvider({
        onProviderChange: sinon.fake(),
        bookreader: {
          leafNumToIndex: sinon.fake(),
          _searchPluginGoToResult: sinon.fake()
        }
      });
      sinon.spy(provider, 'advanceToPage');

      const searchResultStub = {
        match: { par: [{ text: 'foo', page: 3 }] },
      };
      fixtureSync(provider.component).dispatchEvent(
        new CustomEvent('resultSelected',
          { detail: searchResultStub })
      );

      expect(provider.advanceToPage.callCount).to.equal(1);
      expect(provider.bookreader._searchPluginGoToResult.callCount).to.equal(1);
    });
  });
});
