export function runDesktopSearchTests(br) {
  test('Desktop search - succesful search', async t => {
    const { nav } = br;
    const testTextFound = 'theory';
    await t.expect(br.shell.visible).ok();
    await t.expect(br.BRcontainer.visible).ok();

    //assuring that the search bar is enabled
    await t.expect(nav.desktop.searchBox.exists).ok();
    await t.expect(nav.desktop.searchBox.visible).ok();

    //testing search for a word found in the book
    await t
      .selectText(nav.desktop.searchBox.child('.BRsearchInput'))
      .pressKey('delete');
    await t.typeText(nav.desktop.searchBox.child('.BRsearchInput'), testTextFound);
    await t.click((nav.desktop.searchBox).child('.BRsearchSubmit'));
    await t.expect(nav.desktop.querySign.exists).ok({timeout:30000});
    await t.expect(nav.desktop.querySign.child('div').exists).ok();
    await t.expect(nav.desktop.querySign.child('div').innerText).contains(testTextFound);
  });

  test('Desktop search - unsuccesful search', async t => {
    const { nav } = br;
    const testTextNotFound = 'xcjnierjnieunenojrnskz';
    await t.expect(br.shell.visible).ok();
    await t.expect(br.BRcontainer.visible).ok();

    //assuring that the search bar is enabled
    await t.expect(nav.desktop.searchBox.exists).ok();
    await t.expect(nav.desktop.searchBox.visible).ok();

    //testing search for a word not found in the book
    await t
      .selectText(nav.desktop.searchBox.child('.BRsearchInput'))
      .pressKey('delete');
    await t.typeText(nav.desktop.searchBox.child('.BRsearchInput'), testTextNotFound);
    await t.click((nav.desktop.searchBox).child('.BRsearchSubmit'));
    await t.expect(nav.desktop.querySign.child('div').withText(testTextNotFound).exists).notOk({timeout:40000});

  });
}
