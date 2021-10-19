import { ClientFunction } from 'testcafe';
import params from './helpers/params';

const getLocationHref = ClientFunction(() => window.location.href.toString());
const FLIP_SPEED = 1000;
const FIRST_PAGE_DELAY = 2000;

fixture `Autoplay plugin`.page `${params.baseUrl}/BookReaderDemo/demo-autoplay.html`;

test('page auto-advances after allotted flip speed and delay', async t => {
  await t.wait(2 * FLIP_SPEED + FIRST_PAGE_DELAY);
  await t.expect(getLocationHref()).match(/page\/n3/);
});
