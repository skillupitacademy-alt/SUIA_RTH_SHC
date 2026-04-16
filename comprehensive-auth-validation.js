#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

// Test credentials
const TEST_CREDENTIALS = {
  rth: { email: 'ajayshah@gmail.com', password: 'testing', platform: 'realtutorialhub' },
  skillup: { email: 'student@skillupitacademy.com', password: 'testing', platform: 'skillup' }
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
        'User-Agent': 'Production-Validation-Client',
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

async function validateBFFRouteExistence(domain) {
  console.log(`\n🔍 Validating BFF Route Existence for ${domain}`);
  
  const endpoints = [
    `/api/auth/me`,
    `/api/onboarding`
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`https://${domain}${endpoint}`, { method: 'HEAD' });
      const exists = response.status !== 404;
      const isAuth = response.status === 401 || response.status === 403;
      
      results[endpoint] = {
        exists,
        status: response.status,
        isAuthRequired: isAuth,
        verdict: exists ? (isAuth ? '✅ EXISTS + AUTH REQUIRED' : '⚠️ EXISTS BUT NO AUTH') : '❌ NOT FOUND (404)'
      };
      
      console.log(`   ${endpoint}: ${results[endpoint].verdict} (${response.status})`);
    } catch (error) {
      results[endpoint] = {
        exists: false,
        error: error.message,
        verdict: '❌ ERROR'
      };
      console.log(`   ${endpoint}: ❌ ERROR - ${error.message}`);
    }
  }
  
  return results;
}

async function testCompleteAuthFlow(brand) {
  console.log(`\n🚀 Testing Complete Auth Flow: ${brand.toUpperCase()}`);
  console.log('='.repeat(50));
  
  const domain = DOMAINS[brand];
  const credentials = TEST_CREDENTIALS[brand];
  const results = {
    login: { success: false },
    authMe: { success: false },
    onboarding: { success: false },
    tokenExtraction: { success: false },
    authorization: { success: false }
  };
  
  try {
    // Step 1: Test BFF Route Existence
    console.log('1️⃣ Testing BFF Route Existence...');
    const routeResults = await validateBFFRouteExistence(domain);
    results.bffRoutes = routeResults;
    
    const authMeExists = routeResults['/api/auth/me']?.exists;
    const onboardingExists = routeResults['/api/onboarding']?.exists;
    
    if (!authMeExists || !onboardingExists) {
      console.log('❌ CRITICAL: BFF routes not deployed');
      return results;
    }
    
    // Step 2: Login
    console.log('2️⃣ Testing Login...');
    const loginResponse = await makeRequest(`https://${domain}/api/auth/login`, {
      method: 'POST',
      body: credentials
    });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      console.log(`   ❌ Login Failed:`, loginResponse.data);
      results.login.error = loginResponse.data;
      return results;
    }
    
    const cookies = extractCookies(loginResponse.cookies);
    console.log(`   ✅ Login Success - Cookies: ${Object.keys(cookies).join(', ')}`);
    
    results.login.success = true;
    results.login.cookies = cookies;
    
    if (!cookies.accessToken) {
      console.log('   ❌ No accessToken cookie received');
      results.tokenExtraction.error = 'No accessToken cookie';
      return results;
    }
    
    results.tokenExtraction.success = true;
    
    // Step 3: Test /api/auth/me
    console.log('3️⃣ Testing /api/auth/me...');
    const meResponse = await makeRequest(`https://${domain}/api/auth/me`, {
      headers: {
        'Cookie': formatCookies(cookies)
      }
    });
    
    console.log(`   /api/auth/me Status: ${meResponse.status}`);
    
    if (meResponse.status === 200) {
      console.log(`   ✅ Auth/Me Success:`, {
        email: meResponse.data.user?.email,
        id: meResponse.data.user?.id,
        brand: meResponse.data.user?.brand
      });
      results.authMe.success = true;
      results.authMe.user = meResponse.data.user;
      
      // Verify authorization (user gets their own data)
      if (meResponse.data.user?.email === credentials.email) {
        results.authorization.success = true;
        console.log('   ✅ Authorization: User gets own data');
      } else {
        console.log('   ❌ Authorization: Data mismatch');
        results.authorization.error = 'User data mismatch';
      }
    } else {
      console.log(`   ❌ Auth/Me Failed:`, meResponse.data);
      results.authMe.error = meResponse.data;
      return results;
    }
    
    // Step 4: Test /api/onboarding
    console.log('4️⃣ Testing /api/onboarding...');
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
      console.log(`   ✅ Onboarding Success`);
      results.onboarding.success = true;
    } else {
      console.log(`   ⚠️ Onboarding Response:`, onboardingResponse.data);
      results.onboarding.error = onboardingResponse.data;
    }
    
    // Step 5: Test without cookies (should fail)
    console.log('5️⃣ Testing Authorization (no cookies)...');
    const unauthorizedResponse = await makeRequest(`https://${domain}/api/auth/me`);
    
    if (unauthorizedResponse.status === 401) {
      console.log('   ✅ Unauthorized access properly blocked');
      results.authorization.unauthorizedBlocked = true;
    } else {
      console.log('   ❌ Unauthorized access not blocked');
      results.authorization.unauthorizedBlocked = false;
    }
    
    return results;
    
  } catch (error) {
    console.log(`❌ ${brand.toUpperCase()} flow failed:`, error.message);
    results.error = error.message;
    return results;
  }
}

