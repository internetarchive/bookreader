import sinon from 'sinon';

import BookReader from '@/src/BookReader.js';
import '@/src/plugins/plugin.text_selection.js';
import { parseOCRBook } from '@/src/util/ocr/index.js';

// djvu.xml book infos copied from https://ia803103.us.archive.org/14/items/goodytwoshoes00newyiala/goodytwoshoes00newyiala_djvu.xml
const FAKE_XML_1WORD = `
  <OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
    <PARAGRAPH>
      <LINE>
        <WORD coords="1216,2768,1256,2640">test</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>`;
const FAKE_XML_MULT_WORDS = `
  <OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
    <PARAGRAPH>
      <LINE>
        <WORD coords="1216,2768,1256,2640">test1</WORD>
        <WORD coords="1400,2768,1500,2640">test2</WORD>
        <WORD coords="1600,2768,1700,2640">test3</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>`;
const FAKE_XML_MULT_LINES = `
  <OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
    <PARAGRAPH>
      <LINE>
        <WORD coords="119,2050,230,2014" x-confidence="29">way </WORD>
        <WORD coords="230,2038,320,2002" x-confidence="30">can </WORD>
        <WORD coords="320,2039,433,2002" x-confidence="28">false </WORD>
        <WORD coords="433,2051,658,2003" x-confidence="29">judgment </WORD>
        <WORD coords="658,2039,728,2002" x-confidence="30">be </WORD>
        <WORD coords="658,2039,728,2002" x-confidence="30">-</WORD>
        <WORD coords="728,2039,939,2001" x-confidence="29">formed. </WORD>
        <WORD coords="939,2039,1087,2001" x-confidence="29">There </WORD>
        <WORD coords="1087,2039,1187,2002" x-confidence="29">still </WORD>
        <WORD coords="1187,2038,1370,2003" x-confidence="29">remains </WORD>
        <WORD coords="1370,2037,1433,2014" x-confidence="28">an-</WORD>
      </LINE>
      <LINE>
        <WORD coords="244,2099,370,2063" x-confidence="29">other mode </WORD>
        <WORD coords="370,2100,427,2064" x-confidence="29">in </WORD>
        <WORD coords="427,2100,566,2063" x-confidence="29">which </WORD>
        <WORD coords="566,2100,670,2063" x-confidence="29">false </WORD>
        <WORD coords="670,2112,907,2063" x-confidence="29">judgments </WORD>
        <WORD coords="907,2112,1006,2064" x-confidence="29">may </WORD>
        <WORD coords="1006,2100,1071,2063" x-confidence="29">be </WORD>
        <WORD coords="1071,2100,1266,2062" x-confidence="29">formed. </WORD>
        <WORD coords="1266,2110,1435,2062" x-confidence="29">Suppose</WORD>
      </LINE>
      <LINE>
        <WORD coords="118,2160,217,2123" x-confidence="29">that </WORD>
        <WORD coords="217,2160,289,2124" x-confidence="29">we </WORD>
        <WORD coords="289,2160,400,2124" x-confidence="29">have </WORD>
        <WORD coords="400,2160,456,2124" x-confidence="30">in </WORD>
        <WORD coords="456,2161,542,2136" x-confidence="29">our </WORD>
        <WORD coords="542,2161,660,2124" x-confidence="29">souls </WORD>
        <WORD coords="660,2160,700,2136" x-confidence="29">a </WORD>
        <WORD coords="700,2160,847,2129" x-confidence="28">waxen </WORD>
        <WORD coords="847,2160,983,2123" x-confidence="29">tablet </WORD>
        <WORD coords="983,2160,1045,2124" x-confidence="29">of </WORD>
        <WORD coords="1045,2160,1211,2124" x-confidence="29">various </WORD>
        <WORD coords="1211,2171,1398,2122" x-confidence="29">qualities </WORD>
        <WORD coords="1398,2157,1434,2122" x-confidence="29">lastWord</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>`;
const FAKE_XML_5COORDS = `
  <OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
    <PARAGRAPH>
      <LINE>
        <WORD coords="1216,2768,1256,2640,2690">test</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>`;
const FAKE_XML_EMPTY = `
  <OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
  </OBJECT>`;

