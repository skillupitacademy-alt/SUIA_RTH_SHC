#!/usr/bin/env node

/**
 * Live Authentication Test
 * Tests actual login endpoints on live servers
 */

const https = require('https');

// Test credentials
const TEST_ACCOUNTS = [
  { 
    email: 'ajayshah@gmail.com', 
    password: 'testing', 
    brand: 'realtutorialhub',
    loginUrl: 'https://api.realtutorialhub.com/api/auth/login',
    meUrl: 'https://api.realtutorialhub.com/api/auth/me'
  },
  { 
    email: 'student@skillupitacademy.com', 
    password: 'testing', 
    brand: 'skillup',
    loginUrl: 'https://api.skillupitacademy.com/api/auth/login',
    meUrl: 'https://api.skillupitacademy.com/api/auth/me'
  }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AuthTest/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testLogin(account) {
  console.log(`\n🧪 Testing Login: ${account.email} (${account.brand})`);
  console.log('='.repeat(60));
  
  try {
    console.log(`🔗 POST ${account.loginUrl}`);
    
    const loginResponse = await makeRequest(account.loginUrl, {
      method: 'POST',
      body: {
        email: account.email,
        password: account.password,
        platform: account.brand
      }
    });
    
    console.log(`📊 Login Response: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful!');
      
      // Extract cookies
      const setCookieHeaders = loginResponse.headers['set-cookie'] || [];
      const cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
      
      console.log('🍪 Cookies received:', setCookieHeaders.length > 0 ? 'Yes' : 'No');
      if (setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          const cookieName = cookie.split('=')[0];
          console.log(`   - ${cookieName}`);
        });
      }
      
      // Test /api/auth/me with cookies
      console.log(`\n🔗 GET ${account.meUrl}`);
      const meResponse = await makeRequest(account.meUrl, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log(`📊 /me Response: ${meResponse.status}`);
      
      if (meResponse.status === 200) {
        console.log('✅ Session validation successful!');
        if (meResponse.data && meResponse.data.user) {
          console.log(`👤 User: ${meResponse.data.user.email}`);
          console.log(`🔐 Admin: ${meResponse.data.user.isAdmin ? 'Yes' : 'No'}`);
        }
      } else {
        console.log('❌ Session validation failed');
        console.log('📄 Response:', meResponse.rawData);
      }
      
      return {
        loginSuccess: true,
        sessionValid: meResponse.status === 200,
        cookies: setCookieHeaders,
        loginData: loginResponse.data,
        meData: meResponse.data
      };
      
    } else {
      console.log('❌ Login failed');
      console.log('📄 Response:', loginResponse.rawData);
      
      return {
        loginSuccess: false,
        sessionValid: false,
        error: loginResponse.data,
        status: loginResponse.status
      };
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return {
      loginSuccess: false,
      sessionValid: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Starting Live Authentication Test\n');
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    const result = await testLogin(account);
    results.push({
      account: account.email,
      brand: account.brand,
      ...result
    });
  }
  
  console.log('\n📋 Summary Report');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n${result.account} (${result.brand}):`);
    console.log(`  Login: ${result.loginSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Session: ${result.sessionValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!result.loginSuccess && result.error) {
      console.log(`  Error: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`);
    }
  });
  
  const allWorking = results.every(r => r.loginSuccess && r.sessionValid);
  console.log(`\n🎯 Overall Status: ${allWorking ? '✅ ALL WORKING' : '❌ ISSUES DETECTED'}`);
  
  if (!allWorking) {
    console.log('\n🔧 Next Steps:');
    console.log('1. Check database connections');
    console.log('2. Verify user credentials exist');
    console.log('3. Check password hashing');
    console.log('4. Verify token service configuration');
  }
}

main().catch(console.error);