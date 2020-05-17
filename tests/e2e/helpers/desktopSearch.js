import { ClientFunction, Selector } from 'testcafe';

export function runDesktopSearchTests(br) {
  test('testing text search', async t => {
    const { nav } = br;
    const testText = 'theory';
    const testTextNotFound = 'xcjnierjnieunenojrns';
    await t.expect(br.shell.visible).ok();
    await t.expect(br.BRcontainer.visible).ok();

    //assuring that the search bar is enabled
    const searchBox = nav.topNavShell.find('.BRbooksearch.desktop');
    const querySign=nav.bottomNavShell.find('.BRquery');
    await t.expect(searchBox.exists).ok();
    await t.expect(searchBox.visible).ok();
    
    //testing search for a word found in the book
    await t.typeText(searchBox.child('.BRsearchInput'), testText);
    await t.click((searchBox).child('.BRsearchSubmit'));
    await t.expect(querySign.exists).ok({timeout:30000});
    await t.expect(querySign.child('div').exists).ok();
    await t.expect(querySign.child('div').innerText).contains(testText);

    //testing search for a word not found in the book
    await t
      .selectText(searchBox.child('.BRsearchInput'))
      .pressKey('delete');
    await t.typeText(searchBox.child('.BRsearchInput'), testTextNotFound);
    await t.click((searchBox).child('.BRsearchSubmit'));
    await t.expect(querySign.exists).notOk({timeout:40000});
  });
}
