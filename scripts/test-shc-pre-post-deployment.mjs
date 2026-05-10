/**
 * SHC Admin Pre/Post Deployment Test
 * ===================================
 * Tests authentication flow before and after deployment
 * 
 * PRE-DEPLOYMENT: Tests what currently works
 * POST-DEPLOYMENT: Tests complete flow after fixes are deployed
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BASE_URL = 'https://api.skillhubcore.in';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || '';

const isPreDeployment = process.argv.includes('--pre');
const isPostDeployment = process.argv.includes('--post');

if (!isPreDeployment && !isPostDeployment) {
  console.log('Usage: node scripts/test-shc-pre-post-deployment.mjs [--pre|--post]');
  console.log('  --pre   Run pre-deployment tests (limited)');
  console.log('  --post  Run post-deployment tests (complete flow)');
  process.exit(1);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log(isPreDeployment ? '🔍 PRE-DEPLOYMENT TEST' : '🚀 POST-DEPLOYMENT TEST');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Test 1: Environment Check
console.log('✅ Test 1: Environment Variables');
const envChecks = {
  'GATEWAY_URL': process.env.GATEWAY_URL,
  'GATEWAY_URL_SKILLUP': process.env.GATEWAY_URL_SKILLUP,
  'GATEWAY_URL_SKILLHUBCORE': process.env.GATEWAY_URL_SKILLHUBCORE,
  'INTERNAL_API_KEY': process.env.INTERNAL_API_KEY,
};

let allEnvPresent = true;
for (const [key, value] of Object.entries(envChecks)) {
  const status = value ? '✓' : '✗';
  console.log(`   ${key}: ${status}`);
  if (!value) allEnvPresent = false;
}
console.log('');

if (!allEnvPresent) {
  console.log('❌ Missing environment variables!');
  process.exit(1);
}

// Test 2: Login Flow
console.log('✅ Test 2: Login Flow');
console.log(`   Endpoint: ${BASE_URL}/api/shc/auth/login`);
console.log(`   Email: admin@skillhubcore.in`);
console.log('');

let accessToken = null;
let loginSuccess = false;

try {
  const loginResponse = await fetch(`${BASE_URL}/api/shc/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
    body: JSON.stringify({
      email: 'admin@skillhubcore.in',
      password: 'testing',
    }),
  });

  console.log(`   Response Status: ${loginResponse.status}`);

  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    
    if (loginData.accessToken) {
      accessToken = loginData.accessToken;
      loginSuccess = true;
      
      console.log('   ✓ Login successful');
      console.log(`   ✓ Access token received`);
      console.log(`   ✓ User: ${loginData.user.email}`);
      console.log(`   ✓ Role: ${loginData.user.role}`);
      console.log(`   ✓ Is Admin: ${loginData.user.isAdmin}`);
    }
  } else {
    const errorText = await loginResponse.text();
    console.log(`   ✗ Login failed: ${errorText.substring(0, 100)}`);
  }
  console.log('');

} catch (error) {
  console.log(`   ✗ Login error: ${error.message}`);
  console.log('');
}

if (isPreDeployment) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 PRE-DEPLOYMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Current Status:');
  console.log(`  ${loginSuccess ? '✓' : '✗'} Login endpoint working`);
  console.log(`  ${loginSuccess ? '✓' : '✗'} Tokens generated`);
  console.log('');
  console.log('Expected After Deployment:');
  console.log('  ✓ Login endpoint working');
  console.log('  ✓ Tokens generated');
  console.log('  ✓ Session validation working');
  console.log('  ✓ CSRF exemption for /api/shc/auth');
  console.log('  ✓ AdminGuard session check working');
  console.log('  ✓ Dashboard accessible');
  console.log('');
  console.log('Files to Deploy:');
  console.log('  1. apps/api-server/src/proxy.ts');
  console.log('  2. apps/api-server/src/app/api/shc/auth/me/route.ts');
  console.log('  3. apps/skillhubcore-admin/src/app/api/admin/auth/me/route.ts');
  console.log('  4. src/share-branding/auth/authBffRoute.ts');
  console.log('  5. src/share-branding/auth/unifiedBffAuth.ts');
  console.log('  6. src/share-branding/brandConfig.ts');
  console.log('  7. Environment variables (GATEWAY_URL_SKILLHUBCORE)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  process.exit(loginSuccess ? 0 : 1);
}

// POST-DEPLOYMENT TESTS
if (!loginSuccess) {
  console.log('❌ Cannot continue - login failed');
  process.exit(1);
}

// Test 3: Session Validation
console.log('✅ Test 3: Session Validation');
console.log(`   Endpoint: ${BASE_URL}/api/shc/auth/me`);
console.log('');

let sessionValid = false;

try {
  const meResponse = await fetch(`${BASE_URL}/api/shc/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`   Response Status: ${meResponse.status}`);

  if (meResponse.ok) {
    const meData = await meResponse.json();
    
    console.log('   ✓ Session validated');
    console.log(`   ✓ Has 'user' field: ${!!meData.user}`);
    console.log(`   ✓ Has 'expiresAt' field: ${meData.hasOwnProperty('expiresAt')}`);
    
    if (meData.user) {
      console.log(`   ✓ User ID: ${meData.user.id}`);
      console.log(`   ✓ Role: ${meData.user.role}`);
      console.log(`   ✓ Is Admin: ${meData.user.isAdmin}`);
      
      const validAdminRoles = ['admin', 'super_admin', 'infrastructure'];
      if (validAdminRoles.includes(meData.user.role?.toLowerCase())) {
        console.log(`   ✓ Valid admin role`);
        sessionValid = true;
      }
    }
  } else {
    const errorText = await meResponse.text();
    console.log(`   ✗ Session validation failed: ${errorText.substring(0, 100)}`);
  }
  console.log('');

} catch (error) {
  console.log(`   ✗ Session validation error: ${error.message}`);
  console.log('');
}

// Test 4: Token Claims
console.log('✅ Test 4: Token Claims');
console.log('');

let claimsValid = false;

try {
  const [, payload] = accessToken.split('.');
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
  
  const expectedClaims = {
    brand: 'skillhubcore',
    aud: 'shc-admin',
    tokenType: 'admin',
    isAdmin: true,
  };

  let allMatch = true;
  for (const [key, expectedValue] of Object.entries(expectedClaims)) {
    const actualValue = decodedPayload[key];
    const matches = actualValue === expectedValue;
    const status = matches ? '✓' : '✗';
    console.log(`   ${status} ${key}: ${actualValue}`);
    if (!matches) allMatch = false;
  }
  
  claimsValid = allMatch;
  console.log('');

} catch (error) {
  console.log(`   ✗ Could not decode token: ${error.message}`);
  console.log('');
}

// Final Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 POST-DEPLOYMENT TEST RESULTS');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Test Results:');
console.log(`  ${loginSuccess ? '✓' : '✗'} Login endpoint`);
console.log(`  ${sessionValid ? '✓' : '✗'} Session validation`);
console.log(`  ${claimsValid ? '✓' : '✗'} Token claims`);
console.log('');

const allPassed = loginSuccess && sessionValid && claimsValid;

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('');
  console.log('SHC Admin is ready for browser testing:');
  console.log('  URL: https://admin.skillhubcore.in/login');
  console.log('  Email: admin@skillhubcore.in');
  console.log('  Password: testing');
  console.log('');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('');
  console.log('Please check:');
  if (!loginSuccess) console.log('  - Login endpoint deployment');
  if (!sessionValid) console.log('  - Session validation endpoint');
  if (!claimsValid) console.log('  - Token generation logic');
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════');

process.exit(allPassed ? 0 : 1);
