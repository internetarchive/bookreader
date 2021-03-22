import '../../../src/js/jquery-ui-wrapper.js';
import 'jquery.browser';

import BookReader from '../../../src/js/BookReader.js';
import '../../../src/js/plugins/plugin.mobile_nav.js';
import '../../../src/js/plugins/search/plugin.search.js';

jest.mock('../../../src/js/plugins/search/view.js');

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
    return Promise.resolve({
      ia: "adventuresofoli00dick",
      q: "child",
      indexed: true,
      page_count: 644,
      body_length: 666,
      leaf0_missing: false,
      matches: [{
        text: 'For a long; time after it was ushered into this world of sorrow and trouble, by the parish surgeon, it remained a matter of considerable doubt wliether the {{{child}}} Avould survi^ e to bear any name at all; in which case it is somewhat more than probable that these memoirs would never have appeared; or, if they had, that being comprised within a couple of pages, they would have possessed the inestimable meiit of being the most concise and faithful specimen of biography, extant in the literature of any age or country.',
        par: [{
          boxes: [{r: 1221, b: 2121, t: 2075, page: 37, l: 1107}],
          b: 2535,
          t: 1942,
          page_width: 1790,
          r: 1598,
          l: 50,
          page_height: 2940,
          page: 37
        }]
      }]
    });
  });

  $.fn.trigger = jest.fn();
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.initToolbar = jest.fn();
  br.showProgressPopup = jest.fn();
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
      .toHaveProperty('suppressFragmentChange', true);
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

  test('SearchCallback event fires when AJAX search returns results', () => {
    br.init();
    const dfd = br.search('foo');
    return dfd.then(() => {
      expect(triggeredEvents()).toContain(`${namespace}SearchCallback`);
    });
  });

  test('SearchCallbackError event fires when AJAX search returns error', () => {
    $.ajax = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        error: true,
      });
    });
    br.init();
    const dfd = br.search('foo');
    return dfd.then(() => {
      expect(triggeredEvents()).toContain(`${namespace}SearchCallbackError`);
    });
  });

  test('SearchCallbackNotIndexed event fires when AJAX search returns false indexed value', () => {
    $.ajax = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        matches: [],
        indexed: false,
      });
    });
    br.init();
    const dfd = br.search('foo');
    return dfd.then(() => {
      expect(triggeredEvents()).toContain(`${namespace}SearchCallbackBookNotIndexed`);
    });
  });

  test('SearchCallbackEmpty event fires when AJAX search returns no matches', () => {
    $.ajax = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        matches: [],
      });
    });
    br.init();
    const dfd = br.search('foo');
    return dfd.then(() => {
      expect(triggeredEvents()).toContain(`${namespace}SearchCallbackEmpty`);
    });
  });
});
