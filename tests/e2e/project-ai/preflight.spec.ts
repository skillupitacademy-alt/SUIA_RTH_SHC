import { test, expect } from '@playwright/test';

/**
 * Preflight checks for Project AI certification.
 * 
 * Verifies:
 * - All required environment variables are present
 * - Application responds at baseURL
 * - No console errors on initial load
 * - No network failures on initial load
 * 
 * Evidence generated: ev-browser-001
 */

test.describe('Project AI Preflight Checks', () => {
  test('should have all required environment variables', async () => {
    // Verify environment variables present
    expect(process.env.PROJECT_AI_BASE_URL, 'PROJECT_AI_BASE_URL must be set').toBeTruthy();
    expect(process.env.PROJECT_AI_RUN_ID, 'PROJECT_AI_RUN_ID must be set').toBeTruthy();
    expect(process.env.PROJECT_AI_COMMIT_SHA, 'PROJECT_AI_COMMIT_SHA must be set').toBeTruthy();
    expect(process.env.PROJECT_AI_SNAPSHOT_HASH, 'PROJECT_AI_SNAPSHOT_HASH must be set').toBeTruthy();
  });
  
  test('should navigate to baseURL without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Capture network failures
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Navigate to base URL
    const baseURL = process.env.PROJECT_AI_BASE_URL || 'http://localhost:3001';
    await page.goto(baseURL);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Attach evidence as test artifact
    const evidence = {
      evidenceId: 'ev-browser-001',
      type: 'preflight',
      baseURL,
      consoleErrors,
      networkErrors,
      runId: process.env.PROJECT_AI_RUN_ID,
      commitSha: process.env.PROJECT_AI_COMMIT_SHA,
      snapshotHash: process.env.PROJECT_AI_SNAPSHOT_HASH,
      timestamp: new Date().toISOString()
    };
    
    await test.info().attach('preflight-evidence', {
      body: JSON.stringify(evidence, null, 2),
      contentType: 'application/json'
    });
    
    // Assert no console errors
    expect(consoleErrors, 'No console errors should be present').toHaveLength(0);
    
    // Assert no network errors
    expect(networkErrors, 'No network errors should be present').toHaveLength(0);
  });
});
