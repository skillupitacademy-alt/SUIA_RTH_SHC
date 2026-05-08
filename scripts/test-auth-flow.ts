#!/usr/bin/env tsx

/**
 * Test Authentication Flow
 * 
 * Simulates the complete flow:
 * 1. Login to get cookie
 * 2. Access the page
 * 3. Call the API
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testAuthFlow() {
  console.log('\n🔐 Testing Complete Authentication Flow\n');
  console.log('='.repeat(64));
  
  const baseUrl = 'https://user.realtutorialhub.com';
  const email = 'ajayshah@gmail.com';
  const password = 'testing';
  
  console.log('\n1️⃣  Step 1: Login\n');
  console.log(`   Email: ${email}`);
  console.log(`   URL: ${baseUrl}/api/auth/login`);
  
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        platform: 'realtutorialhub',
      }),
    });
    
    console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.log(`   ❌ Login failed: ${error}`);
      return;
    }
    
    // Extract cookie
    const setCookie = loginResponse.headers.get('set-cookie');
    if (!setCookie) {
      console.log(`   ❌ No cookie returned`);
      return;
    }
    
    const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
    if (!tokenMatch) {
      console.log(`   ❌ No accessToken in cookie`);
      return;
    }
    
    const token = tokenMatch[1];
    console.log(`   ✅ Login successful`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Step 2: Call API with cookie
    console.log('\n2️⃣  Step 2: Call API with Cookie\n');
    
    const apiUrl = `${baseUrl}/api/tutorial/sections/component-architecture`;
    console.log(`   URL: ${apiUrl}`);
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${token}`,
      },
    });
    
    console.log(`   Status: ${apiResponse.status} ${apiResponse.statusText}`);
    
    if (!apiResponse.ok) {
      const error = await apiResponse.json();
      console.log(`   ❌ API call failed: ${JSON.stringify(error)}`);
      
      console.log('\n📋 DIAGNOSIS:\n');
      console.log('The API is returning 401 even with a valid token.');
      console.log('This suggests the middleware is not recognizing the Cookie header.');
      console.log('');
      console.log('In a browser, cookies are sent automatically.');
      console.log('But when testing with fetch, we need to send them manually.');
      console.log('');
      console.log('The issue is that the deployed middleware might be checking');
      console.log('for cookies differently than how we\'re sending them in the test.');
      
      return;
    }
    
    const data = await apiResponse.json();
    console.log(`   ✅ API call successful!`);
    console.log(`   Subtopic: ${data.subtopicName}`);
    console.log(`   Sections: ${data.totalSections}`);
    console.log(`   Available: ${Object.keys(data.sections || {}).join(', ')}`);
    
    console.log('\n' + '='.repeat(64));
    console.log('✅ AUTHENTICATION FLOW WORKS!\n');
    
  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }
}

testAuthFlow();
