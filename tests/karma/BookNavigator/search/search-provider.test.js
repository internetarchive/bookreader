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
      sinon.spy(provider, 'onSearchStarted');
      provider.updateMenu = sinon.fake();
      window.dispatchEvent(new CustomEvent('BookReader:SearchStarted', { detail: { props: { term: 'foo' }}}));
      expect(provider.updateMenu.callCount).to.equal(1);
    });
  });
});
