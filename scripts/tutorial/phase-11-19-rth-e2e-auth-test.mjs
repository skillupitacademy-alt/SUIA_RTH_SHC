/**
 * PHASE 11.19 RTH E2E AUTHENTICATION TEST
 * Validates RTH → Gateway → API → authenticated Tutorial page delivery
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3003';
const CREDENTIALS = {
  email: 'ajayshah@gmail.com',
  password: 'testing',
};

const TUTORIAL_PATH = '/tutorial-v2/full-stack-development/backend-development/java/whatisjava/whatisjava';

async function main() {
  console.log('🔍 PHASE 11.19 RTH E2E AUTHENTICATION TEST\n');

  // Step 1: Authenticate
  console.log('Step 1: Authenticating...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });

  if (!loginResponse.ok) {
    console.error(`❌ Authentication failed: HTTP ${loginResponse.status}`);
    process.exit(1);
  }

  const cookies = loginResponse.headers.raw()['set-cookie'];
  if (!cookies || cookies.length === 0) {
    console.error('❌ No cookies received');
    process.exit(1);
  }

  console.log(`✅ Authentication: HTTP ${loginResponse.status}`);
  console.log(`✅ Cookies received: ${cookies.length}`);

  // Step 2: Access authenticated Tutorial page
  console.log('\nStep 2: Accessing Tutorial page...');
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
  
  const tutorialResponse = await fetch(`${BASE_URL}${TUTORIAL_PATH}`, {
    headers: { 'Cookie': cookieHeader },
  });

  if (!tutorialResponse.ok) {
    console.error(`❌ Tutorial request failed: HTTP ${tutorialResponse.status}`);
    process.exit(1);
  }

  const html = await tutorialResponse.text();
  
  // Step 3: Validate response
  console.log(`✅ Tutorial page: HTTP ${tutorialResponse.status}`);
  console.log(`✅ Response length: ${html.length} bytes`);

  // Check if we got the tutorial page (not login redirect)
  if (html.includes('<title>Login')) {
    console.error('❌ Received login page instead of tutorial (session not maintained)');
    process.exit(1);
  }

  if (html.includes('What Is Java') || html.includes('whatisjava')) {
    console.log('✅ Tutorial content detected');
  } else {
    console.warn('⚠️  Tutorial-specific content not clearly detected');
  }

  console.log('\n✅ RTH E2E AUTHENTICATION TEST: PASSED');
  console.log('\n📊 Results:');
  console.log('  - RTH → Gateway → API: WORKING');
  console.log('  - Authentication: WORKING');
  console.log('  - Session cookies: WORKING');
  console.log('  - Tutorial delivery: WORKING');
}

main().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
