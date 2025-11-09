import BookReader from '@/src/BookReader.js';
import '@/src/plugins/search/plugin.search.js';
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

  test('calling `search` fires ajax call`', () => {
    br.init();
    br.search('foo');
    expect($.ajax).toHaveBeenCalled();
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
