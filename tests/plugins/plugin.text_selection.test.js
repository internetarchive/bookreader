import sinon from 'sinon';
import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';

import '../../src/js/BookReader.js';
import { BookreaderWithTextSelection, TextSelectionPlugin } from '../../src/js/plugins/plugin.text_selection.js';


/** @type {BookReader} */

// djvu.xml book infos copied from https://ia803103.us.archive.org/14/items/goodytwoshoes00newyiala/goodytwoshoes00newyiala_djvu.xml
const FAKE_XML_1WORD = `<OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
<PARAGRAPH><LINE><WORD coords="1216,2768,1256,2640">test</WORD></LINE></PARAGRAPH>
</OBJECT>`;
const FAKE_XML_MULT_WORDS = `<OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
<PARAGRAPH><LINE><WORD coords="1216,2768,1256,2640">test1</WORD>
<WORD coords="1400,2768,1500,2640">test2</WORD>
<WORD coords="1600,2768,1700,2640">test3</WORD></LINE></PARAGRAPH></OBJECT>`;
const FAKE_XML_5COORDS = `<OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
<PARAGRAPH><LINE><WORD coords="1216,2768,1256,2640,2690">test</WORD></LINE></PARAGRAPH></OBJECT>`;

describe("Generic tests", () => {

  let br;
  beforeEach(() => {
    const parser = new DOMParser()
    document.body.innerHTML = '<div id="BookReader">';
    br = new BookreaderWithTextSelection({
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
        ]
      ],
    });
    br.enableTextSelection = true;
    br.init();
    sinon.stub(br.textSelectionPlugin, "getPageText").callsFake(async (pageIndex) => {
      switch (pageIndex) {
      case 1: return $(parser.parseFromString(FAKE_XML_1WORD, "text/xml"));
      case 2: return $(parser.parseFromString(FAKE_XML_MULT_WORDS, "text/xml"));
      case 3: return $(parser.parseFromString(FAKE_XML_5COORDS, "text/xml"));
      }
    });
  });

  test("_createPageContainer overriden function still creates a BRpagecontainer element", () => {
    const $container = br._createPageContainer(1, {});
    expect($container.hasClass("BRpagecontainer")).toBe(true);
  });

  test("createTextLayer creates an svg layer with paragraph with 1 word element", async () => {
    const $container = br.refs.$brContainer;
    await br.textSelectionPlugin.createTextLayer(1, $container);
    expect($container.find(".textSelectionSVG").length).toBe(1);
    expect($container.find(".BRparagElement").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(1);
    expect($container.find(".BRwordElement").text()).toBe("test");
  });

  test("createTextLayer creates an svg layer with paragraph with multiple word elements", async () => {
    const $container = br.refs.$brContainer;
    await br.textSelectionPlugin.createTextLayer(2, $container);
    expect($container.find(".textSelectionSVG").length).toBe(1);
    expect($container.find(".BRparagElement").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(5);
    expect($container.find(".BRwordElement").last()).not.toBe(" ");
  });

  test("createTextLayer creates an svg layer with paragraph with word with 5 params coordinates", async () => {
    const $container = br.refs.$brContainer;
    await br.textSelectionPlugin.createTextLayer(3, $container);
    expect($container.find(".textSelectionSVG").length).toBe(1);
    expect($container.find(".BRparagElement").length).toBe(1);
    expect($container.find(".BRwordElement").length).toBe(1);
  });

  const LONG_PRESS_DURATION = 500;
  test("calling stopPageFlip does not allow long click to flip the page", () => {
    const $container = br.refs.$brContainer;
    br.textSelectionPlugin.stopPageFlip($container);
    const currIndex = br.currentIndex();
    $container.find("BRwordElement").mousedown();
    // Waits for long press
    setTimeout(() => {
      $container.find("BRwordElement").mousedown();
      // Waits for flipping animation
      setTimeout(() => {
        expect(br.currentIndex()).toBe(currIndex);
      }, 2000);
    }, LONG_PRESS_DURATION);
  });
})

describe("textSelectionPlugin cosntructor", () => {
  test("textSelectionPlugin constructor with firefox browser", () => {
    const tsp = new TextSelectionPlugin(true)
    expect(tsp.djvuPagesPromise).toBe(null);
    expect(tsp.svgParagraphElement).toBe("g");
    expect(tsp.svgWordElement).toBe("text");
  });

  test("textSelectionPlugin constructor not on firefox browser", () => {
    const tsp = new TextSelectionPlugin(false)
    expect(tsp.djvuPagesPromise).toBe(null);
    expect(tsp.svgParagraphElement).toBe("text");
    expect(tsp.svgWordElement).toBe("tspan");
  });
});
