import sinon from 'sinon';
import { BookModel } from '@/src/BookReader/BookModel.js';
import { ImageCache } from '@/src/BookReader/ImageCache.js';
import { Pow2ReduceSet } from '@/src/BookReader/ReduceSet.js';
/** @typedef {import('@/src/BookReader/options.js').BookReaderOptions} BookReaderOptions */

afterEach(() => {
  jest.restoreAllMocks();
  sinon.restore();
});

const CACHE_MOCK = { 1: [{ reduce: 3, loaded: true }] };
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
  describe('`image` call', () => {
    test('calling `image` will create an image if none is cached', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = {};
      ic.image(1, 5);
      expect(Object.keys(ic.cache).length).toBe(1);
      expect(ic.cache['1'].length).toBe(1);
    });
    test('will pull from cache if image of a good quality has been stored', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      const serveImgElSpy = sinon.spy(ic, '_serveImageElement');
      ic.cache = CACHE_MOCK;
      ic.image(1, 5);
      expect(serveImgElSpy.callCount).toBe(1);
    });
  });

  describe('`imageLoaded` call', () => {
    test('returns true if image in cache', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = CACHE_MOCK;
      const isImgLoaded = ic.imageLoaded(1, 3);
      expect(isImgLoaded).toBe(true);
    });
    test('returns true if image reducer in cache is good enough', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = CACHE_MOCK;
      const isImgLoaded = ic.imageLoaded(1, 5);
      expect(isImgLoaded).toBe(true);
    });
    test('returns false if no image in cache', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = CACHE_MOCK;
      const isImgLoaded = ic.imageLoaded(2, 3);
      expect(isImgLoaded).toBe(false);
    });
    test('returns false if reducer to check is better than cache', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = CACHE_MOCK;
      const isImgLoaded = ic.imageLoaded(1, 2);
      expect(isImgLoaded).toBe(false);
    });
    test('returns false if image has not loaded', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = { 1: [{ reduce: 4, loaded: false }] };
      const isImgLoaded = ic.imageLoaded(1, 2);
      expect(isImgLoaded).toBe(false);
    });
  });

  describe('`getBestLoadedReduce` call', () => {
    test('handles empty cache', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = {};
      expect(ic.getBestLoadedReduce(0)).toBeNull();
    });

    test('handles empty page-level cache', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = { 0: [] };
      expect(ic.getBestLoadedReduce(0)).toBeNull();
      ic.cache = { 0: [{ reduce: 10, loaded: false }] };
      expect(ic.getBestLoadedReduce(0)).toBeNull();
    });

    test('chooses highest quality sufficient image', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = { 0: [{ reduce: 1, loaded: true }, { reduce: 4, loaded: true }, { reduce: 10, loaded: true }] };
      expect(ic.getBestLoadedReduce(0, 5)).toBe(10);
    });

    test('chooses closest image if no lower images', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      ic.cache = { 0: [{ reduce: 1, loaded: true }, { reduce: 4, loaded: true }] };
      expect(ic.getBestLoadedReduce(0, 5)).toBe(4);
    });
  });

  describe('`_serveImageElement` call', () => {
    test('returns jQuery image element', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(new BookModel({ data: SAMPLE_DATA, reduceSet }), reduceSet);
      const img = ic._serveImageElement(0);
      expect($(img).length).toBe(1);
      expect($(img)[0].classList.contains('BRpageimage')).toBe(true);
      expect($(img).attr('src')).toBe(FIRST_PAGE_MOCK.uri);
    });

    test('does not set srcset when useSrcSet=false', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(
        new BookModel({ data: SAMPLE_DATA, reduceSet }),
        { useSrcSet: false, reduceSet },
      );
      const $img = ic._serveImageElement(0);
      expect($img[0].hasAttribute('srcset')).toBe(false);
    });

    test('sets srcset when useSrcSet=true', () => {
      const reduceSet = Pow2ReduceSet;
      const ic = new ImageCache(
        new BookModel({ data: SAMPLE_DATA, reduceSet }),
        { useSrcSet: true, reduceSet },
      );
      const $img = ic._serveImageElement(0, 9);
      expect($img.attr('srcset')).toBeTruthy();
    });
  });
});
