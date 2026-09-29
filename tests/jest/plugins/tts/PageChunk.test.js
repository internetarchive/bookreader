import PageChunk from '@/src/plugins/tts/PageChunk.js';
import sinon from 'sinon';

describe('_fixChunkRects', () => {
  const { _fixChunkRects } = PageChunk;

  test('Handles empty array', () => {
    const rects = [];
    expect(_fixChunkRects(rects)).toBe(rects);
    expect(rects).toEqual([]);
  });

  test('Does not modify normal values values normal', () => {
    const rects = [[100,100,500,80], [200,200,500,180], [300,300,500,280]];
    expect(_fixChunkRects(rects)).toBe(rects);
    expect(rects).toEqual([[100,100,500,80], [200,200,500,180], [300,300,500,280]]);
  });

  test('Fixes outlier values in first rect', () => {
    const rects = [[100,2300,2300,0], [200,200,200,180], [300,300,200,280]];
    expect(_fixChunkRects(rects)).toBe(rects);
    expect(rects).toEqual([[100,2300,200,2280], [200,200,200,180], [300,300,200,280]]);
  });
});

describe('_fromTextWrapperResponse', () => {
  const { _fromTextWrapperResponse } = PageChunk;

  test('Handles empty array', () => {
    expect(_fromTextWrapperResponse(0, [])).toEqual([]);
  });

  test('Basic test', () => {
    const chunks = _fromTextWrapperResponse(0, [['Line', [0,100,100,0]]]);
    expect(chunks).toEqual([new PageChunk(0, 0, 'Line', [[0,100,100,0]])]);
  });
});

describe('_removeDanglingHyphens', () => {
  const { _removeDanglingHyphens } = PageChunk;

  test('No change to empty string', () => {
    expect(_removeDanglingHyphens('')).toEqual('');
  });

  test('No change when no hyphens string', () => {
    expect(_removeDanglingHyphens('Hello world!')).toEqual('Hello world!');
  });

  test('No change to hyphens mid-word', () => {
    expect(_removeDanglingHyphens('It is mid-word!')).toEqual('It is mid-word!');
  });

  test('Removes hyphens followed by spaces', () => {
    expect(_removeDanglingHyphens('It is not mid- word!')).toEqual('It is not midword!');
    expect(_removeDanglingHyphens('mid- word fid- word')).toEqual('midword fidword');
  });
});

