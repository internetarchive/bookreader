import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the issue #1580 audio reader prototype.
 *
 * The repo's committed e2e suite is testcafe; this is additive and scoped to
 * `tests/playwright/`. Visual + audio verification of this mode needs a browser
 * that can actually speak, and Chromium on macOS reaches the system voices even
 * headless (verified: 191 voices, utterances fire `start`).
 */
export default defineConfig({
  testDir: './tests/playwright',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:8000',
    // A phone-shaped viewport, since the UI being reproduced is Marc Coquand's
    // native mobile audio reader.
    viewport: { width: 420, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 420, height: 900 },
        launchOptions: {
          // Without this, playback would need a real user gesture before any
          // audio is allowed to start.
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
  ],

  webServer: {
    command: 'npx http-server . --port=8000 --silent',
    url: 'http://localhost:8000/BookReaderDemo/demo-audioreader.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
