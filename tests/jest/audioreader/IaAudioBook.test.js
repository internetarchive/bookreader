import IaAudioBook from '@/src/audioreader/IaAudioBook.js';

/** Shapes below mirror real responses recorded from theworksofplato01platiala. */
const METADATA = {
  server: 'ia800501.us.archive.org',
  dir: '/17/items/theworksofplato01platiala',
  metadata: {
    identifier: 'theworksofplato01platiala',
    title: 'The works of Plato',
    creator: ['Plato'],
    language: 'eng',
  },
  files: [
    { name: 'theworksofplato01platiala_jp2.zip' },
    { name: 'theworksofplato01platiala_djvu.xml' },
  ],
};

const JSIA = {
  data: {
    brOptions: {
      bookTitle: 'The works of Plato : a new and literal version',
      bookLanguage: 'eng',
      server: 'ia800501.us.archive.org',
      bookPath: '/17/items/theworksofplato01platiala/theworksofplato01platiala',
      data: [
        [{ leafNum: 1, pageType: 'Cover' }],
        [{ leafNum: 2 }, { leafNum: 3, pageNum: 'vii' }],
        [{ leafNum: 4, pageNum: 1 }, { leafNum: 5, pageNum: 2 }],
      ],
    },
  },
};

const OL = [{
  key: '/books/OL48596445M',
  table_of_contents: [
    { level: 1, label: '', title: 'Preface', pagenum: 'vii' },
    { level: 1, label: '', title: 'The Apology of Socrates', pagenum: '1' },
    { level: 1, label: '', title: 'Unmappable chapter', pagenum: '9999' },
    { level: 1, label: '', title: '', pagenum: '2' },
  ],
}];

const TEXT_WRAPPER = [
  ['First  paragraph  with  a  line- break.', [1, 2, 3, 4]],
  ['Second paragraph.', [5, 6, 7, 8]],
];

/** @param {Object<string, any>} routes substring -> json body (or {status}) */
function makeFetch(routes) {
  const calls = [];
  const fetchFn = jest.fn(async (url) => {
    calls.push(url);
    for (const [fragment, body] of Object.entries(routes)) {
      if (!url.includes(fragment)) continue;
      if (body?.status) return { ok: false, status: body.status, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => body };
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
  return { fetchFn, calls };
}

const DEFAULT_ROUTES = {
  'archive.org/metadata': METADATA,
  'BookReaderJSIA.php': JSIA,
  'openlibrary.org/query.json': OL,
  'BookReaderGetTextWrapper.php': TEXT_WRAPPER,
};

describe('load', () => {
  test('pulls title, author, language and cover from the item', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('theworksofplato01platiala', { fetchFn });

    expect(book.title).toBe('The works of Plato : a new and literal version');
    expect(book.author).toBe('Plato');
    expect(book.language).toBe('en');
    expect(book.coverUrl).toBe('https://archive.org/services/img/theworksofplato01platiala');
  });

  test('flattens spreads into a leaf list', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('theworksofplato01platiala', { fetchFn });

    expect(book.numLeafs).toBe(5);
    expect(book.leaves[2]).toEqual({ leafNum: 3, pageNum: 'vii' });
    expect(book.leaves[0].pageNum).toBeNull();
  });

  test('passes subPrefix derived from the jp2 zip to the manifest endpoint', async () => {
    const { fetchFn, calls } = makeFetch(DEFAULT_ROUTES);
    await IaAudioBook.load('theworksofplato01platiala', { fetchFn });

    const jsiaCall = calls.find(url => url.includes('BookReaderJSIA.php'));
    expect(jsiaCall).toContain('subPrefix=theworksofplato01platiala');
  });

  test('never requests a page image', async () => {
    const { fetchFn, calls } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('theworksofplato01platiala', { fetchFn });
    await book.fetchPageChunks(3, { fetchFn });

    expect(calls.some(url => url.includes('BookReaderImages.php'))).toBe(false);
  });

  test('throws a useful error for a nonexistent item', async () => {
    const { fetchFn } = makeFetch({ 'archive.org/metadata': {} });
    await expect(IaAudioBook.load('nope', { fetchFn })).rejects.toThrow(/no such archive.org item/);
  });

  test('throws a useful error for an item that is not a book', async () => {
    const { fetchFn } = makeFetch({
      'archive.org/metadata': METADATA,
      'BookReaderJSIA.php': { data: {} },
    });
    await expect(IaAudioBook.load('song', { fetchFn })).rejects.toThrow(/no BookReader manifest/);
  });
});

describe('table of contents', () => {
  test('resolves printed page numbers to leaf indexes', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('theworksofplato01platiala', { fetchFn });

    expect(book.toc.map(entry => [entry.title, entry.leafIndex]))
      .toEqual([['Preface', 2], ['The Apology of Socrates', 3]]);
  });

  test('drops entries that cannot be jumped to or have no label', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('theworksofplato01platiala', { fetchFn });

    expect(book.toc.map(e => e.title)).not.toContain('Unmappable chapter');
    expect(book.toc).toHaveLength(2);
  });

  test('a failing Open Library lookup leaves the book usable', async () => {
    const { fetchFn } = makeFetch({ ...DEFAULT_ROUTES, 'openlibrary.org/query.json': { status: 503 } });
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const book = await IaAudioBook.load('theworksofplato01platiala', { fetchFn });
    expect(book.toc).toEqual([]);
    expect(book.title).toBeTruthy();
    console.warn.mockRestore();
  });

  test('an item with no Open Library edition gets an empty toc', async () => {
    const { fetchFn } = makeFetch({ ...DEFAULT_ROUTES, 'openlibrary.org/query.json': [] });
    const book = await IaAudioBook.load('x', { fetchFn });
    expect(book.toc).toEqual([]);
  });
});

