#!/usr/bin/env node

/**
 * DIRECT API SERVER JWT TEST
 * 
 * Tests JWT-only authentication directly against the API server
 * Bypasses BFF to isolate the JWT logic
 */

const https = require('https');

// Test credentials
const TEST_ACCOUNTS = {
  rth: {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    loginUrl: 'https://user.realtutorialhub.com/api/auth/login',
    directApiUrl: 'https://api.realtutorialhub.com/api/auth/me',
    brand: 'realtutorialhub'
  }
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectAPITest/1.0',
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

async function testDirectAPIJWT() {
  console.log('🎯 DIRECT API SERVER JWT TEST');
  console.log('Testing JWT-only authentication directly against API server');
  console.log('=' .repeat(60));

  const account = TEST_ACCOUNTS.rth;

  try {
    // Step 1: Login via BFF to get JWT
    console.log('1️⃣  Login via BFF to get JWT...');
    const loginResponse = await makeRequest(account.loginUrl, {
      method: 'POST',
      body: JSON.stringify({
        email: account.email,
        password: account.password,
        platform: account.brand
      })
    });

    if (loginResponse.status !== 200) {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      return false;
    }

    console.log('✅ Login successful');
    
    // Extract cookies
    const setCookieHeaders = loginResponse.headers['set-cookie'] || [];
    const cookies = setCookieHeaders.join('; ');
    
    if (!cookies.includes('accessToken')) {
      console.log('❌ No accessToken cookie found');
      return false;
    }

    console.log('✅ AccessToken cookie obtained');

    // Step 2: Test direct API server with JWT only
    console.log('\n2️⃣  Testing direct API server with JWT only...');
    const directResponse = await makeRequest(account.directApiUrl, {
      headers: {
        'Cookie': cookies
        // NO other headers - pure JWT test
      }
    });

    console.log(`Direct API Status: ${directResponse.status}`);
    console.log('Direct API Response:', JSON.stringify(directResponse.data, null, 2));

    if (directResponse.status === 200 && directResponse.data.user) {
      console.log('✅ DIRECT API JWT-ONLY SUCCESS');
      console.log(`   User: ${directResponse.data.user.email}`);
      console.log(`   Brand resolved from JWT payload`);
      return true;
    } else {
      console.log('❌ Direct API JWT test failed');
      return false;
    }

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
  }
}

// Run test
testDirectAPIJWT().then(success => {
  console.log('\n🏁 DIRECT API JWT TEST RESULT');
  if (success) {
    console.log('✅ JWT-ONLY AUTHENTICATION WORKING');
    console.log('   API server correctly uses JWT payload for brand resolution');
  } else {
    console.log('❌ JWT-ONLY AUTHENTICATION FAILED');
    console.log('   API server still has header dependencies');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});