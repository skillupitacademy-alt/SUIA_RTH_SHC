/**
 * GATE E: Short Runtime Proof - Session/Lifecycle Verification
 * 
 * PURPOSE:
 * Verifies BlockTelemetryProvider initialization lifecycle works correctly
 * when session becomes available during page load.
 * 
 * PROOF POINTS:
 * 1. Session initially unavailable (early warning expected)
 * 2. Session established
 * 3. Active block exists
 * 4. Main telemetry effect runs with session
 * 5. Visit initialization occurs
 * 6. Timing starts
 * 7. Actual active-time POST emitted (30s+ heartbeat)
 * 
 * NOTE: This does NOT test 168-second accumulation or automatic completion.
 * That is Gate F/G/H. This only proves the initialization lifecycle.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

test('Gate E: Session/lifecycle initialization proof', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
  });
  
  // Capture active-time requests
  const activeTimeRequests: Array<{ blockId: string; activeTimeSec: number }> = [];
  page.on('request', request => {
    if (request.url().includes('/api/tutorial/ils/block-active-time')) {
      try {
        const body = request.postDataJSON();
        if (body?.blockId) {
          activeTimeRequests.push({
            blockId: body.blockId,
            activeTimeSec: body.activeTimeSec || 0
          });
          console.log('[GATE E] Captured active-time POST:', body);
        }
      } catch {
        // Ignore non-JSON
      }
    }
  });
  
  // Login
  console.log('[GATE E] Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  console.log('[GATE E] Login successful');
  
  // Navigate to Java whatisjava D1 block
  console.log('[GATE E] Navigating to whatisjava page...');
  const response = await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded' }
  );
  
  expect(response?.status()).toBe(200);
  console.log('[GATE E] Page loaded');
  
  // Wait for D1 block to be visible and scroll into view
  await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, { 
    state: 'visible',
    timeout: 10000 
  });
  
  await page.locator(`[data-block-id="${D1_BLOCK_ID}"]`).scrollIntoViewIfNeeded();
  console.log('[GATE E] D1 block scrolled into view');
  
  // Wait for telemetry initialization
  await page.waitForTimeout(3000);
  
  // PROOF 1: Session lifecycle logs
  const relevantLogs = consoleLogs.filter(log => 
    log.includes('[BlockTelemetry]') || 
    log.includes('[Tutorial Session]') ||
    log.includes('[ActiveBlockProvider]')
  );
  
  console.log('\n[GATE E] ========== SESSION/LIFECYCLE TIMELINE ==========');
  relevantLogs.forEach((log, index) => {
    if (log.includes('Session') || log.includes('session') || log.includes('Main active-block')) {
      console.log(`[GATE E] ${index}: ${log}`);
    }
  });
  console.log('[GATE E] ================================================\n');
  
  // PROOF 2: Session established
  const hasSessionEstablished = consoleLogs.some(log =>
    log.includes('[Tutorial Session] Learning session established')
  );
  
  console.log('[GATE E] Session established:', hasSessionEstablished);
  expect(hasSessionEstablished).toBe(true);
  
  // PROOF 3: Early warning is expected (session not yet available at first render)
  const hasEarlyWarning = consoleLogs.some(log => 
    log.includes('[BlockTelemetry] No session ID provided')
  );
  
  console.log('[GATE E] Early warning (expected during initial render):', hasEarlyWarning);
  // This is NOT a failure condition - it's expected before session is available
  
  // PROOF 4: Telemetry re-initialized after session available
  // Look for evidence that transition actually executed
  const hasTransitionExecution = consoleLogs.some(log =>
    log.includes('transitionToNewBlock') || 
    log.includes('Starting timing') ||
    log.includes('Emitting visit')
  );
  
  console.log('[GATE E] Telemetry transition executed:', hasTransitionExecution);
  
  // PROOF 5: Wait for heartbeat (30 seconds default)
  console.log('[GATE E] Waiting 35 seconds for heartbeat and active-time POST...');
  await page.waitForTimeout(35000);
  
  // PROOF 6: Active-time POST was sent
  console.log('[GATE E] Active-time requests captured:', activeTimeRequests.length);
  activeTimeRequests.forEach((req, idx) => {
    console.log(`[GATE E]   Request ${idx + 1}:`, req);
  });
  
  const d1ActiveTimeRequest = activeTimeRequests.find(req => req.blockId === D1_BLOCK_ID);
  
  if (!d1ActiveTimeRequest) {
    console.log('[GATE E] ❌ FAIL: No active-time POST captured for D1 block');
    console.log('[GATE E] This indicates telemetry delivery pipeline issue');
  } else {
    console.log('[GATE E] ✅ PASS: Active-time POST captured for D1:', d1ActiveTimeRequest);
    if (d1ActiveTimeRequest.activeTimeSec > 0) {
      console.log('[GATE E] ✅ PASS: activeTimeSec > 0, timing is accumulating');
    } else {
      console.log('[GATE E] ⚠️  WARNING: activeTimeSec = 0, but POST was sent');
    }
  }
  
  // Final assertion: telemetry delivery occurred
  expect(d1ActiveTimeRequest).toBeDefined();
  expect(d1ActiveTimeRequest!.activeTimeSec).toBeGreaterThan(0);
  
  console.log('[GATE E] ✅ GATE E PASSED: Session/lifecycle initialization proven');
  console.log('[GATE E] - Session established during page load');
  console.log('[GATE E] - Telemetry initialized correctly');
  console.log('[GATE E] - Active-time delivery working');
});
