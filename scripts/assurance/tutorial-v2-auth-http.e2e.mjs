#!/usr/bin/env node

/**
 * Tutorial V2 Auth E2E - HTTP Only
 *
 * Tests authentication and Tutorial V2 access using Node.js fetch.
 * No browser automation.
 */

const BASE_URL = process.env.SKILLUP_BASE_URL ?? 'http://localhost:3009';
const EMAIL = process.env.SKILLUP_TEST_EMAIL ?? 'student@skillupitacademy.com';
const PASSWORD = process.env.SKILLUP_TEST_PASSWORD ?? 'testing';

const CANONICAL_TUTORIAL_PATH = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java/whatisjava';

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

async function main() {
  section('TUTORIAL V2 AUTH E2E - HTTP ONLY');

  info(`Testing against: ${BASE_URL}`);
  info(`Note: Server must have NEXT_PUBLIC_BRAND=skillup configured`);

  // ==========================================================
  // 1. Login
  // ==========================================================

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

  if (!loginResponse.ok) {
    fail(`Login failed with status ${loginResponse.status}`);
    const errorText = await loginResponse.text();
    console.error('Login error:', errorText);
    return;
  }

  pass('Login request succeeded (HTTP 200)');

  // Extract accessToken from set-cookie header
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

  // ==========================================================
  // 2. Verify /api/auth/me
  // ==========================================================

  section('2. AUTH ME');

  const authMeUrl = `${BASE_URL}/api/auth/me`;
  info(`GET ${authMeUrl}`);

  let authMeResponse;
  try {
    authMeResponse = await fetch(authMeUrl, {
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${accessToken}`,
      },
    });
  } catch (error) {
    fail(`/api/auth/me request failed: ${error.message}`);
    return;
  }

  info(`/api/auth/me status: ${authMeResponse.status}`);

  if (authMeResponse.status !== 200) {
    fail(`/api/auth/me returned ${authMeResponse.status}`);
    const errorText = await authMeResponse.text();
    console.error('/api/auth/me error:', errorText);
    return;
  }

  pass('/api/auth/me returns HTTP 200');

  let authMeJson;
  try {
    authMeJson = await authMeResponse.json();
  } catch {
    fail('/api/auth/me did not return valid JSON');
    return;
  }

  console.log(JSON.stringify(authMeJson, null, 2));

  const roles = Array.isArray(authMeJson?.roles) ? authMeJson.roles : [];
  
  if (roles.includes('student')) {
    pass('User has student role');
  } else {
    fail(`Student role missing. Roles: ${JSON.stringify(roles)}`);
  }

  if (authMeJson?.isAuthenticated || authMeJson?.authenticated) {
    pass('User is authenticated');
  } else {
    fail('User authentication status is false or missing');
  }

  // ==========================================================
  // 3. Test Canonical Tutorial URL
  // ==========================================================

  section('3. CANONICAL TUTORIAL URL');

  const tutorialUrl = `${BASE_URL}${CANONICAL_TUTORIAL_PATH}`;
  info(`GET ${tutorialUrl}`);

  let tutorialResponse;
  try {
    tutorialResponse = await fetch(tutorialUrl, {
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${accessToken}`,
      },
      redirect: 'manual', // Don't follow redirects
    });
  } catch (error) {
    fail(`Tutorial request failed: ${error.message}`);
    return;
  }

  info(`Tutorial status: ${tutorialResponse.status}`);

  // Check for redirect to login
  if (tutorialResponse.status === 307 || tutorialResponse.status === 302) {
    const location = tutorialResponse.headers.get('location');
    info(`Redirect location: ${location}`);

    if (location && location.includes('/login')) {
      fail('Authenticated user redirected to /login');
      console.error('This indicates middleware is not setting x-user-id headers');
    } else if (location && location.includes('/dashboard/tutorial-v2')) {
      fail('Tutorial redirected under /dashboard (incorrect URL construction)');
    } else {
      info(`Redirected to: ${location}`);
    }
    return;
  }

  if (tutorialResponse.status === 200) {
    pass('Canonical Tutorial returns HTTP 200');
  } else if (tutorialResponse.status === 404) {
    fail('Tutorial returned 404 (may indicate navigation node missing)');
    return;
  } else {
    fail(`Tutorial returned unexpected status: ${tutorialResponse.status}`);
    return;
  }

  // Check response content
  const tutorialHtml = await tutorialResponse.text();
  
  if (tutorialHtml.length > 100) {
    pass('Tutorial page contains content');
  } else {
    fail('Tutorial page body is unexpectedly empty');
  }

  if (tutorialHtml.toLowerCase().includes('authentication required')) {
    fail('Tutorial page displays authentication error');
  } else {
    pass('No authentication error displayed');
  }

  // ==========================================================
  // 4. Test Unauthenticated Access
  // ==========================================================

  section('4. UNAUTHENTICATED ACCESS');

  info('Testing Tutorial URL without authentication...');

  let unauthResponse;
  try {
    unauthResponse = await fetch(tutorialUrl, {
      method: 'GET',
      redirect: 'manual',
      // No cookie header
    });
  } catch (error) {
    fail(`Unauthenticated request failed: ${error.message}`);
    return;
  }

  info(`Unauthenticated status: ${unauthResponse.status}`);

  if (unauthResponse.status === 307 || unauthResponse.status === 302) {
    const location = unauthResponse.headers.get('location');
    if (location && location.includes('/login')) {
      pass('Unauthenticated user correctly redirected to /login');
    } else {
      fail(`Unexpected redirect for unauthenticated user: ${location}`);
    }
  } else if (unauthResponse.status === 401) {
    pass('Unauthenticated user received 401');
  } else {
    fail(`Unauthenticated user received unexpected status: ${unauthResponse.status}`);
  }

  // ==========================================================
  // 5. Test ID Variant URL
  // ==========================================================

  section('5. ID VARIANT URL');

  const idVariantPath = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';
  const idVariantUrl = `${BASE_URL}${idVariantPath}`;
  
  info(`GET ${idVariantUrl}`);

  let idResponse;
  try {
    idResponse = await fetch(idVariantUrl, {
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${accessToken}`,
      },
      redirect: 'manual',
    });
  } catch (error) {
    info(`ID variant request failed: ${error.message}`);
    return;
  }

  info(`ID variant status: ${idResponse.status}`);

  if (idResponse.status === 307 || idResponse.status === 302) {
    const location = idResponse.headers.get('location');
    if (location && location.includes('/login')) {
      fail('ID variant redirected authenticated user to /login (auth propagation problem)');
    } else {
      info(`ID variant redirected to: ${location}`);
    }
  } else if (idResponse.status === 404) {
    info('ID variant returned 404 (acceptable if navigationNodeId not authoritative)');
  } else if (idResponse.status === 200) {
    pass('ID variant resolved successfully');
  } else {
    info(`ID variant returned: ${idResponse.status}`);
  }
}

// ==========================================================
// Execute
// ==========================================================

try {
  await main();
} catch (error) {
  console.error('');
  console.error('🔥 TEST CRASHED');
  console.error(error);
  failures++;
}

// ==========================================================
// Final Result
// ==========================================================

section('FINAL RESULT');

if (failures === 0) {
  console.log('🎉 PASS — Tutorial V2 authentication/routing validated');
  process.exit(0);
}

console.error(`🔥 FAIL — ${failures} assertion(s) failed`);
process.exit(1);
