import { Rect } from '@/src/util/rect.js';
import { DjVuXMLBook } from '@/src/util/ocr/DjVuXML.js';
import { HOCRBook } from '@/src/util/ocr/hOCR.js';
import { parseOCRBook } from '@/src/util/ocr/index.js';

const DJVU_XML = `
  <DjVuXML>
    <BODY>
      <OBJECT height="3192" width="2454">
        <PARAGRAPH>
          <LINE>
            <WORD coords="100,220,150,200">Hello</WORD>
            <WORD coords="160,220,220,200">world</WORD>
          </LINE>
          <LINE>
            <WORD coords="100,260,180,240">again</WORD>
          </LINE>
        </PARAGRAPH>
        <PARAGRAPH x-role="header-footer">
          <LINE>
            <WORD coords="100,320,140,300">12</WORD>
          </LINE>
        </PARAGRAPH>
      </OBJECT>
      <OBJECT height="3192" width="2454">
        <PARAGRAPH>
          <LINE>
            <WORD coords="10,20,30,5">page2</WORD>
          </LINE>
        </PARAGRAPH>
      </OBJECT>
    </BODY>
  </DjVuXML>`;

const HOCR = `
  <!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml"><body>
    <div class='ocr_page' id='page_1' title='bbox 0 0 2454 3192'>
      <div class='ocr_carea' id='block_1_1' title='bbox 90 190 230 270'>
        <p class='ocr_par' id='par_1_1_1' title='bbox 95 195 225 265'>
          <span class='ocr_line' id='line_1_1_1' title='bbox 100 200 220 220; baseline 0 -3'>
            <span class='ocrx_word' title='bbox 100 200 150 220; x_wconf 95'>Hello</span>
            <span class='ocrx_word' title='bbox 160 200 220 220; x_wconf 95'><strong>world</strong></span>
          </span>
          <span class='ocr_line' id='line_1_1_2' title='bbox 100 240 180 260'>
            <span class='ocrx_word' title='bbox 100 240 180 260; x_wconf 95'>again</span>
          </span>
        </p>
      </div>
      <div class='ocr_carea' id='block_1_2' title='bbox 90 290 150 330'>
        <p class='ocr_par' id='par_1_2_1' title='bbox 95 295 145 325' x-role='header-footer'>
          <span class='ocr_pageno' id='line_1_2_1' title='bbox 100 300 140 320'>
            <span class='ocrx_word' title='bbox 100 300 140 320; x_wconf 95'>12</span>
          </span>
        </p>
      </div>
    </div>
    <div class='ocr_page' id='page_2' title='bbox 0 0 2454 3192'>
      <p class='ocr_par' title='bbox 10 5 30 20'>
        <span class='ocr_line' title='bbox 10 5 30 20'>
          <span class='ocrx_word' title='bbox 10 5 30 20; x_wconf 95'>page2</span>
        </span>
      </p>
    </div>
  </body></html>`;

/** A rect in the (left, bottom, right, top) order djvu xml's coords uses */
const boxOf = (left, bottom, right, top) => Rect.fromEdges(left, top, right, bottom);

