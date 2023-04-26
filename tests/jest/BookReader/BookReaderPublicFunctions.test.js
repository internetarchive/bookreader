import BookReader from '@/src/BookReader';
import { sleep } from '@/src/BookReader/utils.js';
import sinon from 'sinon';

beforeAll(() => {
  global.alert = sinon.fake();
});
afterEach(() => {
  sinon.restore();
});

describe('BookReader.prototype.toggleFullscreen', ()  => {
  test('uses `isFullscreen` to check fullscreen state', () => {
    const isFSmock = sinon.fake();
    // isFSmock.mockReturnValueOnce(false);
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.enterFullscreen = sinon.fake();
    br.isFullscreen = isFSmock;

    br.toggleFullscreen();
    expect(br.isFullscreen.callCount).toEqual(1);
  });

  test('will always emit an event', async () => {
    const br = new BookReader();
    br.mode = br.constMode2up;
    br.trigger = sinon.fake();
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    br.jumpToIndex = sinon.fake();
    br.refs.$brContainer = {
      css: sinon.fake(),
      animate: (options, speed, style, callback) => callback()
    };
    br.refs.$br = {
      updateBrClasses: sinon.fake(),
      removeClass: sinon.fake(),
      addClass: sinon.fake(),
      css: sinon.fake(),
      animate: (options, speed, style, callback) => callback()
    };

    await br.toggleFullscreen();
    expect(br.trigger.callCount).toBeGreaterThan(0);
  });

  test('will start with opening fullscreen', () => {
    const br = new BookReader();
    br.mode = br.constMode2up;
    br.enterFullscreen = sinon.fake();

    br.toggleFullscreen();
    expect(br.enterFullscreen.callCount).toEqual(1);
  });

  test('will close fullscreen if BookReader is in fullscreen', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.exitFullScreen = sinon.fake();
    br.isFullscreenActive = true;

    br.toggleFullscreen();
    expect(br.exitFullScreen.callCount).toEqual(1);
  });
});

describe('BookReader.prototype.enterFullscreen', ()  => {
  test('will bind `_fullscreenCloseHandler` by default', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    br.refs.$br = {
      css: sinon.fake(),
      animate: sinon.fake(),
      addClass: sinon.fake(),
    };
    expect(br._fullscreenCloseHandler).toBeUndefined();

    br.enterFullscreen();
    expect(br._fullscreenCloseHandler).toBeDefined();
  });

  test('fires certain events when called', async () => {
    const br = new BookReader();
    br.mode = br.constMode2up;
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    br.trigger = sinon.fake();
    br.resize = sinon.fake();
    br.jumpToIndex = sinon.fake();
    br.refs.$br = {
      addClass: sinon.fake(),
      removeClass: sinon.fake(),
    };
    br.refs.$brContainer = {
      css: sinon.fake(),
      animate: (options, speed, style, callback) => callback(),
    };

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
    const br = new BookReader();
    br.mode = br.constMode2up;
    br.switchMode = sinon.fake();
    br.updateBrClasses = sinon.fake();
    br.trigger = sinon.fake();
    br.resize = sinon.fake();
    br.refs.$br = {
      addClass: sinon.fake(),
      removeClass: sinon.fake(),
    };
    br.refs.$brContainer = {
      css: sinon.fake(),
      animate: (options, speed, style, callback) => callback()
    };
    await br.exitFullScreen();
    expect(br.switchMode.callCount).toEqual(1);
    expect(br.updateBrClasses.callCount).toEqual(1);
    expect(br.trigger.callCount).toEqual(2); // fragmentChange, fullscreenToggled
    expect(br.resize.callCount).toEqual(1);
  });
});

describe('BookReader.prototype.trigger', () => {
  test('fires custom event', () => {
    const br = new BookReader();
    global.br = br;
    global.dispatchEvent = sinon.fake();

    const props = {bar: 1};
    br.trigger('foo', props);
    expect(global.dispatchEvent.callCount).toBe(1);
  });
});

describe('`BookReader.prototype.prev`', () => {
  let br;
  let flipAnimationStub;
  beforeEach(() => {
    br = new BookReader();
    global.br = br;
    br.trigger = sinon.fake();
    br.jumpToIndex = sinon.fake();
    flipAnimationStub = sinon.stub(br._modes.mode2Up.mode2UpLit, 'flipAnimation');
  });

  afterEach(() => {
    sinon.restore();
  });

  test('does not take action if user is on front page', () => {
    br.firstIndex = 0;
    br.prev();
    expect(br.trigger.callCount).toBe(0);
    expect(flipAnimationStub.callCount).toBe(0);
    expect(br.jumpToIndex.callCount).toBe(0);
  });

  describe('2up mode', () => {
    test('fires event and turns the page', () => {
      br.firstIndex = 10;
      br.mode = br.constMode2up;
      br.prev();
      expect(br.jumpToIndex.callCount).toBe(0); // <--  does not get called
      expect(br.trigger.callCount).toBe(1);
      expect(flipAnimationStub.callCount).toBe(1);
    });
  });

  describe('non 2up mode', () => {
    test('jumps to provided index', () => {
      br.firstIndex = 100;
      br.mode = br.constMode1up;
      br.prev();
      expect(br.jumpToIndex.callCount).toBe(1);  // <--  gets called
      expect(flipAnimationStub.callCount).toBe(0); // <-- gets called by `jumpToIndex` internally
    });
  });
});

