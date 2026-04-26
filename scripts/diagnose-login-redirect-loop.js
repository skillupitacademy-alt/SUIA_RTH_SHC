#!/usr/bin/env node

/**
 * 🔍 DIAGNOSE LOGIN → REDIRECT LOOP
 * 
 * Tests the complete flow:
 * 1. Login
 * 2. Check cookies
 * 3. Access dashboard
 * 4. Check what response we get
 */

const https = require('https');

const TEST_USER = {
  email: 'ajayshah@gmail.com',
  password: 'testing',
  host: 'user.realtutorialhub.com'
};

function request(host, path, method = 'GET', body = null, cookie = '', followRedirect = false) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: host,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

        const location = res.headers['location'] || null;

        resolve({
          status: res.statusCode,
          data: raw,
          cookie: cookies,
          location,
          headers: res.headers,
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

async function testLoginFlow() {
  console.log('🔍 TESTING LOGIN → DASHBOARD FLOW');
  console.log('=====================================\n');

  try {
    // Step 1: Login
    console.log('📝 Step 1: Login');
    const loginRes = await request(
      TEST_USER.host,
      '/api/auth/login',
      'POST',
      { email: TEST_USER.email, password: TEST_USER.password }
    );

    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Cookies received: ${loginRes.cookie ? 'YES' : 'NO'}`);
    
    if (loginRes.cookie) {
      const cookieNames = loginRes.cookie.split('; ').map(c => c.split('=')[0]);
      console.log(`   Cookie names: ${cookieNames.join(', ')}`);
    }

    if (loginRes.status !== 200) {
      console.log('   ❌ Login failed');
      console.log(`   Response: ${loginRes.data.substring(0, 200)}`);
      return;
    }

    if (!loginRes.cookie) {
      console.log('   ❌ No cookies received from login');
      return;
    }

    console.log('   ✅ Login successful\n');

    // Step 2: Check profile with cookies
    console.log('📝 Step 2: Check profile');
    const profileRes = await request(
      TEST_USER.host,
      '/api/profile',
      'GET',
      null,
      loginRes.cookie
    );

    console.log(`   Status: ${profileRes.status}`);
    
    if (profileRes.status === 200) {
      console.log('   ✅ Profile accessible');
      try {
        const profile = JSON.parse(profileRes.data);
        console.log(`   User: ${profile.email}`);
        console.log(`   Onboarding: ${profile.onboardingCompleted ? 'completed' : 'pending'}`);
      } catch (e) {
        console.log('   ⚠️  Could not parse profile');
      }
    } else {
      console.log('   ❌ Profile not accessible');
      console.log(`   Response: ${profileRes.data.substring(0, 200)}`);
    }

    console.log('');

    // Step 3: Access dashboard page (not API)
    console.log('📝 Step 3: Access dashboard page');
    const dashboardRes = await request(
      TEST_USER.host,
      '/dashboard',
      'GET',
      null,
      loginRes.cookie
    );

    console.log(`   Status: ${dashboardRes.status}`);
    console.log(`   Location: ${dashboardRes.location || 'none'}`);
    console.log(`   Content-Type: ${dashboardRes.headers['content-type'] || 'none'}`);

    if (dashboardRes.status === 200) {
      console.log('   ✅ Dashboard accessible');
      
      // Check if it's HTML or JSON
      const contentType = dashboardRes.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.log('   ✅ Response is HTML (correct - page rendered)');
      } else if (contentType.includes('application/json')) {
        console.log('   ❌ Response is JSON (wrong - should be HTML page)');
        console.log(`   Data preview: ${dashboardRes.data.substring(0, 200)}`);
      }
    } else if (dashboardRes.status === 302 || dashboardRes.status === 307) {
      console.log(`   ⚠️  Redirect to: ${dashboardRes.location}`);
      
      if (dashboardRes.location && dashboardRes.location.includes('/login')) {
        console.log('   ❌ PROBLEM: Redirecting back to login!');
        console.log('   This means the dashboard page thinks user is not authenticated');
      } else if (dashboardRes.location && dashboardRes.location.includes('/onboarding')) {
        console.log('   ℹ️  Redirecting to onboarding (user needs to complete onboarding)');
      }
    } else if (dashboardRes.status === 401) {
      console.log('   ❌ PROBLEM: 401 Unauthorized');
      console.log('   Dashboard page is not recognizing the authentication cookies');
    } else {
      console.log(`   ❌ Unexpected status: ${dashboardRes.status}`);
    }

    console.log('');

    // Step 4: Check if cookies are being sent correctly
    console.log('📝 Step 4: Cookie validation');
    console.log(`   Cookies being sent: ${loginRes.cookie.substring(0, 100)}...`);
    
    // Check for required cookies
    const hasAccessToken = loginRes.cookie.includes('accessToken=');
    const hasRefreshToken = loginRes.cookie.includes('refreshToken=');
    const hasCsrfToken = loginRes.cookie.includes('csrfToken=');
    
    console.log(`   Has accessToken: ${hasAccessToken ? '✅' : '❌'}`);
    console.log(`   Has refreshToken: ${hasRefreshToken ? '✅' : '❌'}`);
    console.log(`   Has csrfToken: ${hasCsrfToken ? '✅' : '❌'}`);

    if (!hasAccessToken) {
      console.log('   ❌ CRITICAL: No accessToken cookie!');
    }

    console.log('');

    // Step 5: Test dashboard API endpoint (old route)
    console.log('📝 Step 5: Test /api/dashboard endpoint');
    const dashboardApiRes = await request(
      TEST_USER.host,
      '/api/dashboard',
      'GET',
      null,
      loginRes.cookie
    );

    console.log(`   Status: ${dashboardApiRes.status}`);
    
    if (dashboardApiRes.status === 200) {
      console.log('   ⚠️  Old API endpoint still exists');
      try {
        const data = JSON.parse(dashboardApiRes.data);
        if (data.overview) {
          console.log('   ❌ PROBLEM: Returning old API structure!');
          console.log('   This means the BFF still has the old dashboard API route');
        }
      } catch (e) {
        console.log('   Could not parse response');
      }
    } else if (dashboardApiRes.status === 404) {
      console.log('   ✅ Old API endpoint removed (good)');
    } else {
      console.log(`   Status: ${dashboardApiRes.status}`);
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

console.log('🚀 STARTING DIAGNOSTIC TEST');
console.log('Testing: ' + TEST_USER.email);
console.log('Host: ' + TEST_USER.host);
console.log('');

testLoginFlow().then(() => {
  console.log('\n✅ Diagnostic complete');
}).catch((err) => {
  console.error('\n❌ Diagnostic failed:', err);
  process.exit(1);
});
