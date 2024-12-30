
import BookReader from '@/src/BookReader.js';
import '@/src/plugins/plugin.autoplay.js';


let br;
beforeEach(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.init();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Menu Toggle', () => {
  test('has option flag', () => {
    expect(BookReader.defaultOptions.enableAutoPlayPlugin).toEqual(true);
  });
  test('has added BR property: autoTimer', () => {
    expect(br).toHaveProperty('autoTimer');
    expect(br.autoTimer).toEqual(null);
  });
  test('has added BR property: flipDelay', () => {
    expect(br).toHaveProperty('flipDelay');
    expect(br.flipDelay).toBeTruthy();
    expect(br.flipDelay).toBeGreaterThan(1);
  });
  test('autoplay does not start when BookReaderInitializes', () => {
    br.autoToggle = jest.fn();
    br.init();
    expect(br.autoToggle).toHaveBeenCalledTimes(0);
  });
  test('autoplay will run without `flipSpeed` parameters', () => {
    const initialAutoTimer = br.autoTimer;
    br.next = jest.fn();
    br.autoStop = jest.fn();
    br.init();
    br.autoToggle();
    // internally referenced functions that fire
    expect(br.next).toHaveBeenCalledTimes(1);

    expect(initialAutoTimer).toBeFalsy();
    // br.autoTimer changes when autoToggle turns on
    expect(br.autoTimer).toBeTruthy();
  });
});
