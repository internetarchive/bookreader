
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
    br._plugins.autoplay.autoToggle = jest.fn();
    br.init();
    expect(br._plugins.autoplay.autoToggle).toHaveBeenCalledTimes(0);
  });
  test('autoplay will run without `flipSpeed` parameters', () => {
    const initialAutoTimer = br._plugins.autoplay.autoTimer;
    br.next = jest.fn();
    br._plugins.autoplay.autoStop = jest.fn();
    br.init();
    br._plugins.autoplay.autoToggle();
    // internally referenced functions that fire
    expect(br.next).toHaveBeenCalledTimes(1);

    expect(initialAutoTimer).toBeFalsy();
    // autoTimer changes when autoToggle turns on
    expect(br._plugins.autoplay.autoTimer).toBeTruthy();
  });
});
