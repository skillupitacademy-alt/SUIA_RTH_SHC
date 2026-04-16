const fetch = require('node-fetch');

async function testSharedUIAuth() {
  console.log('🔍 Testing shared UI/UX authentication endpoints...');
  
  const loginData = {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    platform: 'realtutorialhub'
  };
  
  const testEndpoints = [
    {
      name: 'Direct API Domain (api.realtutorialhub.com)',
      url: 'https://api.realtutorialhub.com/api/auth/login',
      description: 'Direct API calls from frontend'
    },
    {
      name: 'User Domain API (user.realtutorialhub.com)',
      url: 'https://user.realtutorialhub.com/api/auth/login',
      description: 'API calls through user domain (shared UI/UX)'
    },
    {
      name: 'SkillUp User Domain API (user.skillupitacademy.com)',
      url: 'https://user.skillupitacademy.com/api/auth/login',
      description: 'API calls through SkillUp user domain (shared UI/UX)'
    }
  ];
  
  for (const endpoint of testEndpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Purpose: ${endpoint.description}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': endpoint.url.includes('skillup') ? 'https://user.skillupitacademy.com' : 'https://user.realtutorialhub.com'
        },
        body: JSON.stringify(loginData)
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('   ✅ SUCCESS - Authentication working');
        
        const responseText = await response.text();
        try {
          const jsonResponse = JSON.parse(responseText);
          if (jsonResponse.user && jsonResponse.accessToken) {
            console.log(`   👤 User: ${jsonResponse.user.email}`);
            console.log(`   🎫 Token: ${jsonResponse.accessToken.substring(0, 20)}...`);
          }
        } catch (e) {
          console.log('   ⚠️ Response not JSON');
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
  
  // Test UI/UX access
  console.log('\n🎨 Testing UI/UX access...');
  
  const uiEndpoints = [
    'https://user.realtutorialhub.com/',
    'https://user.skillupitacademy.com/'
  ];
  
  for (const uiUrl of uiEndpoints) {
    try {
      const response = await fetch(uiUrl, { method: 'HEAD' });
      console.log(`   ${uiUrl}: ${response.status} ${response.statusText} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ${uiUrl}: ❌ ${error.message}`);
    }
  }
}

testSharedUIAuth();