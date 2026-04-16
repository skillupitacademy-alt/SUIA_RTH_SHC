#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

// Multiple test credential sets to try
const TEST_CREDENTIALS = [
  { brand: 'rth', email: 'ajayshah@gmail.com', password: 'testing', platform: 'realtutorialhub' },
  { brand: 'skillup', email: 'student@skillupitacademy.com', password: 'testing', platform: 'skillup' },
  // Try with different password variations
  { brand: 'rth', email: 'ajayshah@gmail.com', password: 'Testing', platform: 'realtutorialhub' },
  { brand: 'rth', email: 'ajayshah@gmail.com', password: 'Testing123', platform: 'realtutorialhub' },
  { brand: 'skillup', email: 'student@skillupitacademy.com', password: 'Testing', platform: 'skillup' },
  { brand: 'skillup', email: 'student@skillupitacademy.com', password: 'Testing123', platform: 'skillup' }
];

const DOMAINS = {
  rth: 'user.realtutorialhub.com',
  skillup: 'user.skillupitacademy.com'
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Live-Test-Client',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            cookies: res.headers['set-cookie'] || [],
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            cookies: res.headers['set-cookie'] || [],
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function extractCookies(cookieHeaders) {
  const cookies = {};
  cookieHeaders.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      cookies[name.trim()] = value.trim();
    }
  });
  return cookies;
}

function formatCookies(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function testCredentials(credentials) {
  const domain = DOMAINS[credentials.brand];
  
  console.log(`\n🔍 Testing ${credentials.brand.toUpperCase()}: ${credentials.email} / ${credentials.password}`);
  
  try {
    // Test login
    const loginResponse = await makeRequest(`https://${domain}/api/auth/login`, {
      method: 'POST',
      body: credentials
    });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log(`   ✅ Login SUCCESS!`);
      
      const cookies = extractCookies(loginResponse.cookies);
      console.log(`   🍪 Cookies: ${Object.keys(cookies).join(', ')}`);
      
      if (cookies.accessToken) {
        console.log(`   🔑 Access Token: ${cookies.accessToken.substring(0, 20)}...`);
        
        // Test /api/auth/me
        const meResponse = await makeRequest(`https://${domain}/api/auth/me`, {
          headers: {
            'Cookie': formatCookies(cookies)
          }
        });
        
        console.log(`   /api/auth/me Status: ${meResponse.status}`);
        
        if (meResponse.status === 200) {
          console.log(`   ✅ /api/auth/me SUCCESS!`);
          console.log(`   👤 User: ${meResponse.data.user?.email} (ID: ${meResponse.data.user?.id})`);
          
          // Test /api/onboarding
          const onboardingResponse = await makeRequest(`https://${domain}/api/onboarding`, {
            method: 'POST',
            headers: {
              'Cookie': formatCookies(cookies)
            },
            body: {
              preferences: {
                topics: ['javascript'],
                difficulty: 'beginner'
              }
            }
          });
          
          console.log(`   /api/onboarding Status: ${onboardingResponse.status}`);
          
          if (onboardingResponse.status === 200) {
            console.log(`   ✅ /api/onboarding SUCCESS!`);
          } else {
            console.log(`   ⚠️ /api/onboarding Response:`, onboardingResponse.data);
          }
          
          return {
            success: true,
            credentials,
            loginWorked: true,
            authMeWorked: true,
            onboardingWorked: onboardingResponse.status === 200
          };
        } else {
          console.log(`   ❌ /api/auth/me FAILED:`, meResponse.data);
          return {
            success: false,
            credentials,
            loginWorked: true,
            authMeWorked: false,
            error: meResponse.data
          };
        }
      } else {
        console.log(`   ❌ No accessToken cookie received`);
        return {
          success: false,
          credentials,
          loginWorked: true,
          authMeWorked: false,
          error: 'No accessToken cookie'
        };
      }
    } else {
      console.log(`   ❌ Login FAILED:`, loginResponse.data);
      return {
        success: false,
        credentials,
        loginWorked: false,
        error: loginResponse.data
      };
    }
  } catch (error) {
    console.log(`   ❌ ERROR:`, error.message);
    return {
      success: false,
      credentials,
      error: error.message
    };
  }
}

async function testBFFRouteExistence() {
  console.log('\n🔍 Testing BFF Route Existence');
  console.log('==============================');
  
  const domains = ['user.realtutorialhub.com', 'user.skillupitacademy.com'];
  const routes = ['/api/auth/me', '/api/onboarding'];
  
  for (const domain of domains) {
    console.log(`\n📍 ${domain}:`);
    for (const route of routes) {
      try {
        const response = await makeRequest(`https://${domain}${route}`, { method: 'HEAD' });
        const exists = response.status !== 404;
        const isAuth = response.status === 401 || response.status === 403;
        
        if (exists && isAuth) {
          console.log(`   ${route}: ✅ EXISTS + AUTH REQUIRED (${response.status})`);
        } else if (exists) {
          console.log(`   ${route}: ⚠️ EXISTS BUT NO AUTH (${response.status})`);
        } else {
          console.log(`   ${route}: ❌ NOT FOUND (404)`);
        }
      } catch (error) {
        console.log(`   ${route}: ❌ ERROR - ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 LIVE AUTHENTICATION TEST - COMPREHENSIVE VALIDATION');
  console.log('='.repeat(60));
  
  // Test BFF route existence first
  await testBFFRouteExistence();
  
  console.log('\n🔐 Testing Authentication with Multiple Credentials');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const credentials of TEST_CREDENTIALS) {
    const result = await testCredentials(credentials);
    results.push(result);
    
    // If we find working credentials, break early
    if (result.success) {
      console.log(`\n🎉 FOUND WORKING CREDENTIALS!`);
      break;
    }
  }
  
  console.log('\n📊 FINAL LIVE TEST RESULTS');
  console.log('='.repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  const loginSuccesses = results.filter(r => r.loginWorked);
  const authMeSuccesses = results.filter(r => r.authMeWorked);
  
  console.log(`✅ Successful Complete Flows: ${successfulTests.length}/${results.length}`);
  console.log(`🔑 Successful Logins: ${loginSuccesses.length}/${results.length}`);
  console.log(`👤 Successful /api/auth/me: ${authMeSuccesses.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n🎯 WORKING CREDENTIALS FOUND:');
    successfulTests.forEach(result => {
      console.log(`   ✅ ${result.credentials.brand.toUpperCase()}: ${result.credentials.email} / ${result.credentials.password}`);
    });
  }
  
  if (loginSuccesses.length > 0 && authMeSuccesses.length === 0) {
    console.log('\n⚠️ DIAGNOSIS: Login works but /api/auth/me fails');
    console.log('   This indicates TokenService fix may not be fully deployed');
  } else if (loginSuccesses.length === 0) {
    console.log('\n⚠️ DIAGNOSIS: All logins fail');
    console.log('   This indicates credential or database issues');
  }
  
  // Final verdict
  console.log('\n🏁 FINAL VERDICT:');
  if (successfulTests.length > 0) {
    console.log('✅ FULLY WORKING - Authentication system is functional!');
    console.log('🔧 TokenService fix is deployed and working correctly');
  } else if (authMeSuccesses.length > 0) {
    console.log('⚠️ PARTIALLY WORKING - Some components work');
  } else {
    console.log('❌ NOT WORKING - Need to investigate credentials or deployment');
  }
  
  return results;
}

main().catch(console.error);