#!/usr/bin/env node
/**
 * ============================================================================
 * SKILLHUBCORE BRAND RESOLUTION E2E DIAGNOSTIC
 * ============================================================================
 * 
 * Traces the complete request flow to identify where brand resolution fails:
 * 
 * Browser → BFF → Gateway → API → JWT
 * 
 * SECURITY:
 * - Password read from secure prompt or environment variable
 * - Never prints secrets, tokens, or sensitive headers
 * - Only prints safe metadata
 * 
 * IMPORTANT:
 * - This is a temporary diagnostic tool
 * - Does NOT modify authentication architecture
 * - Does NOT start Stage 2B.4 implementation
 * - Stage 2B.4 remains ON HOLD
 * ============================================================================
 */

import { createInterface } from 'readline';
import { stdin, stdout } from 'process';

const TEST_EMAIL = 'admin@skillhubcore.in';

// Read environment variables
const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:8787';

/**
 * Securely prompt for password (hidden input)
 */
async function promptPassword() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  return new Promise((resolve) => {
    stdout.write('Enter password for admin@skillhubcore.in: ');
    stdin.setRawMode(true);
    
    let password = '';
    
    stdin.on('data', (char) => {
      const str = char.toString('utf8');
      
      if (str === '\n' || str === '\r' || str === '\u0004') {
        // Enter or Ctrl+D
        stdin.setRawMode(false);
        stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (str === '\u0003') {
        // Ctrl+C
        stdout.write('\n');
        process.exit(0);
      } else if (str === '\x7f' || str === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        password += str;
        stdout.write('*');
      }
    });
  });
}

/**
 * Get password from environment or secure prompt
 */
async function getPassword() {
  if (process.env.SHC_TEST_PASSWORD) {
    return process.env.SHC_TEST_PASSWORD;
  }
  
  return await promptPassword();
}

/**
 * TEST 1: Canonical resolver verification (in-process test)
 */
function testCanonicalResolver() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1 — CANONICAL RESOLVER');
  console.log('='.repeat(80));
  
  // Import canonical resolver
  try {
    // Dynamic import for ESM compatibility
    const tests = [
      { input: 'skillhubcore.localhost', expected: 'skillhubcore' },
      { input: 'skillhubcore.localhost:3007', expected: 'skillhubcore' },
      { input: 'shc.localhost', expected: 'skillhubcore' },
      { input: 'skillup.localhost', expected: 'skillup' },
      { input: 'realtutorialhub.localhost', expected: 'realtutorialhub' },
      { input: 'localhost', expected: undefined },
      { input: '127.0.0.1', expected: undefined },
    ];
    
    console.log('\n⚠️  Cannot test canonical resolver in-process (ESM/TypeScript boundary)');
    console.log('Expected behaviors:');
    tests.forEach(({ input, expected }) => {
      console.log(`  ${input} → ${expected ?? 'undefined'}`);
    });
  } catch (err) {
    console.log('\n⚠️  Canonical resolver test skipped (import error)');
  }
}

/**
 * TEST 2: Direct gateway with trusted brand context
 */
