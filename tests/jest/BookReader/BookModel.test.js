import sinon from 'sinon';
import { deepCopy } from '../utils.js';
import { BookModel } from '@/src/BookReader/BookModel.js';
import { NAMED_REDUCE_SETS } from '@/src/BookReader/ReduceSet.js';
/** @typedef {import('@/src/BookReader/options.js').BookReaderOptions} BookReaderOptions */

afterEach(() => {
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
  ],
];

describe('getMedianPageSizeInches', () => {
  test('handles single page data', () => {
    const bm = new BookModel({ data: SAMPLE_DATA.slice(0, 1), options: {ppi: 1} });
    expect(bm.getMedianPageSizeInches()).toEqual({ width: 123, height: 123 });
  });

  test('handles odd pages data', () => {
    const sizes = [
      {width: 300, height: 2200},
      {width: 200, height: 2100},
      {width: 100, height: 2300},
    ];
    const data = deepCopy(SAMPLE_DATA);
    delete data[2];
    Object.assign(data[0][0], sizes[0]);
    Object.assign(data[1][0], sizes[1]);
    Object.assign(data[1][1], sizes[2]);
    const bm = new BookModel({ data, options: {ppi: 1} });
    expect(bm.getMedianPageSizeInches()).toEqual({ width: 200, height: 2200 });
  });


  test('handles even pages data', () => {
    const sizes = [
      {width: 300, height: 2200},
      {width: 200, height: 2100},
      {width: 100, height: 2300},
      {width: 400, height: 2400},
    ];
    const data = deepCopy(SAMPLE_DATA);
    Object.assign(data[0][0], sizes[0]);
    Object.assign(data[1][0], sizes[1]);
    Object.assign(data[1][1], sizes[2]);
    Object.assign(data[2][0], sizes[3]);
    const bm = new BookModel({ data, options: {ppi: 1} });
    expect(bm.getMedianPageSizeInches()).toEqual({ width: 300, height: 2300 });
  });

  test('caches result', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    const firstResult = bm.getMedianPageSizeInches();
    expect(bm.getMedianPageSizeInches()).toBe(firstResult);
    expect(bm.getMedianPageSizeInches()).toBe(firstResult);
    expect(bm.getMedianPageSizeInches()).toBe(firstResult);
  });
});

describe('getPageIndices', () => {
  test('handles unique indices', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPageIndices('1')).toEqual([0]);
  });

  test('handles invalid indices', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPageIndices('foo')).toEqual([]);
    expect(bm.getPageIndices('123')).toEqual([]);
  });

  test('handles non-unique indices', () => {
    const data = deepCopy(SAMPLE_DATA);
    data[0][0].pageNum = '2';
    const bm = new BookModel({ data });
    expect(bm.getPageIndices('2')).toEqual([0, 1]);
  });

  test('handles n-prefixed pages', () => {
    const data = deepCopy(SAMPLE_DATA);
    data[0][0].pageNum = 'n0';
    const bm = new BookModel({ data });
    expect(bm.getPageIndices('n0')).toEqual([0]);
  });
});

test('getPageName', () => {
  const bm = new BookModel({ data: SAMPLE_DATA });
  expect(bm.getPageName(0)).toEqual('Page 1');
  expect(bm.getPageName(1)).toEqual('Page 2');
});

describe('numLeafs', () => {
  test('reads from data', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getNumLeafs()).toBe(4);
  });

  test('numLeafs can be overriden', () => {
    const bm = new BookModel({ data: SAMPLE_DATA, numLeafs: 12 });
    expect(bm.getNumLeafs()).toBe(12);
  });
});

test('getPageNum', () => {
  const bm = new BookModel({ data: SAMPLE_DATA });
  expect(bm.getPageNum(0)).toBe('1');
});

test('getPageProp gets values from correct document', () => {
  const bm = new BookModel({ data: SAMPLE_DATA });
  expect(bm.getPageProp(1, 'uri')).toBe(SAMPLE_DATA[1][0].uri);
});

