#!/usr/bin/env node

/**
 * DETAILED COOKIE DEBUG TEST
 * 
 * Analyzes cookie handling and forwarding in detail
 */

const https = require('https');

// Test credentials
const TEST_ACCOUNTS = {
  rth: {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    loginUrl: 'https://user.realtutorialhub.com/api/auth/login',
    meUrl: 'https://user.realtutorialhub.com/api/auth/me',
    brand: 'realtutorialhub'
  }
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CookieDebug/1.0',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function debugCookieFlow() {
  console.log('🔍 DETAILED COOKIE DEBUG TEST');
  console.log('=' .repeat(50));

  const account = TEST_ACCOUNTS.rth;

  try {
    // Step 1: Login and analyze cookies
    console.log('1️⃣  Login and Cookie Analysis...');
    const loginResponse = await makeRequest(account.loginUrl, {
      method: 'POST',
      body: JSON.stringify({
        email: account.email,
        password: account.password,
        platform: account.brand
      })
    });

    console.log(`Login Status: ${loginResponse.status}`);
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed, cannot continue');
      return;
    }

    // Analyze cookies in detail
    const setCookieHeaders = loginResponse.headers['set-cookie'] || [];
    console.log('\n🍪 Cookie Analysis:');
    console.log('Set-Cookie Headers:', setCookieHeaders);

    let accessTokenCookie = null;
    let allCookies = [];

    setCookieHeaders.forEach((cookieHeader, index) => {
      console.log(`Cookie ${index + 1}: ${cookieHeader}`);
      
      // Parse cookie
      const cookieParts = cookieHeader.split(';');
      const [nameValue] = cookieParts;
      const [name, value] = nameValue.split('=');
      
      allCookies.push(`${name}=${value}`);
      
      if (name.trim() === 'accessToken') {
        accessTokenCookie = `${name}=${value}`;
        console.log(`✅ Found accessToken: ${name}=${value.substring(0, 20)}...`);
      }
    });

    if (!accessTokenCookie) {
      console.log('❌ No accessToken cookie found');
      return;
    }

    const cookieString = allCookies.join('; ');
    console.log(`\n🔗 Combined Cookie String: ${cookieString.substring(0, 100)}...`);

    // Step 2: Test /me with different cookie configurations
    console.log('\n2️⃣  Testing /me with different cookie configurations...');

    // Test 1: With all cookies
    console.log('\nTest 1: All cookies');
    const meResponse1 = await makeRequest(account.meUrl, {
      headers: {
        'Cookie': cookieString
      }
    });
    console.log(`Status: ${meResponse1.status}`);
    console.log('Response:', JSON.stringify(meResponse1.data, null, 2));

    // Test 2: Only accessToken cookie
    console.log('\nTest 2: Only accessToken cookie');
    const meResponse2 = await makeRequest(account.meUrl, {
      headers: {
        'Cookie': accessTokenCookie
      }
    });
    console.log(`Status: ${meResponse2.status}`);
    console.log('Response:', JSON.stringify(meResponse2.data, null, 2));

    // Test 3: With additional headers
    console.log('\nTest 3: With brand and portal headers');
    const meResponse3 = await makeRequest(account.meUrl, {
      headers: {
        'Cookie': cookieString,
        'x-brand': account.brand,
        'x-portal-identity': 'user'
      }
    });
    console.log(`Status: ${meResponse3.status}`);
    console.log('Response:', JSON.stringify(meResponse3.data, null, 2));

    // Step 3: Test direct API server (if accessible)
    console.log('\n3️⃣  Testing direct API server...');
    const directApiUrl = 'https://api.realtutorialhub.com/api/auth/me';
    
    try {
      const directResponse = await makeRequest(directApiUrl, {
        headers: {
          'Cookie': cookieString,
          'x-brand': account.brand,
          'x-portal-identity': 'user'
        }
      });
      console.log(`Direct API Status: ${directResponse.status}`);
      console.log('Direct API Response:', JSON.stringify(directResponse.data, null, 2));
    } catch (error) {
      console.log('Direct API test failed:', error.message);
    }

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
  }
}

// Run debug
debugCookieFlow().catch(error => {
  console.error('💥 Debug crashed:', error);
  process.exit(1);
});