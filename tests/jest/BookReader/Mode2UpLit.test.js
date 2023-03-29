import sinon from "sinon";
import { BookModel } from "@/src/BookReader/BookModel.js";
import { Mode2UpLit } from "@/src/BookReader/Mode2UpLit.js";

/** @type {import('@/src/BookReader/options.js').BookReaderOptions['data']} */
const SAMPLE_DATA = [
  [
    {
      width: 123,
      height: 123,
      uri: "https://archive.org/image0.jpg",
      pageNum: "1",
    },
  ],
  [
    {
      width: 123,
      height: 123,
      uri: "https://archive.org/image1.jpg",
      pageNum: "2",
    },
    {
      width: 123,
      height: 123,
      uri: "https://archive.org/image2.jpg",
      pageNum: "3",
    },
  ],
  [
    {
      width: 123,
      height: 123,
      uri: "https://archive.org/image3.jpg",
      pageNum: "4",
    },
    {
      width: 123,
      height: 123,
      uri: "https://archive.org/image4.jpg",
      pageNum: "5",
    },
  ],
  [
    {
      width: 123,
      height: 123,
      uri: "https://archive.org/image5.jpg",
      pageNum: "6",
    },
  ],
];

function make_dummy_br(overrides = {}) {
  return Object.assign({
    updateFirstIndex() {},
    _components: {
      navbar: {
        updateNavIndexThrottled() {},
      },
    },
    data: [],
  }, overrides);
}

afterEach(() => {
  sinon.restore();
});

describe("computePageHeight", () => {
  test("Always returns the median", () => {
    const mode = new Mode2UpLit({
      getMedianPageSizeInches: () => ({ width: 100, height: 200 }),
    }, null);
    expect(mode.computePageHeight(null)).toEqual(200);
    expect(mode.computePageHeight({ widthInches: 300, heightInches: 400 }))
      .toEqual(200);
  });
});

describe("computePageWidth", () => {
  test("returns relative to pageHeight", () => {
    const mode = new Mode2UpLit(null, null);
    sinon.stub(mode, "computePageHeight").returns(6);

    expect(mode.computePageWidth({ widthInches: 2, heightInches: 6 })).toEqual(
      2,
    );
    expect(mode.computePageWidth({ widthInches: 3, heightInches: 6 })).toEqual(
      3,
    );
    expect(mode.computePageWidth({ widthInches: 2, heightInches: 4 })).toEqual(
      2 * 6 / 4,
    );
  });
});

describe("computePositions", () => {
  const LEFT_COVER_EXPECTED = {
    bookWidth: 0.498,
    leafEdgesLeftEnd: 0,
    leafEdgesLeftFullWidth: 0,
    leafEdgesLeftMainWidth: 0,
    leafEdgesLeftMovingStart: 0,
    leafEdgesLeftMovingWidth: 0,
    leafEdgesLeftStart: 0,
    leafEdgesRightEnd: 0.498,
    leafEdgesRightFullWidth: 0.006,
    leafEdgesRightMainStart: 0.492,
    leafEdgesRightMainWidth: 0.006,
    leafEdgesRightMovingWidth: 0,
    leafEdgesRightStart: 0.492,
    pageLeftEnd: 0.246,
    pageLeftStart: 0,
    pageLeftWidth: 0.246,
    pageRightEnd: 0.492,
    pageRightStart: 0.246,
    pageRightWidth: 0.246,
    spreadWidth: 0.492,
  };
  const RIGHT_COVER_EXPECTED = {
    bookWidth: 0.252,
    leafEdgesLeftEnd: 0.006,
    leafEdgesLeftFullWidth: 0.006,
    leafEdgesLeftMainWidth: 0.006,
    leafEdgesLeftMovingStart: 0.006,
    leafEdgesLeftMovingWidth: 0,
    leafEdgesLeftStart: 0,
    leafEdgesRightEnd: 0.252,
    leafEdgesRightFullWidth: 0,
    leafEdgesRightMainStart: 0.252,
    leafEdgesRightMainWidth: 0,
    leafEdgesRightMovingWidth: 0,
    leafEdgesRightStart: 0.252,
    pageLeftEnd: 0.252,
    pageLeftStart: 0.006,
    pageLeftWidth: 0.246,
    pageRightEnd: 0.252,
    pageRightStart: 0.252,
    pageRightWidth: 0,
    spreadWidth: 0.246,
  };
  const SPREAD_EXPECTED = {
    bookWidth: 0.498,
    leafEdgesLeftEnd: 0.002,
    leafEdgesLeftFullWidth: 0.002,
    leafEdgesLeftMainWidth: 0.002,
    leafEdgesLeftMovingStart: 0.002,
    leafEdgesLeftMovingWidth: 0,
    leafEdgesLeftStart: 0,
    leafEdgesRightEnd: 0.498,
    leafEdgesRightFullWidth: 0.004,
    leafEdgesRightMainStart: 0.494,
    leafEdgesRightMainWidth: 0.004,
    leafEdgesRightMovingWidth: 0,
    leafEdgesRightStart: 0.494,
    pageLeftEnd: 0.248,
    pageLeftStart: 0.002,
    pageLeftWidth: 0.246,
    pageRightEnd: 0.494,
    pageRightStart: 0.248,
    pageRightWidth: 0.246,
    spreadWidth: 0.492,
  };

  test("left cover page", () => {
    const br = make_dummy_br({ data: SAMPLE_DATA });
    const book = new BookModel(br);
    const mode = new Mode2UpLit(book, br);
    expect(mode.computePositions(null, book.getPage(0))).toEqual(LEFT_COVER_EXPECTED);
  });

  test("spread", () => {
    const br = make_dummy_br({ data: SAMPLE_DATA });
    const book = new BookModel(br);
    const mode = new Mode2UpLit(book, br);

    expect(mode.computePositions(book.getPage(1), book.getPage(2))).toEqual(SPREAD_EXPECTED);
  });

  test("right cover page", () => {
    const br = make_dummy_br({ data: SAMPLE_DATA });
    const book = new BookModel(br);
    const mode = new Mode2UpLit(book, br);

    expect(mode.computePositions(book.getPage(-1), null)).toEqual(RIGHT_COVER_EXPECTED);
  });
});
