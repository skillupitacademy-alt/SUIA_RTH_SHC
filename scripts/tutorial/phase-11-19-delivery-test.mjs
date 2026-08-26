/**
 * PHASE 11.19 — Tutorial V2 Delivery Test
 * 
 * Tests local delivery stack with authentication
 * 
 * Usage: node scripts/tutorial/phase-11-19-delivery-test.mjs
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3009';
const STUDENT_EMAIL = 'student@skillupitacademy.com';
const STUDENT_PASSWORD = 'testing';

const TEST_URL = '/tutorial-v2/full-stack-development/backend-development/java/whatisjava/whatisjava';

function extractCookies(response) {
  const cookies = [];

  // Try node-fetch's raw() method first
  if (typeof response.headers.raw === 'function') {
    const rawCookies = response.headers.raw()['set-cookie'] || [];
    for (const cookie of rawCookies) {
      const nameValue = cookie.split(';')[0];
      if (nameValue.startsWith('accessToken=') || nameValue.startsWith('refreshToken=')) {
        cookies.push(nameValue);
      }
    }
    return cookies;
  }

  // Fallback to get() method
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const accessToken = setCookie.match(/accessToken=([^;]+)/);
    if (accessToken) {
      cookies.push(`accessToken=${accessToken[1]}`);
    }
    const refreshToken = setCookie.match(/refreshToken=([^;]+)/);
    if (refreshToken) {
      cookies.push(`refreshToken=${refreshToken[1]}`);
    }
  }

  return cookies;
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('PHASE 11.19 — TUTORIAL V2 DELIVERY TEST');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(`Testing: ${BASE_URL}${TEST_URL}`);
  console.log('──────────────────────────────────────────────────────────────────────');

  // Step 1: Authenticate
  console.log('\nSTEP 1: Authentication');
  console.log('──────────────────────────────────────────────────────────────────────');

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    console.log(`❌ Login failed: HTTP ${loginResponse.status}`);
    const body = await loginResponse.text();
    console.log(body.substring(0, 500));
    process.exit(1);
  }

  const cookies = extractCookies(loginResponse);
  console.log(`✅ Authenticated: ${STUDENT_EMAIL}`);
  console.log(`✅ Cookies: ${cookies.length}`);

  // Step 2: Test tutorial page
  console.log('\nSTEP 2: Fetch Tutorial Page');
  console.log('──────────────────────────────────────────────────────────────────────');

  const pageResponse = await fetch(`${BASE_URL}${TEST_URL}`, {
    headers: {
      Cookie: cookies.join('; '),
    },
  });

  console.log(`HTTP ${pageResponse.status}`);

  if (!pageResponse.ok) {
    console.log(`❌ Page request failed`);
    const body = await pageResponse.text();
    console.log(body.substring(0, 1000));

    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('🔴 DELIVERY TEST FAILED');
    console.log('══════════════════════════════════════════════════════════════════════');
    process.exit(1);
  }

  const html = await pageResponse.text();
  console.log(`✅ Page loaded: ${html.length} bytes`);

  // Check for key elements
  const hasJavaTitle = html.includes('What Is Java?') || html.includes('Java');
  const hasSidebar = html.includes('tutorial') || html.includes('sidebar');

  console.log(`\nContent validation:`);
  console.log(`  Has Java content: ${hasJavaTitle ? '✅' : '❌'}`);
  console.log(`  Has sidebar: ${hasSidebar ? '✅' : '❌'}`);

  if (hasJavaTitle) {
    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('🟢 DELIVERY TEST SUCCESS');
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log('Tutorial V2 delivery path working correctly');
    console.log('Ready for deployment verification');
  } else {
    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('⚠️  DELIVERY TEST WARNING');
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log('Page loaded but content may be missing');
    console.log('Check server logs for [DELIVERY_TRACE] messages');
  }
}

main().catch(err => {
  console.error('\n❌ Test failed with error:');
  console.error(err);
  process.exit(1);
});
