const fetch = require('node-fetch');

async function testProductionLoginDetailed() {
  try {
    console.log('🔍 Testing production RTH login with detailed debugging...');
    
    const loginData = {
      email: 'ajayshah@gmail.com',
      password: 'testing',
      platform: 'realtutorialhub'
    };
    
    console.log('📤 Request data:', JSON.stringify(loginData, null, 2));
    
    const response = await fetch('https://user.realtutorialhub.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://user.realtutorialhub.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(loginData)
    });

    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
    console.log('📥 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    const responseText = await response.text();
    console.log('\n📥 Response Body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ Login successful!');
      
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.data && jsonResponse.data.user) {
          console.log('👤 User info:', JSON.stringify(jsonResponse.data.user, null, 2));
        }
      } catch (e) {
        console.log('⚠️ Response is not valid JSON');
      }
    } else {
      console.log('\n❌ Login failed');
      
      // Try to parse error response
      try {
        const errorResponse = JSON.parse(responseText);
        console.log('🔍 Error details:', JSON.stringify(errorResponse, null, 2));
      } catch (e) {
        console.log('⚠️ Error response is not valid JSON');
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('🔍 Full error:', error);
  }
}

// Also test with different platform values
async function testDifferentPlatforms() {
  const platforms = ['realtutorialhub', 'rth', undefined];
  
  for (const platform of platforms) {
    console.log(`\n🧪 Testing with platform: ${platform || 'undefined'}`);
    
    const loginData = {
      email: 'ajayshah@gmail.com',
      password: 'testing'
    };
    
    if (platform) {
      loginData.platform = platform;
    }
    
    try {
      const response = await fetch('https://user.realtutorialhub.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://user.realtutorialhub.com'
        },
        body: JSON.stringify(loginData)
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('   ✅ Success!');
        break; // Stop testing if we find a working combination
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function runTests() {
  await testProductionLoginDetailed();
  await testDifferentPlatforms();
}

runTests();