describe('_chunkOcrPage', () => {
  const { _chunkOcrPage } = PageChunk;

  /**
   * @param {string} paragraphs
   */
  function parsePage(paragraphs) {
    const xml = new DOMParser().parseFromString(`<OBJECT>${paragraphs}</OBJECT>`, 'text/xml');
    return xml.querySelector('OBJECT');
  }

  /**
   * Words are laid out left to right from x=10, 100px apart
   * @param {number} lineIndex
   * @param {string[]} words
   */
  function line(lineIndex, words) {
    const top = lineIndex * 100;
    const wordEls = words.map((w, i) => `<WORD coords="${i * 100 + 10},${top + 50},${i * 100 + 100},${top}">${w}</WORD>`);
    return `<LINE>${wordEls.join('')}</LINE>`;
  }

  /** @param {number} n */
  const words = (n, prefix = 'w') => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

  test('Handles empty page', () => {
    expect(_chunkOcrPage(parsePage(''))).toEqual([]);
  });

  test('Short page is one chunk with a rect per line', () => {
    const page = parsePage(`<PARAGRAPH>${line(0, ['Hello', 'there.'])}${line(1, ['Bye'])}</PARAGRAPH>`);
    expect(_chunkOcrPage(page)).toEqual([
      ['Hello there. Bye', [10, 50, 200, 0], [10, 150, 100, 100]],
    ]);
  });

  test('Skips header/footer paragraphs', () => {
    const page = parsePage(`
      <PARAGRAPH x-role="header-footer">${line(0, ['Chapter', 'I'])}</PARAGRAPH>
      <PARAGRAPH>${line(1, ['Body'])}</PARAGRAPH>`);
    expect(_chunkOcrPage(page)).toEqual([['Body', [10, 150, 100, 100]]]);
  });

  test('Skips words without usable coords', () => {
    const page = parsePage(`<PARAGRAPH><LINE>
      <WORD coords="0,50,90,0">Bad</WORD>
      <WORD>NoCoords</WORD>
      <WORD coords="100,50,190,0">Good</WORD>
    </LINE></PARAGRAPH>`);
    expect(_chunkOcrPage(page)).toEqual([['Good', [100, 50, 190, 0]]]);
  });

  test('Breaks mid-line at the first sentence end past the minimum', () => {
    const page = parsePage(`<PARAGRAPH>
      ${line(0, words(20))}
      ${line(1, [...words(5, 'x'), 'end.', 'next'])}
    </PARAGRAPH>`);
    const chunks = _chunkOcrPage(page);
    expect(chunks.map(c => c[0])).toEqual([
      [...words(20), ...words(5, 'x'), 'end.'].join(' '),
      'next',
    ]);
    expect(chunks[0].slice(1)).toEqual([[10, 50, 2000, 0], [10, 150, 600, 100]]);
    // The rest of the split line gets its own rect
    expect(chunks[1].slice(1)).toEqual([[610, 150, 700, 100]]);
  });

  test('Does not break at a sentence end before the minimum', () => {
    const page = parsePage(`<PARAGRAPH>${line(0, ['Short.', 'Sentences.'])}</PARAGRAPH>`);
    expect(_chunkOcrPage(page)).toHaveLength(1);
  });

  test('Breaks at the end of a line once past the maximum', () => {
    const page = parsePage(`<PARAGRAPH>${line(0, words(30))}${line(1, words(30))}${line(2, ['after'])}</PARAGRAPH>`);
    const chunks = _chunkOcrPage(page);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(3);
    expect(chunks[1][0]).toBe('after');
  });
});

describe('fetch', () => {
  const ocrPage = new DOMParser().parseFromString(
    '<OBJECT><PARAGRAPH><LINE><WORD coords="10,50,100,0">Hello</WORD></LINE></PARAGRAPH></OBJECT>',
    'text/xml',
  ).querySelector('OBJECT');

  beforeEach(() => {
    window.$ = { ajax: sinon.fake.resolves([['From server', [1, 2, 3, 4]]]) };
  });

  afterEach(() => {
    delete window.br;
    delete window.$;
  });

  /** @param {object} textSelection */
  function setPlugins(textSelection) {
    window.br = { plugins: { textSelection }, protected: false };
  }

  test('Uses the text selection plugin OCR if available', async () => {
    const getPageText = sinon.fake.resolves(ocrPage);
    setPlugins({ options: { enabled: true }, getPageText });
    const chunks = await PageChunk.fetch('url', 3);
    expect(getPageText.calledOnceWith(3)).toBe(true);
    expect(window.$.ajax.called).toBe(false);
    expect(chunks).toEqual([new PageChunk(3, 0, 'Hello', [[10, 50, 100, 0]])]);
  });

  test('Falls back to the page chunk url if the plugin has no OCR', async () => {
    setPlugins({ options: { enabled: true }, getPageText: sinon.fake.resolves(undefined) });
    const chunks = await PageChunk.fetch('url', 3);
    expect(window.$.ajax.calledOnce).toBe(true);
    expect(chunks[0].text).toBe('From server');
  });

  test('Falls back to the page chunk url if the plugin OCR fails to load', async () => {
    setPlugins({ options: { enabled: true }, getPageText: sinon.fake.rejects(new Error()) });
    const chunks = await PageChunk.fetch('url', 3);
    expect(chunks[0].text).toBe('From server');
  });

  test('Ignores a disabled text selection plugin', async () => {
    const getPageText = sinon.fake.resolves(ocrPage);
    setPlugins({ options: { enabled: false }, getPageText });
    await PageChunk.fetch('url', 3);
    expect(getPageText.called).toBe(false);
  });

  test('Falls back to the page chunk url without a text selection plugin', async () => {
    setPlugins(undefined);
    const chunks = await PageChunk.fetch('url', 3);
    expect(chunks[0].text).toBe('From server');
  });
});
