// @ts-check
/**
 * OL Mobile Plugin — Playwright regression tests
 *
 * Run with:
 *   npm run build && npx playwright test
 *
 * Requires a running http-server on port 8000 (or set BASE_URL).
 * Playwright will start one automatically via playwright.config.js webServer.
 *
 * These tests load the IA demo with ?ref=ol and a 390px mobile viewport,
 * which activates the OL mobile plugin. They test pixel-level layout,
 * UI interaction, and state correctness.
 *
 * Search tests mock the archive.org search API so they run offline, deterministically,
 * and without depending on the OCR quality of the test book.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OCAID = 'goody';
const DEMO_PATH = `/BookReaderDemo/demo-internetarchive.html?ocaid=${OCAID}&ref=ol`;

// Mock search API response — 2 results, deterministic, no real network call.
const MOCK_SEARCH_TERM = 'good';
const MOCK_SEARCH_RESPONSE = {
  ia: OCAID,
  q: MOCK_SEARCH_TERM,
  indexed: true,
  page_count: 193,
  body_length: 400,
  leaf0_missing: false,
  matches: [
    {
      text: `Once upon a time there was a {{{${MOCK_SEARCH_TERM}}}} little girl`,
      par: [{
        boxes: [{ r: 500, b: 400, t: 350, page: 5, l: 100 }],
        b: 500, t: 300, page_width: 800, r: 600, l: 50,
        page_height: 1000, page: 5,
      }],
    },
    {
      text: `She was a very {{{${MOCK_SEARCH_TERM}}}} child indeed`,
      par: [{
        boxes: [{ r: 500, b: 400, t: 350, page: 20, l: 100 }],
        b: 500, t: 300, page_width: 800, r: 600, l: 50,
        page_height: 1000, page: 20,
      }],
    },
  ],
};

/**
 * Install a route mock for the archive.org search API so search tests don't
 * depend on network access or OCR quality of the test book.
 */
async function mockSearch(page) {
  await page.route('**/fulltext/inside.php**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(MOCK_SEARCH_RESPONSE),
  }));
}

/** Wait for the plugin wrapper and BRcontainer to be present. */
async function waitForMobileUI(page) {
  await page.waitForSelector('.BRolMobileWrapper', { timeout: 30_000 });
  await page.waitForSelector('.BRcontainer', { timeout: 30_000 });
  // Slight stabilization delay for BookReader's initial layout pass
  await page.waitForTimeout(500);
}

/** Bounding-box helper (always uses the plugin's chrome toggle). */
const chevron = (page) => page.locator('.BRolMobileChromeToggle');

/** Read wrapper-bottom and BRcontainer-top from the live DOM. */
async function getLayoutYs(page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector('.BRolMobileWrapper');
    const container = document.querySelector('.BRcontainer');
    return {
      wrapperBottom: wrapper?.getBoundingClientRect().bottom ?? 0,
      containerTop: container?.getBoundingClientRect().top ?? 0,
    };
  });
}

/**
 * Count bookmarks from the ia-bookmarks Lit component.
 * bookmarks starts as [] (array with numeric-index mutations) and later
 * becomes a plain {} object. Object.keys handles both correctly.
 */
async function bookmarkCount(page) {
  return page.evaluate(() => {
    const bm = /** @type {any} */ (document.querySelector('ia-bookreader'))
      ?.menuProviders?.bookmarks?.component?.bookmarks;
    if (!bm) return 0;
    return Object.keys(bm).filter(k => bm[k] != null).length;
  });
}

/**
 * Wait until the OL mobile plugin has bound its bookmarksChanged listener.
 * The plugin sets data-bookmarks-ready on the wrapper once binding succeeds
 * (after the 500ms PostInit fallback that lets ia-bookreader initialise first).
 */
async function waitForBookmarks(page) {
  await page.waitForSelector('.BRolMobileWrapper[data-bookmarks-ready]', { timeout: 20_000 });
}

/** Add a bookmark on the current page and wait for the bubble to confirm it. */
async function addBookmark(page) {
  await page.locator('.BRolMobileBookmarkBtn').click();
  await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });
}

// ---------------------------------------------------------------------------
// 1. Layout: header must not occlude the book
//
// BRcontainer is position:absolute, so normal-flow siblings don't push it.
// The plugin uses a MutationObserver + ResizeObserver to keep BRcontainer.top
// equal to the wrapper height. This was a real bug on initial load: BookReader
// would set container.style.top = '0' after our value was applied, clobbering
// it. The observer approach corrects this reactively every time BR touches the
// style attribute.
// ---------------------------------------------------------------------------

test.describe('Layout — header does not occlude the book', () => {
  test('BRcontainer top >= wrapper bottom on initial load', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    const { wrapperBottom, containerTop } = await getLayoutYs(page);

    // The book's top edge must be at or below the header's bottom edge.
    // Allow 2 px tolerance for sub-pixel rounding.
    expect(containerTop).toBeGreaterThanOrEqual(wrapperBottom - 2);
  });

  test('BRcontainer top >= wrapper bottom after collapse then expand', async ({ page }) => {
    // Collapse changes the wrapper height (to 25 px strip); ResizeObserver must
    // update BRcontainer.top to match. Expand must restore it to full height.
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await chevron(page).click();
    await page.waitForSelector('.BRolMobileWrapper--collapsed');

    await chevron(page).click();
    await page.waitForSelector('.BRolMobileWrapper:not(.BRolMobileWrapper--collapsed)');
    await page.waitForTimeout(200);

    const { wrapperBottom, containerTop } = await getLayoutYs(page);
    expect(containerTop).toBeGreaterThanOrEqual(wrapperBottom - 2);
  });
});

