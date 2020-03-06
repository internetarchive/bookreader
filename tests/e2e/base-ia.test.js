/* global fixture */
import { ClientFunction, Selector } from 'testcafe';

// Uses same plugins as archive.org
fixture `Tests IA BookReader interactions`.page('http://localhost:8000/BookReaderDemo/demo-ia-plato.html');

test('On load, pages fit fully inside of the BookReader™', async t => {
  const brShell = await Selector('.BookReader');
  const brContainer = await brShell('.BRcontainer');

  await t.expect(brShell.visible).ok();
  await t.expect(brContainer.visible).ok();

  const shellHeight = await brShell.getBoundingClientRectProperty('height');
  const bookHeight = await brContainer.getBoundingClientRectProperty('height');
  await t.expect(bookHeight).lte(shellHeight, 'images do not get cropped vertically');

  const shellWidth = await brShell.getBoundingClientRectProperty('width');
  const bookWidth = await brContainer.getBoundingClientRectProperty('width');
  await t.expect(bookWidth).lte(shellWidth, 'images do not get cropped horizontally');
});

test('Nav menu displays properly', async t => {  
  await t.expect((await Selector('.BRfooter')).visible).ok();
  await t.expect((await Selector('.BRicon.book_left')).visible).ok();
  await t.expect((await Selector('.BRicon.book_right')).visible).ok();
  await t.expect((await Selector('.BRicon.onepg')).visible).ok();
  await t.expect((await Selector('.BRicon.twopg')).visible).ok();
  await t.expect((await Selector('.BRicon.thumb')).visible).ok();
  // Need .desktop-only class as blank zoom buttons in mobile menu
  await t.expect((await Selector('.BRicon.zoom_in.desktop-only')).visible).ok();
  await t.expect((await Selector('.BRicon.zoom_out.desktop-only')).visible).ok();
  await t.expect((await Selector('.BRicon.full')).visible).ok();
});

// Need to disable page caching to have cookies persist in test
test.disablePageCaching('Clicking `page flip buttons` updates location', async t => {
  const hash = ClientFunction(() => document.location.hash);
  const flipRight = await Selector('.book_right');
  const flipLeft = await Selector('.book_left');
  // No hash
  await t.expect(hash()).eql('');
  // Page navigation creates hash
  await t.click(flipRight);
  await t.expect(hash()).contains('#page/n');
  await t.expect(hash()).contains('/mode/2up');
  await t.click(flipLeft);
  await t.expect(hash()).contains('#page/n');
  await t.expect(hash()).contains('/mode/2up');
  // Cookie set by page navigation creates hash on navigate to canonical URL
  await t.navigateTo('demo-ia-plato.html');
  await t.expect(hash()).contains('#page/n');
  await t.expect(hash()).contains('/mode/2up');
});

test('Clicking `2 page view` brings up 2 pages at a time', async t => {
  const twoPageViewToggle = await Selector('.BRicon.twopg');
  await t.click(twoPageViewToggle);
  const twoPageContainer = await Selector('.BRtwopageview');
  await t.expect(twoPageContainer.visible).ok();
  const images = twoPageContainer.find('img.BRpageimage');
  await t.expect(images.count).eql(2);
});

test('Clicking `1 page view` brings up 1 at a time', async t => {
  const onePageViewToggle = await Selector('.BRicon.onepg');
  await t.click(onePageViewToggle);
  const onePageViewContainer = await Selector('.BRpageview');
  await t.expect(onePageViewContainer.visible).ok();
  const images = onePageViewContainer.find('.BRpagediv1up');
  // we pre-fetch the page in question & the 2 after it
  await t.expect(images.count).eql(3);
});

test('Clicking `thumbnail view` brings up all of the page thumbnails', async t => {
  const thumbnailViewToggle = await Selector('.BRicon.thumb');
  await t.click(thumbnailViewToggle);
  const thumbnailContainer = await Selector('.BRpageview');
  await t.expect(thumbnailContainer.visible).ok();
  const images = thumbnailContainer.find('.BRpagedivthumb');
  await t.expect(images.count).gt(0);
});

test('Clicking `zoom out` makes book smaller', async t => {
  const brContainer = await Selector('.BRcontainer');
  const book = await brContainer.child(0);
  const zoomOutButton = await Selector('.BRicon.zoom_out.desktop-only');

  await t.expect(brContainer.visible).ok();
  await t.expect(book.visible).ok();
  await t.expect(zoomOutButton.visible).ok();

  const initialBookHeight = await book.getBoundingClientRectProperty('height');
  const initialBookWidth = await book.getBoundingClientRectProperty('width');

  await t.click(zoomOutButton);

  const zoomOutBookHeight = await book.getBoundingClientRectProperty('height');
  const zoomOutBookWidth = await book.getBoundingClientRectProperty('width');

  await t.expect(zoomOutBookHeight).lt(initialBookHeight);
  await t.expect(zoomOutBookWidth).lt(initialBookWidth);
});

test('Clicking `zoom in` makes book larger', async t => {
  const brContainer = await Selector('.BRcontainer');
  const book = await brContainer.child(0);
  const zoomInButton = await Selector('.BRicon.zoom_in.desktop-only');

  await t.expect(brContainer.visible).ok();
  await t.expect(book.visible).ok();
  await t.expect(zoomInButton.visible).ok();

  const initialBookHeight = await book.getBoundingClientRectProperty('height');
  const initialBookWidth = await book.getBoundingClientRectProperty('width');

  await t.click(zoomInButton);

  const zoomInBookHeight = await book.getBoundingClientRectProperty('height');
  const zoomIntBookWidth = await book.getBoundingClientRectProperty('width');

  await t.expect(zoomInBookHeight).gt(initialBookHeight);
  await t.expect(zoomIntBookWidth).gt(initialBookWidth);
});

test('Clicking `full screen button` and BookReader fills browser window', async (t) => {
  const brContainer = await Selector('.BRcontainer');
  const fullScreenToggle = await Selector('.BRicon.full');
  const windowWidth = await ClientFunction(() => window.innerWidth)();

  // initial in-page
  await t.expect(brContainer.getBoundingClientRectProperty('width')).lt(windowWidth);
  await t.click(fullScreenToggle);
  // full screen
  await t.expect(brContainer.getBoundingClientRectProperty('width')).eql(windowWidth);
  await t.click(fullScreenToggle);
  // in-page
  await t.expect(brContainer.getBoundingClientRectProperty('width')).lt(windowWidth);
});
