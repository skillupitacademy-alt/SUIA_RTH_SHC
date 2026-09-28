/**
 * LOGIN-ONLY FORENSIC DIAGNOSTIC
 * 
 * Purpose: Determine why login does not navigate away from /login
 * 
 * DO NOT FIX ANYTHING. ONLY GATHER EVIDENCE.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';

test('LOGIN FORENSIC: Capture complete login flow evidence', async ({ page }) => {
  const evidence: Record<string, any> = {};
  
  // Capture console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Capture page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  // Capture network requests
  const networkRequests: any[] = [];
  page.on('request', request => {
    if (request.url().includes('/login') || request.url().includes('/auth')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // Capture network responses
  const networkResponses: any[] = [];
  page.on('response', async response => {
    if (response.url().includes('/login') || response.url().includes('/auth')) {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // 1. Navigate to login
  console.log('\n[DIAGNOSTIC] Step 1: Navigate to /login');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  evidence.initialUrl = page.url();
  console.log('[DIAGNOSTIC] Initial URL:', evidence.initialUrl);
  
  // 2. Wait for form
  console.log('[DIAGNOSTIC] Step 2: Wait for login form');
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  evidence.formVisible = true;
  console.log('[DIAGNOSTIC] Form visible: true');
  
  // 3. Fill credentials
  console.log('[DIAGNOSTIC] Step 3: Fill credentials');
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  evidence.credentialsFilled = true;
  console.log('[DIAGNOSTIC] Credentials filled (email shown, password hidden):', STUDENT_EMAIL);
  
  // 4. Wait for hydration
  await page.waitForTimeout(1000);
  
  // 5. Click submit and wait for response
  console.log('[DIAGNOSTIC] Step 4: Click submit button');
  
  // Start the click
  const submitPromise = page.click('button[type="submit"]');
  
  // Wait for navigation or timeout (10 seconds) - catch errors to continue diagnostic
  let navigationResult = 'timeout';
  try {
    const raceResult = await Promise.race([
      page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 }).then(() => 'navigated'),
      new Promise(resolve => setTimeout(() => resolve('timeout'), 10000)),
    ]);
    navigationResult = raceResult as string;
  } catch (error: any) {
    navigationResult = `error: ${error.message}`;
  }
  
  // Wait for click to complete
  try {
    await submitPromise;
  } catch (error) {
    // Click may fail if page navigated, that's OK
  }
  
  evidence.navigationResult = navigationResult;
  evidence.finalUrl = page.url();
  
  console.log('[DIAGNOSTIC] Navigation result:', navigationResult);
  console.log('[DIAGNOSTIC] Final URL:', evidence.finalUrl);
  
  // 6. Check if still on login page
  evidence.stillOnLogin = page.url().includes('/login');
  console.log('[DIAGNOSTIC] Still on /login:', evidence.stillOnLogin);
  
  // 7. Capture visible error messages
  const errorMessages = await page.locator('[role="alert"], .error, .text-red-500, .text-red-600').allTextContents();
  evidence.visibleErrors = errorMessages;
  console.log('[DIAGNOSTIC] Visible error messages:', errorMessages.length > 0 ? errorMessages : 'none');
  
  // 8. Check if fields still populated
  const emailValue = await page.locator('input#email').inputValue();
  const passwordValue = await page.locator('input#password').inputValue();
  evidence.emailStillPopulated = emailValue === STUDENT_EMAIL;
  evidence.passwordFieldCleared = passwordValue === '';
  console.log('[DIAGNOSTIC] Email still populated:', evidence.emailStillPopulated);
  console.log('[DIAGNOSTIC] Password field cleared:', evidence.passwordFieldCleared);
  
  // 9. Check cookies (names only, not values)
  const cookies = await page.context().cookies();
  evidence.cookieNames = cookies.map(c => c.name);
  evidence.hasCookies = cookies.length > 0;
  console.log('[DIAGNOSTIC] Cookie names present:', evidence.cookieNames);
  
  // 10. Capture network evidence
  evidence.networkRequests = networkRequests;
  evidence.networkResponses = networkResponses;
  console.log('[DIAGNOSTIC] Network requests captured:', networkRequests.length);
  console.log('[DIAGNOSTIC] Network responses captured:', networkResponses.length);
  
  // 11. Capture console and page errors
  evidence.consoleLogs = consoleLogs.filter(log => 
    log.includes('error') || log.includes('fail') || log.includes('auth')
  );
  evidence.pageErrors = pageErrors;
  console.log('[DIAGNOSTIC] Console errors:', evidence.consoleLogs.length);
  console.log('[DIAGNOSTIC] Page errors:', evidence.pageErrors.length);
  
  // 12. If still on login, try navigating to dashboard manually
  if (evidence.stillOnLogin) {
    console.log('[DIAGNOSTIC] Still on /login, attempting manual dashboard navigation...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    evidence.dashboardUrl = page.url();
    evidence.canReachDashboard = !page.url().includes('/login');
    console.log('[DIAGNOSTIC] After manual navigation to /dashboard:', evidence.dashboardUrl);
    console.log('[DIAGNOSTIC] Can reach dashboard:', evidence.canReachDashboard);
  }
  
  // Print complete evidence report
  console.log('\n' + '='.repeat(80));
  console.log('LOGIN FORENSIC DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log(JSON.stringify(evidence, null, 2));
  console.log('='.repeat(80));
  
  // Print network responses detail
  console.log('\nNETWORK RESPONSES DETAIL:');
  networkResponses.forEach((resp, i) => {
    console.log(`${i + 1}. ${resp.method || 'GET'} ${resp.url}`);
    console.log(`   Status: ${resp.status} ${resp.statusText}`);
  });
  
  // Classification
  console.log('\n' + '='.repeat(80));
  console.log('ROOT CAUSE CLASSIFICATION:');
  console.log('='.repeat(80));
  
  if (evidence.visibleErrors.length > 0) {
    console.log('CLASSIFICATION: A. Invalid/rejected credentials');
    console.log('Evidence: Visible error messages present');
  } else if (networkResponses.some(r => r.status >= 400 && r.status < 500)) {
    console.log('CLASSIFICATION: B. Authentication request failure (4xx)');
    console.log('Evidence: HTTP 4xx response detected');
  } else if (networkResponses.some(r => r.status >= 500)) {
    console.log('CLASSIFICATION: B. Authentication request failure (5xx)');
    console.log('Evidence: HTTP 5xx response detected');
  } else if (!evidence.stillOnLogin && evidence.finalUrl.includes('/login')) {
    console.log('CLASSIFICATION: E. Login succeeds but application redirects back to /login');
    console.log('Evidence: Navigation occurred but returned to /login');
  } else if (!evidence.stillOnLogin) {
    console.log('CLASSIFICATION: C. Login succeeds but redirect/navigation contract differs');
    console.log('Evidence: Navigation to:', evidence.finalUrl);
  } else if (evidence.hasCookies && evidence.canReachDashboard) {
    console.log('CLASSIFICATION: D. Login succeeds and session established but redirect missing');
    console.log('Evidence: Cookies present, manual dashboard navigation works');
  } else if (evidence.hasCookies && !evidence.canReachDashboard) {
    console.log('CLASSIFICATION: D. Login succeeds but session is not established');
    console.log('Evidence: Cookies present but dashboard redirect fails');
  } else {
    console.log('CLASSIFICATION: F. Other - see evidence above');
  }
  
  console.log('='.repeat(80) + '\n');
  
  // This test always "passes" - it's purely diagnostic
  expect(true).toBe(true);
});
