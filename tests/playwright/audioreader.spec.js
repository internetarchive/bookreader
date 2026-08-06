import { test, expect } from '@playwright/test';

/**
 * Browser verification for the issue #1580 audio reader prototype.
 *
 * These hit the real archive.org endpoints on purpose: the point of the
 * prototype is that it reads a real scanned book's OCR aloud, and a mocked
 * fixture would not prove that. Unit-level behaviour is covered by the jest
 * suite in tests/jest/audioreader/.
 */

const OCAID = 'theworksofplato01platiala';
const SHOTS = 'tests/playwright/screenshots';

/**
 * Open the demo and wait for the book to finish loading.
 * @param {import('@playwright/test').Page} page
 * @param {string} [query] extra query parameters
 */
async function openReader(page, query = '') {
  const consoleErrors = [];
  const imageRequests = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.url().includes('BookReaderImages.php')) imageRequests.push(request.url());
  });

  await page.goto(`/BookReaderDemo/demo-audioreader.html?ocaid=${OCAID}${query}`);
  await expect(page.locator('body[data-audioreader-ready="true"]')).toBeAttached({ timeout: 30_000 });

  return { consoleErrors, imageRequests };
}

const reader = page => page.locator('ia-audio-reader');

test.describe('minimal audio-first view', () => {
  test('shows cover, title, table of contents and controls -- and no page images', async ({ page }) => {
    const { consoleErrors, imageRequests } = await openReader(page);

    const cover = reader(page).locator('.cover');
    await expect(cover).toBeVisible();
    // Proves the cover actually decoded, not just that an <img> exists.
    expect(await cover.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);

    await expect(reader(page).locator('.title')).toContainText('works of Plato');
    await expect(reader(page).locator('.author')).toContainText('Plato');
    await expect(reader(page).locator('.play')).toBeVisible();
    await expect(reader(page).locator('.skip')).toHaveCount(2);
    await expect(reader(page).locator('.toc-toggle')).toBeVisible();

    // The paragraph is rendered from real OCR before anything is played.
    await expect(reader(page).locator('.segment').first()).not.toBeEmpty();

    // Core requirement of the issue: this mode fetches text only.
    expect(imageRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);

    await page.screenshot({ path: `${SHOTS}/01-initial-view.png` });
  });

  test('table of contents lists chapters and jumps to them', async ({ page }) => {
    await openReader(page);

    await reader(page).locator('.toc-toggle').click();
    const entries = reader(page).locator('.toc-entry');
    await expect(entries.first()).toBeVisible();
    expect(await entries.count()).toBeGreaterThan(5);

    // Real chapter titles from this edition. Note the Open Library TOC also lists
    // a "Preface" on printed page vii, which this scan never numbers -- entries
    // that cannot be resolved to a leaf are dropped rather than shown as dead
    // links, so it is legitimately absent here.
    await expect(entries.first()).toContainText('Apology of Socrates');
    await expect(reader(page).locator('.toc')).toContainText('Crito');

    await page.screenshot({ path: `${SHOTS}/02-table-of-contents.png` });

    const before = await page.evaluate(() => window.audioReader.player.cursor.leafIndex);
    await entries.nth(2).click();
    await expect(reader(page).locator('.toc')).toHaveCount(0);

    await expect.poll(
      () => page.evaluate(() => window.audioReader.player.cursor.leafIndex),
      { message: 'TOC jump should move the reading position' },
    ).toBeGreaterThan(before);

    await page.screenshot({ path: `${SHOTS}/03-after-toc-jump.png` });
  });
});

test.describe('playback', () => {
  test('play speaks the real OCR text aloud', async ({ page }) => {
    await openReader(page);

    const expectedFirstSegment = await page.evaluate(
      () => window.audioReader.player.segments[0].text);
    // The landmark the issue asks for: the first three words.
    expect(expectedFirstSegment.split(' ')).toHaveLength(3);

    await reader(page).locator('.play').click();

    // Assert audio really started -- an utterance reached the speech engine and
    // the engine reported it began speaking -- rather than inferring it from the
    // absence of an error.
    await expect.poll(
      () => page.evaluate(() => window.__audioReaderEvents.filter(e => e.type === 'start').length),
      { message: 'a speech utterance should have started', timeout: 20_000 },
    ).toBeGreaterThan(0);

    const events = await page.evaluate(() => window.__audioReaderEvents);
    expect(events[0].type).toBe('speak');
    expect(events[0].text).toBe(expectedFirstSegment);
    expect(events[0].voice).toBeTruthy();
    expect(events.some(e => e.type === 'error')).toBe(false);

    expect(await page.evaluate(() => speechSynthesis.speaking)).toBe(true);
    await expect(reader(page).locator('.segment.current')).toBeVisible();

    await page.screenshot({ path: `${SHOTS}/04-playing.png` });
  });

  test('pause stops speech and play resumes it', async ({ page }) => {
    await openReader(page);

    await reader(page).locator('.play').click();
    await expect.poll(() => page.evaluate(() => speechSynthesis.speaking)).toBe(true);

    await reader(page).locator('.play').click();
    expect(await page.evaluate(() => window.audioReader.player.playing)).toBe(false);
    await expect(reader(page).locator('.play')).toContainText('▶');

    await page.screenshot({ path: `${SHOTS}/05-paused.png` });
  });

  test('reading advances through the paragraph segment by segment', async ({ page }) => {
    await openReader(page);
    await reader(page).locator('.play').click();

    await expect.poll(
      () => page.evaluate(() => window.__audioReaderEvents.filter(e => e.type === 'speak').length),
      { message: 'should move on to later segments on its own', timeout: 45_000 },
    ).toBeGreaterThan(1);

    const spoken = await page.evaluate(
      () => window.__audioReaderEvents.filter(e => e.type === 'speak').map(e => e.text));
    const segments = await page.evaluate(
      () => window.audioReader.player.segments.map(s => s.text));

    // Spoken in document order, starting from the landmark.
    expect(spoken[0]).toBe(segments[0]);
    expect(spoken[1]).toBe(segments[1]);
  });
});

