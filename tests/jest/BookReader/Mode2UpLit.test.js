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
    leafEdgesLeftStart: -0.246,
    leafEdgesLeftMainWidth: 0,
    leafEdgesLeftMovingStart: -0.246,
    leafEdgesLeftMovingWidth: 0,
    leafEdgesLeftEnd: -0.246,
    leafEdgesLeftFullWidth: 0,
    pageLeftStart: -0.246,
    pageLeftWidth: 0.246,
    pageLeftEnd: 0,
    gutter: 0,
    pageRightStart: 0,
    pageRightWidth: 0.246,
    pageRightEnd: 0.246,
    leafEdgesRightStart: 0.246,
    leafEdgesRightMovingWidth: 0,
    leafEdgesRightMainStart: 0.246,
    leafEdgesRightMainWidth: 0.006,
    leafEdgesRightEnd: 0.252,
    leafEdgesRightFullWidth: 0.006,
    spreadWidth: 0.492,
    bookWidth: 0.498,
  };
  const SPREAD_EXPECTED = {
    leafEdgesLeftStart: -0.246,
    leafEdgesLeftMainWidth: 0.002,
    leafEdgesLeftMovingStart: -0.244,
    leafEdgesLeftMovingWidth: 0,
    leafEdgesLeftEnd: -0.244,
    leafEdgesLeftFullWidth: 0.002,
    pageLeftStart: -0.244,
    pageLeftWidth: 0.246,
    pageLeftEnd: 0.002,
    gutter: 0.002,
    pageRightStart: 0.002,
    pageRightWidth: 0.246,
    pageRightEnd: 0.248,
    leafEdgesRightStart: 0.248,
    leafEdgesRightMovingWidth: 0,
    leafEdgesRightMainStart: 0.248,
    leafEdgesRightMainWidth: 0.004,
    leafEdgesRightEnd: 0.252,
    leafEdgesRightFullWidth: 0.004,
    spreadWidth: 0.492,
    bookWidth: 0.498,
  };
  const RIGHT_COVER_EXPECTED = {
    leafEdgesLeftStart: -0.242,
    leafEdgesLeftMainWidth: 0.006,
    leafEdgesLeftMovingStart: -0.236,
    leafEdgesLeftMovingWidth: 0,
    leafEdgesLeftEnd: -0.236,
    leafEdgesLeftFullWidth: 0.006,
    pageLeftStart: -0.236,
    pageLeftWidth: 0.246,
    pageLeftEnd: 0.01,
    gutter: 0.01,
    pageRightStart: 0.01,
    pageRightWidth: 0,
    pageRightEnd: 0.01,
    leafEdgesRightStart: 0.01,
    leafEdgesRightMovingWidth: 0,
    leafEdgesRightMainStart: 0.01,
    leafEdgesRightMainWidth: 0,
    leafEdgesRightEnd: 0.01,
    leafEdgesRightFullWidth: 0,
    spreadWidth: 0.246,
    bookWidth: 0.252,
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
