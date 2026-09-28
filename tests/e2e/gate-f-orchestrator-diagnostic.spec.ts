/**
 * Gate F: Orchestrator Diagnostic
 * 
 * Purpose: Diagnose why orchestrator isn't evaluating/triggering completion
 * 
 * Method:
 * 1. Navigate to D1 block
 * 2. Wait 60 seconds
 * 3. Capture browser console logs to see orchestrator activity
 */

import { test } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

test('Gate F: Orchestrator diagnostic', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  // Capture ALL console logs
  const consoleLogs: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    
    // Print orchestrator/ILS logs immediately
    if (text.includes('[InstructionalBlockCompletion]') || 
        text.includes('[ILSProvider]') ||
        text.includes('[GATE F FORENSIC]')) {
      console.log(text);
    }
  });

  // Login
  console.log('[DIAGNOSTIC] Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);
  
  console.log('[DIAGNOSTIC] Navigating to D1 block...');
  await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded', timeout: 30000 }
  );

  await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, { 
    state: 'visible',
    timeout: 10000 
  });

  console.log('[DIAGNOSTIC] D1 block visible, waiting 60 seconds...');
  await page.waitForTimeout(60000);

  console.log('\n========== CONSOLE LOG ANALYSIS ==========\n');
  
  const orchestratorLogs = consoleLogs.filter(log => log.includes('[InstructionalBlockCompletion]'));
  const ilsLogs = consoleLogs.filter(log => log.includes('[ILSProvider]'));
  const forensicLogs = consoleLogs.filter(log => log.includes('[GATE F FORENSIC]'));
  
  console.log(`Orchestrator logs: ${orchestratorLogs.length}`);
  orchestratorLogs.forEach((log, idx) => {
    console.log(`  [${idx}] ${log}`);
  });
  
  console.log(`\nILS logs: ${ilsLogs.length}`);
  ilsLogs.slice(0, 10).forEach((log, idx) => {
    console.log(`  [${idx}] ${log}`);
  });
  
  console.log(`\nForensic logs: ${forensicLogs.length}`);
  forensicLogs.forEach((log, idx) => {
    console.log(`  [${idx}] ${log}`);
  });
  
  console.log('\n========================================\n');
});
