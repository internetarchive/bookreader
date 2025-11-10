import { ClientFunction, Selector } from 'testcafe';

const PAGE_FLIP_WAIT_TIME = 1000;

const getHash = ClientFunction(() => document.location.hash);
const getUrl = ClientFunction(() => window.location.href);

/**
 * Check URL page parameter in # and path
 */
const isPageInUrl = ClientFunction(() => {
  const hash = document.location.hash;
  if (hash) {
    return hash.indexOf('#page/') > -1;
  } else {
    return window.location.href.indexOf('/page/') > -1;
  }
});

/**
 * Check URL mode parameter in # and path
 *
 * @param mode '1up', '2up', 'thumb'
 */
const isModeInUrl = ClientFunction((mode) => {
  const hash = document.location.hash;
  if (hash) {
    return hash.indexOf('/mode/' + mode) > -1;
  } else {
    return window.location.href.indexOf('/mode/' + mode) > -1;
  }
});

/**
 * Runs all expected base tests for BookReader
 *
 * @param { import('../models/BookReader').default } br - Model
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

    await t.expect(nav.goLeft.visible).ok();
    await t.expect(nav.goRight.visible).ok();
    await t.expect(nav.mode1Up.visible).ok();
    await t.expect(nav.mode2Up.visible).ok();
    await t.expect(nav.modeThumb.visible).ok();
    await t.expect(nav.zoomIn.visible).ok();
    await t.expect(nav.zoomOut.visible).ok();
    await t.expect(nav.fullScreen.visible).ok();
  });

  test("Canonical URL has no initial parameters", async t => {
    // Initial URL has no params
    await t.expect(getHash()).eql('');
    // Initial URL has no page/ mode/
    await t.expect(getUrl()).notContains('#page/');
    await t.expect(getUrl()).notContains('/page/');
    await t.expect(getUrl()).notContains('/mode/');
  });

  // Need to disable page caching to have cookies persist in test
  test.disablePageCaching('Canonical URL shows parameters if cookie set', async t => {
    const { nav } = br;

    // Check if uses plugin.resume.js
    const usesResume = ClientFunction(() => {
      const hasResumePlugin = typeof(br.plugins.resume) !== "undefined";
      const hasResumeValue = hasResumePlugin ? br.plugins.resume.getResumeValue() : false;
      return hasResumeValue;
    });

    // Store initial URL
    const initialUrl = await getUrl();

    // Set Cookie by page navigation, wait for cookie
    await t.click(nav.goNext);
    await t.wait(PAGE_FLIP_WAIT_TIME);

    // reload canonical URL, wait for URL change
    await t.navigateTo(initialUrl);
    await t.wait(PAGE_FLIP_WAIT_TIME);

    if (await usesResume()) {
      await t.expect(isPageInUrl()).eql(true, initialUrl);
      await t.expect(isModeInUrl('2up')).eql(true, initialUrl);
    } else {
      // No plugin, no br-resume cookie
      await t.expect(getUrl()).notContains('#page/');
      await t.expect(getUrl()).notContains('/page/');
      await t.expect(getUrl()).notContains('/mode/');
    }
  });

  test('2up mode - Clicking `Previous page` changes the page', async t => {
    const { nav, BRcontainer} = br;

    // Go to next page, so we can go previous if at front cover
    await t.click(nav.goNext);
    await t.wait(PAGE_FLIP_WAIT_TIME);
    await t.click(nav.goNext);
    await t.wait(PAGE_FLIP_WAIT_TIME);

    const onLoadBrState = BRcontainer.child(0);
    const initialImages = onLoadBrState.find('img');
    const origImg1Src = await initialImages.nth(0).getAttribute('src');
    const origImg2Src = await initialImages.nth(-1).getAttribute('src');

    await t.click(nav.goPrev);
    await t.wait(PAGE_FLIP_WAIT_TIME);

    const nextBrState = Selector('.BRcontainer').child(0);
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
  });

  test('2up mode - Clicking `Next page` changes the page', async t => {
    // Note: this will fail on a R to L book if at front cover
    const { nav, BRcontainer} = br;
    // Flip away from cover
    await t.click(nav.goNext);
    await t.wait(PAGE_FLIP_WAIT_TIME);

    const onLoadBrState = BRcontainer.child(0);
    const initialImages = onLoadBrState.find('img');
    const origImg1Src = await initialImages.nth(0).getAttribute('src');
    const origImg2Src = await initialImages.nth(-1).getAttribute('src');

    await t.click(nav.goNext);
    await t.wait(PAGE_FLIP_WAIT_TIME);

    const nextBrState = Selector('.BRcontainer').child(0);
    const nextImages = nextBrState.find('img');
    const nextImg1Src = await nextImages.nth(0).getAttribute('src');
    const nextImg2Src = await nextImages.nth(-1).getAttribute('src');

    // we are showing new pages
    await t.expect(nextImg1Src).notEql(origImg1Src);
    await t.expect(nextImg1Src).notEql(origImg2Src);
    await t.expect(nextImg2Src).notEql(origImg1Src);
    await t.expect(nextImg2Src).notEql(origImg2Src);

    // we aren't showing the same image in the new pages
    await t.expect(nextImg1Src).notEql(nextImg2Src);
  });

  test('Clicking `page flip buttons` updates location', async t => {
    const { nav } = br;
    // Page navigation creates params
    await t.click(nav.goNext);
    await t.expect(isPageInUrl()).eql(true);
    await t.expect(isModeInUrl('2up')).eql(true);

    await t.click(nav.goPrev);
    await t.expect(isPageInUrl()).eql(true);
    await t.expect(isModeInUrl('2up')).eql(true);
  });

  test('Clicking `2 page view` brings up cur page + caching', async t => {
    const { nav } = br;
    await t.click(nav.mode2Up);
    await t.expect(Selector('.BRpagecontainer.BRpage-visible').count).eql(1);
    await t.expect(Selector('.BRpagecontainer').count).eql(3);
  });

  test('Clicking `1 page view` brings up 1 at a time', async t => {
    const { nav } = br;
    await t.click(nav.mode1Up);

    // Flip away from cover
    await t.click(nav.goNext);
    await t.wait(PAGE_FLIP_WAIT_TIME);

    // we usually pre-fetch the page in question & the 2 after it
    await t.expect(Selector('.BRpagecontainer').count).gte(3);
  });

  test('Clicking `thumbnail view` brings up all of the page thumbnails', async t => {
    const { nav } = br;
    await t.click(nav.modeThumb);
    await t.expect(Selector('.BRpagecontainer').count).gte(3);
  });

  test('Clicking `zoom out` makes book smaller', async t => {
    const { nav } = br;
    const page = Selector('.BRpagecontainer.BRpage-visible');

    await t.expect(br.BRcontainer.visible).ok();
    await t.expect(page.visible).ok();
    await t.expect(nav.zoomOut.visible).ok();

    const initialBookHeight = await page.getBoundingClientRectProperty('height');
    const initialBookWidth = await page.getBoundingClientRectProperty('width');

    await t.click(nav.zoomOut);

    const zoomOutBookHeight = await page.getBoundingClientRectProperty('height');
    const zoomOutBookWidth = await page.getBoundingClientRectProperty('width');

    await t.expect(zoomOutBookHeight).lt(initialBookHeight);
    await t.expect(zoomOutBookWidth).lt(initialBookWidth);
  });

  test('Clicking `zoom in` makes book larger', async t => {
    const { nav } = br;
    const page = Selector('.BRpagecontainer.BRpage-visible');

    await t.expect(br.BRcontainer.visible).ok();
    await t.expect(page.visible).ok();
    await t.expect(nav.zoomIn.visible).ok();

    const initialBookHeight = await page.getBoundingClientRectProperty('height');
    const initialBookWidth = await page.getBoundingClientRectProperty('width');

    await t.click(nav.zoomIn);

    const zoomInBookHeight = await page.getBoundingClientRectProperty('height');
    const zoomIntBookWidth = await page.getBoundingClientRectProperty('width');

    await t.expect(zoomInBookHeight).gt(initialBookHeight);
    await t.expect(zoomIntBookWidth).gt(initialBookWidth);
  });

  test('Clicking `full screen button` and BookReader fills browser window', async (t) => {
    const { nav, BRcontainer } = br;
    const windowWidth = await ClientFunction(() => window.innerWidth)();

    // initial in-page
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).lte(windowWidth);
    await t.click(nav.fullScreen);
    // full screen
    const width = await BRcontainer.getBoundingClientRectProperty('width');
    // Apparently it can be fractional?
    await t.expect(Math.ceil(width)).eql(windowWidth);
    await t.click(nav.fullScreen);
    // in-page
    await t.expect(BRcontainer.getBoundingClientRectProperty('width')).lte(windowWidth);
  });
}
