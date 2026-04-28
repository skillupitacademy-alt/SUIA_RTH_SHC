#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE 7-LAYER PROFILE REDIRECT DIAGNOSTIC
 * 
 * This script tests ALL 7 layers of the authentication flow to identify
 * exactly which layer is causing the profile page to redirect to login.
 * 
 * LAYERS TESTED:
 * 1. Frontend - User Interaction & Page Load
 * 2. Middleware - Authentication Proxy
 * 3. BFF Auth - /api/auth/me endpoint
 * 4. BFF Profile - /api/profile endpoint
 * 5. API Server - Profile endpoint
 * 6. RBAC - Authorization checks
 * 7. Database - Profile data retrieval
 * 
 * Usage:
 *   node scripts/diagnose-profile-redirect-all-layers.js
 * 
 * With GCloud logs:
 *   node scripts/diagnose-profile-redirect-all-layers.js --check-logs
 */

const https = require('https');
const { execSync } = require('child_process');

// ========================================
// CONFIGURATION
// ========================================

const BRANDS = [
  {
    name: 'RealTutorialHub',
    shortName: 'RTH',
    host: 'user.realtutorialhub.com',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    serviceName: 'realtutorialhub-web',
    apiServiceName: 'api-server'
  },
  {
    name: 'SkillUp IT Academy',
    shortName: 'SkillUp',
    host: 'user.skillupitacademy.com',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    serviceName: 'skillup-web',
    apiServiceName: 'api-server'
  }
];

const CHECK_LOGS = process.argv.includes('--check-logs');
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'quiz-platform-prod';

// Test results
const results = {
  brands: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// ========================================
// UTILITIES
// ========================================

function log(message, level = 'info') {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  };
  console.log(`${icons[level] || 'ℹ️'} ${message}`);
}

