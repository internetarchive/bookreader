import BookReader from '@/src/BookReader.js';
import { sleep } from '@/src/BookReader/utils.js';
import sinon from 'sinon';

beforeAll(() => {
  global.alert = sinon.fake();
});

/** @type {BookReader} */
let br = null;

beforeEach(() => {
  br = new BookReader();
  br.refs.$br = $('<div></div>');
  br.refs.$brContainer = $('<div></div>');
});

afterEach(() => {
  sinon.restore();
});

describe('BookReader.prototype.toggleFullscreen', () => {
  test('uses `isFullscreen` to check fullscreen state', () => {
    const isFSmock = sinon.fake();
    // isFSmock.mockReturnValueOnce(false);
    br.mode = br.constMode1up;
    br.enterFullscreen = sinon.fake();
    br.isFullscreen = isFSmock;

    br.toggleFullscreen();
    expect(br.isFullscreen.callCount).toEqual(1);
  });

  test('will always emit an event', async () => {
    br.mode = br.constMode2up;
    br.trigger = sinon.fake();
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    br.jumpToIndex = sinon.fake();

    await br.toggleFullscreen();
    expect(br.trigger.callCount).toBeGreaterThan(0);
  });

  test('will start with opening fullscreen', () => {
    br.mode = br.constMode2up;
    br.enterFullscreen = sinon.fake();

    br.toggleFullscreen();
    expect(br.enterFullscreen.callCount).toEqual(1);
  });

  test('will close fullscreen if BookReader is in fullscreen', () => {
    br.mode = br.constMode1up;
    br.exitFullScreen = sinon.fake();
    br.isFullscreenActive = true;

    br.toggleFullscreen();
    expect(br.exitFullScreen.callCount).toEqual(1);
  });
});

describe('BookReader.prototype.enterFullscreen', () => {
  test('will bind `_fullscreenCloseHandler` by default', () => {
    br.mode = br.constMode1up;
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    expect(br._fullscreenCloseHandler).toBeUndefined();

    br.enterFullscreen();
    expect(br._fullscreenCloseHandler).toBeDefined();
  });

  test('fires certain events when called', async () => {
    br.mode = br.constMode2up;
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    br.trigger = sinon.fake();
    br.resize = sinon.fake();
    br.jumpToIndex = sinon.fake();

    await br.enterFullscreen();
    expect(br.switchMode.callCount).toEqual(1);
    expect(br.updateBrClasses.callCount).toEqual(1);
    expect(br.trigger.callCount).toEqual(2); // fragmentChange, fullscreenToggled
    expect(br.jumpToIndex.callCount).toEqual(1);

    await sleep(0);
    expect(br.resize.callCount).toEqual(1);
  });
});

describe('BookReader.prototype.exitFullScreen', () => {
  test('fires certain events when called', async () => {
    br.mode = br.constMode2up;
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    br.trigger = sinon.fake();
    br.resize = sinon.fake();

    await br.exitFullScreen();
    expect(br.switchMode.callCount).toEqual(1);
    expect(br.updateBrClasses.callCount).toEqual(1);
    expect(br.trigger.callCount).toEqual(2); // fragmentChange, fullscreenToggled
    expect(br.resize.callCount).toEqual(1);
  });
});

describe('BookReader.prototype.trigger', () => {
  test('fires custom event', () => {
    global.br = br;
    global.dispatchEvent = sinon.fake();

    const props = { bar: 1 };
    br.trigger('foo', props);
    expect(global.dispatchEvent.callCount).toBe(1);
  });
});

describe('`BookReader.prototype.prev`', () => {
  /** @type {BookReader} */
  let br;
  beforeEach(() => {
    br = makeFakeBr();
    global.br = br;
    br.trigger = sinon.fake();
  });

  afterEach(() => {
    sinon.restore();
  });

  test('does not take action if user is on front page', () => {
    br.firstIndex = 0;
    br.prev();
    expect(br.trigger.callCount).toBe(0);
    expect(br.activeMode.jumpToIndex.callCount).toBe(0);
  });

  test('2up mode fires event and turns the page', () => {
    br.firstIndex = 10;
    br.mode = br.constMode2up;
    br.prev();
    expect(br.activeMode.jumpToIndex.callCount).toBe(1);
    expect(br.trigger.callCount).toBe(2);
  });

  test('1up mode fires event and jumps to provided index', () => {
    br.firstIndex = 100;
    br.mode = br.constMode1up;
    br.prev();
    expect(br.activeMode.jumpToIndex.callCount).toBe(1);
  });
});

describe('`BookReader.prototype.jumpToIndex`', () => {
  test('Jumping into an unviewables range will go to start of range', () => {
    const br = makeFakeBr();
    br.jumpToIndex(3, { noAnimate: true });
    expect(br._modes.mode2Up.jumpToIndex.callCount).toBe(1);
    expect(br._modes.mode2Up.jumpToIndex.args[0][0]).toBe(1);
  });

  test('Trying to jump into unviewables range while in that range, will jump forward', () => {
    const br = makeFakeBr();
    br.displayedIndices = [1, 2];
    br.jumpToIndex(3, { noAnimate: true });
    expect(br._modes.mode2Up.jumpToIndex.callCount).toBe(1);
    expect(br._modes.mode2Up.jumpToIndex.args[0][0]).toBe(5);
  });

  test('Trying to jump into unviewables range while in that range, will do nothing if cannot jump forward', () => {
    const br = makeFakeBr({
      data: [
        [
          { index: 0, viewable: true },
        ],
        [
          { index: 1, viewable: false },
          { index: 2, viewable: false },
        ],
        [
          { index: 3, viewable: false },
          { index: 4, viewable: false },
        ],
      ],
    });
    br.displayedIndices = [1, 2];
    br.jumpToIndex(3, { noAnimate: true });
    expect(br._modes.mode2Up.jumpToIndex.callCount).toBe(0);
  });
});

/**
 * @param {Partial<BookReaderOptions>} overrides
 */
function makeFakeBr(overrides = {}) {
  const br = new BookReader({
    data: [
      [
        { index: 0, viewable: true },
      ],
      [
        { index: 1, viewable: false },
        { index: 2, viewable: false },
      ],
      [
        { index: 3, viewable: false },
        { index: 4, viewable: false },
      ],
      [
        { index: 5, viewable: true },
      ],
    ],
    ...overrides,
  });
  br.init();

  br._modes.mode2Up.jumpToIndex = sinon.fake();
  br._modes.mode1Up.jumpToIndex = sinon.fake();

  expect(br.firstIndex).toBe(0);
  expect(br.mode).toBe(br.constMode2up);

  return br;
}
