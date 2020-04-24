import { ClientFunction, Selector } from 'testcafe';

const PAGE_FLIP_WAIT_TIME = 1000;

/**
 * Runs all expected base tests for BookReader
 *
 * @param { BookReader } br - Model
 */
export function runBaseTests (br) {
  test('On load, pages fit fully inside of the BookReader™', async t => {
    await t.expect(br.shell.visible).ok();
    await t.expect(br.BRcontainer.visible).ok();

    const shellHeight = await br.shell.getBoundingClientRectProperty('height');
    const bookHeight = await br.BRcontainer.getBoundingClientRectProperty('height');
    await t.expect(bookHeight).lte(shellHeight, 'images do not get cropped vertically');

    const shellWidth = await br.shell.getBoundingClientRectProperty('width');
    const bookWidth = await br.BRcontainer.getBoundingClientRectProperty('width');
    await t.expect(bookWidth).lte(shellWidth, 'images do not get cropped horizontally');
  });

  test('nav menu displays properly', async t => {
    const { nav } = br;

    await t.expect(nav.desktop.goPrevious.visible).ok();
    await t.expect(nav.desktop.goNext.visible).ok();
    await t.expect(nav.desktop.mode1Up.visible).ok();
    await t.expect(nav.desktop.mode2Up.visible).ok();
    await t.expect(nav.desktop.modeThumb.visible).ok();
    await t.expect(nav.desktop.zoomIn.visible).ok();
    await t.expect(nav.desktop.zoomOut.visible).ok();
    await t.expect(nav.desktop.fullScreen.visible).ok();
  });

  test('2up mode - Clicking `Previous page` changes the page', async t => {
    const { nav, BRcontainer} = br;
    const onLoadBrState = BRcontainer.child(0);
    const initialImages = onLoadBrState.find('img');
    const origImg1Src = await initialImages.nth(0).getAttribute('src');
    const origImg2Src = await initialImages.nth(-1).getAttribute('src');

    await t.click(nav.desktop.goPrevious);
    await t.wait(PAGE_FLIP_WAIT_TIME); // wait for animation and page flip to happen

    const nextBrState = await Selector('.BRcontainer').child(0);
    const prevImages = nextBrState.find('img');
    const prevImg1Src = await prevImages.nth(0).getAttribute('src');
    const prevImg2Src = await prevImages.nth(-1).getAttribute('src');

    // we aren't showing the same image in both leaves
    await t.expect(origImg1Src).notEql(origImg2Src);

    // we are showing new pages
    await t.expect(prevImg1Src).notEql(origImg1Src);
    await t.expect(prevImg1Src).notEql(origImg2Src);
    await t.expect(prevImg2Src).notEql(origImg1Src);
    await t.expect(prevImg2Src).notEql(origImg2Src);

    // we aren't showing the same image in the new pages
    await t.expect(prevImg1Src).notEql(prevImg2Src);
  })

  test('2up mode - Clicking `Next page` changes the page', async t => {
    const { nav, BRcontainer} = br;
    const onLoadBrState = BRcontainer.child(0);
    const initialImages = onLoadBrState.find('img');
    const origImg1Src = await initialImages.nth(0).getAttribute('src');
    const origImg2Src = await initialImages.nth(-1).getAttribute('src');

    await t.click(nav.desktop.goNext);
    await t.wait(PAGE_FLIP_WAIT_TIME); // wait for animation and page flip to happen

    const nextBrState = await Selector('.BRcontainer').child(0);
    const nextImages = nextBrState.find('img');
    const nextImg1Src = await nextImages.nth(0).getAttribute('src');
    const nextImg2Src = await nextImages.nth(-1).getAttribute('src');

    // we aren't showing the same image in both leaves
    await t.expect(origImg1Src).notEql(origImg2Src);

    // we are showing new pages
    await t.expect(nextImg1Src).notEql(origImg1Src);
    await t.expect(nextImg1Src).notEql(origImg2Src);
    await t.expect(nextImg2Src).notEql(origImg1Src);
    await t.expect(nextImg2Src).notEql(origImg2Src);

    // we aren't showing the same image in the new pages
    await t.expect(nextImg1Src).notEql(nextImg2Src);
  })

  test('Clicking `2 page view` brings up 2 pages at a time', async t => {
    const { nav } = br;
    await t.click(nav.desktop.mode2Up);
    const twoPageContainer = await Selector('.BRtwopageview');
    await t.expect(twoPageContainer.visible).ok();
    const images = twoPageContainer.find('img.BRpageimage');
    await t.expect(images.count).eql(2);
  });

  test('Clicking `1 page view` brings up 1 at a time', async t => {
    const { nav } = br;
    await t.click(nav.desktop.mode1Up);
    const onePageViewContainer = await Selector('.BRpageview');
    await t.expect(onePageViewContainer.visible).ok();
    const images = onePageViewContainer.find('.BRmode1up');
    // we usually pre-fetch the page in question & the 2 after it
    await t.expect(images.count).gte(3);
  });

  test('Clicking `thumbnail view` brings up all of the page thumbnails', async t => {
    const { nav } = br;
    await t.click(nav.desktop.modeThumb);
    const thumbnailContainer = await Selector('.BRpageview');
    await t.expect(thumbnailContainer.visible).ok();
    const images = thumbnailContainer.find('.BRmodethumb');
    await t.expect(images.count).gt(0);
  });

  test('Clicking `zoom out` makes book smaller', async t => {
    const { nav, BRcontainer } = br;
    const book = BRcontainer.child(0);

    await t.expect(br.BRcontainer.visible).ok();
    await t.expect(book.visible).ok();
    await t.expect(nav.desktop.zoomOut.visible).ok();

    const initialBookHeight = await book.getBoundingClientRectProperty('height');
    const initialBookWidth = await book.getBoundingClientRectProperty('width');

    await t.click(nav.desktop.zoomOut);

    const zoomOutBookHeight = await book.getBoundingClientRectProperty('height');
    const zoomOutBookWidth = await book.getBoundingClientRectProperty('width');

    await t.expect(zoomOutBookHeight).lte(initialBookHeight);
    await t.expect(zoomOutBookWidth).lte(initialBookWidth);
  });

  test('Clicking `zoom in` makes book larger', async t => {
    const { nav, BRcontainer } = br;

    const book = await BRcontainer.child(0);

    await t.expect(BRcontainer.visible).ok();
    await t.expect(book.visible).ok();
    await t.expect(nav.desktop.zoomIn.visible).ok();

    const initialBookHeight = await book.getBoundingClientRectProperty('height');
    const initialBookWidth = await book.getBoundingClientRectProperty('width');

    await t.click(nav.desktop.zoomIn);

    const zoomInBookHeight = await book.getBoundingClientRectProperty('height');
    const zoomIntBookWidth = await book.getBoundingClientRectProperty('width');

    await t.expect(zoomInBookHeight).gt(initialBookHeight);
    await t.expect(zoomIntBookWidth).gt(initialBookWidth);
  });

  test('Clicking `full screen button` and BookReader fills browser window', async (t) => {
    const { nav, BRcontainer } = br;
    const windowWidth = await ClientFunction(() => window.innerWidth)();

    // initial in-page
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).lte(windowWidth);
    await t.click(nav.desktop.fullScreen);
    // full screen
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).eql(windowWidth);
    await t.click(nav.desktop.fullScreen);
    // in-page
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).lte(windowWidth);
  });  
}
