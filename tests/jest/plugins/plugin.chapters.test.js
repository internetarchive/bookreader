import sinon from "sinon";

import BookReader from "@/src/BookReader.js";
import "@/src/plugins/plugin.chapters.js";
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

describe("BRChaptersPlugin", () => {
  beforeEach(() => {
    sinon.stub(BookModel.prototype, "getPageIndex").callsFake((str) =>
      parseFloat(str)
    );
  });

  describe("_chaptersInit", () => {
    test("does not render when no open library record", async () => {
      const fakeBR = {
        options: {},
        getOpenLibraryRecord: async () => null,
        _chaptersRender: sinon.stub(),
      };
      await BookReader.prototype._chapterInit.call(fakeBR);
      expect(fakeBR._chaptersRender.callCount).toBe(0);
    });

    test("does not render when open library record with no TOC", async () => {
      const fakeBR = {
        options: {},
        getOpenLibraryRecord: async () => ({ key: "/books/OL1M" }),
        _chaptersRender: sinon.stub(),
      };
      await BookReader.prototype._chapterInit.call(fakeBR);
      expect(fakeBR._chaptersRender.callCount).toBe(0);
    });

    test("renders if valid TOC on open library", async () => {
      const fakeBR = {
        options: {},
        bind: sinon.stub(),
        book: {
          getPageIndex: (str) => parseFloat(str),
        },
        getOpenLibraryRecord: async () => ({
          "title": "The Adventures of Sherlock Holmes",
          "table_of_contents": deepCopy(SAMPLE_TOC_OPTION),
          "ocaid": "adventureofsherl0000unse",
        }),
        _chaptersRender: sinon.stub(),
      };
      await BookReader.prototype._chapterInit.call(fakeBR);
      expect(fakeBR._chaptersRender.callCount).toBe(1);
    });

    test("does not fetch open library record if table of contents in options", async () => {
      const fakeBR = {
        options: {
          table_of_contents: deepCopy(SAMPLE_TOC_UNDEF),
        },
        bind: sinon.stub(),
        getOpenLibraryRecord: sinon.stub(),
        _chaptersRender: sinon.stub(),
      };
      await BookReader.prototype._chapterInit.call(fakeBR);
      expect(fakeBR.getOpenLibraryRecord.callCount).toBe(0);
      expect(fakeBR._chaptersRender.callCount).toBe(1);
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
        _chaptersRender: sinon.stub(),
      };
      await BookReader.prototype._chapterInit.call(fakeBR);
      expect(fakeBR._chaptersRender.callCount).toBe(1);
      expect(fakeBR._tocEntries[0].pageIndex).toBe(1);
      expect(fakeBR._tocEntries[1].pageIndex).toBe(17);
    });
  });

  describe('_chaptersRender', () => {
    test('renders markers and panel', () => {
      const fakeBR = {
        _tocEntries: SAMPLE_TOC,
        _chaptersRenderMarker: sinon.stub(),
        shell: {
          menuProviders: {},
          updateMenuContents: sinon.stub(),
        }
      };
      BookReader.prototype._chaptersRender.call(fakeBR);
      expect(fakeBR.shell.menuProviders['chapters']).toBeTruthy();
      expect(fakeBR.shell.updateMenuContents.callCount).toBe(1);
      expect(fakeBR._chaptersRenderMarker.callCount).toBeGreaterThan(1);
    });
  });

  describe('_chaptersUpdateCurrent', () => {
    test('highlights the current chapter', () => {
      const fakeBR = {
        mode: 2,
        firstIndex: 16,
        displayedIndices: [16, 17],
        _tocEntries: SAMPLE_TOC,
        _chaptersPanel: {
          currentChapter: null,
        }
      };
      BookReader.prototype._chaptersUpdateCurrent.call(fakeBR);
      expect(fakeBR._chaptersPanel.currentChapter).toEqual(SAMPLE_TOC[1]);

      fakeBR.mode = 1;
      BookReader.prototype._chaptersUpdateCurrent.call(fakeBR);
      expect(fakeBR._chaptersPanel.currentChapter).toEqual(SAMPLE_TOC[0]);

      fakeBR.firstIndex = 0;
      BookReader.prototype._chaptersUpdateCurrent.call(fakeBR);
      expect(fakeBR._chaptersPanel.currentChapter).toBeUndefined();
    });
  });
});
