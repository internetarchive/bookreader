import { ClientFunction } from 'testcafe';
const getPageUrl = ClientFunction(() => window.location.href);


export function runRightToLeftTests (br) {
  test.only('Right to Left - correct initialization in two-page view', async t => {
    const { nav, BRcontainer} = br;
    await t.click(nav.desktop.mode2Up);
    await t.expect(BRcontainer.find('.BRleafEdgeR').getStyleProperty('width')).eql('0px');
    const rightPage = BRcontainer.find('.BRpagecontainer.BRemptypage.pagediv-1');
    const leftPage = BRcontainer.find('.BRpagecontainer.pagediv0');
    const leftPageLDistance = leftPage.getBoundingClientRectProperty('left');
    await t.expect(rightPage.getBoundingClientRectProperty('left')).gt(leftPageLDistance);
    //await t.expect(leftPageLDistance).typeOf("number");




  });

  test.only('Right to Left - assuring flipping left goes to next page', async t => {
    const { nav } = br;
    await t.click(nav.desktop.mode2Up);
    await t.click(nav.desktop.goPrevious);
    await t.expect(getPageUrl()).match(/page\/n2/);

  });
}