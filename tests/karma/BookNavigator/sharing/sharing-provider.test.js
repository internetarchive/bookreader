import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import sharingProvider from '../../../../src/ItemNavigator/providers/sharing.js';

afterEach(() => {
  sinon.restore();
});

const mdStub = {
  identifier: 'stubby-id'
};

const baseHostStub = 'foo.org';
const itemType = 'texts';
const subPrefix = 'beep-boop_12 4 5';

describe('Sharing Provider', () => {
  describe('constructor', () => {
    const provider = new sharingProvider(mdStub, baseHostStub, itemType, subPrefix);

    expect(provider.id).to.equal('share');
    expect(provider.icon).to.exist;
    expect(provider.label).to.equal('Share this item');
    expect(provider.itemType).to.equal(itemType);
    expect(provider.idPath).to.exist;
    expect(provider.component).to.exist;
  });

  describe('handles subprefix', () => {
    it('encodes the subprefix if it has one', () => {
      const provider = new sharingProvider(mdStub, baseHostStub, itemType, subPrefix);
      const encodedSubprefix = encodeURIComponent(subPrefix);
      expect(provider.idPath).to.equal(`${mdStub.identifier}/${encodedSubprefix}`);
    });
    it('does not add subprefix to path if subprefix is item id', () => {
      const provider = new sharingProvider(mdStub, baseHostStub, itemType, mdStub.identifier);
      expect(provider.idPath).to.equal(mdStub.identifier);
    });
  });
});