async function testGatewayDirect(password) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2 — DIRECT GATEWAY WITH TRUSTED BRAND CONTEXT');
  console.log('='.repeat(80));
  
  if (!INTERNAL_GATEWAY_SECRET) {
    console.log('\n❌ INTERNAL_GATEWAY_SECRET not configured');
    console.log('   Cannot test gateway trust boundary');
    return null;
  }
  
  const url = `${GATEWAY_URL}/auth/login`;
  
  const headers = {
    'Content-Type': 'application/json',
    'x-forwarded-host': 'skillhubcore.localhost',
    'x-original-host': 'skillhubcore.localhost',
    'x-brand': 'skillhubcore',
    'x-internal-secret': INTERNAL_GATEWAY_SECRET,
  };
  
  const body = JSON.stringify({
    email: TEST_EMAIL,
    password,
  });
  
  console.log('\nRequest:');
  console.log(`  URL: ${url}`);
  console.log(`  Headers:`);
  console.log(`    x-forwarded-host: skillhubcore.localhost`);
  console.log(`    x-original-host: skillhubcore.localhost`);
  console.log(`    x-brand: skillhubcore`);
  console.log(`    x-internal-secret: <present>`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
    
    const status = response.status;
    const text = await response.text();
    
    let responseBody;
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = { raw: text.substring(0, 200) };
    }
    
    console.log('\nResponse:');
    console.log(`  Status: ${status}`);
    console.log(`  Body: ${JSON.stringify(responseBody, null, 2).substring(0, 500)}`);
    console.log(`  Set-Cookie: ${response.headers.has('set-cookie') ? 'present' : 'absent'}`);
    
    const isBrandResolutionError = 
      text.includes('Unable to resolve brand') ||
      text.includes('brand from request');
    
    console.log('\nDiagnosis:');
    if (isBrandResolutionError) {
      console.log('  ❌ BRAND RESOLUTION FAILURE');
      console.log('  Gateway did NOT accept trusted brand context');
    } else if (status === 200) {
      console.log('  ✅ BRAND RESOLVED + AUTH SUCCESS');
    } else if (status === 401 || status === 400) {
      console.log('  ✅ BRAND RESOLVED (auth may have failed for credential reasons)');
    } else {
      console.log(`  ⚠️  Unexpected status: ${status}`);
    }
    
    return {
      status,
      isBrandResolutionError,
      hasSetCookie: response.headers.has('set-cookie'),
      body: responseBody,
    };
  } catch (err) {
    console.log('\n❌ Request failed:');
    console.log(`   ${err.message}`);
    return null;
  }
}

/**
 * TEST 3: Actual SkillHubCore BFF
 */
async function testBFF(password) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3 — ACTUAL SKILLHUBCORE BFF');
  console.log('='.repeat(80));
  
  const url = 'http://skillhubcore.localhost:3007/api/auth/login';
  
  const headers = {
    'Content-Type': 'application/json',
    'Host': 'skillhubcore.localhost:3007',
  };
  
  const body = JSON.stringify({
    email: TEST_EMAIL,
    password,
  });
  
  console.log('\nRequest:');
  console.log(`  URL: ${url}`);
  console.log(`  Host: skillhubcore.localhost:3007`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
    
    const status = response.status;
    const text = await response.text();
    
    let responseBody;
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = { raw: text.substring(0, 200) };
    }
    
    console.log('\nResponse:');
    console.log(`  Status: ${status}`);
    console.log(`  Body: ${JSON.stringify(responseBody, null, 2).substring(0, 500)}`);
    console.log(`  Set-Cookie: ${response.headers.has('set-cookie') ? 'present' : 'absent'}`);
    console.log(`  Location: ${response.headers.get('location') || 'none'}`);
    
    const isBrandResolutionError = 
      text.includes('Unable to resolve brand') ||
      text.includes('brand from request');
    
    console.log('\nDiagnosis:');
    if (isBrandResolutionError) {
      console.log('  ❌ BRAND RESOLUTION FAILURE');
      console.log('  BFF → Gateway → brand resolution failed');
    } else if (status === 200) {
      console.log('  ✅ LOGIN SUCCESS');
    } else if (status === 401) {
      console.log('  ⚠️  AUTH FAILED (but brand resolved)');
    } else if (status === 400) {
      console.log('  ⚠️  BAD REQUEST (check error message)');
    } else {
      console.log(`  ⚠️  Unexpected status: ${status}`);
    }
    
    return {
      status,
      isBrandResolutionError,
      hasSetCookie: response.headers.has('set-cookie'),
      body: responseBody,
    };
  } catch (err) {
    console.log('\n❌ Request failed:');
    console.log(`   ${err.message}`);
    
    if (err.cause?.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Connection refused. Is SkillHubCore admin running?');
      console.log('   Run: pnpm --filter @quiz/skillhubcore-admin dev');
    }
    
    return null;
  }
}

