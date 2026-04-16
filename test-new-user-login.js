const fetch = require('node-fetch');

async function testNewUserLogin() {
  try {
    console.log('🔍 Testing login with newly created test user...');
    
    const loginData = {
      email: 'test.debug@realtutorialhub.com',
      password: 'testing123',
      platform: 'realtutorialhub'
    };
    
    console.log('📤 Request data:', JSON.stringify(loginData, null, 2));
    
    const response = await fetch('https://user.realtutorialhub.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://user.realtutorialhub.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(loginData)
    });

    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📥 Response Body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ New user login successful!');
      console.log('🎉 This confirms the API server is working correctly');
      
      // Now test the original user again
      console.log('\n🔄 Testing original user (ajayshah@gmail.com) again...');
      
      const originalLoginData = {
        email: 'ajayshah@gmail.com',
        password: 'testing',
        platform: 'realtutorialhub'
      };
      
      const originalResponse = await fetch('https://user.realtutorialhub.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://user.realtutorialhub.com'
        },
        body: JSON.stringify(originalLoginData)
      });
      
      console.log(`Original user status: ${originalResponse.status} ${originalResponse.statusText}`);
      
      const originalResponseText = await originalResponse.text();
      console.log('Original user response:', originalResponseText);
      
      if (originalResponse.ok) {
        console.log('✅ Original user login now works!');
      } else {
        console.log('❌ Original user login still fails');
        console.log('🔍 This suggests there might be a specific issue with ajayshah@gmail.com');
      }
      
    } else {
      console.log('\n❌ New user login failed');
      console.log('🔍 This suggests a broader issue with the API server');
      
      try {
        const errorResponse = JSON.parse(responseText);
        console.log('Error details:', JSON.stringify(errorResponse, null, 2));
      } catch (e) {
        console.log('⚠️ Error response is not valid JSON');
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testNewUserLogin();