describe('getSpreadIndices', () => {
  test('Works for left to right text', () => {
    const bm = new BookModel({ data: SAMPLE_DATA, pageProgression: 'lr' });
    expect(bm.getSpreadIndices(1)).toEqual([1, 2]);
    expect(bm.getSpreadIndices(2)).toEqual([1, 2]);
  });
});

describe('leafNumToIndex', () => {
  test('returns input if no leafNum in data', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.leafNumToIndex(1)).toBe(1);
    expect(bm.leafNumToIndex(2)).toBe(2);
    expect(bm.leafNumToIndex(3)).toBe(3);
  });

  test('returns true index when leafNum does not point to index', () => {
    const data = deepCopy(SAMPLE_DATA);
    for (const spread of data) {
      for (const page of spread) {
        page.leafNum = parseFloat(page.pageNum) + 2;
      }
    }

    const bm = new BookModel({ data });
    expect(bm.leafNumToIndex(3)).toBe(0);
  });
});

describe('parsePageString', () => {
  test('handles leaf-prefixed PageString', () => {
    const data = deepCopy(SAMPLE_DATA);
    for (const spread of data) {
      for (const page of spread) {
        page.leafNum = parseFloat(page.pageNum) + 2;
      }
    }

    const bm = new BookModel({ data });
    expect(bm.parsePageString('leaf3')).toBe(0);
  });
});

describe('pagesIterator', () => {
  test('Goes through all pages', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    let i = 0;
    for (const page of bm.pagesIterator()) {
      expect(page.index).toBe(i++);
    }
  });

  test('Can combine unviewables', () => {
    const data = deepCopy(SAMPLE_DATA);
    // add some more pages
    data.splice(2, 0, deepCopy(data[0]));
    data[1].forEach(page => page.viewable = false);
    const bm = new BookModel({ data });
    for (const page of bm.pagesIterator({combineConsecutiveUnviewables: true})) {
      expect(page.isConsecutiveUnviewable).toBe(false);
    }
  });
});

describe('_getDataFlattened', () => {
  test('Assigns correct page sides', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm._getDataFlattened().map(page => page.pageSide)).toEqual(['R', 'L', 'R', 'L']);
  });

  test('Memoized based on data length', () => {
    const data = deepCopy(SAMPLE_DATA);
    const bm = new BookModel({ data });
    const firstResult = bm._getDataFlattened();
    expect(bm._getDataFlattened()).toBe(firstResult);
    expect(bm._getDataFlattened()).toBe(firstResult);
    bm.br.data = data.slice(0, 1);
    expect(bm._getDataFlattened()).not.toBe(firstResult);
  });

  test('Assigns unviewablesStart', () => {
    const data = deepCopy(SAMPLE_DATA);
    data.slice(1, -1)
      .forEach(spread => spread.forEach(page => {
        page.viewable = false;
      }));
    const bm = new BookModel({ data });
    const pages = bm._getDataFlattened();
    expect(pages[0].unviewablesStart).toBeUndefined();
    expect(pages[1].unviewablesStart).toBe(1);
    expect(pages[2].unviewablesStart).toBe(1);
    expect(pages[3].unviewablesStart).toBeUndefined();
  });
});

describe('getPage', () => {
  test('loops around by default', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPage(-1).index).toBe(3);
    expect(bm.getPage(-2).index).toBe(2);
    expect(bm.getPage(-3).index).toBe(1);
    expect(bm.getPage(4).index).toBe(0);
    expect(bm.getPage(5).index).toBe(1);
  });

  test('does not loop if loop=false', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPage(-1, false)).toBeUndefined();
    expect(bm.getPage(-2, false)).toBeUndefined();
    expect(bm.getPage(4, false)).toBeUndefined();
    expect(bm.getPage(5, false)).toBeUndefined();
  });
});

