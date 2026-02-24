import { ClientFunction, RequestMock } from 'testcafe';
import { SEARCH_INSIDE_URL_RE , mockResponseFound, mockResponseNotFound,
  TEST_TEXT_FOUND, TEST_TEXT_NOT_FOUND, PAGE_FIRST_RESULT, SEARCH_MATCHES_LENGTH } from './mockSearch';


/**
 * @param { import('../models/BookReader').default } br - Model
 */
export function runSearchTests(br) {
  //building mock response  for successful and unsuccessful search
  const mockFound = RequestMock()
    .onRequestTo(SEARCH_INSIDE_URL_RE )
    .respond(mockResponseFound, 202);

  const mockNotFound = RequestMock()
    .onRequestTo(SEARCH_INSIDE_URL_RE )
    .respond(mockResponseNotFound, 202);


  test
    .requestHooks(mockFound)('Search - successful search', async t => {
      const nav = br.nav;

      //assuring that the search bar is enabled
      await t.expect(nav.searchBox.visible).notOk();
      await t.expect(nav.searchIcon.visible).ok();
      await t.click(nav.searchIcon);
      // await t.expect(nav.searchBox.visible).ok();

      //testing search for a word found in the book
      await t.selectText(nav.searchBox).pressKey('delete');
      await t.typeText(nav.searchBox, TEST_TEXT_FOUND);
      await t.pressKey('enter');

      await t.expect(nav.searchPin.exists).ok();
      await t.expect(nav.searchPin.child('.BRquery').child('main').exists).ok();
      await t.expect(nav.searchPin.child('.BRquery').child('main').innerText).contains(TEST_TEXT_FOUND);
      await t.expect(nav.searchNavigation.exists).ok();
      await t.expect(nav.searchNavigation.find('[data-id="resultsCount"]').exists).ok();
      await t.expect(nav.searchNavigation.find('[data-id="resultsCount"]').innerText).contains(SEARCH_MATCHES_LENGTH);

      //checking url
      const getPageUrl = ClientFunction(() => window.location.href.toString());
      await t.expect(getPageUrl()).contains(TEST_TEXT_FOUND);

      //checks clicking on first search pin opens correct page
      await t.click(nav.searchPin);
      await t.expect(getPageUrl()).contains(PAGE_FIRST_RESULT);

      //checks highlight on result page is visible
      const highlight = br.shell.find(".searchHiliteLayer rect");
      await t.expect(highlight.visible).ok();

    });


  test
    .requestHooks(mockNotFound)('Search - unsuccessful search', async t => {
      const nav = br.nav;

      //assuring that the search bar is enabled
      await t.expect(nav.searchBox.visible).notOk();
      await t.expect(nav.searchIcon.visible).ok();
      await t.click(nav.searchIcon);
      await t.expect(nav.searchBox.visible).ok();

      //testing search for a word not found in the book
      await t.selectText(nav.searchBox).pressKey('delete');
      await t.typeText(nav.searchBox, TEST_TEXT_NOT_FOUND);
      await t.pressKey('enter');
      await t.expect(nav.searchPin.child('.BRquery').child('main').withText(TEST_TEXT_NOT_FOUND).exists).notOk();

      const getPageUrl = ClientFunction(() => window.location.href.toString());
      await t.expect(getPageUrl()).contains(TEST_TEXT_NOT_FOUND);
    });


}
