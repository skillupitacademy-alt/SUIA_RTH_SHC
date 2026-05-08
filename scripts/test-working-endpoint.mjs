#!/usr/bin/env node

/**
 * Test the WORKING /api/tutorial/content endpoint
 * to understand authentication flow
 */

import fetch from 'node-fetch';

const RTH_BASE_URL = 'https://user.realtutorialhub.com';
const RTH_USER = {
  email: 'ajayshah@gmail.com',
  password: 'testing'
};

async function login() {
  console.log(`\n🔐 Logging in...`);
  
  const response = await fetch(`${RTH_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(RTH_USER),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const setCookie = response.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/accessToken=([^;]+)/);
  const token = tokenMatch?.[1];
  
  console.log(`✅ Login successful`);
  return token;
}

async function testWorkingEndpoint(token) {
  console.log(`\n📚 Testing WORKING /api/tutorial/content/component-architecture...`);
  
  const url = `${RTH_BASE_URL}/api/tutorial/content/component-architecture`;
  const response = await fetch(url, {
    headers: {
      'Cookie': `accessToken=${token}`,
    },
  });
  
  console.log(`   Status: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`   ✅ SUCCESS!`);
    console.log(`   Has data: ${!!data.data}`);
  } else {
    const error = await response.text();
    console.log(`   ❌ FAILED: ${error}`);
  }
}

async function testNewEndpoint(token) {
  console.log(`\n📚 Testing NEW /api/tutorial/sections/component-architecture...`);
  
  const url = `${RTH_BASE_URL}/api/tutorial/sections/component-architecture`;
  const response = await fetch(url, {
    headers: {
      'Cookie': `accessToken=${token}`,
    },
  });
  
  console.log(`   Status: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`   ✅ SUCCESS!`);
    console.log(`   Has sections: ${!!data.sections}`);
  } else {
    const error = await response.text();
    console.log(`   ❌ FAILED: ${error}`);
  }
}

async function main() {
  try {
    const token = await login();
    await testWorkingEndpoint(token);
    await testNewEndpoint(token);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
