import {
  html,
  fixture,
  expect,
  oneEvent,
} from '@open-wc/testing';
import sinon from 'sinon';
import { IABookSearchResults } from '../../../../src/BookNavigator/menu-panels/search/search-results.js';
customElements.define('ia-book-search-results', IABookSearchResults);

const container = (results = [], query = '') => (
  html`<ia-book-search-results .results=${results} .query=${query}></ia-book-search-results>`
);

console.log("ia-book-search-results-test")

const searchQuery = 'Bristol';

const results = [{
  text: `In the drawing of caricatures and cartoons\u2014or any other com' mercial art, for that matter\u2014the artist should know something about the processes of reproduction for that particular form of art work. For pen and ink work the engraving is made on a sine printing plate. It is not necessary, however, to know all about these processes of reproduction. The artist should know that all work intended for line rqproducttons should be made on white paper or {{{${searchQuery}}}} Board with black drawing ink. The drawing to be reproduced is photographed on a chemically treated sine plate, which is then treated with acid. This acid eats away the surface of the sine, except the photographed' lines, which are left in relief, somewhat like printing type. Colored inks do not photograph well; neither does black ink on colored paper.`,
  cover: '//placehold.it/30x44',
  title: 'Book title',
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

describe('<ia-book-search-results>', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('sets default properties', async () => {
    const query = 'bristol';
    const el = await fixture(container(results, query));

    expect(el.results).to.equal(results);
    expect(el.query).to.equal(query);
  });

  it('sets results when passed in via event object', async () => {
    const el = await fixture(container());

    el.setResults({ detail: { results } });
    expect(el.results).to.equal(results);
  });

  it('listens for a custom search callback event on the document', async () => {
    IABookSearchResults.prototype.setResults = sinon.fake();
    const el = await fixture(container());
    const event = new Event('BookReader:SearchCallback');

    event.detail = { results };
    document.dispatchEvent(event);
    expect(el.setResults.callCount).to.equal(1);
    expect(el.setResults.firstArg).to.equal(event);
  });

  it('renders results that contain the book title', async () => {
    sinon.replace(IABookSearchResults.prototype, 'createRenderRoot', function createRenderRoot() { return this; });
    const el = await fixture(container(results));

    expect(el.innerHTML).to.include(`${results[0].title}`);
  });

  it('renders results that contain a highlighted match', async () => {
    sinon.replace(IABookSearchResults.prototype, 'createRenderRoot', function createRenderRoot() { return this; });
    const el = await fixture(container(results));

    expect(el.innerHTML).to.include(`<mark>${searchQuery}</mark>`);
  });

  it('renders results that contain an optional cover image', async () => {
    sinon.replace(IABookSearchResults.prototype, 'createRenderRoot', function createRenderRoot() { return this; });
    const el = await fixture(container(results));

    expect(el.innerHTML).to.include(`<img src="${results[0].cover}">`);
  });

  it('sets a query prop when search input receives input', async () => {
    const el = await fixture(container(results));
    const searchInput = el.shadowRoot.querySelector('[name="query"]');

    searchInput.value = searchQuery;
    searchInput.dispatchEvent(new Event('keyup'));

    expect(el.query).to.equal(searchQuery);
  });

  it('emits a custom event when search form submitted when input is populated', async () => {
    const el = await fixture(container(results));

    setTimeout(() => {
      const form = el.shadowRoot.querySelector('form');
      form.querySelector('input').value = 'foo';
      form.dispatchEvent(new Event('submit'));
    });
    const response = await oneEvent(el, 'bookSearchInitiated');

    expect(response).to.exist;
  });

  it('uses a singular noun when one result given', async () => {
    const el = await fixture(container([results[0]]));
    const resultsCount = await fixture(el.resultsCount);

    expect(resultsCount.innerHTML).to.include('1 result');
  });

  it('can render header with active options count', async () => {
    const el = await fixture(container(results));
    el.renderHeader = true;

    await el.updateComplete;

    expect(el.shadowRoot.querySelector('header p').innerText).to.include('2');
  });

  it('renders search all files checkbox when enabled', async () => {
    const el = await fixture(container(results));
    el.renderSearchAllFiles = true;

    await el.updateComplete;

    expect(el.shadowRoot.querySelector('[name="all_files"]')).to.not.be.null;
  });

  it('emits a resultSelected event when a search result is clicked', async () => {
    const el = await fixture(container(results));

    setTimeout(() => (
      el.shadowRoot.querySelector('book-search-result').querySelector('li').click()
    ));
    const response = await oneEvent(el, 'resultSelected');

    expect(response).to.exist;
  });

  it('emits a closeMenu event when a search result is clicked', async () => {
    const el = await fixture(container(results));

    setTimeout(() => (
      el.shadowRoot.querySelector('book-search-result').querySelector('li').click()
    ));
    const response = await oneEvent(el, 'closeMenu');

    expect(response).to.exist;
  });

  describe('Search results placeholders', () => {
    it('renders a loading state when queryInProgress is true', async () => {
      const el = await fixture(container(results));

      el.queryInProgress = true;
      await el.updateComplete;

      expect(el.shadowRoot.querySelector('.loading')).to.not.be.null;
    });
    it('renders an error message when provided', async () => {
      const el = await fixture(container([]));
      const message = 'Sample error message';
      el.errorMessage = message;
      await el.updateComplete;

      expect(el.shadowRoot.querySelector('.error-message')).to.exist;
      expect(el.shadowRoot.querySelector('.search-cta')).to.be.null;
    });
    it('displays call to search when no results or search errors are showing', async () => {
      const el = await fixture(container([]));

      expect(el.shadowRoot.querySelector('.search-cta')).to.exist;
      expect(el.shadowRoot.querySelector('.error-message')).to.be.null;
      expect(el.shadowRoot.querySelector('.results')).to.be.null;
    });
  });

  it('displays results images when told to', async () => {
    const el = await fixture(container(results));
    el.displayResultImages = true;
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('.results.show-image')).to.exist;
  });

  describe('search input focus', () => {
    it('will always try to re-focus once the component updates', async () => {
      const el = await fixture(container(results));
      el.focusOnInputIfNecessary = sinon.fake();
      // update any property to fire lifecycle
      el.results = [];
      await el.updateComplete;

      expect(el.focusOnInputIfNecessary.callCount).to.equal(1);
    });
    it('refocuses on input when results are empty', async () => {
      const el = await fixture(container(results));
      el.results = [];
      await el.updateComplete;

      const searchInputField = el.shadowRoot.querySelector('input[type=\'search\']');
      expect(searchInputField).to.equal(el.shadowRoot.activeElement);
    });
  });

  // it("emits a bookSearchCanceled event when loading state's cancel action clicked", async () => {
  //   const el = await fixture(container(results));

  //   el.queryInProgress = true;
  //   await el.updateComplete;

  //   setTimeout(() => (
  //     el.shadowRoot.querySelector('button').click()
  //   ));
  //   const response = await oneEvent(el, 'bookSearchCanceled');

  //   expect(response).to.exist;
  // });
});
