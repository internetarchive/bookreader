import { ClientFunction } from 'testcafe';
import BookReader from './models/BookReader';
import { LOCAL_URL } from './constants';

const getLocationHref = ClientFunction(() => window.location.href.toString());
const FLIP_SPEED = 1000;
const FLIP_DELAY = 2000;

fixture `Autoplay plugin`.page `${LOCAL_URL}demo-autoplay.html`;

test('page auto-advances after allotted flip speed and delay', async t => {
  await t.wait(FLIP_SPEED + FLIP_DELAY);
  await t.expect(getLocationHref()).match(/page\/n3/);
});
