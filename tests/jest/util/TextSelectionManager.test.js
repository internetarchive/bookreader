import sinon from 'sinon';

import BookReader from '@/src/BookReader.js';
import {
  genAt,
  genFilter,
  genMap,
  lookAroundWindow,
  walkBetweenNodes,
  zip,
} from '@/src/plugins/plugin.text_selection.js';

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
});