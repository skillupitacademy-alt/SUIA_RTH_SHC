#!/usr/bin/env node

/**
 * Diagnose Tutorial Authentication Flow
 * 
 * Tests each layer to find where the 401 is coming from
 */

import fetch from 'node-fetch';

const RTH_BASE_URL = 'https://user.realtutorialhub.com';
const RTH_USER = {
  email: 'ajayshah@gmail.com',
  password: 'testing'
};

async function main() {
  console.log('🔍 Diagnosing Tutorial Authentication Flow');
  console.log('═'.repeat(80));
  
  try {
    // Step 1: Login
    console.log('\n🔐 Step 1: Login');
    const loginResponse = await fetch(`${RTH_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(RTH_USER),
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      process.exit(1);
    }
    
    const setCookie = loginResponse.headers.get('set-cookie');
    const tokenMatch = setCookie?.match(/accessToken=([^;]+)/);
    const accessToken = tokenMatch?.[1];
    
    console.log('✅ Login successful');
    console.log(`   Token (first 30 chars): ${accessToken?.substring(0, 30)}...`);
    
    // Step 2: Test /api/auth/me (known working endpoint)
    console.log('\n📋 Step 2: Test /api/auth/me (control - should work)');
    const meResponse = await fetch(`${RTH_BASE_URL}/api/auth/me`, {
      headers: { 'Cookie': `accessToken=${accessToken}` },
    });
    
    console.log(`   Status: ${meResponse.status}`);
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log(`   ✅ Working - User: ${meData.user?.email}`);
    } else {
      console.log(`   ❌ Failed - Token might be invalid`);
    }
    
    // Step 3: Test /api/tutorial/sections (failing endpoint)
    console.log('\n📑 Step 3: Test /api/tutorial/sections/component-architecture');
    const tutorialResponse = await fetch(`${RTH_BASE_URL}/api/tutorial/sections/component-architecture`, {
      headers: { 'Cookie': `accessToken=${accessToken}` },
    });
    
    console.log(`   Status: ${tutorialResponse.status}`);
    
    if (!tutorialResponse.ok) {
      const errorText = await tutorialResponse.text();
      console.log(`   ❌ Failed`);
      console.log(`   Response: ${errorText}`);
      
      // Try to parse error
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`   Error code: ${errorJson.error}`);
        console.log(`   Error message: ${errorJson.message || 'N/A'}`);
      } catch (e) {
        // Not JSON
      }
    } else {
      const data = await tutorialResponse.json();
      console.log(`   ✅ Success!`);
      console.log(`   Subtopic: ${data.subtopicName}`);
      console.log(`   Sections: ${data.totalSections}`);
    }
    
    // Step 4: Analysis
    console.log('\n═'.repeat(80));
    console.log('📊 ANALYSIS');
    console.log('═'.repeat(80));
    
    if (meResponse.ok && !tutorialResponse.ok) {
      console.log('\n🔍 Finding: /api/auth/me works but /api/tutorial/sections fails');
      console.log('\nPossible causes:');
      console.log('   1. BFF route requireStudent() is rejecting the token');
      console.log('   2. API server proxy.ts is still checking x-internal-key');
      console.log('   3. Deployment didn\'t pick up the proxy.ts changes');
      console.log('\n💡 Next steps:');
      console.log('   - Check BFF logs for requireStudent errors');
      console.log('   - Check API server logs for proxy middleware errors');
      console.log('   - Verify proxy.ts has isTutorialRoute in isGatewayExemptRoute');
    } else if (!meResponse.ok) {
      console.log('\n🔍 Finding: Token is invalid or expired');
      console.log('   Both endpoints are failing - token issue');
    } else {
      console.log('\n✅ Both endpoints working!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
