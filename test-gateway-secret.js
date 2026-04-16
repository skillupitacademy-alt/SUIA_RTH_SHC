const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testGatewaySecret() {
  const examServiceUrl = process.env.EXAM_SERVICE_URL;
  const gatewaySecret = process.env.INTERNAL_GATEWAY_SECRET;
  
  console.log('🔍 Testing gateway secret validation...');
  console.log(`📍 Service URL: ${examServiceUrl}`);
  console.log(`🔑 Gateway Secret: ${gatewaySecret.substring(0, 10)}...`);
  
  const loginData = {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    platform: 'realtutorialhub'
  };
  
  // Test 1: With correct gateway secret (should work)
  console.log('\n🧪 Test 1: With correct gateway secret');
  try {
    const response1 = await fetch(`${examServiceUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Secret': gatewaySecret
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    if (response1.ok) {
      console.log('   ✅ Success with correct secret');
    } else {
      const errorText = await response1.text();
      console.log(`   ❌ Failed: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }
  
  // Test 2: With wrong gateway secret (should fail with 403)
  console.log('\n🧪 Test 2: With wrong gateway secret');
  try {
    const response2 = await fetch(`${examServiceUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Secret': 'wrong-secret'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   Status: ${response2.status} ${response2.statusText}`);
    if (response2.status === 403) {
      console.log('   ✅ Correctly rejected wrong secret');
    } else {
      const errorText = await response2.text();
      console.log(`   ⚠️ Unexpected response: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }
  
  // Test 3: Without gateway secret (should fail with 403)
  console.log('\n🧪 Test 3: Without gateway secret');
  try {
    const response3 = await fetch(`${examServiceUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   Status: ${response3.status} ${response3.statusText}`);
    if (response3.status === 403) {
      console.log('   ✅ Correctly rejected missing secret');
    } else {
      const errorText = await response3.text();
      console.log(`   ⚠️ Unexpected response: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }
  
  // Test 4: Test through API Gateway (this is what's failing)
  console.log('\n🧪 Test 4: Through API Gateway (current issue)');
  try {
    const response4 = await fetch('https://api.realtutorialhub.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://user.realtutorialhub.com'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   Status: ${response4.status} ${response4.statusText}`);
    const responseText = await response4.text();
    console.log(`   Response: ${responseText.substring(0, 200)}`);
    
    if (response4.ok) {
      console.log('   ✅ API Gateway login works!');
    } else {
      console.log('   ❌ API Gateway login still failing');
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }
}

testGatewaySecret();