import sinon from 'sinon';
import '../../src/js/jquery-ui-wrapper.js';

import '../../src/js/BookReader.js';
import { BookreaderWithTextSelection, TextSelectionPlugin, Cache } from '../../src/js/plugins/plugin.text_selection.js';


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
const FAKE_XML_EMPTY = '';

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
      case 4: return $(parser.parseFromString(FAKE_XML_EMPTY, "text/xml"))
      }
    });
  });

  test("_createPageContainer overriden function still creates a BRpagecontainer element", () => {
    const spy = sinon.spy(br.textSelectionPlugin, 'createTextLayer');
    const $container = br._createPageContainer(1, {});
    expect($container.hasClass("BRpagecontainer")).toBe(true);
    expect(spy.callCount).toBe(1);
  });

  // test loading first object from sample data
  test("_createPageContainer handles index 0", () => {
    const spy = sinon.spy(br.textSelectionPlugin, 'createTextLayer');
    br._createPageContainer(0, {});
    expect(spy.callCount).toBe(1);
  });

  // test loading last object from sample data
  test("_createPageContainer handles index -1", () => {
    const spy = sinon.spy(br.textSelectionPlugin, 'createTextLayer');
    br._createPageContainer(-1, {});
    expect(spy.callCount).toBe(0);
  });

  // test loading first object from sample data
  test("_createPageContainer handles index 0", () => {
    const spy = sinon.spy(br.textSelectionPlugin, 'createTextLayer');
    br._createPageContainer(0, {});
    expect(spy.callCount).toBe(1);
  });

  test("createTextLayer will render the last page and create text layer properly", async () => {
    const $container = br.refs.$brContainer;
    const pageIndex = br.data.length - 1
    await br.textSelectionPlugin.createTextLayer(pageIndex, $container);
    expect($container.find(".textSelectionSVG").length).toBe(1);
    expect($container.find(".BRparagElement").length).toBe(1);
  });

  test("createTextLayer will not create text layer if index is more than total number of book pages", async () => {
    const $container = br.refs.$brContainer;
    const pageIndex = br.data.length + 10
    await br.textSelectionPlugin.createTextLayer(pageIndex, $container);
    expect($container.find(".textSelectionSVG").length).toBe(0);
    expect($container.find(".BRparagElement").length).toBe(0);
    expect($container.find(".BRwordElement").length).toBe(0);
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

  test("createTextLayer can handle empty xml", async () => {
    const $container = br.refs.$brContainer;
    await br.textSelectionPlugin.createTextLayer(4, $container);
    expect($container.find(".textSelectionSVG").length).toBe(1);
    expect($container.find(".BRparagElement").length).toBe(0);
    expect($container.find(".BRwordElement").length).toBe(0);
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
    const tsp = new TextSelectionPlugin({}, {}, true)
    expect(tsp.djvuPagesPromise).toBe(null);
    expect(tsp.svgParagraphElement).toBe("g");
    expect(tsp.svgWordElement).toBe("text");
  });

  test("textSelectionPlugin constructor not on firefox browser", () => {
    const tsp = new TextSelectionPlugin({}, {}, false)
    expect(tsp.djvuPagesPromise).toBe(null);
    expect(tsp.svgParagraphElement).toBe("text");
    expect(tsp.svgWordElement).toBe("tspan");
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
