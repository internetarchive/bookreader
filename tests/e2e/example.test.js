/* global fixture */
import { Selector } from 'testcafe';

fixture`Tests page interactions`.page('http://localhost:8000/BookReaderDemo/demo-simple.html');

test('Clicking flip right button flips page and updates location', async (t) => {
  await t.click('.book_right');
  await t.expect((await Selector('img[src$="page003.jpg"]')).visible).ok();
});
