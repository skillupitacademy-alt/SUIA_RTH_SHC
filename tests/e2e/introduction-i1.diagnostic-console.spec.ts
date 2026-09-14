/**
 * Diagnostic test to trace console messages and network requests
 * 
 * This test captures detailed provenance of all console output
 * and network activity to determine what is expected vs. actual errors.
 */

import { test, type Page } from '@playwright/test';

interface DetailedConsoleMessage {
  type: string;
  text: string;
  location?: string;
  args?: string[];
}

interface DetailedRequest {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  statusText?: string;
  failure?: string;
}

interface DiagnosticEvidence {
  allConsoleMessages: DetailedConsoleMessage[];
  allRequests: DetailedRequest[];
  pageErrors: string[];
}

function captureDiagnosticEvidence(page: Page): DiagnosticEvidence {
  const evidence: DiagnosticEvidence = {
    allConsoleMessages: [],
    allRequests: [],
    pageErrors: [],
  };

  // Capture ALL console messages with full details
  page.on('console', async (message) => {
    const msgData: DetailedConsoleMessage = {
      type: message.type(),
      text: message.text(),
      location: message.location() ? `${message.location().url}:${message.location().lineNumber}` : undefined,
    };

    evidence.allConsoleMessages.push(msgData);
  });

  // Capture ALL requests with response details
  page.on('response', async (response) => {
    const request = response.request();
    evidence.allRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      status: response.status(),
      statusText: response.statusText(),
    });
  });

  // Capture failed requests
  page.on('requestfailed', (request) => {
    evidence.allRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText ?? 'unknown failure',
    });
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    evidence.pageErrors.push(`${error.name}: ${error.message}\n${error.stack}`);
  });

  return evidence;
}

async function login(page: Page, baseUrl: string, email: string, password: string): Promise<void> {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.waitForTimeout(1000);
  
  const loginResponsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/api/auth/login'),
    { timeout: 35000 },
  );
  
  await page.click('button[type="submit"]');
  await loginResponsePromise;
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
}

test.describe('Introduction Block I1 — Console & Network Diagnostic', () => {
  test('DIAGNOSTIC [RTH]: Trace all console messages and network requests', async ({ page }) => {
    const baseUrl = process.env.RTH_BASE_URL ?? 'http://realtutorialhub.localhost:3003';
    const email = process.env.RTH_EMAIL!;
    const password = process.env.RTH_PASSWORD!;
    const tutorialPath = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';

    if (!email || !password) {
      throw new Error('RTH_EMAIL and RTH_PASSWORD required');
    }

    const evidence = captureDiagnosticEvidence(page);

    // Login
    console.log('\n=== STARTING LOGIN ===');
    await login(page, baseUrl, email, password);
    console.log('=== LOGIN COMPLETE ===\n');

    // Navigate to tutorial
    console.log('=== STARTING TUTORIAL NAVIGATION ===');
    const tutorialUrl = `${baseUrl}${tutorialPath}`;
    await page.goto(tutorialUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    console.log('=== TUTORIAL NAVIGATION COMPLETE ===\n');

    // Print all console messages
    console.log('\n==================== CONSOLE MESSAGES ====================');
    console.log(`Total messages: ${evidence.allConsoleMessages.length}\n`);
    
    const errorMessages = evidence.allConsoleMessages.filter(m => m.type === 'error');
    const warningMessages = evidence.allConsoleMessages.filter(m => m.type === 'warning');
    const logMessages = evidence.allConsoleMessages.filter(m => m.type === 'log');
    
    console.log(`--- ERROR type (${errorMessages.length}) ---`);
    errorMessages.forEach((msg, i) => {
      console.log(`[${i + 1}] ${msg.type}`);
      console.log(`    Text: ${msg.text}`);
      console.log(`    Location: ${msg.location ?? 'unknown'}`);
      console.log('');
    });

    console.log(`\n--- WARNING type (${warningMessages.length}) ---`);
    warningMessages.forEach((msg, i) => {
      console.log(`[${i + 1}] ${msg.type}`);
      console.log(`    Text: ${msg.text.substring(0, 200)}${msg.text.length > 200 ? '...' : ''}`);
      console.log('');
    });

    console.log(`\n--- LOG type (${logMessages.length}) ---`);
    logMessages.slice(0, 10).forEach((msg, i) => {
      console.log(`[${i + 1}] ${msg.type}: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`);
    });

    // Print page errors
    console.log('\n==================== PAGE ERRORS (JavaScript Exceptions) ====================');
    console.log(`Total: ${evidence.pageErrors.length}`);
    evidence.pageErrors.forEach((err, i) => {
      console.log(`\n[${i + 1}]`);
      console.log(err);
    });

    // Print network requests
    console.log('\n==================== NETWORK REQUESTS ====================');
    
    const failedRequests = evidence.allRequests.filter(r => r.failure || (r.status && r.status >= 400));
    const successfulRequests = evidence.allRequests.filter(r => !r.failure && r.status && r.status < 400);
    
    console.log(`\n--- FAILED or 4xx/5xx (${failedRequests.length}) ---`);
    failedRequests.forEach((req, i) => {
      console.log(`[${i + 1}] ${req.method} ${req.status ?? 'FAILED'} ${req.statusText ?? req.failure ?? ''}`);
      console.log(`    URL: ${req.url}`);
      console.log(`    Type: ${req.resourceType}`);
      console.log('');
    });

    console.log(`\n--- SUCCESSFUL 2xx/3xx (${successfulRequests.length}) ---`);
    console.log('(showing first 20)');
    successfulRequests.slice(0, 20).forEach((req, i) => {
      console.log(`[${i + 1}] ${req.method} ${req.status} - ${req.resourceType} - ${req.url.substring(0, 80)}${req.url.length > 80 ? '...' : ''}`);
    });

    // Summary
    console.log('\n==================== SUMMARY ====================');
    console.log(`Console errors (type='error'): ${errorMessages.length}`);
    console.log(`Console warnings: ${warningMessages.length}`);
    console.log(`Page errors (JS exceptions): ${evidence.pageErrors.length}`);
    console.log(`Failed/error HTTP requests: ${failedRequests.length}`);
    console.log(`Successful HTTP requests: ${successfulRequests.length}`);
    console.log('========================================\n');
  });
});
