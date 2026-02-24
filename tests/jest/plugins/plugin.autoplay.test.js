
import BookReader from '@/src/BookReader.js';
import '@/src/plugins/plugin.autoplay.js';

/** @type {BookReader} */
let br;
beforeEach(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Menu Toggle', () => {
  test('autoplay does not start when BookReaderInitializes', () => {
    br.plugins.autoplay.toggle = jest.fn();
    br.init();
    expect(br.plugins.autoplay.toggle).toHaveBeenCalledTimes(0);
  });
  test('autoplay will run without `flipSpeed` parameters', () => {
    const initialTimer = br.plugins.autoplay.timer;
    br.next = jest.fn();
    br.plugins.autoplay.stop = jest.fn();
    br.init();
    br.plugins.autoplay.toggle();
    // internally referenced functions that fire
    expect(br.next).toHaveBeenCalledTimes(1);

    expect(initialTimer).toBeFalsy();
    // timer changes when autoplay turns on
    expect(br.plugins.autoplay.timer).toBeTruthy();
  });
});
