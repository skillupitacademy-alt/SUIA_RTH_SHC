/**
 * Gate F Diagnostic - Capture orchestrator evaluation inputs
 * 
 * PURPOSE:
 * Short 60-second run to capture the diagnostic logs showing:
 * - When evaluateAndTrigger is called
 * - What isCompleted value is
 * - What activeTimeSec value is
 * - What expectedTimeSec value is
 * - What the evaluation decision is
 * 
 * This proves WHY completion is firing at ~0 seconds instead of 168 seconds.
 */

import { test } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

test('Gate F Diagnostic: Capture orchestrator inputs', async ({ page }) => {
  // Capture ALL console logs
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    
    // Echo diagnostic logs immediately
    if (text.includes('[GATE F DIAGNOSTIC]')) {
      console.log(text);
    }
  });
  
  // Login
  console.log('[DIAGNOSTIC] Step 1: Login');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Login completes - go directly to tutorial page
  await page.waitForTimeout(2000);
  console.log('[DIAGNOSTIC] ✅ Login successful');
  
  // Navigate to D1
  console.log('[DIAGNOSTIC] Step 2: Navigate to D1 block');
  await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded' }
  );
  console.log('[DIAGNOSTIC] ✅ Page loaded');
  
  // Wait for D1 to be visible and scroll into view
  await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, {
    state: 'visible',
    timeout: 10000,
  });
  await page.locator(`[data-block-id="${D1_BLOCK_ID}"]`).scrollIntoViewIfNeeded();
  console.log('[DIAGNOSTIC] ✅ D1 block active in viewport');
  
  // Wait 60 seconds to capture diagnostic logs
  console.log('[DIAGNOSTIC] Step 3: Observing for 60 seconds...');
  await page.waitForTimeout(60000);
  
  // Report findings
  console.log('\n[DIAGNOSTIC] ========== CAPTURED LOGS ==========');
  
  const gateFLogs = consoleLogs.filter(log => log.includes('[GATE F DIAGNOSTIC]'));
  
  console.log(`[DIAGNOSTIC] Total Gate F diagnostic logs: ${gateFLogs.length}`);
  console.log('[DIAGNOSTIC]');
  
  gateFLogs.forEach((log, index) => {
    console.log(`[DIAGNOSTIC] ${index + 1}. ${log}`);
  });
  
  console.log('[DIAGNOSTIC] ==========================================\n');
  
  // Look for evaluation calls
  const evaluationCalls = consoleLogs.filter(log =>
    log.includes('[GATE F DIAGNOSTIC] evaluateAndTrigger called')
  );
  
  const evaluationInputs = consoleLogs.filter(log =>
    log.includes('[GATE F DIAGNOSTIC] Evaluation inputs')
  );
  
  const evaluationResults = consoleLogs.filter(log =>
    log.includes('[GATE F DIAGNOSTIC] Evaluation result')
  );
  
  console.log('[DIAGNOSTIC] ========== SUMMARY ==========');
  console.log(`[DIAGNOSTIC] Evaluation calls: ${evaluationCalls.length}`);
  console.log(`[DIAGNOSTIC] Evaluation inputs captured: ${evaluationInputs.length}`);
  console.log(`[DIAGNOSTIC] Evaluation results captured: ${evaluationResults.length}`);
  console.log('[DIAGNOSTIC] ====================================\n');
});
