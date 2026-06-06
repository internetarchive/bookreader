// @ts-check
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:8000';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // OL mobile tests are sequential (share server state)
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['iPhone 12'] },
    },
  ],
  // Assumes `npm run build && npx http-server -p 8000 -c-1 .` is already running.
  // Set reuseExistingServer so CI can start it externally.
  webServer: {
    command: 'npx http-server -p 8000 -c-1 .',
    port: 8000,
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
