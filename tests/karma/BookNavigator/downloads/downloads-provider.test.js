import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import downloadsProvider from '../../../../src/BookNavigator/downloads/downloads-provider';

afterEach(() => {
  sinon.restore();
});

describe('Downloads Provider', () => {
  describe('constructor', () => {
    const isBookProtected = false;
    const provider = new downloadsProvider(isBookProtected);

    expect(provider.id).to.equal('downloads');
    expect(provider.icon).to.exist;
    expect(provider.label).to.equal('Downloadable Files');
    expect(provider.menuDetails).to.exist;
    expect(provider.component).to.exist;
  });
});
