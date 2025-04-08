import BookReader from '@/src/BookReader.js';
import { UrlPlugin } from '@/src/plugins/url/plugin.url.js';
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
  test('initializes polling for url changes if using hash', () => {
    br._plugins.url.urlStartLocationPolling = jest.fn();
    br.init();

    expect(br._plugins.url.urlStartLocationPolling).toHaveBeenCalled();
  });

  test('updates URL when index changes', () => {
    window.history.replaceState = jest.fn();
    br.currentIndex = jest.fn(() => 1);
    br._plugins.url.urlReadFragment = jest.fn(() => '/page/2/mode/1up');
    br.paramsFromCurrent = jest.fn(() => ({
      index: 88,
      mode: 1,
      search: '',
    }));
    br._plugins.url.options.urlMode = 'history';
    br.init();
    br._plugins.url.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('updates URL when mode changes', () => {
    window.history.replaceState = jest.fn();
    br.currentIndex = jest.fn(() => 1);
    br._plugins.url.urlReadFragment = jest.fn(() => '/page/2/mode/1up');
    br.paramsFromCurrent = jest.fn(() => ({
      index: 2,
      mode: 2,
      search: '',
    }));
    br._plugins.url.options.urlMode = 'history';
    br.init();
    br._plugins.url.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('updates URL when search changes', () => {
    window.history.replaceState = jest.fn();
    br.currentIndex = jest.fn(() => 1);
    br._plugins.url.urlReadFragment = jest.fn(() => '');
    br.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      search: 'foo',
    }));
    br.search = jest.fn();
    br._plugins.url.options.urlMode = 'history';
    br.init();
    br._plugins.url.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('updates URL when view changes', () => {
    window.history.replaceState = jest.fn();
    br.currentIndex = jest.fn(() => 1);
    br._plugins.url.urlReadFragment = jest.fn(() => '');
    br.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      view: 'theater',
    }));
    br.search = jest.fn();
    br._plugins.url.options.urlMode = 'history';
    br.init();
    br._plugins.url.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('switches to hashMode if replaceState errors', () => {
    window.history.replaceState = jest.fn(() => {
      throw new Error('foo');
    });
    br.currentIndex = jest.fn(() => 1);
    br._plugins.url.urlReadFragment = jest.fn(() => '');
    br.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      view: 'theater',
    }));
    br.search = jest.fn();
    br._plugins.url.options.urlMode = 'history';
    br.init();
    br._plugins.url.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalled();
    expect(br._plugins.url.options.urlMode).toEqual('hash');
  });

  test('does not update URL when search in query string', () => {
    window.history.replaceState = jest.fn();
    br.currentIndex = jest.fn(() => 1);
    br._plugins.url.urlReadFragment = jest.fn(() => 'mode/2up');
    br.getLocationSearch = jest.fn(() => '?q=foo');
    br.paramsFromCurrent = jest.fn(() => ({
      index: 1,
      mode: 2,
      search: 'foo',
    }));
    br.search = jest.fn();
    br.options.plugins.search = { initialSearchTerm: 'foo' };
    br._plugins.url.urlMode = 'history';
    br.init();
    br._plugins.url.urlUpdateFragment();

    expect(window.history.replaceState).toHaveBeenCalledTimes(0);
  });

  test('only q= param is selected from url query params', () => {
    const p = new UrlPlugin(br);
    const INITIAL_URL = "http://127.0.0.1:8080/BookReaderDemo/demo-internetarchive.html?ocaid=adventuresofoli00dick&q=foo";
    const result = p.urlParamsFiltersOnlySearch(INITIAL_URL);
    expect(result).toBe("?q=foo");
  });

  test('only q= param is selected from url query params with special character', () => {
    const p = new UrlPlugin(br);
    const INITIAL_URL = "http://127.0.0.1:8080/BookReaderDemo/demo-internetarchive.html?ocaid=adventuresofoli00dick&q=foo%24%24";
    const result = p.urlParamsFiltersOnlySearch(INITIAL_URL);
    expect(result).toBe("?q=foo%24%24");
  });
});

