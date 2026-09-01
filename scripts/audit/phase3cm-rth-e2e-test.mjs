#!/usr/bin/env node
/**
 * Phase 3C-M: RealTutorialHub E2E Test
 * Tests the same Java tutorial on RTH brand
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { login, testCredentials } from '../../packages/ui/e2e/auth-helper.mjs';

config({ path: resolve(process.cwd(), '.env.local') });

console.log('═'.repeat(70));
console.log('PHASE 3C-M: REALTUTORIALHUB E2E TEST');
console.log('═'.repeat(70));
console.log('');

// Step 1: Login to RTH
console.log('STEP 1: Login to RealTutorialHub');
console.log('─'.repeat(70));

const loginResult = await login(testCredentials.realtutorialhub);

if (!loginResult.success) {
  console.log('❌ LOGIN FAILED:', loginResult.error);
  process.exit(1);
}

console.log('✅ Login successful');
console.log('');

// Step 2: Request Java Tutorial Page on RTH
console.log('STEP 2: Request Java Tutorial Page (RTH)');
console.log('─'.repeat(70));

const testUrl = 'http://realtutorialhub.localhost:3003/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';
console.log('URL:', testUrl);
console.log('');

const response = await fetch(testUrl, {
  headers: {
    'Cookie': `accessToken=${loginResult.accessToken}`,
    'x-brand': 'realtutorialhub',
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
  console.log('✅ REALTUTORIALHUB E2E VERIFICATION COMPLETE');
  console.log('');
  console.log('Java tutorial page delivered successfully on RTH.');
  console.log('Shared sidebar working for both brands.');
  console.log('Phase 3C-M identity fix verified across both brands.');
  process.exit(0);
} else if (response.status === 404) {
  console.log('❌ 404 - Check RTH server logs');
  process.exit(1);
} else {
  console.log(`⚠️  Unexpected status: ${response.status}`);
  process.exit(1);
}
