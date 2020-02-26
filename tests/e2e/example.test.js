/* global fixture */
import { ClientFunction, Selector } from 'testcafe';

fixture`Tests page interactions`.page('http://localhost:8000/BookReaderDemo/demo-simple.html');

test('Nav menu displays properly', async t => {
  await t.expect((await Selector('.BRfooter')).visible).ok();
  await t.expect((await Selector('.BRicon.book_left')).visible).ok();
  await t.expect((await Selector('.BRicon.book_right')).visible).ok();
  await t.expect((await Selector('.BRicon.onepg')).visible).ok();
  await t.expect((await Selector('.BRicon.twopg')).visible).ok();
  await t.expect((await Selector('.BRicon.thumb')).visible).ok();
  await t.expect((await Selector('.BRicon.zoom_in')).visible).ok();
  await t.expect((await Selector('.BRicon.zoom_out')).visible).ok();
  await t.expect((await Selector('.BRicon.full')).visible).ok();
});

test('Clicking `page flip buttons` changes pages and updates location', async t => {
  const flipRight = await Selector('.book_right');
  const flipLeft = await Selector('.book_left');
  await t.click(flipRight);
  await t.expect((await Selector('img[src$="page002.jpg"]')).visible).ok();
  await t.expect((await Selector('img[src$="page003.jpg"]')).visible).ok();
  await t.click(flipLeft);
  await t.expect((await Selector('img[src$="page001.jpg"]')).visible).ok();
  await t.expect((await Selector('img[src$="transparent.png"]')).visible).ok();
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
})