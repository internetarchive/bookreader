import BookReader from '../../src/js/BookReader';

beforeAll(() => {
  global.alert = jest.fn();
})
afterEach(() => {
  jest.restoreAllMocks();
});

describe('BookReader.prototype.toggleFullscreen', ()  => {
  test('uses `isFullscreen` to check fullscreen state', () => {
    const isFSmock = jest.fn();
    isFSmock.mockReturnValueOnce(false);
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.enterFullscreen = jest.fn();
    br.isFullscreen = isFSmock;

    br.toggleFullscreen();
    expect(br.isFullscreen).toHaveBeenCalled();
    expect(br.isFullscreen).toHaveBeenCalled();
  });

  test('will always emit an event', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.enterFullscreen = jest.fn();
    br.trigger = jest.fn();
    br.refs.$brContainer = {
      css: jest.fn(),
      animate: jest.fn()
    }

    br.toggleFullscreen();
    expect(br.enterFullscreen).toHaveBeenCalled();
  });

  test('will start with opening fullscreen', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.enterFullscreen = jest.fn();

    br.toggleFullscreen();
    expect(br.enterFullscreen).toHaveBeenCalled();
  });

  test('will close fullscreen if BookReader is in fullscreen', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.exitFullScreen = jest.fn();
    br.isFullscreenActive = true;

    br.toggleFullscreen();
    expect(br.exitFullScreen).toHaveBeenCalled();
  });
});

describe('BookReader.prototype.enterFullscreen', ()  => {
  test('will bind `_fullscreenCloseHandler` by default', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.switchMode = jest.fn();
    br.updateBrClasses = jest.fn();
    br.refs.$brContainer = {
      css: jest.fn(),
      animate: jest.fn(),
    };
    expect(br._fullscreenCloseHandler).toBeUndefined();

    br.enterFullscreen();
    expect(br._fullscreenCloseHandler).toBeDefined();
  });

  test('fires certain events when called', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.switchMode = jest.fn();
    br.updateBrClasses = jest.fn();
    br.trigger = jest.fn();
    br.resize = jest.fn();
    br.jumpToIndex = jest.fn();
    const animateMock = (options, speed, style, callback) => {
      callback();
    };
    br.refs.$brContainer = {
      css: jest.fn(),
      animate: animateMock,
    };

    br.enterFullscreen();
    expect(br.switchMode).toHaveBeenCalledTimes(1);
    expect(br.updateBrClasses).toHaveBeenCalledTimes(1);
    expect(br.trigger).toHaveBeenCalledTimes(1);
    expect(br.resize).toHaveBeenCalledTimes(1);
    expect(br.jumpToIndex).toHaveBeenCalledTimes(1);
  });
});

describe('BookReader.prototype.exitFullScreen', () => {
  test('fires certain events when called', () => {
    const br = new BookReader();
    br.mode = br.constMode1up;
    br.switchMode = jest.fn();
    br.updateBrClasses = jest.fn();
    br.trigger = jest.fn();
    br.resize = jest.fn();
    br.refs.$brContainer = {
      css: jest.fn(),
      animate: jest.fn(),
    };

    br.exitFullScreen();
    expect(br.switchMode).toHaveBeenCalledTimes(1);
    expect(br.updateBrClasses).toHaveBeenCalledTimes(1);
    expect(br.trigger).toHaveBeenCalledTimes(1);
    expect(br.resize).toHaveBeenCalledTimes(1);
  });
});

describe('BookReader.prototype.trigger', () => {
  test('fires custom event', () => {
    const br = new BookReader();
    global.br = br;
    global.dispatchEvent = jest.fn();

    const props = {bar: 1};
    br.trigger('foo', props);
    expect(global.dispatchEvent.mock.calls.length).toBe(1);
  });
});

describe('`BookReader.prototype.prev`', () => {
  const br = new BookReader();
  global.br = br;
  br.trigger = jest.fn();
  br.flipBackToIndex = jest.fn();
  br.jumpToIndex = jest.fn();

  test('does not take action if user is on front page', () => {
    br.firstIndex = 0;
    br.prev();
    expect(br.trigger.mock.calls.length).toBe(0);
    expect(br.flipBackToIndex.mock.calls.length).toBe(0);
    expect(br.jumpToIndex.mock.calls.length).toBe(0);
  });

  describe('2up mode', () => {
    test('fires event and turns the page', () => {
      br.firstIndex = 10;
      br.mode = br.constMode2up;
      br.prev();
      expect(br.jumpToIndex.mock.calls.length).toBe(0); // <--  does not get called
      expect(br.trigger.mock.calls.length).toBe(1);
      expect(br.flipBackToIndex.mock.calls.length).toBe(1);
    });
  })

  describe('non 2up mode', () => {
    test('jumps to provided index', () => {
      br.firstIndex = 100;
      br.mode = br.constMode1up;
      br.prev();
      expect(br.jumpToIndex.mock.calls.length).toBe(1);  // <--  gets called
      expect(br.trigger.mock.calls.length).toBe(1); // <-- gets called by `jumpToIndex` internally
      expect(br.flipBackToIndex.mock.calls.length).toBe(1); // <-- gets called by `jumpToIndex` internally
    })
  });
});