/**
 * Classify failure boundary
 */
function classifyFailureBoundary(gatewayResult, bffResult) {
  console.log('\n' + '='.repeat(80));
  console.log('FAILURE BOUNDARY CLASSIFICATION');
  console.log('='.repeat(80));
  
  // A. Gateway works with trusted headers but BFF fails
  if (gatewayResult && !gatewayResult.isBrandResolutionError && 
      bffResult && bffResult.isBrandResolutionError) {
    console.log('\n❌ FAILURE: BFF hostname extraction or header forwarding');
    console.log('   BFF is NOT sending correct brand context to gateway');
    return 'BFF_HEADERS';
  }
  
  // B. Gateway fails even with trusted headers
  if (gatewayResult && gatewayResult.isBrandResolutionError) {
    console.log('\n❌ FAILURE: Gateway trust boundary or resolver');
    console.log('   Gateway does not trust internal secret OR resolver broken');
    return 'GATEWAY_TRUST_OR_RESOLVER';
  }
  
  // C. Both work for brand resolution but auth fails
  if (gatewayResult && !gatewayResult.isBrandResolutionError &&
      bffResult && !bffResult.isBrandResolutionError &&
      (gatewayResult.status === 401 || bffResult.status === 401)) {
    console.log('\n⚠️  BRAND RESOLVED: Authentication credential failure');
    console.log('   Brand resolution works, check credentials/JWT');
    return 'AUTH_CREDENTIALS';
  }
  
  // D. Both succeed
  if (gatewayResult && gatewayResult.status === 200 &&
      bffResult && bffResult.status === 200) {
    console.log('\n✅ SUCCESS: Brand resolution and authentication both work');
    return 'SUCCESS';
  }
  
  // E. BFF not running
  if (!bffResult) {
    console.log('\n⚠️  BFF NOT RUNNING: Cannot test BFF flow');
    console.log('   Start: pnpm --filter @quiz/skillhubcore-admin dev');
    return 'BFF_NOT_RUNNING';
  }
  
  // F. Gateway not running
  if (!gatewayResult) {
    console.log('\n⚠️  GATEWAY NOT RUNNING: Cannot test gateway');
    console.log('   Start: pnpm --filter @quiz/api-gateway dev');
    return 'GATEWAY_NOT_RUNNING';
  }
  
  console.log('\n⚠️  UNCLEAR: Review test results above');
  return 'UNCLEAR';
}

/**
 * Check Stage 2B.4 relevance
 */
function checkStage2B4Relevance(gatewayResult, bffResult) {
  console.log('\n' + '='.repeat(80));
  console.log('STAGE 2B.4 RELEVANCE');
  console.log('='.repeat(80));
  
  const jwtIssuedByGateway = gatewayResult && gatewayResult.status === 200 && gatewayResult.hasSetCookie;
  const jwtIssuedByBFF = bffResult && bffResult.status === 200 && bffResult.hasSetCookie;
  
  if (!jwtIssuedByGateway && !jwtIssuedByBFF) {
    console.log('\n✅ Stage 2B.4 is NOT involved in the current failure boundary');
    console.log('   Failure occurs BEFORE JWT issuance');
    console.log('   Stage 2B.4 remains ON HOLD');
  } else {
    console.log('\n⚠️  JWT was issued - Stage 2B.4 investigation MAY be relevant');
    console.log('   Manual inspection needed: check JWT brand claim');
    console.log('   Stage 2B.4 remains ON HOLD pending investigation');
  }
}

/**
 * Print summary and recommendations
 */
