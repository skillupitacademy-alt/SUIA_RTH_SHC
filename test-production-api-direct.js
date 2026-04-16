#!/usr/bin/env node

/**
 * Test Production API Direct
 * 
 * This script tests the production API directly to understand
 * what's happening with the authentication flow.
 */

const crypto = require('crypto');

// Import fetch for Node.js
let fetch;

async function testProductionAPI() {
  // Ensure fetch is available
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;

  console.log('🔍 Testing Production API Direct Access');
  console.log('='.repeat(60));

  // Test the API health endpoint first
  console.log('\n1. Testing API Health Endpoints:');
  
  const healthTests = [
    {
      name: 'RTH API Health',
      url: 'https://api.realtutorialhub.com/api/health/live'
    },
    {
      name: 'SkillUp API Health', 
      url: 'https://api.skillupitacademy.com/api/health/live'
    }
  ];

  for (const test of healthTests) {
    try {
      const response = await fetch(test.url);
      console.log(`✅ ${test.name}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`   Response: ${data.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }

  // Test authentication with detailed logging
  console.log('\n2. Testing Authentication with Detailed Logging:');
  
  const authTests = [
    {
      name: 'RTH Authentication',
      url: 'https://api.realtutorialhub.com/api/auth/login',
      origin: 'https://user.realtutorialhub.com',
      payload: {
        email: 'ajayshah@gmail.com',
        password: 'testing',
        platform: 'realtutorialhub'
      }
    },
    {
      name: 'SkillUp Authentication',
      url: 'https://api.skillupitacademy.com/api/auth/login',
      origin: 'https://user.skillupitacademy.com',
      payload: {
        email: 'student@skillupitacademy.com',
        password: 'testing',
        platform: 'skillup'
      }
    }
  ];

  for (const test of authTests) {
    console.log(`\n--- ${test.name} ---`);
    
    const correlationId = crypto.randomUUID();
    console.log(`Correlation ID: ${correlationId}`);
    console.log(`URL: ${test.url}`);
    console.log(`Origin: ${test.origin}`);
    console.log(`Payload: ${JSON.stringify(test.payload, null, 2)}`);

    try {
      const response = await fetch(test.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': test.origin,
          'Referer': `${test.origin}/login`,
          'User-Agent': 'ProductionAPITest/1.0',
          'X-Correlation-ID': correlationId,
          'Accept': 'application/json'
        },
        body: JSON.stringify(test.payload)
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      // Log response headers
      console.log('Response Headers:');
      for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase().includes('x-') || key.toLowerCase().includes('set-cookie')) {
          console.log(`  ${key}: ${value}`);
        }
      }

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
        console.log('Response Body:');
        console.log(JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log('Raw Response:');
        console.log(responseText);
      }

      if (response.ok) {
        console.log('✅ Authentication SUCCESS');
      } else {
        console.log('❌ Authentication FAILED');
      }

    } catch (error) {
      console.log(`❌ Request Error: ${error.message}`);
    }
  }

  // Test with a non-existent user to compare behavior
  console.log('\n3. Testing with Non-Existent User (for comparison):');
  
  const nonExistentTest = {
    name: 'RTH Non-Existent User',
    url: 'https://api.realtutorialhub.com/api/auth/login',
    origin: 'https://user.realtutorialhub.com',
    payload: {
      email: 'nonexistent@example.com',
      password: 'testing',
      platform: 'realtutorialhub'
    }
  };

  const correlationId = crypto.randomUUID();
  console.log(`Correlation ID: ${correlationId}`);

  try {
    const response = await fetch(nonExistentTest.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': nonExistentTest.origin,
        'X-Correlation-ID': correlationId,
        'Accept': 'application/json'
      },
      body: JSON.stringify(nonExistentTest.payload)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json().catch(() => ({}));
    console.log('Response:', JSON.stringify(responseData, null, 2));

  } catch (error) {
    console.log(`❌ Request Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 ANALYSIS:');
  console.log('If all tests return the same 401 "Invalid credentials" response,');
  console.log('this suggests the production environment is not connecting to');
  console.log('the same databases where our test users exist.');
  console.log('='.repeat(60));
}

// Run the test
testProductionAPI().catch(console.error);