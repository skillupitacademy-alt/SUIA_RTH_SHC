/**
 * TutorialPageShell DOM/FLAG FORENSIC DIAGNOSTIC
 * 
 * Purpose: Determine why [data-auto-completion-enabled="true"] is absent from browser DOM
 * 
 * DO NOT FIX ANYTHING. ONLY GATHER EVIDENCE.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
const TUTORIAL_URL = `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`;
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

test('TutorialPageShell DOM/FLAG FORENSIC', async ({ page }) => {
  const evidence: Record<string, any> = {};
  
  // Capture console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('TutorialPageShell') || text.includes('Auto-completion') || 
        text.includes('ILSProvider') || text.includes('ActiveBlockProvider')) {
      consoleLogs.push(`[${msg.type()}] ${text}`);
    }
  });
  
  // Capture page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  console.log('\n[FORENSIC] ============================================');
  console.log('[FORENSIC] TutorialPageShell DOM/FLAG INVESTIGATION');
  console.log('[FORENSIC] ============================================\n');
  
  // LOGIN
  console.log('[FORENSIC] Step 1: Login');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.waitForTimeout(1000);
  await Promise.all([
    page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1500);
  console.log('[FORENSIC] Login complete. Current URL:', page.url());
  
  // NAVIGATE TO TUTORIAL
  console.log('\n[FORENSIC] Step 2: Navigate to tutorial');
  await page.goto(TUTORIAL_URL, { waitUntil: 'domcontentloaded' }); // Changed from networkidle
  await page.waitForTimeout(3000); // Allow React hydration
  
  // 1. Final browser URL
  evidence.finalUrl = page.url();
  console.log('[FORENSIC] 1. Final URL:', evidence.finalUrl);
  
  // 3. Browser DOM: Count data-auto-completion-enabled elements
  const autoCompEnabledCount = await page.evaluate(() => {
    return document.querySelectorAll('[data-auto-completion-enabled]').length;
  });
  evidence.autoCompEnabledCount = autoCompEnabledCount;
  console.log('[FORENSIC] 3. Elements with [data-auto-completion-enabled]:', autoCompEnabledCount);
  
  // 4. Browser DOM: Count data-auto-completion-env-value elements
  const envValueCount = await page.evaluate(() => {
    return document.querySelectorAll('[data-auto-completion-env-value]').length;
  });
  evidence.envValueCount = envValueCount;
  console.log('[FORENSIC] 4. Elements with [data-auto-completion-env-value]:', envValueCount);
  
  // 5. If either exists, print attribute values
  if (autoCompEnabledCount > 0 || envValueCount > 0) {
    const attributes = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-auto-completion-enabled], [data-auto-completion-env-value]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        'data-auto-completion-enabled': el.getAttribute('data-auto-completion-enabled'),
        'data-auto-completion-env-value': el.getAttribute('data-auto-completion-env-value'),
      }));
    });
    evidence.attributeValues = attributes;
    console.log('[FORENSIC] 5. Attribute values:', JSON.stringify(attributes, null, 2));
  } else {
    console.log('[FORENSIC] 5. No elements found with target attributes');
  }
  
  // 6. Check if data-auto-completion-enabled exists anywhere in HTML
  const enabledInHTML = await page.evaluate(() => {
    return document.documentElement.outerHTML.includes('data-auto-completion-enabled');
  });
  evidence.enabledInHTML = enabledInHTML;
  console.log('[FORENSIC] 6. "data-auto-completion-enabled" in HTML:', enabledInHTML);
  
  // 7. Check if data-auto-completion-env-value exists anywhere in HTML
  const envValueInHTML = await page.evaluate(() => {
    return document.documentElement.outerHTML.includes('data-auto-completion-env-value');
  });
  evidence.envValueInHTML = envValueInHTML;
  console.log('[FORENSIC] 7. "data-auto-completion-env-value" in HTML:', envValueInHTML);
  
  // 8-9. Locate the expected TutorialPageShell content element
  const contentElement = await page.evaluate(() => {
    // TutorialPageShell renders a main content area with specific classes
    const candidates = [
      document.querySelector('main [class*="flex-1"]'),
      document.querySelector('main [class*="px-4"]'),
      document.querySelector('div[class*="min-w-0 flex-1"]'),
    ];
    
    for (const el of candidates) {
      if (el) {
        return {
          exists: true,
          tagName: el.tagName,
          className: el.className,
          hasAutoCompAttr: el.hasAttribute('data-auto-completion-enabled'),
          hasEnvAttr: el.hasAttribute('data-auto-completion-env-value'),
        };
      }
    }
    
    return { exists: false };
  });
  evidence.contentElement = contentElement;
  console.log('[FORENSIC] 8-9. TutorialPageShell content element:', JSON.stringify(contentElement, null, 2));
  
  // 10. Capture browser console errors
  evidence.consoleErrors = consoleLogs.filter(log => log.includes('error') || log.includes('Error'));
  evidence.pageErrors = pageErrors;
  console.log('[FORENSIC] 10. Console errors:', evidence.consoleErrors.length);
  console.log('[FORENSIC] 10. Page errors:', evidence.pageErrors.length);
  if (evidence.consoleErrors.length > 0) {
    console.log('Console errors:', evidence.consoleErrors);
  }
  if (evidence.pageErrors.length > 0) {
    console.log('Page errors:', evidence.pageErrors);
  }
  
  // 11. Check for React hydration errors
  const hydrationErrors = consoleLogs.filter(log => 
    log.toLowerCase().includes('hydrat') || 
    log.toLowerCase().includes('mismatch')
  );
  evidence.hydrationErrors = hydrationErrors;
  console.log('[FORENSIC] 11. React hydration errors:', hydrationErrors.length);
  if (hydrationErrors.length > 0) {
    console.log('Hydration errors:', hydrationErrors);
  }
  
  // 12. Capture first 1000 chars of body text
  const bodyText = await page.evaluate(() => {
    return document.body.innerText.substring(0, 1000);
  });
  evidence.bodyTextPreview = bodyText;
  console.log('[FORENSIC] 12. Body text preview (first 200 chars):', bodyText.substring(0, 200));
  
  // 13. Check if real D1 element exists
  const d1Exists = await page.locator(`[data-block-id="${D1_BLOCK_ID}"]`).count();
  evidence.d1BlockExists = d1Exists > 0;
  console.log('[FORENSIC] 13. D1 block exists ([data-block-id="..."]):', evidence.d1BlockExists);
  
  // 14. Capture relevant console logs (TutorialPageShell, ILSProvider)
  evidence.relevantLogs = consoleLogs;
  console.log('[FORENSIC] 14. Relevant console logs captured:', consoleLogs.length);
  
  // Print TutorialPageShell flag evaluation logs
  const flagLogs = consoleLogs.filter(log => log.includes('Auto-completion flag evaluation'));
  console.log('\n[FORENSIC] TutorialPageShell flag evaluation logs:');
  if (flagLogs.length > 0) {
    flagLogs.forEach(log => console.log('  ' + log));
  } else {
    console.log('  NO FLAG EVALUATION LOGS FOUND');
  }
  
  // Print ILSProvider block matching logs
  const ilsLogs = consoleLogs.filter(log => log.includes('Block matching result') || log.includes('activeBlock'));
  console.log('\n[FORENSIC] ILSProvider active block logs:');
  if (ilsLogs.length > 0) {
    ilsLogs.forEach(log => console.log('  ' + log));
  } else {
    console.log('  NO ILS BLOCK LOGS FOUND');
  }
  
  // CLASSIFICATION
  console.log('\n' + '='.repeat(80));
  console.log('ROOT CAUSE CLASSIFICATION:');
  console.log('='.repeat(80));
  
  // Extract flag value from logs
  const flagEvalLog = flagLogs[0];
  let serverRawValue = 'NOT_FOUND';
  let serverEnabled = 'NOT_FOUND';
  
  if (flagEvalLog) {
    const match = flagEvalLog.match(/rawValue:\s*(\w+|'[^']*'|"[^"]*"),\s*enabled:\s*(\w+)/);
    if (match) {
      serverRawValue = match[1];
      serverEnabled = match[2];
    }
  }
  
  console.log('\nServer-side evidence:');
  console.log(`  rawValue: ${serverRawValue}`);
  console.log(`  enabled: ${serverEnabled}`);
  
  console.log('\nBrowser-side evidence:');
  console.log(`  [data-auto-completion-enabled] count: ${autoCompEnabledCount}`);
  console.log(`  Attribute in HTML: ${enabledInHTML}`);
  console.log(`  Content element exists: ${contentElement.exists}`);
  console.log(`  D1 block exists: ${evidence.d1BlockExists}`);
  
  console.log('\n');
  
  if (serverEnabled === 'false' || serverRawValue === 'undefined') {
    console.log('CLASSIFICATION: A. Flag false at server');
    console.log('Evidence: Server evaluated enabled=false or rawValue=undefined');
  } else if (serverEnabled === 'true' && !enabledInHTML) {
    console.log('CLASSIFICATION: B. Flag true but attribute absent from server HTML');
    console.log('Evidence: Server enabled=true but attribute not in document HTML');
  } else if (serverEnabled === 'true' && enabledInHTML && autoCompEnabledCount === 0) {
    console.log('CLASSIFICATION: C. Attribute present in HTML but removed/replaced during hydration');
    console.log('Evidence: Attribute in HTML but not queryable via DOM API');
  } else if (!contentElement.exists) {
    console.log('CLASSIFICATION: D. TutorialPageShell not rendering expected tree');
    console.log('Evidence: Expected content element not found');
  } else if (evidence.pageErrors.length > 0 || evidence.hydrationErrors.length > 0) {
    console.log('CLASSIFICATION: F. Client-side exception prevents expected render');
    console.log('Evidence: Page errors or hydration errors detected');
  } else if (serverRawValue === 'NOT_FOUND') {
    console.log('CLASSIFICATION: G. Other - Server flag evaluation log not captured');
    console.log('Evidence: No TutorialPageShell flag evaluation log found');
  } else {
    console.log('CLASSIFICATION: G. Other - see evidence above');
  }
  
  console.log('='.repeat(80) + '\n');
  
  // This test always "passes" - it's purely diagnostic
  expect(true).toBe(true);
});
