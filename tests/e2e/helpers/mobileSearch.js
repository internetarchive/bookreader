import { ClientFunction, RequestMock } from 'testcafe';
import { SEARCH_INSIDE_URL_RE , mockResponseFound, mockResponseNotFound,
  TEST_TEXT_FOUND, TEST_TEXT_NOT_FOUND, PAGE_FIRST_RESULT } from './mockSearch';


export function runMobileSearchTests(br) {
  //building mock response  for successful and unsuccessful search
  const mockFound = RequestMock()
    .onRequestTo(SEARCH_INSIDE_URL_RE )
    .respond(mockResponseFound, 202);

  const mockNotFound = RequestMock()
    .onRequestTo(SEARCH_INSIDE_URL_RE )
    .respond(mockResponseNotFound, 202);

  test
    .requestHooks(mockFound)('Mobile search - successful search', async t => {
      await t.resizeWindowToFitDevice('Sony Xperia Z', {portraitOrientation: true})
      const nav = br.nav;

      //opening side menu and search
      await t.expect(nav.mobile.hamburgerButton.visible).ok();
      await t.click(nav.mobile.hamburgerButton);
      await t.expect(nav.mobile.menuSearchButton.visible).ok();
      await t.click(nav.mobile.menuSearchButton);

      //assuring that the search bar is enabled
      await t.expect(nav.mobile.searchBox.visible).ok();

      //testing successful search
      await t
        .selectText(nav.mobile.searchBox.child('.BRsearchInput'))
        .pressKey('delete');
      await t.typeText(nav.mobile.searchBox.child('.BRsearchInput'), TEST_TEXT_FOUND);
      await t.click((nav.mobile.searchBox).child('.BRsearchSubmit'));
      await t.expect(nav.mobile.searchResults.visible).ok();
      await t.expect(nav.mobile.searchResultText.exists).ok();
      await t.expect(nav.mobile.searchResultText.innerText).contains(TEST_TEXT_FOUND);

      //checking url
      const getPageUrl = ClientFunction(() => window.location.href);
      await t.expect(getPageUrl()).contains(TEST_TEXT_FOUND);

      //checks clicking on first search result opens correct page
      await t.click(nav.mobile.searchResults);
      await t.expect(getPageUrl()).contains(PAGE_FIRST_RESULT);

      await t.maximizeWindow();
    });

  test
    .requestHooks(mockNotFound)('Mobile search - unsuccessful search', async t => {
      await t.resizeWindowToFitDevice('Sony Xperia Z', {portraitOrientation: true})
      const nav = br.nav;

      //opening side menu and search
      await t.expect(nav.mobile.hamburgerButton.visible).ok();
      await t.click(nav.mobile.hamburgerButton);
      await t.expect(nav.mobile.menuSearchButton.visible).ok();
      await t.click(nav.mobile.menuSearchButton);

      //assuring that the search bar is enabled
      await t.expect(nav.mobile.searchBox.visible).ok();

      //testing unsuccessful search
      await t
        .selectText(nav.mobile.searchBox.child('.BRsearchInput'))
        .pressKey('delete');
      await t.typeText(nav.mobile.searchBox.child('.BRsearchInput'), TEST_TEXT_NOT_FOUND);
      await t.click((nav.mobile.searchBox).child('.BRsearchSubmit'));
      await t.expect(nav.mobile.searchResultText.withText(TEST_TEXT_NOT_FOUND).exists).notOk();

      //checking url
      const getPageUrl = ClientFunction(() => window.location.href.toString());
      await t.expect(getPageUrl()).contains(TEST_TEXT_NOT_FOUND);
      await t.maximizeWindow();
    });

}