import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/test-use-options. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/ils-tutorial-session.spec.ts'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/ils-tutorial-session.spec.ts'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/ils-tutorial-session.spec.ts'],
    },

    /**
     * ILS Tutorial Session — SUIA brand
     * Run: pnpm test:e2e:ils --project=suia
     */
    {
      name: 'suia',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009',
      },
      testMatch: ['**/ils-tutorial-session.spec.ts'],
    },

    /**
     * ILS Tutorial Session — RTH brand
     * Run: pnpm test:e2e:ils --project=rth
     */
    {
      name: 'rth',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.RTH_BASE_URL ?? 'http://realtutorialhub.localhost:3003',
      },
      testMatch: ['**/ils-tutorial-session.spec.ts'],
    },
  ],
});
