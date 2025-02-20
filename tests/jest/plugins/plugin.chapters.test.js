import sinon from "sinon";

import "@/src/BookReader.js";
import {ChaptersPlugin} from "@/src/plugins/plugin.chapters.js";
import { BookModel } from "@/src/BookReader/BookModel";
import { deepCopy } from "../utils";
/** @typedef {import('@/src/plugins/plugin.chapters').TocEntry} TocEntry  */

/** @type {TocEntry[]} */
const SAMPLE_TOC = [{
  "pagenum": "3",
  "level": 1,
  "label": "CHAPTER I",
  "type": { "key": "/type/toc_item" },
  "title": "THE COUNTRY AND THE MISSION 1",
  "pageIndex": 3,
}, {
  "pagenum": "17",
  "level": 1,
  "label": "CHAPTER II",
  "type": { "key": "/type/toc_item" },
  "title": "THE COUNTRY AND THE MISSION 2",
  "pageIndex": 17,
}, {
  "pagenum": "undefined",
  "level": 1,
  "label": "CHAPTER III",
  "type": { "key": "/type/toc_item" },
  "title": "THE COUNTRY AND THE MISSION 3",
}, {
  "pagenum": "40",
  "level": 1,
  "label": "CHAPTER IV",
  "type": { "key": "/type/toc_item" },
  "title": "THE COUNTRY AND THE MISSION 4",
  "pageIndex": 40,
}];

/** @type {TocEntry[]} */
const SAMPLE_TOC_UNDEF = [
  {
    "level": 1,
    "label": "CHAPTER I",
    "type": { "key": "/type/toc_item" },
    "title": "THE COUNTRY AND THE MISSION 1",
  },
  {
    "level": 1,
    "label": "CHAPTER II",
    "type": { "key": "/type/toc_item" },
    "title": "THE COUNTRY AND THE MISSION 2",
  },
];

/** @type {TocEntry[]} */
const SAMPLE_TOC_OPTION = [
  {
    "level": 1,
    "title": "THE COUNTRY AND THE MISSION 1",
  },
  {
    "level": 1,
    "title": "THE COUNTRY AND THE MISSION 2",
  },
];

afterEach(() => {
  sinon.restore();
});

describe("ChaptersPlugin", () => {
  beforeEach(() => {
    sinon.stub(BookModel.prototype, "getPageIndex").callsFake((str) =>
      parseFloat(str),
    );
  });

  describe("_chapterInit", () => {
    test("does not render when open library has no record", async () => {
      const p = new ChaptersPlugin({ options: { vars: {} } });
      sinon.stub(p, "getOpenLibraryRecord").resolves(null);
      sinon.spy(p, "_chaptersRender");
      await p._chapterInit();
      expect(p._chaptersRender.callCount).toBe(0);
    });

    test("does not render when open library record has no TOC", async () => {
      const p = new ChaptersPlugin({ options: { vars: {} } });
      sinon.stub(p, "getOpenLibraryRecord").resolves({ key: "/books/OL1M" });
      sinon.spy(p, "_chaptersRender");
      await p._chapterInit();
      expect(p._chaptersRender.callCount).toBe(0);
    });

    test("renders if valid TOC on open library", async () => {
      const fakeBR = {
        options: { vars: {} },
        bind: sinon.stub(),
      };
      const p = new ChaptersPlugin(fakeBR);
      sinon.stub(p, "getOpenLibraryRecord").resolves({
        "title": "The Adventures of Sherlock Holmes",
        "table_of_contents": deepCopy(SAMPLE_TOC_OPTION),
        "ocaid": "adventureofsherl0000unse",
      });
      sinon.stub(p, "_chaptersRender");
      await p._chapterInit();
      expect(p._chaptersRender.callCount).toBe(1);
    });

    test("does not fetch open library record if table of contents in options", async () => {
      const fakeBR = {
        options: {
          table_of_contents: deepCopy(SAMPLE_TOC_UNDEF),
        },
        bind: sinon.stub(),
      };
      const p = new ChaptersPlugin(fakeBR);
      sinon.stub(p, "getOpenLibraryRecord");
      sinon.stub(p, "_chaptersRender");
      await p._chapterInit();
      expect(p.getOpenLibraryRecord.callCount).toBe(0);
      expect(p._chaptersRender.callCount).toBe(1);
    });

    test("converts leafs and pagenums to page index", async () => {
      const table_of_contents = deepCopy(SAMPLE_TOC_UNDEF);
      table_of_contents[0].leaf = 0;
      table_of_contents[1].pagenum = '17';
      const fakeBR = {
        options: {
          table_of_contents,
        },
        bind: sinon.stub(),
        book: {
          leafNumToIndex: (leaf) => leaf + 1,
          getPageIndex: (str) => parseFloat(str),
        },
      };
      const p = new ChaptersPlugin(fakeBR);
      sinon.stub(p, "_chaptersRender");
      await p._chapterInit();
      expect(p._chaptersRender.callCount).toBe(1);
      expect(p._tocEntries[0].pageIndex).toBe(1);
      expect(p._tocEntries[1].pageIndex).toBe(17);
    });
  });

  describe('_chaptersRender', () => {
    test('renders markers and panel', () => {
      const fakeBR = {
        shell: {
          menuProviders: {},
          addMenuShortcut: sinon.stub(),
          updateMenuContents: sinon.stub(),
        },
      };
      const p = new ChaptersPlugin(fakeBR);
      sinon.stub(p, '_chaptersRenderMarker');
      p._tocEntries = deepCopy(SAMPLE_TOC);
      p._chaptersRender();
      expect(fakeBR.shell.menuProviders['chapters']).toBeTruthy();
      expect(fakeBR.shell.addMenuShortcut.callCount).toBe(1);
      expect(fakeBR.shell.updateMenuContents.callCount).toBe(1);
      expect(p._chaptersRenderMarker.callCount).toBeGreaterThan(1);
    });
  });

  describe('_chaptersUpdateCurrent', () => {
    test('highlights the current chapter', () => {
      const fakeBR = {
        mode: 2,
        firstIndex: 16,
        displayedIndices: [16, 17],
      };
      const p = new ChaptersPlugin(fakeBR);
      p._tocEntries = deepCopy(SAMPLE_TOC);
      p._chaptersPanel = {
        currentChapter: null,
      };
      p._chaptersUpdateCurrent();
      expect(p._chaptersPanel.currentChapter).toEqual(SAMPLE_TOC[1]);

      fakeBR.mode = 1;
      p._chaptersUpdateCurrent();
      expect(p._chaptersPanel.currentChapter).toEqual(SAMPLE_TOC[0]);

      fakeBR.firstIndex = 0;
      p._chaptersUpdateCurrent();
      expect(p._chaptersPanel.currentChapter).toBeUndefined();
    });
  });
});
