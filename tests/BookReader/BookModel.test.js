import sinon from 'sinon';
import { deepCopy } from '../utils.js';
import { BookModel } from '../../src/js/BookReader/BookModel.js';
/** @typedef {import('../../src/js/BookReader/options.js').BookReaderOptions} BookReaderOptions */

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

describe('getMedianPageSize', () => {
    test('handles single page data', () => {
        const bm = new BookModel({ data: SAMPLE_DATA.slice(0, 1) });
        expect(bm.getMedianPageSize()).toEqual({ width: 123, height: 123 });
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
        const bm = new BookModel({ data });
        expect(bm.getMedianPageSize()).toEqual({ width: 200, height: 2200 });
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
        const bm = new BookModel({ data });
        expect(bm.getMedianPageSize()).toEqual({ width: 300, height: 2300 });
    });

    test('caches result', () => {
        const bm = new BookModel({ data: SAMPLE_DATA });
        const firstResult = bm.getMedianPageSize();
        expect(bm.getMedianPageSize()).toBe(firstResult);
        expect(bm.getMedianPageSize()).toBe(firstResult);
        expect(bm.getMedianPageSize()).toBe(firstResult);
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
    test('returns leafNum as is if no leafNum in data', () => {
        const bm = new BookModel({ data: SAMPLE_DATA });
        expect(bm.leafNumToIndex(1)).toBe(1);
        expect(bm.leafNumToIndex(2)).toBe(2);
        expect(bm.leafNumToIndex(3)).toBe(3);
    });

    test('handles pages with leafNum', () => {
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
    test('handles pages with leafNum', () => {
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


describe('_getDataFlattened', () => {
    test('Assigns correct page sides', () => {
        const bm = new BookModel({ data: SAMPLE_DATA });
        expect(bm._getDataFlattened().map(page => page.pageSide)).toEqual(['R', 'L', 'R', 'L'])
    });
});
