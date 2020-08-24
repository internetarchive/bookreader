import sinon from 'sinon';
import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';

import '../../src/js/BookReader.js';
import BookreaderWithTextSelection from '../../src/js/plugins/plugin.text_selection.js';
import { PageModel, BookModel } from '../../src/js/BookReader/BookModel.js';

/** @type {BookReader} */
const FAKE_XML = `<OBJECT data="file://localhost//tmp/derive/goodytwoshoes00newyiala//goodytwoshoes00newyiala.djvu" height="3192" type="image/x.djvu" usemap="goodytwoshoes00newyiala_0001.djvu" width="2454">
<PARAGRAPH><LINE><WORD coords="1216,2768,1256,2640">test</WORD></LINE></PARAGRAPH></OBJECT>`;
let br;
const LONG_PRESS_DURATION = 500;

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
    return $(parser.parseFromString(FAKE_XML, "text/xml"));
  });
});

test("_createPageContainer overriden function still creates a BRpagecontainer element", () => {
  const book = new BookModel(br);
  const page = new PageModel(book, 1);
  const $container = br._createPageContainer(page);
  expect($container.hasClass("BRpagecontainer")).toBe(true);
});

test("createTextLayer creates an svg layer with paragraph and word elements", async () => {
  const $container = br.refs.$brContainer;
  await br.textSelectionPlugin.createTextLayer(1, $container);
  expect($container.find(".textSelectionSVG").length).not.toBe(0);
  expect($container.find(".BRparagElement").length).not.toBe(0);
  expect($container.find(".BRwordElement").length).not.toBe(0);
  expect($container.find(".BRwordElement").text()).toBe("test");
});

test("textSelectionPlugin constructor with firefox browser", () => {
  br.textSelectionPlugin.constructor(true);
  expect(br.textSelectionPlugin.djvuPagesPromise).toBe(null);
  expect(br.textSelectionPlugin.svgParagraphElement).toBe("g");
  expect(br.textSelectionPlugin.svgWordElement).toBe("text");
});

test("textSelectionPlugin constructor not on firefox browser", () => {
  br.textSelectionPlugin.constructor(false);
  expect(br.textSelectionPlugin.djvuPagesPromise).toBe(null);
  expect(br.textSelectionPlugin.svgParagraphElement).toBe("text");
  expect(br.textSelectionPlugin.svgWordElement).toBe("tspan");
});

test("calling stopPageFlip does not allow long click to flip the page ", () => {
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

test("calling stopPageFlip allows quick click to flip the page ", () => {
  const $container = br.refs.$brContainer;
  br.textSelectionPlugin.stopPageFlip($container);
  const currIndex = br.currentIndex();
  $container.find("BRwordElement").click();
  // Waits for flipping animation
  setTimeout(() => {
    expect(br.currentIndex()).not.toBe(currIndex);
  }, 2000);
});
