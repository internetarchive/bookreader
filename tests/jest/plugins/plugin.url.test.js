import BookReader from '@/src/BookReader.js';
import '@/src/plugins/plugin.url.js';
import { UrlPlugin } from '@/src/plugins/plugin.url.js';
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


describe.only('UrlPlugin tests', () => {
  const urlPlugin = new UrlPlugin();
  const urlSchema = [
    { name: 'page', position: 'path', default: 'n0' },
    { name: 'mode', position: 'path', default: '2up' },
    { name: 'search', position: 'path', deprecated_for: 'q' },
    { name: 'q', position: 'query_param' },
    { name: 'sort', position: 'query_param' },
    { name: 'view', position: 'query_param' },
    { name: 'admin', position: 'query_param' },
  ];

  describe('urlStateToUrlString tests', () => {
    test('urlStateToUrlString with known states in schema', () => {
      const urlState = { page: 'n7', mode: '1up', search: 'foo' };
      const urlStateWithQueries = { page: 'n7', mode: '1up', q: 'hello', view: 'theater', sort: 'title_asc' };

      const expectedUrlFromState = '/page/n7/mode/1up?q=foo';
      const expectedUrlFromStateWithQueries = '/page/n7/mode/1up?q=hello&view=theater&sort=title_asc';

      expect(urlPlugin.urlStateToUrlString(urlSchema, urlState)).toBe(expectedUrlFromState);
      expect(urlPlugin.urlStateToUrlString(urlSchema, urlStateWithQueries)).toBe(expectedUrlFromStateWithQueries);
    });

    test('urlStateToUrlString with unknown states in schema', () => {
      const urlState = { page: 'n7', mode: '1up' };
      const urlStateWithQueries = { page: 'n7', mode: '1up', q: 'hello', viewer: 'theater', sortBy: 'title_asc' };

      const expectedUrlFromState = '/page/n7/mode/1up';
      const expectedUrlFromStateWithQueries = '/page/n7/mode/1up?q=hello&viewer=theater&sortBy=title_asc';

      expect(urlPlugin.urlStateToUrlString(urlSchema, urlState)).toBe(expectedUrlFromState);
      expect(urlPlugin.urlStateToUrlString(urlSchema, urlStateWithQueries)).toBe(expectedUrlFromStateWithQueries);
    });

    test('urlStateToUrlString with boolean value', () => {
      const urlState = { page: 'n7', mode: '1up', search: 'foo', view: 'theater', wrapper: false };
      const expectedUrlFromState = '/page/n7/mode/1up?q=foo&view=theater&wrapper=false';

      expect(urlPlugin.urlStateToUrlString(urlSchema, urlState)).toBe(expectedUrlFromState);
    });
  });

  describe('urlStringToUrlState tests', () => {
    test('urlStringToUrlState without query string', () => {
      const url = '/page/n7/mode/2up';
      const url1 = '/page/n7/mode/1up';

      expect(urlPlugin.urlStringToUrlState(urlSchema, url)).toEqual({page: 'n7', mode: '2up'});
      expect(urlPlugin.urlStringToUrlState(urlSchema, url1)).toEqual({page: 'n7', mode: '1up'});
    });

    test('urlStringToUrlState with deprecated_for', () => {
      const url = '/page/n7/mode/2up/search/hello';

      expect(urlPlugin.urlStringToUrlState(urlSchema, url)).toEqual({page: 'n7', mode: '2up', q: 'hello'});
    });

    test('urlStringToUrlState with query string', () => {
      const url = '/page/n7/mode/2up/search/hello?view=theather&foo=bar&sort=title_asc';
      const url1 = '/mode/2up?ref=ol&ui=embed&wrapper=false&view=theater';

      expect(urlPlugin.urlStringToUrlState(urlSchema, url)).toEqual(
        {page: 'n7', mode: '2up', q: 'hello', view: 'theather', foo: 'bar', sort: 'title_asc'}
      );
      expect(urlPlugin.urlStringToUrlState(urlSchema, url1)).toEqual(
        {page: 'n0', mode: '2up', ref: 'ol', ui: 'embed', wrapper: false, view: 'theater'}
      );
    });

    test('urlStringToUrlState compare search and ?q', () => {
      const url = '/page/n7/mode/2up/search/hello';
      urlPlugin.urlState = { q: 'hello' };

      expect(urlPlugin.urlStringToUrlState(urlSchema, url)).toEqual({page: 'n7', mode: '2up', q: 'hello'});
    });
  });

  describe('url plugin helper functions', () => {
    test('setUrlParam', () => {
      urlPlugin.urlState = {};
      urlPlugin.setUrlParam('page', '20');
      urlPlugin.setUrlParam('mode', '2up');

      expect(urlPlugin.urlState).toEqual({page: '20', mode: '2up'});
    });

    test('removeUrlParam', () => {
      urlPlugin.setUrlParam('page', '20');
      urlPlugin.setUrlParam('mode', '2up');
      urlPlugin.removeUrlParam('mode');

      expect(urlPlugin.urlState).toEqual({page: '20'});
    });

    test('getUrlParam', () => {
      urlPlugin.setUrlParam('page', '20');
      urlPlugin.setUrlParam('mode', '2up');
      expect(urlPlugin.getUrlParam('page')).toEqual('20');
      expect(urlPlugin.getUrlParam('mode')).toEqual('2up');
    });
  });

  describe('pullFromAddressBar and pushToAddressBar - hash mode', () => {
    test('url without mode state value - use default', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlMode = 'hash';

      urlPlugin.pullFromAddressBar('/page/12');
      expect(urlPlugin.urlState).toEqual({page: '12', mode: '2up'});

      urlPlugin.pushToAddressBar();
      expect(window.location.hash).toEqual('#/page/12/mode/2up');
    });

    test('url with query param', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlMode = 'hash';

      urlPlugin.pullFromAddressBar('/page/12/search/hello?view=theater');
      expect(urlPlugin.urlState).toEqual({page: '12', mode: '2up', q: 'hello', view: 'theater'});

      urlPlugin.pushToAddressBar();
      expect(window.location.hash).toEqual('#/page/12/mode/2up?q=hello&view=theater');
    });
  });

  describe('pullFromAddressBar and pushToAddressBar - history mode', () => {
    test('url without mode state value - use default', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlHistoryBasePath = '/details/foo';
      urlPlugin.urlMode = 'history';

      urlPlugin.pullFromAddressBar('/details/foo/page/12');
      expect(urlPlugin.urlState).toEqual({page: '12', mode: '2up'});

      urlPlugin.pushToAddressBar();
      expect(window.location.pathname).toEqual('/details/foo/page/12/mode/2up');
    });

    test('url with query param', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlHistoryBasePath = '/details/foo';
      urlPlugin.urlMode = 'history';

      urlPlugin.pullFromAddressBar('/details/foo/page/12/search/hello?view=theater');
      expect(urlPlugin.urlState).toEqual({page: '12', mode: '2up', q: 'hello', view: 'theater'});

      urlPlugin.pushToAddressBar();
      const locationUrl = `${window.location.pathname}${window.location.search}`;
      expect(locationUrl).toEqual('/details/foo/page/12/mode/2up?q=hello&view=theater');
    });
  });

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

