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

  test('hands every segment of the paragraph to the speech engine in order', async ({ page }) => {
    await openReader(page);
    await reader(page).locator('.play').click();

    await expect.poll(
      () => page.evaluate(() => window.__audioReaderEvents.filter(e => e.type === 'speak').length),
      { message: 'the landmark should reach the engine', timeout: 20_000 },
    ).toBeGreaterThan(0);

    const spoken = await page.evaluate(
      () => window.__audioReaderEvents.filter(e => e.type === 'speak').map(e => e.text));
    const segments = await page.evaluate(
      () => window.audioReader.player.segments.map(s => s.text));

    // Whatever has been spoken so far must be a prefix of the paragraph's
    // segments, in order, starting from the landmark.
    expect(spoken).toEqual(segments.slice(0, spoken.length));
  });
});

/**
 * Continuous playback cannot be verified through WebSpeech under automation:
 * Chromium driven by Playwright fires `start` for an utterance and then reports
 * `speechSynthesis.speaking === true` indefinitely, never firing `end` (confirmed
 * both headless and headed). Since the player advances when a sound *finishes*,
 * nothing past the first segment is observable that way.
 *
 * The PCM engine produces real samples with a real duration and a real `ended`
 * event, so these tests can assert both that audio was genuinely rendered -- by
 * captured sample count and peak amplitude -- and that reading advances on its
 * own. It is the same playback path PocketTTS will use.
 */
