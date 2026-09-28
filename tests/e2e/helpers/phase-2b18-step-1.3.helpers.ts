/**
 * Phase 2B.18 Step 1.3 E2E Test Helpers
 * 
 * Reusable functions for automatic instructional block completion E2E certification.
 */

import { type Page, expect } from '@playwright/test';
import { JAVA_WHATISJAVA_D1, SELECTORS } from '../fixtures/phase-2b18-step-1.3.fixture';

/**
 * Navigate to Java D1 block with authentication
 * 
 * Uses baseURL from Playwright config (suia project baseURL)
 * or constructs full URL from BASE_URL constant if needed.
 */
export async function navigateToD1Block(page: Page, baseURL: string): Promise<void> {
  // Construct full URL
  const fullURL = `${baseURL}${JAVA_WHATISJAVA_D1.blockPath}`;
  
  // Capture browser console messages
  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('[Browser Page Error]:', error.message);
  });
  
  // Navigate to Java tutorial D1 block
  const response = await page.goto(fullURL);
  
  console.log('[E2E] Navigation response:', {
    url: response?.url(),
    status: response?.status(),
    statusText: response?.statusText(),
  });
  
  // Wait for page to load and orchestrator to mount
  // Use domcontentloaded instead of networkidle to avoid timeout on pending resources
  await page.waitForLoadState('domcontentloaded');
  
  // CRITICAL: Scroll D1 block into view to make it the active block
  // The ActiveBlockProvider tracks which block is in viewport via IntersectionObserver
  // Without scrolling, the I1 (introduction) block remains active
  console.log('[E2E] Scrolling D1 block into view...');
  const d1BlockLocator = page.locator(`[data-block-id="${JAVA_WHATISJAVA_D1.blockId}"]`);
  await d1BlockLocator.scrollIntoViewIfNeeded();
  
  // Wait for ActiveBlockProvider to update (IntersectionObserver callback)
  await page.waitForTimeout(1000);
  
  // Capture final URL
  const finalURL = page.url();
  console.log('[E2E] Final URL after navigation:', finalURL);
  
  // CRITICAL DIAGNOSTIC: Inspect exact DOM state before assertion
  console.log('[E2E] Inspecting DOM state...');
  
  // Check for any elements with data-auto-completion attributes
  const elementCount = await page.locator('[data-auto-completion-enabled]').count();
  console.log('[E2E] Elements with data-auto-completion-enabled:', elementCount);
  
  if (elementCount === 0) {
    // No elements found - inspect main to see what's actually there
    const mainContent = await page.locator('main').evaluate((main) => {
      const contentDiv = main.querySelector('.min-w-0.flex-1');
      return {
        mainExists: !!main,
        contentDivExists: !!contentDiv,
        contentDivAttributes: contentDiv ? Array.from(contentDiv.attributes).map(attr => ({
          name: attr.name,
          value: attr.value,
        })) : null,
        htmlSnippet: main.innerHTML.substring(0, 500),
        hasAutoCompletionInHTML: main.innerHTML.includes('data-auto-completion'),
      };
    });
    
    console.log('[E2E] Main content inspection:', JSON.stringify(mainContent, null, 2));
    
    // Save page content for analysis
    const pageContent = await page.content();
    console.log('[E2E] Page content length:', pageContent.length);
    console.log('[E2E] Has data-auto-completion in full HTML:', pageContent.includes('data-auto-completion'));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dom-state-diagnostic.png', fullPage: true });
    console.log('[E2E] Screenshot saved to test-results/dom-state-diagnostic.png');
  } else {
    // Elements found - inspect their values
    const attributes = await page.locator('[data-auto-completion-enabled]').first().evaluate((el) => ({
      enabled: el.getAttribute('data-auto-completion-enabled'),
      envValue: el.getAttribute('data-auto-completion-env-value'),
      tagName: el.tagName,
      className: el.className,
    }));
    
    console.log('[E2E] Found element attributes:', JSON.stringify(attributes, null, 2));
  }
  
  // Now verify auto-completion is enabled
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
 * 
 * Waits for ILS to populate block identity attributes (max 30 seconds)
 */
