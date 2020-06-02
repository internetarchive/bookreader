import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';

import BookReader from '../../src/js/BookReader.js';
import '../../src/js/plugins/plugin.mobile_nav.js';
import '../../src/js/plugins/plugin.search.js';

let br;
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
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.initToolbar = jest.fn();
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
});
