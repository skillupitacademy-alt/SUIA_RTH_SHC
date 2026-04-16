#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

// Test credentials from context
const TEST_CREDENTIALS = {
  rth: { email: 'ajayshah@gmail.com', password: 'testing' },
  skillup: { email: 'student@skillupitacademy.com', password: 'testing' }
};

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
        'User-Agent': 'Node.js Test Client',
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
            cookies: res.headers['set-cookie'] || []
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            cookies: res.headers['set-cookie'] || []
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

async function testAuthFlow(brand) {
  console.log(`\n=== Testing ${brand.toUpperCase()} Authentication Flow ===`);
  
  const domain = DOMAINS[brand];
  const credentials = TEST_CREDENTIALS[brand];
  
  try {
    // Step 1: Login
    console.log('1. Testing login...');
    const loginResponse = await makeRequest(`https://${domain}/api/auth/login`, {
      method: 'POST',
      body: {
        ...credentials,
        platform: brand === 'rth' ? 'realtutorialhub' : 'skillup'
      }
    });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    if (loginResponse.status !== 200) {
      console.log(`   Login Error:`, loginResponse.data);
      return false;
    }
    
    const cookies = extractCookies(loginResponse.cookies);
    console.log(`   Cookies received: ${Object.keys(cookies).join(', ')}`);
    
    if (!cookies.accessToken) {
      console.log('   ERROR: No accessToken cookie received');
      return false;
    }
    
    // Step 2: Test /api/auth/me with cookies
    console.log('2. Testing /api/auth/me...');
    const meResponse = await makeRequest(`https://${domain}/api/auth/me`, {
      headers: {
        'Cookie': formatCookies(cookies)
      }
    });
    
    console.log(`   /api/auth/me Status: ${meResponse.status}`);
    if (meResponse.status === 200) {
      console.log(`   User data:`, {
        email: meResponse.data.user?.email,
        id: meResponse.data.user?.id,
        brand: meResponse.data.user?.brand
      });
    } else {
      console.log(`   /api/auth/me Error:`, meResponse.data);
      return false;
    }
    
    // Step 3: Test /api/onboarding
    console.log('3. Testing /api/onboarding...');
    const onboardingResponse = await makeRequest(`https://${domain}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Cookie': formatCookies(cookies)
      },
      body: {
        preferences: {
          topics: ['javascript', 'react'],
          difficulty: 'intermediate'
        }
      }
    });
    
    console.log(`   /api/onboarding Status: ${onboardingResponse.status}`);
    if (onboardingResponse.status === 200) {
      console.log(`   Onboarding success:`, onboardingResponse.data);
    } else {
      console.log(`   /api/onboarding Error:`, onboardingResponse.data);
    }
    
    console.log(`✅ ${brand.toUpperCase()} authentication flow completed successfully`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${brand.toUpperCase()} authentication flow failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Live Authentication Flow with BFF Routes');
  console.log('================================================');
  
  const rthSuccess = await testAuthFlow('rth');
  const skillupSuccess = await testAuthFlow('skillup');
  
  console.log('\n=== FINAL RESULTS ===');
  console.log(`RTH Authentication: ${rthSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SkillUp Authentication: ${skillupSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (rthSuccess && skillupSuccess) {
    console.log('\n🎉 ALL TESTS PASSED - BFF Routes are working correctly!');
  } else {
    console.log('\n⚠️  Some tests failed - investigation needed');
  }
}

main().catch(console.error);