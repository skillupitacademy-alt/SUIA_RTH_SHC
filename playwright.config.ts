import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Load .env from the root directory relative to this config file
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'playwright-artifacts',
  /* Opt out of parallel tests on local for live-site stability. */
  workers: 1,
  use: {
    // Always capture full traces so the HTML report shows step-by-step state.
    trace: 'on',
    // Also capture a full-page screenshot at the end of every test (pass/fail).
    screenshot: 'on',
    // Keep video only when failing to control artifact size.
    video: 'retain-on-failure',
    // Slow actions slightly so the UI can settle between steps (helps with clean snapshots).
    launchOptions: {
      slowMo: 100,
    },
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
