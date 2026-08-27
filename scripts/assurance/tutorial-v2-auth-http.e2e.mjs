#!/usr/bin/env node

/**
 * Tutorial V2 Auth E2E - HTTP Only
 *
 * Legacy/single-brand Tutorial V2 authentication assurance.
 *
 * IMPORTANT: This test intentionally does NOT call /api/auth/me because that
 * endpoint is not part of the SkillUp/RTH Tutorial V2 architecture.
 *
 * Authentication is proven through the actual Tutorial V2 request.
 */

const BASE_URL = process.env.SKILLUP_BASE_URL ?? 'http://skillup.localhost:3009';
const EMAIL = process.env.SKILLUP_TEST_EMAIL ?? 'student@skillupitacademy.com';
const PASSWORD = process.env.SKILLUP_TEST_PASSWORD ?? 'testing';

const CANONICAL_TUTORIAL_PATH = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java/whatisjava';
const ID_VARIANT_TUTORIAL_PATH = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';

let failures = 0;
let accessToken = null;

function pass(message) {
  console.log(`✅ [PASS] ${message}`);
}

function fail(message) {
  console.error(`❌ [FAIL] ${message}`);
  failures++;
}

function info(message) {
  console.log(`[INFO] ${message}`);
}

function section(title) {
  console.log('');
  console.log('='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
  console.log('');
}

function isLoginPage(html) {
  const normalized = html.toLowerCase();

  if (normalized.includes('<title>login |') || normalized.includes('<title>login</title>')) {
    return true;
  }

  return normalized.includes('sign in to') && normalized.includes('email') && normalized.includes('password');
}

function isTutorialContent(html) {
  const normalized = html.toLowerCase();

  if (html.length < 1000) {
    return false;
  }

  if (isLoginPage(html)) {
    return false;
  }

  return (
    normalized.includes('tutorial') ||
    normalized.includes('navigation') ||
    normalized.includes('sidebar') ||
    normalized.includes('tutorial-content')
  );
}

async function main() {
  section('TUTORIAL V2 AUTH E2E - HTTP ONLY');

  info(`Testing against: ${BASE_URL}`);

  /*
   * ==========================================================
   * 1. LOGIN
   * ==========================================================
   */

  section('1. LOGIN');

  const loginUrl = `${BASE_URL}/api/auth/login`;

  info(`POST ${loginUrl}`);

  let loginResponse;

  try {
    loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
      }),
    });
  } catch (error) {
    fail(`Login request failed: ${error.message}`);
    return;
  }

  info(`Login status: ${loginResponse.status}`);

  if (loginResponse.status !== 200) {
    fail(`Login failed with status ${loginResponse.status}`);

    const errorText = await loginResponse.text();

    console.error('Login error:', errorText);

    return;
  }

  pass('Login request succeeded (HTTP 200)');

  const setCookie = loginResponse.headers.get('set-cookie');

  if (!setCookie) {
    fail('No set-cookie header in login response');
    return;
  }

  const tokenMatch = setCookie.match(/accessToken=([^;]+)/);

  if (!tokenMatch) {
    fail('No accessToken found in set-cookie header');
    console.error('Set-Cookie header:', setCookie);
    return;
  }

  accessToken = tokenMatch[1];

  pass('accessToken cookie extracted');

  info(`Token length: ${accessToken.length}`);

  /*
   * ==========================================================
   * 2. AUTHENTICATED TUTORIAL
   * ==========================================================
   */

  section('2. AUTHENTICATED TUTORIAL');

  const tutorialUrl = `${BASE_URL}${CANONICAL_TUTORIAL_PATH}`;

  info(`GET ${tutorialUrl}`);

  let tutorialResponse;

  try {
    tutorialResponse = await fetch(tutorialUrl, {
      method: 'GET',
      headers: {
        Cookie: `accessToken=${accessToken}`,
      },
      redirect: 'manual',
    });
  } catch (error) {
    fail(`Tutorial request failed: ${error.message}`);
    return;
  }

  info(`Tutorial status: ${tutorialResponse.status}`);

  const location = tutorialResponse.headers.get('location');

  if (location) {
    info(`Redirect location: ${location}`);
  }

  /*
   * Compact URL is allowed to canonicalize.
   *
   * Authentication redirect to /login is NOT allowed.
   */

  if (tutorialResponse.status === 307 || tutorialResponse.status === 302) {
    if (location?.includes('/login')) {
      fail('Authenticated user was redirected to /login');
      return;
    }

    fail(`Authenticated Tutorial produced unexpected redirect: ${location}`);

    return;
  }

  if (tutorialResponse.status === 308) {
    if (!location) {
      fail('Tutorial returned 308 without Location header');
      return;
    }

    if (location.includes('/login')) {
      fail('Authenticated Tutorial canonicalization redirected to /login');
      return;
    }

    pass('Authenticated Tutorial returned canonical 308 redirect');

    info('Following canonical redirect...');

    try {
      tutorialResponse = await fetch(new URL(location, BASE_URL), {
        method: 'GET',
        headers: {
          Cookie: `accessToken=${accessToken}`,
        },
        redirect: 'manual',
      });
    } catch (error) {
      fail(`Canonical Tutorial request failed: ${error.message}`);
      return;
    }

    info(`Canonical Tutorial status: ${tutorialResponse.status}`);
  }

  if (tutorialResponse.status !== 200) {
    fail(`Authenticated Tutorial returned ${tutorialResponse.status}, expected 200`);
    return;
  }

  pass('Authenticated Tutorial returns HTTP 200');

  const tutorialHtml = await tutorialResponse.text();

  info(`Tutorial content length: ${tutorialHtml.length}`);

  if (isLoginPage(tutorialHtml)) {
    fail('Tutorial HTTP 200 response is actually the Login page');
    return;
  }

  pass('Tutorial HTTP 200 response is NOT Login page');

  if (!isTutorialContent(tutorialHtml)) {
    fail('Tutorial response does not contain expected Tutorial content');
    return;
  }

  pass('Authenticated Tutorial contains expected content');

  /*
   * ==========================================================
   * 3. UNAUTHENTICATED ACCESS
   * ==========================================================
   */

  section('3. UNAUTHENTICATED ACCESS');

  info('Requesting Tutorial without authentication');

  let unauthResponse;

  try {
    unauthResponse = await fetch(tutorialUrl, {
      method: 'GET',
      redirect: 'manual',
    });
  } catch (error) {
    fail(`Unauthenticated Tutorial request failed: ${error.message}`);
    return;
  }

  info(`Unauthenticated status: ${unauthResponse.status}`);

  const unauthLocation = unauthResponse.headers.get('location');

  if (unauthLocation) {
    info(`Redirect location: ${unauthLocation}`);
  }

  if (
    (unauthResponse.status === 307 || unauthResponse.status === 302) &&
    unauthLocation?.includes('/login')
  ) {
    pass('Unauthenticated user correctly redirected to /login');
  } else {
    fail(`Unauthenticated Tutorial protection failed: HTTP ${unauthResponse.status}`);
  }

  /*
   * ==========================================================
   * 4. CANONICAL ID VARIANT
   * ==========================================================
   */

  section('4. CANONICAL ID VARIANT');

  const idVariantUrl = `${BASE_URL}${ID_VARIANT_TUTORIAL_PATH}`;

  info(`GET ${idVariantUrl}`);

  let idResponse;

  try {
    idResponse = await fetch(idVariantUrl, {
      method: 'GET',
      headers: {
        Cookie: `accessToken=${accessToken}`,
      },
      redirect: 'manual',
    });
  } catch (error) {
    fail(`ID variant request failed: ${error.message}`);
    return;
  }

  info(`ID variant status: ${idResponse.status}`);

  if (idResponse.status !== 200) {
    fail(`Canonical ID variant returned ${idResponse.status}, expected 200`);
    return;
  }

  pass('Canonical ID variant returns HTTP 200');

  const idHtml = await idResponse.text();

  if (isLoginPage(idHtml)) {
    fail('Canonical ID variant returned Login page');
    return;
  }

  pass('Canonical ID variant response is NOT Login page');

  if (!isTutorialContent(idHtml)) {
    fail('Canonical ID variant does not contain Tutorial content');
    return;
  }

  pass('Canonical ID variant contains expected Tutorial content');
}

try {
  await main();
} catch (error) {
  console.error('');
  console.error('🔥 TEST CRASHED');
  console.error(error);
  failures++;
}

section('FINAL RESULT');

if (failures === 0) {
  console.log('🎉 PASS — Tutorial V2 authentication/routing validated');

  console.log('');
  console.log('Authentication:');
  console.log('  ✅ Login: PASS');
  console.log('  ✅ accessToken: PASS');

  console.log('');
  console.log('Tutorial V2:');
  console.log('  ✅ Authenticated Tutorial: PASS');
  console.log('  ✅ Unauthenticated protection: PASS');
  console.log('  ✅ Canonical ID variant: PASS');

  console.log('');
  console.log('Content:');
  console.log('  ✅ Actual Tutorial content verified');
  console.log('  ✅ Login-page false positive rejected');

  process.exit(0);
}

console.error(`🔥 FAIL — ${failures} assertion(s) failed`);

process.exit(1);