test.describe('audio output and continuous reading (PCM engine)', () => {
  test('produces non-silent audio samples', async ({ page }) => {
    await openReader(page, '&engine=pcm');

    expect(await page.evaluate(() => window.audioReader.engine.stats.samplesPlayed)).toBe(0);

    await reader(page).locator('.play').click();

    await expect.poll(
      () => page.evaluate(() => window.audioReader.engine.stats.samplesPlayed),
      { message: 'samples should have been pushed to the audio device' },
    ).toBeGreaterThan(1000);

    const stats = await page.evaluate(() => window.audioReader.engine.stats);
    // Not silence: a buffer of zeros would have a peak of 0.
    expect(stats.peakAmplitude).toBeGreaterThan(0.01);
    expect(stats.soundsPlayed).toBeGreaterThan(0);

    expect(await page.evaluate(() => window.audioReader.engine.output.context.state))
      .toBe('running');
  });

  /**
   * What this does and does not prove.
   *
   * This browser cannot witness a sound finishing. Its AudioContext reports
   * `running` but its clock does not advance (measured: 0.005s over 2 real
   * seconds, headless and headed alike) because there is no audio device pulling
   * render quanta, so `ended` never fires -- the same root cause as
   * `speechSynthesis` never firing `end`.
   *
   * Advancement here therefore comes from PcmAudioOutput's watchdog, which is a
   * production robustness feature rather than a test hook, and `watchdogCompletions`
   * records that it was used. So this test proves the reader keeps moving through
   * segments and into the next paragraph without user input, and that it does not
   * strand itself when a context stops rendering. It does *not* prove the audio was
   * audible; the sample-count and peak-amplitude assertions above cover that, and
   * the jest suite covers advancement driven by genuine sound completion.
   */
  test('advances through segments and on into the next paragraph unaided', async ({ page }) => {
    await openReader(page, '&engine=pcm');

    const startCursor = await page.evaluate(() => window.audioReader.player.cursor);
    await reader(page).locator('.play').click();

    // Several sounds play in sequence with no further interaction.
    await expect.poll(
      () => page.evaluate(() => window.audioReader.engine.stats.soundsPlayed),
      { message: 'playback should continue past the first segment', timeout: 45_000 },
    ).toBeGreaterThan(2);

    // And it eventually crosses into the following paragraph.
    await expect.poll(
      () => page.evaluate(() => JSON.stringify(window.audioReader.player.cursor)),
      { message: 'reading should move on to the next paragraph', timeout: 60_000 },
    ).not.toBe(JSON.stringify(startCursor));

    expect(await page.evaluate(() => window.audioReader.player.playing)).toBe(true);

    // Segments were delivered one at a time, in order, with no overlap: a
    // duplicated playback loop would show up as more sounds than segments read.
    const stats = await page.evaluate(() => window.audioReader.engine.stats);
    expect(stats.samplesPlayed).toBeGreaterThan(stats.soundsPlayed);

    await page.screenshot({ path: `${SHOTS}/11-continuous-playback.png` });
  });

  test('pause halts sample delivery and resume continues it', async ({ page }) => {
    await openReader(page, '&engine=pcm');

    await reader(page).locator('.play').click();
    await expect.poll(() => page.evaluate(() => window.audioReader.engine.stats.soundsPlayed))
      .toBeGreaterThan(0);

    await reader(page).locator('.play').click();
    expect(await page.evaluate(() => window.audioReader.player.playing)).toBe(false);

    const atPause = await page.evaluate(() => window.audioReader.engine.stats.soundsPlayed);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.audioReader.engine.stats.soundsPlayed)).toBe(atPause);

    await reader(page).locator('.play').click();
    await expect.poll(
      () => page.evaluate(() => window.audioReader.engine.stats.soundsPlayed),
      { message: 'resuming should deliver more audio', timeout: 30_000 },
    ).toBeGreaterThan(atPause);
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

test.describe('steady-state buffering', () => {
  test('the lookahead stays at 5 paragraphs as reading advances', async ({ page }) => {
    await openReader(page, '&engine=pcm&debug=1');

    const paragraphsInPlan = () => page.evaluate(
      () => new Set(window.audioReader.player._plan.map(job => job.key.split('#')[0])).size);

    expect(await paragraphsInPlan()).toBe(5);

    await reader(page).locator('.play').click();
    const cursorNow = () => page.evaluate(() => JSON.stringify(window.audioReader.player.cursor));
    const startCursor = await cursorNow();

    // Sample the buffer until reading crosses into the next paragraph, which is
    // when the window actually slides. Poll for the crossing rather than waiting a
    // fixed time: a paragraph of this book runs ~15s of audio, and a timed loop
    // would report "not advancing" simply for being too short.
    const observed = new Set();
    let crossed = false;
    const deadline = Date.now() + 90_000;

    while (Date.now() < deadline) {
      observed.add(await paragraphsInPlan());
      if (await cursorNow() !== startCursor) {
        crossed = true;
        // Take a few more samples on the far side of the boundary, so the
        // rebuilt window is measured too.
        for (let i = 0; i < 3; i++) {
          await page.waitForTimeout(400);
          observed.add(await paragraphsInPlan());
        }
        break;
      }
      await page.waitForTimeout(500);
    }

    expect(crossed, 'reading should have advanced to the next paragraph').toBe(true);
    expect(observed.size).toBeGreaterThan(0);
    // Never grew past 5, never allowed to run down, including across the slide.
    expect([...observed]).toEqual([5]);
  });
});

/**
 * PocketTTS end to end in a real browser, against the real weights.
 *
 * ~146MB of ONNX models are fetched, so these point `modelBase` at a locally
 * served copy rather than HuggingFace. Populate it with:
 *
 *   mkdir -p BookReaderDemo/pocket-tts-models
 *   base=https://huggingface.co/KevinAHM/pocket-tts-onnx/resolve/main
 *   for f in bundle.json tokenizer.model bos_before_voice.npy \
 *            text_conditioner_int8.onnx flow_lm_flow_int8.onnx \
 *            mimi_decoder_int8.onnx mimi_encoder_int8.onnx flow_lm_main_int8.onnx; do
 *     curl -sL "$base/onnx/english_2026-04/$f" -o "BookReaderDemo/pocket-tts-models/$f"
 *   done
 *   curl -sL "$base/reference_sample.wav" -o BookReaderDemo/pocket-tts-models/reference_sample.wav
 *
 * The directory is gitignored. Without it these tests skip rather than fail, so a
 * clean checkout still runs the rest of the suite.
 */
test.describe('PocketTTS in the browser', () => {
  const MODEL_BASE = '/BookReaderDemo/pocket-tts-models';
  const POCKET_QUERY = `&engine=pocket&debug=1&modelBase=${MODEL_BASE}`
    + `&referenceAudio=${MODEL_BASE}/reference_sample.wav`;

  test.beforeEach(async ({ request }) => {
    const probe = await request.get(`${MODEL_BASE}/flow_lm_main_int8.onnx`, {
      headers: { Range: 'bytes=0-1' },
    });
    test.skip(!probe.ok(), `PocketTTS weights not served at ${MODEL_BASE} — see comment above`);
  });

  // Model download, five session creations, voice cloning and synthesis.
  test.setTimeout(240_000);

  test('loads the model bundle, clones a voice, and synthesizes non-silent speech', async ({ page }) => {
    await openReader(page, POCKET_QUERY);

    await expect(reader(page).locator('.engine-status')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/12-pocket-loading.png` });

    await expect.poll(
      () => page.evaluate(() => window.audioReader.engine.status),
      { message: 'the worker should finish loading the bundle', timeout: 180_000 },
    ).toBe('ready');

    // Voice cloned through the mimi encoder, matching the Node verification run.
    const engine = await page.evaluate(() => ({
      sampleRate: window.audioReader.engine.sampleRate,
      voiceFrames: window.audioReader.engine.voiceFrames,
    }));
    expect(engine.sampleRate).toBe(24000);
    expect(engine.voiceFrames).toBeGreaterThan(0);

    await reader(page).locator('.play').click();

    // The buffer holds real PCM produced by the model. Assert on the samples
    // themselves rather than on playback, so this is evidence of synthesis.
    const audio = await page.evaluate(async () => {
      const player = window.audioReader.player;
      const deadline = Date.now() + 150_000;
      while (Date.now() < deadline) {
        const key = player.queue.readyKeys()[0];
        const sound = key && player.queue.get(key);
        if (sound?.samples?.length) {
          let peak = 0;
          let sumSquares = 0;
          for (const sample of sound.samples) {
            peak = Math.max(peak, Math.abs(sample));
            sumSquares += sample * sample;
          }
          return {
            key,
            length: sound.samples.length,
            sampleRate: sound.sampleRate,
            peak,
            rms: Math.sqrt(sumSquares / sound.samples.length),
            text: player._plan.find(job => job.key === key)?.text,
          };
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return null;
    });

    expect(audio, 'PocketTTS should have produced a buffer').not.toBeNull();
    // eslint-disable-next-line no-console
    console.log('PocketTTS synthesized:', JSON.stringify(audio));

    expect(audio.sampleRate).toBe(24000);
    // A quarter second is the floor for anything speakable.
    expect(audio.length).toBeGreaterThan(6000);
    // Silence would be exactly 0; near-silence well under this.
    expect(audio.peak).toBeGreaterThan(0.02);
    expect(audio.rms).toBeGreaterThan(0.002);
    // Speech is not a constant tone: RMS sits well below the peak.
    expect(audio.rms).toBeLessThan(audio.peak * 0.8);

    // The audio corresponds to the landmark segment, in order.
    expect(audio.key.endsWith('#0')).toBe(true);

    await page.screenshot({ path: `${SHOTS}/13-pocket-playing.png` });
  });

  test('delivers PocketTTS samples to the audio device', async ({ page }) => {
    await openReader(page, POCKET_QUERY);
    await expect.poll(
      () => page.evaluate(() => window.audioReader.engine.status),
      { timeout: 180_000 },
    ).toBe('ready');

    await reader(page).locator('.play').click();

    await expect.poll(
      () => page.evaluate(() => window.audioReader.engine.stats.samplesPlayed),
      { message: 'synthesized audio should reach the output', timeout: 150_000 },
    ).toBeGreaterThan(6000);

    const stats = await page.evaluate(() => window.audioReader.engine.stats);
    expect(stats.peakAmplitude).toBeGreaterThan(0.02);
    expect(await page.evaluate(() => window.audioReader.engine.output.context.state))
      .toBe('running');
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
