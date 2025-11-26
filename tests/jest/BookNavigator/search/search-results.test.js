import {
  html,
  fixture,
  oneEvent,
} from '@open-wc/testing-helpers';
import sinon from 'sinon';
import { IABookSearchResults } from '@/src/BookNavigator/search/search-results.js';
import { marshallSearchResults } from '@/src/plugins/search/utils.js';

const container = (results = [], query = '') => (
  html`<ia-book-search-results .results=${results} .query=${query}></ia-book-search-results>`
);

const searchQuery = 'Bristol';

const results = [{
  text: `In the drawing of caricatures and cartoons\u2014or any other com' mercial art, for that matter\u2014the artist should know something about the processes of reproduction for that particular form of art work. For pen and ink work the engraving is made on a sine printing plate. It is not necessary, however, to know all about these processes of reproduction. The artist should know that all work intended for line rqproducttons should be made on white paper or {{{${searchQuery}}}} Board with black drawing ink. The drawing to be reproduced is photographed on a chemically treated sine plate, which is then treated with acid. This acid eats away the surface of the sine, except the photographed' lines, which are left in relief, somewhat like printing type. Colored inks do not photograph well; neither does black ink on colored paper.`,
  cover: '//placehold.it/30x44',
  title: 'Book title',
  displayPageNumber: 'Page 24',
  par: [{
    boxes: [{
      r: 2672, b: 792, t: 689, page: 24, l: 2424,
    }],
    b: 1371,
    t: 689,
    page_width: 3658,
    r: 3192,
    l: 428,
    page_height: 5357,
    page: 24,
  }],
}, {
  text: `Drawings intended for sale should be made on a good grade of {{{${searchQuery}}}} Board, and a margin left all the way around the drawings. They should be mailed flat, and'require first class postage. Enclose postage for the return of the drawings. Only send good drawings of a reason- able quantity. Enclose a neat and terse letter to the one you are sending the drawings to, written with pen and ink or typewriter if possible, on`,
  displayPageNumber: 'Page 86',
  par: [{
    boxes: [{
      r: 698, b: 4460, t: 4324, page: 86, l: 450,
    }],
    b: 4938,
    t: 4207,
    page_width: 3658,
    r: 3196,
    l: 432,
    page_height: 5357,
    page: 86,
  }],
}];

marshallSearchResults({ matches: results }, () => '', '{{{', '}}}');

const resultWithScript = [{
  text: `foo bar <script>const msg = 'test' + ' failure'; document.write(msg);</script> {{{${searchQuery}}}} baz`,
  cover: '//placehold.it/30x44',
  title: 'Book title',
  displayPageNumber: 'Page 24',
  par: [{
    boxes: [{
      r: 2672, b: 792, t: 689, page: 24, l: 2424,
    }],
    b: 1371,
    t: 689,
    page_width: 3658,
    r: 3192,
    l: 428,
    page_height: 5357,
    page: 24,
  }],
}];

marshallSearchResults({ matches: resultWithScript }, () => '', '{{{', '}}}');

