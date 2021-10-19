
import BookReader from '@/src/BookReader.js';
import * as util from '@/src/plugins/plugin.vendor-fullscreen.js';

let br;
beforeEach(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.init();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Vendor-fullscreen', () => {
  test('has option flag', () => {
    expect(BookReader.defaultOptions.enableVendorFullscreenPlugin).toEqual(true);
  });

  test('enterFullWindow will run when enter in Fullscreen mode', () => {
    const enterFullWindow = br.enterFullWindow;
    br.updateBrClasses = jest.fn();
    br.resize = jest.fn();
    br.init();
    br.enterFullWindow();

    expect(enterFullWindow).toBeTruthy();

    // br.isVendorFullscreenActive set to `true` when enterFullWindow Called
    expect(br.isVendorFullscreenActive).toEqual(true);

    // br.updateBrClasses trigger when enterFullWindow called
    expect(br.updateBrClasses).toHaveBeenCalledTimes(2);

    // br.resize trigger when enterFullWindow called
    expect(br.resize).toHaveBeenCalledTimes(1);
  });

  test('exitFullWindow will run when exit Fullscreen mode', () => {
    const exitFullWindow = br.exitFullWindow;
    br.updateBrClasses = jest.fn();
    br.init();
    br.exitFullWindow();

    expect(exitFullWindow).toBeTruthy();

    // br.isFullscreenActive set to `false` when exitFullWindow Called
    expect(br.isFullscreenActive).toEqual(false);

    // br.updateBrClasses trigger when exitFullWindow called
    expect(br.updateBrClasses).toHaveBeenCalledTimes(2);
  });

  test('isFullscreen returns true when fullscreen activated', () => {
    br.init();
    br.isVendorFullscreenActive = true;
    expect(br.isFullscreen).toBeTruthy();
  });

  test('util: isFullscreenActive', () => {
    document.fullscreenElement = true;
    expect(util.isFullscreenActive).toBeTruthy();
  });
});
