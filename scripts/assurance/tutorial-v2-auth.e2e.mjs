#!/usr/bin/env node

import { chromium } from 'playwright';

const BASE_URL =
  process.env.SKILLUP_BASE_URL ??
  'http://skillup.localhost:3009';

const EMAIL = process.env.SKILLUP_TEST_EMAIL;
const PASSWORD = process.env.SKILLUP_TEST_PASSWORD;

const CANONICAL_TUTORIAL_PATH =
  '/tutorial-v2/full-stack-development/backend-development/java/what-is-java/whatisjava';

const ID_TUTORIAL_PATH =
  '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';

if (!EMAIL || !PASSWORD) {
  console.error('');
  console.error(
    '❌ Missing test credentials.',
  );
  console.error('');
  console.error(
    'Set:',
  );
  console.error(
    '$env:SKILLUP_TEST_EMAIL="..."',
  );
  console.error(
    '$env:SKILLUP_TEST_PASSWORD="..."',
  );
  console.error('');

  process.exit(1);
}

const browser = await chromium.launch({
  headless: false,
});

const context = await browser.newContext({
  baseURL: BASE_URL,
});

const page = await context.newPage();

let failures = 0;

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message) {
  console.error(`❌ ${message}`);
  failures += 1;
}

function section(message) {
  console.log('');
  console.log(
    '============================================================',
  );
  console.log(message);
  console.log(
    '============================================================',
  );
}

function check(condition, successMessage, failureMessage) {
  if (condition) {
    pass(successMessage);
  } else {
    fail(failureMessage);
  }
}

/**
 * Capture browser console messages.
 */
page.on('console', (message) => {
  const type = message.type();

  if (
    type === 'error' ||
    type === 'warning'
  ) {
    console.log(
      `[BROWSER_${type.toUpperCase()}] ${message.text()}`,
    );
  }
});

/**
 * Capture page errors.
 */
page.on('pageerror', (error) => {
  console.error(
    '[BROWSER_PAGE_ERROR]',
    error.message,
  );
});

/**
 * Capture navigation requests.
 */
page.on('request', (request) => {
  const url = request.url();

  if (
    url.includes('/tutorial-v2/') ||
    url.includes('/login')
  ) {
    console.log(
      `[REQUEST] ${request.method()} ${url}`,
    );
  }
});

/**
 * Capture responses for Tutorial and auth.
 */
page.on('response', async (response) => {
  const url = response.url();

  if (
    url.includes('/tutorial-v2/') ||
    url.includes('/api/auth/')
  ) {
    console.log(
      `[RESPONSE] ${response.status()} ${response.request().method()} ${url}`,
    );
  }
});

