import '../../src/js/jquery-ui-wrapper.js';
import 'jquery.browser';
import '../../src/js/dragscrollable-br.js';
import 'jquery-colorbox';

import sinon from 'sinon';
import BookReader from '../../src/js/BookReader.js';
/** @typedef {import('../../src/js/BookReader/options.js').BookReaderOptions} BookReaderOptions */

afterEach(() => {
  jest.restoreAllMocks();
  sinon.restore();
});

const CACHE_MOCK = { 1: { reduce: 3, loaded: true }};
const FIRST_PAGE_MOCK = { width: 123, height: 123, uri: 'https://archive.org/image0.jpg', pageNum: '1' };
/** @type {BookReaderOptions['data']} */
const SAMPLE_DATA = [
  [ FIRST_PAGE_MOCK ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image1.jpg', pageNum: '2' },
    { width: 123, height: 123, uri: 'https://archive.org/image2.jpg', pageNum: '3' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image3.jpg', pageNum: '4' },
    { width: 123, height: 123, uri: 'https://archive.org/image4.jpg', pageNum: '5' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image5.jpg', pageNum: '6' },
  ],
];

describe('Image Cache', () => {
  test('has image cache in bookreader instance', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    expect(br.imageCache).toBeTruthy();
  });

  describe('`image` call', () => {
    test('calling `image` will create an image if none is cached', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      const createImageStub = sinon.spy(br.imageCache, '_createImage');
      br.imageCache.image(1, 5);
      expect(createImageStub.callCount).toBe(1);
    });
    test('will pull from cache if image of a good quality has been stored', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      const serveImgElStub = sinon.spy(br.imageCache, '_serveImageElement');
      const createImageStub = sinon.spy(br.imageCache, '_createImage');
      br.imageCache.cache = CACHE_MOCK;
      br.imageCache.image(1, 5);
      expect(createImageStub.callCount).toBe(0);
      expect(serveImgElStub.callCount).toBe(1);
    });
  });

  describe('`imageLoaded` call', () => {
    test('returns true if image in cache', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.imageCache.cache = CACHE_MOCK;
      const isImgLoaded = br.imageCache.imageLoaded(1, 3);
      expect(isImgLoaded).toBe(true);
    });
    test('returns true if image reducer in cache is good enough', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.imageCache.cache = CACHE_MOCK;
      const isImgLoaded = br.imageCache.imageLoaded(1, 5);
      expect(isImgLoaded).toBe(true);
    });
    test('returns false if no image in cache', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.imageCache.cache = CACHE_MOCK;
      const isImgLoaded = br.imageCache.imageLoaded(2, 3);
      expect(isImgLoaded).toBe(false);
    });
    test('returns false if reducer to check is better than cache', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.imageCache.cache = CACHE_MOCK;
      const isImgLoaded = br.imageCache.imageLoaded(1, 2);
      expect(isImgLoaded).toBe(false);
    });
    test('returns false if image hasn not loaded', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.imageCache.cache = { 1: { reduce: 4, loaded: false }};
      const isImgLoaded = br.imageCache.imageLoaded(1, 2);
      expect(isImgLoaded).toBe(false);
    });
  });

  describe('`_createImage` call', () => {
    test('adds to cache', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      // starting spread
      expect(Object.keys(br.imageCache.cache).length).toBe(2);
      // add image
      br.imageCache.image(1, 5);
      expect(Object.keys(br.imageCache.cache).length).toBe(3);
      expect(br.imageCache.cache[1]).toBeTruthy();
    });
    test('returns image element', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      const serveImgElStub = sinon.spy(br.imageCache, '_serveImageElement');
      const img = br.imageCache.image(0, 5);
      expect(serveImgElStub.callCount).toBe(1);
      expect($(img).length).toBe(1);
    });
  });

  describe('`_serveImageElement` call', () => {
    test('returns jQuery image element', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      const img = br.imageCache._serveImageElement(0);
      expect($(img).length).toBe(1);
      expect($(img)[0].classList.contains('BRpageimage')).toBe(true);
      expect($(img).attr('src')).toBe(FIRST_PAGE_MOCK.uri);
    });
  });

  describe('`_bustImageCache` call', () => {
    test('gets called during `_createImage` if requested image has  better scale factor', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.imageCache.image(1, 5); // add new image
      expect(br.imageCache.cache[1].reduce).toEqual(5);
      const bustCacheStub = sinon.spy(br.imageCache, '_bustImageCache');
      br.imageCache.image(1, 3); // add same image w/ better reducer
      expect(br.imageCache.cache[1].reduce).toEqual(3);
      expect(bustCacheStub.callCount).toBe(1);
    })
    test('deletes item from cache', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.imageCache.image(1, 5); // add new image
      expect(br.imageCache.cache[1]).toBeTruthy();
      br.imageCache._bustImageCache(1); // add same image w/ better reducer
      expect(br.imageCache.cache[1]).toBe(undefined);
    })
  });
});