// hOCR equivalents of the above; cf https://ia903103.us.archive.org/14/items/goodytwoshoes00newyiala/goodytwoshoes00newyiala_hocr.html
const FAKE_HOCR_1WORD = `
  <div class='ocr_page' id='page_1' title='image "goodytwoshoes00newyiala_0001.jpg"; bbox 0 0 2454 3192; ppageno 0'>
    <div class='ocr_carea' id='block_1_1' title='bbox 1216 2640 1256 2768'>
      <p class='ocr_par' id='par_1_1_1' lang='eng' title='bbox 1216 2640 1256 2768'>
        <span class='ocr_line' id='line_1_1_1' title='bbox 1216 2640 1256 2768; baseline 0 -9'>
          <span class='ocrx_word' id='word_1_1_1_1' title='bbox 1216 2640 1256 2768; x_wconf 29'>test</span>
        </span>
      </p>
    </div>
  </div>`;
const FAKE_HOCR_MULT_WORDS = `
  <div class='ocr_page' id='page_1' title='image "goodytwoshoes00newyiala_0001.jpg"; bbox 0 0 2454 3192; ppageno 0'>
    <div class='ocr_carea' id='block_1_1' title='bbox 1216 2640 1700 2768'>
      <p class='ocr_par' id='par_1_1_1' lang='eng' title='bbox 1216 2640 1700 2768'>
        <span class='ocr_line' id='line_1_1_1' title='bbox 1216 2640 1700 2768; baseline 0 -9'>
          <span class='ocrx_word' id='word_1_1_1_1' title='bbox 1216 2640 1256 2768; x_wconf 29'>test1</span>
          <span class='ocrx_word' id='word_1_1_1_2' title='bbox 1400 2640 1500 2768; x_wconf 29'>test2</span>
          <span class='ocrx_word' id='word_1_1_1_3' title='bbox 1600 2640 1700 2768; x_wconf 29'>test3</span>
        </span>
      </p>
    </div>
  </div>`;
const FAKE_HOCR_MULT_LINES = `
  <div class='ocr_page' id='page_1' title='image "goodytwoshoes00newyiala_0001.jpg"; bbox 0 0 2454 3192; ppageno 0'>
    <div class='ocr_carea' id='block_1_1' title='bbox 118 2001 1435 2171'>
      <p class='ocr_par' id='par_1_1_1' lang='eng' title='bbox 118 2001 1435 2171'>
        <span class='ocr_line' id='line_1_1_1' title='bbox 119 2001 1433 2051; baseline 0 -9'>
          <span class='ocrx_word' id='word_1_1_1_1' title='bbox 119 2014 230 2050; x_wconf 29'>way </span>
          <span class='ocrx_word' id='word_1_1_1_2' title='bbox 230 2002 320 2038; x_wconf 29'>can </span>
          <span class='ocrx_word' id='word_1_1_1_3' title='bbox 320 2002 433 2039; x_wconf 29'>false </span>
          <span class='ocrx_word' id='word_1_1_1_4' title='bbox 433 2003 658 2051; x_wconf 29'>judgment </span>
          <span class='ocrx_word' id='word_1_1_1_5' title='bbox 658 2002 728 2039; x_wconf 29'>be </span>
          <span class='ocrx_word' id='word_1_1_1_6' title='bbox 658 2002 728 2039; x_wconf 29'>-</span>
          <span class='ocrx_word' id='word_1_1_1_7' title='bbox 728 2001 939 2039; x_wconf 29'>formed. </span>
          <span class='ocrx_word' id='word_1_1_1_8' title='bbox 939 2001 1087 2039; x_wconf 29'>There </span>
          <span class='ocrx_word' id='word_1_1_1_9' title='bbox 1087 2002 1187 2039; x_wconf 29'>still </span>
          <span class='ocrx_word' id='word_1_1_1_10' title='bbox 1187 2003 1370 2038; x_wconf 29'>remains </span>
          <span class='ocrx_word' id='word_1_1_1_11' title='bbox 1370 2014 1433 2037; x_wconf 29'>an-</span>
        </span>
        <span class='ocr_line' id='line_1_1_2' title='bbox 244 2062 1435 2112; baseline 0 -9'>
          <span class='ocrx_word' id='word_1_1_2_1' title='bbox 244 2063 370 2099; x_wconf 29'>other mode </span>
          <span class='ocrx_word' id='word_1_1_2_2' title='bbox 370 2064 427 2100; x_wconf 29'>in </span>
          <span class='ocrx_word' id='word_1_1_2_3' title='bbox 427 2063 566 2100; x_wconf 29'>which </span>
          <span class='ocrx_word' id='word_1_1_2_4' title='bbox 566 2063 670 2100; x_wconf 29'>false </span>
          <span class='ocrx_word' id='word_1_1_2_5' title='bbox 670 2063 907 2112; x_wconf 29'>judgments </span>
          <span class='ocrx_word' id='word_1_1_2_6' title='bbox 907 2064 1006 2112; x_wconf 29'>may </span>
          <span class='ocrx_word' id='word_1_1_2_7' title='bbox 1006 2063 1071 2100; x_wconf 29'>be </span>
          <span class='ocrx_word' id='word_1_1_2_8' title='bbox 1071 2062 1266 2100; x_wconf 29'>formed. </span>
          <span class='ocrx_word' id='word_1_1_2_9' title='bbox 1266 2062 1435 2110; x_wconf 29'>Suppose</span>
        </span>
        <span class='ocr_line' id='line_1_1_3' title='bbox 118 2122 1434 2171; baseline 0 -9'>
          <span class='ocrx_word' id='word_1_1_3_1' title='bbox 118 2123 217 2160; x_wconf 29'>that </span>
          <span class='ocrx_word' id='word_1_1_3_2' title='bbox 217 2124 289 2160; x_wconf 29'>we </span>
          <span class='ocrx_word' id='word_1_1_3_3' title='bbox 289 2124 400 2160; x_wconf 29'>have </span>
          <span class='ocrx_word' id='word_1_1_3_4' title='bbox 400 2124 456 2160; x_wconf 29'>in </span>
          <span class='ocrx_word' id='word_1_1_3_5' title='bbox 456 2136 542 2161; x_wconf 29'>our </span>
          <span class='ocrx_word' id='word_1_1_3_6' title='bbox 542 2124 660 2161; x_wconf 29'>souls </span>
          <span class='ocrx_word' id='word_1_1_3_7' title='bbox 660 2136 700 2160; x_wconf 29'>a </span>
          <span class='ocrx_word' id='word_1_1_3_8' title='bbox 700 2129 847 2160; x_wconf 29'>waxen </span>
          <span class='ocrx_word' id='word_1_1_3_9' title='bbox 847 2123 983 2160; x_wconf 29'>tablet </span>
          <span class='ocrx_word' id='word_1_1_3_10' title='bbox 983 2124 1045 2160; x_wconf 29'>of </span>
          <span class='ocrx_word' id='word_1_1_3_11' title='bbox 1045 2124 1211 2160; x_wconf 29'>various </span>
          <span class='ocrx_word' id='word_1_1_3_12' title='bbox 1211 2122 1398 2171; x_wconf 29'>qualities </span>
          <span class='ocrx_word' id='word_1_1_3_13' title='bbox 1398 2122 1434 2157; x_wconf 29'>lastWord</span>
        </span>
      </p>
    </div>
  </div>`;