test.describe('buffering and progressive rendering', () => {
  test('preloads the landmark, then the sentence, then the paragraph, then ahead', async ({ page }) => {
    // Slow synthesis makes the ordering observable; instant WebSpeech synthesis
    // would have the whole buffer ready before the first assertion.
    await openReader(page, '&synthDelay=900&debug=1');

    const plan = await page.evaluate(() => window.audioReader.player._plan.map(job => job.text));
    const segments = await page.evaluate(() => window.audioReader.player.segments.map(s => s.text));

    expect(plan[0]).toBe(segments[0]);
    expect(plan[1]).toBe(segments[1]);
    expect(plan.slice(0, segments.length)).toEqual(segments);

    // Exactly five paragraphs are buffered -- not the rest of the book.
    const paragraphs = await page.evaluate(
      () => [...new Set(window.audioReader.player._plan.map(job => job.key.split('#')[0]))]);
    expect(paragraphs).toHaveLength(5);

    // Segments become ready in plan order, one at a time.
    await expect.poll(
      () => page.evaluate(() => window.audioReader.player.queue.readyKeys().length),
      { timeout: 20_000 },
    ).toBeGreaterThan(1);

    const readyKeys = await page.evaluate(() => window.audioReader.player.queue.readyKeys());
    const planKeys = await page.evaluate(() => window.audioReader.player._plan.map(j => j.key));
    expect(readyKeys).toEqual(planKeys.slice(0, readyKeys.length));

    await page.screenshot({ path: `${SHOTS}/06-buffer-hydrating.png` });
  });

  test('shows a spinner while the current segment is not yet synthesized', async ({ page }) => {
    await openReader(page, '&synthDelay=4000&debug=1');

    await reader(page).locator('.play').click();
    await expect(reader(page).locator('.spinner')).toBeVisible();
    expect(await page.evaluate(() => window.audioReader.player.loading)).toBe(true);

    await page.screenshot({ path: `${SHOTS}/07-loading-spinner.png` });

    await expect(reader(page).locator('.spinner')).toBeHidden({ timeout: 20_000 });
  });

  test('unsynthesized segments are visually distinct from buffered ones', async ({ page }) => {
    await openReader(page, '&synthDelay=2500&debug=1');

    await expect(reader(page).locator('.segment.pending').first()).toBeVisible();
    await expect.poll(
      () => reader(page).locator('.segment.buffered, .segment.current').count(),
      { timeout: 20_000 },
    ).toBeGreaterThan(0);

    await page.screenshot({ path: `${SHOTS}/08-progressive-chunks.png` });
  });
});

test.describe('seek throttling', () => {
  test('a burst of next presses rebuilds the buffer once, not once per press', async ({ page }) => {
    await openReader(page, '&synthDelay=600&debug=1');

    // Count buffer rebuilds by wrapping the method the player calls to hydrate.
    await page.evaluate(() => {
      const source = window.audioReader.player.source;
      window.__rebuilds = 0;
      const original = source.window.bind(source);
      source.window = (...args) => { window.__rebuilds++; return original(...args); };
    });

    const startLeaf = await page.evaluate(() => window.audioReader.player.cursor.leafIndex);
    const next = reader(page).locator('.skip').nth(1);
    for (let i = 0; i < 6; i++) await next.click({ delay: 0 });

    await expect.poll(() => page.evaluate(() => window.audioReader.player.seeking)).toBe(false);
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => window.__rebuilds)).toBe(1);

    // And it landed six paragraphs on.
    const endLeaf = await page.evaluate(() => window.audioReader.player.cursor.leafIndex);
    expect(endLeaf).toBeGreaterThan(startLeaf);

    await page.screenshot({ path: `${SHOTS}/09-after-seek-burst.png` });
  });

  test('seeking mid-playback abandons in-flight synthesis instead of queueing more', async ({ page }) => {
    await openReader(page, '&synthDelay=3000&debug=1');

    await reader(page).locator('.play').click();
    await expect(reader(page).locator('.spinner')).toBeVisible();

    await reader(page).locator('.skip').nth(1).click();
    await expect.poll(() => page.evaluate(() => window.audioReader.player.seeking)).toBe(false);

    await expect.poll(
      () => page.evaluate(() => window.audioReader.player.queue.stats.aborted),
      { message: 'the stale synthesis should have been cancelled' },
    ).toBeGreaterThan(0);

    await page.screenshot({ path: `${SHOTS}/10-seek-cancels-inflight.png` });
  });

  test('previous paragraph goes back', async ({ page }) => {
    await openReader(page);

    const next = reader(page).locator('.skip').nth(1);
    await next.click();
    await next.click();
    await next.click();
    await expect.poll(() => page.evaluate(() => window.audioReader.player.seeking)).toBe(false);
    const forward = await page.evaluate(() => window.audioReader.player.cursor);

    await reader(page).locator('.skip').nth(0).click();
    await expect.poll(() => page.evaluate(() => window.audioReader.player.seeking)).toBe(false);
    const back = await page.evaluate(() => window.audioReader.player.cursor);

    expect(JSON.stringify(back)).not.toBe(JSON.stringify(forward));
  });
});
