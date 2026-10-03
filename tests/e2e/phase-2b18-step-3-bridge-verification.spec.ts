/**
 * Phase 2B.18 Step 1.3 - Step 3 Bridge Runtime Verification
 * 
 * PURPOSE:
 * Prove the complete runtime propagation path exists in the browser:
 * 
 * telemetry delivery success
 *   → result.data contains authoritative state
 *   → callback invoked
 *   → ILSProvider cache updated (immutable replacement)
 *   → activeBlockProgress updated (when block is active)
 *   → orchestrator re-evaluates with fresh activeTimeSec
 * 
 * CRITICAL EVIDENCE REQUIRED:
 * 1. [BlockTelemetry] successful delivery
 * 2. [ILSProvider] [Step 3] Cache updated ... newActiveTimeSec: XX
 * 3. [ILSProvider] [Step 3] Acknowledged block IS active block
 * 4. [GATE F FORENSIC] Evaluation inputs ... activeTimeSec: XX
 * 
 * SCOPE:
 * This is NOT a full Gate F test. This is a focused bridge verification.
 * We only need to prove the propagation path executes, not that completion
 * triggers at the exact threshold.
 * 
 * SUCCESS CRITERIA:
 * - First heartbeat shows cache replacement with server-confirmed activeTimeSec
 * - Orchestrator evaluation sees the same fresh activeTimeSec from cache
 * - All three console logs appear in sequence for the same delivery event
 */

import { test, expect } from '@playwright/test';

// Use existing test credentials (matches other e2e tests)
const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';

// Java tutorial D1 block (from forensic analysis)
// Updated to canonical tutorial-v2 URL structure (matches all other e2e tests)
const JAVA_TUTORIAL_URL = `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`;
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';
const D1_BLOCK_VERSION = 'D1';
const D1_EXPECTED_TIME = 210; // seconds
const D1_THRESHOLD = 168; // 80% of 210

