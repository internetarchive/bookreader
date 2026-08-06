import ParagraphSource, { cursorKey, cursorsEqual } from '@/src/audioreader/ParagraphSource.js';

/**
 * Build a source over a fixture of pages. `pages` is an array (indexed by leaf) of
 * arrays of paragraph strings; an empty array means a page with no OCR text.
 */
function makeSource(pages, { onFetch } = {}) {
  const fetchPageChunks = jest.fn(async (leafIndex) => {
    onFetch?.(leafIndex);
    return (pages[leafIndex] || []).map((text, chunkIndex) => ({
      leafIndex, chunkIndex, text, lineRects: [],
    }));
  });
  return { source: new ParagraphSource({ fetchPageChunks, numLeafs: pages.length }), fetchPageChunks };
}

const PAGES = [
  [],                        // 0: cover, no text
  ['p1a', 'p1b'],            // 1
  [],                        // 2: blank plate
  ['p3a'],                   // 3
  ['p4a', 'p4b', 'p4c'],     // 4
];

describe('page fetching', () => {
  test('caches pages so repeat access costs one request', async () => {
    const { source, fetchPageChunks } = makeSource(PAGES);
    await source.page(1);
    await source.page(1);
    await source.page(1);
    expect(fetchPageChunks).toHaveBeenCalledTimes(1);
  });

  test('de-duplicates concurrent requests for the same page', async () => {
    const { source, fetchPageChunks } = makeSource(PAGES);
    await Promise.all([source.page(4), source.page(4), source.page(4)]);
    expect(fetchPageChunks).toHaveBeenCalledTimes(1);
  });

  test('drops paragraphs that are empty or whitespace-only', async () => {
    const { source } = makeSource([['real text', '   ', '']]);
    expect(await source.page(0)).toHaveLength(1);
  });

  test('out-of-range leaves return no paragraphs and are not fetched', async () => {
    const { source, fetchPageChunks } = makeSource(PAGES);
    expect(await source.page(-1)).toEqual([]);
    expect(await source.page(99)).toEqual([]);
    expect(fetchPageChunks).not.toHaveBeenCalled();
  });

  test('a failing page is treated as blank, not fatal', async () => {
    const fetchPageChunks = jest.fn(async () => { throw new Error('500'); });
    const source = new ParagraphSource({ fetchPageChunks, numLeafs: 3 });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await source.page(0)).toEqual([]);
    // and it is remembered, not retried forever
    await source.page(0);
    expect(fetchPageChunks).toHaveBeenCalledTimes(1);
    console.warn.mockRestore();
  });
});

describe('walking', () => {
  test('at() resolves a cursor to its paragraph', async () => {
    const { source } = makeSource(PAGES);
    expect((await source.at({ leafIndex: 1, chunkIndex: 1 })).text).toBe('p1b');
    expect(await source.at({ leafIndex: 1, chunkIndex: 9 })).toBeNull();
  });

  test('next() walks within a page', async () => {
    const { source } = makeSource(PAGES);
    expect(await source.next({ leafIndex: 4, chunkIndex: 0 }))
      .toEqual({ leafIndex: 4, chunkIndex: 1 });
  });

  test('next() skips pages with no text', async () => {
    const { source } = makeSource(PAGES);
    // leaf 1 chunk 1 is the last paragraph on page 1; page 2 is blank
    expect(await source.next({ leafIndex: 1, chunkIndex: 1 }))
      .toEqual({ leafIndex: 3, chunkIndex: 0 });
  });

  test('next() returns null at the end of the book', async () => {
    const { source } = makeSource(PAGES);
    expect(await source.next({ leafIndex: 4, chunkIndex: 2 })).toBeNull();
  });

  test('prev() walks back within a page', async () => {
    const { source } = makeSource(PAGES);
    expect(await source.prev({ leafIndex: 4, chunkIndex: 2 }))
      .toEqual({ leafIndex: 4, chunkIndex: 1 });
  });

  test('prev() skips blank pages and lands on the last paragraph', async () => {
    const { source } = makeSource(PAGES);
    expect(await source.prev({ leafIndex: 3, chunkIndex: 0 }))
      .toEqual({ leafIndex: 1, chunkIndex: 1 });
  });

  test('prev() returns null at the start of the book', async () => {
    const { source } = makeSource(PAGES);
    expect(await source.prev({ leafIndex: 1, chunkIndex: 0 })).toBeNull();
  });

  test('next() and prev() are inverses across a page boundary', async () => {
    const { source } = makeSource(PAGES);
    const start = { leafIndex: 1, chunkIndex: 1 };
    const forward = await source.next(start);
    expect(await source.prev(forward)).toEqual(start);
  });
});

describe('firstFrom', () => {
  test('lands on the first page at or after the leaf that has text', async () => {
    const { source } = makeSource(PAGES);
    expect(await source.firstFrom(0)).toEqual({ leafIndex: 1, chunkIndex: 0 });
    expect(await source.firstFrom(2)).toEqual({ leafIndex: 3, chunkIndex: 0 });
  });

  test('returns null when no text remains', async () => {
    const { source } = makeSource([['text'], [], []]);
    expect(await source.firstFrom(1)).toBeNull();
  });
});

describe('window', () => {
  test('returns the cursor plus the following paragraphs, in order', async () => {
    const { source } = makeSource(PAGES);
    const window = await source.window({ leafIndex: 1, chunkIndex: 0 }, 5);
    expect(window).toEqual([
      { leafIndex: 1, chunkIndex: 0 },
      { leafIndex: 1, chunkIndex: 1 },
      { leafIndex: 3, chunkIndex: 0 },
      { leafIndex: 4, chunkIndex: 0 },
      { leafIndex: 4, chunkIndex: 1 },
    ]);
  });

  test('truncates at the end of the book rather than padding', async () => {
    const { source } = makeSource(PAGES);
    const window = await source.window({ leafIndex: 4, chunkIndex: 1 }, 5);
    expect(window).toHaveLength(2);
  });
});

describe('cursor helpers', () => {
  test('cursorKey is stable and distinct', () => {
    expect(cursorKey({ leafIndex: 3, chunkIndex: 1 })).toBe('3:1');
    expect(cursorKey({ leafIndex: 31, chunkIndex: 0 }))
      .not.toBe(cursorKey({ leafIndex: 3, chunkIndex: 10 }));
  });

  test('cursorsEqual compares by value and tolerates null', () => {
    expect(cursorsEqual({ leafIndex: 1, chunkIndex: 2 }, { leafIndex: 1, chunkIndex: 2 })).toBe(true);
    expect(cursorsEqual({ leafIndex: 1, chunkIndex: 2 }, { leafIndex: 1, chunkIndex: 3 })).toBe(false);
    expect(cursorsEqual(null, { leafIndex: 1, chunkIndex: 2 })).toBe(false);
  });
});
