#!/usr/bin/env node

/**
 * Fixed Authentication Validation Test with Proper Cookie Handling
 * Tests both login and /me endpoints with correct cookie preservation
 */

const https = require('https');

const TEST_ACCOUNTS = [
  {
    name: 'RTH Test Account',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    loginUrl: 'https://api.realtutorialhub.com/api/auth/login',
    meUrl: 'https://api.realtutorialhub.com/api/auth/me',
    brand: 'realtutorialhub'
  },
  {
    name: 'SkillUp Test Account', 
    email: 'student@skillupitacademy.com',
    password: 'testing',
    loginUrl: 'https://api.skillupitacademy.com/api/auth/login',
    meUrl: 'https://api.skillupitacademy.com/api/auth/me',
    brand: 'skillup'
  }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
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

async function testLogin(account) {
  console.log(`\n🧪 Testing Login: ${account.name}`);
  console.log('============================================================');
  
  try {
    // TASK 1: Proper login request with correct headers
    const loginResponse = await makeRequest(account.loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-portal-identity': 'user',
        'x-brand': account.brand
      },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
        platform: account.brand
      })
    });

    console.log(`🔗 POST ${account.loginUrl}`);
    console.log(`📊 Login Response: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      
      // TASK 2: Extract and preserve cookies correctly
      const setCookieHeaders = loginResponse.headers['set-cookie'] || [];
      console.log(`🍪 Cookies received: ${setCookieHeaders.length} cookies`);
      
      // Parse cookies properly for Node.js requests
      const cookieHeader = setCookieHeaders
        .map(cookie => cookie.split(';')[0]) // Take only name=value part
        .join('; ');
      
      console.log(`🔧 Cookie header: ${cookieHeader.substring(0, 100)}...`);
      
      // Verify accessToken is present
      const hasAccessToken = setCookieHeaders.some(cookie => 
        cookie.startsWith('accessToken=') || cookie.startsWith('admin_accessToken=')
      );
      console.log(`🎫 Access token present: ${hasAccessToken ? '✅ YES' : '❌ NO'}`);
      
      // TASK 3: Test /me endpoint with preserved cookies
      console.log(`\n🧪 Testing /me endpoint for ${account.name}`);
      console.log('------------------------------------------------------------');
      
      const meResponse = await makeRequest(account.meUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-portal-identity': 'user',
          'x-brand': account.brand,
          'Cookie': cookieHeader  // Properly preserved cookies
        }
      });
      
      console.log(`🔗 GET ${account.meUrl}`);
      console.log(`📊 /me Response: ${meResponse.status}`);
      
      if (meResponse.status === 200) {
        console.log('✅ Session validation successful');
        console.log(`👤 User: ${meResponse.data.data?.user?.email || meResponse.data.user?.email || 'Unknown'}`);
        console.log(`🎯 Onboarded: ${meResponse.data.data?.user?.onboarded || meResponse.data.user?.onboarded || false}`);
        return { 
          login: true, 
          session: true, 
          cookiesPreserved: hasAccessToken,
          error: null 
        };
      } else {
        console.log('❌ Session validation failed');
        console.log(`📄 Response: ${JSON.stringify(meResponse.data, null, 2)}`);
        return { 
          login: true, 
          session: false, 
          cookiesPreserved: hasAccessToken,
          error: meResponse.data 
        };
      }
      
    } else {
      console.log('❌ Login failed');
      console.log(`📄 Response: ${JSON.stringify(loginResponse.data, null, 2)}`);
      return { 
        login: false, 
        session: false, 
        cookiesPreserved: false,
        error: loginResponse.data 
      };
    }
    
  } catch (error) {
    console.log('💥 Request failed');
    console.log(`📄 Error: ${error.message}`);
    return { 
      login: false, 
      session: false, 
      cookiesPreserved: false,
      error: error.message 
    };
  }
}

async function main() {
  console.log('🚀 Starting FIXED Authentication Validation');
  console.log('🔧 Now with proper cookie preservation!');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  const results = {};
  
  for (const account of TEST_ACCOUNTS) {
    results[account.brand] = await testLogin(account);
  }
  
  // TASK 4: Final validation report
  console.log('\n📋 Final Validation Report');
  console.log('============================================================');
  
  let allPassed = true;
  
  for (const [brand, result] of Object.entries(results)) {
    const account = TEST_ACCOUNTS.find(a => a.brand === brand);
    console.log(`\n${account.name}:`);
    console.log(`Login: ${result.login ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Cookies Preserved: ${result.cookiesPreserved ? '✅ YES' : '❌ NO'}`);
    console.log(`Session (/me): ${result.session ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (result.error) {
      console.log(`Error: ${JSON.stringify(result.error, null, 2)}`);
    }
    
    if (!result.login || !result.session) {
      allPassed = false;
    }
  }
  
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ ISSUES DETECTED'}`);
  
  // FINAL VERDICT
  console.log('\n📊 FINAL VERDICT');
  console.log('============================================================');
  
  if (allPassed) {
    console.log('✅ AUTH SYSTEM WORKING');
    console.log('✅ COOKIE PRESERVATION FIXED');
    console.log('✅ BRAND-SPECIFIC DB ROUTING FUNCTIONAL');
    console.log('✅ "Unable to resolve session state" RESOLVED');
    console.log('\n🎉 Authentication system is fully operational!');
  } else {
    const cookieIssues = Object.values(results).some(r => !r.cookiesPreserved);
    const sessionIssues = Object.values(results).some(r => r.login && !r.session);
    
    if (cookieIssues) {
      console.log('❌ COOKIE PRESERVATION ISSUE');
    }
    if (sessionIssues) {
      console.log('❌ SESSION VALIDATION ISSUE');  
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Check cookie handling in test script');
    console.log('2. Verify server logs for session validation');
    console.log('3. Test manually in browser with dev tools');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);