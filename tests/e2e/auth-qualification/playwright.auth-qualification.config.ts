import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { validateOriginSafety } from './helpers/readiness';

// Load only explicit auth qualification test environment (never auto-load broad .env.local)
dotenv.config({ path: '.env.auth-qualification' });

// Do NOT use guessed-port execution defaults (:3009, :3003, :3000).
// If explicitly provided in environment, validate fail-closed; if unset, remain undefined.
const SUIA_URL = process.env.SUIA_BASE_URL;
const RTH_URL = process.env.RTH_BASE_URL;
const SHC_URL = process.env.SHC_BASE_URL;

if (SUIA_URL) validateOriginSafety(SUIA_URL);
if (RTH_URL) validateOriginSafety(RTH_URL);
if (SHC_URL) validateOriginSafety(SHC_URL);

// Dedicated, per-run owned output directory separate from workspace root test-results
const ownedOutputDir = process.env.AUTH_QUALIFICATION_OUTPUT_DIR
  ? path.resolve(process.env.AUTH_QUALIFICATION_OUTPUT_DIR)
  : path.resolve(__dirname, '.run-artifacts');

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: ownedOutputDir,
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,

  // Sole reporter: Zero-leakage allowlisted reporter with explicit owned output directory
  reporter: [
    ['./helpers/safe-reporter.ts', { outputDir: ownedOutputDir }],
  ],

  use: {
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    ignoreHTTPSErrors: false,
  },

  projects: [
    {
      name: 'sentinel-checks',
      testMatch: '**/00-*.spec.ts',
    },
    {
      name: 'suia-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: SUIA_URL,
      },
      testMatch: [
        '**/01-learner-suia-login.spec.ts',
        '**/04-token-refresh-suia.spec.ts',
        '**/05-logout-suia.spec.ts',
        '**/06-negative-suia.spec.ts',
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
        '**/04-token-refresh-rth.spec.ts',
        '**/05-logout-rth.spec.ts',
        '**/06-negative-rth.spec.ts',
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
        '**/04-token-refresh-shc.spec.ts',
        '**/06-negative-shc.spec.ts',
      ],
    },
  ],
});
