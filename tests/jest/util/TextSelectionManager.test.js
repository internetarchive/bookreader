import sinon from 'sinon';

import BookReader from '@/src/BookReader.js';
import '@/src/plugins/plugin.text_selection.js';
import {
  BookReaderTextFragment,
  findRangeForRegExp,
  getFirstWords,
  getLastWords,
  walkBetweenNodes,
} from '@/src/util/TextSelectionManager.js';

// djvu.xml book infos copied from https://ia803103.us.archive.org/14/items/goodytwoshoes00newyiala/goodytwoshoes00newyiala_djvu.xml
const FAKE_XML_MULT_LINES = `
  <OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
    <PARAGRAPH>
      <LINE>
        <WORD coords="119,2050,230,2014" x-confidence="29">way </WORD>
        <WORD coords="230,2038,320,2002" x-confidence="30">can  </WORD>
        <WORD coords="320,2039,433,2002" x-confidence="28">false </WORD>
        <WORD coords="433,2051,658,2003" x-confidence="29">judgment </WORD>
        <WORD coords="658,2039,728,2002" x-confidence="30">be </WORD>
        <WORD coords="658,2039,728,2002" x-confidence="30">-</WORD>
        <WORD coords="728,2039,939,2001" x-confidence="29"> formed. </WORD>
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

const MULTIPLE_REPEAT_LINES = `
  <OBJECT data="file://localhost/var/tmp/autoclean/derive/adventureofsherl0000unse/adventureofsherl0000unse.djvu" height="2559" type="image/x.djvu" usemap="adventureofsherl0000unse_0120.djvu" width="1587">
    <PARAGRAPH>
      <LINE>
        <WORD coords="180,1412,313,1378" x-confidence="82">“That</WORD>
        <WORD coords="331,1425,412,1378" x-confidence="96">clay</WORD>
        <WORD coords="431,1413,505,1378" x-confidence="96">and</WORD>
        <WORD coords="526,1413,637,1378" x-confidence="96">chalk</WORD>
        <WORD coords="657,1414,814,1378" x-confidence="96">mixture,</WORD>
        <WORD coords="836,1414,957,1378" x-confidence="96">which</WORD>
        <WORD coords="976,1414,994,1380" x-confidence="96">I</WORD>
        <WORD coords="1017,1414,1080,1390" x-confidence="96">see</WORD>
        <WORD coords="1102,1426,1204,1391" x-confidence="96">upon</WORD>
        <WORD coords="1231,1425,1325,1391" x-confidence="96">your</WORD>
        <WORD coords="1349,1417,1418,1385" x-confidence="96">toe</WORD>
      </LINE>
      <LINE>
        <WORD coords="130,1482,218,1447" x-confidence="96">caps</WORD>
        <WORD coords="237,1472,267,1437" x-confidence="96">is</WORD>
        <WORD coords="287,1483,389,1438" x-confidence="96">quite</WORD>
        <WORD coords="408,1474,654,1437" x-confidence="96">distinctive.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="177,1591,308,1556" x-confidence="84">“That</WORD>
        <WORD coords="327,1592,359,1556" x-confidence="96">is</WORD>
        <WORD coords="376,1604,493,1556" x-confidence="96">easily</WORD>
        <WORD coords="509,1603,610,1557" x-confidence="96">got.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="178,1711,308,1676" x-confidence="93">“That</WORD>
        <WORD coords="326,1711,357,1676" x-confidence="96">is</WORD>
        <WORD coords="375,1712,441,1683" x-confidence="96">not</WORD>
        <WORD coords="459,1724,594,1677" x-confidence="96">always</WORD>
        <WORD coords="613,1713,655,1689" x-confidence="95">so</WORD>
        <WORD coords="673,1726,798,1679" x-confidence="95">easy.”</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>`;

const FAKE_DIALOGUE = `
  <OBJECT data="file://localhost/var/tmp/autoclean/derive/adventureofsherl0000unse/adventureofsherl0000unse.djvu" type="image/x.djvu" usemap="adventureofsherl0000unse_0021.djvu" width="1587" height="2559">
    <PARAGRAPH>
      <LINE>
        <WORD coords="149,1891,348,1855" x-confidence="69">“Stolen.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="181,1962,249,1916" x-confidence="96">“My</WORD>
        <WORD coords="266,1951,348,1928" x-confidence="95">own</WORD>
        <WORD coords="367,1953,481,1917" x-confidence="76">seal.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="180,2013,393,1976" x-confidence="41">“Imitated.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="143,2084,243,2037" x-confidence="88">“My</WORD>
        <WORD coords="255,2086,530,2038" x-confidence="86">photograph.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="175,2145,358,2098" x-confidence="96">“Bought.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="143,2084,243,2037" x-confidence="88">“My</WORD>
        <WORD coords="255,2086,530,2038" x-confidence="86">photograph.”</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="181,1962,249,1916" x-confidence="96">“My</WORD>
        <WORD coords="266,1951,348,1928" x-confidence="95">own</WORD>
        <WORD coords="367,1953,481,1917" x-confidence="76">seal.”</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>