function printSummary(boundary, gatewayResult, bffResult) {
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\nResults:');
  console.log(`  Gateway (direct): ${gatewayResult ? (gatewayResult.isBrandResolutionError ? '❌ FAILED' : '✅ RESOLVED') : '⚠️  NOT TESTED'}`);
  console.log(`  BFF (actual): ${bffResult ? (bffResult.isBrandResolutionError ? '❌ FAILED' : '✅ RESOLVED') : '⚠️  NOT TESTED'}`);
  console.log(`  Boundary: ${boundary}`);
  
  console.log('\nRecommendations:');
  
  switch (boundary) {
    case 'BFF_HEADERS':
      console.log('  1. Check BFF logs for BFF_HOSTNAME_NORMALIZATION');
      console.log('  2. Verify: publicHost, normalizedHost, portStripped');
      console.log('  3. Check BFF logs for BFF_BRAND_CONTEXT');
      console.log('  4. Verify: brand=skillhubcore, forwardedHost=skillhubcore.localhost');
      console.log('  5. Ensure extractHostnameFromHostHeader() strips port correctly');
      break;
      
    case 'GATEWAY_TRUST_OR_RESOLVER':
      console.log('  1. Verify INTERNAL_GATEWAY_SECRET matches in .dev.vars and BFF env');
      console.log('  2. Check gateway logs for hasTrustedInternalRequest');
      console.log('  3. Verify gateway resolveTrustedRequestBrand() logic');
      console.log('  4. Check if x-forwarded-host or x-original-host is preferred');
      break;
      
    case 'AUTH_CREDENTIALS':
      console.log('  1. Brand resolution is WORKING');
      console.log('  2. Check credential validity for admin@skillhubcore.in');
      console.log('  3. Verify database has correct password hash');
      break;
      
    case 'SUCCESS':
      console.log('  ✅ Everything works! Brand resolution is fixed.');
      break;
      
    case 'BFF_NOT_RUNNING':
      console.log('  1. Start BFF: pnpm --filter @quiz/skillhubcore-admin dev');
      console.log('  2. Re-run this diagnostic');
      break;
      
    case 'GATEWAY_NOT_RUNNING':
      console.log('  1. Start gateway: pnpm --filter @quiz/api-gateway dev');
      console.log('  2. Re-run this diagnostic');
      break;
      
    default:
      console.log('  Review test results above for more details');
  }
  
  console.log('\nIMPORTANT:');
  console.log('  - Stage 2B.4 remains ON HOLD');
  console.log('  - Do NOT modify JWT brand enforcement yet');
  console.log('  - Fix brand resolution first, THEN investigate Stage 2B.4');
}

/**
 * Main diagnostic flow
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         SKILLHUBCORE BRAND RESOLUTION E2E DIAGNOSTIC                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  
  console.log('\nConfiguration:');
  console.log(`  Test Email: ${TEST_EMAIL}`);
  console.log(`  Gateway URL: ${GATEWAY_URL}`);
  console.log(`  Internal Secret: ${INTERNAL_GATEWAY_SECRET ? '<configured>' : '<MISSING>'}`);
  
  if (!INTERNAL_GATEWAY_SECRET) {
    console.log('\n❌ INTERNAL_GATEWAY_SECRET not configured');
    console.log('   Set in environment or .env.local');
    process.exit(1);
  }
  
  // Get password securely
  const password = await getPassword();
  
  if (!password || password.trim().length === 0) {
    console.log('\n❌ Password required');
    process.exit(1);
  }
  
  // Run tests
  testCanonicalResolver();
  
  const gatewayResult = await testGatewayDirect(password);
  const bffResult = await testBFF(password);
  
  // Classify and report
  const boundary = classifyFailureBoundary(gatewayResult, bffResult);
  checkStage2B4Relevance(gatewayResult, bffResult);
  printSummary(boundary, gatewayResult, bffResult);
  
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Run
main().catch((err) => {
  console.error('\n❌ Diagnostic failed:', err.message);
  process.exit(1);
});
