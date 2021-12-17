import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import searchProvider from '../../../../src/BookNavigator/search/search-provider';

afterEach(() => {
  sinon.restore();
});

describe('Search Provider', () => {
  describe('constructor', () => {
    const onProviderChange = sinon.fake();
    const fooBr = {};
    const bookreader = fooBr;
    const provider = new searchProvider({
      onProviderChange,
      bookreader
    });

    expect(provider.bookreader).to.equal(bookreader);
    expect(provider.onProviderChange).to.equal(onProviderChange);
    expect(provider.id).to.equal('search');
    expect(provider.icon).to.exist;
    expect(provider.label).to.equal('Search inside');
    expect(provider.menuDetails).to.exist;
    expect(provider.component).to.exist;
  });
});
