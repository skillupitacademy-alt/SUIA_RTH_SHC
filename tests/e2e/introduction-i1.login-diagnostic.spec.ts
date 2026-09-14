/**
 * Phase 3: I1 Login Diagnostic
 * 
 * Investigates why authenticated HTTP tests timeout during login.
 * Tests RTH login flow in isolation with detailed diagnostics.
 */

import { expect, test, type Page, type BrowserContext } from '@playwright/test';

type BrandConfig = {
  name: 'RTH' | 'SUIA';
  baseUrl: string;
  email?: string;
  password?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const rth: BrandConfig = {
  name: 'RTH',
  baseUrl:
    process.env.RTH_BASE_URL ?? 'http://realtutorialhub.localhost:3003',
  email: process.env.RTH_EMAIL,
  password: process.env.RTH_PASSWORD,
};

const suia: BrandConfig = {
  name: 'SUIA',
  baseUrl:
    process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009',
  email: process.env.SUIA_EMAIL,
  password: process.env.SUIA_PASSWORD,
};

test.describe('I1 login diagnostic — RTH', () => {
  test('diagnoses RTH login contract without exposing secrets', async ({
    page,
    context,
  }) => {
    const consoleMessages: Array<{ type: string; text: string }> = [];
    const failedRequests: string[] = [];
    const networkLog: Array<{ method: string; url: string; status?: number }> = [];

    page.on('console', (message) => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
      });
    });

    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} :: ${
          request.failure()?.errorText ?? 'unknown failure'
        }`,
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('/auth/')) {
        networkLog.push({
          method: response.request().method(),
          url,
          status: response.status(),
        });
      }
    });

    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });

    console.log('\n[DIAGNOSTIC] Starting RTH login test');
    console.log(`[DIAGNOSTIC] RTH_EMAIL present: ${!!rth.email}`);
    console.log(`[DIAGNOSTIC] RTH_PASSWORD present: ${!!rth.password}`);
    console.log(`[DIAGNOSTIC] Base URL: ${rth.baseUrl}`);

    await page.goto(`${rth.baseUrl}/login`, {
      waitUntil: 'networkidle',
    });

    console.log(`[DIAGNOSTIC] Current URL after navigation: ${page.url()}`);

    await expect(page).toHaveURL(/\/login/);

    const email = requireEnv('RTH_EMAIL');
    const password = requireEnv('RTH_PASSWORD');

    // Check if form elements exist
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput, 'Email input must be visible').toBeVisible();
    await expect(passwordInput, 'Password input must be visible').toBeVisible();
    await expect(submitButton, 'Submit button must be visible').toBeVisible();

    console.log('[DIAGNOSTIC] Form elements verified');

    // Fill form
    await emailInput.fill(email);
    await passwordInput.fill(password);

    console.log('[DIAGNOSTIC] Credentials filled');

    // Set up login response listener
    const loginResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        const method = response.request().method();

        return (
          method === 'POST' &&
          (url.includes('/api/auth/login') || url.includes('/auth/login'))
        );
      },
      { timeout: 35000 },
    );

    console.log('[DIAGNOSTIC] Clicking submit button');

    // Click submit
    await submitButton.click();

    console.log('[DIAGNOSTIC] Submit button clicked, waiting for login response');

    let loginResponse;
    try {
      loginResponse = await loginResponsePromise;
      console.log(`[DIAGNOSTIC] Login response received: ${loginResponse.status()}`);
    } catch (error) {
      console.log(`[DIAGNOSTIC] Login response timeout or error: ${error}`);
      throw error;
    }

    // Wait for navigation to complete after successful login
    console.log('[DIAGNOSTIC] Waiting for navigation after login response');
    
    try {
      await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
      console.log('[DIAGNOSTIC] Navigation completed successfully');
    } catch (error) {
      console.log('[DIAGNOSTIC] Navigation wait timed out or failed');
    }

    const finalUrl = page.url();
    const cookies = await context.cookies();

    // Log console messages BEFORE collecting other data (to avoid destroyed context)
    console.log('\n[DIAGNOSTIC] Console messages during login:');
    consoleMessages.forEach((msg, idx) => {
      console.log(`  [${idx + 1}] [${msg.type}] ${msg.text.slice(0, 200)}`);
    });

    // Collect diagnostic information
    const diagnosticData = {
      brand: rth.name,
      loginResponseStatus: loginResponse.status(),
      loginResponseUrl: loginResponse.url(),
      initialUrl: `${rth.baseUrl}/login`,
      finalUrl,
      urlChanged: finalUrl !== `${rth.baseUrl}/login`,
      cookieNames: cookies.map((cookie) => cookie.name),
      accessTokenPresent: cookies.some((c) => c.name === 'accessToken'),
      refreshTokenPresent: cookies.some((c) => c.name === 'refreshToken'),
      networkLogCount: networkLog.length,
      consoleErrorCount: consoleMessages.filter((m) => m.type === 'error').length,
      failedRequestCount: failedRequests.length,
    };

    console.log('\n[DIAGNOSTIC] Test Results:');
    console.log(JSON.stringify(diagnosticData, null, 2));

    // Log network activity
    if (networkLog.length > 0) {
      console.log('\n[DIAGNOSTIC] API/Auth network activity:');
      networkLog.forEach((req) => {
        console.log(`  ${req.method} ${req.url} → ${req.status}`);
      });
    }

    // Log failed requests
    if (failedRequests.length > 0) {
      console.log('\n[DIAGNOSTIC] Failed requests:');
      failedRequests.forEach((req) => {
        console.log(`  ${req}`);
      });
    }

    await context.tracing.stop({
      path: 'test-results/i1-login-rth-diagnostic-trace.zip',
    });

    console.log('\n[DIAGNOSTIC] Trace saved to: test-results/i1-login-rth-diagnostic-trace.zip');

    // Assertions
    expect(loginResponse.status(), 'Login response should be successful').toBeLessThan(400);
    expect(
      cookies.some((c) => c.name === 'accessToken'),
      'accessToken cookie should be set after successful login',
    ).toBe(true);
  });
});

test.describe('I1 login diagnostic — SUIA', () => {
  test('diagnoses SUIA login contract without exposing secrets', async ({
    page,
    context,
  }) => {
    const consoleMessages: Array<{ type: string; text: string }> = [];
    const failedRequests: string[] = [];
    const networkLog: Array<{ method: string; url: string; status?: number }> = [];

    page.on('console', (message) => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
      });
    });

    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} :: ${
          request.failure()?.errorText ?? 'unknown failure'
        }`,
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('/auth/')) {
        networkLog.push({
          method: response.request().method(),
          url,
          status: response.status(),
        });
      }
    });

    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });

    console.log('\n[DIAGNOSTIC] Starting SUIA login test');
    console.log(`[DIAGNOSTIC] SUIA_EMAIL present: ${!!suia.email}`);
    console.log(`[DIAGNOSTIC] SUIA_PASSWORD present: ${!!suia.password}`);
    console.log(`[DIAGNOSTIC] Base URL: ${suia.baseUrl}`);

    await page.goto(`${suia.baseUrl}/login`, {
      waitUntil: 'networkidle',
    });

    console.log(`[DIAGNOSTIC] Current URL after navigation: ${page.url()}`);

    await expect(page).toHaveURL(/\/login/);

    const email = requireEnv('SUIA_EMAIL');
    const password = requireEnv('SUIA_PASSWORD');

    // Check if form elements exist
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput, 'Email input must be visible').toBeVisible();
    await expect(passwordInput, 'Password input must be visible').toBeVisible();
    await expect(submitButton, 'Submit button must be visible').toBeVisible();

    console.log('[DIAGNOSTIC] Form elements verified');

    // Fill form
    await emailInput.fill(email);
    await passwordInput.fill(password);

    console.log('[DIAGNOSTIC] Credentials filled');

    // Set up login response listener
    const loginResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        const method = response.request().method();

        return (
          method === 'POST' &&
          (url.includes('/api/auth/login') || url.includes('/auth/login'))
        );
      },
      { timeout: 35000 },
    );

    console.log('[DIAGNOSTIC] Clicking submit button');

    // Click submit
    await submitButton.click();

    console.log('[DIAGNOSTIC] Submit button clicked, waiting for login response');

    let loginResponse;
    try {
      loginResponse = await loginResponsePromise;
      console.log(`[DIAGNOSTIC] Login response received: ${loginResponse.status()}`);
    } catch (error) {
      console.log(`[DIAGNOSTIC] Login response timeout or error: ${error}`);
      throw error;
    }

    // Wait for navigation to complete after successful login
    console.log('[DIAGNOSTIC] Waiting for navigation after login response');
    
    try {
      await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
      console.log('[DIAGNOSTIC] Navigation completed successfully');
    } catch (error) {
      console.log('[DIAGNOSTIC] Navigation wait timed out or failed');
    }

    const finalUrl = page.url();
    const cookies = await context.cookies();

    // Log console messages BEFORE collecting other data (to avoid destroyed context)
    console.log('\n[DIAGNOSTIC] Console messages during login:');
    consoleMessages.forEach((msg, idx) => {
      console.log(`  [${idx + 1}] [${msg.type}] ${msg.text.slice(0, 200)}`);
    });

    // Collect diagnostic information
    const diagnosticData = {
      brand: suia.name,
      loginResponseStatus: loginResponse.status(),
      loginResponseUrl: loginResponse.url(),
      initialUrl: `${suia.baseUrl}/login`,
      finalUrl,
      urlChanged: finalUrl !== `${suia.baseUrl}/login`,
      cookieNames: cookies.map((cookie) => cookie.name),
      accessTokenPresent: cookies.some((c) => c.name === 'accessToken'),
      refreshTokenPresent: cookies.some((c) => c.name === 'refreshToken'),
      networkLogCount: networkLog.length,
      consoleErrorCount: consoleMessages.filter((m) => m.type === 'error').length,
      failedRequestCount: failedRequests.length,
    };

    console.log('\n[DIAGNOSTIC] Test Results:');
    console.log(JSON.stringify(diagnosticData, null, 2));

    // Log network activity
    if (networkLog.length > 0) {
      console.log('\n[DIAGNOSTIC] API/Auth network activity:');
      networkLog.forEach((req) => {
        console.log(`  ${req.method} ${req.url} → ${req.status}`);
      });
    }

    // Log failed requests
    if (failedRequests.length > 0) {
      console.log('\n[DIAGNOSTIC] Failed requests:');
      failedRequests.forEach((req) => {
        console.log(`  ${req}`);
      });
    }

    await context.tracing.stop({
      path: 'test-results/i1-login-suia-diagnostic-trace.zip',
    });

    console.log('\n[DIAGNOSTIC] Trace saved to: test-results/i1-login-suia-diagnostic-trace.zip');

    // Assertions
    expect(loginResponse.status(), 'Login response should be successful').toBeLessThan(400);
    expect(
      cookies.some((c) => c.name === 'accessToken'),
      'accessToken cookie should be set after successful login',
    ).toBe(true);
  });
});