describe('page text', () => {
  test('builds the read-aloud text endpoint from the book path', async () => {
    const { fetchFn, calls } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('theworksofplato01platiala', { fetchFn });
    await book.fetchPageChunks(20, { fetchFn });

    const textCall = calls.find(url => url.includes('BookReaderGetTextWrapper.php'));
    expect(textCall).toContain('_djvu.xml');
    expect(textCall).toContain('page=20');
    expect(textCall).toContain('callback=false');
  });

  test('parses the response into paragraphs via the read-aloud plugin parser', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('x', { fetchFn });
    const chunks = await book.fetchPageChunks(20, { fetchFn });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].leafIndex).toBe(20);
    expect(chunks[1].text).toBe('Second paragraph.');
  });

  test('inherits the parser fix that strips dangling hyphens', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('x', { fetchFn });
    const chunks = await book.fetchPageChunks(20, { fetchFn });

    // "line- break" would otherwise be read as two stuttered words.
    expect(chunks[0].text).toContain('linebreak');
  });

  test('a non-200 from the text endpoint throws so the source can treat it as blank', async () => {
    const { fetchFn } = makeFetch({ ...DEFAULT_ROUTES, 'BookReaderGetTextWrapper.php': { status: 404 } });
    const book = await IaAudioBook.load('x', { fetchFn });
    await expect(book.fetchPageChunks(20, { fetchFn })).rejects.toThrow(/404/);
  });
});

describe('leafIndexForPageNum', () => {
  test('matches roman and arabic page numbers', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('x', { fetchFn });

    expect(book.leafIndexForPageNum('vii')).toBe(2);
    expect(book.leafIndexForPageNum('VII')).toBe(2);
    expect(book.leafIndexForPageNum(1)).toBe(3);
    expect(book.leafIndexForPageNum('1')).toBe(3);
  });

  test('returns null for unknown or missing page numbers', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('x', { fetchFn });

    expect(book.leafIndexForPageNum('9999')).toBeNull();
    expect(book.leafIndexForPageNum(null)).toBeNull();
  });
});

describe('startLeafIndex', () => {
  test('prefers the first table-of-contents entry over the cover', async () => {
    const { fetchFn } = makeFetch(DEFAULT_ROUTES);
    const book = await IaAudioBook.load('x', { fetchFn });
    // 'Preface' at printed page vii, which is leaf index 2.
    expect(book.startLeafIndex).toBe(2);
  });

  test('falls back to just past the title page when there is no toc', async () => {
    const { fetchFn } = makeFetch({
      ...DEFAULT_ROUTES,
      'openlibrary.org/query.json': [],
      'BookReaderJSIA.php': {
        data: { brOptions: { ...JSIA.data.brOptions, titleLeaf: 3 } },
      },
    });
    const book = await IaAudioBook.load('x', { fetchFn });
    expect(book.startLeafIndex).toBe(3);
  });

  test('falls back to the beginning when the manifest says nothing', async () => {
    const { fetchFn } = makeFetch({
      ...DEFAULT_ROUTES,
      'openlibrary.org/query.json': [],
    });
    const book = await IaAudioBook.load('x', { fetchFn });
    expect(book.startLeafIndex).toBe(0);
  });
});
