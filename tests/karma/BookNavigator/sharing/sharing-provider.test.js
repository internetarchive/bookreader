import { expect, fixtureSync } from '@open-wc/testing';
import sinon from 'sinon';
import SharingProvider from '../../../../src/BookNavigator/sharing.js';

afterEach(() => {
  sinon.restore();
});

const item = {
  metadata: {
    identifier: 'stubby-id',
    creator: 'mr. big',
    title: 'Stubby title',
  }
};

const baseHost = 'foo.org';
const subPrefix = 'beep-boop_12 4 5';

describe('Sharing Provider', () => {
  describe('constructor', () => {
    const provider = new SharingProvider({
      item,
      baseHost,
      bookreader: {
        options: { subPrefix }
      }
    });

    expect(provider.id).to.equal('share');
    expect(provider.icon).to.exist;
    expect(provider.label).to.equal('Share this book');
    expect(fixtureSync(provider.component).tagName).to.contains('IA-SHARING-OPTIONS');
  });

  describe('Handles being a sub file/volume', () => {
    it('encodes the subprefix if it has one', async () => {
      const provider = new SharingProvider({
        item,
        baseHost,
        bookreader: {
          options: { subPrefix }
        }
      });

      expect(fixtureSync(provider.component).fileSubPrefix).to.equal(subPrefix);
    });
  });
});
