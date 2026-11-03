import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load optional local test environment variables
dotenv.config({ path: '.env.test.local' });
dotenv.config({ path: '.env.local' });

/**
 * Dedicated Playwright configuration for Authentication Browser Qualification (W1.2-BROWSER-01).
 *
 * Strict Security & Execution Discipline:
 * 1. Sequential execution only (workers: 1, fullyParallel: false) to prevent shared-state races.
 * 2. Sensitive capture disabled by default: trace, video, screenshot, and storageState persistence
 *    are set to 'off' during credentialed steps to prevent token/cookie leakage.
 * 3. Base URLs are derived from environment variables, defaulting to local multi-tenant ports.
 * 4. Production targets are explicitly prohibited.
 */

const SUIA_URL = process.env.SUIA_BASE_URL || 'http://skillup.localhost:3009';
const RTH_URL = process.env.RTH_BASE_URL || 'http://realtutorialhub.localhost:3003';
const SHC_URL = process.env.SHC_BASE_URL || 'http://skillhubcore.localhost:3000';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0, // Retries prohibited on auth qualification to ensure deterministic isolation failures

  reporter: [['list']],

  use: {
    /* Sensitive artifacts disabled by default to prevent secret exposure */
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'suia-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: SUIA_URL,
      },
      testMatch: [
        '**/01-learner-suia-login.spec.ts',
        '**/04-token-refresh-flow.spec.ts',
        '**/05-logout-session-contract.spec.ts',
        '**/06-negative-credentials.spec.ts',
        '**/07-blocked-account-refresh.spec.ts',
        '**/08-same-email-tenant-isolation.spec.ts',
        '**/09-account-switching-boundary.spec.ts',
        '**/10-cross-tenant-authorization-denial.spec.ts',
      ],
    },
    {
      name: 'rth-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: RTH_URL,
      },
      testMatch: [
        '**/02-learner-rth-login.spec.ts',
        '**/04-token-refresh-flow.spec.ts',
        '**/05-logout-session-contract.spec.ts',
        '**/06-negative-credentials.spec.ts',
        '**/08-same-email-tenant-isolation.spec.ts',
      ],
    },
    {
      name: 'shc-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: SHC_URL,
      },
      testMatch: [
        '**/03-admin-shc-login.spec.ts',
        '**/04-token-refresh-flow.spec.ts',
        '**/06-negative-credentials.spec.ts',
        '**/10-cross-tenant-authorization-denial.spec.ts',
      ],
    },
  ],
});