describe('<ia-book-search-results>', () => {
  afterEach(() => {
    sinon.restore();
  });

  test('sets default properties', async () => {
    const query = 'bristol';
    const el = await fixture(container(results, query));

    expect(el.results).toEqual(results);
    expect(el.query).toEqual(query);
  });

  test('sets results when passed in via event object', async () => {
    const el = await fixture(container());

    el.setResults({ detail: { results } });
    expect(el.results).toEqual(results);
  });

  test('listens for a custom search callback event on the document', async () => {
    IABookSearchResults.prototype.setResults = sinon.fake();
    const el = await fixture(container());
    const event = new Event('BookReader:SearchCallback');

    event.detail = { results };
    document.dispatchEvent(event);
    expect(el.setResults.callCount).toEqual(1);
    expect(el.setResults.firstArg).toEqual(event);
  });

  test('renders results that contain a highlighted match', async () => {
    sinon.replace(IABookSearchResults.prototype, 'createRenderRoot', function createRenderRoot() { return this; });
    const el = await fixture(container(results));

    // Lit inserts HTML comments that inhibit searching for exact innerHTML matches.
    // So query the DOM for the match instead.
    const match = el.querySelector('mark');
    expect(match?.textContent).toEqual(searchQuery);
  });

  test('renders results that contain sanitized HTML tags', async () => {
    sinon.replace(IABookSearchResults.prototype, 'createRenderRoot', function createRenderRoot() { return this; });
    // A result whose text contains a <script> tag that will insert 'test failure' into the element if not sanitized
    const el = await fixture(container(resultWithScript));

    const match = el.querySelector('mark');
    expect(match?.textContent).toEqual(searchQuery);
    expect(el.innerHTML).not.toContain('test failure');
  });

  test('sets a query prop when search input receives input', async () => {
    const el = await fixture(container(results));
    const searchInput = el.shadowRoot.querySelector('[name="query"]');

    searchInput.value = searchQuery;
    searchInput.dispatchEvent(new Event('keyup'));

    expect(el.query).toEqual(searchQuery);
  });

  test('emits a custom event when search form submitted when input is populated', async () => {
    const el = await fixture(container(results));

    setTimeout(() => {
      const form = el.shadowRoot.querySelector('form');
      form.querySelector('input').value = 'foo';
      form.dispatchEvent(new Event('submit'));
    });
    const response = await oneEvent(el, 'bookSearchInitiated');

    expect(response).toBeDefined();
  });

  test('uses a singular noun when one result given', async () => {
    const el = await fixture(container([results[0]]));
    expect(el.resultsCount).toBe('1 result');
  });

  test('can render header with active options count', async () => {
    const el = await fixture(container(results));
    el.renderHeader = true;

    await el.updateComplete;

    expect(el.shadowRoot.querySelector('header').textContent).toContain('2');
  });

  test('renders search all files checkbox when enabled', async () => {
    const el = await fixture(container(results));
    el.renderSearchAllFiles = true;

    await el.updateComplete;

    expect(el.shadowRoot.querySelector('[name="all_files"]')).not.toBeNull();
  });

  test('emits a resultSelected event when a search result is clicked', async () => {
    const el = await fixture(container(results));

    setTimeout(() => (
      el.shadowRoot.querySelector('.result-item').click()
    ));
    const response = await oneEvent(el, 'resultSelected');

    expect(response).toBeDefined();
  });

  test('emits a closeMenu event when a search result is clicked', async () => {
    const el = await fixture(container(results));

    setTimeout(() => (
      el.shadowRoot.querySelector('.result-item').click()
    ));
    const response = await oneEvent(el, 'closeMenu');

    expect(response).toBeDefined();
  });

  describe('Search results placeholders', () => {
    test('renders a loading state when queryInProgress is true', async () => {
      const el = await fixture(container(results));

      el.queryInProgress = true;
      await el.updateComplete;

      expect(el.shadowRoot.querySelector('.loading')).not.toBeNull();
    });
    test('renders an error message when provided', async () => {
      const el = await fixture(container([]));
      const message = 'Sample error message';
      el.errorMessage = message;
      await el.updateComplete;

      expect(el.shadowRoot.querySelector('.error-message')).toBeDefined();
      expect(el.shadowRoot.querySelector('.search-cta').classList.contains('sr-only')).toBe(true);
    });
    test('displays call to search when no results or search errors are showing', async () => {
      const el = await fixture(container([]));

      expect(el.shadowRoot.querySelector('.search-cta').classList.contains('sr-only')).toBe(false);
      expect(el.shadowRoot.querySelector('.error-message')).toBeNull();
      expect(el.shadowRoot.querySelector('.results')).toBeNull();
    });
  });

  describe('search input focus', () => {
    test('will always try to re-focus once the component updates', async () => {
      const el = await fixture(container(results));
      el.focusOnInputIfNecessary = sinon.fake();
      // update any property to fire lifecycle
      el.results = [];
      await el.updateComplete;

      expect(el.focusOnInputIfNecessary.callCount).toEqual(1);
    });
    test('refocuses on input when results are empty', async () => {
      const el = await fixture(container(results));
      el.results = [];
      await el.updateComplete;

      const searchInputField = el.shadowRoot.querySelector('input[type=\'search\']');
      expect(searchInputField).toEqual(el.shadowRoot.activeElement);
    });
  });

  test("emits a bookSearchCanceled event when loading state's cancel action clicked", async () => {
    const el = await fixture(container(results));

    el.queryInProgress = true;
    await el.updateComplete;

    setTimeout(() => (
      el.shadowRoot.querySelector('button').click()
    ));
    const response = await oneEvent(el, 'bookSearchCanceled');

    expect(response).toBeDefined();
  });
  it('cancels search when input is cleared', async () => {
    const el = await fixture(container(results));

    el.cancelSearch = sinon.fake();
    await el.updateComplete;

    const searchInput = el.shadowRoot.querySelector('[name="query"]');

    searchInput.value = '';
    searchInput.dispatchEvent(new Event('search'));

    expect(el.cancelSearch.callCount).toEqual(1);
  });
});
