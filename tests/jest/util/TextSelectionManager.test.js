import sinon from 'sinon';

import BookReader from '@/src/BookReader.js';
import '@/src/plugins/plugin.text_selection.js';
import {createParam} from '@/src/util/TextSelectionManager.js';

// djvu.xml book infos copied from https://ia803103.us.archive.org/14/items/goodytwoshoes00newyiala/goodytwoshoes00newyiala_djvu.xml
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

const MULTIPLE_REPEAT_LINES = `
  <OBJECT data="file://localhost/var/tmp/autoclean/derive/adventureofsherl0000unse/adventureofsherl0000unse.djvu" height="2559" type="image/x.djvu" usemap="adventureofsherl0000unse_0120.djvu" width="1587">
    <PARAGRAPH>
      <LINE>
        <WORD coords="180,1412,313,1378" x-confidence="82">“That</WORD>
        <WORD coords="331,1425,412,1378" x-confidence="96">clay</WORD>
        <WORD coords="431,1413,505,1378" x-confidence="96">and</WORD>
        <WORD coords="526,1413,637,1378" x-confidence="96">chalk</WORD>
        <WORD coords="657,1414,814,1378" x-confidence="96">mixture</WORD>
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



describe("TextFragment tests", () => {
  afterEach(() => {
    sinon.restore();
    $('.BRtextLayer').remove();
    window.getSelection().direction = null;
  });

  test("Forward and Backward selection without prefix", async () => {
    const $container = br.refs.$brContainer;
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
    const forwardTest = createParam(selection, document.querySelector('.BRtextLayer'));

    selection.removeAllRanges();
    backwardRange.collapse(false);
    selection.addRange(backwardRange);
    selection.extend(forwardRange.startContainer, 0);
    window.getSelection().direction = 'backward';
    const backwardTest = createParam(selection, document.querySelector('.BRtextLayer'));

    expect(forwardTest).toMatch("text=way,false");
    expect(backwardTest).toMatch(forwardTest);
  });

  test("Forward and Backward selection without suffix", async () => {
    const $container = br.refs.$brContainer;
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
    const forwardTest = createParam(selection, document.querySelector('.BRtextLayer'));
    selection.removeAllRanges();
    backwardRange.collapse(false);
    selection.addRange(backwardRange);
    selection.extend(forwardRange.startContainer, 0);
    window.getSelection().direction = 'backward';

    const backwardTest = createParam(selection, document.querySelector('.BRtextLayer'));

    expect(forwardTest).toMatch("text=various,lastWord");
    expect(backwardTest).toMatch(forwardTest);
  });

  test("Should be able to differentiate overlapping matches", async () => {
    const $container = br.refs.$brContainer;
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
    const multipleHighlights = createParam(selection, document.querySelector('.BRtextLayer'));

    selection.removeAllRanges();
    selection.addRange(sameKeyHighlightRange);
    const similarHighlight = createParam(selection, document.querySelector('.BRtextLayer'));

    expect(multipleHighlights).toBe(`text=is%20quite%20distinctive.%E2%80%9D-,%E2%80%9CThat%20is,-easily%20got.%E2%80%9D`);
    expect(multipleHighlights).not.toBe(similarHighlight);
  });

  test("Create text fragment without spanning multiple new lines", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_DIALOGUE, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeBefore = document.createRange();

    rangeBefore.setStart($($container.find(".BRparagraphElement")[1]).find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($($container.find(".BRparagraphElement")[1]).find(".BRwordElement")[2].firstChild, 6);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    const multiLineBehavior = createParam(selection, document.querySelector('.BRtextLayer'));
    // “Stolen.”-,“My own seal.”,-“Imitated.”
    expect(multiLineBehavior).toMatch("text=%E2%80%9CStolen.%E2%80%9D-,%E2%80%9CMy%20own%20seal.%E2%80%9D,-%E2%80%9CImitated.%E2%80%9D");
  });

  test("Prefix/suffix exists even with < 3 words", async () => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_DIALOGUE, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($($container.find(".BRparagraphElement")[3]).find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($($container.find(".BRparagraphElement")[3]).find(".BRwordElement")[1].firstChild, 12);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    // “Imitated.”-, “My photograph.”,-“Bought.”
    const endShortSuffix = createParam(selection, document.querySelector('.BRtextLayer'));

    expect(endShortSuffix).toMatch("text=%E2%80%9CImitated.%E2%80%9D-,%E2%80%9CMy%20photograph.%E2%80%9D,-%E2%80%9CBought.%E2%80%9D");
  });

  test("Able to match one non-unique highlighted word", async() => {
    const $container = br.refs.$brContainer;
    sinon.stub(br.plugins.textSelection, "getPageText")
      .returns($(new DOMParser().parseFromString(FAKE_DIALOGUE, "text/xml")));
    await br.plugins.textSelection.createTextLayer({ $container, page: {index: 1, width: 100, height: 100 }});

    const rangeBefore = document.createRange();
    rangeBefore.setStart($($container.find(".BRparagraphElement")[3]).find(".BRwordElement")[0].firstChild, 0);
    rangeBefore.setEnd($($container.find(".BRparagraphElement")[3]).find(".BRwordElement")[0].firstChild, 3);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(rangeBefore);

    // “Imitated.”-, “My,-photograph.”
    const singleTextFragment = createParam(selection, document.querySelector('.BRtextLayer'));

    expect(singleTextFragment).toMatch("text=%E2%80%9CImitated.%E2%80%9D-,%E2%80%9CMy,-photograph.%E2%80%9D");
  });
});
