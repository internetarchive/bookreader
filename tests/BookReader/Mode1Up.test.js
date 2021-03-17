import sinon from 'sinon';
import { deepCopy } from '../utils.js';
import { Mode1Up } from '../../src/js/BookReader/Mode1Up.js'
import { BookModel, FALLBACK_PPI } from '../../src/js/BookReader/BookModel.js';

/** @type {BookReaderOptions['data']} */
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

describe('pagesWithBounds', () => {
  test('Works with empty book', () => {
    const br = { data: [] };
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    expect(Array.from(mode.pagesWithBounds())).toHaveLength(0);
  });

  test('Iterates all pages', () => {
    const br = { data: SAMPLE_DATA };
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    expect(Array.from(mode.pagesWithBounds())).toHaveLength(6);
  });

  test('Computes bounds', () => {
    const br = { data: SAMPLE_DATA };
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    const x = Array.from(mode.pagesWithBounds());
    expect(x.map(({top, bottom}) => [top, bottom].map(x => x.toFixed(1)))).toEqual([
      ['0.0', '24.6'],
      ['44.6', '69.2'],
      ['89.2', '113.8'],
      ['133.8', '158.4'],
      ['178.4', '203.0'],
      ['223.0', '247.6'],
    ]);
  });
});

describe('boundsIntersect', () => {
  const f = Mode1Up.boundsIntersect;
  test('Exactly equal', () => {
    expect(f({top: 0, bottom: 10}, {top: 0, bottom: 10})).toBe(true);
  });

  test('A contains B', () => {
    expect(f({top: 0, bottom: 10}, {top: 1, bottom: 2})).toBe(true);
  });
  test('A boundary contains B', () => {
    expect(f({top: 0, bottom: 10}, {top: 0, bottom: 2})).toBe(true);
  });
  test('A contains top part of B', () => {
    expect(f({top: 0, bottom: 10}, {top: 5, bottom: 15})).toBe(true);
  });
  test('A contains bottom part of B', () => {
    expect(f({top: 5, bottom: 10}, {top: 0, bottom: 6})).toBe(true);
  });
  test('A entirely above B', () => {
    expect(f({top: 0, bottom: 10}, {top: 20, bottom: 30})).toBe(false);
  });
  test('A entirely below B', () => {
    expect(f({top: 20, bottom: 30}, {top: 0, bottom: 10})).toBe(false);
  });
});

describe('physicalInchesToDisplayPixels', () => {
  test('0 case', () => {
    const f = Mode1Up.prototype.physicalInchesToDisplayPixels;
    expect(f(0, 1, 100)).toBe(0);
  });
  test('Misc case', () => {
    const f = Mode1Up.prototype.physicalInchesToDisplayPixels;
    expect(f(1, 1, 100)).toBe(100);
    expect(f(1, 2, 100)).toBe(50);
    expect(f(1, 1, 78)).toBe(78);
  });
});

describe('calculateViewDimensions', () => {
  test('Padding added for each page', () => {
    const br = { data: SAMPLE_DATA };
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    const pageSizeIn = 123 / FALLBACK_PPI;
    const dims = mode.calculateViewDimensions(1, 2.5);
    expect(dims.width).toBeCloseTo(mode.physicalInchesToDisplayPixels(pageSizeIn, 1));
    expect(dims.height).toBeCloseTo(mode.physicalInchesToDisplayPixels(6 * pageSizeIn + 5 * 2.5, 1));
  });

  test('Reduction factor applied to each page/spacing individually', () => {
    const br = { data: SAMPLE_DATA };
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    const pageSizeIn = 123 / FALLBACK_PPI;
    const dims = mode.calculateViewDimensions(2, 5);
    expect(dims.width).toBeCloseTo(mode.physicalInchesToDisplayPixels(pageSizeIn, 2));
    expect(dims.height).toBeCloseTo(mode.physicalInchesToDisplayPixels(6 * pageSizeIn + 5 * 5, 2));
  });

  test('Uses maximal width', () => {
    const br = { data: deepCopy(SAMPLE_DATA) };
    br.data.flat().forEach((page, i) => page.width = i);
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    expect(mode.calculateViewDimensions().width).toBe(mode.physicalInchesToDisplayPixels(5 / FALLBACK_PPI));
  });
});

describe('centerY', () => {
  test('Computes the scroll position of the center of the screen', () => {
    const $container = $(`
      <div style="height: 500px">
        <div style="height: 2500px" />
      </div>`);
    $container.scrollTop(1000);
    expect(Mode1Up.prototype.centerY($container)).toBe(1250);
  });

  test('Handles no scroll', () => {
    const $container = $(`
      <div style="height: 1280px">
        <div style="height: 500px" />
      </div>`);
    expect(Mode1Up.prototype.centerY($container)).toBe(640);
  });
});

describe('centerX', () => {
  test('Pages narrower than viewport', () => {
    const $container = $(`<div style="width: 800px; height: 800px" />`);
    const $pagesContainer = $(`<div style="width: 500px; height: 1600px" />`)
      .appendTo($container);
    // clientWidth doesn't work in jsdom, so stub it
    sinon.stub($container, 'prop').returns(800);
    expect(Mode1Up.prototype.centerX($container, $pagesContainer)).toBe(500);
  });

  test('Pages wider than viewport', () => {
    const $container = $(`<div style="width: 800px; height: 800px; overflow: scroll;" />`);
    const $pagesContainer = $(`<div style="width: 1200px; height: 1600px" />`)
      .appendTo($container);
    $container.scrollLeft(10);
    // clientWidth doesn't work in jsdom, so stub it
    sinon.stub($container, 'prop').returns(800);
    expect(Mode1Up.prototype.centerX($container, $pagesContainer)).toBe(410);
  });
});
