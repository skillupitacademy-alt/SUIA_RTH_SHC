#!/usr/bin/env tsx

/**
 * Test if the API endpoint exists on the server
 */

async function testEndpoint() {
  console.log('\n🧪 Testing if /api/tutorial/sections/component-architecture exists\n');
  
  const url = 'https://user.realtutorialhub.com/api/tutorial/sections/component-architecture';
  
  console.log(`URL: ${url}\n`);
  
  // Test without auth to see what error we get
  console.log('Test 1: Without authentication');
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`Response: ${text.substring(0, 200)}\n`);
  } catch (error) {
    console.log(`Error: ${error}\n`);
  }
  
  // Test with OPTIONS to see if route exists
  console.log('Test 2: OPTIONS request (check if route exists)');
  try {
    const response = await fetch(url, { method: 'OPTIONS' });
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Allow header: ${response.headers.get('allow') || 'not set'}\n`);
  } catch (error) {
    console.log(`Error: ${error}\n`);
  }
}

testEndpoint();