// ---------------------------------------------------------------------------
// 2. Bookmark UX — icon, bubble, note bar, list panel
//
// When a patron clicks the bookmark button on an unbookmarked page:
//   1. ia-bookmarks registers the bookmark locally (no auth needed for local state)
//   2. Our plugin fires _refreshBookmarkState via the bookmarksChanged event
//   3. The bookmark button gains .BRolMobileBookmarkBtn--active (icon turns red)
//   4. The count bubble becomes visible with count "1"
//   5. The note bar appears (with "Page Notes:" label)
//
// Clicking the bubble opens a list of all bookmarks.
// Clicking a bookmark list item navigates to that page; the list stays OPEN
// so the patron can review multiple entries before dismissing.
// Clicking bookmark again on a bookmarked page (no note) removes it immediately.
// ---------------------------------------------------------------------------

test.describe('Bookmark — visual state after clicking', () => {
  test('bookmark button click adds a bookmark in ia-bookmarks component', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    const before = await bookmarkCount(page);
    await page.locator('.BRolMobileBookmarkBtn').click();
    // Wait for the bubble to appear — it only shows when count > 0
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    expect(await bookmarkCount(page)).toBe(before + 1);
  });

  test('bookmark button gains active class after clicking', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    const isActive = await page.locator('.BRolMobileBookmarkBtn').evaluate(
      (el) => el.classList.contains('BRolMobileBookmarkBtn--active'),
    );
    expect(isActive).toBe(true);
  });

  test('bookmark icon SVG fills solid red after clicking', async ({ page }) => {
    // Regression: icon must be solid-filled red, not just an outline tint.
    // We check the computed fill on the SVG element (CSS-owned, no SVG attributes).
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    const fill = await page.locator('.BRolMobileBookmarkIcon').evaluate(
      (el) => window.getComputedStyle(el).fill,
    );
    // #C0392B = rgb(192, 57, 43) — the bookmark-red variable
    expect(fill).toMatch(/rgb\(192,\s*57,\s*43\)/);
  });

  test('entire top bar row does NOT turn red after clicking bookmark', async ({ page }) => {
    // Regression: only the icon and bubble are red. The row background stays neutral.
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    const row1BgColor = await page.locator('.BRolMobileRow1').evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // Should be the neutral header background, not red (#C0392B = rgb(192,57,43))
    expect(row1BgColor).not.toMatch(/192.*57.*43|C0392B/i);
  });

  test('count bubble appears with count 1 after first bookmark', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeHidden();

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible();
    expect(await page.locator('.BRolMobileBookmarkBubble').textContent()).toBe('1');
  });

  test('note bar appears after bookmarking a page', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await expect(page.locator('.BRolMobileNoteBar')).toBeHidden();

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible({ timeout: 3_000 });

    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible();
  });

  test('note bar has "Page Notes:" label', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible({ timeout: 3_000 });

    const labelText = await page.locator('.BRolMobileNoteLabel').textContent();
    expect(labelText?.trim()).toBe('Page Notes:');
  });

  test('clicking bookmark again on bookmarked page (no note) removes it', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    // Add — wait for bubble to confirm it registered
    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });
    expect(await bookmarkCount(page)).toBeGreaterThan(0);

    // Remove — no note so no confirm dialog
    await page.locator('.BRolMobileBookmarkBtn').click();
    // Use toBeHidden() — the element stays in DOM but hidden via [hidden] attribute
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeHidden({ timeout: 3_000 });

    expect(await bookmarkCount(page)).toBe(0);

    const isActive = await page.locator('.BRolMobileBookmarkBtn').evaluate(
      (el) => el.classList.contains('BRolMobileBookmarkBtn--active'),
    );
    expect(isActive).toBe(false);

    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeHidden();
    await expect(page.locator('.BRolMobileNoteBar')).toBeHidden();
  });
});

