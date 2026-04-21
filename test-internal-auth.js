#!/usr/bin/env node

/**
 * Test Internal Service-to-Service Authentication
 * 
 * Tests the new internal authentication layer for profile API
 */

const API_SERVER_URL = 'https://quiz-api-server-581488566988.asia-southeast1.run.app';
const RTH_WEB_URL = 'https://realtutorialhub-web-581488566988.asia-southeast1.run.app';
const SKILLUP_WEB_URL = 'https://skillup-web-581488566988.asia-southeast1.run.app';

// Test credentials
const TEST_USERS = {
  rth: {
    email: 'ajayshah@gmail.com',
    password: 'Test@123',
    brand: 'realtutorialhub'
  },
  skillup: {
    email: 'student@skillupitacademy.com', 
    password: 'Test@123',
    brand: 'skillup'
  }
};

async function testInternalAuth() {
  console.log('🔐 Testing Internal Service-to-Service Authentication\n');
  
  // Test 1: Direct API access should be blocked
  console.log('📋 Test 1: Direct API Access (should be blocked)');
  try {
    const response = await fetch(`${API_SERVER_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ PASS: Direct API access blocked (' + response.status + ')');
    } else {
      console.log('❌ FAIL: Direct API access allowed (' + response.status + ')');
    }
  } catch (error) {
    console.log('❌ ERROR: Direct API test failed:', error.message);
  }
  
  console.log('');
  
  // Test 2: RTH Profile via BFF (should use internal auth)
  console.log('📋 Test 2: RTH Profile via BFF (internal auth)');
  await testBrandProfile('RTH', TEST_USERS.rth, RTH_WEB_URL);
  
  console.log('');
  
  // Test 3: SkillUp Profile via BFF (should use internal auth)  
  console.log('📋 Test 3: SkillUp Profile via BFF (internal auth)');
  await testBrandProfile('SkillUp', TEST_USERS.skillup, SKILLUP_WEB_URL);
}

async function testBrandProfile(brandName, user, webUrl) {
  const perfStart = Date.now();
  
  try {
    // Step 1: Login
    console.log(`  🔑 Logging in to ${brandName}...`);
    const loginStart = Date.now();
    
    const loginResponse = await fetch(`${webUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    });

    const loginDuration = Date.now() - loginStart;
    
    if (!loginResponse.ok) {
      const loginError = await loginResponse.text();
      console.log(`  ❌ Login failed (${loginResponse.status}):`, loginError);
      return;
    }

    const loginData = await loginResponse.json();
    console.log(`  ✅ Login successful: ${loginDuration}ms`);
    
    // Extract cookies
    const cookies = loginResponse.headers.get('set-cookie') || '';
    
    // Step 2: Test Profile API (should use internal auth)
    console.log(`  📊 Testing Profile API...`);
    const profileStart = Date.now();
    
    const profileResponse = await fetch(`${webUrl}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
    });

    const profileDuration = Date.now() - profileStart;
    const totalDuration = Date.now() - perfStart;
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log(`  ✅ Profile API successful: ${profileDuration}ms`);
      console.log(`  📈 Total time: ${totalDuration}ms`);
      
      // Check for internal auth indicators in response headers
      const correlationId = profileResponse.headers.get('x-correlation-id');
      if (correlationId) {
        console.log(`  🔗 Correlation ID: ${correlationId}`);
      }
      
      // Performance analysis
      if (profileDuration < 600) {
        console.log(`  🚀 EXCELLENT: Profile under 600ms target!`);
      } else if (profileDuration < 800) {
        console.log(`  ⚡ GOOD: Profile under 800ms (acceptable)`);
      } else {
        console.log(`  ⚠️  SLOW: Profile over 800ms (needs optimization)`);
      }
      
    } else {
      const profileError = await profileResponse.text();
      console.log(`  ❌ Profile API failed (${profileResponse.status}):`, profileError);
    }
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${brandName} test failed:`, error.message);
  }
}

// Test 4: Check API Server logs for internal auth usage
async function checkInternalAuthLogs() {
  console.log('\n📋 Test 4: Checking for Internal Auth Usage');
  console.log('  ℹ️  Check Cloud Run logs for:');
  console.log('     - [AUTH] Internal service authentication');
  console.log('     - [PERF][AUTH][INTERNAL] optimization logs');
  console.log('     - x-correlation-id in request traces');
  console.log('');
  console.log('  🔍 Commands to check logs:');
  console.log('     gcloud run services logs read quiz-api-server --region asia-southeast1 --limit 50 | grep "Internal service"');
  console.log('     gcloud run services logs read realtutorialhub-web --region asia-southeast1 --limit 50 | grep "PROFILE_INTERNAL"');
  console.log('     gcloud run services logs read skillup-web --region asia-southeast1 --limit 50 | grep "PROFILE_INTERNAL"');
}

// Run tests
testInternalAuth()
  .then(() => checkInternalAuthLogs())
  .then(() => {
    console.log('\n🎉 Internal Authentication Tests Complete!');
    console.log('\n📊 Expected Results:');
    console.log('  ✅ Direct API access blocked (401/403)');
    console.log('  ✅ BFF → API calls use internal authentication');
    console.log('  ✅ Profile API < 600ms (target achieved)');
    console.log('  ✅ Correlation IDs present in logs');
    console.log('  ✅ No duplicate /auth/me calls');
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });