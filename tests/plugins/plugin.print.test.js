/* global BookReader */
require('../../BookReader/jquery-1.10.1.js');
require('../../BookReader/jquery-ui-1.12.0.min.js');
require('../../BookReader/jquery.browser.min.js');
require('../../BookReader/dragscrollable-br.js');
require('../../BookReader/jquery.colorbox-min.js');
require('../../BookReader/jquery.bt.min.js');

require('../../BookReader/BookReader.js');
require('../../src/js/plugins/plugin.print.js');

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.init();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Print', () => {

  /*
    this.imageFormat = 'jp2';
    this.subPrefix   = '';
    this.server      = '',
    this.zip         = '';
  */

  test('has added BR property: imageFormat', () => {
    expect(br).toHaveProperty('imageFormat');
    expect(br.imageFormat).toEqual('jp2');
  });

  test('has added BR property: subPrefix', () => {
    expect(br).toHaveProperty('subPrefix');
    expect(br.subPrefix).toEqual('');
  });

  test('has added BR property: server', () => {
    expect(br).toHaveProperty('server');
    expect(br.server).toEqual('');
  });

  test('has added BR property: zip', () => {
    expect(br).toHaveProperty('zip');
    expect(br.zip).toBeFalsy();
  });
});
