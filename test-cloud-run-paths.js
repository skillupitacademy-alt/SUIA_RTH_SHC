const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testCloudRunPaths() {
  const examServiceUrl = process.env.EXAM_SERVICE_URL;
  
  console.log('🔍 Testing Cloud Run service paths...');
  console.log(`📍 Service URL: ${examServiceUrl}`);
  
  const testPaths = [
    '/api/health/live',
    '/health/live',
    '/api/auth/login',
    '/auth/login'
  ];
  
  for (const path of testPaths) {
    try {
      console.log(`\n🧪 Testing: ${path}`);
      
      const response = await fetch(`${examServiceUrl}${path}`, {
        method: path.includes('/login') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Secret': process.env.INTERNAL_GATEWAY_SECRET
        },
        body: path.includes('/login') ? JSON.stringify({
          email: 'ajayshah@gmail.com',
          password: 'testing',
          platform: 'realtutorialhub'
        }) : undefined
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      } else if (response.status === 404) {
        console.log(`   ❌ Path not found`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
}

testCloudRunPaths();