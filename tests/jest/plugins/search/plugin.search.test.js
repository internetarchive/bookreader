import BookReader from '@/src/BookReader.js';
import { SearchPlugin } from '@/src/plugins/search/plugin.search.js';
import { deepCopy } from '../../utils.js';
import { DUMMY_RESULTS } from './utils.js';

jest.mock('@/src/plugins/search/view.js');

/** @type {BookReader} */
let br;
const namespace = 'BookReader:';
const triggeredEvents = () => {
  return $.fn.trigger.mock.calls.map((params) => {
    if (typeof params[0] === 'string') { return params[0]; }
    return params[0].type;
  });
};

beforeEach(() => {
  $.ajax = jest.fn().mockImplementation(() => {
    // return from:
    // `https://ia800304.us.archive.org/fulltext/inside.php?item_id=adventuresofoli00dick&doc=adventuresofoli00dick&path=/30/items/adventuresofoli00dick&q=child&callback=<serialized jQ CB>`
    return Promise.resolve(deepCopy(DUMMY_RESULTS));
  });

  $.fn.trigger = jest.fn();
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader({
    server: 'foo.bar.com',
    bookPath: '/13/items/foo/foobar',
    subPrefix: '/foobar',
  });
  br.initToolbar = jest.fn();
  br.showProgressPopup = jest.fn();
  br.plugins.search.searchXHR = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Search', () => {
  test('On init, it loads the toolbar', () => {
    br.init();
    expect(br.initToolbar).toHaveBeenCalled();
  });

  test('Constructs SearchView', () => {
    expect(br.plugins.search.searchView).toBeDefined();
  });

  test('On init, it will run a search if given `options.initialSearchTerm`', () => {
    br.plugins.search.search = jest.fn();
    br.options.plugins.search.initialSearchTerm = 'foo';
    br.init();

    expect(br.plugins.search.search).toHaveBeenCalled();
    expect(br.plugins.search.search.mock.calls[0][1])
      .toHaveProperty('goToFirstResult', true);
    expect(br.plugins.search.search.mock.calls[0][1])
      .toHaveProperty('suppressFragmentChange', false);
  });

  test('On init with #focus=search in URL hash, it opens the search panel without searching', () => {
    br.plugins.search.search = jest.fn();
    br.urlPlugin = { pullFromAddressBar: jest.fn(), getUrlParam: jest.fn(() => 'search') };
    br.init();

    expect(br.plugins.search.searchView.toggleSidebar).toHaveBeenCalled();
    expect(br.plugins.search.search).not.toHaveBeenCalled();
  });

  test('calling `search` fires ajax call`', () => {
    br.init();
    br.search('foo');
    expect($.ajax).toHaveBeenCalled();
  });

  test.each([
    ['“lives down”', '"lives down"'],
    ['before “lives down” after “next page”', 'before "lives down" after "next page"'],
    ['"lives down"', '"lives down"'],
    ["O’Connor's café 日本語 ‘single quotes’", "O’Connor's café 日本語 ‘single quotes’"],
  ])('preserves phrase search syntax for %s', async (query, expected) => {
    br.init();
    await br.search(query);

    const request = $.ajax.mock.calls[0][0];
    const url = new URL(request.url, 'https://archive.org');
    expect(url.searchParams.get('q')).toBe(expected);
  });

  test('SearchStarted event fires when search method called', () => {
    br.init();
    br.search('foo');
    expect(triggeredEvents()).toContain(`${namespace}SearchStarted`);
  });

  test('SearchStarted event fires and should go to first result', () => {
    br.init();
    br.search('foo', { goToFirstResult: true});
    expect(br.plugins.search.options.goToFirstResult).toBeTruthy();
  });

  test('SearchCallback event fires when AJAX search returns results', async () => {
    br.init();
    await br.search('foo');
    expect(triggeredEvents()).toContain(`${namespace}SearchCallback`);
  });

  test('SearchCallbackError event fires when AJAX search returns error', async () => {
    $.ajax = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        error: true,
      });
    });
    br.init();
    await br.search('foo');
    expect(triggeredEvents()).toContain(`${namespace}SearchCallbackError`);
  });

  test('SearchCallbackNotIndexed event fires when AJAX search returns false indexed value', async () => {
    $.ajax = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        matches: [],
        indexed: false,
      });
    });
    br.init();
    await br.search('foo');
    expect(triggeredEvents()).toContain(`${namespace}SearchCallbackBookNotIndexed`);
  });

  test('SearchCallbackEmpty event fires when AJAX search returns no matches', async () => {
    $.ajax = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        matches: [],
      });
    });
    br.init();
    await br.search('foo');
    expect(triggeredEvents()).toContain(`${namespace}SearchCallbackEmpty`);
  });
});

describe('jumpToMatch', () => {
  function makeFake({ displayed }) {
    const page = { index: 7 };
    const fakeBr = {
      currentIndex: () => 0,
      book: { leafNumToIndex: () => page.index, getPage: () => page },
      requestPage: jest.fn().mockResolvedValue([]),
      _isIndexDisplayed: jest.fn().mockReturnValue(displayed),
      jumpToIndex: jest.fn(),
      scrollIntoView: jest.fn(),
    };
    const fakePlugin = {
      br: fakeBr,
      suppressFragmentChange: true,
      searchResults: { matches: [{ matchIndex: 99, par: [{ page: 7 }] }] },
    };
    return { page, fakeBr, fakePlugin };
  }

  beforeEach(() => {
    document.body.innerHTML = '<svg><rect class="match-index-99"></rect></svg>';
  });

  test('requests the page, then jumps to it even if unviewable', async () => {
    const { page, fakeBr, fakePlugin } = makeFake({ displayed: false });

    await SearchPlugin.prototype.jumpToMatch.call(fakePlugin, 0);

    expect(fakeBr.requestPage).toHaveBeenCalledWith(page);
    expect(fakeBr.jumpToIndex).toHaveBeenCalledWith(7, { ariaLive: true, allowUnviewable: true });
    expect(fakeBr.requestPage.mock.invocationCallOrder[0])
      .toBeLessThan(fakeBr.jumpToIndex.mock.invocationCallOrder[0]);
    expect(fakePlugin.suppressFragmentChange).toBe(false);
  });

  test('does not jump if the page is already displayed', async () => {
    const { fakeBr, fakePlugin } = makeFake({ displayed: true });

    await SearchPlugin.prototype.jumpToMatch.call(fakePlugin, 0);

    expect(fakeBr.jumpToIndex).not.toHaveBeenCalled();
    expect(fakeBr.scrollIntoView).toHaveBeenCalled();
  });
});
