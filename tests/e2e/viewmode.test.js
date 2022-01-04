// import { Selector } from 'testcafe';
// import BookReader from './models/BookReader';
// import params from './helpers/params';

// fixture `Viewmode carousel`.page `${params.baseUrl}/BookReaderDemo/viewmode-cycle.html`;

// test('Clicking `view mode` cycles through view modes', async t => {
//   const { nav } = (new BookReader());

//   // viewmode button only appear on mobile devices
//   await t.resizeWindow(400, 800);
//   // Flip forward one
//   await t.pressKey('right');

//   // 2up to thumb
//   await t.click(nav.desktop.viewmode);
//   const thumbnailContainer = Selector('.BRmodeThumb');
//   await t.expect(thumbnailContainer.visible).ok();
//   const thumbImages = thumbnailContainer.find('.BRpageview img');
//   await t.expect(thumbImages.count).gt(0);

//   // thumb to 1up
//   await t.click(nav.desktop.viewmode);
//   const onePageViewContainer = Selector('br-mode-1up');
//   await t.expect(onePageViewContainer.visible).ok();
//   const onePageImages = onePageViewContainer.find('.BRmode1up .BRpagecontainer');
//   // we usually pre-fetch the page in question & 1 before/after it
//   await t.expect(onePageImages.count).gte(3);

//   // 1up to 2up
//   await t.click(nav.desktop.viewmode);
//   const twoPageContainer = Selector('.BRtwopageview');
//   await t.expect(twoPageContainer.visible).ok();
//   const twoPageImages = twoPageContainer.find('img.BRpageimage');
//   await t.expect(twoPageImages.count).gte(2);
// });
