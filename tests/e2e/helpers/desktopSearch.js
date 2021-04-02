import { ClientFunction, RequestMock } from 'testcafe';
import { SEARCH_INSIDE_URL_RE , mockResponseFound, mockResponseNotFound,
  TEST_TEXT_FOUND, TEST_TEXT_NOT_FOUND, PAGE_FIRST_RESULT, SEARCH_MATCHES_LENGTH } from './mockSearch';


export function runDesktopSearchTests(br) {
  //building mock response  for successful and unsuccessful search
  const mockFound = RequestMock()
    .onRequestTo(SEARCH_INSIDE_URL_RE )
    .respond(mockResponseFound, 202);

  const mockNotFound = RequestMock()
    .onRequestTo(SEARCH_INSIDE_URL_RE )
    .respond(mockResponseNotFound, 202);


  test
    .requestHooks(mockFound)('Desktop search - successful search', async t => {
      const nav = br.nav;

      //assuring that the search bar is enabled
      await t.expect(nav.desktop.searchBox.visible).ok();

      //testing search for a word found in the book
      await t
        .selectText(nav.desktop.searchBox.child('.BRsearchInput'))
        .pressKey('delete');
      await t.typeText(nav.desktop.searchBox.child('.BRsearchInput'), TEST_TEXT_FOUND);
      await t.click((nav.desktop.searchBox).child('.BRsearchSubmit'));
      await t.expect(nav.desktop.searchPin.exists).ok();
      await t.expect(nav.desktop.searchPin.child('.BRquery').child('div').exists).ok();
      await t.expect(nav.desktop.searchPin.child('.BRquery').child('div').innerText).contains(TEST_TEXT_FOUND);
      await t.expect(nav.desktop.searchNavigation.exists).ok();
      await t.expect(nav.desktop.searchNavigation.find('[data-id="resultsCount"]').exists).ok();
      await t.expect(nav.desktop.searchNavigation.find('[data-id="resultsCount"]').innerText).contains(SEARCH_MATCHES_LENGTH);

      //checking url
      const getPageUrl = ClientFunction(() => window.location.href.toString());
      await t.expect(getPageUrl()).contains(TEST_TEXT_FOUND);

      //checks clicking on first search pin opens correct page
      await t.click(nav.desktop.searchPin);
      await t.expect(getPageUrl()).contains(PAGE_FIRST_RESULT);

      //checks highlight on result page is visible
      const highlight = br.shell.find(".BookReaderSearchHilite");
      await t.expect(highlight.visible).ok();

    });


  test
    .requestHooks(mockNotFound)('Desktop search - unsuccessful search', async t => {
      const nav = br.nav;

      //assuring that the search bar is enabled
      await t.expect(nav.desktop.searchBox.visible).ok();

      //testing search for a word not found in the book
      await t
        .selectText(nav.desktop.searchBox.child('.BRsearchInput'))
        .pressKey('delete');
      await t.typeText(nav.desktop.searchBox.child('.BRsearchInput'), TEST_TEXT_NOT_FOUND);
      await t.click((nav.desktop.searchBox).child('.BRsearchSubmit'));
      await t.expect(nav.desktop.searchPin.child('.BRquery').child('div').withText(TEST_TEXT_NOT_FOUND).exists).notOk();

      const getPageUrl = ClientFunction(() => window.location.href.toString());
      await t.expect(getPageUrl()).contains(TEST_TEXT_NOT_FOUND);
    });


}