export async function getILSBlockIdentity(page: Page): Promise<{
  blockId: string | null;
  blockVersion: string | null;
}> {
  const container = page.locator(SELECTORS.autoCompletionEnabled);
  
  // Wait for container to exist
  try {
    await container.waitFor({ state: 'attached', timeout: 10000 });
    console.log('[E2E] Container found, waiting for ILS block identity...');
    
    // Poll for blockId attribute (ILS needs time to load active block)
    // Increased to 60 attempts × 500ms = 30 seconds max wait
    for (let i = 0; i < 60; i++) {
      const blockId = await container.getAttribute('data-ils-block-id');
      if (blockId) {
        const blockVersion = await container.getAttribute('data-ils-block-version');
        console.log('[E2E] Block identity found:', { blockId, blockVersion, attemptsNeeded: i + 1 });
        return { blockId, blockVersion };
      }
      
      // Log every 5 seconds
      if (i % 10 === 0 && i > 0) {
        console.log(`[E2E] Still waiting for block identity... (${i * 0.5}s elapsed)`);
      }
      
      await page.waitForTimeout(500); // Wait 500ms between polls
    }
    
    // Timeout - return null
    console.warn('[E2E] Timeout waiting for ILS block identity attributes (30s)');
    return { blockId: null, blockVersion: null };
  } catch (error) {
    console.error('[E2E] Error reading block identity:', error);
    return { blockId: null, blockVersion: null };
  }
}

/**
 * Wait for ILS activeTimeSec to reach target threshold
 * 
 * CRITICAL: This polls REAL ILS state, validating actual accumulation.
 * 
 * @param page - Playwright page
 * @param targetSeconds - Target activeTimeSec threshold (168 for D1)
 * @param pollIntervalMs - How often to check (default: 5000ms = 5 seconds)
 * @param timeoutMs - Maximum wait time (default: 300000ms = 5 minutes)
 *   Note: Threshold is 168 seconds, but timeout includes margin for
 *   heartbeat/scheduling variance. Does NOT alter the 80% threshold.
 */
export async function waitForILSActiveTime(
  page: Page,
  targetSeconds: number,
  pollIntervalMs: number = 5000,
  timeoutMs: number = 300000
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
 * Completion request record from observation
 */
export interface CompletionRequestRecord {
  url: string;
  method: string;
  body: Record<string, unknown> | null;
  responseStatus?: number;
  timestamp: number;
}

/**
 * Observe completion API requests (non-intercepting)
 * 
 * Uses page.on('request') and page.on('response') to observe REAL requests
 * while allowing them to reach the REAL backend.
 * 
 * CRITICAL: Does NOT use page.route() interception.
 * The certification requires observing real requests to real backend.
 * 
 * Actual endpoint: /api/tutorial/ils/block-completion
 * (from tutorialTrackingService.ts markBlockComplete implementation)
 */
export function observeCompletionRequests(
  page: Page
): CompletionRequestRecord[] {
  const requests: CompletionRequestRecord[] = [];
  
  page.on('request', (request) => {
    if (
      request.method() !== 'POST' ||
      !request.url().includes('/api/tutorial/ils/block-completion')
    ) {
      return;
    }
    
    let body: Record<string, unknown> | null = null;
    
    try {
      body = request.postDataJSON();
    } catch {
      body = null;
    }
    
    requests.push({
      url: request.url(),
      method: request.method(),
      body,
      timestamp: Date.now(),
    });
    
    console.log('[E2E] Completion API request observed:', body);
  });
  
  page.on('response', (response) => {
    const matchingRequest = requests.find(
      (entry) =>
        entry.url === response.url() &&
        entry.method === response.request().method() &&
        entry.responseStatus === undefined
    );
    
    if (matchingRequest) {
      matchingRequest.responseStatus = response.status();
      console.log('[E2E] Completion API response:', response.status());
    }
  });
  
  return requests;
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
