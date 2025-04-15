import sinon from 'sinon';

import BookReader from '@/src/BookReader.js';
import {
  Cache,
  genAt,
  genFilter,
  genMap,
  lookAroundWindow,
  walkBetweenNodes,
  zip,
} from '@/src/plugins/plugin.text_selection.js';

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
const FAKE_XML_EMPTY = '';

describe("Generic tests", () => {
  document.body.innerHTML = '<div id="BookReader">';
  const br = window.br = new BookReader({
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

  afterEach(() => {
    sinon.restore();
    $('.BRtextLayer').remove();
  });

  test("_limitSelection handles short selection", async () => {
    const $container = br.refs.$brContainer;
    br.options.plugins.textSelection.maxProtectedWords = 5;
    sinon.stub(br._plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
    await br._plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($container.find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($container.find(".BRwordElement")[4].firstChild, 1);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    br._plugins.textSelection._limitSelection();

    const rangeAfter = window.getSelection().getRangeAt(0);
    expect(rangeAfter.startContainer).toBe(rangeBefore.startContainer);
    expect(rangeAfter.startOffset).toBe(0);
    expect(rangeAfter.endContainer).toBe(rangeBefore.endContainer);
    expect(rangeAfter.endOffset).toBe(1);

    window.getSelection().removeAllRanges();
  });

  test("_limitSelection shrinks selection", async () => {
    const $container = br.refs.$brContainer;
    br.options.plugins.textSelection.maxProtectedWords = 5;
    sinon.stub(br._plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));

    await br._plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($container.find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($container.find(".BRwordElement")[12].firstChild, 1);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    br._plugins.textSelection._limitSelection();

    const rangeAfter = window.getSelection().getRangeAt(0);
    expect(rangeAfter.startContainer).toBe(rangeBefore.startContainer);
    expect(rangeAfter.endContainer).toBe($container.find(".BRwordElement")[4].firstChild);
  });

  test("_createPageContainer overridden function still creates a BRpagecontainer element", () => {
    const spy = sinon.spy(br.plugins.textSelection, 'createTextLayer');
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_1WORD, "text/xml")));
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

  test("createTextLayer will render the last page and create text layer properly", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_1WORD, "text/xml")));
    const pageIndex = br.data.length - 1;
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: pageIndex, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
  });

  test("createTextLayer will not create text layer if there are too many words", async () => {
    const $container = br.refs.$brContainer;
    const xml = FAKE_XML_1WORD.replace(/<WORD.*<\/WORD>/, FAKE_XML_1WORD.match(/<WORD.*<\/WORD>/)[0].repeat(3000));
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(xml, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 0, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(0);
    expect($container.find("p").length).toBe(0);
    expect($container.find(".BRwordElement").length).toBe(0);
  });

  test("createTextLayer creates text layer with paragraph with 1 word element", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_1WORD, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 1, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(1);
    expect($container.find(".BRwordElement").text()).toBe("test");
  });

  test("createTextLayer creates text layer with paragraph with multiple word elements", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_WORDS, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 2, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(3);
    expect($container.find(".BRspace").length).toBe(2);
  });

  test("createTextLayer creates text layer with paragraph with word with 5 params coordinates", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_5COORDS, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(1);
  });

  test("createTextLayer handles multiple lines", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
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
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});

    expect($container.find(".BRwordElement--hyphen").length).toBe(1);
    expect($container.find(".BRwordElement--hyphen").closest(".BRlineElement").text().endsWith(' ')).toBe(false);
    expect($container.find(".BRwordElement--hyphen").closest(".BRlineElement").text().endsWith('-')).toBe(false);
  });

  test("createTextLayer can handle empty xml", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_EMPTY, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 4, width: 100, height: 100 }});
    expect($container.find(".BRtextLayer").length).toBe(1);
    expect($container.find("p").length).toBe(0);
    expect($container.find(".BRwordElement").length).toBe(0);
  });

  const LONG_PRESS_DURATION = 500;
  test("calling stopPageFlip does not allow long click to flip the page", () => {
    const $container = br.refs.$brContainer;
    br.plugins.textSelection.stopPageFlip($container);
    const currIndex = br.currentIndex();
    $container.find("BRwordElement").trigger("mousedown");
    // Waits for long press
    setTimeout(() => {
      $container.find("BRwordElement").trigger("mousedown");
      // Waits for flipping animation
      setTimeout(() => {
        expect(br.currentIndex()).toBe(currIndex);
      }, 2000);
    }, LONG_PRESS_DURATION);
  });
});

