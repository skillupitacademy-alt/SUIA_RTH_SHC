const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testDirectCloudRun() {
  const examServiceUrl = process.env.EXAM_SERVICE_URL;
  
  if (!examServiceUrl) {
    console.error('❌ EXAM_SERVICE_URL not found in environment variables');
    return;
  }
  
  console.log('🔍 Testing login directly against Cloud Run service...');
  console.log(`📍 Service URL: ${examServiceUrl}`);
  
  try {
    // Test 1: Health check
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${examServiceUrl}/api/health/live`);
    console.log(`Health Status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthText = await healthResponse.text();
      console.log(`Health Response: ${healthText}`);
    }
    
    // Test 2: Direct login to Cloud Run service
    console.log('\n🔐 Testing login directly to Cloud Run service...');
    
    const loginData = {
      email: 'ajayshah@gmail.com',
      password: 'testing',
      platform: 'realtutorialhub'
    };
    
    console.log('📤 Request data:', JSON.stringify(loginData, null, 2));
    
    const loginResponse = await fetch(`${examServiceUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(loginData)
    });

    console.log(`\n📥 Login Status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    // Show response headers
    console.log('📥 Response Headers:');
    for (const [key, value] of loginResponse.headers.entries()) {
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('error') || key.toLowerCase().includes('auth')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    const loginResponseText = await loginResponse.text();
    console.log('📥 Response Body:', loginResponseText);
    
    if (loginResponse.ok) {
      console.log('\n✅ Direct Cloud Run login successful!');
      console.log('🎉 The issue is with the API Gateway, not the service itself');
      
      try {
        const jsonResponse = JSON.parse(loginResponseText);
        if (jsonResponse.data && jsonResponse.data.user) {
          console.log('👤 User info:', JSON.stringify(jsonResponse.data.user, null, 2));
        }
      } catch (e) {
        console.log('⚠️ Response is not valid JSON');
      }
    } else {
      console.log('\n❌ Direct Cloud Run login failed');
      console.log('🔍 The issue is with the Cloud Run service itself');
      
      try {
        const errorResponse = JSON.parse(loginResponseText);
        console.log('Error details:', JSON.stringify(errorResponse, null, 2));
      } catch (e) {
        console.log('⚠️ Error response is not valid JSON');
      }
    }
    
    // Test 3: Test with the new test user
    console.log('\n🧪 Testing with test user...');
    
    const testLoginData = {
      email: 'test.debug@realtutorialhub.com',
      password: 'testing123',
      platform: 'realtutorialhub'
    };
    
    const testLoginResponse = await fetch(`${examServiceUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLoginData)
    });
    
    console.log(`Test user status: ${testLoginResponse.status} ${testLoginResponse.statusText}`);
    
    if (testLoginResponse.ok) {
      console.log('✅ Test user login works on Cloud Run');
    } else {
      const testResponseText = await testLoginResponse.text();
      console.log(`❌ Test user login failed: ${testResponseText}`);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('🔍 Full error:', error);
  }
}

testDirectCloudRun();