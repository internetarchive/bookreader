export function runRightToLeftTests (br) {
  test('Right to Left - correct initialization in two-page view', async t => {
    const { nav, BRcontainer} = br;
    await t.click(nav.desktop.mode2Up);
    await t.expect(br.BRcontainer.find('.BRleafEdgeR').getStyleProperty('width')).eql('0px')

  });
}