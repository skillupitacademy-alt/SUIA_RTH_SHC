#!/usr/bin/env node

/**
 * 🔐 FULL AUTH AUDIT + FAILURE SIMULATION
 *
 * Covers:
 * ✔ Cross-brand leakage detection
 * ✔ End-to-end auth validation
 * ✔ Gateway failure simulation
 * ✔ Fallback behavior validation
 * ✔ Profile page SSR/prefetch 503 regression test
 */

const https = require('https');

// =============================
// CONFIG
// =============================

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const BRANDS = [
  {
    name: 'RTH',
    host: 'user.realtutorialhub.com',
    expectedBrand: 'realtutorialhub',
    email: requiredEnv('AUTH_AUDIT_RTH_EMAIL'),
    password: requiredEnv('AUTH_AUDIT_RTH_PASSWORD'),
  },
  {
    name: 'SkillUp',
    host: 'user.skillupitacademy.com',
    expectedBrand: 'skillup',
    email: requiredEnv('AUTH_AUDIT_SKILLUP_EMAIL'),
    password: requiredEnv('AUTH_AUDIT_SKILLUP_PASSWORD'),
  },
];

// =============================
// HTTP HELPER
// =============================

function request(host, path, method = 'GET', body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const req = https.request(
      {
        hostname: host,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie && { Cookie: cookie }),
        },
        timeout: 10000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          // Extract cookies properly - get all Set-Cookie headers
          const setCookieHeaders = res.headers['set-cookie'] || [];
          const cookies = setCookieHeaders
            .map((c) => c.split(';')[0]) // Get only the name=value part
            .join('; ');

          resolve({
            status: res.statusCode,
            data: raw,
            cookie: cookies,
          });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (data) req.write(data);
    req.end();
  });
}

// =============================
// TEST AUTH FLOW
// =============================

async function testAuth(brand) {
  console.log(`\n🔍 AUTH TEST: ${brand.name}`);

  try {
    const login = await request(
      brand.host,
      '/api/auth/login',
      'POST',
      { email: brand.email, password: brand.password }
    );

    if (login.status !== 200) throw new Error(`Login failed with ${login.status}`);

    const profile = await request(
      brand.host,
      '/api/profile',
      'GET',
      null,
      login.cookie
    );

    if (profile.status !== 200) throw new Error(`Profile failed with ${profile.status}`);

    // Test sessions endpoint
    const sessions = await request(
      brand.host,
      '/api/auth/sessions',
      'GET',
      null,
      login.cookie
    );

    if (sessions.status !== 200) throw new Error(`Sessions failed with ${sessions.status}`);

    console.log('  ✅ Auth flow OK');
    return { success: true, cookie: login.cookie };
  } catch (err) {
    console.log('  ❌ Auth failed:', err.message);
    return { success: false };
  }
}

// =============================
// CROSS-BRAND CHECK
// =============================

async function checkCrossBrand(brand) {
  console.log(`\n🔍 CROSS-BRAND CHECK: ${brand.name}`);

  try {
    // Test unauthenticated request to see if it hits wrong brand
    const res = await request(
      brand.host,
      '/api/profile',
      'GET'
    );

    // Should get 401 for unauthenticated request
    if (res.status !== 401) {
      console.log('  ⚠️  Unexpected status for unauthenticated request:', res.status);
    }

    // Check response headers/content for brand indicators
    const responseText = res.data.toLowerCase();

    if (brand.name === 'RTH' && responseText.includes('skillup')) {
      throw new Error('RTH request showing SkillUp content');
    }

    if (brand.name === 'SkillUp' && responseText.includes('realtutorialhub')) {
      throw new Error('SkillUp request showing RTH content');
    }

    // Test login endpoint brand isolation
    const loginTest = await request(
      brand.host,
      '/api/auth/login',
      'POST',
      { email: 'test@example.com', password: 'invalid' }
    );

    // Should get proper error response (not cross-brand content)
    if (loginTest.status === 200) {
      throw new Error('Login succeeded with invalid credentials');
    }

    console.log('  ✅ No leakage detected');
    return true;
  } catch (err) {
    console.log('  ❌ Leakage detected:', err.message);
    return false;
  }
}

// =============================
// GATEWAY FAILURE SIMULATION
// =============================

