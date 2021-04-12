import { ClientFunction } from 'testcafe';
const getPageUrl = ClientFunction(() => window.location.href);

export function runRightToLeftTests (br) {
  test('Right to Left - correct initialization in two-page view', async t => {
    const { nav, BRcontainer} = br;
    await t.click(nav.desktop.mode2Up);

    //checking right leaf edge has 0 width
    await t.expect(BRcontainer.find('.BRleafEdgeR').getStyleProperty('width')).eql('0px');

    //checking empty page before the cover is more to the left than the first page
    const rightEmptyPage = BRcontainer.find('.BRpagecontainer.BRemptypage');
    const leftPage = BRcontainer.find('.BRpagecontainer.pagediv0');
    const leftPageLDistance = leftPage.getBoundingClientRectProperty('left');
    const rightPageLDistance = rightEmptyPage.getBoundingClientRectProperty('left');
    await t.expect(rightPageLDistance).gt(await leftPageLDistance);

    //checks slider is in correct position
    await t.expect(nav.desktop.sliderRange.getStyleProperty('width')).eql('0px');
  });

  test('Right to Left - assuring flipping left goes to next page', async t => {
    const { nav } = br;
    await t.click(nav.desktop.mode2Up);
    await t.click(nav.desktop.goLeft);
    await t.expect(getPageUrl()).match(/page\/n2/);
  });
}