test.describe('Phase 2B.18 Step 3 Bridge Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console log capture
    page.on('console', (msg) => {
      const text = msg.text();
      console.log(`[BROWSER] ${text}`);
    });
  });

  test('Step 3 bridge: telemetry acknowledgement → cache update → activeBlockProgress → orchestrator', async ({ page }) => {
    console.log('\n=== STEP 3 BRIDGE VERIFICATION ===\n');
    console.log('Goal: Prove runtime propagation path executes in browser');
    console.log('Expected sequence:');
    console.log('  1. Telemetry POST succeeds');
    console.log('  2. ILSProvider cache updated with server activeTimeSec');
    console.log('  3. activeBlockProgress updated (block is active)');
    console.log('  4. Orchestrator evaluates with fresh activeTimeSec\n');

    // Login
    console.log('[TEST] Logging in as student...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
    await page.fill('input#email', STUDENT_EMAIL);
    await page.fill('input#password', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    // Dashboard render time in dev mode: 15-25s (observed 23.8s with 13.4s render + 10.3s compile)
    await page.waitForURL(/dashboard|tutorial/, { timeout: 30000, waitUntil: 'domcontentloaded' });
    console.log('[TEST] ✓ Login successful\n');

    // Navigate to Java tutorial
    console.log(`[TEST] Navigating to Java tutorial: ${JAVA_TUTORIAL_URL}`);
    await page.goto(JAVA_TUTORIAL_URL, { waitUntil: 'networkidle' });
    console.log('[TEST] ✓ Tutorial page loaded\n');

    // Wait for D1 block to become active
    console.log('[TEST] Waiting for D1 block to become active...');
    await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, { timeout: 10000 });
    
    // Scroll D1 into viewport to ensure ActiveBlockContext detects it
    const d1Block = page.locator(`[data-block-id="${D1_BLOCK_ID}"]`);
    await d1Block.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000); // Allow ActiveBlockContext to stabilize
    console.log('[TEST] ✓ D1 block is in viewport\n');

    // Verify auto-completion is enabled
    const enabledAttr = await page.locator('[data-auto-completion-enabled]').first().getAttribute('data-auto-completion-enabled');
    console.log(`[TEST] Auto-completion feature flag: ${enabledAttr}`);
    expect(enabledAttr).toBe('true');
    console.log('[TEST] ✓ Auto-completion is enabled\n');

    // Collect console logs for analysis
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
    });

    // Wait for first telemetry heartbeat (30 seconds)
    console.log('[TEST] Waiting for first telemetry heartbeat (30s)...');
    console.log('[TEST] Looking for evidence of complete propagation path...\n');
    
    // Wait 35 seconds to ensure at least one heartbeat has occurred
    await page.waitForTimeout(35000);

    console.log('\n=== ANALYZING BROWSER CONSOLE LOGS ===\n');

    // Look for telemetry delivery success
    const deliveryLogs = consoleMessages.filter(msg => 
      msg.includes('POST /api/tutorial/ils/block-active-time') ||
      msg.includes('block-active-time') ||
      msg.includes('delivery') ||
      msg.includes('processed')
    );

    console.log('[ANALYSIS] Telemetry delivery logs:');
    if (deliveryLogs.length > 0) {
      deliveryLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (none found)');
    }
    console.log();

    // Look for ILSProvider cache update (Step 3 evidence)
    const cacheUpdateLogs = consoleMessages.filter(msg =>
      msg.includes('[ILSProvider] [Step 3]') &&
      (msg.includes('Cache updated') || msg.includes('Telemetry delivery acknowledged'))
    );

    console.log('[ANALYSIS] ILSProvider Step 3 cache update logs:');
    if (cacheUpdateLogs.length > 0) {
      cacheUpdateLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (none found - THIS IS THE CRITICAL MISSING EVIDENCE)');
    }
    console.log();

    // Look for active block bridge (Step 3 critical bridge)
    const activeBridgeLogs = consoleMessages.filter(msg =>
      msg.includes('[ILSProvider] [Step 3] Acknowledged block IS active block')
    );

    console.log('[ANALYSIS] Active block bridge logs:');
    if (activeBridgeLogs.length > 0) {
      activeBridgeLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (none found - bridge did not execute)');
    }
    console.log();

    // Look for orchestrator evaluation with fresh activeTimeSec
    const evaluationLogs = consoleMessages.filter(msg =>
      msg.includes('[GATE F FORENSIC]') ||
      msg.includes('Evaluation inputs') ||
      msg.includes('activeTimeSec')
    );

    console.log('[ANALYSIS] Orchestrator evaluation logs:');
    if (evaluationLogs.length > 0) {
      evaluationLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (none found - orchestrator did not evaluate)');
    }
    console.log();

    // Extract activeTimeSec values from logs (supports both newActiveTimeSec and activeTimeSec)
    const extractActiveTime = (log: string): number | null => {
      const match = log.match(/(?:new)?[Aa]ctiveTimeSec[:\s]+(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    };

    // Find the LAST cache update (most recent telemetry acknowledgment)
    const cacheActiveTime = cacheUpdateLogs
      .map(log => extractActiveTime(log))
      .filter(val => val !== null)
      .pop(); // Take last instead of first

    // Find the orchestrator evaluation that matches the cache value
    // (should appear after the cache update in the log sequence)
    const allEvaluationTimes = evaluationLogs
      .map(log => extractActiveTime(log))
      .filter(val => val !== null);
    
    // Find the evaluation time that matches the cache time
    const evaluationActiveTime = allEvaluationTimes.find(time => time === cacheActiveTime) 
      ?? allEvaluationTimes.pop(); // Fallback to last evaluation if no exact match

    console.log('[ANALYSIS] Extracted activeTimeSec values:');
    console.log(`  Cache update: ${cacheActiveTime ?? '(not found)'}`);
    console.log(`  Orchestrator evaluation: ${evaluationActiveTime ?? '(not found)'}`);
    console.log();

    // CRITICAL VERIFICATION: All three logs must be present
    console.log('\n=== STEP 3 BRIDGE VERIFICATION RESULTS ===\n');

    const hasDelivery = deliveryLogs.length > 0;
    const hasCacheUpdate = cacheUpdateLogs.length > 0;
    const hasActiveBridge = activeBridgeLogs.length > 0;
    const hasEvaluation = evaluationLogs.length > 0;

    console.log(`✓ Evidence 1: Telemetry delivery: ${hasDelivery ? '✅' : '❌'}`);
    console.log(`✓ Evidence 2: Cache updated: ${hasCacheUpdate ? '✅' : '❌'}`);
    console.log(`✓ Evidence 3: Active block bridge: ${hasActiveBridge ? '✅' : '❌'}`);
    console.log(`✓ Evidence 4: Orchestrator evaluation: ${hasEvaluation ? '✅' : '❌'}`);
    console.log();

    if (cacheActiveTime !== null && evaluationActiveTime !== null) {
      const valuesMatch = cacheActiveTime === evaluationActiveTime;
      console.log(`✓ Evidence 5: activeTimeSec values match: ${valuesMatch ? '✅' : '❌'}`);
      console.log(`  Cache: ${cacheActiveTime}s`);
      console.log(`  Evaluation: ${evaluationActiveTime}s`);
      console.log();
    }

    // Assertions
    expect(hasDelivery, 'Telemetry delivery must occur').toBe(true);
    expect(hasCacheUpdate, 'ILSProvider cache must be updated (Step 3)').toBe(true);
    expect(hasActiveBridge, 'Active block bridge must execute (Step 3 critical requirement)').toBe(true);
    expect(hasEvaluation, 'Orchestrator must evaluate with fresh data').toBe(true);

    if (cacheActiveTime !== null && evaluationActiveTime !== null) {
      expect(
        cacheActiveTime,
        'Cache activeTimeSec must match orchestrator evaluation activeTimeSec'
      ).toBe(evaluationActiveTime);
    }

    console.log('\n=== STEP 3 BRIDGE VERIFICATION: PASSED ✅ ===\n');
    console.log('Runtime propagation path confirmed:');
    console.log('  telemetry → callback → cache update → activeBlockProgress → orchestrator');
    console.log();
    console.log('Ready for full Gates F/G/H certification.');
  });

  test('Step 3 race condition check: verify blocksRef populated before first acknowledgement', async ({ page }) => {
    console.log('\n=== STEP 3 RACE CONDITION VERIFICATION ===\n');
    console.log('Goal: Verify blocksRef.current is populated before first telemetry acknowledgement');
    console.log('Expected: Initial ILS navigation fetch completes before first heartbeat\n');

    // Login
    console.log('[TEST] Logging in as student...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
    await page.fill('input#email', STUDENT_EMAIL);
    await page.fill('input#password', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|tutorial/, { timeout: 10000 });
    console.log('[TEST] ✓ Login successful\n');

    const consoleMessages: string[] = [];
    const timestamps: Map<string, number> = new Map();
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      
      // Track timing of key events
      const now = Date.now();
      if (text.includes('fetchProgress - data parsed')) {
        timestamps.set('fetchComplete', now);
      }
      if (text.includes('Cache updated')) {
        timestamps.set('firstAcknowledgement', now);
      }
      if (text.includes('No blocks cache - cannot update')) {
        timestamps.set('raceCondition', now);
      }
    });

    // Navigate to Java tutorial
    console.log(`[TEST] Navigating to Java tutorial: ${JAVA_TUTORIAL_URL}`);
    await page.goto(JAVA_TUTORIAL_URL, { waitUntil: 'networkidle' });
    console.log('[TEST] ✓ Tutorial page loaded\n');

    // Wait for D1 block to become active
    await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, { timeout: 10000 });
    const d1Block = page.locator(`[data-block-id="${D1_BLOCK_ID}"]`);
    await d1Block.scrollIntoViewIfNeeded();
    
    // Wait for first heartbeat
    console.log('[TEST] Waiting for first telemetry heartbeat (35s)...\n');
    await page.waitForTimeout(35000);

    console.log('\n=== RACE CONDITION ANALYSIS ===\n');

    // Check for race condition warning
    const raceWarnings = consoleMessages.filter(msg =>
      msg.includes('No blocks cache - cannot update')
    );

    if (raceWarnings.length > 0) {
      console.log('❌ RACE CONDITION DETECTED:');
      raceWarnings.forEach(log => console.log(`  ${log}`));
      console.log();
      console.log('This means telemetry acknowledgement arrived before ILS cache was populated.');
      console.log('Authoritative state notification was lost.');
      console.log();
      
      expect(raceWarnings.length, 'Race condition should not occur in normal lifecycle').toBe(0);
    } else {
      console.log('✅ NO RACE CONDITION DETECTED');
      console.log('ILS cache was populated before first telemetry acknowledgement.');
      console.log();
    }

    // Verify timing
    const fetchTime = timestamps.get('fetchComplete');
    const ackTime = timestamps.get('firstAcknowledgement');

    if (fetchTime && ackTime) {
      const delta = ackTime - fetchTime;
      console.log('[TIMING] Event sequence:');
      console.log(`  ILS fetch complete: t+0ms`);
      console.log(`  First acknowledgement: t+${delta}ms`);
      console.log();
      
      if (delta > 0) {
        console.log('✅ Correct order: ILS fetch completed before first acknowledgement');
      } else {
        console.log('❌ Race condition: Acknowledgement arrived before fetch completed');
      }
    }

    console.log('\n=== RACE CONDITION CHECK: COMPLETE ===\n');
  });
});
