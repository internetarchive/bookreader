import { ClientFunction } from 'testcafe';

const { BASE_URL } = process.env;
const getLocationHref = ClientFunction(() => window.location.href.toString());
const FLIP_SPEED = 1000;
const FIRST_PAGE_DELAY = 1500;
const FLIP_DELAY = 2000;

fixture `Autoplay plugin`.page `${BASE_URL}demo-autoplay.html`;

test('page auto-advances after allotted flip speed and delay', async t => {
  await t.wait(2 * FLIP_SPEED + FIRST_PAGE_DELAY);
  await t.expect(getLocationHref()).match(/page\/n3/);
});
