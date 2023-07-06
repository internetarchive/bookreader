import BookReader from '@/src/BookReader.js';
import '@/src/plugins/search/plugin.search.js';
import { deepCopy } from '../../utils.js';
import { DUMMY_RESULTS } from './utils.js';

jest.mock('@/src/plugins/search/view.js');

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
  br = new BookReader();
  br.initToolbar = jest.fn();
  br.showProgressPopup = jest.fn();
  br.searchXHR = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Search', () => {
  test('has option flag', () => {
    expect(BookReader.defaultOptions.enableSearch).toEqual(true);
  });

  test('has added BR property: server', () => {
    expect(br).toHaveProperty('server');
    expect(br.server).toBeTruthy();
  });

  test('has added BR property: bookId', () => {
    expect(br).toHaveProperty('bookId');
    expect(br.bookId).toBeFalsy();
  });

  test('has added BR property: subPrefix', () => {
    expect(br).toHaveProperty('subPrefix');
    expect(br.subPrefix).toBeFalsy();
  });

  test('has added BR property: bookPath', () => {
    expect(br).toHaveProperty('bookPath');
    expect(br.bookPath).toBeFalsy();
  });

  test('has added BR property: searchInsideUrl', () => {
    expect(br).toHaveProperty('searchInsideUrl');
    expect(br.searchInsideUrl).toBeTruthy();
  });

  test('has added BR property: initialSearchTerm', () => {
    expect(br.options).toHaveProperty('initialSearchTerm');
    expect(br.options.initialSearchTerm).toBeFalsy();
  });

  test('On init, it loads the toolbar', () => {
    br.init();
    expect(br.initToolbar).toHaveBeenCalled();
  });

  test('On init, it will run a search if given `options.initialSearchTerm`', () => {
    br.search = jest.fn();
    br.options.initialSearchTerm = 'foo';
    br.init();

    expect(br.search).toHaveBeenCalled();
    expect(br.search.mock.calls[0][1])
      .toHaveProperty('goToFirstResult', true);
    expect(br.search.mock.calls[0][1])
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
    expect(br.options.goToFirstResult).toBeTruthy();
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
