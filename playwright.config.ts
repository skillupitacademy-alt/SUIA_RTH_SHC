import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import 'tsconfig-paths/register';

import { envPath } from './packages/config/envPaths';

// Load root .env so Playwright has base URLs and creds
dotenv.config({ path: envPath('.env') });

export default defineConfig({
  testDir: '.',
  testMatch: ['**/tests/**/*.{spec,test}.ts'],
  testIgnore: ['**/src/**', '**/__tests__/**', '**/node_modules/**'],
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },
  outputDir: 'tests/.playwright/results',
  reporter: [['list'], ['html', { outputFolder: 'tests/.playwright/report', open: 'never' }]],
  fullyParallel: false,
  use: {
    baseURL: process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
