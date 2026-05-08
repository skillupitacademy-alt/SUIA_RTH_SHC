#!/usr/bin/env node

/**
 * Test Tutorial Sections API Endpoint
 * 
 * Tests the new /api/tutorial/sections/:subtopicId endpoint
 * with proper authentication
 */

import fetch from 'node-fetch';

const RTH_BASE_URL = 'https://user.realtutorialhub.com';
const SKILLUP_BASE_URL = 'https://user.skillup.study';

// Test credentials
const RTH_USER = {
  email: 'ajayshah@gmail.com',
  password: 'testing'
};

const SKILLUP_USER = {
  email: 'ajayshah@gmail.com',
  password: 'testing'
};

/**
 * Login and get access token
 */
async function login(baseUrl, credentials) {
  console.log(`\n🔐 Logging in to ${baseUrl}...`);
  
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} ${error}`);
  }
  
  // Get token from Set-Cookie header
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No cookie in login response');
  }
  
  const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
  if (!tokenMatch) {
    throw new Error('No accessToken in cookie');
  }
  
  const token = tokenMatch[1];
  console.log(`✅ Login successful`);
  console.log(`   Token: ${token.substring(0, 20)}...`);
  
  return token;
}

/**
 * Test tutorial sections endpoint
 */
async function testSectionsEndpoint(baseUrl, token, subtopicId) {
  console.log(`\n📚 Testing /api/tutorial/sections/${subtopicId}...`);
  
  const url = `${baseUrl}/api/tutorial/sections/${subtopicId}`;
  console.log(`   URL: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': `accessToken=${token}`,
    },
  });
  
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Error: ${error}`);
    return false;
  }
  
  const data = await response.json();
  console.log(`   ✅ Success!`);
  console.log(`   Subtopic: ${data.subtopicName || data.subtopicId}`);
  console.log(`   Difficulty: ${data.difficulty}`);
  console.log(`   Total Sections: ${data.totalSections}`);
  console.log(`   Available Sections: ${Object.keys(data.sections || {}).join(', ')}`);
  
  return true;
}

/**
 * Test specific section type
 */
async function testSpecificSection(baseUrl, token, subtopicId, sectionType) {
  console.log(`\n📄 Testing specific section: ${sectionType}...`);
  
  const url = `${baseUrl}/api/tutorial/sections/${subtopicId}?sectionType=${sectionType}`;
  console.log(`   URL: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': `accessToken=${token}`,
    },
  });
  
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Error: ${error}`);
    return false;
  }
  
  const data = await response.json();
  console.log(`   ✅ Success!`);
  console.log(`   Section Type: ${data.sectionType}`);
  console.log(`   Difficulty: ${data.difficulty}`);
  console.log(`   Content Length: ${JSON.stringify(data.content).length} chars`);
  
  return true;
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Tutorial Sections API Test');
  console.log('================================\n');
  
  const subtopicId = 'component-architecture';
  
  try {
    // Test RealTutorialHub
    console.log('\n🎯 Testing RealTutorialHub');
    console.log('---------------------------');
    const rthToken = await login(RTH_BASE_URL, RTH_USER);
    await testSectionsEndpoint(RTH_BASE_URL, rthToken, subtopicId);
    await testSpecificSection(RTH_BASE_URL, rthToken, subtopicId, 'notes');
    
    // Test SkillUp
    console.log('\n\n🎯 Testing SkillUp');
    console.log('------------------');
    const skillupToken = await login(SKILLUP_BASE_URL, SKILLUP_USER);
    await testSectionsEndpoint(SKILLUP_BASE_URL, skillupToken, subtopicId);
    await testSpecificSection(SKILLUP_BASE_URL, skillupToken, subtopicId, 'notes');
    
    console.log('\n\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
