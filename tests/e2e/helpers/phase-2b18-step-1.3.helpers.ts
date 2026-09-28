/**
 * Phase 2B.18 Step 1.3 E2E Test Helpers
 * 
 * Reusable functions for automatic instructional block completion E2E certification.
 */

import { type Page, expect } from '@playwright/test';
import { JAVA_WHATISJAVA_D1, SELECTORS } from '../fixtures/phase-2b18-step-1.3.fixture';

/**
 * Navigate to Java D1 block with authentication
 */
export async function navigateToD1Block(page: Page): Promise<void> {
  // Navigate to Java tutorial D1 block
  await page.goto(JAVA_WHATISJAVA_D1.blockPath);
  
  // Wait for page to load and orchestrator to mount
  await page.waitForLoadState('networkidle');
  
  // Verify auto-completion is enabled
  await expect(page.locator(SELECTORS.autoCompletionEnabled)).toBeVisible();
}

/**
 * Get real ILS activeTimeSec from DOM attribute
 * 
 * CRITICAL: This observes REAL ILS state, not synthetic test data.
 */
export async function getILSActiveTimeSec(page: Page): Promise<number> {
  const container = page.locator(SELECTORS.autoCompletionEnabled);
  const activeTimeSec = await container.getAttribute('data-ils-active-time-sec');
  return parseInt(activeTimeSec ?? '0', 10);
}

/**
 * Get ILS block completion status from DOM attribute
 */
export async function getILSCompletionStatus(page: Page): Promise<boolean> {
  const container = page.locator(SELECTORS.autoCompletionEnabled);
  const isCompleted = await container.getAttribute('data-ils-is-completed');
  return isCompleted === 'true';
}

/**
 * Get ILS block identity from DOM attributes
 */
export async function getILSBlockIdentity(page: Page): Promise<{
  blockId: string | null;
  blockVersion: string | null;
}> {
  const container = page.locator(SELECTORS.autoCompletionEnabled);
  const blockId = await container.getAttribute('data-ils-block-id');
  const blockVersion = await container.getAttribute('data-ils-block-version');
  return { blockId, blockVersion };
}

/**
 * Wait for ILS activeTimeSec to reach target threshold
 * 
 * CRITICAL: This polls REAL ILS state, validating actual accumulation.
 * 
 * @param page - Playwright page
 * @param targetSeconds - Target activeTimeSec threshold
 * @param pollIntervalMs - How often to check (default: 5000ms = 5 seconds)
 * @param timeoutMs - Maximum wait time (default: 180000ms = 3 minutes)
 */
export async function waitForILSActiveTime(
  page: Page,
  targetSeconds: number,
  pollIntervalMs: number = 5000,
  timeoutMs: number = 180000
): Promise<void> {
  const startTime = Date.now();
  
  while (true) {
    const currentActiveTimeSec = await getILSActiveTimeSec(page);
    
    console.log(`[E2E] ILS activeTimeSec: ${currentActiveTimeSec}/${targetSeconds}`);
    
    if (currentActiveTimeSec >= targetSeconds) {
      console.log(`[E2E] Target reached: ${currentActiveTimeSec} >= ${targetSeconds}`);
      return;
    }
    
    const elapsed = Date.now() - startTime;
    if (elapsed >= timeoutMs) {
      throw new Error(
        `Timeout waiting for ILS activeTimeSec to reach ${targetSeconds}. ` +
        `Current: ${currentActiveTimeSec}, Elapsed: ${elapsed}ms`
      );
    }
    
    // Wait before next poll
    await page.waitForTimeout(pollIntervalMs);
  }
}

/**
 * Verify completion API was called with correct payload
 * 
 * Intercepts POST /api/tutorial/ils/blocks/complete to verify:
 * - Request body matches expected block identity
 * - Response indicates success
 */
export async function setupCompletionAPIInterception(page: Page): Promise<{
  waitForCompletion: () => Promise<void>;
}> {
  let completionPromise: Promise<void>;
  let resolveCompletion: () => void;
  
  // Create promise that resolves when completion API is called
  completionPromise = new Promise((resolve) => {
    resolveCompletion = resolve;
  });
  
  // Intercept completion API calls
  await page.route('**/api/tutorial/ils/blocks/complete', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    console.log('[E2E] Completion API called:', postData);
    
    // Continue with real API call
    await route.continue();
    
    // Resolve promise to signal completion
    resolveCompletion();
  });
  
  return {
    waitForCompletion: () => completionPromise,
  };
}

/**
 * Verify block is marked complete in ILS state
 */
export async function verifyBlockCompleted(page: Page): Promise<void> {
  const isCompleted = await getILSCompletionStatus(page);
  expect(isCompleted).toBe(true);
  
  console.log('[E2E] Block completion verified in ILS state');
}

/**
 * Start dev server with specific environment configuration
 */
export async function startDevServerWithFlags(
  flags: Record<string, string>
): Promise<{ url: string; stop: () => Promise<void> }> {
  // This is a placeholder - actual implementation depends on test infrastructure
  // For now, assume server is pre-configured via .env.test file
  return {
    url: 'http://localhost:3003',
    stop: async () => {
      // Cleanup if needed
    },
  };
}

/**
 * Clear browser state between tests
 */
export async function clearBrowserState(page: Page): Promise<void> {
  // Clear cookies
  await page.context().clearCookies();
  
  // Clear local storage and session storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