const FAKE_HOCR_EMPTY = `
  <div class='ocr_page' id='page_1' title='image "goodytwoshoes00newyiala_0001.jpg"; bbox 0 0 2454 3192; ppageno 0'>
  </div>`;

/** The same page of OCR, expressed in each format the plugin supports */
const FIXTURES = {
  DjVuXML: {
    ONE_WORD: FAKE_XML_1WORD,
    MULT_WORDS: FAKE_XML_MULT_WORDS,
    MULT_LINES: FAKE_XML_MULT_LINES,
    EMPTY: FAKE_XML_EMPTY,
    /** Matches a single word in ONE_WORD, so that it can be duplicated */
    WORD_PATTERN: /<WORD[^>]*>.*?<\/WORD>/,
  },
  hOCR: {
    ONE_WORD: FAKE_HOCR_1WORD,
    MULT_WORDS: FAKE_HOCR_MULT_WORDS,
    MULT_LINES: FAKE_HOCR_MULT_LINES,
    EMPTY: FAKE_HOCR_EMPTY,
    WORD_PATTERN: /<span class='ocrx_word'[^>]*>.*?<\/span>/,
  },
};

const FORMATS = /** @type {const} */ (['DjVuXML', 'hOCR']);

document.body.innerHTML = '<div id="BookReader">';
const br = window.br = (() => {
  const br = new BookReader({
    data: [
      [
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page001.jpg' },
      ],
      [
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page002.jpg' },
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page003.jpg' },
      ],
      [
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page004.jpg' },
        { width: 800, height: 1200,
          uri: '//archive.org/download/BookReader/img/page005.jpg' },
      ],
    ],
  });
  br.init();
  return br;
})();

afterEach(() => {
  sinon.restore();
  $('.BRtextLayer').remove();
});

