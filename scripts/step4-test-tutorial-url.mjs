#!/usr/bin/env node
/**
 * STEP 4 - Test Actual Tutorial URL
 * 
 * Purpose: Test the tutorial URL with authentication
 * 
 * NO MODIFICATIONS. EVIDENCE GATHERING ONLY.
 */
import { login } from '../packages/ui/e2e/auth-helper.mjs';

const BASE_URL = 'http://realtutorialhub.localhost:3003';
const TUTORIAL_PATH = '/learn/full-stack-development-30000000/backend-development-3a706051/java-4b21ddc0/what-is-java-12efacf1';
const TUTORIAL_URL = `${BASE_URL}${TUTORIAL_PATH}`;

console.log('\n═══════════════════════════════════════════════════════');
console.log('STEP 4: TEST ACTUAL TUTORIAL URL');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Configuration:');
console.log(`  Base URL:      ${BASE_URL}`);
console.log(`  Tutorial Path: ${TUTORIAL_PATH}`);
console.log(`  Full URL:      ${TUTORIAL_URL}\n`);

console.log('═══════════════════════════════════════════════════════');
console.log('TEST 1: Unauthenticated Request');
console.log('═══════════════════════════════════════════════════════\n');

try {
  const response = await fetch(TUTORIAL_URL);
  console.log(`Status: ${response.status}`);
  console.log(`Status Text: ${response.statusText}`);
  
  if (response.status === 200) {
    const body = await response.text();
    console.log(`Response size: ${body.length} bytes`);
    
    if (body.includes('What is Java')) {
      console.log('✓ Tutorial title found in response');
    }
    if (body.includes('data-block-id')) {
      console.log('✓ Block rendering detected');
    }
    if (body.includes('login') || body.includes('sign in')) {
      console.log('⚠️  Login keywords detected (may need auth)');
    }
  } else if (response.status === 302 || response.status === 307) {
    const location = response.headers.get('location');
    console.log(`Redirect to: ${location}`);
  } else if (response.status === 401 || response.status === 403) {
    console.log('⚠️  Authentication required');
  }
} catch (error) {
  console.log(`✗ Error: ${error.message}`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 2: Authenticated Request (RTH)');
console.log('═══════════════════════════════════════════════════════\n');

const credentials = {
  baseUrl: BASE_URL,
  email: 'ajayshah@gmail.com',
  password: 'testing',
  brand: 'realtutorialhub',
};

console.log(`Authenticating: ${credentials.email}\n`);

const authResult = await login(credentials);

if (!authResult.success) {
  console.log(`✗ Authentication failed: ${authResult.error}\n`);
  console.log('Cannot proceed with authenticated test.\n');
  process.exit(1);
}

console.log('✓ Authentication successful');
console.log(`✓ Access token obtained (length: ${authResult.accessToken.length})\n`);

console.log('Fetching tutorial with authentication...\n');

try {
  const response = await fetch(TUTORIAL_URL, {
    headers: {
      'Cookie': `accessToken=${authResult.accessToken}`,
    },
  });
  
  console.log(`Status: ${response.status}`);
  console.log(`Status Text: ${response.statusText}`);
  
  if (response.status === 200) {
    const body = await response.text();
    console.log(`Response size: ${body.length} bytes\n`);
    
    console.log('Content verification:');
    
    const checks = {
      'What is Java': body.includes('What is Java'),
      'data-block-id': body.includes('data-block-id'),
      'whatisjava': body.includes('whatisjava'),
      'Java': body.includes('Java'),
    };
    
    for (const [check, result] of Object.entries(checks)) {
      console.log(`  ${result ? '✓' : '✗'} "${check}": ${result ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    console.log();
    
    if (checks['What is Java'] && checks['data-block-id']) {
      console.log('✓ TUTORIAL IDENTITY VERIFIED');
      console.log('✓ TUTORIAL DELIVERY CONFIRMED\n');
    } else {
      console.log('⚠️  Tutorial identity verification incomplete\n');
    }
  } else if (response.status === 404) {
    console.log('\n❌ 404 NOT FOUND');
    console.log('   The URL does not resolve to a valid page.\n');
  } else {
    console.log(`\n⚠️  Unexpected status: ${response.status}\n`);
  }
} catch (error) {
  console.log(`\n✗ Error: ${error.message}\n`);
}

console.log('═══════════════════════════════════════════════════════');
console.log('STEP 4 COMPLETE');
console.log('═══════════════════════════════════════════════════════\n');
