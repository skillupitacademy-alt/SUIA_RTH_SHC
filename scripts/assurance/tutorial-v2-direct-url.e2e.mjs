#!/usr/bin/env node

/**
 * Tutorial V2 Direct URL Authentication - Node HTTP
 *
 * Tests that authenticated users can directly access Tutorial V2 URLs
 * and unauthenticated users are correctly redirected to /login.
 *
 * IMPORTANT: Authentication infrastructure is already certified.
 * This test proves Tutorial-specific direct-URL behavior.
 */

import http from 'node:http';

// SkillUp configuration
const SKILLUP_HOST = process.env.SKILLUP_PUBLIC_HOST ?? 'skillup.localhost:3009';
const SKILLUP_PORT = 3009;
const SKILLUP_EMAIL = process.env.SKILLUP_TEST_EMAIL ?? 'student@skillupitacademy.com';
const SKILLUP_PASSWORD = process.env.SKILLUP_TEST_PASSWORD ?? 'testing';

// RTH configuration
const RTH_HOST = process.env.RTH_PUBLIC_HOST ?? 'realtutorialhub.localhost:3003';
const RTH_PORT = 3003;
const RTH_EMAIL = process.env.RTH_TEST_EMAIL ?? 'ajayshah@gmail.com';
const RTH_PASSWORD = process.env.RTH_TEST_PASSWORD ?? 'testing';

const CONNECT_HOST = process.env.CONNECT_HOST ?? '127.0.0.1';

const CANONICAL_TUTORIAL_PATH = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java/whatisjava';
const ID_VARIANT_TUTORIAL_PATH = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';

let failures = 0;
const skillupCookies = {};
const rthCookies = {};

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

function extractCookies(headers, cookieJar) {
  const setCookieHeaders = headers['set-cookie'];
  if (!setCookieHeaders) return;

  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  
  for (const cookie of cookies) {
    const match = cookie.match(/^([^=]+)=([^;]+)/);
    if (match) {
      const [, name, value] = match;
      cookieJar[name] = value;
    }
  }
}

function buildCookieHeader(cookieJar) {
  return Object.entries(cookieJar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function request(publicHost, port, options, cookieJar) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: CONNECT_HOST,
      port: port,
      method: options.method || 'GET',
      path: options.path,
      headers: {
        'Host': publicHost,
        ...options.headers,
      },
    }, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (cookieJar) {
          extractCookies(res.headers, cookieJar);
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

function isLoginPage(html) {
  const normalized = html.toLowerCase();
  
  // Check for Login page title markers
  if (normalized.includes('<title>login |') || normalized.includes('<title>login</title>')) {
    return true;
  }
  
  // Check for login page content markers
  if (normalized.includes('sign in to') && normalized.includes('email') && normalized.includes('password')) {
    return true;
  }
  
  return false;
}

function isTutorialContent(html) {
  const normalized = html.toLowerCase();
  
  // Tutorial content should have substantial HTML
  if (html.length < 1000) {
    return false;
  }
  
  // Check for Tutorial-specific markers (not just the word "tutorial")
  const hasTutorialMarkers = 
    (normalized.includes('tutorial') && normalized.includes('navigation')) ||
    normalized.includes('tutorial-page') ||
    normalized.includes('tutorial-content') ||
    (normalized.includes('sidebar') && html.length > 5000);
  
  // Must not be login page
  const notLoginPage = !isLoginPage(html);
  
  return hasTutorialMarkers && notLoginPage;
}

async function authenticate(host, port, email, password, cookieJar, brandName) {
  section(`${brandName} AUTHENTICATION`);

  info(`Host: ${host}`);
  info(`Email: ${email}`);

  const loginBody = JSON.stringify({
    email,
    password,
    platform: brandName === 'SkillUp' ? 'skillup' : 'realtutorialhub',
  });

  let loginResponse;
  try {
    loginResponse = await request(host, port, {
      method: 'POST',
      path: '/api/auth/login',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginBody),
      },
      body: loginBody,
    }, cookieJar);
  } catch (error) {
    fail(`${brandName} login request failed: ${error.message}`);
    return false;
  }

  info(`Login status: ${loginResponse.status}`);

  if (loginResponse.status !== 200) {
    fail(`${brandName} login failed with status ${loginResponse.status}`);
    return false;
  }

  pass(`${brandName} login succeeded (HTTP 200)`);

  if (cookieJar.accessToken) {
    pass(`${brandName} accessToken cookie extracted`);
    info(`Token length: ${cookieJar.accessToken.length}`);
  } else {
    fail(`No ${brandName} accessToken cookie in response`);
    return false;
  }

  return true;
}

async function testAuthenticatedTutorial(host, port, cookieJar, brandName) {
  section(`${brandName} AUTHENTICATED TUTORIAL`);

  info(`Host: ${host}`);
  info(`Path: ${CANONICAL_TUTORIAL_PATH}`);

  let tutorialResponse;
  try {
    tutorialResponse = await request(host, port, {
      method: 'GET',
      path: CANONICAL_TUTORIAL_PATH,
      headers: {
        'Cookie': buildCookieHeader(cookieJar),
      },
    });
  } catch (error) {
    fail(`${brandName} Tutorial request failed: ${error.message}`);
    return false;
  }

  info(`Initial status: ${tutorialResponse.status}`);
  info(`Content-Length: ${tutorialResponse.body.length}`);

  // Check for redirect
  const location = tutorialResponse.headers.location || tutorialResponse.headers.Location;
  if (location) {
    info(`Redirect Location: ${location}`);
    
    if (location.includes('/login')) {
      fail(`${brandName} authenticated Tutorial redirected to /login`);
      return false;
    }
    
    // Follow canonical redirect if present
    if (tutorialResponse.status === 308 || tutorialResponse.status === 307 || tutorialResponse.status === 302) {
      info('Following canonical redirect...');
      
      try {
        tutorialResponse = await request(host, port, {
          method: 'GET',
          path: location,
          headers: {
            'Cookie': buildCookieHeader(cookieJar),
          },
        });
      } catch (error) {
        fail(`Failed to follow redirect: ${error.message}`);
        return false;
      }
      
      info(`Final status: ${tutorialResponse.status}`);
    }
  }

  if (tutorialResponse.status !== 200) {
    fail(`${brandName} Tutorial returned HTTP ${tutorialResponse.status}, expected 200`);
    return false;
  }

  pass(`${brandName} authenticated Tutorial returns HTTP 200`);

  // CRITICAL: Verify actual Tutorial content, not Login page
  if (isLoginPage(tutorialResponse.body)) {
    fail(`${brandName} Tutorial HTTP 200 but returned Login page`);
    return false;
  }

  pass(`${brandName} Tutorial response is NOT Login page`);

  if (!isTutorialContent(tutorialResponse.body)) {
    fail(`${brandName} Tutorial response does not contain expected Tutorial content`);
    info(`Body length: ${tutorialResponse.body.length}`);
    info(`Body preview: ${tutorialResponse.body.substring(0, 500)}`);
    return false;
  }

  pass(`${brandName} authenticated Tutorial contains expected content`);

  return true;
}

async function testIdVariantTutorial(host, port, cookieJar, brandName) {
  section(`${brandName} ID VARIANT TUTORIAL`);

  info(`Host: ${host}`);
  info(`Path: ${ID_VARIANT_TUTORIAL_PATH}`);
  info('Testing canonical ID-bearing slug (should be authoritative)');

  let tutorialResponse;
  try {
    tutorialResponse = await request(host, port, {
      method: 'GET',
      path: ID_VARIANT_TUTORIAL_PATH,
      headers: {
        'Cookie': buildCookieHeader(cookieJar),
      },
    });
  } catch (error) {
    fail(`${brandName} ID variant Tutorial request failed: ${error.message}`);
    return false;
  }

  info(`Status: ${tutorialResponse.status}`);
  info(`Content-Length: ${tutorialResponse.body.length}`);

  // ID variant is the canonical URL - MUST return 200 directly (no 404 acceptable)
  if (tutorialResponse.status !== 200) {
    fail(`${brandName} canonical ID variant returned HTTP ${tutorialResponse.status}, expected 200`);
    info('ID-bearing slug is authoritative and must return 200');
    return false;
  }

  pass(`${brandName} canonical ID variant returns HTTP 200`);

  // CRITICAL: Verify actual Tutorial content, not Login page
  if (isLoginPage(tutorialResponse.body)) {
    fail(`${brandName} canonical ID variant returned Login page`);
    return false;
  }

  pass(`${brandName} canonical ID variant response is NOT Login page`);

  if (!isTutorialContent(tutorialResponse.body)) {
    fail(`${brandName} canonical ID variant does not contain expected Tutorial content`);
    info(`Body length: ${tutorialResponse.body.length}`);
    info(`Body preview: ${tutorialResponse.body.substring(0, 500)}`);
    return false;
  }

  pass(`${brandName} canonical ID variant contains expected Tutorial content`);

  return true;
}

