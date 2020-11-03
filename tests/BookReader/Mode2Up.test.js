import '../../src/js/jquery-ui-wrapper.js';
import 'jquery.browser';

import sinon from 'sinon';
import { deepCopy } from '../utils.js';
import BookReader from '../../src/js/BookReader.js';
/** @typedef {import('../../src/js/BookReader/options.js').BookReaderOptions} BookReaderOptions */

beforeAll(() => {
  global.alert = jest.fn();
})
afterEach(() => {
  jest.restoreAllMocks();
  sinon.restore();
});

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


describe('zoom', () => {
  test('stops animations when zooming', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();

    const stopAnim = sinon.spy(br, 'stopFlipAnimations');
    br._modes.mode2Up.zoom(1);
    expect(stopAnim.callCount).toBe(1);
  });
});

describe('draw 2up leaves', () => {
  test('calls `drawLeafs` on init as default', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    const drawLeafs = sinon.spy(br._modes.mode2Up, 'drawLeafs');

    br.init();
    expect(drawLeafs.callCount).toBe(1);
  })

  test('sets `this.displayedIndices`', () => {
    const extremelyWrongValueForDisplayedIndices = null;
    const br = new BookReader({ data: SAMPLE_DATA });

    br.init();
    br.displayedIndices = extremelyWrongValueForDisplayedIndices;
    expect(br.displayedIndices).toBe(extremelyWrongValueForDisplayedIndices);

    br._modes.mode2Up.drawLeafs();

    expect(br.displayedIndices).not.toBe(extremelyWrongValueForDisplayedIndices);
    expect(br.displayedIndices.length).toBe(2); // is array
    expect(br.displayedIndices).toEqual([-1, 0]); // default to starting index on right, placeholder for left
  })
});

describe('prefetch', () => {
  test('loads nearby pages', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    const spy = sinon.spy(br, 'prefetchImg');
    br.prefetch();
    expect(spy.callCount).toBeGreaterThan(2);
  });

  test('works when at start of book', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    br.jumpToIndex(-1);
    const spy = sinon.spy(br, 'prefetchImg');
    br.prefetch();
    expect(spy.callCount).toBeGreaterThan(2);
  });

  test('works when at end of book', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    br.jumpToIndex(SAMPLE_DATA.flat().length - 1);
    const spy = sinon.spy(br, 'prefetchImg');
    br.prefetch();
    expect(spy.callCount).toBeGreaterThan(2);
  });


  test('skips consecutive unviewables', () => {
    const data = deepCopy(SAMPLE_DATA);
    data[1].forEach(page => page.viewable = false);
    const br = new BookReader({ data });
    br.init();
    br.prefetch();
    expect(br.prefetchedImgs).not.toContain(2);
  });
});
