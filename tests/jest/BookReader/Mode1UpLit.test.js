import { BookModel } from '@/src/BookReader/BookModel.js';
import { Mode1UpLit } from '@/src/BookReader/Mode1UpLit.js';

/** @type {import('@/src/BookReader/options.js').BookReaderOptions['data']} */
const SAMPLE_DATA = [
  [
    { width: 123, height: 123, uri: 'https://archive.org/image0.jpg', pageNum: '1' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image1.jpg', pageNum: '2' },
    { width: 123, height: 123, uri: 'https://archive.org/image2.jpg', pageNum: '3' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image3.jpg', pageNum: '4' },
    { width: 123, height: 123, uri: 'https://archive.org/image4.jpg', pageNum: '5' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image5.jpg', pageNum: '6' },
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

describe('pageTops', () => {
  afterEach(() => document.body.innerHTML = '');

  test('Works with empty book', async () => {
    const br = make_dummy_br({ data: [] });
    const book = new BookModel(br);
    const mode = new Mode1UpLit(book, br);
    document.body.appendChild(mode);
    mode.requestUpdate();
    await mode.updateComplete;
    expect(mode.pageTops).toEqual({});
  });

  test('Iterates all pages', async () => {
    const br = make_dummy_br({ data: SAMPLE_DATA });
    const book = new BookModel(br);
    const mode = new Mode1UpLit(book, br);
    document.body.appendChild(mode);
    await mode.requestUpdate();
    expect(Object.values(mode.pageTops)).toHaveLength(6);
  });

  test('Computes tops', async () => {
    const br = make_dummy_br({ data: SAMPLE_DATA });
    const book = new BookModel(br);
    const mode = new Mode1UpLit(book, br);
    document.body.appendChild(mode);
    await mode.requestUpdate();
    const tops = Object.entries(mode.pageTops);
    expect(tops.map(([index, top]) => [index, top.toFixed(1)])).toEqual([
      // Recall these are in inches
      ['0', '0.2'],
      ['1', '0.6'],
      ['2', '1.1'],
      ['3', '1.5'],
      ['4', '2.0'],
      ['5', '2.4'],
    ]);
  });
});

describe('advanceOneScreen', () => {
  function makeMode(heights, { unviewable = [], pageProgression = 'lr' } = {}) {
    const br = make_dummy_br({
      data: heights.map((height, index) => [{
        width: 800, height, ppi: 100, viewable: !unviewable.includes(index),
      }]),
      options: { pageProgression },
      currentIndex: jest.fn(() => 0),
      jumpToIndex: jest.fn(index => mode.jumpToIndex(index)),
    });
    const mode = new Mode1UpLit(new BookModel(br), br);
    mode.coordSpace.screenDPI = 100;
    mode.updatePages();
    mode.pageTops = mode.computePageTops(mode.pages, mode.SPACING_IN);
    const world = document.createElement('div');
    Object.defineProperties(mode, {
      clientHeight: { value: 300, configurable: true },
      scrollHeight: { get: () => Math.max(
        300,
        Math.round(mode.coordSpace.worldUnitsToVisiblePixels(mode.computeWorldDimensions().height)),
        Math.floor((parseFloat(world.style.minHeight) || 0) * mode.scale),
      ) },
      $world: { value: world },
    });
    // Simulate browser rounding and scroll-range clamping.
    let scrollTop = 0;
    Object.defineProperty(mode, 'scrollTop', {
      get: () => scrollTop,
      set: top => { scrollTop = Math.round(Math.max(0, Math.min(top, mode.scrollHeight - mode.clientHeight))); },
    });
    mode.scrollTo = jest.fn(({ top }) => { mode.scrollTop = top; });
    mode.jumpToIndex(0);
    return mode;
  }

  test('advances by the viewport height and clamps fractional zoom before jumping', () => {
    const mode = makeMode([750, 530]);
    mode.scale = 1.137;
    mode.jumpToIndex(0);
    mode.scrollLeft = 75;
    const start = mode.scrollTop;

    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(start + 300);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(Math.round(770 * 1.137 - 300));
    expect(mode.br.jumpToIndex).not.toHaveBeenCalled();

    mode.advanceOneScreen();
    expect(mode.br.jumpToIndex).toHaveBeenCalledWith(1, { noAnimate: true, ariaLive: true });
    expect(mode.scrollTop).toBe(Math.round(780 * 1.137));
    expect(mode.scrollLeft).toBe(75);
    expect(mode.scale).toBe(1.137);
  });

  test('uses the live viewport on rapid activation across different page heights', () => {
    const mode = makeMode([650, 210, 880, 700]);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(310);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(370);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(680);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(910);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(1210);
    expect(mode.br.jumpToIndex.mock.calls.map(([index]) => index)).toEqual([1, 2]);
  });

  test('reuses the page alignment if the next page already has the current index', () => {
    const mode = makeMode([650, 320]);
    mode.br.currentIndex.mockReturnValue(1);
    mode.scrollTop = 370;
    mode.style.scrollBehavior = 'smooth';
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(680);
    expect(mode.style.scrollBehavior).toBe('');
    expect(mode.br.jumpToIndex).not.toHaveBeenCalled();
  });

  test('aligns a short final page and stops there', () => {
    const mode = makeMode([650, 90]);
    mode.scrollTop = 370;
    expect(mode.scrollHeight - mode.clientHeight).toBeLessThan(680);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(680);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(680);
    expect(mode.br.jumpToIndex).toHaveBeenCalledTimes(1);
  });

  test('shows the bottom of a tall final page and stops without wrapping', () => {
    const mode = makeMode([650]);
    mode.advanceOneScreen();
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(370);
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(370);
    expect(mode.br.jumpToIndex).not.toHaveBeenCalled();
  });

  test('follows reading order and advances past a grouped preview in an RTL book', () => {
    const mode = makeMode([300, 220, 450, 800], { unviewable: [1, 2], pageProgression: 'rl' });
    mode.scrollTop = 20;
    mode.advanceOneScreen();
    mode.advanceOneScreen();
    expect(mode.br.jumpToIndex.mock.calls.map(([index]) => index)).toEqual([1, 3]);
  });

  test('uses the new viewport height after resizing', () => {
    const mode = makeMode([1000]);
    Object.defineProperty(mode, 'clientHeight', { value: 450 });
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(460);
  });

  test('ignores activation while a pinch is active or a zoom frame is pending', () => {
    const mode = makeMode([1000]);
    mode.smoothZoomer.pinching = true;
    mode.advanceOneScreen();
    mode.smoothZoomer.pinching = false;
    mode.smoothZoomer.pinchMoveFrame = 1;
    mode.advanceOneScreen();
    expect(mode.scrollTop).toBe(10);
    expect(mode.scrollTo).not.toHaveBeenCalled();
  });
});