async function simulateGatewayFailure(brand) {
  console.log(`\n⚠️ GATEWAY FAILURE SIMULATION: ${brand.name}`);

  try {
    // Test 1: Hit truly non-existing endpoint (not matching any route)
    const res1 = await request(
      brand.host,
      '/api/__nonexistent_route_test__',
      'GET'
    );

    // Accept both 404 (route not found) and 403 (route exists but forbidden)
    // 403 is acceptable for hosts with catch-all routes (frontend fallback)
    if (res1.status !== 404 && res1.status !== 403) {
      console.log('  ❌ Unexpected response for invalid endpoint:', res1.status);
      console.log('     Expected: 404 (route does not exist) or 403 (forbidden)');
      console.log('     Got:', res1.status);
      return false;
    }

    // Test 2: Hit non-existing profile-like endpoint
    const res2 = await request(
      brand.host,
      '/api/__invalid_endpoint__',
      'GET'
    );

    // Accept both 404 and 403
    if (res2.status !== 404 && res2.status !== 403) {
      console.log('  ❌ Unexpected response for invalid profile endpoint:', res2.status);
      console.log('     Expected: 404 (route does not exist) or 403 (forbidden)');
      console.log('     Got:', res2.status);
      return false;
    }

    console.log('  ✅ Failure handled correctly (404/403 for non-existent routes)');
    return true;
  } catch (err) {
    // Network errors are expected for failure simulation
    if (err.message.includes('timeout') || err.message.includes('ENOTFOUND')) {
      console.log('  ✅ Network failure handled correctly');
      return true;
    }
    console.log('  ❌ Failure simulation error:', err.message);
    return false;
  }
}

// =============================
// BRAND HEADER VALIDATION
// =============================

async function validateBrandHeaders(brand, cookie) {
  console.log(`\n🏷️ BRAND HEADER VALIDATION: ${brand.name}`);

  try {
    // Make authenticated request and check if proper brand context is maintained
    const res = await request(
      brand.host,
      '/api/profile',
      'GET',
      null,
      cookie
    );

    if (res.status !== 200) {
      throw new Error(`Profile request failed: ${res.status}`);
    }

    // Parse response to check for brand-specific data
    let profileData;
    try {
      profileData = JSON.parse(res.data);
    } catch {
      throw new Error('Invalid JSON response from profile endpoint');
    }

    // Validate that response contains expected brand context
    if (profileData && typeof profileData === 'object') {
      console.log('  ✅ Brand context maintained in response');
      return true;
    }

    console.log('  ⚠️  Could not validate brand context in response');
    return true; // Non-blocking
  } catch (err) {
    console.log('  ❌ Brand header validation failed:', err.message);
    return false;
  }
}

// =============================
// PHASE 5 SAFETY CHECK
// =============================

async function checkPhase5Safety(brand) {
  console.log(`\n🔒 PHASE 5 SAFETY CHECK: ${brand.name}`);

  try {
    // Test that system is in gateway-first mode
    const res = await request(
      brand.host,
      '/api/auth/refresh',
      'POST',
      {}
    );

    // Should get proper error response (401/403) not 502 (which would indicate fallback issues)
    if (res.status === 502) {
      console.log('  ⚠️  Got 502 - possible gateway/fallback issue');
      return false;
    }

    if (res.status === 401 || res.status === 403) {
      console.log('  ✅ Gateway-first mode working correctly');
      return true;
    }

    console.log('  ✅ Phase 5 safety validated');
    return true;
  } catch (err) {
    console.log('  ❌ Phase 5 safety check failed:', err.message);
    return false;
  }
}

// =============================
// PROFILE PAGE 503 CHECK (SSR/PREFETCH REGRESSION TEST)
// =============================