async function main() {
  console.log('🚨 MASTER VALIDATION: DEPLOYMENT + AUTH + INFRA');
  console.log('='.repeat(60));
  
  const rthResults = await testCompleteAuthFlow('rth');
  const skillupResults = await testCompleteAuthFlow('skillup');
  
  console.log('\n📊 FINAL VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  // Authentication Status
  const rthAuthWorking = rthResults.login?.success && rthResults.authMe?.success;
  const skillupAuthWorking = skillupResults.login?.success && skillupResults.authMe?.success;
  const authStatus = rthAuthWorking && skillupAuthWorking ? '✅ WORKING' : '❌ BROKEN';
  
  console.log(`✅ Authentication Status: ${authStatus}`);
  console.log(`   RTH: ${rthAuthWorking ? '✅' : '❌'} | SkillUp: ${skillupAuthWorking ? '✅' : '❌'}`);
  
  // Authorization Status
  const rthAuthzSecure = rthResults.authorization?.success && rthResults.authorization?.unauthorizedBlocked;
  const skillupAuthzSecure = skillupResults.authorization?.success && skillupResults.authorization?.unauthorizedBlocked;
  const authzStatus = rthAuthzSecure && skillupAuthzSecure ? '✅ SECURE' : '❌ VULNERABLE';
  
  console.log(`🛡️ Authorization Status: ${authzStatus}`);
  console.log(`   RTH: ${rthAuthzSecure ? '✅' : '❌'} | SkillUp: ${skillupAuthzSecure ? '✅' : '❌'}`);
  
  // BFF Deployment Status
  const rthBFFDeployed = rthResults.bffRoutes?.['/api/auth/me']?.exists && rthResults.bffRoutes?.['/api/onboarding']?.exists;
  const skillupBFFDeployed = skillupResults.bffRoutes?.['/api/auth/me']?.exists && skillupResults.bffRoutes?.['/api/onboarding']?.exists;
  const deploymentStatus = rthBFFDeployed && skillupBFFDeployed ? '✅ CORRECT' : '❌ WRONG BRANCH/REVISION';
  
  console.log(`🚀 Deployment Status: ${deploymentStatus}`);
  console.log(`   RTH BFF: ${rthBFFDeployed ? '✅' : '❌'} | SkillUp BFF: ${skillupBFFDeployed ? '✅' : '❌'}`);
  
  // Root Cause Analysis
  console.log('\n⚠️ ROOT CAUSE ANALYSIS:');
  
  if (!rthBFFDeployed || !skillupBFFDeployed) {
    console.log('   🔍 BFF routes not deployed - deployment pipeline issue');
  }
  
  if (!rthAuthWorking || !skillupAuthWorking) {
    if (rthResults.tokenExtraction?.success === false || skillupResults.tokenExtraction?.success === false) {
      console.log('   🔍 Token extraction bug - TokenService not reading cookies');
    } else {
      console.log('   🔍 Authentication failure - credential or database issue');
    }
  }
  
  // Final Verdict
  console.log('\n🏁 FINAL VERDICT:');
  
  if (authStatus.includes('✅') && authzStatus.includes('✅') && deploymentStatus.includes('✅')) {
    console.log('✅ FULLY PRODUCTION READY');
  } else if (deploymentStatus.includes('✅') && (authStatus.includes('❌') || authzStatus.includes('❌'))) {
    console.log('⚠️ PARTIALLY WORKING - Auth issues need fixing');
  } else {
    console.log('❌ BROKEN SYSTEM - Critical deployment or auth failures');
  }
  
  return {
    rth: rthResults,
    skillup: skillupResults,
    summary: {
      authentication: authStatus,
      authorization: authzStatus,
      deployment: deploymentStatus
    }
  };
}

main().catch(console.error);