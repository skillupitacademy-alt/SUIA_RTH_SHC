#!/usr/bin/env node

/**
 * Browser-level live diagnostic for a RealTutorialHub subtopic page.
 *
 * Usage:
 *   SUBTOPIC_SLUG=whatisjavascript node scripts/diagnose-rth-subtopic-browser.mjs
 */

import fetch from 'node-fetch';
import { chromium } from 'playwright';

const CONFIG = {
  baseUrl: process.env.BFF_BASE_URL || 'https://user.realtutorialhub.com',
  email: process.env.TEST_EMAIL || 'ajayshah@gmail.com',
  password: process.env.TEST_PASSWORD || 'testing',
  subtopicSlug: process.env.SUBTOPIC_SLUG || 'whatisjavascript',
  tab: process.env.TAB || '',
  headed: process.env.HEADED === '1',
};

function header(title) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(title);
  console.log('='.repeat(80));
}

function extractCookiePairs(response) {
  const raw = typeof response.headers.raw === 'function'
    ? response.headers.raw()['set-cookie'] || []
    : [response.headers.get('set-cookie')].filter(Boolean);

  return raw
    .flatMap((value) => String(value).split(/,(?=\s*[^;,]+=)/))
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .map((pair) => {
      const index = pair.indexOf('=');
      return {
        name: pair.slice(0, index),
        value: pair.slice(index + 1),
      };
    })
    .filter((cookie) => cookie.name && cookie.value);
}

async function login() {
  const response = await fetch(`${CONFIG.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: CONFIG.email,
      password: CONFIG.password,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Login failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const cookies = extractCookiePairs(response);
  if (!cookies.some((cookie) => cookie.name === 'accessToken')) {
    throw new Error('Login succeeded but accessToken cookie was not returned');
  }

  return cookies;
}

async function main() {
  header('LIVE RTH SUBTOPIC BROWSER DIAGNOSTIC');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Subtopic: ${CONFIG.subtopicSlug}`);
  console.log(`Tab: ${CONFIG.tab || '(default overview)'}`);
  console.log(`Email: ${CONFIG.email}`);

  header('1. LOGIN');
  const cookiePairs = await login();
  console.log(`Cookies received: ${cookiePairs.map((cookie) => cookie.name).join(', ')}`);

  const browser = await chromium.launch({ headless: !CONFIG.headed });
  const context = await browser.newContext({
    baseURL: CONFIG.baseUrl,
    viewport: { width: 1440, height: 1000 },
  });

  await context.addCookies(cookiePairs.map((cookie) => ({
    ...cookie,
    domain: new URL(CONFIG.baseUrl).hostname,
    path: '/',
    httpOnly: true,
    secure: CONFIG.baseUrl.startsWith('https:'),
    sameSite: 'Lax',
  })));

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const responses = [];

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleErrors.push(`${message.type()}: ${message.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.stack || error.message);
  });

  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 || url.includes('/api/tutorial/sections') || url.includes('/start-learning/subtopic')) {
      responses.push(`${status} ${response.request().method()} ${url}`);
    }
  });

  header('2. NAVIGATE');
  const path = `/start-learning/subtopic/${CONFIG.subtopicSlug}${CONFIG.tab ? `?tab=${encodeURIComponent(CONFIG.tab)}` : ''}`;
  const response = await page.goto(path, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  console.log(`Navigation status: ${response?.status()} ${response?.statusText()}`);
  console.log(`Final URL: ${page.url()}`);

  await page.waitForTimeout(3000);

  const bodyText = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
  const title = await page.title().catch(() => '');
  const hasBlocked = bodyText.includes('Tutorial Overview Blocked');
  const hasRscError = bodyText.includes('An error occurred in the Server Components render');
  const hasFailedLoad = bodyText.includes('Failed to Load Content');
  const hasSubtopicTitle = /whatisjavascript|what is javascript/i.test(bodyText);

  header('3. PAGE STATE');
  console.log(`Title: ${title}`);
  console.log(`Body chars: ${bodyText.length}`);
  console.log(`Has Tutorial Overview Blocked: ${hasBlocked}`);
  console.log(`Has production Server Components error: ${hasRscError}`);
  console.log(`Has Failed to Load Content: ${hasFailedLoad}`);
  console.log(`Has subtopic title/content text: ${hasSubtopicTitle}`);

  const interestingText = bodyText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 80)
    .join('\n');
  console.log('\nVisible text preview:');
  console.log(interestingText);

  header('4. RUNTIME SIGNALS');
  console.log(`Tracked responses:\n${responses.slice(0, 30).join('\n') || 'none'}`);
  console.log(`\nConsole warnings/errors:\n${consoleErrors.slice(0, 30).join('\n') || 'none'}`);
  console.log(`\nPage errors:\n${pageErrors.slice(0, 10).join('\n') || 'none'}`);
  console.log(`\nFailed requests:\n${failedRequests.slice(0, 30).join('\n') || 'none'}`);

  await browser.close();

  header('5. RESULT');
  if (hasBlocked || hasRscError || hasFailedLoad || pageErrors.length > 0) {
    console.log('FAIL: browser-level live diagnostic reproduced an error state.');
    process.exitCode = 1;
    return;
  }

  console.log('PASS: browser-level live diagnostic did not reproduce the blocked state.');
}

main().catch((error) => {
  console.error(`\nFatal: ${error.message}`);
  process.exit(1);
});
