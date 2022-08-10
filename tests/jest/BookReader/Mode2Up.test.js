
import sinon from 'sinon';
import { deepCopy } from '../utils.js';
import BookReader from '@/src/BookReader.js';
/** @typedef {import('@/src/BookReader/options.js').BookReaderOptions} BookReaderOptions */

beforeAll(() => {
  global.alert = jest.fn();
});
afterEach(() => {
  jest.restoreAllMocks();
  sinon.restore();
});

/** @type {BookReaderOptions['data']} */
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


describe('zoom', () => {
  const br = new BookReader({ data: SAMPLE_DATA });
  br.init();

  const stopAnim = sinon.spy(br, 'stopFlipAnimations');
  const resizeSpread = sinon.spy(br._modes.mode2Up, 'resizeSpread');
  br._modes.mode2Up.zoom('in');

  test('stops animations when zooming', () => {
    expect(stopAnim.callCount).toBe(1);
  });
  test('always redraws when zooming', () => {
    expect(resizeSpread.callCount).toBe(0);
  });
});

describe('page flip directions', () => {
  test('animates the left page in the correct direction', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();

    const fake = sinon.fake();
    const fakeAnimWithCB = sinon.fake.yields();
    const fakeAnim = sinon.fake((...args) => 
      typeof args[args.length - 1] === 'function' ? fakeAnimWithCB(...args) : fake
    );
    sinon.replace(jQuery.prototype, 'animate', fakeAnim);

    const fakeCSS = sinon.spy(jQuery.prototype, 'css');

    br.next();
    
    expect(fakeAnimWithCB.callCount).toBe(2);
    // Find the call to .css() immediately preceding the second animation with a callback (i.e., the left page animation)
    const preSecondAnimCssCallIndex = fakeCSS.getCalls().findIndex(call => call.calledAfter(fakeAnimWithCB.getCall(1))) - 1;
    expect(fakeCSS.getCall(preSecondAnimCssCallIndex).args[0].left).toBe('');
  });
});

describe('prefetch', () => {
  test('loads nearby pages', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    const mode2Up = br._modes.mode2Up;
    br.init();
    mode2Up.prefetch();
    expect(Object.keys(mode2Up.pageContainers).length).toBeGreaterThan(2);
  });

  test('works when at end of book', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    const mode2Up = br._modes.mode2Up;
    br.init();
    br.jumpToIndex(-1);
    mode2Up.prefetch();
    expect(Object.keys(mode2Up.pageContainers).length).toBeGreaterThan(2);
  });

  test('skips consecutive unviewables', () => {
    const data = deepCopy(SAMPLE_DATA);
    data[1].forEach(page => page.viewable = false);
    const br = new BookReader({ data });
    const mode2Up = br._modes.mode2Up;
    br.init();
    mode2Up.prefetch();
    expect(mode2Up.pageContainers).not.toContain(2);
  });
});

describe('draw 2up leaves', () => {
  test('calls `drawLeafs` on init as default', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    const drawLeafs = sinon.spy(br._modes.mode2Up, 'drawLeafs');

    br.init();
    expect(drawLeafs.callCount).toBe(1);
  });

  test('sets `this.displayedIndices`', () => {
    const extremelyWrongValueForDisplayedIndices = null;
    const br = new BookReader({ data: SAMPLE_DATA });

    br.init();
    br.displayedIndices = extremelyWrongValueForDisplayedIndices;
    expect(br.displayedIndices).toBe(extremelyWrongValueForDisplayedIndices);

    br._modes.mode2Up.drawLeafs();

    expect(br.displayedIndices).not.toBe(extremelyWrongValueForDisplayedIndices);
    expect(br.displayedIndices.length).toBe(2); // is array
    expect(br.displayedIndices).toEqual([-1, 0]); // default to starting index on right, placeholder for left
  });
});

describe('resizeSpread', () => {
  test('only resizes spread', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    const resizeBRcontainer = sinon.spy(br, 'resizeBRcontainer');
    const calculateSpreadSize = sinon.spy(br._modes.mode2Up, 'calculateSpreadSize');
    const drawLeafs = sinon.spy(br._modes.mode2Up, 'drawLeafs');
    const centerView = sinon.spy(br._modes.mode2Up, 'centerView');

    br._modes.mode2Up.resizeSpread();
    expect(drawLeafs.callCount).toBe(0);  // no draw
    expect(resizeBRcontainer.callCount).toBe(1);
    expect(calculateSpreadSize.callCount).toBe(1);
    expect(centerView.callCount).toBe(1);
  });
});

