import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Try to load env from admin-app specific .env.local if it exists
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
// Also load from root .env for shared credentials
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    actionTimeout: 0,
    baseURL: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
