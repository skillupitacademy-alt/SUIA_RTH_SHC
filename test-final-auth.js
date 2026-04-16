#!/usr/bin/env node

/**
 * Final Authentication Test
 * Test both users to verify the issue is resolved
 */

const https = require('https');

const TEST_CREDENTIALS = [
  {
    name: 'RTH User',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    brand: 'realtutorialhub',
    loginUrl: 'https://user.realtutorialhub.com/login',
    apiUrl: 'https://api.realtutorialhub.com/api/auth/login'
  },
  {
    name: 'SkillUp User',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    brand: 'skillup',
    loginUrl: 'https://user.skillupitacademy.com/login',
    apiUrl: 'https://api.skillupitacademy.com/api/auth/login'
  }
];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'FinalAuthTest/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 30000
    };

    if (options.body) {
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: data.length > 0 ? JSON.parse(data) : null,
            rawBody: data
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: null,
            rawBody: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLogin(credential) {
  console.log(`\n🔐 Testing ${credential.name} (${credential.email})`);
  console.log(`   Login URL: ${credential.loginUrl}`);
  console.log(`   API URL: ${credential.apiUrl}`);

  const loginPayload = {
    email: credential.email,
    password: credential.password,
    platform: credential.brand
  };

  try {
    const response = await makeRequest(credential.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': credential.loginUrl.replace('/login', '')
      },
      body: JSON.stringify(loginPayload)
    });

    if (response.status === 200) {
      console.log('   ✅ LOGIN SUCCESSFUL!');
      console.log('   📋 Response:', {
        status: response.status,
        hasUser: !!response.body?.user,
        userEmail: response.body?.user?.email,
        userId: response.body?.user?.id,
        correlationId: response.headers['x-correlation-id']
      });
      return { success: true, response };
    } else {
      console.log('   ❌ LOGIN FAILED');
      console.log('   📋 Response:', {
        status: response.status,
        error: response.body?.error || response.body?.message || response.rawBody,
        correlationId: response.headers['x-correlation-id']
      });
      return { success: false, response };
    }
  } catch (error) {
    console.log('   💥 REQUEST FAILED');
    console.log('   📋 Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runFinalTest() {
  console.log('🎯 FINAL AUTHENTICATION TEST');
  console.log('============================');
  console.log('Testing both users after database fixes...');

  const results = [];

  for (const credential of TEST_CREDENTIALS) {
    const result = await testLogin(credential);
    results.push({
      name: credential.name,
      email: credential.email,
      success: result.success
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('FINAL TEST RESULTS');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 SUMMARY:`);
  console.log(`   ✅ Successful logins: ${successful.length}`);
  console.log(`   ❌ Failed logins: ${failed.length}`);
  console.log(`   📝 Total tests: ${results.length}`);

  if (successful.length > 0) {
    console.log(`\n✅ SUCCESSFUL LOGINS:`);
    successful.forEach(result => {
      console.log(`   - ${result.name}: ${result.email}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ FAILED LOGINS:`);
    failed.forEach(result => {
      console.log(`   - ${result.name}: ${result.email}`);
    });
  }

  console.log(`\n🎯 CONCLUSION:`);
  if (successful.length === TEST_CREDENTIALS.length) {
    console.log('   🎉 ALL TESTS PASSED! Authentication issue is RESOLVED!');
    console.log('   ✅ Both users can now login successfully');
    console.log('   🚀 Users should be able to reach the dashboard');
  } else if (successful.length > 0) {
    console.log('   ⚠️  PARTIAL SUCCESS - Some users can login');
    console.log('   🔧 Check the failed logins for remaining issues');
  } else {
    console.log('   ❌ ALL TESTS FAILED - Authentication issue persists');
    console.log('   🔍 Further investigation needed');
  }

  console.log(`\n🏁 Test completed at ${new Date().toISOString()}`);
}

runFinalTest().catch(console.error);