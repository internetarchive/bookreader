import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';

import BookReader from '../../src/js/BookReader.js';
import '../../src/js/plugins/plugin.print.js';

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.imageFormat = 'jp2';
  br.subPrefix = 'item';
  br.server = 'test-archive.org',
  br.zip = 'item.zip';
  br.init();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Print', () => {
  test('has added follwing BR properties', () => {
    expect(br).toHaveProperty('imageFormat');
    expect(br.imageFormat).toEqual('jp2');

    expect(br).toHaveProperty('subPrefix');
    expect(br.subPrefix).toEqual('item');

    expect(br).toHaveProperty('server');
    expect(br.server).toEqual('test-archive.org');

    expect(br).toHaveProperty('zip');
    expect(br.zip).toEqual('item.zip');
  });

  test('get getPageFile from item', () => {
    expect(br.getPageFile(1)).toEqual('item_jp2/item_0001.jp2');
  });
});
