/**
 * Gate F: Zero Baseline Verification
 * 
 * Purpose: Verify D1 block activeTimeSec starts at 0 after reset
 * 
 * Method:
 * 1. Navigate to Java D1 block (whatisjava)
 * 2. Wait 30 seconds for telemetry accumulation
 * 3. Capture POST /api/tutorial/ils/block-active-time
 * 4. Verify activeTimeSec is reasonable (20-35s range, not 600+)
 * 5. Verify NO completion POST occurred
 * 
 * Success criteria:
 * - activeTimeSec in range [20, 35]
 * - Zero completion requests
 * - data-auto-completion-enabled="true"
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';

const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

test.describe('Gate F: Zero Baseline Verification', () => {
  test('D1 block activeTimeSec starts at 0 after reset', async ({ page }) => {
    const activeTimeRequests: Array<{
      blockId: string;
      activeTimeSec: number;
      timestamp: number;
    }> = [];

    const completionRequests: Array<{
      blockId: string;
      timestamp: number;
    }> = [];

    // Intercept telemetry POST
    await page.route('**/api/tutorial/ils/block-active-time', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        activeTimeRequests.push({
          blockId: postData.blockId,
          activeTimeSec: postData.activeTimeSec,
          timestamp: Date.now(),
        });
      }
      await route.continue();
    });

    // Intercept completion POST
    await page.route('**/api/tutorial/ils/block-completion', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        completionRequests.push({
          blockId: postData.blockId,
          timestamp: Date.now(),
        });
      }
      await route.continue();
    });

    // 1. Navigate to login
    console.log('[GATE F] Navigating to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });

    // 2. Login
    console.log('[GATE F] Logging in as test user...');
    await page.fill('input#email', STUDENT_EMAIL);
    await page.fill('input#password', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for login to process
    await page.waitForTimeout(3000);

    console.log('[GATE F] Login completed, navigating to Java D1 block...');

    // 3. Navigate directly to Java D1 block (skip dashboard due to webpack error)
    await page.goto(
      `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );

    console.log('[GATE F] Tutorial page loaded, waiting for blocks to render...');
    
    // Wait for blocks to render (compilation can take time)
    await page.waitForTimeout(5000);

    // 4. Wait for D1 block to be visible
    const d1BlockLocator = page.locator(`[data-block-id="${D1_BLOCK_ID}"]`);
    const d1Exists = await d1BlockLocator.count();
    
    if (d1Exists === 0) {
      console.log('[GATE F] ❌ D1 block not found in DOM');
      console.log('[GATE F] Available blocks:');
      const allBlocks = await page.locator('[data-block-id]').all();
      for (const block of allBlocks.slice(0, 5)) {
        const blockId = await block.getAttribute('data-block-id');
        console.log(`  - ${blockId}`);
      }
      throw new Error('D1 block not found - cannot proceed with baseline verification');
    }
    
    await expect(d1BlockLocator).toBeVisible({ timeout: 5000 });
    console.log('[GATE F] D1 block visible, checking feature flag...');

    // 6. Verify feature flag propagation
    const autoCompletionEnabled = await d1BlockLocator.getAttribute('data-auto-completion-enabled');
    const autoCompletionEnvValue = await d1BlockLocator.getAttribute('data-auto-completion-env-value');
    
    console.log('[GATE F] Feature flag state:');
    console.log(`  data-auto-completion-enabled: ${autoCompletionEnabled}`);
    console.log(`  data-auto-completion-env-value: ${autoCompletionEnvValue}`);

    expect(autoCompletionEnabled).toBe('true');
    expect(autoCompletionEnvValue).toBe('true');

    // 5. Wait 30 seconds for telemetry accumulation
    console.log('[GATE F] Waiting 30 seconds for telemetry...');
    const startTime = Date.now();
    await page.waitForTimeout(30000);
    const endTime = Date.now();
    const actualWaitMs = endTime - startTime;

    console.log(`[GATE F] Wait complete (${Math.round(actualWaitMs / 1000)}s)`);

    // 6. Analyze results
    console.log(`[GATE F] Active time requests captured: ${activeTimeRequests.length}`);
    console.log(`[GATE F] Completion requests captured: ${completionRequests.length}`);

    // Filter for D1 block
    const d1ActiveTimeRequests = activeTimeRequests.filter(
      (req) => req.blockId === D1_BLOCK_ID
    );

    console.log(`[GATE F] D1 block active time requests: ${d1ActiveTimeRequests.length}`);

    if (d1ActiveTimeRequests.length > 0) {
      const lastRequest = d1ActiveTimeRequests[d1ActiveTimeRequests.length - 1];
      console.log(`[GATE F] Last D1 activeTimeSec: ${lastRequest.activeTimeSec}s`);

      // Verify activeTimeSec is in reasonable range (20-35s)
      expect(lastRequest.activeTimeSec).toBeGreaterThanOrEqual(20);
      expect(lastRequest.activeTimeSec).toBeLessThanOrEqual(35);

      console.log('[GATE F] ✅ activeTimeSec baseline verified: starts at 0, accumulates correctly');
    } else {
      throw new Error('No D1 active time requests captured');
    }

    // Verify NO completion occurred
    const d1CompletionRequests = completionRequests.filter(
      (req) => req.blockId === D1_BLOCK_ID
    );

    expect(d1CompletionRequests.length).toBe(0);
    console.log('[GATE F] ✅ No premature completion occurred');

    console.log('\n[GATE F] === Zero Baseline Verification PASSED ===\n');
  });
});
