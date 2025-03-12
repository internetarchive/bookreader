import { fixtureSync } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import SharingProvider from '@/src/BookNavigator/sharing.js';

afterEach(() => {
  sinon.restore();
});

const item = {
  metadata: {
    identifier: 'stubby-id',
    creator: 'mr. big',
    title: 'Stubby title',
  },
};

const baseHost = 'foo.org';
const subPrefix = 'beep-boop_12 4 5';

describe('Sharing Provider', () => {
  describe('constructor', () => {
    const provider = new SharingProvider({
      item,
      baseHost,
      bookreader: {
        options: { subPrefix },
      },
    });

    expect(provider.id).toEqual('share');
    expect(provider.icon).toBeDefined();
    expect(provider.label).toEqual('Share this book');
    expect(fixtureSync(provider.component).tagName).toContain('IAUX-IN-SHARE-PANEL');
  });

  describe('Handles being a sub file/volume', () => {
    test('encodes the subprefix if it has one', async () => {
      const provider = new SharingProvider({
        item,
        baseHost,
        bookreader: {
          subPrefix,
        },
      });

      expect(fixtureSync(provider.component).fileSubPrefix).toEqual(subPrefix);
    });
  });
});
