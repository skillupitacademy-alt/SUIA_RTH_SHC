#!/usr/bin/env node

/**
 * ONBOARDING LOOP DEBUG TEST
 * Traces the exact flow to identify where onboarding state is lost
 */

const https = require('https');

const TEST_ACCOUNTS = {
  rth: {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    loginUrl: 'https://user.realtutorialhub.com/api/auth/login',
    onboardingUrl: 'https://user.realtutorialhub.com/api/auth/onboarding',
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
        'User-Agent': 'OnboardingDebugTest/1.0',
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

async function debugOnboardingFlow() {
  console.log('🚨 ONBOARDING LOOP DEBUG TEST');
  console.log('Tracing exact flow to identify state persistence issue');
  console.log('='.repeat(60));

  const account = TEST_ACCOUNTS.rth;

  try {
    // Step 1: Login
    console.log('\n🔑 STEP 1: Login');
    console.log('-'.repeat(30));
    
    const loginResponse = await makeRequest(account.loginUrl, {
      method: 'POST',
      body: JSON.stringify({
        email: account.email,
        password: account.password,
        platform: account.brand
      })
    });

    console.log(`Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed, cannot continue test');
      return;
    }

    const setCookieHeaders = loginResponse.headers['set-cookie'] || [];
    const cookies = setCookieHeaders.join('; ');
    
    console.log('✅ Login successful');
    console.log(`Initial onboarded status: ${loginResponse.data?.user?.onboarded}`);

    // Step 2: Check initial /me state
    console.log('\n📋 STEP 2: Check initial /me state');
    console.log('-'.repeat(30));
    
    const initialMeResponse = await makeRequest(account.meUrl, {
      headers: { 'Cookie': cookies }
    });

    console.log(`/me Status: ${initialMeResponse.status}`);
    console.log(`Initial onboarded: ${initialMeResponse.data?.user?.onboarded}`);
    console.log(`User ID: ${initialMeResponse.data?.user?.id}`);

    // Step 3: Submit onboarding
    console.log('\n📝 STEP 3: Submit onboarding');
    console.log('-'.repeat(30));
    
    const onboardingData = {
      primaryGoal: 'career_change',
      domain: 'technology',
      subDomain: 'web_development',
      timeCommitment: '10_hours_week',
      journeyStatus: 'beginner'
    };

    const onboardingResponse = await makeRequest(account.onboardingUrl, {
      method: 'POST',
      headers: { 'Cookie': cookies },
      body: JSON.stringify(onboardingData)
    });

    console.log(`Onboarding Status: ${onboardingResponse.status}`);
    console.log(`Onboarding Response:`, JSON.stringify(onboardingResponse.data, null, 2));

    if (onboardingResponse.status !== 200) {
      console.log('❌ Onboarding submission failed');
      return;
    }

    console.log('✅ Onboarding submitted successfully');

    // Step 4: Check /me immediately after onboarding
    console.log('\n🔍 STEP 4: Check /me immediately after onboarding');
    console.log('-'.repeat(30));
    
    const postOnboardingMeResponse = await makeRequest(account.meUrl, {
      headers: { 
        'Cookie': cookies,
        'Cache-Control': 'no-cache'
      }
    });

    console.log(`Post-onboarding /me Status: ${postOnboardingMeResponse.status}`);
    console.log(`Post-onboarding onboarded: ${postOnboardingMeResponse.data?.user?.onboarded}`);
    console.log(`Cache-Control header: ${postOnboardingMeResponse.headers['cache-control']}`);

    // Step 5: Wait and check again (simulate page refresh)
    console.log('\n⏳ STEP 5: Wait 2 seconds and check again (simulate refresh)');
    console.log('-'.repeat(30));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const delayedMeResponse = await makeRequest(account.meUrl, {
      headers: { 
        'Cookie': cookies,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log(`Delayed /me Status: ${delayedMeResponse.status}`);
    console.log(`Delayed onboarded: ${delayedMeResponse.data?.user?.onboarded}`);

    // Step 6: Analysis
    console.log('\n📊 STEP 6: Analysis');
    console.log('-'.repeat(30));
    
    const initialOnboarded = initialMeResponse.data?.user?.onboarded;
    const postOnboarded = postOnboardingMeResponse.data?.user?.onboarded;
    const delayedOnboarded = delayedMeResponse.data?.user?.onboarded;

    console.log('Flow Analysis:');
    console.log(`  Initial /me onboarded: ${initialOnboarded}`);
    console.log(`  Post-onboarding /me onboarded: ${postOnboarded}`);
    console.log(`  Delayed /me onboarded: ${delayedOnboarded}`);

    // Identify the issue
    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    console.log('='.repeat(60));

    if (onboardingResponse.status === 200 && postOnboarded === false) {
      console.log('❌ CRITICAL: Onboarding API succeeded but /me still returns onboarded: false');
      console.log('   → DB UPDATE ISSUE: markUserOnboarded() not working');
      console.log('   → OR MAPPING ISSUE: toUserSummaryDTO fallback logic bug');
    } else if (postOnboarded === true && delayedOnboarded === false) {
      console.log('❌ CRITICAL: Onboarding state lost after delay');
      console.log('   → CACHE ISSUE: /me response being cached');
    } else if (postOnboarded === true && delayedOnboarded === true) {
      console.log('✅ BACKEND WORKING: Onboarding state persists correctly');
      console.log('   → FRONTEND ISSUE: Check redirect logic and state management');
    } else {
      console.log('⚠️ COMPLEX ISSUE: Multiple problems detected');
    }

    // Final verdict
    console.log('\n🏁 FINAL DIAGNOSIS:');
    
    const dbUpdate = onboardingResponse.status === 200;
    const meCorrect = postOnboarded === true;
    const persistent = delayedOnboarded === true;

    console.log(`   DB Update: ${dbUpdate ? '✅ working' : '❌ broken'}`);
    console.log(`   /api/auth/me: ${meCorrect ? '✅ correct onboarded value' : '❌ incorrect value'}`);
    console.log(`   Persistence: ${persistent ? '✅ state persists' : '❌ state lost'}`);

    if (dbUpdate && meCorrect && persistent) {
      console.log('\n✅ BACKEND IS WORKING - Issue is in frontend redirect logic');
    } else {
      console.log('\n❌ BACKEND ISSUE DETECTED - Fix required before frontend');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

debugOnboardingFlow().catch(error => {
  console.error('💥 Debug test crashed:', error);
  process.exit(1);
});