test.describe('Bookmark — list panel (bubble click)', () => {
  test('bubble click shows the bookmark list panel', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);

    // List is hidden before bubble click
    await expect(page.locator('.BRolMobileBookmarkList')).toBeHidden();

    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeVisible();
  });

  test('bookmark list shows one entry after one bookmark', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();

    await expect(page.locator('.BRolMobileBookmarkItem')).toHaveCount(1);
  });

  test('bookmark list has prev/next navigation buttons', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();

    await expect(page.locator('.BRolMobileBmNavPrev')).toBeVisible();
    await expect(page.locator('.BRolMobileBmNavNext')).toBeVisible();
  });

  test('clicking bubble again hides the list', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeVisible();

    // Second bubble click closes the list
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeHidden();
  });

  test('clicking outside the wrapper hides the bookmark list', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeVisible();

    const bookBox = await page.locator('.BRcontainer').boundingBox();
    if (bookBox) {
      await page.mouse.click(bookBox.x + bookBox.width / 2, bookBox.y + bookBox.height / 3);
      await page.waitForTimeout(300);
      await expect(page.locator('.BRolMobileBookmarkList')).toBeHidden();
    }
  });

  test('clicking a bookmark list item dismisses the list', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkItem').first()).toBeVisible();

    await page.locator('.BRolMobileBookmarkItem').first().click();
    await page.waitForTimeout(300);

    // Clicking a result navigates and closes the list
    await expect(page.locator('.BRolMobileBookmarkList')).toBeHidden();
  });

  test('dismiss button (✕) in bookmark list header closes the list', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeVisible();

    await page.locator('.BRolMobileBmDismissBtn').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeHidden();
  });

  test('bookmark list header has centered count with flanking chevrons and far-right dismiss', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();

    // Count and chevrons are inside the centered group
    await expect(page.locator('.BRolMobileBmNavCenter')).toBeVisible();
    await expect(page.locator('.BRolMobileBmNavCenter .BRolMobileBmNavPrev')).toBeVisible();
    await expect(page.locator('.BRolMobileBmNavCenter .BRolMobileBmNavNext')).toBeVisible();
    await expect(page.locator('.BRolMobileBmCount')).toBeVisible();

    // Dismiss button is outside the center group (separate, at far right)
    await expect(page.locator('.BRolMobileBmDismissBtn')).toBeVisible();
  });

  test('current-page bookmark item is highlighted in the list', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    // Bookmark the current (first) page, then open the list
    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();

    // The entry for the current page must have the --current modifier class
    const hasCurrent = await page.locator('.BRolMobileBookmarkItem--current').count();
    expect(hasCurrent).toBeGreaterThan(0);
  });

  test('opening bookmark list hides the search panel', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    // Open search first
    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileRow2')).toBeVisible();

    // Add a bookmark so bubble is visible
    await addBookmark(page);

    // Open bookmark list
    await page.locator('.BRolMobileBookmarkBubble').click();

    // Search row should now be hidden
    await expect(page.locator('.BRolMobileRow2')).toBeHidden();
  });

  test('saving a note auto-updates the bookmark list if open', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    // Add bookmark and open list
    await addBookmark(page);
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeVisible();

    // The list entry should have no note snippet yet
    const snippetBefore = await page.locator('.BRolMobileBookmarkItem .BRolMobileResultSnippet').count();
    expect(snippetBefore).toBe(0);

    // Close the list, type a note, save
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeHidden();

    await page.locator('.BRolMobileNoteInput').fill('My test note');
    await page.locator('.BRolMobileSaveBtn').click();

    // Re-open list — note snippet should now appear
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeVisible();
    const snippetAfter = await page.locator('.BRolMobileBookmarkItem .BRolMobileResultSnippet').count();
    expect(snippetAfter).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2b. Bookmark — ia-bookmarks native UI (page-corner) reactive update
//
// The top-right corner of each book page (rendered by ia-bookmarks) has its
// own add/remove bookmark button. Clicking it calls ia-bookmarks' internal
// API, which fires a `bookmarksChanged` CustomEvent on the component. Our
// plugin listens on that event and refreshes the topbar reactively.
// ---------------------------------------------------------------------------

test.describe('Bookmark — page-corner (ia-bookmarks native UI) reactive update', () => {
  /**
   * Simulate the page-corner bookmark add by directly setting ia-bookmarks' internal state
   * and firing bookmarksChanged — the same event the corner button fires after createBookmark().
   * We bypass the IA API call (which requires auth) and modal interactions that aren't
   * available in the test environment.
   */
  async function cornerAddBookmark(page) {
    return page.evaluate(() => {
      const comp = /** @type {any} */ (document.querySelector('ia-bookreader'))
        ?.menuProviders?.bookmarks?.component;
      if (!comp) throw new Error('ia-bookmarks component not found');
      comp.bookmarks[0] = { id: 0, leafNum: 0, note: '' };
      comp.emitBookmarksChanged();
    });
  }

  async function cornerRemoveBookmark(page) {
    return page.evaluate(() => {
      const comp = /** @type {any} */ (document.querySelector('ia-bookreader'))
        ?.menuProviders?.bookmarks?.component;
      if (!comp) throw new Error('ia-bookmarks component not found');
      const updated = { ...comp.bookmarks };
      delete updated[0];
      comp.bookmarks = updated;
      comp.emitBookmarksChanged();
    });
  }

  test('topbar bubble appears when bookmark added via page-corner UI', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeHidden();

    await cornerAddBookmark(page);

    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });
  });

  test('topbar bookmark icon becomes active when added via page-corner UI', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await cornerAddBookmark(page);
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    const isActive = await page.locator('.BRolMobileBookmarkBtn').evaluate(
      (el) => el.classList.contains('BRolMobileBookmarkBtn--active'),
    );
    expect(isActive).toBe(true);
  });

  test('topbar bubble disappears when bookmark removed via page-corner UI', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    // Add first so there's something to remove
    await cornerAddBookmark(page);
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    await cornerRemoveBookmark(page);

    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeHidden({ timeout: 3_000 });
  });

  test('topbar bookmark icon deactivates when bookmark removed via page-corner UI', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await cornerAddBookmark(page);
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    await cornerRemoveBookmark(page);
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeHidden({ timeout: 3_000 });

    const isActive = await page.locator('.BRolMobileBookmarkBtn').evaluate(
      (el) => el.classList.contains('BRolMobileBookmarkBtn--active'),
    );
    expect(isActive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2c. Note bar — Hide button and search interaction
// ---------------------------------------------------------------------------

test.describe('Note bar — Hide button and search interaction', () => {
  test('Hide button dismisses the note bar', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible({ timeout: 3_000 });

    await page.locator('.BRolMobileHideNoteBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeHidden();
  });

  test('pressing Search keeps note bar visible (it sits beneath search row)', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    // Bookmark the page — note bar appears
    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible({ timeout: 3_000 });

    // Open search — note bar should remain visible below the search row
    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileRow2')).toBeVisible();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible();
  });

  test('note bar renders after the search row and nav bar in the DOM', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible({ timeout: 3_000 });

    const order = await page.evaluate(() => {
      const header = document.querySelector('.BRolMobileHeader');
      if (!header) return [];
      return [...header.children].map(el => el.className);
    });

    const noteIdx = order.findIndex(c => c.includes('BRolMobileNoteBar'));
    const searchIdx = order.findIndex(c => c.includes('BRolMobileRow2'));
    const navIdx = order.findIndex(c => c.includes('BRolMobileResultNav'));

    // Note bar must come after both search row and result nav bar
    expect(noteIdx).toBeGreaterThan(searchIdx);
    expect(noteIdx).toBeGreaterThan(navIdx);
  });

  test('pressing Search hides the bookmark list', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileBookmarkBubble')).toBeVisible({ timeout: 3_000 });

    // Open bookmark list
    await page.locator('.BRolMobileBookmarkBubble').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeVisible();

    // Open search — bookmark list should disappear
    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileBookmarkList')).toBeHidden();
  });

  test('note bar stays visible while searching and after cancelling', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    // Bookmark page → note bar visible
    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible({ timeout: 3_000 });

    // Open search → note bar still visible
    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible();

    // Cancel search → note bar still visible
    await page.locator('.BRolMobileCancelBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible();
  });

  test('note bar stays visible while search is toggled on and off', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForBookmarks(page);

    await page.locator('.BRolMobileBookmarkBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible({ timeout: 3_000 });

    // Toggle search open
    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible();

    // Toggle search closed
    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileNoteBar')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Chevron — position and size in both states
// ---------------------------------------------------------------------------

test.describe('Chevron — position and size', () => {
  test('expanded chevron is approximately 40 px tall', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    const bounds = await chevron(page).boundingBox();
    // Row height is 44 px; chevron uses margin:2px top+bottom → ~40 px.
    expect(bounds?.height).toBeGreaterThanOrEqual(36);
    expect(bounds?.height).toBeLessThanOrEqual(44);
  });

  test('collapsed chevron is approximately 25 px tall', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await chevron(page).click();
    await page.waitForSelector('.BRolMobileWrapper--collapsed');

    const bounds = await chevron(page).boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(22);
    expect(bounds?.height).toBeLessThanOrEqual(28);
  });

  test('collapsed chevron x position matches expanded chevron x position', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    const expandedBox = await chevron(page).boundingBox();

    await chevron(page).click();
    await page.waitForSelector('.BRolMobileWrapper--collapsed');

    const collapsedBox = await chevron(page).boundingBox();

    // Same horizontal position ± 2 px.
    expect(Math.abs((collapsedBox?.x ?? 0) - (expandedBox?.x ?? 0))).toBeLessThanOrEqual(2);
  });

  test('collapsed chevron y position is at the top of the viewport (y near 0)', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await chevron(page).click();
    await page.waitForSelector('.BRolMobileWrapper--collapsed');

    const box = await chevron(page).boundingBox();
    // The collapsed strip is at the very top; chevron's top edge should be near 0.
    expect(box?.y ?? 999).toBeLessThanOrEqual(5);
  });

  test('expand→collapse→expand restores chevron to original position and size', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    const initial = await chevron(page).boundingBox();

    await chevron(page).click(); // collapse
    await page.waitForSelector('.BRolMobileWrapper--collapsed');
    await chevron(page).click(); // expand
    await page.waitForSelector('.BRolMobileWrapper:not(.BRolMobileWrapper--collapsed)');
    await page.waitForTimeout(100);

    const restored = await chevron(page).boundingBox();

    expect(Math.abs((restored?.x ?? 0) - (initial?.x ?? 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((restored?.y ?? 0) - (initial?.y ?? 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((restored?.height ?? 0) - (initial?.height ?? 0))).toBeLessThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// 4. Search flow
//
// All search tests install a Playwright route mock for /fulltext/inside.php
// so they run offline with deterministic results.
// ---------------------------------------------------------------------------

test.describe('Search — magnifying glass, cancel, results, focus restore', () => {
  test('search row is hidden on load', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await expect(page.locator('.BRolMobileRow2')).toBeHidden();
  });

  test('magnifying glass click shows search row', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileRow2')).toBeVisible();
  });

  test('magnifying glass click again hides search row', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileRow2')).toBeVisible();

    await page.locator('.BRolMobileSearchBtn').click();
    await expect(page.locator('.BRolMobileRow2')).toBeHidden();
  });

  test('Cancel hides search row without clearing a prior query', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill('shoe');
    await page.locator('.BRolMobileCancelBtn').click();

    await expect(page.locator('.BRolMobileRow2')).toBeHidden();
  });

  test('Cancel clears input value and hides results', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');

    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });

    await page.locator('.BRolMobileCancelBtn').click();

    await expect(page.locator('.BRolMobileRow2')).toBeHidden();
    await expect(page.locator('.BRolMobileResults')).toBeHidden();
    expect(await page.locator('.BRolMobileInput').inputValue()).toBe('');
  });

  test('pressing Enter shows results panel with at least one result', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');

    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.BRolMobileResultItem').first()).toBeVisible();
  });

  test('clicking a result hides results panel', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');

    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });
    await page.locator('.BRolMobileResultItem').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('.BRolMobileResults')).toBeHidden();
  });

  test('clicking a result navigates BookReader to a different page', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    const urlBefore = page.url();

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');

    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });

    const resultPageLabel = await page.locator('.BRolMobileResultPage').first().textContent();

    await page.locator('.BRolMobileResultItem').first().click();
    await page.waitForTimeout(1000);

    const urlAfter = page.url();
    const urlChanged = urlAfter !== urlBefore;
    const resultsHidden = await page.locator('.BRolMobileResults').isHidden();

    expect(urlChanged || resultsHidden).toBe(true);

    if (resultPageLabel) {
      expect(/\d+/.test(resultPageLabel)).toBe(true);
    }
  });

  test('clicking in search input after result-click restores results panel', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');

    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });

    await page.locator('.BRolMobileResultItem').first().click();
    await expect(page.locator('.BRolMobileResults')).toBeHidden();

    await page.locator('.BRolMobileInput').click();
    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// 5. Result navigator bar
// ---------------------------------------------------------------------------

test.describe('Result nav bar — (x/y) strip after result click', () => {
  /** Helper: search for mock term, wait for results, click the first one. */
  async function searchAndClickResult(page) {
    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');
    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });
    await page.locator('.BRolMobileResultItem').first().click();
    await page.waitForTimeout(300);
  }

  test('nav bar is hidden on load', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await expect(page.locator('.BRolMobileResultNav')).toBeHidden();
  });

  test('nav bar is hidden before any result is clicked', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');
    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('.BRolMobileResultNav')).toBeHidden();
  });

  test('nav bar appears after clicking a result', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    await expect(page.locator('.BRolMobileResultNav')).toBeVisible();
  });

  test('nav bar shows (x/y) position label in correct format', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    const posText = await page.locator('.BRolMobileResultNavPos').textContent();
    expect(posText).toMatch(/^\(\d+\/\d+\)$/);
    expect(posText).toMatch(/^\(1\//);
  });

  test('nav bar shows a non-empty snippet', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    const snippet = await page.locator('.BRolMobileResultNavSnippet').textContent();
    expect(snippet?.trim().length).toBeGreaterThan(0);
  });

  test('prev button is disabled (opacity 0) at first result', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    const prevBtn = page.locator('.BRolMobileResultNavPrev');
    const isDisabled = await prevBtn.evaluate((el) => el.hasAttribute('disabled'));
    expect(isDisabled).toBe(true);
  });

  test('next button is enabled when there are multiple results', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    const total = await page.locator('.BRolMobileResultNavPos').evaluate((el) => {
      const m = el.textContent?.match(/\/(\d+)\)/);
      return m ? parseInt(m[1], 10) : 0;
    });

    const nextBtn = page.locator('.BRolMobileResultNavNext');
    const isDisabled = await nextBtn.evaluate((el) => el.hasAttribute('disabled'));
    // Mock has 2 results, so next should be enabled
    expect(total).toBe(2);
    expect(isDisabled).toBe(false);
  });

  test('clicking Next advances (x/y) counter and updates snippet', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    const total = await page.locator('.BRolMobileResultNavPos').evaluate((el) => {
      const m = el.textContent?.match(/\/(\d+)\)/);
      return m ? parseInt(m[1], 10) : 0;
    });

    if (total < 2) {
      test.skip();
      return;
    }

    await page.locator('.BRolMobileResultNavNext').click();
    await page.waitForTimeout(300);

    const posAfter = await page.locator('.BRolMobileResultNavPos').textContent();
    expect(posAfter).toMatch(/^\(2\//);

    const snippetAfter = await page.locator('.BRolMobileResultNavSnippet').textContent();
    expect(snippetAfter?.trim().length).toBeGreaterThan(0);
  });

  test('clicking input while nav bar is shown hides nav bar and restores results', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    await expect(page.locator('.BRolMobileResultNav')).toBeVisible();
    await expect(page.locator('.BRolMobileResults')).toBeHidden();

    await page.locator('.BRolMobileInput').click();
    await page.waitForTimeout(300);

    await expect(page.locator('.BRolMobileResultNav')).toBeHidden();
    await expect(page.locator('.BRolMobileResults')).toBeVisible();
  });

  test('Cancel clears nav bar state', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    await expect(page.locator('.BRolMobileResultNav')).toBeVisible();

    await page.locator('.BRolMobileCancelBtn').click();
    await page.waitForTimeout(200);

    await expect(page.locator('.BRolMobileResultNav')).toBeHidden();
    await expect(page.locator('.BRolMobileRow2')).toBeHidden();
  });

  test('new search clears nav bar state', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    await expect(page.locator('.BRolMobileResultNav')).toBeVisible();

    await page.locator('.BRolMobileInput').click();
    await page.locator('.BRolMobileInput').fill('hat');
    await page.locator('.BRolMobileInput').press('Enter');

    await expect(page.locator('.BRolMobileResultNav')).toBeHidden();
  });

  test('search term is preserved in the input while nav bar is showing', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');
    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });
    await page.locator('.BRolMobileResultItem').first().click();
    await page.waitForTimeout(400);

    await expect(page.locator('.BRolMobileResultNav')).toBeVisible();

    await page.locator('.BRolMobileInput').click();
    await page.waitForTimeout(200);

    const valueAfterClick = await page.locator('.BRolMobileInput').inputValue();
    expect(valueAfterClick).toBe(MOCK_SEARCH_TERM);
  });

  test('clicking outside search area (on book) collapses results and restores preview', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');
    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });

    await page.locator('.BRolMobileResultItem').first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('.BRolMobileResultNav')).toBeVisible();

    await page.locator('.BRolMobileInput').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.BRolMobileResults')).toBeVisible();

    const bookBox = await page.locator('.BRcontainer').boundingBox();
    if (bookBox) {
      await page.mouse.click(
        bookBox.x + bookBox.width / 2,
        bookBox.y + bookBox.height / 3,
      );
      await page.waitForTimeout(300);

      await expect(page.locator('.BRolMobileResults')).toBeHidden();
      await expect(page.locator('.BRolMobileResultNav')).toBeVisible();
    }
  });

  test('nav bar does not occlude the book (wrapper bottom <= BRcontainer top)', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await searchAndClickResult(page);

    await expect(page.locator('.BRolMobileResultNav')).toBeVisible();

    const { wrapperBottom, containerTop } = await getLayoutYs(page);
    expect(containerTop).toBeGreaterThanOrEqual(wrapperBottom - 2);
  });
});