function logLayer(layerNum, layerName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} Layer ${layerNum}: ${layerName} - ${status}`);
  if (details) {
    console.log(`     ${details}`);
  }
}

function request(host, path, method = 'GET', body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: host,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Profile-Redirect-Diagnostic/1.0',
        ...(cookie && { Cookie: cookie }),
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        const cookies = res.headers['set-cookie']
          ? res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ')
          : '';
        
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          // Not JSON, that's okay
        }

        resolve({
          status: res.statusCode,
          data: parsed || raw,
          cookie: cookies,
          headers: res.headers,
          rawData: raw
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) req.write(data);
    req.end();
  });
}

function checkGCloudLogs(serviceName, filter, description) {
  if (!CHECK_LOGS) {
    return null;
  }

  try {
    log(`Checking GCloud logs: ${description}`, 'debug');
    const command = `gcloud logging read 'resource.labels.service_name="${serviceName}" AND ${filter}' --limit=10 --format=json --freshness=10m --project=${PROJECT_ID}`;
    
    const output = execSync(command, { 
      encoding: 'utf-8',
      timeout: 10000 
    });

    if (!output.trim()) {
      return { found: false, message: 'No logs found' };
    }

    const logs = JSON.parse(output);
    return { found: true, count: logs.length, logs };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

// ========================================
// LAYER TESTS
// ========================================

async function testLayer1_Login(brand) {
  console.log('\n📝 LAYER 1: Frontend - Login Request');
  
  try {
    const loginRes = await request(
      brand.host,
      '/api/auth/login',
      'POST',
      { email: brand.email, password: brand.password }
    );

    if (loginRes.status !== 200) {
      logLayer(1, 'Login', 'FAIL', `Status: ${loginRes.status}`);
      return { success: false, error: `Login failed with status ${loginRes.status}` };
    }

    if (!loginRes.cookie) {
      logLayer(1, 'Login', 'FAIL', 'No cookies received');
      return { success: false, error: 'No cookies received from login' };
    }

    // Check for required cookies
    const hasAccessToken = loginRes.cookie.includes('accessToken=');
    const hasRefreshToken = loginRes.cookie.includes('refreshToken=');

    if (!hasAccessToken) {
      logLayer(1, 'Login', 'FAIL', 'Missing accessToken cookie');
      return { success: false, error: 'No accessToken cookie' };
    }

    logLayer(1, 'Login', 'PASS', `Cookies: accessToken=${hasAccessToken}, refreshToken=${hasRefreshToken}`);
    
    // Check logs
    if (CHECK_LOGS) {
      const logs = checkGCloudLogs(
        brand.serviceName,
        'textPayload:"[AUTH_FLOW]" AND textPayload:"LOGIN"',
        'Login flow logs'
      );
      if (logs && logs.found) {
        console.log(`     📊 Found ${logs.count} login log entries`);
      }
    }

    return { success: true, cookie: loginRes.cookie, data: loginRes.data };
  } catch (error) {
    logLayer(1, 'Login', 'FAIL', `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLayer2_Middleware(brand, cookie) {
  console.log('\n📝 LAYER 2: Middleware - Authentication Proxy');
  
  try {
    // Test if middleware allows authenticated requests
    const profileRes = await request(
      brand.host,
      '/api/profile',
      'GET',
      null,
      cookie
    );

    // If we get 401, middleware might be blocking
    if (profileRes.status === 401) {
      logLayer(2, 'Middleware', 'FAIL', 'Middleware blocking request (401)');
      return { success: false, error: 'Middleware returned 401 - cookie not recognized' };
    }

    // If we get 403, it's a gateway secret issue
    if (profileRes.status === 403) {
      logLayer(2, 'Middleware', 'FAIL', 'Gateway secret issue (403)');
      return { success: false, error: 'Middleware returned 403 - gateway secret mismatch' };
    }

    logLayer(2, 'Middleware', 'PASS', `Request allowed (Status: ${profileRes.status})`);
    
    // Check logs
    if (CHECK_LOGS) {
      const logs = checkGCloudLogs(
        brand.serviceName,
        'textPayload:"[AUTH_FLOW]" OR textPayload:"[BFF_GATEWAY_SECRET]"',
        'Middleware auth logs'
      );
      if (logs && logs.found) {
        console.log(`     📊 Found ${logs.count} middleware log entries`);
      }
    }

    return { success: true, status: profileRes.status };
  } catch (error) {
    logLayer(2, 'Middleware', 'FAIL', `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLayer3_BffAuthMe(brand, cookie) {
  console.log('\n📝 LAYER 3: BFF Auth - /api/auth/me Endpoint');
  
  try {
    const authMeRes = await request(
      brand.host,
      '/api/auth/me',
      'GET',
      null,
      cookie
    );

    if (authMeRes.status === 404) {
      logLayer(3, 'BFF Auth Me', 'FAIL', 'Endpoint not found (404) - MISSING ENDPOINT');
      return { 
        success: false, 
        error: '/api/auth/me endpoint does not exist in BFF',
        critical: true,
        solution: 'Create /api/auth/me endpoint in BFF apps'
      };
    }

    if (authMeRes.status === 401) {
      logLayer(3, 'BFF Auth Me', 'FAIL', 'Unauthorized (401) - Auth validation failed');
      return { success: false, error: 'BFF auth validation failed' };
    }

    if (authMeRes.status !== 200) {
      logLayer(3, 'BFF Auth Me', 'FAIL', `Unexpected status: ${authMeRes.status}`);
      return { success: false, error: `Unexpected status ${authMeRes.status}` };
    }

    const hasUser = authMeRes.data && authMeRes.data.user;
    if (!hasUser) {
      logLayer(3, 'BFF Auth Me', 'FAIL', 'No user data in response');
      return { success: false, error: 'No user data returned' };
    }

    logLayer(3, 'BFF Auth Me', 'PASS', `User: ${authMeRes.data.user.email}`);
    
    // Check logs
    if (CHECK_LOGS) {
      const logs = checkGCloudLogs(
        brand.serviceName,
        'textPayload:"/api/auth/me"',
        'Auth Me endpoint logs'
      );
      if (logs && logs.found) {
        console.log(`     📊 Found ${logs.count} auth/me log entries`);
      }
    }

    return { success: true, user: authMeRes.data.user };
  } catch (error) {
    logLayer(3, 'BFF Auth Me', 'FAIL', `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLayer4_BffProfile(brand, cookie) {
  console.log('\n📝 LAYER 4: BFF Profile - /api/profile Endpoint');
  
  try {
    const profileRes = await request(
      brand.host,
      '/api/profile',
      'GET',
      null,
      cookie
    );

    if (profileRes.status === 401) {
      logLayer(4, 'BFF Profile', 'FAIL', 'Unauthorized (401) - requireBffAuth failed');
      return { 
        success: false, 
        error: 'BFF profile auth validation failed',
        solution: 'Check requireBffAuth in bffProfileHandler.ts'
      };
    }

    if (profileRes.status === 404) {
      logLayer(4, 'BFF Profile', 'FAIL', 'Profile not found (404)');
      return { success: false, error: 'Profile not found - user needs onboarding' };
    }

    if (profileRes.status !== 200) {
      logLayer(4, 'BFF Profile', 'FAIL', `Unexpected status: ${profileRes.status}`);
      return { success: false, error: `Unexpected status ${profileRes.status}` };
    }

    logLayer(4, 'BFF Profile', 'PASS', `Profile retrieved successfully`);
    
    // Check logs
    if (CHECK_LOGS) {
      const logs = checkGCloudLogs(
        brand.serviceName,
        'textPayload:"[BFF][Profile GET]" OR textPayload:"Auth FAILED"',
        'BFF Profile handler logs'
      );
      if (logs && logs.found) {
        console.log(`     📊 Found ${logs.count} BFF profile log entries`);
      }
    }

    return { success: true, profile: profileRes.data };
  } catch (error) {
    logLayer(4, 'BFF Profile', 'FAIL', `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLayer5_ApiServer(brand, cookie) {
  console.log('\n📝 LAYER 5: API Server - Profile Endpoint');
  
  // This is tested indirectly through BFF, but we can check logs
  if (CHECK_LOGS) {
    const logs = checkGCloudLogs(
      brand.apiServiceName,
      'textPayload:"[Profile GET]" OR textPayload:"/api/auth/profile"',
      'API Server profile logs'
    );
    
    if (logs && logs.found) {
      logLayer(5, 'API Server', 'PASS', `Found ${logs.count} API server log entries`);
      return { success: true, logs: logs.count };
    } else if (logs && !logs.found) {
      logLayer(5, 'API Server', 'WARNING', 'No API server logs found (might not be called yet)');
      return { success: true, warning: 'No logs found' };
    }
  }

  logLayer(5, 'API Server', 'PASS', 'Tested via BFF (Layer 4)');
  return { success: true };
}

async function testLayer6_RBAC(brand, cookie) {
  console.log('\n📝 LAYER 6: RBAC - Authorization Checks');
  
  try {
    // Test RBAC-protected endpoint (sessions)
    const sessionsRes = await request(
      brand.host,
      '/api/auth/sessions',
      'GET',
      null,
      cookie
    );

    if (sessionsRes.status === 403) {
      logLayer(6, 'RBAC', 'FAIL', 'Permission denied (403) - RBAC blocking');
      return { success: false, error: 'RBAC permission denied' };
    }

    if (sessionsRes.status === 401) {
      logLayer(6, 'RBAC', 'FAIL', 'Unauthorized (401) - Auth failed before RBAC');
      return { success: false, error: 'Auth failed before RBAC check' };
    }

    if (sessionsRes.status !== 200) {
      logLayer(6, 'RBAC', 'WARNING', `Unexpected status: ${sessionsRes.status}`);
      return { success: true, warning: `Status ${sessionsRes.status}` };
    }

    logLayer(6, 'RBAC', 'PASS', 'Authorization checks passed');
    
    // Check logs
    if (CHECK_LOGS) {
      const logs = checkGCloudLogs(
        brand.apiServiceName,
        'textPayload:"RBAC" OR textPayload:"PERMISSION"',
        'RBAC authorization logs'
      );
      if (logs && logs.found) {
        console.log(`     📊 Found ${logs.count} RBAC log entries`);
      }
    }

    return { success: true };
  } catch (error) {
    logLayer(6, 'RBAC', 'FAIL', `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLayer7_Database(brand, cookie) {
  console.log('\n📝 LAYER 7: Database - Profile Data Retrieval');
  
  // Check database query logs
  if (CHECK_LOGS) {
    const logs = checkGCloudLogs(
      brand.apiServiceName,
      'textPayload:"[PERF][DB][PROFILE_QUERY]" OR textPayload:"userProfiles"',
      'Database query logs'
    );
    
    if (logs && logs.found) {
      logLayer(7, 'Database', 'PASS', `Found ${logs.count} database query log entries`);
      return { success: true, logs: logs.count };
    } else if (logs && !logs.found) {
      logLayer(7, 'Database', 'WARNING', 'No database logs found');
      return { success: true, warning: 'No logs found' };
    }
  }

  logLayer(7, 'Database', 'PASS', 'Tested via API Server (Layer 5)');
  return { success: true };
}

async function testDashboardPageAccess(brand, cookie) {
  console.log('\n📝 BONUS: Dashboard Page Access Test');
  
  try {
    const dashboardRes = await request(
      brand.host,
      '/dashboard',
      'GET',
      null,
      cookie
    );

    if (dashboardRes.status === 302 || dashboardRes.status === 307) {
      const location = dashboardRes.headers['location'] || '';
      if (location.includes('/login')) {
        log('Dashboard redirects to LOGIN - THIS IS THE PROBLEM!', 'error');
        return { 
          success: false, 
          error: 'Dashboard page redirects to login',
          location 
        };
      } else if (location.includes('/onboarding')) {
        log('Dashboard redirects to onboarding (user needs to complete onboarding)', 'warning');
        return { success: true, warning: 'Onboarding required' };
      }
    }

    if (dashboardRes.status === 200) {
      log('Dashboard page accessible!', 'success');
      return { success: true };
    }

    log(`Dashboard returned status: ${dashboardRes.status}`, 'warning');
    return { success: true, warning: `Status ${dashboardRes.status}` };
  } catch (error) {
    log(`Dashboard test error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testProfilePageAccess(brand, cookie) {
  console.log('\n📝 CRITICAL: Profile Page Access Test');
  
  try {
    const profilePageRes = await request(
      brand.host,
      '/dashboard/profile',
      'GET',
      null,
      cookie
    );

    if (profilePageRes.status === 302 || profilePageRes.status === 307) {
      const location = profilePageRes.headers['location'] || '';
      if (location.includes('/login')) {
        log('❌ PROFILE PAGE REDIRECTS TO LOGIN - ROOT CAUSE FOUND!', 'error');
        return { 
          success: false, 
          error: 'Profile page redirects to login - THIS IS YOUR ISSUE',
          location,
          critical: true
        };
      } else if (location.includes('/onboarding')) {
        log('Profile page redirects to onboarding', 'warning');
        return { success: true, warning: 'Onboarding required' };
      }
    }

    if (profilePageRes.status === 200) {
      log('✅ Profile page accessible!', 'success');
      return { success: true };
    }

    log(`Profile page returned status: ${profilePageRes.status}`, 'warning');
    return { success: true, warning: `Status ${profilePageRes.status}` };
  } catch (error) {
    log(`Profile page test error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// ========================================
// MAIN TEST FLOW
// ========================================

async function testBrand(brand) {
  console.log('\n' + '='.repeat(70));
  console.log(`🔍 TESTING: ${brand.name} (${brand.shortName})`);
  console.log(`🌐 Host: ${brand.host}`);
  console.log(`👤 User: ${brand.email}`);
  console.log('='.repeat(70));

  const brandResults = {
    brand: brand.name,
    layers: {},
    failedLayer: null,
    solution: null
  };

  // Layer 1: Login
  const layer1 = await testLayer1_Login(brand);
  brandResults.layers.layer1 = layer1;
  
  if (!layer1.success) {
    brandResults.failedLayer = 1;
    brandResults.solution = 'Fix login endpoint or check credentials';
    return brandResults;
  }

  const cookie = layer1.cookie;

  // Layer 2: Middleware
  const layer2 = await testLayer2_Middleware(brand, cookie);
  brandResults.layers.layer2 = layer2;
  
  if (!layer2.success) {
    brandResults.failedLayer = 2;
    brandResults.solution = 'Fix middleware authProxy.ts - check JWT validation and cookie extraction';
    return brandResults;
  }

  // Layer 3: BFF Auth Me
  const layer3 = await testLayer3_BffAuthMe(brand, cookie);
  brandResults.layers.layer3 = layer3;
  
  if (!layer3.success) {
    brandResults.failedLayer = 3;
    brandResults.solution = layer3.solution || 'Create /api/auth/me endpoint in BFF';
    brandResults.critical = layer3.critical;
    return brandResults;
  }

  // Layer 4: BFF Profile
  const layer4 = await testLayer4_BffProfile(brand, cookie);
  brandResults.layers.layer4 = layer4;
  
  if (!layer4.success) {
    brandResults.failedLayer = 4;
    brandResults.solution = layer4.solution || 'Fix requireBffAuth in bffProfileHandler.ts';
    return brandResults;
  }

  // Layer 5: API Server
  const layer5 = await testLayer5_ApiServer(brand, cookie);
  brandResults.layers.layer5 = layer5;

  // Layer 6: RBAC
  const layer6 = await testLayer6_RBAC(brand, cookie);
  brandResults.layers.layer6 = layer6;

  // Layer 7: Database
  const layer7 = await testLayer7_Database(brand, cookie);
  brandResults.layers.layer7 = layer7;

  // Test dashboard page access
  const dashboardTest = await testDashboardPageAccess(brand, cookie);
  brandResults.dashboardAccess = dashboardTest;

  // Test profile page access (THE CRITICAL TEST)
  const profileTest = await testProfilePageAccess(brand, cookie);
  brandResults.profilePageAccess = profileTest;

  if (!profileTest.success && profileTest.critical) {
    brandResults.failedLayer = 'Profile Page';
    brandResults.solution = 'Profile page auth check is redirecting - check fetchBackendAuthState() or validateAuthState()';
  }

  return brandResults;
}

// ========================================
// REPORT GENERATION
// ========================================

function generateReport(allResults) {
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE DIAGNOSTIC REPORT');
  console.log('='.repeat(70));

  for (const [brandName, result] of Object.entries(allResults)) {
    console.log(`\n🏢 ${result.brand}`);
    console.log('-'.repeat(70));

    if (result.failedLayer) {
      console.log(`\n❌ FAILED AT: Layer ${result.failedLayer}`);
      console.log(`\n💡 SOLUTION:`);
      console.log(`   ${result.solution}`);
      
      if (result.failedLayer === 3 && result.critical) {
        console.log(`\n🔧 IMMEDIATE ACTION REQUIRED:`);
        console.log(`   Create the missing /api/auth/me endpoint in:`);
        console.log(`   - apps/realtutorialhub-web/src/app/api/auth/me/route.ts`);
        console.log(`   - apps/skillup-web/src/app/api/auth/me/route.ts`);
      }

      if (result.failedLayer === 2) {
        console.log(`\n🔧 DEBUG STEPS:`);
        console.log(`   1. Check if accessToken cookie exists`);
        console.log(`   2. Check JWT expiration`);
        console.log(`   3. Check middleware authProxy.ts line 223-227`);
        console.log(`   4. Check resolveUser() function`);
      }

      if (result.failedLayer === 'Profile Page') {
        console.log(`\n🔧 DEBUG STEPS:`);
        console.log(`   1. Check apps/*/src/app/dashboard/profile/page.tsx`);
        console.log(`   2. Check fetchBackendAuthState() function`);
        console.log(`   3. Check validateAuthState() function`);
        console.log(`   4. Verify SSR cookie forwarding`);
      }
    } else {
      console.log(`\n✅ ALL LAYERS PASSED`);
      
      if (result.profilePageAccess && !result.profilePageAccess.success) {
        console.log(`\n⚠️  BUT: Profile page still redirects to login`);
        console.log(`   This means the issue is in the profile page component itself`);
        console.log(`   Check: apps/*/src/app/dashboard/profile/page.tsx`);
      } else {
        console.log(`\n🎉 SYSTEM HEALTHY - Profile page accessible!`);
      }
    }

    // Show layer-by-layer status
    console.log(`\n📋 Layer Status:`);
    for (let i = 1; i <= 7; i++) {
      const layer = result.layers[`layer${i}`];
      if (layer) {
        const status = layer.success ? '✅ PASS' : '❌ FAIL';
        const error = layer.error ? ` - ${layer.error}` : '';
        console.log(`   Layer ${i}: ${status}${error}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 NEXT STEPS');
  console.log('='.repeat(70));
  
  const hasFailures = Object.values(allResults).some(r => r.failedLayer);
  
  if (hasFailures) {
    console.log('\n1. Fix the identified layer issue');
    console.log('2. Re-run this script to verify the fix');
    console.log('3. Test in browser: Click profile icon');
    console.log('4. Check browser console and network tab');
  } else {
    console.log('\n✅ All API layers are working correctly!');
    console.log('\nIf profile page still redirects in browser:');
    console.log('1. Clear browser cookies');
    console.log('2. Login again');
    console.log('3. Check browser console for errors');
    console.log('4. Check Network tab for failed requests');
  }

  console.log('\n' + '='.repeat(70));
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 COMPREHENSIVE 7-LAYER PROFILE REDIRECT DIAGNOSTIC             ║');
  console.log('║  Testing: Frontend → Middleware → BFF → API → RBAC → Database     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  if (CHECK_LOGS) {
    console.log(`\n📊 GCloud logs will be checked (Project: ${PROJECT_ID})`);
  } else {
    console.log(`\n💡 Tip: Run with --check-logs to include GCloud log analysis`);
  }

  const allResults = {};

  for (const brand of BRANDS) {
    const result = await testBrand(brand);
    allResults[brand.shortName] = result;
  }

  generateReport(allResults);

  // Exit code
  const hasFailures = Object.values(allResults).some(r => r.failedLayer);
  process.exit(hasFailures ? 1 : 0);
}

// Run the diagnostic
main().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  console.error(error.stack);
  process.exit(1);
});