describe('2up Container sizing', () => {
  test('baseLeafCss', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    br.calculateSpreadSize();
    expect(Object.keys(br._modes.mode2Up.baseLeafCss)).toEqual(['position', 'right', 'top', 'zIndex']);
  });
  test('heightCss', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    br.calculateSpreadSize();
    const heightStub = 1000;
    br.twoPage.height = heightStub;
    expect(Object.keys(br._modes.mode2Up.heightCss)).toEqual(['height']);
    expect(br._modes.mode2Up.heightCss).toEqual({height: `${heightStub}px`});
  });
  describe('left side', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    br.calculateSpreadSize();

    test('leftLeafCss', () => {
      expect(Object.keys(br._modes.mode2Up.leftLeafCss)).toEqual([
        'position',
        'right',
        'top',
        'zIndex',
        'height',
        'left',
        'width',
      ]);
    });
    test('leafEdgeLCss', () => {
      expect(Object.keys(br._modes.mode2Up.leafEdgeLCss)).toEqual([
        'height',
        'width',
        'left',
        'top',
        'border'
      ]);
    });
  });
  describe('right side', () => {
    const br = new BookReader({ data: SAMPLE_DATA });
    br.init();
    br.calculateSpreadSize();

    test('rightLeafCss', () => {
      expect(Object.keys(br._modes.mode2Up.rightLeafCss)).toEqual([
        'position',
        'right',
        'top',
        'zIndex',
        'height',
        'left',
        'width',
      ]);
    });
    test('leafEdgeRCss', () => {
      expect(Object.keys(br._modes.mode2Up.leafEdgeRCss)).toEqual([
        'height',
        'width',
        'left',
        'top',
        'border'
      ]);
    });
  });
  describe('full width container, overlay + spine', () => {
    test('mainContainerCss', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.calculateSpreadSize();

      expect(Object.keys(br._modes.mode2Up.mainContainerCss)).toEqual(['height', 'width', 'position']);
    });
    test('spreadCoverCss', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.calculateSpreadSize();
      expect(Object.keys(br._modes.mode2Up.spreadCoverCss)).toEqual(['width', 'height', 'visibility']);
    });
    test('spineCss', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      br.init();
      br.calculateSpreadSize();
      expect(Object.keys(br._modes.mode2Up.spineCss)).toEqual(['width', 'height', 'left', 'top']);
    });
  });
});

describe('prepareTwoPageView', () => {
  describe('drawing spread', () => {
    test('always draws new spread if `drawNewSpread` is true ', () => {
      const br = new BookReader({ data: SAMPLE_DATA });
      const mode2Up = br._modes.mode2Up;
      br.init();
      const drawLeafs = sinon.spy(mode2Up, 'drawLeafs');
      const resizeSpread = sinon.spy(mode2Up, 'resizeSpread');
      const calculateSpreadSize = sinon.spy(mode2Up, 'calculateSpreadSize');
      const prunePageContainers = sinon.spy(mode2Up, 'prunePageContainers');
      const prefetch = sinon.spy(mode2Up, 'prefetch');
      const centerView = sinon.spy(mode2Up, 'centerView');
      const preparePopUp = sinon.spy(mode2Up, 'preparePopUp');
      const updateBrClasses = sinon.spy(br, 'updateBrClasses');

      br.prepareTwoPageView(undefined, undefined, true);
      expect(prefetch.callCount).toBe(1);

      expect(resizeSpread.callCount).toBe(0);
      expect(drawLeafs.callCount).toBe(1);
      expect(calculateSpreadSize.callCount).toBe(1);
      expect(prunePageContainers.callCount).toBe(1);
      expect(centerView.callCount).toBe(1);
      expect(preparePopUp.callCount).toBe(1);
      expect(updateBrClasses.callCount).toBe(1);
    });
  });
});

test('uses ImageCache', () => {
  const br = new BookReader({ data: SAMPLE_DATA });
  br.init();
  expect(Object.keys(br.imageCache.cache).length).toBeGreaterThan(2);
});
