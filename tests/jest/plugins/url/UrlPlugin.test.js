import { UrlPlugin } from '@/src/plugins/url/UrlPlugin.js';

afterEach(() => {
  jest.clearAllMocks();
});

describe('UrlPlugin tests', () => {
  const urlPlugin = new UrlPlugin();

  describe('urlStateToUrlString tests', () => {
    test('urlStateToUrlString with known states in schema', () => {
      const urlState = { page: 'n7', mode: '1up', search: 'foo' };
      const urlStateWithQueries = { page: 'n7', mode: '1up', q: 'hello', view: 'theater', sort: 'title_asc' };

      const expectedUrlFromState = 'page/n7/mode/1up?q=foo';
      const expectedUrlFromStateWithQueries = 'page/n7/mode/1up?q=hello&view=theater&sort=title_asc';

      expect(urlPlugin.urlStateToUrlString(urlState)).toBe(expectedUrlFromState);
      expect(urlPlugin.urlStateToUrlString(urlStateWithQueries)).toBe(expectedUrlFromStateWithQueries);
    });

    test('encodes page number', () => {
      expect(urlPlugin.urlStateToUrlString({ page: '12/46' })).toBe(`page/12%2F46`);
    });

    test('urlStateToUrlString with unknown states in schema', () => {
      const urlState = { page: 'n7', mode: '1up' };
      const urlStateWithQueries = { page: 'n7', mode: '1up', q: 'hello', viewer: 'theater', sortBy: 'title_asc' };

      const expectedUrlFromState = 'page/n7/mode/1up';
      const expectedUrlFromStateWithQueries = 'page/n7/mode/1up?q=hello&viewer=theater&sortBy=title_asc';

      expect(urlPlugin.urlStateToUrlString(urlState)).toBe(expectedUrlFromState);
      expect(urlPlugin.urlStateToUrlString(urlStateWithQueries)).toBe(expectedUrlFromStateWithQueries);
    });

    test('urlStateToUrlString with boolean value', () => {
      const urlState = { page: 'n7', mode: '1up', search: 'foo', view: 'theater', wrapper: 'false' };
      const expectedUrlFromState = 'page/n7/mode/1up?q=foo&view=theater&wrapper=false';

      expect(urlPlugin.urlStateToUrlString(urlState)).toBe(expectedUrlFromState);
    });
  });

  describe('urlStringToUrlState tests', () => {
    test('urlStringToUrlState without query string', () => {
      const url = '/page/n7/mode/2up';
      const url1 = '/page/n7/mode/1up';

      expect(urlPlugin.urlStringToUrlState(url)).toEqual({page: 'n7', mode: '2up'});
      expect(urlPlugin.urlStringToUrlState(url1)).toEqual({page: 'n7', mode: '1up'});
    });

    test('decodes page number', () => {
      expect(urlPlugin.urlStringToUrlState('/page/12%2F46')).toStrictEqual({ page: '12/46' });
    });

    test('urlStringToUrlState with deprecated_for', () => {
      const url = '/page/n7/mode/2up/search/hello';

      expect(urlPlugin.urlStringToUrlState(url)).toEqual({page: 'n7', mode: '2up', q: 'hello'});
    });

    test('urlStringToUrlState with query string', () => {
      const url = '/page/n7/mode/2up/search/hello?view=theather&foo=bar&sort=title_asc';
      const url1 = '/mode/2up?ref=ol&ui=embed&wrapper=false&view=theater';

      expect(urlPlugin.urlStringToUrlState(url)).toEqual(
        {page: 'n7', mode: '2up', q: 'hello', view: 'theather', foo: 'bar', sort: 'title_asc'},
      );
      expect(urlPlugin.urlStringToUrlState(url1)).toEqual(
        {mode: '2up', ref: 'ol', ui: 'embed', wrapper: 'false', view: 'theater'},
      );
    });

    test('urlStringToUrlState compare search and ?q', () => {
      const url = '/page/n7/mode/2up/search/hello';
      urlPlugin.urlState = { q: 'hello' };

      expect(urlPlugin.urlStringToUrlState(url)).toEqual({page: 'n7', mode: '2up', q: 'hello'});
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
    test('url first load - empty state', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlMode = 'hash';

      urlPlugin.pullFromAddressBar({ pathname: '', search: '', hash: '#' });
      expect(urlPlugin.urlState).toEqual({});

      urlPlugin.pushToAddressBar();
      expect(window.location.hash).toEqual('');
    });

    test('url without mode state value - use default', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlMode = 'hash';

      urlPlugin.pullFromAddressBar({ pathname: '', search: '', hash: '#page/12' });
      expect(urlPlugin.urlState).toEqual({page: '12'});

      urlPlugin.pushToAddressBar();
      expect(window.location.hash).toEqual('#page/12');
    });

    test('url with query param', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlMode = 'hash';

      urlPlugin.pullFromAddressBar({ pathname: '', search: '', hash: '#page/12?q=hello&view=theater' });
      expect(urlPlugin.urlState).toEqual({page: '12', q: 'hello', view: 'theater'});

      urlPlugin.pushToAddressBar();
      expect(window.location.hash).toEqual('#page/12?q=hello&view=theater');
    });
  });

  describe('pullFromAddressBar and pushToAddressBar - history mode', () => {
    test('url first load - empty state', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlHistoryBasePath = '/details/foo';
      urlPlugin.urlMode = 'history';

      urlPlugin.pullFromAddressBar({ pathname: '', search: '', hash: '' });
      expect(urlPlugin.urlState).toEqual({});

      urlPlugin.pushToAddressBar();
      expect(window.location.pathname).toEqual('/details/foo');
    });

    test('url without mode state value', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlHistoryBasePath = '/details/foo/';
      urlPlugin.urlMode = 'history';

      urlPlugin.pullFromAddressBar({ pathname: '/details/foo/page/12', search: '', hash: '' });
      expect(urlPlugin.urlState).toEqual({page: '12'});

      urlPlugin.pushToAddressBar();
      expect(window.location.pathname).toEqual('/details/foo/page/12');
    });

    test('url with query param', () => {
      urlPlugin.urlState = {};
      urlPlugin.urlHistoryBasePath = '/details/foo/';
      urlPlugin.urlMode = 'history';

      urlPlugin.pullFromAddressBar({ pathname: '/details/foo/page/12', search: '?q=hello&view=theater', hash: '' });
      expect(urlPlugin.urlState).toEqual({page: '12', q: 'hello', view: 'theater'});

      urlPlugin.pushToAddressBar();
      const locationUrl = `${window.location.pathname}${window.location.search}`;
      expect(locationUrl).toEqual('/details/foo/page/12?q=hello&view=theater');
    });

    test('strips leading slash of incoming path name for no double slash', () => {
      const urlPlugin = new UrlPlugin();
      urlPlugin.urlMode = 'history';

      urlPlugin.urlHistoryBasePath = '/details/SubBookTest/book1/GPORFP/';
      urlPlugin.urlState = {
        "mode": "1up",
      };

      urlPlugin.setUrlParam('sort', 'title_asc');
      urlPlugin.setUrlParam('mode', 'thumb');

      expect(window.location.href).toEqual('http://localhost/details/SubBookTest/book1/GPORFP/mode/thumb?sort=title_asc');
    });
  });

});
