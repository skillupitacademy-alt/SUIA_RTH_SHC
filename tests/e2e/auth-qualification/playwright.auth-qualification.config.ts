import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { validateOriginSafety } from './helpers/readiness';

import { allocateOrValidateRunDirectory } from './helpers/output-ownership';

// Load only explicit auth qualification test environment (never auto-load broad .env.local)
dotenv.config({ path: '.env.auth-qualification' });
if (fs.existsSync('.env.auth-qualification.local')) {
  dotenv.config({ path: '.env.auth-qualification.local', override: true });
}

// Do NOT use guessed-port execution defaults (:3009, :3003, :3000).
// If explicitly provided in environment, validate fail-closed; if unset, remain undefined.
const SUIA_URL = process.env.SUIA_BASE_URL;
const RTH_URL = process.env.RTH_BASE_URL;
const SHC_URL = process.env.SHC_BASE_URL;

if (SUIA_URL) validateOriginSafety(SUIA_URL);
if (RTH_URL) validateOriginSafety(RTH_URL);
if (SHC_URL) validateOriginSafety(SHC_URL);

// Validate and allocate unique, owned run directory strictly beneath fixed harness parent.
// Fails closed BEFORE returning config if an invalid run ID or escaping path is provided.
const runAllocation = allocateOrValidateRunDirectory();
const ownedRunDir = runAllocation.runDir;
const ownedOutputDir = runAllocation.outputDir;
const runId = runAllocation.runId;
const ownershipToken = runAllocation.ownershipToken;

// Export run provenance to environment for consistent reporter/worker alignment
process.env.AUTH_QUALIFICATION_RUN_ID = runId;
process.env.AUTH_QUALIFICATION_OWNERSHIP_TOKEN = ownershipToken;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: ownedOutputDir,
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,

  // Sole reporter: Zero-leakage allowlisted reporter with verified run ownership
  reporter: [
    [
      './helpers/safe-reporter.ts',
      {
        outputDir: ownedRunDir,
        runId,
        ownershipToken,
      },
    ],
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
        '**/01-learner-purpose-suia.spec.ts',
        '**/01-learner-suia-login.spec.ts',
        '**/04-token-refresh-suia.spec.ts',
        '**/05-logout-suia.spec.ts',
        '**/05-normal-logout-suia.spec.ts',
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
        '**/02-learner-purpose-rth.spec.ts',
        '**/02-learner-rth-login.spec.ts',
        '**/04-token-refresh-rth.spec.ts',
        '**/05-logout-rth.spec.ts',
        '**/05-normal-logout-rth.spec.ts',
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
        '**/03-admin-shc-dashboard.spec.ts',
        '**/04-token-refresh-shc.spec.ts',
        '**/06-negative-shc.spec.ts',
      ],
    },
  ],
});
