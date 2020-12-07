import sinon from 'sinon';
import { deepCopy } from '../utils.js';
import { Mode1Up } from '../../src/js/BookReader/Mode1Up.js'
import { BookModel } from '../../src/js/BookReader/BookModel.js';

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


describe.only('calculateViewDimensions', () => {
  test('Padding added for each page', () => {
    const br = { data: SAMPLE_DATA };
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    expect(mode.calculateViewDimensions(1, 10)).toEqual({
      width: 123,
      height: (123 + 10) * 6,
    });
  });

  test('Reduction factor applied to each page individually', () => {
    const br = { data: SAMPLE_DATA };
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    expect(mode.calculateViewDimensions(2, 10)).toEqual({
      width: Math.floor(123 / 2),
      height: (Math.floor(123 / 2) + 10) * 6,
    });
  });

  test('Uses maximal width', () => {
    const br = { data: deepCopy(SAMPLE_DATA) };
    br.data.flat().forEach((page, i) => page.width = i);
    const book = new BookModel(br);
    const mode = new Mode1Up(br, book);
    expect(mode.calculateViewDimensions(2, 10).width).toBe(Math.floor(5 / 2));
  });
});

describe.only('centerY', () => {
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

describe.only('centerX', () => {
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
