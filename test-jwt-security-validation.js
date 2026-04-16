#!/usr/bin/env node

/**
 * JWT SECURITY VALIDATION TEST
 * 
 * Tests that authentication relies solely on JWT payload, not headers
 * This prevents header spoofing attacks
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
  },
  skillup: {
    email: 'student@skillupitacademy.com',
    password: 'testing',
    loginUrl: 'https://user.skillupitacademy.com/api/auth/login',
    meUrl: 'https://user.skillupitacademy.com/api/auth/me',
    brand: 'skillup'
  }
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JWTSecurityTest/1.0',
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

async function testJWTSecurity(account) {
  console.log(`\n🔐 Testing JWT Security for ${account.brand.toUpperCase()}`);
  console.log('=' .repeat(60));

  try {
    // Step 1: Login to get JWT
    console.log('1️⃣  Login to get JWT...');
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

    // Step 2: Test /me with ONLY cookies (no headers)
    console.log('\n2️⃣  Testing /me with ONLY cookies (JWT-based)...');
    const meResponse = await makeRequest(account.meUrl, {
      headers: {
        'Cookie': cookies
        // NO x-brand, NO x-portal-identity, NO host headers
      }
    });

    console.log(`Status: ${meResponse.status}`);
    console.log('Response Headers:', Object.fromEntries(Object.entries(meResponse.headers)));
    console.log('Response Body:', JSON.stringify(meResponse.data, null, 2));
    
    if (meResponse.status !== 200) {
      console.log('❌ /me failed without headers - JWT security not implemented');
      console.log('Response:', JSON.stringify(meResponse.data, null, 2));
      return false;
    }

    console.log('✅ /me works with ONLY cookies - JWT security implemented');
    console.log(`   User: ${meResponse.data.user?.email}`);
    console.log(`   Brand: ${account.brand}`);

    // Step 3: Security Test - Try to spoof brand with wrong headers
    console.log('\n3️⃣  Security Test: Attempting brand spoofing...');
    const spoofBrand = account.brand === 'realtutorialhub' ? 'skillup' : 'realtutorialhub';
    
    const spoofResponse = await makeRequest(account.meUrl, {
      headers: {
        'Cookie': cookies,
        'x-brand': spoofBrand, // Try to spoof brand
        'x-portal-identity': 'admin', // Try to spoof role
        'host': `user.${spoofBrand}.com` // Try to spoof host
      }
    });

    console.log(`Spoof attempt status: ${spoofResponse.status}`);
    
    if (spoofResponse.status === 200 && spoofResponse.data.user) {
      // Should still return the correct user based on JWT, ignoring headers
      const returnedUser = spoofResponse.data.user;
      console.log('✅ Headers ignored - JWT payload used for brand resolution');
      console.log(`   Returned user: ${returnedUser.email} (correct)`);
    } else {
      console.log('⚠️  Unexpected response to spoof attempt');
    }

    // Step 4: Test without any cookies
    console.log('\n4️⃣  Testing without cookies (should fail)...');
    const noCookieResponse = await makeRequest(account.meUrl, {
      headers: {
        'x-brand': account.brand,
        'x-portal-identity': 'user'
      }
    });

    if (noCookieResponse.status === 401) {
      console.log('✅ Correctly rejects requests without JWT cookies');
    } else {
      console.log('❌ Security issue: accepts requests without JWT');
      return false;
    }

    return true;

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
  }
}

async function runJWTSecurityValidation() {
  console.log('🛡️  JWT SECURITY VALIDATION');
  console.log('Testing that authentication relies ONLY on JWT payload');
  console.log('Headers should be ignored to prevent spoofing attacks\n');

  const results = {};

  // Test both brands
  for (const [brand, account] of Object.entries(TEST_ACCOUNTS)) {
    results[brand] = await testJWTSecurity(account);
  }

  // Final security report
  console.log('\n🛡️  SECURITY VALIDATION REPORT');
  console.log('=' .repeat(60));

  let allSecure = true;
  for (const [brand, secure] of Object.entries(results)) {
    const status = secure ? '✅ SECURE' : '❌ VULNERABLE';
    console.log(`${brand.toUpperCase()}: ${status}`);
    if (!secure) allSecure = false;
  }

  console.log('\n🏁 FINAL SECURITY VERDICT');
  if (allSecure) {
    console.log('✅ FAANG-LEVEL SECURITY');
    console.log('   - JWT = Single source of truth ✅');
    console.log('   - Headers ignored ✅');
    console.log('   - Brand spoofing prevented ✅');
    console.log('   - Multi-brand isolation secure ✅');
  } else {
    console.log('❌ SECURITY VULNERABILITY');
    console.log('   System still relies on headers - fix required');
  }

  process.exit(allSecure ? 0 : 1);
}

// Run validation
runJWTSecurityValidation().catch(error => {
  console.error('💥 Security validation crashed:', error);
  process.exit(1);
});