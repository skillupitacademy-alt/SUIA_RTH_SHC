/**
 * Package D: End-to-End Authentication Chain Test
 * 
 * This script tests the complete authentication flow:
 * 1. Admin login to get JWT cookie
 * 2. Authenticated request to /api/project-llm endpoint
 * 3. Unauthenticated request (missing cookie)
 * 4. Malformed token request
 * 
 * NOTE: This test is BLOCKED if backend services are not running.
 */

import http from 'http';

const FRONTEND_HOST = 'skillhubcore.localhost';
const FRONTEND_PORT = 3007;
const TEST_WORKFLOW_ID = 'test-workflow-123';

// Test credentials (should be from .env.local or test user)
const ADMIN_EMAIL = 'admin@skillhubcore.com';
const ADMIN_PASSWORD = 'admin123';

/**
 * Make HTTP request and return response
 */
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(5000);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

/**
 * Test 1: Check if frontend is running
 */
async function testFrontendRunning() {
  console.log('\n=== TEST 1: Frontend Service Check ===');
  try {
    const response = await makeRequest({
      hostname: FRONTEND_HOST,
      port: FRONTEND_PORT,
      path: '/',
      method: 'GET',
      timeout: 3000,
    });
    console.log(`✅ Frontend running: HTTP ${response.statusCode}`);
    return true;
  } catch (err) {
    console.log(`❌ Frontend NOT running: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Attempt login (if frontend running)
 */
async function testLogin() {
  console.log('\n=== TEST 2: Admin Login ===');
  console.log(`Attempting login with: ${ADMIN_EMAIL}`);
  
  const postData = JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  try {
    const response = await makeRequest({
      hostname: FRONTEND_HOST,
      port: FRONTEND_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, postData);

    console.log(`Response: HTTP ${response.statusCode}`);
    console.log(`Headers:`, response.headers);
    console.log(`Body:`, response.body);

    // Extract cookies
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const authCookie = cookies.find(c => c.includes('accessToken') || c.includes('admin_accessToken'));
      if (authCookie) {
        console.log(`✅ Auth cookie found: ${authCookie.split(';')[0]}`);
        return authCookie.split(';')[0]; // Return cookie for next tests
      }
    }

    console.log(`❌ No auth cookie set`);
    return null;
  } catch (err) {
    console.log(`❌ Login failed: ${err.message}`);
    return null;
  }
}

/**
 * Test 3: Authenticated request to /api/project-llm
 */
async function testAuthenticatedRequest(cookieValue) {
  console.log('\n=== TEST 3: Authenticated API Request ===');
  console.log(`GET /api/project-llm/workflows/${TEST_WORKFLOW_ID}/certification`);
  
  try {
    const response = await makeRequest({
      hostname: FRONTEND_HOST,
      port: FRONTEND_PORT,
      path: `/api/project-llm/workflows/${TEST_WORKFLOW_ID}/certification`,
      method: 'GET',
      headers: {
        'Cookie': cookieValue,
        'Accept': 'application/json',
      },
    });

    console.log(`Response: HTTP ${response.statusCode}`);
    console.log(`Body preview:`, response.body.substring(0, 200));

    if (response.statusCode === 200) {
      console.log(`✅ PASS: Authenticated request succeeded`);
      return 'PASS';
    } else if (response.statusCode === 404) {
      console.log(`✅ PASS: Backend returned 404 (workflow not found, but auth worked)`);
      return 'PASS';
    } else if (response.statusCode === 401) {
      console.log(`❌ FAIL: Backend returned 401 (auth chain broken)`);
      return 'FAIL';
    } else if (response.statusCode === 503) {
      console.log(`⚠️ BLOCKED: Backend service unavailable`);
      return 'BLOCKED';
    } else {
      console.log(`⚠️ UNKNOWN: HTTP ${response.statusCode}`);
      return 'UNKNOWN';
    }
  } catch (err) {
    console.log(`❌ Request failed: ${err.message}`);
    return 'BLOCKED';
  }
}

/**
 * Test 4: Unauthenticated request (no cookie)
 */
async function testUnauthenticatedRequest() {
  console.log('\n=== TEST 4: Unauthenticated Request (No Cookie) ===');
  
  try {
    const response = await makeRequest({
      hostname: FRONTEND_HOST,
      port: FRONTEND_PORT,
      path: `/api/project-llm/workflows/${TEST_WORKFLOW_ID}/certification`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`Response: HTTP ${response.statusCode}`);
    console.log(`Body:`, response.body);

    if (response.statusCode === 401) {
      console.log(`✅ PASS: Correctly returned 401 Unauthorized`);
      return 'PASS';
    } else {
      console.log(`❌ FAIL: Expected 401, got ${response.statusCode}`);
      return 'FAIL';
    }
  } catch (err) {
    console.log(`❌ Request failed: ${err.message}`);
    return 'BLOCKED';
  }
}

/**
 * Test 5: Malformed token
 */
async function testMalformedToken() {
  console.log('\n=== TEST 5: Malformed Token ===');
  
  try {
    const response = await makeRequest({
      hostname: FRONTEND_HOST,
      port: FRONTEND_PORT,
      path: `/api/project-llm/workflows/${TEST_WORKFLOW_ID}/certification`,
      method: 'GET',
      headers: {
        'Cookie': 'accessToken=invalid.malformed.token',
        'Accept': 'application/json',
      },
    });

    console.log(`Response: HTTP ${response.statusCode}`);
    console.log(`Body:`, response.body);

    if (response.statusCode === 401 || response.statusCode === 403) {
      console.log(`✅ PASS: Correctly rejected malformed token`);
      return 'PASS';
    } else {
      console.log(`❌ FAIL: Expected 401/403, got ${response.statusCode}`);
      return 'FAIL';
    }
  } catch (err) {
    console.log(`❌ Request failed: ${err.message}`);
    return 'BLOCKED';
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Package D: End-to-End Authentication Chain Test             ║');
  console.log('║  Commit: 6c4b8e72b7aaeae9b4aa792946a5eb96411ed8ce             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const results = {
    frontend_running: false,
    login: 'NOT_TESTED',
    auth_chain: 'NOT_TESTED',
    no_cookie: 'NOT_TESTED',
    malformed_token: 'NOT_TESTED',
  };

  // Test 1: Check frontend
  results.frontend_running = await testFrontendRunning();

  if (!results.frontend_running) {
    console.log('\n❌ BLOCKED: Frontend service not running');
    console.log('Start with: cd apps/skillhubcore-admin && pnpm dev');
    console.log('\n=== FINAL RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }

  // Test 2: Login
  const authCookie = await testLogin();
  results.login = authCookie ? 'PASS' : 'FAIL';

  if (!authCookie) {
    console.log('\n❌ BLOCKED: Login failed, cannot test auth chain');
    console.log('\n=== FINAL RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }

  // Test 3: Authenticated request
  results.auth_chain = await testAuthenticatedRequest(authCookie);

  // Test 4: Unauthenticated request
  results.no_cookie = await testUnauthenticatedRequest();

  // Test 5: Malformed token
  results.malformed_token = await testMalformedToken();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL RESULTS                                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(JSON.stringify(results, null, 2));

  const allPass = Object.values(results).every(v => v === 'PASS' || v === true);
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
