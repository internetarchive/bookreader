import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';

import BookReader from '../../src/js/BookReader.js';
import '../../src/js/plugins/plugin.url.js';

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: URL controller', () => {
  test('has default option flag', () => {
    expect(BookReader.defaultOptions.enableUrlPlugin).toEqual(true);
  });

  test('adds url specific fields to BR', () => {
    const { defaultOptions } = BookReader;
    expect(defaultOptions).toHaveProperty('urlTrackIndex0');
    expect(defaultOptions).toHaveProperty('urlTrackedParams');
    expect(defaultOptions).toHaveProperty('urlHistoryBasePath');
    expect(defaultOptions).toHaveProperty('urlMode');
    expect(defaultOptions).toHaveProperty('updateWindowTitle');
    expect(defaultOptions).toHaveProperty('defaults');
    expect(defaultOptions).toHaveProperty('bookId');
  })

  test('has a whitelist of params that it tracks', () => {
    ['page', 'search', 'mode', 'region', 'highlight']
    const { defaultOptions: { urlTrackedParams } } = BookReader;
    expect(Array.isArray(urlTrackedParams)).toEqual(true);
    expect(urlTrackedParams.find(param => param === 'page')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'search')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'mode')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'region')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'highlight')).toBeTruthy();
  })

  test('initializes polling for url changes if using hash', () => {
    BookReader.prototype.urlStartLocationPolling = jest.fn();
    br.init();

    expect(br.urlStartLocationPolling).toHaveBeenCalled();
  });

  test('updates URL when params change', () => {
    window.history.replaceState = jest.fn();
    BookReader.prototype.currentIndex = jest.fn(() => 1);
    BookReader.prototype.urlReadFragment = jest.fn(() => '/page/2/mode/1up/search/foo');
    BookReader.prototype.paramsFromCurrent = jest.fn(() => ({
      index: 88,
      mode: 2,
      search: ''
    }));
    br.init();
    br.options.urlMode = 'history';
    br.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  })

});