try {
  // ==========================================================
  // 1. Open login
  // ==========================================================

  section('1. LOGIN');

  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
  });

  console.log(
    `Login page URL: ${page.url()}`,
  );

  check(
    page.url().includes('/login'),
    'Login page loaded',
    `Expected login page but got ${page.url()}`,
  );

  // ==========================================================
  // 2. Find login controls
  // ==========================================================

  section('2. LOGIN FORM');

  const emailInput = page.locator(
    'input[type="email"]',
  );

  const passwordInput = page.locator(
    'input[type="password"]',
  );

  check(
    await emailInput.count() > 0,
    'Email input found',
    'Email input NOT found',
  );

  check(
    await passwordInput.count() > 0,
    'Password input found',
    'Password input NOT found',
  );

  await emailInput.first().fill(EMAIL);
  await passwordInput.first().fill(PASSWORD);

  const submitButton = page.locator(
    'button[type="submit"]',
  );

  check(
    await submitButton.count() > 0,
    'Login submit button found',
    'Login submit button NOT found',
  );

  // ==========================================================
  // 3. Submit login
  // ==========================================================

  section('3. AUTHENTICATE');

  await submitButton.first().click();

  await page.waitForLoadState(
    'domcontentloaded',
  );

  await page.waitForTimeout(1000);

  console.log(
    `URL after login: ${page.url()}`,
  );

  // ==========================================================
  // 4. Inspect cookies
  // ==========================================================

  section('4. AUTH COOKIES');

  const cookies =
    await context.cookies();

  const accessTokenCookie =
    cookies.find(
      (cookie) =>
        cookie.name === 'accessToken',
    );

  const refreshTokenCookie =
    cookies.find(
      (cookie) =>
        cookie.name === 'refreshToken',
    );

  check(
    Boolean(accessTokenCookie),
    'accessToken cookie exists',
    'accessToken cookie is MISSING',
  );

  check(
    Boolean(refreshTokenCookie),
    'refreshToken cookie exists',
    'refreshToken cookie is MISSING',
  );

  if (accessTokenCookie) {
    console.log(
      JSON.stringify(
        {
          name: accessTokenCookie.name,
          domain: accessTokenCookie.domain,
          path: accessTokenCookie.path,
          httpOnly: accessTokenCookie.httpOnly,
          secure: accessTokenCookie.secure,
          sameSite: accessTokenCookie.sameSite,
          valueLength:
            accessTokenCookie.value.length,
        },
        null,
        2,
      ),
    );
  }

  // ==========================================================
  // 5. Verify /api/auth/me
  // ==========================================================

  section('5. AUTH ME');

  const authResponse =
    await page.request.get(
      '/api/auth/me',
    );

  const authStatus =
    authResponse.status();

  console.log(
    `/api/auth/me status: ${authStatus}`,
  );

  check(
    authStatus === 200,
    '/api/auth/me returns 200',
    `/api/auth/me returned ${authStatus}`,
  );

  let authJson = null;

  try {
    authJson =
      await authResponse.json();
  } catch {
    fail(
      '/api/auth/me did not return valid JSON',
    );
  }

  if (authJson) {
    console.log(
      '[AUTH_ME]',
      JSON.stringify(
        authJson,
        null,
        2,
      ),
    );
  }

  const roles =
    Array.isArray(authJson?.roles)
      ? authJson.roles
      : [];

  check(
    roles.includes('student'),
    'Authenticated user has student role',
    `Student role missing. Roles: ${JSON.stringify(roles)}`,
  );

  // ==========================================================
  // 6. Canonical Tutorial URL
  // ==========================================================

  section(
    '6. CANONICAL TUTORIAL URL',
  );

  console.log(
    `Testing: ${BASE_URL}${CANONICAL_TUTORIAL_PATH}`,
  );

  const tutorialResponse =
    await page.goto(
      CANONICAL_TUTORIAL_PATH,
      {
        waitUntil: 'domcontentloaded',
      },
    );

  await page.waitForTimeout(1000);

  const tutorialStatus =
    tutorialResponse?.status() ?? 0;

  const finalTutorialUrl =
    page.url();

  console.log(
    `HTTP status: ${tutorialStatus}`,
  );

  console.log(
    `Final URL: ${finalTutorialUrl}`,
  );

  // ----------------------------------------------------------
  // Status
  // ----------------------------------------------------------

  check(
    tutorialStatus === 200,
    'Canonical Tutorial returns HTTP 200',
    `Canonical Tutorial returned HTTP ${tutorialStatus}`,
  );

  // ----------------------------------------------------------
  // Login redirect
  // ----------------------------------------------------------

  check(
    !finalTutorialUrl.includes(
      '/login',
    ),
    'Authenticated Tutorial did NOT redirect to login',
    `Tutorial incorrectly redirected to ${finalTutorialUrl}`,
  );

  // ----------------------------------------------------------
  // Dashboard redirect
  // ----------------------------------------------------------

  check(
    !finalTutorialUrl.includes(
      '/dashboard/tutorial-v2/',
    ),
    'Tutorial did NOT redirect under /dashboard',
    `Incorrect dashboard Tutorial URL detected: ${finalTutorialUrl}`,
  );

  // ----------------------------------------------------------
  // Canonical URL preservation
  // ----------------------------------------------------------

  check(
    finalTutorialUrl.includes(
      CANONICAL_TUTORIAL_PATH,
    ),
    'Canonical Tutorial URL preserved',
    `Unexpected final Tutorial URL: ${finalTutorialUrl}`,
  );

  // ==========================================================
  // 7. Inspect Tutorial HTML
  // ==========================================================

  section(
    '7. TUTORIAL PAGE CONTENT',
  );

  const bodyText =
    await page.locator(
      'body',
    ).innerText();

  console.log(
    `Tutorial body length: ${bodyText.length}`,
  );

  check(
    bodyText.length > 100,
    'Tutorial page contains rendered content',
    'Tutorial page body is unexpectedly empty',
  );

  check(
    !bodyText
      .toLowerCase()
      .includes(
        'authentication required',
      ),
    'Tutorial does not display authentication error',
    'Tutorial displays authentication error',
  );

  // ==========================================================
  // 8. Inspect page URL for malformed routing
  // ==========================================================

  section(
    '8. URL ROUTING SAFETY',
  );

  check(
    !finalTutorialUrl.includes(
      '/dashboard/tutorial-v2/',
    ),
    'No /dashboard/tutorial-v2 URL generated',
    'Detected /dashboard/tutorial-v2 URL',
  );

  check(
    !finalTutorialUrl.includes(
      '//tutorial-v2/',
    ),
    'No duplicated slash before Tutorial route',
    'Detected malformed //tutorial-v2 URL',
  );

  // ==========================================================
  // 9. Test ID variant
  // ==========================================================

  section(
    '9. NAVIGATION NODE ID VARIANT',
  );

  console.log(
    `Testing: ${BASE_URL}${ID_TUTORIAL_PATH}`,
  );

  const idResponse =
    await page.goto(
      ID_TUTORIAL_PATH,
      {
        waitUntil: 'domcontentloaded',
      },
    );

  await page.waitForTimeout(500);

  const idStatus =
    idResponse?.status() ?? 0;

  const idFinalUrl =
    page.url();

  console.log(
    `HTTP status: ${idStatus}`,
  );

  console.log(
    `Final URL: ${idFinalUrl}`,
  );

  /**
   * This URL is intentionally NOT treated as equivalent
   * to the canonical URL.
   *
   * If it returns 404, that may be correct if the navigation
   * node ID does not exist.
   *
   * If it redirects to login while authenticated, however,
   * that is an auth propagation problem.
   */

  check(
    !idFinalUrl.includes('/login'),
    'ID variant did NOT redirect authenticated user to login',
    `ID variant incorrectly redirected to ${idFinalUrl}`,
  );

  if (idStatus === 200) {
    pass(
      'ID variant resolves successfully',
    );
  } else if (idStatus === 404) {
    console.log(
      'ℹ️ ID variant returned 404. This is acceptable only if this navigationNodeId is not authoritative.',
    );
  } else {
    console.log(
      `ℹ️ ID variant returned HTTP ${idStatus}.`,
    );
  }

  // ==========================================================
  // 10. Test unauthenticated behavior
  // ==========================================================

  section(
    '10. UNAUTHENTICATED PROTECTION',
  );

  const unauthContext =
    await browser.newContext({
      baseURL: BASE_URL,
    });

  const unauthPage =
    await unauthContext.newPage();

  const unauthResponse =
    await unauthPage.goto(
      CANONICAL_TUTORIAL_PATH,
      {
        waitUntil: 'domcontentloaded',
      },
    );

  await unauthPage.waitForTimeout(500);

  const unauthStatus =
    unauthResponse?.status() ?? 0;

  const unauthFinalUrl =
    unauthPage.url();

  console.log(
    `Unauthenticated HTTP status: ${unauthStatus}`,
  );

  console.log(
    `Unauthenticated final URL: ${unauthFinalUrl}`,
  );

  check(
    unauthFinalUrl.includes(
      '/login',
    ),
    'Unauthenticated Tutorial correctly redirects to login',
    `Unauthenticated Tutorial did NOT redirect to login: ${unauthFinalUrl}`,
  );

  check(
    unauthFinalUrl.includes(
      encodeURIComponent(
        CANONICAL_TUTORIAL_PATH,
      ),
    ),
    'Login redirect preserves original Tutorial path',
    'Login redirect does not preserve original Tutorial path',
  );

  await unauthContext.close();

} catch (error) {
  console.error('');
  console.error(
    '🔥 E2E TEST CRASHED',
  );
  console.error(error);

  failures += 1;
} finally {
  await browser.close();
}

// ============================================================
// FINAL RESULT
// ============================================================

section('FINAL RESULT');

if (failures === 0) {
  console.log(
    '🎉 PASS — Tutorial V2 authentication/routing audit passed.',
  );

  process.exit(0);
}

console.error(
  `🔥 FAIL — ${failures} assertion(s) failed.`,
);

process.exit(1);
