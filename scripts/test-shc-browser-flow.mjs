/**
 * Test SHC Browser Authentication Flow
 * =====================================
 * Simulates exactly what the browser does
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ADMIN_URL = 'https://admin.skillhubcore.in';

console.log('🌐 Testing SHC Browser Authentication Flow');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Step 1: Get CSRF token first (if needed)
console.log('✅ Step 1: Initial Request (Get CSRF Token)');
console.log(`   URL: ${ADMIN_URL}/api/auth/login`);
console.log('');

let csrfToken = null;
let cookies = [];

try {
  // First, try to get CSRF token
  const preflightResponse = await fetch(`${ADMIN_URL}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': ADMIN_URL,
      'Access-Control-Request-Method': 'POST',
    },
  });

  console.log(`   Preflight Status: ${preflightResponse.status}`);
  console.log('');

} catch (error) {
  console.log(`   Preflight not required or failed: ${error.message}`);
  console.log('');
}

// Step 2: Login request (exactly as browser does)
console.log('✅ Step 2: Login Request (Browser Simulation)');
console.log(`   URL: ${ADMIN_URL}/api/auth/login`);
console.log(`   Method: POST`);
console.log(`   Body: { email, password }`);
console.log('');

try {
  const loginResponse = await fetch(`${ADMIN_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': ADMIN_URL,
      'Referer': `${ADMIN_URL}/login`,
    },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify({
      email: 'admin@skillhubcore.in',
      password: 'testing',
    }),
  });

  console.log(`   Response Status: ${loginResponse.status}`);
  console.log(`   Response Status Text: ${loginResponse.statusText}`);
  console.log('');

  // Check response headers
  console.log('   Response Headers:');
  loginResponse.headers.forEach((value, key) => {
    console.log(`     ${key}: ${value}`);
  });
  console.log('');

  // Get response body
  const responseText = await loginResponse.text();
  console.log('   Response Body:');
  console.log(`     ${responseText.substring(0, 500)}`);
  console.log('');

  if (!loginResponse.ok) {
    console.log('❌ Login failed!');
    console.log('');
    console.log('🔍 Debugging Information:');
    console.log('');
    
    // Try to parse as JSON
    try {
      const errorData = JSON.parse(responseText);
      console.log('   Error Response:');
      console.log(`     ${JSON.stringify(errorData, null, 2)}`);
    } catch {
      console.log('   Raw Response:');
      console.log(`     ${responseText}`);
    }
    console.log('');

    // Check if it's a routing issue
    console.log('🔍 Possible Issues:');
    console.log('   1. BFF proxy not deployed');
    console.log('   2. BFF routing to wrong endpoint');
    console.log('   3. CSRF token required but not provided');
    console.log('   4. Gateway not routing correctly');
    console.log('');

    // Test direct API endpoint
    console.log('🧪 Testing Direct API Endpoint:');
    console.log(`   URL: https://api.skillhubcore.in/api/shc/auth/login`);
    console.log('');

    const directResponse = await fetch('https://api.skillhubcore.in/api/shc/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({
        email: 'admin@skillhubcore.in',
        password: 'testing',
      }),
    });

    console.log(`   Direct API Status: ${directResponse.status}`);
    
    if (directResponse.ok) {
      console.log('   ✓ Direct API works - Issue is in BFF proxy');
    } else {
      console.log('   ✗ Direct API also fails - Issue is in API server');
    }
    console.log('');

    process.exit(1);
  }

  // Parse successful response
  const loginData = JSON.parse(responseText);
  
  console.log('✅ Login Successful!');
  console.log('');
  console.log('   Response Data:');
  console.log(`     Has accessToken: ${!!loginData.accessToken}`);
  console.log(`     Has refreshToken: ${!!loginData.refreshToken}`);
  console.log(`     Has user: ${!!loginData.user}`);
  console.log('');

  if (loginData.user) {
    console.log('   User Data:');
    console.log(`     Email: ${loginData.user.email}`);
    console.log(`     Role: ${loginData.user.role}`);
    console.log(`     Is Admin: ${loginData.user.isAdmin}`);
    console.log(`     Onboarding Completed: ${loginData.user.onboardingCompleted}`);
  }
  console.log('');

  // Step 3: Test Dashboard Access
  console.log('✅ Step 3: Testing Dashboard Access');
  console.log(`   URL: ${ADMIN_URL}/dashboard`);
  console.log('');

  try {
    const dashboardResponse = await fetch(`${ADMIN_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Origin': ADMIN_URL,
        'Referer': `${ADMIN_URL}/login`,
      },
      credentials: 'include',
    });

    console.log(`   Dashboard Status: ${dashboardResponse.status}`);
    console.log(`   Dashboard Status Text: ${dashboardResponse.statusText}`);
    console.log('');

    if (dashboardResponse.status === 200) {
      const dashboardHtml = await dashboardResponse.text();
      
      // Check if it's the actual dashboard page (not a redirect or error)
      const isDashboard = dashboardHtml.includes('dashboard') || dashboardHtml.includes('Dashboard');
      const isLoginPage = dashboardHtml.includes('login') || dashboardHtml.includes('Login');
      const isOnboarding = dashboardHtml.includes('onboarding') || dashboardHtml.includes('Onboarding');
      
      console.log('   Page Analysis:');
      console.log(`     Contains "dashboard": ${isDashboard}`);
      console.log(`     Contains "login": ${isLoginPage}`);
      console.log(`     Contains "onboarding": ${isOnboarding}`);
      console.log('');

      if (isDashboard && !isLoginPage) {
        console.log('   ✅ Dashboard page loaded successfully!');
      } else if (isOnboarding) {
        console.log('   ⚠️  Redirected to onboarding page');
        console.log('   This means onboardingCompleted is not set to true');
      } else if (isLoginPage) {
        console.log('   ❌ Redirected to login page (authentication failed)');
      } else {
        console.log('   ⚠️  Unknown page content');
      }
      console.log('');
    } else if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log(`   Redirected to: ${location}`);
      
      if (location?.includes('/login')) {
        console.log('   ❌ Redirected to login (authentication failed)');
      } else if (location?.includes('/onboarding')) {
        console.log('   ⚠️  Redirected to onboarding');
        console.log('   This means onboardingCompleted is not set to true');
      }
      console.log('');
    } else {
      console.log('   ❌ Dashboard access failed');
      console.log('');
    }
  } catch (error) {
    console.log(`   ❌ Dashboard request error: ${error.message}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 BROWSER FLOW TEST PASSED!');
  console.log('');
  console.log('The browser should be able to login successfully.');
  console.log('');

  process.exit(0);

} catch (error) {
  console.log('❌ Request Error:', error.message);
  console.log('');
  console.log('This could indicate:');
  console.log('  - Network connectivity issue');
  console.log('  - CORS configuration problem');
  console.log('  - BFF not responding');
  console.log('');
  process.exit(1);
}
