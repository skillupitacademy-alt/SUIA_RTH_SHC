import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Project AI certification tests.
 * 
 * ARCHITECTURE RULE: Sequential execution only (workers: 1).
 * Never run browser tests in parallel to ensure deterministic results.
 * 
 * Environment variables required:
 * - PROJECT_AI_BASE_URL: Base URL for application under test
 * - PROJECT_AI_RUN_ID: Unique run identifier
 * - PROJECT_AI_COMMIT_SHA: Git commit SHA
 * - PROJECT_AI_SNAPSHOT_HASH: Snapshot hash for evidence binding
 */

export default defineConfig({
  // Test directory for Project AI certification
  testDir: './tests/e2e/project-ai',
  
  // Sequential execution only - NEVER parallel
  fullyParallel: false,
  workers: 1,
  
  // Fail fast on CI
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Reporter configuration
  reporter: [
    // JSON output for programmatic consumption by Python orchestration
    ['json', { 
      outputFile: '.project-ai/runs/current/results/playwright.json' 
    }],
    // HTML report for human review
    ['html', { 
      outputFolder: '.project-ai/runs/current/playwright-report',
      open: 'never'
    }],
    // Console output for real-time feedback
    ['list']
  ],
  
  // Global test settings
  use: {
    // Base URL from environment (required)
    baseURL: process.env.PROJECT_AI_BASE_URL,
    
    // Capture trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },
  
  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Viewport for consistent rendering
        viewport: { width: 1280, height: 720 }
      },
    }
  ],
  
  // Web server configuration (optional - tests may start their own)
  // webServer: {
  //   command: 'pnpm --filter realtutorialhub-admin dev',
  //   url: 'http://localhost:3001',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000, // 2 minutes
  // },
});
