import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import searchProvider from '../../../../src/BookNavigator/search/search-provider';

afterEach(() => {
  sinon.restore();
});

describe('Search Provider', () => {
  describe('constructor', () => {
    const onSearchChangeCB = sinon.fake();
    const br = sinon.fake();
    const provider = new searchProvider(onSearchChangeCB, br);

    expect(provider.bookreader).to.equal(br);
    expect(provider.onSearchChange).to.equal(onSearchChangeCB);
    expect(provider.id).to.equal('search');
    expect(provider.icon).to.exist;
    expect(provider.label).to.equal('Search inside');
    expect(provider.menuDetails).to.exist;
    expect(provider.component).to.exist;
  });
});