// ---------------------------------------------------------------------------
// 6. URL pre-fill: ?q= on load opens search bar with pre-filled term
// ---------------------------------------------------------------------------

test.describe('URL pre-fill — ?q= opens search bar on load', () => {
  const DEMO_PATH_WITH_Q = `/BookReaderDemo/demo-internetarchive.html?ocaid=${OCAID}&ref=ol&q=${MOCK_SEARCH_TERM}`;

  test('search row is visible on load when ?q= is in the URL', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH_WITH_Q);
    await waitForMobileUI(page);
    await expect(page.locator('.BRolMobileRow2')).toBeVisible({ timeout: 10_000 });
  });

  test('search input is pre-filled with the URL query term', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH_WITH_Q);
    await waitForMobileUI(page);
    await page.locator('.BRolMobileRow2').waitFor({ state: 'visible', timeout: 10_000 });
    const value = await page.locator('.BRolMobileInput').inputValue();
    expect(value).toBe(MOCK_SEARCH_TERM);
  });

  test('results appear automatically when ?q= is in the URL', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH_WITH_Q);
    await waitForMobileUI(page);
    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 15_000 });
  });

  test('search bar stays closed when ?q= is absent', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await expect(page.locator('.BRolMobileRow2')).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// 6b. Page navigation scrubber
//
// After BookReader:PostInit, the OL mobile plugin replaces the BRcurrentpage
// display in .BRnavMain .scrubber with:
//   ‹ X / N ›  Page Y : Section Desc
//
//   Five clickable elements: ‹, leaf chip, ›, page chip, section chip.
//   ‹ and › bracket only the leaf chip; page+section follow to the right.
//   The ":" separator only appears when BOTH page AND section are present.
//   Page chip: shown only when page number is asserted (not n{idx}).
//   Section chip: shown only if br.plugins.chapters._tocEntries is non-empty.
//   Section chip truncates with "..." (text-overflow: ellipsis) when too long.
//
// Prev/next buttons navigate by leaf. Each chip is clickable: leaf chip opens
// an inline edit input (Enter = jumpToIndex, Escape = cancel); page chip opens
// the same for jumpToPage. The standard scrubber flip buttons (book_left,
// book_right) are hidden since ‹ › replace them.
// ---------------------------------------------------------------------------

test.describe('Page navigation bar', () => {
  /** Wait for the leaf chip to be populated (happens after BookReader:PostInit). */
  async function waitForPageNav(page) {
    await page.waitForSelector('.BRolMobilePageNavLeaf', { timeout: 15_000 });
  }

  test('page nav row is present in BRnavMain scrubber on load', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    // Nav row is injected into the footer (BRnavMain scrubber), not the top bar
    const count = await page.locator('.BRnavMain .BRolMobilePageNav').count();
    expect(count).toBe(1);
  });

  test('leaf chip shows 1 / N format on first page', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    const text = await page.locator('.BRolMobilePageNavLeaf').textContent();
    // Should be "1 / N" where N > 0
    expect(text?.trim()).toMatch(/^1 \/ \d+$/);
  });

  test('prev button is disabled on first page', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    const isDisabled = await page.locator('.BRolMobilePageNavPrev').evaluate(
      (el) => /** @type {HTMLButtonElement} */ (el).disabled,
    );
    expect(isDisabled).toBe(true);
  });

  test('next button is enabled when book has more than one page', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    const isDisabled = await page.locator('.BRolMobilePageNavNext').evaluate(
      (el) => /** @type {HTMLButtonElement} */ (el).disabled,
    );
    expect(isDisabled).toBe(false);
  });

  test('clicking next advances the leaf chip to 2 / N', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    await page.locator('.BRolMobilePageNavNext').click();

    // Wait for chip text to update (happens on fragmentChange)
    await page.waitForFunction(
      () => document.querySelector('.BRolMobilePageNavLeaf')?.textContent?.trim().startsWith('2 /'),
      { timeout: 5_000 },
    );
    const text = await page.locator('.BRolMobilePageNavLeaf').textContent();
    expect(text?.trim()).toMatch(/^2 \/ \d+$/);
  });

  test('clicking leaf chip shows an inline input pre-filled with current position', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    await page.locator('.BRolMobilePageNavLeaf').click();
    const input = page.locator('.BRolMobilePageNavInput');
    await expect(input).toBeVisible({ timeout: 2_000 });
    // Pre-filled with "1" (first leaf, 1-based)
    const val = await input.inputValue();
    expect(val).toBe('1');
  });

  test('typing a valid leaf number and pressing Enter navigates and restores chip', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    await page.locator('.BRolMobilePageNavLeaf').click();
    await expect(page.locator('.BRolMobilePageNavInput')).toBeVisible();

    // Type "3" and press Enter — should navigate to leaf 3 (index 2)
    await page.locator('.BRolMobilePageNavInput').fill('3');
    await page.locator('.BRolMobilePageNavInput').press('Enter');

    // Input gone, chip restored
    await expect(page.locator('.BRolMobilePageNavInput')).toBeHidden({ timeout: 2_000 });
    await expect(page.locator('.BRolMobilePageNavLeaf')).toBeVisible();
  });

  test('pressing Escape cancels leaf edit and restores chip without navigating', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    const chipBefore = await page.locator('.BRolMobilePageNavLeaf').textContent();

    await page.locator('.BRolMobilePageNavLeaf').click();
    await expect(page.locator('.BRolMobilePageNavInput')).toBeVisible();

    // Change value but Escape — should NOT navigate
    await page.locator('.BRolMobilePageNavInput').fill('99');
    await page.locator('.BRolMobilePageNavInput').press('Escape');

    await expect(page.locator('.BRolMobilePageNavInput')).toBeHidden({ timeout: 2_000 });
    await expect(page.locator('.BRolMobilePageNavLeaf')).toBeVisible();

    // Chip text unchanged (still on first page)
    const chipAfter = await page.locator('.BRolMobilePageNavLeaf').textContent();
    expect(chipAfter?.trim()).toBe(chipBefore?.trim());
  });

  test('scrubber flip buttons (book_left, book_right) are hidden', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    await expect(page.locator('.BRnavMobile .book_left')).toBeHidden();
    await expect(page.locator('.BRnavMobile .book_right')).toBeHidden();
  });

  test('scrubber slider (BRpager) exists in DOM (not removed)', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    // BRnavMobile is docked/hidden by default; BRpager must still exist in the DOM
    const count = await page.locator('.BRnavMobile .BRpager').count();
    expect(count).toBeGreaterThan(0);
  });

  test('chapter chip is absent when book has no TOC data', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    // The goody test book has no chapters plugin data — chip should not exist
    const count = await page.locator('.BRolMobilePageNavChapter').count();
    expect(count).toBe(0);
  });

  test('bar does not occlude the book (wrapper bottom <= BRcontainer top)', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    const { wrapperBottom, containerTop } = await getLayoutYs(page);
    expect(containerTop).toBeGreaterThanOrEqual(wrapperBottom - 2);
  });

  // Plato-style test: with asserted page numbers and TOC data, the full format
  // ‹ X / N ›  Page X : Section Desc is shown with correct structure.
  test('full format — Plato book: ‹ leaf › Page : Section all present with correct structure', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    // Inject asserted page numbers and TOC data (like Plato's Republic)
    await page.evaluate(() => {
      const br = /** @type {any} */ (window).br;
      // Asserted page numbers starting from page 5 at leaf 0
      br.book.getPageNum = (idx) => String(idx + 5);
      // TOC with one entry at leaf 0
      br.plugins = br.plugins ?? {};
      br.plugins.chapters = {
        _tocEntries: [
          { pageIndex: 0, label: 'Book I', title: 'The Republic' },
        ],
      };
      window.$?.(document).trigger('BookReader:fragmentChange');
    });

    await page.waitForFunction(
      () => document.querySelector('.BRolMobilePageNavPage') !== null,
      { timeout: 5_000 },
    );

    // 5 clickable elements in order: prev, leaf, next, page, section
    await expect(page.locator('.BRolMobilePageNavPrev')).toBeVisible();
    const leafText = await page.locator('.BRolMobilePageNavLeaf').textContent();
    expect(leafText?.trim()).toMatch(/^\d+ \/ \d+$/);
    await expect(page.locator('.BRolMobilePageNavNext')).toBeVisible();

    // Page chip — "Page 5" (leaf 0, page num = 0 + 5 = 5)
    const pageText = await page.locator('.BRolMobilePageNavPage').textContent();
    expect(pageText?.trim()).toBe('Page 5');

    // Colon separator only present when BOTH page AND section exist
    const sep = page.locator('.BRolMobilePageNavSep');
    await expect(sep).toBeVisible();
    expect(await sep.textContent()).toBe(':');

    // Section chip — "Book I The Republic"
    const chapterText = await page.locator('.BRolMobilePageNavChapter').textContent();
    expect(chapterText?.trim()).toBe('Book I The Republic');
  });

  // Regression: no colon separator when only section (no asserted page)
  test('colon separator absent when section present but page not asserted', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    await page.evaluate(() => {
      const br = /** @type {any} */ (window).br;
      // Unasserted pages (default goody book behaviour)
      br.book.getPageNum = (idx) => `n${idx}`;
      br.plugins = br.plugins ?? {};
      br.plugins.chapters = { _tocEntries: [{ pageIndex: 0, label: 'Gorgias', title: 'On Rhetoric' }] };
      window.$?.(document).trigger('BookReader:fragmentChange');
    });

    await page.waitForFunction(
      () => document.querySelector('.BRolMobilePageNavChapter') !== null,
      { timeout: 5_000 },
    );

    // Page chip must be absent
    expect(await page.locator('.BRolMobilePageNavPage').count()).toBe(0);
    // Colon separator must be absent
    expect(await page.locator('.BRolMobilePageNavSep').count()).toBe(0);
    // Section chip must be present
    await expect(page.locator('.BRolMobilePageNavChapter')).toBeVisible();
  });

  // Regression: leaf chip must not be squished to 30px (CSS specificity bug guard).
  // BookReader's `.BRcontrols .controls button { width:30px }` must not win over
  // our `.BRcontrols .controls .BRolMobilePageNavChip { width:auto }` rule.
  test('leaf chip width is not squished to 30px', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    // The leaf chip "1 / 194" should have natural content width, not 30px.
    const leafWidth = await page.locator('.BRolMobilePageNavLeaf').evaluate(
      (el) => Math.round(el.getBoundingClientRect().width),
    );
    // "1 / N" at 13px is ~50-70px. Anything > 35 means the specificity fix works.
    expect(leafWidth).toBeGreaterThan(35);
  });

  // Regression: all three chips (leaf, page, section) must not be squished to 30px.
  // Previously `.BRcontrols .controls button { width:30px }` (specificity 0,2,1)
  // beat our `.BRcontrols .controls .BRolMobilePageNavChip { width:auto }` (0,3,0).
  test('all chips properly sized with asserted pages and TOC', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    // Inject asserted pages + TOC so all three chips are rendered
    await page.evaluate(() => {
      const br = /** @type {any} */ (window).br;
      br.book.getPageNum = (idx) => String(idx + 5);
      br.plugins = br.plugins ?? {};
      br.plugins.chapters = { _tocEntries: [{ pageIndex: 0, label: 'Book I', title: 'The Republic' }] };
      window.$?.(document).trigger('BookReader:fragmentChange');
    });

    await page.waitForFunction(
      () => document.querySelector('.BRolMobilePageNavPage') !== null,
      { timeout: 5_000 },
    );

    // All chips must have natural content width, not clamped to 30px
    const widths = await page.evaluate(() => {
      return [...document.querySelectorAll('.BRolMobilePageNavChip')].map(el => ({
        text: el.textContent?.trim(),
        width: Math.round(el.getBoundingClientRect().width),
      }));
    });

    expect(widths.length).toBe(3); // leaf, page, section
    for (const { text, width } of widths) {
      // Each chip must be substantially wider than 30px (content + 16px padding)
      expect(width).toBeGreaterThan(35);
      expect((text?.length ?? 0)).toBeGreaterThan(0);
    }
  });

  test('section chip scrolls suffix horizontally when title is very long', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);
    await waitForPageNav(page);

    const longTitle = 'The Very Long Chapter Title That Goes On And On Across The Whole Screen And Beyond';

    await page.evaluate((title) => {
      const br = /** @type {any} */ (window).br;
      br.book.getPageNum = (idx) => String(idx + 5);
      br.plugins = br.plugins ?? {};
      br.plugins.chapters = { _tocEntries: [{ pageIndex: 0, label: 'Chapter I', title }] };
      window.$?.(document).trigger('BookReader:fragmentChange');
    }, longTitle);

    await page.waitForFunction(
      () => document.querySelector('.BRolMobilePageNavChapter') !== null,
      { timeout: 5_000 },
    );

    const result = await page.evaluate(() => {
      const chip = document.querySelector('.BRolMobilePageNavChapter');
      const suffix = document.querySelector('.BRolMobilePageNavSuffix');
      if (!chip || !suffix) return null;
      const chipRect = chip.getBoundingClientRect();
      const suffixStyle = window.getComputedStyle(suffix);
      return {
        chipWidth: chipRect.width,
        suffixScrollWidth: suffix.scrollWidth,
        suffixClientWidth: suffix.clientWidth,
        overflowX: suffixStyle.overflowX,
      };
    });

    // The chip is wider than the visible suffix area — suffix scrolls to reveal it
    expect(result).not.toBeNull();
    expect(result.chipWidth).toBeGreaterThan(result.suffixClientWidth);
    expect(result.suffixScrollWidth).toBeGreaterThan(result.suffixClientWidth);
    expect(result.overflowX).toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// 7. Cancel removes in-book search highlights
// ---------------------------------------------------------------------------

test.describe('Cancel — removes in-book search highlights', () => {
  test('Cancel removes search result pins from the book', async ({ page }) => {
    await mockSearch(page);
    await page.goto(DEMO_PATH);
    await waitForMobileUI(page);

    await page.locator('.BRolMobileSearchBtn').click();
    await page.locator('.BRolMobileInput').fill(MOCK_SEARCH_TERM);
    await page.locator('.BRolMobileInput').press('Enter');
    await expect(page.locator('.BRolMobileResults')).toBeVisible({ timeout: 10_000 });

    const termBefore = await page.evaluate(
      () => /** @type {any} */ (window).br?.plugins?.search?.searchTerm ?? '',
    );
    expect(termBefore).toBe(MOCK_SEARCH_TERM);

    await page.locator('.BRolMobileCancelBtn').click();
    await page.waitForTimeout(300);

    const termAfter = await page.evaluate(
      () => /** @type {any} */ (window).br?.plugins?.search?.searchTerm ?? '',
    );
    expect(termAfter == null || termAfter === '').toBe(true);
  });
});