`;
const PAGE_ONE = `
  <OBJECT>
    <PARAGRAPH>
      <LINE>
        <WORD coords="177,1591,308,1556" x-confidence="84">Book</WORD>
        <WORD coords="327,1592,359,1556" x-confidence="96">header</WORD>
        <WORD coords="376,1604,493,1556" x-confidence="96">test</WORD>
        <WORD coords="509,1603,610,1557" x-confidence="96">replica</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="177,1591,308,1556" x-confidence="84">This</WORD>
        <WORD coords="327,1592,359,1556" x-confidence="96">is</WORD>
        <WORD coords="376,1604,493,1556" x-confidence="96">page</WORD>
        <WORD coords="509,1603,610,1557" x-confidence="96">one</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>
`;
const PAGE_TWO = `
  <OBJECT>
    <PARAGRAPH>
      <LINE>
        <WORD coords="177,1591,308,1556" x-confidence="84">Book</WORD>
        <WORD coords="327,1592,359,1556" x-confidence="96">header</WORD>
        <WORD coords="376,1604,493,1556" x-confidence="96">test</WORD>
        <WORD coords="509,1603,610,1557" x-confidence="96">replica</WORD>
      </LINE>
    </PARAGRAPH>
    <PARAGRAPH>
      <LINE>
        <WORD coords="177,1591,308,1556" x-confidence="84">Currently</WORD>
        <WORD coords="327,1592,359,1556" x-confidence="96">on</WORD>
        <WORD coords="376,1604,493,1556" x-confidence="96">page</WORD>
        <WORD coords="509,1603,610,1557" x-confidence="96">two</WORD>
      </LINE>
    </PARAGRAPH>
  </OBJECT>
