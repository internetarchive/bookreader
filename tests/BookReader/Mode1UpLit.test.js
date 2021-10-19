import { BookModel } from '@/src/BookReader/BookModel.js';
import { Mode1UpLit } from '@/src/BookReader/Mode1UpLit.js';

/** @type {import('@/src/BookReader/options.js').BookReaderOptions['data']} */
const SAMPLE_DATA = [
  [
    { width: 123, height: 123, uri: 'https://archive.org/image0.jpg', pageNum: '1' },
  ],
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

function make_dummy_br(overrides = {}) {
  return Object.assign({
    updateFirstIndex() {},
    updateNavIndexThrottled() {},
    data: []
  }, overrides);
}

describe('pageTops', () => {
  afterEach(() => document.body.innerHTML = '');

  test('Works with empty book', async () => {
    const br = make_dummy_br({ data: [] });
    const book = new BookModel(br);
    const mode = new Mode1UpLit(book, br);
    document.body.appendChild(mode);
    await mode.requestUpdate();
    expect(mode.pageTops).toEqual({});
  });

  test('Iterates all pages', async () => {
    const br = make_dummy_br({ data: SAMPLE_DATA });
    const book = new BookModel(br);
    const mode = new Mode1UpLit(book, br);
    document.body.appendChild(mode);
    await mode.requestUpdate();
    expect(Object.values(mode.pageTops)).toHaveLength(6);
  });

  test('Computes tops', async () => {
    const br = make_dummy_br({ data: SAMPLE_DATA });
    const book = new BookModel(br);
    const mode = new Mode1UpLit(book, br);
    document.body.appendChild(mode);
    await mode.requestUpdate();
    const tops = Object.entries(mode.pageTops);
    expect(tops.map(([index, top]) => [index, top.toFixed(1)])).toEqual([
      // Recall these are in inches
      ['0', '0.2'],
      ['1', '0.6'],
      ['2', '1.1'],
      ['3', '1.5'],
      ['4', '2.0'],
      ['5', '2.4'],
    ]);
  });
});

describe('worldUnitsToRenderedPixels', () => {
  test('0 case', () => {
    const mode = new Mode1UpLit(null, null);
    expect(mode.worldUnitsToRenderedPixels(0)).toBe(0);
  });
  test('Misc cases', () => {
    const mode = new Mode1UpLit(null, null);
    mode.screenDPI = 100;
    mode.realWorldReduce = 1;
    expect(mode.worldUnitsToRenderedPixels(1)).toBe(100);
    mode.screenDPI = 100;
    mode.realWorldReduce = 2;
    expect(mode.worldUnitsToRenderedPixels(1)).toBe(50);
    mode.screenDPI = 78;
    mode.realWorldReduce = 1;
    expect(mode.worldUnitsToRenderedPixels(1)).toBe(78);
  });
});
