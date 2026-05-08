#!/usr/bin/env node

/**
 * Test RTH Authenticated URLs
 * 
 * Tests all major authenticated routes to verify they work correctly:
 * - Login
 * - Dashboard
 * - Profile
 * - Launch Exam
 * - Tutorial
 * - Tutorial Sections (NEW)
 */

import fetch from 'node-fetch';

const RTH_BASE_URL = 'https://user.realtutorialhub.com';
const RTH_USER = {
  email: 'ajayshah@gmail.com',
  password: 'testing'
};

let accessToken = null;

async function login() {
  console.log('\n🔐 Step 1: Login');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(RTH_USER),
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/api/auth/login`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Login failed: ${error}`);
    return false;
  }
  
  const setCookie = response.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/accessToken=([^;]+)/);
  accessToken = tokenMatch?.[1];
  
  if (!accessToken) {
    console.log(`   ❌ No access token in response`);
    return false;
  }
  
  console.log(`   ✅ Login successful`);
  console.log(`   Token: ${accessToken.substring(0, 20)}...`);
  return true;
}

async function testAuthMe() {
  console.log('\n📋 Step 2: Test /api/auth/me');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/api/auth/me`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`,
    },
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/api/auth/me`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Failed: ${error}`);
    return false;
  }
  
  const data = await response.json();
  console.log(`   ✅ Success`);
  console.log(`   User: ${data.user?.email}`);
  console.log(`   Onboarded: ${data.user?.onboardingCompleted}`);
  return true;
}

async function testDashboard() {
  console.log('\n🏠 Step 3: Test /dashboard');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/dashboard`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`,
    },
    redirect: 'manual',
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/dashboard`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (response.status === 302 || response.status === 307) {
    const location = response.headers.get('location');
    console.log(`   ⚠️  Redirect to: ${location}`);
    return location?.includes('/login') ? false : true;
  }
  
  if (!response.ok) {
    console.log(`   ❌ Failed`);
    return false;
  }
  
  console.log(`   ✅ Success`);
  return true;
}

async function testProfile() {
  console.log('\n👤 Step 4: Test /api/profile');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/api/profile`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`,
    },
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/api/profile`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Failed: ${error}`);
    return false;
  }
  
  const data = await response.json();
  console.log(`   ✅ Success`);
  console.log(`   Name: ${data.data?.firstName} ${data.data?.lastName}`);
  return true;
}

async function testTutorial() {
  console.log('\n📚 Step 5: Test /tutorial');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/tutorial`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`,
    },
    redirect: 'manual',
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/tutorial`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (response.status === 302 || response.status === 307) {
    const location = response.headers.get('location');
    console.log(`   ⚠️  Redirect to: ${location}`);
    return location?.includes('/login') ? false : true;
  }
  
  if (!response.ok) {
    console.log(`   ❌ Failed`);
    return false;
  }
  
  console.log(`   ✅ Success`);
  return true;
}

async function testTutorialContent() {
  console.log('\n📖 Step 6: Test /api/tutorial/content/component-architecture');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/api/tutorial/content/component-architecture`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`,
    },
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/api/tutorial/content/component-architecture`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Failed: ${error}`);
    return false;
  }
  
  const data = await response.json();
  console.log(`   ✅ Success`);
  console.log(`   Has data: ${!!data.data}`);
  return true;
}

async function testTutorialSections() {
  console.log('\n📑 Step 7: Test /api/tutorial/sections/component-architecture (NEW)');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/api/tutorial/sections/component-architecture`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`,
    },
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/api/tutorial/sections/component-architecture`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Failed: ${error}`);
    return false;
  }
  
  const data = await response.json();
  console.log(`   ✅ Success`);
  console.log(`   Subtopic: ${data.subtopicName || data.subtopicId}`);
  console.log(`   Total Sections: ${data.totalSections}`);
  console.log(`   Available: ${Object.keys(data.sections || {}).join(', ')}`);
  return true;
}

async function testSubtopicPage() {
  console.log('\n📄 Step 8: Test /start-learning/subtopic/component-architecture');
  console.log('─'.repeat(80));
  
  const response = await fetch(`${RTH_BASE_URL}/start-learning/subtopic/component-architecture`, {
    headers: {
      'Cookie': `accessToken=${accessToken}`,
    },
    redirect: 'manual',
  });
  
  console.log(`   URL: ${RTH_BASE_URL}/start-learning/subtopic/component-architecture`);
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (response.status === 302 || response.status === 307) {
    const location = response.headers.get('location');
    console.log(`   ⚠️  Redirect to: ${location}`);
    return location?.includes('/login') ? false : true;
  }
  
  if (!response.ok) {
    console.log(`   ❌ Failed`);
    return false;
  }
  
  console.log(`   ✅ Success`);
  return true;
}

async function main() {
  console.log('🧪 RTH Authenticated URLs Test');
  console.log('═'.repeat(80));
  
  const results = {
    login: false,
    authMe: false,
    dashboard: false,
    profile: false,
    tutorial: false,
    tutorialContent: false,
    tutorialSections: false,
    subtopicPage: false,
  };
  
  try {
    // Step 1: Login
    results.login = await login();
    if (!results.login) {
      console.log('\n❌ Login failed. Cannot proceed with other tests.');
      process.exit(1);
    }
    
    // Step 2: Test /api/auth/me
    results.authMe = await testAuthMe();
    
    // Step 3: Test /dashboard
    results.dashboard = await testDashboard();
    
    // Step 4: Test /api/profile
    results.profile = await testProfile();
    
    // Step 5: Test /tutorial
    results.tutorial = await testTutorial();
    
    // Step 6: Test /api/tutorial/content
    results.tutorialContent = await testTutorialContent();
    
    // Step 7: Test /api/tutorial/sections (NEW)
    results.tutorialSections = await testTutorialSections();
    
    // Step 8: Test /start-learning/subtopic page
    results.subtopicPage = await testSubtopicPage();
    
    // Summary
    console.log('\n═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    
    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r).length;
    const failed = total - passed;
    
    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${Math.round(passed/total*100)}%`);
    
    console.log('\nDetailed Results:');
    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`  ${icon} ${test}`);
    });
    
    console.log('\n═'.repeat(80));
    
    if (passed === total) {
      console.log('✅ ALL TESTS PASSED\n');
      process.exit(0);
    } else {
      console.log('⚠️  SOME TESTS FAILED\n');
      console.log('Failed tests:');
      Object.entries(results).forEach(([test, passed]) => {
        if (!passed) {
          console.log(`  - ${test}`);
        }
      });
      console.log('');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

main();
