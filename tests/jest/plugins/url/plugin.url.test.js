import BookReader from '@/src/BookReader.js';
import '@/src/plugins/url/plugin.url.js';
import sinon from 'sinon';

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
});

afterEach(() => {
  jest.clearAllMocks();
  sinon.restore();
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
  });

  test('has a whitelist of params that it tracks', () => {
    ['page', 'search', 'mode', 'region', 'highlight'];
    const { defaultOptions: { urlTrackedParams } } = BookReader;
    expect(Array.isArray(urlTrackedParams)).toEqual(true);
    expect(urlTrackedParams.find(param => param === 'page')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'search')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'mode')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'region')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'highlight')).toBeTruthy();
    expect(urlTrackedParams.find(param => param === 'view')).toBeTruthy();
  });

  test('initializes polling for url changes if using hash', () => {
    BookReader.prototype.urlStartLocationPolling = jest.fn();
    br.init();

    expect(br.urlStartLocationPolling).toHaveBeenCalled();
  });

  test('updates URL when index changes', () => {
    window.history.replaceState = jest.fn();
    BookReader.prototype.currentIndex = jest.fn(() => 1);
    BookReader.prototype.urlReadFragment = jest.fn(() => '/page/2/mode/1up');
    BookReader.prototype.paramsFromCurrent = jest.fn(() => ({
      index: 88,
      mode: 1,
      search: ''
    }));
    br.options.urlMode = 'history';
    br.init();
    br.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('updates URL when mode changes', () => {
    window.history.replaceState = jest.fn();
    BookReader.prototype.currentIndex = jest.fn(() => 1);
    BookReader.prototype.urlReadFragment = jest.fn(() => '/page/2/mode/1up');
    BookReader.prototype.paramsFromCurrent = jest.fn(() => ({
      index: 2,
      mode: 2,
      search: ''
    }));
    br.options.urlMode = 'history';
    br.init();
    br.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('updates URL when search changes', () => {
    window.history.replaceState = jest.fn();
    BookReader.prototype.currentIndex = jest.fn(() => 1);
    BookReader.prototype.urlReadFragment = jest.fn(() => '');
    BookReader.prototype.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      search: 'foo'
    }));
    BookReader.prototype.search = jest.fn();
    br.options.urlMode = 'history';
    br.init();
    br.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('updates URL when view changes', () => {
    window.history.replaceState = jest.fn();
    BookReader.prototype.currentIndex = jest.fn(() => 1);
    BookReader.prototype.urlReadFragment = jest.fn(() => '');
    BookReader.prototype.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      view: 'theater'
    }));
    BookReader.prototype.search = jest.fn();
    br.options.urlMode = 'history';
    br.init();
    br.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('switches to hashMode if replaceState errors', () => {
    window.history.replaceState = jest.fn(() => {
      throw new Error('foo');
    });
    BookReader.prototype.currentIndex = jest.fn(() => 1);
    BookReader.prototype.urlReadFragment = jest.fn(() => '');
    BookReader.prototype.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      view: 'theater'
    }));
    BookReader.prototype.search = jest.fn();
    br.options.urlMode = 'history';
    br.init();
    br.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
    expect(br.options.urlMode).toEqual('hash');
  });

  test('does not update URL when search in query string', () => {
    window.history.replaceState = jest.fn();
    BookReader.prototype.currentIndex = jest.fn(() => 1);
    BookReader.prototype.urlReadFragment = jest.fn(() => 'mode/2up');
    BookReader.prototype.getLocationSearch = jest.fn(() => '?q=foo');
    BookReader.prototype.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      search: 'foo'
    }));
    BookReader.prototype.search = jest.fn();
    br.options.initialSearchTerm = 'foo';
    br.options.urlMode = 'history';
    br.init();
    br.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalledTimes(0);
  });

  test('only q= param is selected from url query params', () => {
    const INTIAL_URL = "http://127.0.0.1:8080/BookReaderDemo/demo-internetarchive.html?ocaid=adventuresofoli00dick&q=foo";
    const result = br.urlParamsFiltersOnlySearch(INTIAL_URL);
    expect(result).toBe("?q=foo");
  });

  test('only q= param is selected from url query params with special character', () => {
    const INTIAL_URL = "http://127.0.0.1:8080/BookReaderDemo/demo-internetarchive.html?ocaid=adventuresofoli00dick&q=foo%24%24";
    const result = br.urlParamsFiltersOnlySearch(INTIAL_URL);
    expect(result).toBe("?q=foo%24%24");
  });
});

