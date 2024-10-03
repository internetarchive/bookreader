
import BookReader from '@/src/BookReader.js';
import '@/src/plugins/search/plugin.search.js';
import { marshallSearchResults } from '@/src/plugins/search/utils.js';
import '@/src/plugins/search/view.js';

let br;
const namespace = 'BookReader:';
const results = {
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
      page: 37,
    }],
  }],
};

marshallSearchResults(results, () => '', '{{{', '}}}');
const resultWithScript = {
  ia: "adventuresofoli00dick",
  q: "child",
  indexed: true,
  page_count: 644,
  body_length: 666,
  leaf0_missing: false,
  matches: [{
    text: 'foo bar <script>alert(1);</script> {{{keyword}}} baz',
    par: [{
      boxes: [{r: 1221, b: 2121, t: 2075, page: 37, l: 1107}],
      b: 2535,
      t: 1942,
      page_width: 1790,
      r: 1598,
      l: 50,
      page_height: 2940,
      page: 37,
    }],
  }],
};

marshallSearchResults(resultWithScript, () => '', '{{{', '}}}');
beforeEach(() => {
  $.ajax = jest.fn().mockImplementation(() => {
    // return from:
    // `https://ia800304.us.archive.org/fulltext/inside.php?item_id=adventuresofoli00dick&doc=adventuresofoli00dick&path=/30/items/adventuresofoli00dick&q=child&callback=<serialized jQ CB>`
    return Promise.resolve(results);
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

describe('View: Plugin: Search', () => {
  test('When search runs, the view gets created.', () => {
    br.search = jest.fn();
    br.options.initialSearchTerm = 'foo';
    br.init();

    expect(br.searchView).toBeDefined();
    expect(br.searchView.handleSearchCallback).toBeDefined();
  });

  describe("Search results navigation bar", () => {
    test('Search Results callback creates the results nav', () => {
      br.init();
      const event = new CustomEvent(`${namespace}SearchCallback`);
      const options = { goToFirstResult: false };

      expect(br.searchView.dom.searchNavigation).toBeUndefined();

      br.searchView.handleSearchCallback(event, { results, options});
      expect(br.searchView.dom.searchNavigation).toBeDefined();
    });
    test('has controls', () => {
      br.init();
      const event = new CustomEvent(`${namespace}SearchCallback`);
      const options = { goToFirstResult: false };
      br.searchView.handleSearchCallback(event, { results, options});

      const searchResultsNav = document.querySelector('.BRsearch-navigation');
      expect(searchResultsNav).toBeDefined();

      expect(searchResultsNav.querySelectorAll('button').length).toEqual(4);
      expect(searchResultsNav.querySelector('.clear')).toBeDefined();
      expect(searchResultsNav.querySelector('.toggle-sidebar')).toBeDefined();
      expect(searchResultsNav.querySelector('.prev')).toBeDefined();
      expect(searchResultsNav.querySelector('.next')).toBeDefined();
    });
    test('disallows xss from search results', () => {
      br.init();
      const event = new CustomEvent(`${namespace}SearchCallback`);
      const options = { goToFirstResult: false };
      br.searchView.handleSearchCallback(event, { results: resultWithScript, options });

      expect(br.searchView.dom.searchNavigation.parent().html()).not.toContain('<script>alert(1);</script>');
    });

    describe('Click events handlers', () => {
      it('triggers custom event when toggling side menu', () => {
        br.init();
        let eventNameTriggered = '';
        br.trigger = (eventName) => eventNameTriggered = eventName;

        expect(eventNameTriggered).toBeFalsy();
        br.searchView.toggleSidebar();
        expect(eventNameTriggered).toEqual('ToggleSearchMenu');
      });
      it('triggers custom event when closing navbar', () => {
        br.init();
        let eventNameTriggered = '';
        br.trigger = (eventName) => eventNameTriggered = eventName;

        expect(eventNameTriggered).toBeFalsy();
        br.searchView.clearSearchFieldAndResults();
        expect(eventNameTriggered).toEqual('SearchResultsCleared');
      });
    });
  });
});