describe("Generic tests", () => {
  test("_createPageContainer overridden function still creates a BRpagecontainer element", () => {
    const spy = sinon.spy(br.plugins.textSelection, 'createTextLayer');
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns(parseOCRBook('DjVuXML', FAKE_XML_1WORD).pages[0]);
    const container = br._createPageContainer(1, {});
    expect(container).toBeTruthy();
    expect(spy.callCount).toBe(1);
  });

  // test loading first object from sample data
  test("_createPageContainer handles index 0", () => {
    const spy = sinon.spy(br.plugins.textSelection, 'createTextLayer');
    br._createPageContainer(0, {});
    expect(spy.callCount).toBe(1);
  });

  // test loading last object from sample data
  test("_createPageContainer handles index -1", () => {
    const spy = sinon.spy(br.plugins.textSelection, 'createTextLayer');
    br._createPageContainer(-1, {});
    expect(spy.callCount).toBe(0);
  });

  test("createTextLayer does nothing if the page has no OCR", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText").returns(undefined);
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 0, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(0);
  });

  test("createTextLayer creates text layer with paragraph with word with 5 params coordinates", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns(parseOCRBook('DjVuXML', FAKE_XML_5COORDS).pages[0]);
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(1);
  });

  test.each(FORMATS)("getPageText parses a single page of %s", async (format) => {
    const textSelection = br.plugins.textSelection;
    textSelection.pageTextCache.entries = [];
    textSelection.options.format = format;
    textSelection.options.singlePageDjvuXmlUrl = 'https://archive.org/ocr?page={{pageIndex}}';
    sinon.stub($, 'ajax').returns(Promise.resolve(FIXTURES[format].MULT_WORDS));
    try {
      const ocrPage = await textSelection.getPageText(0);
      expect(ocrPage.words.map(w => w.text.trim())).toEqual(['test1', 'test2', 'test3']);
    } finally {
      textSelection.options.format = 'DjVuXML';
      textSelection.options.singlePageDjvuXmlUrl = null;
    }
  });
});

describe.each(FORMATS)("%s text layer", (format) => {
  const fixtures = FIXTURES[format];

  /** @param {string} rawOcr */
  const stubPageText = (rawOcr) => sinon.stub(br.plugins.textSelection, "getPageText")
    .returns(parseOCRBook(format, rawOcr).pages[0]);

  test("createTextLayer will render the last page and create text layer properly", async () => {
    const $container = br.refs.$brContainer;
    stubPageText(fixtures.ONE_WORD);
    const pageIndex = br.data.length - 1;
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: pageIndex, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
  });

  test("createTextLayer will not create text layer if there are too many words", async () => {
    const $container = br.refs.$brContainer;
    const wordEl = fixtures.ONE_WORD.match(fixtures.WORD_PATTERN)[0];
    stubPageText(fixtures.ONE_WORD.replace(wordEl, wordEl.repeat(3000)));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 0, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(0);
    expect($container.find("p").length).toBe(0);
    expect($container.find(".BRwordElement").length).toBe(0);
  });

  test("createTextLayer creates text layer with paragraph with 1 word element", async () => {
    const $container = br.refs.$brContainer;
    stubPageText(fixtures.ONE_WORD);
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 1, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(1);
    expect($container.find(".BRwordElement").text()).toBe("test");
  });

  test("createTextLayer creates text layer with paragraph with multiple word elements", async () => {
    const $container = br.refs.$brContainer;
    stubPageText(fixtures.MULT_WORDS);
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 2, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(3);
    expect($container.find(".BRspace").length).toBe(2);
  });

  test("createTextLayer handles multiple lines", async () => {
    const $container = br.refs.$brContainer;
    stubPageText(fixtures.MULT_LINES);
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
    expect($container.find(".BRlineElement").length).toBe(3);
    // Adds space at end of line; except last line/hyphens
    expect($container.find("p").text()).toMatch(/another/);
    expect($container.find("p").text()).toMatch(/Suppose /);
    expect($container.find("p").text()).toMatch(/lastWord$/);
    expect($container.find("p > br").length).toBe(1);
  });

  test("createTextLayer repairs trailing hyphens", async () => {
    const $container = br.refs.$brContainer;
    stubPageText(fixtures.MULT_LINES);
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});

    expect($container.find(".BRwordElement--hyphen").length).toBe(1);
    expect($container.find(".BRwordElement--hyphen").closest(".BRlineElement").text().endsWith(' ')).toBe(false);
    expect($container.find(".BRwordElement--hyphen").closest(".BRlineElement").text().endsWith('-')).toBe(false);
  });

  test("createTextLayer can handle a page with no text", async () => {
    const $container = br.refs.$brContainer;
    stubPageText(fixtures.EMPTY);
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 4, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(0);
    expect($container.find(".BRwordElement").length).toBe(0);
  });
});
