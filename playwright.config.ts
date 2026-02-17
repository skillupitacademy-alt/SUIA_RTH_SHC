import { defineConfig, devices } from '@playwright/test';
import 'tsconfig-paths/register';

export default defineConfig({
  testDir: './apps',
  testMatch: '**/tests/e2e/**/*.spec.ts',
  testIgnore: ['**/src/**', '**/__tests__/**'],
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },
  reporter: [['list']],
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