describe('PageModel', () => {
  test('constructor copies fields from book model', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    const spy = sinon.spy(bm, 'getPageWidth');
    const page = bm.getPage(0);
    expect(spy.callCount).toBe(1);
    expect(page.width).toBe(SAMPLE_DATA[0][0].width);
  });

  test('prev at start of book returns null', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPage(0).prev).toBeUndefined();
  });

  test('prev to return previous', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPage(1).prev.index).toBe(0);
    expect(bm.getPage(3).prev.prev.index).toBe(1);
  });

  test('next at end of book returns null', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPage(-1).next).toBeUndefined();
  });

  test('next to return next page', () => {
    const bm = new BookModel({ data: SAMPLE_DATA });
    expect(bm.getPage(0).next.index).toBe(1);
    expect(bm.getPage(1).next.next.index).toBe(3);
  });

  describe('findNext combineConsecutiveUnviewables=true', () => {
    const data = deepCopy(SAMPLE_DATA);
    // add some more pages
    data.splice(2, 0, deepCopy(data[0]));
    data[1].forEach(page => page.viewable = false);

    const bm = new BookModel({ data });

    test('does not skip the first unviewable page', () => {
      expect(bm.getPage(0).findNext({ combineConsecutiveUnviewables: true }).index).toBe(1);
    });

    test('skips consecutive unviewables', () => {
      expect(bm.getPage(1).findNext({ combineConsecutiveUnviewables: true }).index).toBe(3);
    });

    test('at end is undefined', () => {
      expect(bm.getPage(-1).findNext({ combineConsecutiveUnviewables: true })).toBeUndefined();
    });
  });

  describe('findPrev', () => {
    const data = deepCopy(SAMPLE_DATA);
    // add some more pages
    data.splice(2, 0, deepCopy(data[0]));
    data[1].forEach(page => page.viewable = false);

    const bm = new BookModel({ data });

    test('works if called on first unviewable', () => {
      expect(bm.getPage(1).findPrev({ combineConsecutiveUnviewables: true }).index).toBe(0);
    });

    test('works if called within unviewable chunk', () => {
      expect(bm.getPage(2).findPrev({ combineConsecutiveUnviewables: true }).index).toBe(1);
    });

    test('at start is undefined', () => {
      expect(bm.getPage(0).findPrev({ combineConsecutiveUnviewables: true })).toBeUndefined();
    });
  });

  describe('findLeft/findRight', () => {
    const data = deepCopy(SAMPLE_DATA);

    test('Calls findNext/findPrev based on progression', () => {
      const bm = new BookModel({ data });
      const page = bm.getPage(0);
      const findNextStub = sinon.stub(page, 'findNext');
      const findPrevStub = sinon.stub(page, 'findPrev');
      bm.pageProgression = 'lr';
      page.findLeft();
      expect(findPrevStub.callCount).toBe(1);
      expect(findNextStub.callCount).toBe(0);
      page.findRight();
      expect(findPrevStub.callCount).toBe(1);
      expect(findNextStub.callCount).toBe(1);
      bm.pageProgression = 'rl';
      page.findLeft();
      expect(findPrevStub.callCount).toBe(1);
      expect(findNextStub.callCount).toBe(2);
      page.findRight();
      expect(findPrevStub.callCount).toBe(2);
      expect(findNextStub.callCount).toBe(2);
    });
  });

  describe('getURISrcSet', () => {
    const data = deepCopy(SAMPLE_DATA);
    const bm = new BookModel({ data, reduceSet: NAMED_REDUCE_SETS.pow2 });
    bm.getPageURI = (index, scale, rotate) => `correctURL.png?scale=${scale}`;
    const page = bm.getPage(0);

    test('with 0 elements in srcset', () => {
      expect(page.getURISrcSet(1)).toBe("");
    });

    test('with 2 elements in srcset', () => {
      expect(page.getURISrcSet(5)).toBe("correctURL.png?scale=2 2x, correctURL.png?scale=1 4x");
    });

    test('with the most elements in srcset', () => {
      expect(page.getURISrcSet(35)).toBe("correctURL.png?scale=16 2x, correctURL.png?scale=8 4x, correctURL.png?scale=4 8x, correctURL.png?scale=2 16x, correctURL.png?scale=1 32x");
    });
  });
});
