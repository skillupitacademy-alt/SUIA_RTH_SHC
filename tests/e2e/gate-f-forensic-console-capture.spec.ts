/**
 * Gate F Forensic Console Capture - NO CODE MODIFICATIONS
 * 
 * PURPOSE:
 * Capture existing console.log output from orchestrator/ILS/resolver to prove:
 * 1. What isCompleted value is at first evaluation
 * 2. What activeTimeSec value is at first evaluation
 * 3. What expectedTimeSec value is at first evaluation
 * 4. What progressRole value is at first evaluation
 * 5. What shouldComplete decision is made
 * 
 * This test does NOT modify any production code.
 * It only observes existing runtime behavior.
 */

import { test } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

test('Gate F Forensic: Console capture ONLY', async ({ page }) => {
  // Capture ALL console output
  const allLogs: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    allLogs.push(text);
  });
  
  console.log('[FORENSIC] Starting console capture test');
  console.log('[FORENSIC] This test does NOT modify production code');
  console.log('[FORENSIC] Objective: Capture first evaluation inputs\n');
  
  // Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for login to process
  await page.waitForTimeout(3000);
  
  console.log('[FORENSIC] Login completed, navigating directly to tutorial...');
  
  // Navigate directly to tutorial (skip dashboard to avoid webpack error)
  await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded', timeout: 30000 }
  );
  
  console.log('[FORENSIC] Tutorial page loaded');
  
  // Wait for D1 to render (give more time for compilation)
  await page.waitForTimeout(5000);
  
  // Try to find D1 block (but don't fail if not found - forensic is about console logs)
  const d1Exists = await page.locator(`[data-block-id="${D1_BLOCK_ID}"]`).count();
  
  if (d1Exists > 0) {
    await page.locator(`[data-block-id="${D1_BLOCK_ID}"]`).scrollIntoViewIfNeeded();
    console.log('[FORENSIC] D1 block found and scrolled into view');
  } else {
    console.log('[FORENSIC] ⚠️  D1 block not found in DOM - page may not have loaded correctly');
  }
  
  // Wait 15 seconds to capture first evaluation
  console.log('[FORENSIC] Waiting 15 seconds to capture first evaluation...\n');
  await page.waitForTimeout(15000);
  
  // === FORENSIC ANALYSIS ===
  
  console.log('[FORENSIC] ========================================');
  console.log('[FORENSIC] CONSOLE LOG ANALYSIS');
  console.log('[FORENSIC] ========================================\n');
  
  // Filter critical logs
  const resolverLogs = allLogs.filter(log => log.includes('[BlockMetadataResolver]'));
  const ilsLogs = allLogs.filter(log => log.includes('[ILSProvider]'));
  const completionLogs = allLogs.filter(log => log.includes('[InstructionalBlockCompletion]'));
  
  console.log('[FORENSIC] Total logs captured:', allLogs.length);
  console.log('[FORENSIC] Resolver logs:', resolverLogs.length);
  console.log('[FORENSIC] ILS logs:', ilsLogs.length);
  console.log('[FORENSIC] Completion logs:', completionLogs.length);
  console.log('');
  
  // === CRITICAL EVIDENCE 1: Metadata Resolver ===
  
  console.log('[FORENSIC] === EVIDENCE 1: METADATA RESOLVER ===');
  resolverLogs.forEach(log => console.log('[FORENSIC]', log));
  console.log('');
  
  // === CRITICAL EVIDENCE 2: ILS Block State ===
  
  console.log('[FORENSIC] === EVIDENCE 2: ILS BLOCK STATE ===');
  const blockMatchingLogs = ilsLogs.filter(log => log.includes('Block matching result'));
  
  if (blockMatchingLogs.length === 0) {
    console.log('[FORENSIC] ⚠️  NO block matching logs found');
    console.log('[FORENSIC] This suggests ILSProvider did not find block state');
  } else {
    blockMatchingLogs.forEach(log => {
      console.log('[FORENSIC]', log);
      
      // Try to extract critical values
      try {
        // Parse the log to extract blockState JSON
        const match = log.match(/blockState:\s*(\{.*\})/);
        if (match) {
          const blockState = JSON.parse(match[1]);
          console.log('[FORENSIC] EXTRACTED VALUES:');
          console.log('[FORENSIC]   completedAt:', blockState.completedAt);
          console.log('[FORENSIC]   activeTimeSec:', blockState.activeTimeSec);
          console.log('[FORENSIC]   expectedTimeSec:', blockState.expectedTimeSec);
          console.log('[FORENSIC]   visitCount:', blockState.visitCount);
          console.log('[FORENSIC]   → isCompleted would be:', !!blockState.completedAt);
        }
      } catch (e) {
        console.log('[FORENSIC] Could not parse blockState JSON');
      }
    });
  }
  console.log('');
  
  // === CRITICAL EVIDENCE 3: Evaluation Results ===
  
  console.log('[FORENSIC] === EVIDENCE 3: EVALUATION RESULTS ===');
  const evaluationLogs = completionLogs.filter(log => log.includes('Evaluation result'));
  
  if (evaluationLogs.length === 0) {
    console.log('[FORENSIC] ⚠️  NO evaluation logs found');
    console.log('[FORENSIC] This suggests orchestrator did not evaluate D1');
  } else {
    console.log('[FORENSIC] Evaluation count:', evaluationLogs.length);
    evaluationLogs.forEach((log, index) => {
      console.log(`[FORENSIC] Evaluation ${index + 1}:`, log);
      
      // Try to extract evaluation decision
      try {
        const match = log.match(/evaluation:\s*(\{.*\})/);
        if (match) {
          const evaluation = JSON.parse(match[1]);
          console.log('[FORENSIC] EXTRACTED DECISION:');
          console.log('[FORENSIC]   shouldComplete:', evaluation.shouldComplete);
          console.log('[FORENSIC]   reason:', evaluation.reason);
          console.log('[FORENSIC]   completionRatio:', evaluation.completionRatio);
          console.log('[FORENSIC]   thresholdRatio:', evaluation.thresholdRatio);
        }
      } catch (e) {
        console.log('[FORENSIC] Could not parse evaluation JSON');
      }
    });
  }
  console.log('');
  
  // === CRITICAL EVIDENCE 4: Completion Triggers ===
  
  console.log('[FORENSIC] === EVIDENCE 4: COMPLETION TRIGGERS ===');
  const triggerLogs = completionLogs.filter(log => log.includes('Triggering automatic completion'));
  
  console.log('[FORENSIC] Completion triggers:', triggerLogs.length);
  triggerLogs.forEach((log, index) => {
    console.log(`[FORENSIC] Trigger ${index + 1}:`, log);
  });
  console.log('');
  
  // === CRITICAL EVIDENCE 5: Completion Results ===
  
  console.log('[FORENSIC] === EVIDENCE 5: COMPLETION DELIVERY ===');
  const successLogs = completionLogs.filter(log => log.includes('succeeded'));
  const failLogs = completionLogs.filter(log => log.includes('delivery failed'));
  
  console.log('[FORENSIC] Success deliveries:', successLogs.length);
  console.log('[FORENSIC] Failed deliveries:', failLogs.length);
  console.log('');
  
  // === SUMMARY ===
  
  console.log('[FORENSIC] ========================================');
  console.log('[FORENSIC] SUMMARY');
  console.log('[FORENSIC] ========================================');
  console.log('[FORENSIC] 1. Resolver indexed blocks:', resolverLogs.length > 0 ? 'YES' : 'NO');
  console.log('[FORENSIC] 2. ILS provided block state:', blockMatchingLogs.length > 0 ? 'YES' : 'NO');
  console.log('[FORENSIC] 3. Orchestrator evaluated:', evaluationLogs.length > 0 ? 'YES' : 'NO');
  console.log('[FORENSIC] 4. Completion triggered:', triggerLogs.length > 0 ? 'YES' : 'NO');
  console.log('[FORENSIC] 5. Evaluation count:', evaluationLogs.length);
  console.log('[FORENSIC] 6. Trigger count:', triggerLogs.length);
  console.log('[FORENSIC] ========================================\n');
  
  // All critical logs for manual review
  console.log('[FORENSIC] === ALL CRITICAL LOGS FOR REVIEW ===');
  [...resolverLogs, ...ilsLogs, ...completionLogs].forEach(log => {
    console.log(log);
  });
  console.log('[FORENSIC] === END FORENSIC CAPTURE ===');
});