describe("Cache", () => {
  test('Adding works', () => {
    const c = new Cache(10);
    c.add(35);
    expect(c.entries).toEqual([35]);
  });

  test('Size does not grow beyond limit', () => {
    const c = new Cache(2);
    c.add(35);
    c.add(32);
    c.add(12);
    c.add(11);
    c.add(112);
    expect(c.entries).toHaveLength(2);
  });

  test('Oldest evicted first', () => {
    const c = new Cache(2);
    c.add(35);
    c.add(32);
    c.add(12);
    c.add(12);
    c.add(10);
    expect(c.entries).toEqual([12, 10]);
  });
});

describe('genAt', () => {
  test('handles empty', () => {
    expect(genAt(genRange(-1), 0)).toBeUndefined();
  });

  test('handles non-empty', () => {
    expect(genAt(genRange(3), 0)).toBe(0);
    expect(genAt(genRange(3), 1)).toBe(1);
    expect(genAt(genRange(3), 2)).toBe(2);
  });

  test('handles out of bounds', () => {
    expect(genAt(genRange(3), 4)).toBeUndefined();
    expect(genAt(genRange(3), -1)).toBeUndefined();
  });
});

describe('genFilter', () => {
  test('handles empty', () => {
    expect(Array.from(genFilter(genRange(0), x => x > 0))).toEqual([]);
  });

  test('handles non-empty', () => {
    expect(Array.from(genFilter(genRange(3), x => x > 1))).toEqual([2, 3]);
    expect(Array.from(genFilter(genRange(3), x => x < 1))).toEqual([0]);
  });

  test('handles all false', () => {
    expect(Array.from(genFilter(genRange(3), x => x > 3))).toEqual([]);
  });
});

describe('genMap', () => {
  test('handles empty', () => {
    expect(Array.from(genMap([], x => x ** 2))).toEqual([]);
  });

  test('handles non-empty', () => {
    expect(Array.from(genMap([1,2,3], x => x ** 2))).toEqual([1,4,9]);
  });
});

describe('lookAroundWindow', () => {
  test('handles empty', () => {
    expect(Array.from(lookAroundWindow([]))).toEqual([]);
  });

  test('handles smaller than window', () => {
    expect(Array.from(lookAroundWindow([1]))).toEqual([[undefined, 1, undefined]]);
    expect(Array.from(lookAroundWindow([1, 2]))).toEqual([[undefined, 1, 2], [1, 2, undefined]]);
    expect(Array.from(lookAroundWindow([1, 2, 3]))).toEqual([[undefined, 1, 2], [1, 2, 3], [2, 3, undefined]]);
  });

  test('handles larger than window', () => {
    expect(Array.from(lookAroundWindow([1, 2, 3, 4]))).toEqual([
      [undefined, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, undefined],
    ]);
  });
});

describe('zip', () => {
  test('handles empty', () => {
    expect(Array.from(zip([], []))).toEqual([]);
  });

  test('uneven throws error', () => {
    expect(() => Array.from(zip([1], [2, 3]))).toThrow();
  });

  test('handles even', () => {
    expect(Array.from(zip([1, 2], [3, 4]))).toEqual([[1, 3], [2, 4]]);
  });
});

describe('walkBetweenNodes', () => {
  const tree = $(FAKE_XML_MULT_LINES);

  test('handles empty', () => {
    const result = Array.from(walkBetweenNodes(tree[0], tree[0]));
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(tree[0]);
  });

  test('Words on same line', () => {
    const start = tree.find('WORD')[2];
    const end = start.nextElementSibling;
    // Use first child so we hit the text nodes
    const result = Array.from(walkBetweenNodes(start.firstChild, end.firstChild));
    expect(result).toHaveLength(5);
    expect(result[0].nodeType).toBe(Node.TEXT_NODE);
    expect(result[0].textContent).toBe('false ');
    expect(result[1]).toBe(start);
    // Whitespace
    expect(result[2].nodeType).toBe(Node.TEXT_NODE);
    expect(result[2].textContent).toMatch(/^\s*$/);
    expect(result[3]).toBe(end);
    expect(result[4].nodeType).toBe(Node.TEXT_NODE);
    expect(result[4].textContent).toBe('judgment ');
  });

  test('Words on different lines', () => {
    const start = tree.find('WORD')[2];
    const end = tree.find('WORD')[19];
    const result = Array.from(walkBetweenNodes(start.firstChild, end.firstChild));
    // Expect two LINES in result
    expect(result.filter(x => x.nodeName == 'LINE')).toHaveLength(2);
    // Expect 18 WORDs in result
    expect(result.filter(x => x.nodeName == 'WORD')).toHaveLength(18);
    // First word should be the start word
    expect(result[0].parentElement).toBe(start);
    expect(result[0].textContent).toBe('false ');
    // Last word should be the end word
    expect(result[result.length - 1].parentElement).toBe(end);
    expect(result[result.length - 1].textContent).toBe('Suppose');
  });
});

/**
 * @param {number} n
 */
function* genRange(n) {
  for (let i = 0; i <= n; i++) {
    yield i;
  }
}
