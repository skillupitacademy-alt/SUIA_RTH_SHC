#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.tutorial-test') });

const RTH_TEST_TOKEN = process.env.RTH_TEST_TOKEN || '';

async function testLiveAPI() {
  console.log('\n🧪 Testing Live API - Detailed Diagnostics\n');
  console.log('='.repeat(64));
  
  const url = 'https://user.realtutorialhub.com/api/tutorial/sections/component-architecture';
  
  console.log(`\n📍 URL: ${url}`);
  console.log(`🔑 Token: ${RTH_TEST_TOKEN.substring(0, 50)}...`);
  console.log(`🔑 Token Length: ${RTH_TEST_TOKEN.length} chars\n`);
  
  try {
    console.log('📡 Making request...\n');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${RTH_TEST_TOKEN}`,
      },
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
    
    // Get response body
    const text = await response.text();
    console.log(`\n📦 Response Body (${text.length} chars):`);
    console.log(text.substring(0, 1000));
    
    if (text.length > 1000) {
      console.log(`\n... (truncated, total ${text.length} chars)`);
    }
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log('\n📋 Parsed JSON:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500));
    } catch (e) {
      console.log('\n⚠️  Response is not valid JSON');
    }
    
    // Check specific headers
    console.log('\n📋 Important Headers:');
    console.log(`   x-request-id: ${response.headers.get('x-request-id')}`);
    console.log(`   x-user-id: ${response.headers.get('x-user-id')}`);
    console.log(`   x-cloud-trace-context: ${response.headers.get('x-cloud-trace-context')}`);
    
  } catch (error) {
    console.log(`\n❌ Request failed:`);
    console.log(error);
  }
  
  console.log('\n' + '='.repeat(64));
}

testLiveAPI();
