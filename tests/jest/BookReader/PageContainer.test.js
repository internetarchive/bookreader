import {PageContainer, boxToSVGRect, createSVGPageLayer, renderBoxesInPageContainerLayer} from '@/src/BookReader/PageContainer.js';
import {ImageCache} from '@/src/BookReader/ImageCache.js';
import {BookModel} from '@/src/BookReader/BookModel.js';
import { afterEventLoop } from '../utils.js';
import sinon from 'sinon';
/** @typedef {import('@/src/BookReader/options.js').BookReaderOptions} BookReaderOptions */

const SAMPLE_BOOK = new BookModel(
  {
    data: [
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
    ]
  }
);

const realGetPageURI = SAMPLE_BOOK.getPageURI;
SAMPLE_BOOK.getPageURI = function (index, reduce, rotate) {
  // Need to add a reduce url parameter, since the src is used
  // for caching
  return realGetPageURI.call(SAMPLE_BOOK, index, reduce, rotate) + `?reduce=${reduce}`;
};

describe('constructor', () => {
  test('protected books', () => {
    const pc = new PageContainer(null, {isProtected: true});
    expect(pc.$container.hasClass('protected')).toBe(true);
    expect(pc.$container.find('.BRscreen').length).toBe(1);
  });

  test('non-protected books', () => {
    const pc = new PageContainer(null, {isProtected: false});
    expect(pc.$container.hasClass('protected')).toBe(false);
    expect(pc.$container.find('.BRscreen').length).toBe(0);
  });

  test('empty page', () => {
    const pc = new PageContainer(null, {isProtected: false});
    expect(pc.$container.hasClass('BRemptypage')).toBe(true);
  });

  test('non-empty page', () => {
    const pc = new PageContainer({index: 7}, {isProtected: false});
    expect(pc.$container.hasClass('BRemptypage')).toBe(false);
    expect(pc.$container.hasClass('pagediv7')).toBe(true);
  });

  test('adds side attribute', () => {
    const pc = new PageContainer({index: 7, pageSide: 'R'}, {isProtected: false});
    expect(pc.$container.hasClass('BRemptypage')).toBe(false);
    expect(pc.$container.attr('data-side')).toBe('R');
  });
});

describe('update', () => {
  test('dimensions sets CSS', () => {
    const imageCache = new ImageCache(SAMPLE_BOOK);
    const pc = new PageContainer(null, {imageCache});
    pc.update({ dimensions: { left: 20 } });
    expect(pc.$container[0].style.left).toBe('20px');
  });

  test('does not create image if empty page', () => {
    const imageCache = new ImageCache(SAMPLE_BOOK);
    const pc = new PageContainer(null, {imageCache});
    pc.update({ reduce: null });
    expect(pc.$img).toBeNull();
    pc.update({ reduce: 7 });
    expect(pc.$img).toBeNull();
  });

  test('does not create image if no reduce', () => {
    const imageCache = new ImageCache(SAMPLE_BOOK);
    const pc = new PageContainer(SAMPLE_BOOK.getPage(3), {imageCache});
    pc.update({ reduce: null });
    expect(pc.$img).toBeNull();
  });

  test('loads image on initial load', () => {
    const imageCache = new ImageCache(SAMPLE_BOOK);
    const pc = new PageContainer(SAMPLE_BOOK.getPage(3), {imageCache});
    pc.update({ reduce: 7 }); // This will load reduce=8 into memory
    expect(pc.$container.hasClass('BRpageloading')).toBe(true);
    expect(pc.$container.children('.BRpageimage').length).toBe(1);
    pc.$img.trigger('load');
    expect(pc.$container.hasClass('BRpageloading')).toBe(false);
    expect(pc.$container.children('.BRpageimage').length).toBe(1);
  });

  test('does not set loading class if already loaded', () => {
    const imageCache = new ImageCache(SAMPLE_BOOK);
    const pc = new PageContainer(SAMPLE_BOOK.getPage(3), {imageCache});
    pc.update({ reduce: 7 }); // This will load reduce=8 into memory
    pc.$img.trigger('load');
    pc.update({ reduce: 6 }); // This will still load reduce=8
    expect(pc.$container.hasClass('BRpageloading')).toBe(false);
    expect(pc.$container.children('.BRpageimage').length).toBe(1);
  });

  test('removes image between updates only if changed', async () => {
    const clock = sinon.useFakeTimers();
    const imageCache = new ImageCache(SAMPLE_BOOK);
    const pc = new PageContainer(SAMPLE_BOOK.getPage(3), {imageCache});

    // load reduce=8
    pc.update({ reduce: 7 });
    pc.$img.trigger('load');
    const img1 = pc.$img[0];

    // Should not create a new image; same final reduce
    pc.update({ reduce: 6 });
    expect(pc.$img[0]).toBe(img1);
    expect(pc.$container.children('.BRpageimage').length).toBe(1);

    // Should create a new image; different reduce
    pc.update({ reduce: 3 });
    expect(pc.$img[0]).not.toBe(img1);
    expect(pc.$container.children('.BRpageimage').length).toBe(2);

    pc.$img.trigger('load');
    // After loading we remove the old image; but not immediately!
    expect(pc.$container.children('.BRpageimage').length).toBe(2);
    expect(pc.$container.hasClass('BRpageloading')).toBe(false);
    // increment time clock 100ms
    clock.tick(100);
    // wait for promises to resolve
    clock.restore();
    await afterEventLoop();
    // NOW we remove the old image
    expect(pc.$container.children('.BRpageimage').length).toBe(1);
  });

  test('shows lower res image while loading if one available', () => {
    const imageCache = new ImageCache(SAMPLE_BOOK);
    const pc = new PageContainer(SAMPLE_BOOK.getPage(3), {imageCache});
    pc.update({ reduce: 7 });
    pc.$img.trigger('load');

    pc.update({reduce: 2});
    expect(pc.$container.hasClass('BRpageloading')).toBe(true);
    expect(pc.$container.children('.BRpageimage').length).toBe(2);
    expect(pc.$container.children('.BRpageimage')[0].src).toContain('reduce=4');
    expect(pc.$img[0].src).toContain('reduce=2');
  });
});

