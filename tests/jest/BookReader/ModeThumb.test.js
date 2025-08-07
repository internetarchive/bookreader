
import sinon from 'sinon';
import BookReader from '@/src/BookReader.js';
/** @typedef {import('@/src/BookReader/options.js').BookReaderOptions} BookReaderOptions */

beforeAll(() => {
  global.alert = jest.fn();
});
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
  const br = new BookReader({ data: SAMPLE_DATA });
  br.init();

  test('initializes with default columns', () => {
    expect(br.thumbColumns).toBe(br.options.thumbColumns);
  });

  test('removes column and redraws zooming in', () => {
    const prepare = sinon.spy(br._modes.modeThumb, 'prepare');
    const startColumns = br.thumbColumns;
    br._modes.modeThumb.zoom('in');
    expect(br.thumbColumns).toBe(startColumns - 1);
    expect(prepare.callCount).toBe(1);
  });

  test('adds column and redraws zooming out', () => {
    const prepare = sinon.spy(br._modes.modeThumb, 'prepare');
    const startColumns = br.thumbColumns;
    br._modes.modeThumb.zoom('out');
    expect(br.thumbColumns).toBe(startColumns + 1);
    expect(prepare.callCount).toBe(1);
  });

  test('keeps columns and no redraw at zooming in limit', () => {
    const prepare = sinon.spy(br._modes.modeThumb, 'prepare');
    br.thumbColumns = br.options.thumbMinZoomColumns;
    br._modes.modeThumb.zoom('in');
    expect(br.thumbColumns).toBe(br.options.thumbMinZoomColumns);
    expect(prepare.callCount).toBe(0);
  });

  test('keeps columns and no redraw at zooming out limit', () => {
    const prepare = sinon.spy(br._modes.modeThumb, 'prepare');
    br.thumbColumns = br.options.thumbMaxZoomColumns;
    br._modes.modeThumb.zoom('out');
    expect(br.thumbColumns).toBe(br.options.thumbMaxZoomColumns);
    expect(prepare.callCount).toBe(0);
  });
});
