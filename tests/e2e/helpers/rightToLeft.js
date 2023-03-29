import { ClientFunction } from 'testcafe';
const getPageUrl = ClientFunction(() => window.location.href);

export function runRightToLeftTests (br) {
  test('Right to Left - correct initialization in two-page view', async t => {
    const { nav, BRcontainer} = br;
    await t.click(nav.desktop.mode2Up);

    //checking right leaf edge is not in tree
    await t.expect(BRcontainer.find('.br-mode-2up__leafs--left').count).eql(1);
    await t.expect(BRcontainer.find('.br-mode-2up__leafs--right').count).eql(0);

    //checks slider is in correct position
    await t.expect(nav.desktop.sliderRange.getStyleProperty('width')).eql('0px');
  });

  test('Right to Left - assuring flipping left goes to next page', async t => {
    const { nav } = br;
    await t.click(nav.desktop.mode2Up);
    await t.click(nav.desktop.goLeft);
    await t.expect(getPageUrl()).match(/page\/n1/);
  });
}
