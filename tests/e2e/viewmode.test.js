import { Selector } from 'testcafe';
import BookReader from './models/BookReader.js';
import params from './helpers/params.js';

const ocaids = params.ocaids || ['goody'];

ocaids.forEach(ocaid => {
  const url = params.getArchiveUrl(ocaid);

  fixture`Viewmode carousel`.page`${url}`;

  test('Clicking `view mode` cycles through view modes', async t => {
    const { nav } = (new BookReader());

    // viewmode button only appear on mobile devices
    await t.resizeWindow(400, 800);

    // reload the page to reset viewmode
    await t.eval(() => location.reload(true));

    try {
      // Flip forward one
      await t.pressKey('right');
      await t.pressKey('right');
      await t.pressKey('right');

      // 1up to 2up
      await t.click(nav.viewmode);
      const twoPageContainer = Selector('.BRmode2up');
      await t.expect(twoPageContainer.visible).ok();
      const twoPageImages = twoPageContainer.find('img.BRpageimage');
      await t.expect(twoPageImages.count).gte(2);

      // 2up to thumb
      await t.click(nav.viewmode);
      const thumbnailContainer = Selector('.BRmodeThumb');
      await t.expect(thumbnailContainer.visible).ok();
      const thumbImages = thumbnailContainer.find('.BRpageview img');
      await t.expect(thumbImages.count).gt(0);

      // thumb to 1up
      await t.click(nav.viewmode);
      const onePageViewContainer = Selector('br-mode-1up');
      await t.expect(onePageViewContainer.visible).ok();
      const onePageImages = onePageViewContainer.find('.BRmode1up .BRpagecontainer');
      // we usually pre-fetch the page in question & 1 before/after it
      await t.expect(onePageImages.count).gte(2);
    } finally {
      // reset window size
      await t.resizeWindow(1024, 768);
    }
  });
});
