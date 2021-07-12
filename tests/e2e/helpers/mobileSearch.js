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
      await t.resizeWindowToFitDevice('Sony Xperia Z', {portraitOrientation: true});
      const nav = br.nav.mobile;

      //opening side menu and search
      await t.expect(nav.hamburgerButton.visible).ok();
      await t.click(nav.hamburgerButton);
      await t.expect(nav.menuSearchButton.visible).ok();
      await t.click(nav.menuSearchButton);

      //assuring that the search bar is enabled
      await t.expect(nav.searchBox.visible).ok();

      //testing successful search
      await t
        .selectText(nav.searchBox.find('[name="query"]'))
        .pressKey('delete');
      await t
        .typeText(nav.searchBox.find('[name="query"]'), TEST_TEXT_FOUND)
        .pressKey('enter');
      await t.expect(nav.searchResults.visible).ok();
      await t.expect(nav.searchResultText.exists).ok();
      await t.expect(nav.searchResultText.innerText).contains(TEST_TEXT_FOUND);

      //checking url
      const getPageUrl = ClientFunction(() => window.location.href);
      await t.expect(getPageUrl()).contains(TEST_TEXT_FOUND);

      //checks clicking on first search result opens correct page
      await t.click(nav.searchResults.child(0));
      await t.expect(getPageUrl()).contains(PAGE_FIRST_RESULT);

      //checks highlight on result page is visible
      const highlight = br.shell.find(".searchHiliteLayer rect");
      await t.expect(highlight.visible).ok();

      await t.maximizeWindow();
    });

  test
    .requestHooks(mockNotFound)('Mobile search - unsuccessful search', async t => {
      await t.resizeWindowToFitDevice('Sony Xperia Z', {portraitOrientation: true});
      const nav = br.nav.mobile;

      //opening side menu and search
      await t.expect(nav.hamburgerButton.visible).ok();
      await t.click(nav.hamburgerButton);
      await t.expect(nav.menuSearchButton.visible).ok();
      await t.click(nav.menuSearchButton);

      //assuring that the search bar is enabled
      await t.expect(nav.searchBox.visible).ok();

      //testing unsuccessful search
      await t
        .selectText(nav.searchBox.find('[name="query"]'))
        .pressKey('delete');
      await t
        .typeText(nav.searchBox.find('[name="query"]'), TEST_TEXT_NOT_FOUND)
        .pressKey('enter');
      await t.expect(nav.searchResultText.withText(TEST_TEXT_NOT_FOUND).exists).notOk();

      //checking url
      const getPageUrl = ClientFunction(() => window.location.href.toString());
      await t.expect(getPageUrl()).contains(TEST_TEXT_NOT_FOUND);
      await t.maximizeWindow();
    });

}