describe('createSVGPageLayer', () => {
  test('Does what it says', () => {
    const svg = createSVGPageLayer({ width: 100, height: 200}, 'myClass');
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 200');
    expect(svg.getAttribute('class')).toContain('myClass');
  });
});

describe('boxToSVGRect', () => {
  test('Does what it says', () => {
    const rect = boxToSVGRect({ l: 100, r: 200, t: 300, b: 500 });
    expect(rect.getAttribute('x')).toBe('100');
    expect(rect.getAttribute('y')).toBe('300');
    expect(rect.getAttribute('width')).toBe('100');
    expect(rect.getAttribute('height')).toBe('200');
  });
});

describe('renderBoxesInPageContainerLayer', () => {
  test('Handles missing layer', () => {
    const container = document.createElement('div');
    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelector('.foo')).toBeTruthy();
    expect(container.querySelectorAll('.foo rect').length).toBe(1);
  });

  test('Handles existing layer', () => {
    const container = document.createElement('div');
    const layer = document.createElement('svg');
    layer.classList.add('foo');
    container.append(layer);

    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelector('.foo')).toBe(layer);
    expect(container.querySelectorAll('.foo rect').length).toBe(1);
  });

  test('Adds layer after image if it exists', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.classList.add('BRpageimage');
    container.append(img);

    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelector('.foo')).toBeTruthy();
    expect(container.children[0].getAttribute('class')).toBe('BRpageimage');
    expect(container.children[1].getAttribute('class')).toBe('BRPageLayer foo');
  });

  test('Renders all boxes', () => {
    const container = document.createElement('div');
    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}, {l: 1, r: 2, t: 3, b: 4}, {l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelectorAll('.foo rect').length).toBe(3);
  });

  test('Adds optional classes', () => {
    const container = document.createElement('div');
    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}, {l: 1, r: 2, t: 3, b: 4}, {l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container, ['match-1', 'match-2', 'match-3']);
    const rects = Array.from(container.querySelectorAll('.foo rect'));
    expect(rects.map(r => r.getAttribute('class'))).toEqual(['match-1', 'match-2', 'match-3']);
  });

  test('Handles no boxes', () => {
    const container = document.createElement('div');
    const page = { width: 100, height: 200 };
    const boxes = [];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelectorAll('.foo rect').length).toBe(0);
  });
});