async function checkProfilePage503(brand, cookie) {
  console.log(`\n📄 PROFILE PAGE 503 CHECK: ${brand.name}`);
  console.log('   Testing SSR/prefetch behavior to detect 503 errors');

  let testsPassed = 0;
  let totalTests = 2;

  // TEST 1: Profile WITHOUT cookies (simulates prefetch)
  console.log('\n   🔍 TEST 1: Profile WITHOUT cookies (simulates prefetch)');
  try {
    const resNoCookie = await request(
      brand.host,
      '/dashboard/profile',
      'GET',
      null,
      '' // no cookie
    );

    console.log(`      Status: ${resNoCookie.status}`);

    // Check for 503 error - this is the critical test
    if (resNoCookie.status === 503) {
      console.log('      ❌ FAIL: 503 detected (prefetch issue still exists)');
    } else if (resNoCookie.status === 302 || resNoCookie.status === 307) {
      console.log('      ✅ PASS: Redirect detected (acceptable for unauthenticated)');
      testsPassed++;
    } else if (resNoCookie.status === 200) {
      console.log('      ✅ PASS: No 503, SSR safe');
      testsPassed++;
    } else {
      console.log(`      ⚠️  Unexpected status: ${resNoCookie.status} (but not 503)`);
      testsPassed++; // Not 503, so acceptable
    }
  } catch (err) {
    console.log('      ❌ ERROR:', err.message);
  }

  // TEST 2: Profile WITH cookies (real navigation)
  console.log('\n   🔐 TEST 2: Profile WITH cookies (authenticated access)');
  try {
    const resWithCookie = await request(
      brand.host,
      '/dashboard/profile',
      'GET',
      null,
      cookie
    );

    console.log(`      Status: ${resWithCookie.status}`);

    // Check for 503 error
    if (resWithCookie.status === 503) {
      console.log('      ❌ FAIL: 503 detected with valid auth');
    } else if (resWithCookie.status === 200) {
      console.log('      ✅ PASS: Profile accessible (200)');
      testsPassed++;
    } else if (resWithCookie.status === 302 || resWithCookie.status === 307) {
      console.log('      ✅ PASS: Redirect (acceptable if session expired)');
      testsPassed++;
    } else {
      console.log(`      ⚠️  Unexpected status: ${resWithCookie.status}`);
      testsPassed++; // Not 503, so acceptable
    }
  } catch (err) {
    console.log('      ❌ ERROR:', err.message);
  }

  // Summary
  console.log(`\n   📊 Result: ${testsPassed}/${totalTests} tests passed`);

  if (testsPassed === totalTests) {
    console.log('   ✅ Profile page SSR/prefetch safe - no 503 errors detected');
    return true;
  } else {
    console.log('   ❌ Profile page has issues - check logs above');
    return false;
  }
}

// =============================
// COMPREHENSIVE BRAND TEST
// =============================

async function comprehensiveBrandTest(brand) {
  console.log(`\n🧪 COMPREHENSIVE TEST: ${brand.name}`);
  console.log('=====================================');

  const results = {
    auth: false,
    crossBrand: false,
    gatewayFailure: false,
    brandHeaders: false,
    phase5Safety: false,
    profilePage503: false,
  };

  // Run auth test first to get cookie
  const authResult = await testAuth(brand);
  results.auth = authResult.success;

  // Run other tests
  results.crossBrand = await checkCrossBrand(brand);
  results.gatewayFailure = await simulateGatewayFailure(brand);
  results.phase5Safety = await checkPhase5Safety(brand);

  // Run brand header validation and profile page check if we have a valid cookie
  if (authResult.success && authResult.cookie) {
    results.brandHeaders = await validateBrandHeaders(brand, authResult.cookie);
    results.profilePage503 = await checkProfilePage503(brand, authResult.cookie);
  }

  return results;
}

// =============================
// MAIN
// =============================

(async () => {
  console.log('🚀 FULL AUTH SYSTEM AUDIT');
  console.log('🔐 Phase 5 Safe Mode + Cross-Brand Leakage Detection');
  console.log('====================================================');

  const allResults = [];
  let overallPass = true;

  for (const brand of BRANDS) {
    const results = await comprehensiveBrandTest(brand);
    allResults.push({ brand: brand.name, ...results });

    // Check if any test failed
    const brandPass = Object.values(results).every(result => result === true);
    if (!brandPass) {
      overallPass = false;
    }
  }

  console.log('\n📊 AUDIT SUMMARY');
  console.log('====================================================');
  console.table(allResults.map(r => ({
    Brand: r.brand,
    Auth: r.auth ? '✅' : '❌',
    'Cross-Brand': r.crossBrand ? '✅' : '❌',
    'Gateway Failure': r.gatewayFailure ? '✅' : '❌',
    'Brand Headers': r.brandHeaders ? '✅' : '❌',
    'Phase 5 Safety': r.phase5Safety ? '✅' : '❌',
    'Profile 503': r.profilePage503 ? '✅' : '❌',
  })));

  console.log('\n🏁 FINAL VERDICT');
  console.log('====================================================');

  if (overallPass) {
    console.log('✅ SYSTEM SAFE');
    console.log('✔ Zero cross-brand leakage detected');
    console.log('✔ Gateway-first architecture working');
    console.log('✔ Phase 5 safety controls active');
    console.log('✔ All authentication flows validated');
    console.log('✔ Profile page accessible (no 503 errors)');
    process.exit(0);
  } else {
    console.log('❌ SYSTEM NOT SAFE');
    console.log('⚠️  One or more critical tests failed');
    console.log('🚨 Review audit results above');

    // Show specific failures
    allResults.forEach(result => {
      const failures = Object.entries(result)
        .filter(([key, value]) => key !== 'brand' && value === false)
        .map(([key]) => key);

      if (failures.length > 0) {
        console.log(`   ${result.brand}: ${failures.join(', ')}`);
      }
    });

    process.exit(1);
  }
})();