`;
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

describe("Generic tests", () => {

  afterEach(() => {
    sinon.restore();
    $('.BRtextLayer').remove();
  });

  test("_limitSelection handles short selection", async () => {
    const $container = br.refs.$brContainer;
    br.plugins.textSelection.textSelectionManager.options.maxProtectedWords = 5;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($container.find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($container.find(".BRwordElement")[4].firstChild, 1);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    br.plugins.textSelection.textSelectionManager._limitSelection();

    const rangeAfter = window.getSelection().getRangeAt(0);
    expect(rangeAfter.startContainer).toBe(rangeBefore.startContainer);
    expect(rangeAfter.startOffset).toBe(0);
    expect(rangeAfter.endContainer).toBe(rangeBefore.endContainer);
    expect(rangeAfter.endOffset).toBe(1);

    window.getSelection().removeAllRanges();
  });
  test("_limitSelection shrinks selection", async () => {
    const $container = br.refs.$brContainer;
    br.plugins.textSelection.textSelectionManager.options.maxProtectedWords = 5;

    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));

    await br.plugins.textSelection.createTextLayer({ $container, page: { index: 3, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($container.find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($container.find(".BRwordElement")[12].firstChild, 1);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    br.plugins.textSelection.textSelectionManager._limitSelection();

    const rangeAfter = window.getSelection().getRangeAt(0);
    expect(rangeAfter.startContainer).toBe(rangeBefore.startContainer);
    expect(rangeAfter.endContainer).toBe($container.find(".BRwordElement")[4].firstChild);
  });

  const LONG_PRESS_DURATION = 500;
  test("calling stopPageFlip does not allow long click to flip the page", () => {
    const $container = br.refs.$brContainer;
    br.plugins.textSelection.textSelectionManager.stopPageFlip($container);
    const currIndex = br.currentIndex();
    $container.find(".BRwordElement").trigger("mousedown");
    // Waits for long press
    setTimeout(() => {
      $container.find(".BRwordElement").trigger("mousedown");
      // Waits for flipping animation
      setTimeout(() => {
        expect(br.currentIndex()).toBe(currIndex);
      }, 2000);
    }, LONG_PRESS_DURATION);
  });
});

describe("BookReaderTextFragment.fromSelection tests", () => {

  afterEach(() => {
    sinon.restore();
    $('.BRtextLayer').remove();
    $('.BRpage').remove();
    window.getSelection().direction = null;
  });

  test("Text fragment generation accounts for text at the end of the first page/beginning of second page", async () => {
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(PAGE_ONE, "text/xml")));
    const $pageContainer1 = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    await br.plugins.textSelection.createTextLayer({ $container: $pageContainer1, page: {index: 1, width: 100, height: 100 }});

    sinon.restore();

    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(PAGE_TWO, "text/xml")));
    const $pageContainer2 = $("<div class='BRpagecontainer' data-page-num='13' data-index='16'></div>").appendTo(br.refs.$brContainer);
    await br.plugins.textSelection.createTextLayer({ $container: $pageContainer2, page: {index: 2, width: 100, height: 100 }});

    Array.from($(br.refs.$brContainer).find(".BRtextLayer")).forEach((layer) => {
      layer.parentElement.classList.add("BRpage-visible");
    });

    const rangePageOne = document.createRange();
    rangePageOne.setStart($(br.refs.$brContainer).find(".BRtextLayer").find(".BRparagraphElement").find(".BRwordElement")[0].firstChild, 0);
    rangePageOne.setEnd($(br.refs.$brContainer).find(".BRtextLayer").find(".BRparagraphElement").find(".BRwordElement")[3].firstChild, 7);

    const selectionPageOne = window.getSelection();
    selectionPageOne.removeAllRanges();
    selectionPageOne.addRange(rangePageOne);

    const pageOneUrlParam = BookReaderTextFragment.fromSelection(selectionPageOne, Array.from(br.refs.$brContainer.find(".BRtextLayer")));
    expect(pageOneUrlParam.toUrlString()).toMatch("12:Book%20header%20test%20replica,-This%20is%20page");

    const rangePageTwo = document.createRange();
    rangePageTwo.setStart($($(br.refs.$brContainer).find(".BRtextLayer")[1]).find(".BRparagraphElement").find(".BRwordElement")[0].firstChild, 0);
    rangePageTwo.setEnd($($(br.refs.$brContainer).find(".BRtextLayer")[1]).find(".BRparagraphElement").find(".BRwordElement")[3].firstChild, 6);
    const selectionPageTwo = window.getSelection();
    selectionPageTwo.removeAllRanges();
    selectionPageTwo.addRange(rangePageTwo);

    const pageTwoUrlParam = BookReaderTextFragment.fromSelection(selectionPageTwo, Array.from(br.refs.$brContainer.find(".BRtextLayer")));

    expect(pageTwoUrlParam.toUrlString()).toMatch("13:is%20page%20one-,Book%20header%20test%20replica,-Currently%20on%20page");
  });

  test("Forward and Backward selection without prefix", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 3, width: 100, height: 100 }});

    const forwardRange = document.createRange();
    forwardRange.setStart($container.find(".BRwordElement")[0].firstChild, 0);
    forwardRange.setEnd($container.find(".BRwordElement")[2].firstChild, 1);
    const backwardRange = document.createRange();
    backwardRange.setStart($container.find(".BRwordElement")[2].firstChild, 0);
    backwardRange.setEnd($container.find(".BRwordElement")[2].firstChild, 5);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(forwardRange);
    const forwardTest = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));
    expect(forwardTest.toUrlString()).toMatch("way%20can%20false,-judgment%20be%20-");

    selection.removeAllRanges();
    backwardRange.collapse(false);
    selection.addRange(backwardRange);
    selection.extend(forwardRange.startContainer, 0);
    window.getSelection().direction = 'backward';
    const backwardTest = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));
    expect(backwardTest.toUrlString()).toMatch(forwardTest.toUrlString());
  });

  /** TODO
   *  BookReaderTextFragment.fromSelection has changed drastically since
   *  we are no longer using the native browser API for text fragments
   *  Skipping the tests for now
   */
  test.skip("Forward and Backward selection without suffix", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 3, width: 100, height: 100 }});

    const forwardRange = document.createRange();
    forwardRange.setStart($container.find(".BRwordElement")[30].firstChild, 0);
    forwardRange.setEnd($container.find(".BRwordElement")[32].firstChild, 1);
    const backwardRange = document.createRange();
    backwardRange.setStart($container.find(".BRwordElement")[32].firstChild, 0);
    backwardRange.setEnd($container.find(".BRwordElement")[32].firstChild, 1);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(forwardRange);
    const forwardTest = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));
    selection.removeAllRanges();
    backwardRange.collapse(false);
    selection.addRange(backwardRange);
    selection.extend(forwardRange.startContainer, 0);
    window.getSelection().direction = 'backward';

    const backwardTest = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));

    expect(forwardTest.toUrlString()).toMatch("various,lastWord");
    expect(backwardTest.toUrlString()).toMatch(forwardTest.toUrlString());
  });

  test("Handle start/end word with space before/after meaningful text content", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const startWordRange = document.createRange();
    startWordRange.setStart($container.find(".BRwordElement")[1].firstChild, 3);
    startWordRange.setEnd($container.find(".BRwordElement")[6].firstChild, 4);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(startWordRange);
    const startingSpaceTextFragmentUrl = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));
    expect(startingSpaceTextFragmentUrl.toUrlString()).toBe(`12:way-,can%20false%20judgment%20be%20-%20formed.,-There%20still%20remains%20another%20mode`);

    const endWordRange = document.createRange();
    endWordRange.setStart($container.find(".BRwordElement")[1].firstChild, 0);
    endWordRange.setEnd($container.find(".BRwordElement")[6].firstChild, 0);

    selection.removeAllRanges();
    selection.addRange(endWordRange);
    const endingSpaceTextFragmentUrl = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));

    expect(endingSpaceTextFragmentUrl.toUrlString()).toBe("12:way-,can%20false%20judgment%20be%20-,-formed.%20There%20still%20remains%20another");
  });

  test("Handle range end node not text node", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_XML_MULT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const range = document.createRange();
    range.setStart($container.find(".BRwordElement")[8].firstChild, 0);
    range.setEnd($container.find(".BRlineElement")[1].firstChild, 0);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const startingSpaceTextFragmentUrl = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));
    expect(startingSpaceTextFragmentUrl.toUrlString()).toBe("12:-%20formed.%20There-,still%20remains%20an,-other%20mode%20in");
  });

  test("Quote and comma included in text selection should be URI encoded", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(MULTIPLE_REPEAT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeIncludesComma = document.createRange();
    rangeIncludesComma.setStart(
      $($container.find('.BRparagraphElement')[0]).find(".BRwordElement")[0].firstChild, 0);
    rangeIncludesComma.setEnd($($container.find('.BRparagraphElement')[0]).find(".BRwordElement")[4].firstChild, 0);

    const commaSelection = window.getSelection();
    commaSelection.removeAllRanges();
    commaSelection.addRange(rangeIncludesComma);
    const commaTextFragmentUrl = BookReaderTextFragment.fromSelection(commaSelection, Array.from(document.querySelectorAll('.BRtextLayer')));

    expect(commaTextFragmentUrl.toUrlString()).not.toContain("“");
  });

  test("Should be able to differentiate overlapping matches", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(MULTIPLE_REPEAT_LINES, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($($container.find('.BRparagraphElement')[1]).find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($($container.find('.BRparagraphElement')[1]).find(".BRwordElement")[1].firstChild, 2);

    const sameKeyHighlightRange = document.createRange();
    sameKeyHighlightRange.setStart($($container.find('.BRparagraphElement')[0]).find(".BRwordElement")[0].firstChild, 0);
    sameKeyHighlightRange.setEnd($($container.find('.BRparagraphElement')[0]).find(".BRwordElement")[12].firstChild, 2);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);
    const multipleHighlights = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));

    selection.removeAllRanges();
    selection.addRange(sameKeyHighlightRange);
    const similarHighlight = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));

    expect(multipleHighlights.toUrlString()).toBe(`12:is%20quite%20distinctive.%E2%80%9D-,%E2%80%9CThat%20is,-easily%20got.%E2%80%9D%20%E2%80%9CThat`);
    expect(multipleHighlights.toUrlString()).not.toBe(similarHighlight.toUrlString());
  });

  test("Create text fragment without spanning multiple new lines", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_DIALOGUE, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeBefore = document.createRange();

    rangeBefore.setStart($($container.find(".BRparagraphElement")[1]).find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($($container.find(".BRparagraphElement")[1]).find(".BRwordElement")[2].firstChild, 6);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    const multiLineBehavior = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));
    // “Stolen.”-,“My own seal.”,-“Imitated.”
    expect(multiLineBehavior.toUrlString()).toMatch("12:%E2%80%9CStolen.%E2%80%9D-,%E2%80%9CMy%20own%20seal.%E2%80%9D,-%E2%80%9CImitated.%E2%80%9D");
  });

  test("Prefix extended when < 3 words for suffix", async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_DIALOGUE, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($($container.find(".BRparagraphElement")[6]).find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($($container.find(".BRparagraphElement")[6]).find(".BRwordElement")[1].firstChild, 3);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    // “My photograph.” “Bought.” “My photograph.”-,“My own,-seal.”
    const endShortSuffix = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));

    expect(endShortSuffix.toUrlString()).toMatch("12:%E2%80%9CMy%20photograph.%E2%80%9D%20%E2%80%9CBought.%E2%80%9D%20%E2%80%9CMy%20photograph.%E2%80%9D-,%E2%80%9CMy%20own,-seal.%E2%80%9D");
  });

  test("Able to match one non-unique highlighted word", async() => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_DIALOGUE, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($($container.find(".BRparagraphElement")[3]).find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($($container.find(".BRparagraphElement")[3]).find(".BRwordElement")[0].firstChild, 3);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    // own seal. “Imitated.”-, “My,-photograph.”
    const singleTextFragment = BookReaderTextFragment.fromSelection(selection, Array.from(document.querySelectorAll('.BRtextLayer')));

    expect(singleTextFragment.toUrlString()).toMatch("12:own%20seal.%E2%80%9D%20%E2%80%9CImitated.%E2%80%9D-,%E2%80%9CMy,-photograph.%E2%80%9D%20%E2%80%9CBought.%E2%80%9D%20%E2%80%9CMy");
  });
});

describe('BookReaderTextFragment.fromString', () => {
  test('parses all fields and decodes encoded values', () => {
    const book = {
      getPageIndex: sinon.stub().withArgs('12').returns(42),
    };

    const fragment = BookReaderTextFragment.fromString(
      '12:before%20text-,quoted%20text,-after%20text',
      book,
      7,
    );

    expect(fragment.pageNumber).toBe('12');
    expect(fragment.pageIndex).toBe(42);
    expect(fragment.prefix).toBe('before text');
    expect(fragment.quote).toBe('quoted text');
    expect(fragment.suffix).toBe('after text');
  });

  test('uses fallback page index when page number is omitted', () => {
    const book = {
      getPageIndex: sinon.stub(),
    };

    const fragment = BookReaderTextFragment.fromString('just%20a%20quote', book, 9);

    expect(book.getPageIndex.called).toBe(false);
    expect(fragment.pageNumber).toBeNull();
    expect(fragment.pageIndex).toBe(9);
    expect(fragment.prefix).toBeNull();
    expect(fragment.quote).toBe('just a quote');
    expect(fragment.suffix).toBeNull();
  });

  test('throws when page number exists but no page index can be resolved', () => {
    const book = {
      getPageIndex: sinon.stub().withArgs('missing').returns(undefined),
    };

    expect(() => BookReaderTextFragment.fromString('missing:quote', book, 3))
      .toThrow('Could not determine page index for text fragment with page number missing');
  });

  test('parses quoteStart/quoteEnd quote region', () => {
    const book = {
      getPageIndex: sinon.stub().withArgs('12').returns(42),
    };

    const fragment = BookReaderTextFragment.fromString(
      '12:before%20text-,The%20quick%20brown,the%20lazy%20dog,-after%20text',
      book,
      7,
    );

    expect(fragment.pageNumber).toBe('12');
    expect(fragment.pageIndex).toBe(42);
    expect(fragment.prefix).toBe('before text');
    expect(fragment.quote).toBeNull();
    expect(fragment.quoteStart).toBe('The quick brown');
    expect(fragment.quoteEnd).toBe('the lazy dog');
    expect(fragment.suffix).toBe('after text');
  });

  test('throws when quote region has more than one separator comma', () => {
    const book = {
      getPageIndex: sinon.stub().withArgs('12').returns(42),
    };

    expect(() => BookReaderTextFragment.fromString('12:a,b,c', book, 7))
      .toThrow('Invalid text fragment quote format: 12:a,b,c');
  });
});

describe('BookReaderTextFragment.toUrlString', () => {
  test('serializes short quote as full quote', () => {
    const fragment = new BookReaderTextFragment({
      pageNumber: '12',
      pageIndex: 5,
      prefix: 'before text',
      quote: 'short quote',
      suffix: 'after text',
    });

    expect(fragment.toUrlString()).toBe('12:before%20text-,short%20quote,-after%20text');
  });

  test('serializes long quote as quoteStart/quoteEnd', () => {
    const fragment = new BookReaderTextFragment({
      pageNumber: '12',
      pageIndex: 5,
      prefix: 'before text',
      quote: 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau',
      suffix: 'after text',
    });

    expect(fragment.toUrlString()).toBe('12:before%20text-,alpha%20beta%20gamma,rho%20sigma%20tau,-after%20text');
  });

  test('serializes long quote with fewer than 6 words as full quote', () => {
    const fragment = new BookReaderTextFragment({
      pageNumber: '12',
      pageIndex: 5,
      prefix: 'before text',
      quote: 'antidisestablishmentarianism supercalifragilisticexpialidocious pneumonoultramicroscopicsilicovolcanoconiosis hippopotomonstrosesquipedaliophobia floccinaucinihilipilification',
      suffix: 'after text',
    });

    expect(fragment.toUrlString()).toBe('12:before%20text-,antidisestablishmentarianism%20supercalifragilisticexpialidocious%20pneumonoultramicroscopicsilicovolcanoconiosis%20hippopotomonstrosesquipedaliophobia%20floccinaucinihilipilification,-after%20text');
  });

  test('serializes explicit quoteStart/quoteEnd when quote is missing', () => {
    const fragment = new BookReaderTextFragment({
      pageNumber: '12',
      pageIndex: 5,
      prefix: null,
      quoteStart: 'The quick brown',
      quoteEnd: 'the lazy dog',
      suffix: null,
    });

    expect(fragment.toUrlString()).toBe('12:The%20quick%20brown,the%20lazy%20dog');
  });
});


describe("getFirstWords and getLastWords tests", () => {
  test("Handles empty string", () => {
    expect(getFirstWords(3, "")).toBe("");
    expect(getLastWords(3, "")).toBe("");
  });

  test("Handles string with less than 3 words", () => {
    expect(getFirstWords(3, "Hello world")).toBe("Hello world");
    expect(getLastWords(3, "Hello world")).toBe("Hello world");
  });

  test("Handles string with more than 3 words", () => {
    expect(getFirstWords(3, "Hello world this is a test")).toBe("Hello world this");
    expect(getLastWords(3, "Hello world this is a test")).toBe("is a test");
  });

  test("Handles string with punctuation", () => {
    expect(getFirstWords(3, "Hello, world! This is a test.")).toBe("Hello, world! This");
    expect(getLastWords(3, "Hello, world! This is a test.")).toBe("is a test.");
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

describe('BookReaderTextFragment.toRegExp and findRangeForRegExp', () => {
  afterEach(() => {
    sinon.restore();
    $('.BRtextLayer').remove();
  });

  test('includes context text when requested', () => {
    const quote = new BookReaderTextFragment({
      prefix: 'Before',
      quote: 'middle',
      quoteStart: null,
      quoteEnd: null,
      suffix: 'After',
      pageNumber: null,
      pageIndex: 0,
    });

    const nonContextRegex = quote.toRegExp({ context: false });
    const contextRegex = quote.toRegExp({ context: true });

    expect(nonContextRegex.test('middle')).toBe(true);
    expect(nonContextRegex.test('Before middle After')).toBe(true);
    expect(contextRegex.test('Before middle After')).toBe(true);
    expect(contextRegex.test('middle')).toBe(false);
  });

  test('finds single quote matches as ranges', async () => {
    const $container = $("<div class='BRpagecontainer' data-page-num='12' data-index='15'></div>").appendTo(br.refs.$brContainer);
    sinon.stub(br.plugins.textSelection, 'getPageText')
      .returns($(new DOMParser().parseFromString(FAKE_DIALOGUE, 'text/xml')));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const textLayer = $container.find('.BRtextLayer')[0];
    const firstPageNode = textLayer;
    const lastPageNode = textLayer;
    const wholePageRange = new Range();
    wholePageRange.setStart(firstPageNode, 0);
    wholePageRange.setEnd(lastPageNode, lastPageNode.childNodes.length);
    const textNodes = Array.from(textLayer.querySelectorAll('.BRwordElement, .BRspace, br, .BRlineElement'));
    textNodes.splice(0, 1);

    const quoteStart = new BookReaderTextFragment({
      prefix: null,
      quote: '“My own seal.”',
      quoteStart: null,
      quoteEnd: null,
      suffix: null,
      pageNumber: null,
      pageIndex: 0,
    });
    const quoteEnd = new BookReaderTextFragment({
      prefix: null,
      quote: '“My photograph.”',
      quoteStart: null,
      quoteEnd: null,
      suffix: null,
      pageNumber: null,
      pageIndex: 0,
    });

    const range = findRangeForRegExp(
      quoteStart.toRegExp({ normalize: (s) => s.replace(/\s+/g, ' ') }),
      wholePageRange,
      textNodes,
      { normalize: (s) => s.replace(/\s+/g, ' ') },
    );
    const quoteStartRange = findRangeForRegExp(
      quoteStart.toRegExp({ normalize: (s) => s.replace(/\s+/g, ' ') }),
      wholePageRange,
      textNodes,
      { normalize: (s) => s.replace(/\s+/g, ' ') },
    );
    const quoteEndRange = findRangeForRegExp(
      quoteEnd.toRegExp({ normalize: (s) => s.replace(/\s+/g, ' ') }),
      wholePageRange,
      textNodes,
      { normalize: (s) => s.replace(/\s+/g, ' ') },
    );

    expect(range).toBeTruthy();
    expect(quoteStartRange).toBeTruthy();
    expect(quoteEndRange).toBeTruthy();
    expect(range[0].toString().replace(/\s+/g, ' ').trim()).toBe('“My own seal.”');
    expect(quoteStartRange[0].toString().replace(/\s+/g, ' ').trim()).toBe('“My own seal.”');
    expect(quoteEndRange[0].toString().replace(/\s+/g, ' ').trim()).toBe('“My photograph.”');
  });
});
