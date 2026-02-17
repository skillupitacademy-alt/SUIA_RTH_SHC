import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

import { envPath } from '@quiz/config/envPaths';

// Load root .env so TEST_* creds are available in workers
dotenv.config({ path: envPath('.env') });

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    actionTimeout: 0,
    baseURL: process.env.NEXT_PUBLIC_WEB_APP_URL,
    trace: 'retain-on-failure', // rely on built-in trace handling to avoid double-start conflicts
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    contextOptions: {
      recordHar: {
        path: path.join(__dirname, 'artifacts', 'network.har'),
        mode: 'full',
        content: 'embed',
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