async function testUnauthenticatedTutorial(host, port, brandName) {
  section(`${brandName} UNAUTHENTICATED TUTORIAL`);

  info(`Host: ${host}`);
  info(`Path: ${CANONICAL_TUTORIAL_PATH}`);
  info('No authentication cookies');

  let tutorialResponse;
  try {
    tutorialResponse = await request(host, port, {
      method: 'GET',
      path: CANONICAL_TUTORIAL_PATH,
      headers: {},
    });
  } catch (error) {
    fail(`${brandName} unauthenticated request failed: ${error.message}`);
    return false;
  }

  info(`Status: ${tutorialResponse.status}`);

  const location = tutorialResponse.headers.location || tutorialResponse.headers.Location;
  if (location) {
    info(`Location: ${location}`);
  }

  // Check for redirect to login
  const redirectedToLogin = location && location.includes('/login');
  
  if (!redirectedToLogin && tutorialResponse.status === 200) {
    fail(`${brandName} unauthenticated Tutorial returned 200 instead of redirecting to /login`);
    return false;
  }

  if (redirectedToLogin) {
    pass(`${brandName} unauthenticated Tutorial correctly redirects to /login`);
    return true;
  }

  fail(`${brandName} unauthenticated Tutorial: unexpected behavior (status ${tutorialResponse.status})`);
  return false;
}

async function main() {
  section('TUTORIAL V2 DIRECT URL AUTHENTICATION TEST');

  // Authenticate both brands
  const skillupAuth = await authenticate(
    SKILLUP_HOST,
    SKILLUP_PORT,
    SKILLUP_EMAIL,
    SKILLUP_PASSWORD,
    skillupCookies,
    'SkillUp'
  );

  const rthAuth = await authenticate(
    RTH_HOST,
    RTH_PORT,
    RTH_EMAIL,
    RTH_PASSWORD,
    rthCookies,
    'RTH'
  );

  if (!skillupAuth || !rthAuth) {
    fail('Authentication failed - cannot proceed with Tutorial tests');
    return;
  }

  // Test authenticated Tutorial access
  const skillupTutorial = await testAuthenticatedTutorial(
    SKILLUP_HOST,
    SKILLUP_PORT,
    skillupCookies,
    'SkillUp'
  );

  const rthTutorial = await testAuthenticatedTutorial(
    RTH_HOST,
    RTH_PORT,
    rthCookies,
    'RTH'
  );

  // Test unauthenticated Tutorial protection
  const skillupUnauth = await testUnauthenticatedTutorial(
    SKILLUP_HOST,
    SKILLUP_PORT,
    'SkillUp'
  );

  const rthUnauth = await testUnauthenticatedTutorial(
    RTH_HOST,
    RTH_PORT,
    'RTH'
  );

  // Test ID variant (canonical ID-bearing slug)
  const skillupIdVariant = await testIdVariantTutorial(
    SKILLUP_HOST,
    SKILLUP_PORT,
    skillupCookies,
    'SkillUp'
  );

  const rthIdVariant = await testIdVariantTutorial(
    RTH_HOST,
    RTH_PORT,
    rthCookies,
    'RTH'
  );

  // Summary
  section('TEST SUMMARY');
  console.log(`SkillUp authenticated Tutorial: ${skillupTutorial ? 'PASS' : 'FAIL'}`);
  console.log(`RTH authenticated Tutorial: ${rthTutorial ? 'PASS' : 'FAIL'}`);
  console.log(`SkillUp unauthenticated protection: ${skillupUnauth ? 'PASS' : 'FAIL'}`);
  console.log(`RTH unauthenticated protection: ${rthUnauth ? 'PASS' : 'FAIL'}`);
  console.log(`SkillUp ID variant: ${skillupIdVariant ? 'PASS' : 'FAIL'}`);
  console.log(`RTH ID variant: ${rthIdVariant ? 'PASS' : 'FAIL'}`);
}

// Execute
try {
  await main();
} catch (error) {
  console.error('');
  console.error('🔥 TEST CRASHED');
  console.error(error);
  failures++;
}

// Final Result
section('FINAL RESULT');

if (failures === 0) {
  console.log('✅ CERTIFIED — Tutorial V2 Direct URL Authentication');
  console.log('');
  console.log('Authentication:');
  console.log('  ✅ SkillUp login: PASS');
  console.log('  ✅ RTH login: PASS');
  console.log('');
  console.log('Tutorial V2 Direct URL Access:');
  console.log('  ✅ SkillUp authenticated Tutorial: PASS');
  console.log('  ✅ RTH authenticated Tutorial: PASS');
  console.log('  ✅ SkillUp unauthenticated → /login: PASS');
  console.log('  ✅ RTH unauthenticated → /login: PASS');
  console.log('');
  console.log('Canonical ID Variant:');
  console.log('  ✅ SkillUp ID variant: PASS');
  console.log('  ✅ RTH ID variant: PASS');
  console.log('');
  console.log('Content Validation:');
  console.log('  ✅ Tutorial HTTP 200 verified as actual Tutorial (not Login page)');
  console.log('  ✅ Authentication state preserved through direct navigation');
  console.log('  ✅ Canonical ID-bearing slugs work as authoritative URLs');
  console.log('');
  process.exit(0);
}

console.error(`❌ FAIL — ${failures} assertion(s) failed`);
console.error('');
console.error('Tutorial V2 direct URL test did not pass.');
console.error('Review test output above for specific failures.');
process.exit(1);
