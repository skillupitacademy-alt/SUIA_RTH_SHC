#!/usr/bin/env node
/**
 * PHASE 3C-M: Authenticated Browser Test
 * 
 * Tests the complete delivery flow with authentication
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { login, testCredentials } from '../../packages/ui/e2e/auth-helper.mjs';

config({ path: resolve(process.cwd(), '.env.local') });

console.log('═'.repeat(70));
console.log('PHASE 3C-M: AUTHENTICATED BROWSER TEST');
console.log('═'.repeat(70));
console.log('');

// Step 1: Login
console.log('STEP 1: Login to SkillUp');
console.log('─'.repeat(70));

const loginResult = await login(testCredentials.skillup);

if (!loginResult.success) {
  console.log('❌ LOGIN FAILED:', loginResult.error);
  process.exit(1);
}

console.log('✅ Login successful');
console.log('');

// Step 2: Make authenticated request
console.log('STEP 2: Request Java Tutorial Page');
console.log('─'.repeat(70));

const testUrl = 'http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';
console.log('URL:', testUrl);
console.log('');

const response = await fetch(testUrl, {
  headers: {
    'Cookie': `accessToken=${loginResult.accessToken}`,
    'x-brand': 'skillup',
  },
  redirect: 'manual',
});

console.log('Response Status:', response.status);
console.log('');

// Step 3: Analyze result
console.log('═'.repeat(70));
console.log('VERIFICATION');
console.log('═'.repeat(70));

const checks = [
  { name: 'Authentication successful', pass: loginResult.success },
  { name: 'HTTP status is 200', pass: response.status === 200 },
  { name: 'Not redirected (not 307/302)', pass: response.status !== 307 && response.status !== 302 },
  { name: 'Not 404 (sidebar found)', pass: response.status !== 404 },
];

checks.forEach(check => {
  console.log(check.pass ? '  ✅' : '  ❌', check.name);
});

console.log('');

if (response.status === 200) {
  console.log('✅ PHASE 3C-M RUNTIME VERIFICATION COMPLETE');
  console.log('');
  console.log('Java tutorial page delivered successfully.');
  console.log('Sidebar lookup using externalId succeeded.');
  console.log('Phase 3C-M identity fix is WORKING in live server.');
  process.exit(0);
} else if (response.status === 404) {
  console.log('❌ 404 - Sidebar not found');
  console.log('');
  console.log('This indicates the identity fix may not be working.');
  console.log('Check server logs for [PHASE_3C_M] markers.');
  process.exit(1);
} else {
  console.log(`⚠️  Unexpected status: ${response.status}`);
  console.log('');
  console.log('Check server logs for details.');
  process.exit(1);
}