describe.each([
  ['DjVuXML', DJVU_XML],
  ['hOCR', HOCR],
])('%s', (format, rawOcr) => {
  const book = parseOCRBook(format, rawOcr);

  test('reads every page', () => {
    expect(book.pages.length).toBe(2);
    expect(book.pages[1].words.map(w => w.text.trim())).toEqual(['page2']);
  });

  test('reads paragraphs, lines and words', () => {
    const [paragraph, headerFooter] = book.pages[0].paragraphs;
    expect(paragraph.lines.map(l => l.text)).toEqual(['Hello world', 'again']);
    expect(paragraph.words.map(w => w.text.trim())).toEqual(['Hello', 'world', 'again']);
    expect(headerFooter.words.map(w => w.text.trim())).toEqual(['12']);
  });

  test('reads word boxes', () => {
    expect(book.pages[0].paragraphs[0].lines[0].words[0].box).toEqual(boxOf(100, 220, 150, 200));
  });

  test('derives line/paragraph/page boxes from the words they contain', () => {
    const page = book.pages[0];
    expect(page.paragraphs[0].lines[0].box).toEqual(boxOf(100, 220, 220, 200));
    expect(page.paragraphs[0].box).toEqual(boxOf(100, 260, 220, 200));
    expect(page.box).toEqual(boxOf(100, 320, 220, 200));
  });

  test('flags header/footer paragraphs', () => {
    expect(book.pages[0].paragraphs.map(p => p.isHeaderFooter)).toEqual([false, true]);
  });

  test('a word box can be overridden', () => {
    const page = parseOCRBook(format, rawOcr).pages[0];
    const word = page.paragraphs[0].lines[0].words[0];
    word.box = boxOf(0, 1, 2, 3);
    // Hands out the same word objects on subsequent reads
    expect(page.paragraphs[0].words[0].box).toEqual(boxOf(0, 1, 2, 3));
  });
});

describe('DjVuXMLBook', () => {
  test('ignores a 5th (baseline) coordinate', () => {
    const book = DjVuXMLBook.parse('<OBJECT><PARAGRAPH><LINE><WORD coords="1,4,2,3,5">x</WORD></LINE></PARAGRAPH></OBJECT>');
    expect(book.pages[0].words[0].box).toEqual(boxOf(1, 4, 2, 3));
  });

  test('drops words with unusable coordinates', () => {
    const book = DjVuXMLBook.parse(`
      <OBJECT>
        <PARAGRAPH>
          <LINE>
            <WORD>no coords</WORD>
            <WORD coords="0,10,20,0">at the origin</WORD>
            <WORD coords="1,4,2,3">ok</WORD>
          </LINE>
        </PARAGRAPH>
      </OBJECT>`);
    expect(book.pages[0].words.map(w => w.text)).toEqual(['ok']);
  });

  test('throws on unparseable xml', () => {
    expect(() => DjVuXMLBook.parse('<OBJECT>')).toThrow();
  });

  test('uses an element\'s own coords when it declares them', () => {
    const book = DjVuXMLBook.parse(`
      <OBJECT>
        <PARAGRAPH coords="0,100,500,0">
          <LINE><WORD coords="1,4,2,3">x</WORD></LINE>
        </PARAGRAPH>
      </OBJECT>`);
    expect(book.pages[0].paragraphs[0].box).toEqual(boxOf(0, 100, 500, 0));
  });
});

describe('HOCRBook', () => {
  test('groups lines that are not wrapped in an ocr_par', () => {
    const book = HOCRBook.parse(`
      <div class='ocr_page' title='bbox 0 0 100 100'>
        <div class='ocr_carea' title='bbox 0 0 100 100'>
          <span class='ocr_line' title='bbox 10 10 20 20'>
            <span class='ocrx_word' title='bbox 10 10 20 20'>a</span>
          </span>
          <span class='ocr_line' title='bbox 10 30 20 40'>
            <span class='ocrx_word' title='bbox 10 30 20 40'>b</span>
          </span>
        </div>
      </div>`);
    const paragraphs = book.pages[0].paragraphs;
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].lines.map(l => l.text)).toEqual(['a', 'b']);
  });

  test('flags paragraphs tagged as header/footer by BookReaderGetTextWrapper.php', () => {
    const book = HOCRBook.parse(`
      <div class='ocr_page' title='bbox 0 0 100 100'>
        <p class='ocr_par' x-role='header-footer' title='bbox 10 10 20 20'>
          <span class='ocr_line' title='bbox 10 10 20 20'>
            <span class='ocrx_word' title='bbox 10 10 20 20'>a</span>
          </span>
        </p>
      </div>`);
    expect(book.pages[0].paragraphs[0].isHeaderFooter).toBe(true);
  });
});

describe('parseOCRBook', () => {
  test('throws on an unknown format', () => {
    expect(() => parseOCRBook('ALTO', '<alto/>')).toThrow(/Unsupported OCR format/);
  });
});
