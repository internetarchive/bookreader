import { ClientFunction } from 'testcafe';
import params from './helpers/params.js';

const getLocationHref = ClientFunction(() => window.location.href.toString());
const FLIP_SPEED = 200;
const FLIP_DELAY = 500;

fixture `Autoplay plugin`.page `${params.baseUrl}/BookReaderDemo/demo-internetarchive.html?ocaid=goody&autoflip=1&flipSpeed=${FLIP_SPEED}&flipDelay=${FLIP_DELAY}`;

test('page auto-advances after allotted flip speed and delay', async t => {
  // Flips from cover, to #page/n1 to #page/n3, etc
  await t.expect(getLocationHref()).notMatch(/page\/n\d+/);
  await t.wait(2 * (FLIP_SPEED + FLIP_DELAY) + 500);
  // Don't check for a specific page; initial load time can vary
  await t.expect(getLocationHref()).match(/page\/n\d+/);
});
