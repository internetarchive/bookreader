/* global BookReader */
require('../../BookReader/jquery-1.10.1.js');
require('../../BookReader/jquery-ui-1.12.0.min.js');
require('../../BookReader/jquery.browser.min.js');
require('../../BookReader/dragscrollable-br.js');
require('../../BookReader/jquery.colorbox-min.js');
require('../../BookReader/jquery.bt.min.js');

require('../../BookReader/BookReader.js');
require('../../src/js/plugins/plugin.autoplay.js');


let br;
beforeAll(() => {
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
  /*
     this.auto      = false;
    this.autoTimer = null;
    this.flipDelay = 5000;
  */
  test('has added BR property: auto', () => {
    expect(br).toHaveProperty('auto');
    expect(br.auto).toEqual(false);
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
});
