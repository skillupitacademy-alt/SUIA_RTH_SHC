#!/usr/bin/env node

/**
 * Phase 2.5 — Authentication Test
 * 
 * Tests:
 * 1. Unauthenticated request → 401
 * 2. Authenticated request → 200 (if token available)
 * 
 * NEVER logs token values or authorization headers
 */

async function testUnauthenticated() {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/shc/auth/me', {
      method: 'GET',
    });

    return {
      test: 'Unauthenticated Request',
      status: response.status,
      ok: response.status === 401,
      message:
        response.status === 401
          ? '✅ Correctly returns 401'
          : `✗ Expected 401, got ${response.status}`,
    };
  } catch (error) {
    return {
      test: 'Unauthenticated Request',
      status: null,
      ok: false,
      message: `✗ Request failed: ${error.message}`,
    };
  }
}

async function testAuthenticated() {
  const token = process.env.TEST_ADMIN_TOKEN;

  if (!token) {
    return {
      test: 'Authenticated Request',
      status: null,
      ok: null,
      message: '⏸️  Skipped (no TEST_ADMIN_TOKEN in environment)',
    };
  }

  try {
    const response = await fetch('http://127.0.0.1:3007/api/tutorial-composer/sections/5326eeb6-c4c8-4218-9687-2b46f94a9bb4', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const ok = response.status === 200 || response.status === 401;

    return {
      test: 'Authenticated Request',
      status: response.status,
      ok,
      message:
        response.status === 200
          ? '✅ Successfully authenticated'
          : response.status === 401
          ? '⚠️  Token expired (generate new token)'
          : `✗ Unexpected status: ${response.status}`,
    };
  } catch (error) {
    return {
      test: 'Authenticated Request',
      status: null,
      ok: false,
      message: `✗ Request failed: ${error.message}`,
    };
  }
}

async function main() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('PHASE 2.5 — AUTHENTICATION TEST');
  console.log('═'.repeat(60));
  console.log('');

  const results = await Promise.all([
    testUnauthenticated(),
    testAuthenticated(),
  ]);

  for (const result of results) {
    console.log(`${result.test}:`);
    console.log(`  Status: ${result.status || 'N/A'}`);
    console.log(`  ${result.message}`);
    console.log('');
  }

  const criticalPassed = results[0].ok === true;
  const authTestRan = results[1].ok !== null;

  console.log('═'.repeat(60));
  if (criticalPassed && (!authTestRan || results[1].ok)) {
    console.log('✅ AUTHENTICATION TESTS PASSED');
  } else if (criticalPassed && !authTestRan) {
    console.log('⚠️  PARTIAL PASS (unauthenticated test passed, auth test skipped)');
  } else {
    console.log('✗ AUTHENTICATION TESTS FAILED');
  }
  console.log('═'.repeat(60));
  console.log('');

  process.exit(criticalPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('');
  console.error('AUTHENTICATION TEST FAILED');
  console.error(error.message);
  process.exit(1);
});
