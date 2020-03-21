import { ClientFunction, Selector } from 'testcafe';

/**
 * Runs all expected base tests for BookReader
 *
 * @param { BookReader } BR - Model
 */
export function runBaseTests (BR) {
  test('On load, pages fit fully inside of the BookReader™', async t => {
    await t.expect(BR.shell.visible).ok();
    await t.expect(BR.BRcontainer.visible).ok();

    const shellHeight = await BR.shell.getBoundingClientRectProperty('height');
    const bookHeight = await BR.BRcontainer.getBoundingClientRectProperty('height');
    await t.expect(bookHeight).lte(shellHeight, 'images do not get cropped vertically');

    const shellWidth = await BR.shell.getBoundingClientRectProperty('width');
    const bookWidth = await BR.BRcontainer.getBoundingClientRectProperty('width');
    await t.expect(bookWidth).lte(shellWidth, 'images do not get cropped horizontally');
  });

  test('Nav menu displays properly', async t => {
    const { Nav } = BR;

    await t.expect(Nav.desktop.goPrevious.visible).ok();
    await t.expect(Nav.desktop.goNext.visible).ok();
    await t.expect(Nav.desktop.mode1Up.visible).ok();
    await t.expect(Nav.desktop.mode2Up.visible).ok();
    await t.expect(Nav.desktop.modeThumb.visible).ok();
    await t.expect(Nav.desktop.zoomIn.visible).ok();
    await t.expect(Nav.desktop.zoomOut.visible).ok();
    await t.expect(Nav.desktop.fullScreen.visible).ok();
  });

  test('2up mode - Clicking `Previous page` changes the page', async t => {
    const { Nav, BRcontainer} = BR;
    // await t.click(Nav.desktop.mode1Up);

    const onLoadBR = BRcontainer.child(0);
    const initialImages = onLoadBR.child('img');
    const origImg1Src = await initialImages.nth(0).getAttribute('src');
    const origImg2Src = await initialImages.nth(-1).getAttribute('src');

    const previousButton = Nav.desktop.goPrevious;
    await t.click(previousButton);
    await t.wait( 5000 ); // wait for animation and page flip to happen

    const nextBrState = await Selector('.BRcontainer').child(0);
    const prevImages = nextBrState.child('img');
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
    const { Nav, BRcontainer} = BR;
    // await t.click(Nav.desktop.mode1Up);

    const onLoadBR = BRcontainer.child(0);
    const initialImages = onLoadBR.child('img');
    const origImg1Src = await initialImages.nth(0).getAttribute('src');
    const origImg2Src = await initialImages.nth(-1).getAttribute('src');

    const nextButton = Nav.desktop.goNext;
    await t.click(nextButton);
    await t.wait( 5000 ); // wait for animation and page flip to happen

    const nextBrState = await Selector('.BRcontainer').child(0);
    const nextImages = nextBrState.child('img');
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
    const { Nav } = BR;
    await t.click(Nav.desktop.mode2Up);
    const twoPageContainer = await Selector('.BRtwopageview');
    await t.expect(twoPageContainer.visible).ok();
    const images = twoPageContainer.find('img.BRpageimage');
    await t.expect(images.count).eql(2);
  });

  test('Clicking `1 page view` brings up 1 at a time', async t => {
    const { Nav } = BR;
    await t.click(Nav.desktop.mode1Up);
    const onePageViewContainer = await Selector('.BRpageview');
    await t.expect(onePageViewContainer.visible).ok();
    const images = onePageViewContainer.find('.BRpagediv1up');
    // we usually pre-fetch the page in question & the 2 after it
    await t.expect(images.count).gte(3);
  });

  test('Clicking `thumbnail view` brings up all of the page thumbnails', async t => {
    const { Nav } = BR;
    await t.click(Nav.desktop.modeThumb);
    const thumbnailContainer = await Selector('.BRpageview');
    await t.expect(thumbnailContainer.visible).ok();
    const images = thumbnailContainer.find('.BRpagedivthumb');
    await t.expect(images.count).gt(0);
  });

  test('Clicking `zoom out` makes book smaller', async t => {
    const { Nav, BRcontainer } = BR
    const book = BRcontainer.child(0);
    const zoomOutButton = Nav.desktop.zoomOut;

    await t.expect(BR.BRcontainer.visible).ok();
    await t.expect(book.visible).ok();
    await t.expect(zoomOutButton.visible).ok();

    const initialBookHeight = await book.getBoundingClientRectProperty('height');
    const initialBookWidth = await book.getBoundingClientRectProperty('width');

    await t.click(zoomOutButton);

    const zoomOutBookHeight = await book.getBoundingClientRectProperty('height');
    const zoomOutBookWidth = await book.getBoundingClientRectProperty('width');

    await t.expect(zoomOutBookHeight).lte(initialBookHeight);
    await t.expect(zoomOutBookWidth).lte(initialBookWidth);
  });

  test('Clicking `zoom in` makes book larger', async t => {
    const { Nav, BRcontainer } = BR

    const book = await BRcontainer.child(0);
    const zoomInButton = Nav.desktop.zoomIn;

    await t.expect(BRcontainer.visible).ok();
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
    const { Nav, BRcontainer } = BR; 
    const fullScreenToggle = Nav.desktop.fullScreen;
    const windowWidth = await ClientFunction(() => window.innerWidth)();

    // initial in-page
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).lte(windowWidth);
    await t.click(fullScreenToggle);
    // full screen
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).eql(windowWidth);
    await t.click(fullScreenToggle);
    // in-page
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).lte(windowWidth);
  });  
}
