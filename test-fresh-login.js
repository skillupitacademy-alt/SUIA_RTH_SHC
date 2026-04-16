const fetch = require('node-fetch');

async function testFreshLogin() {
  try {
    console.log('🔍 Testing fresh test user login...');
    
    const response = await fetch('https://user.realtutorialhub.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.login@realtutorialhub.com',
        password: 'testing123',
        platform: 'realtutorialhub'
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.ok) {
      console.log('✅ Fresh user login successful!');
      
      // Now test the original user
      console.log('\n🔍 Testing original user (ajayshah@gmail.com)...');
      
      const originalResponse = await fetch('https://user.realtutorialhub.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ajayshah@gmail.com',
          password: 'testing',
          platform: 'realtutorialhub'
        })
      });

      console.log(`Original user status: ${originalResponse.status} ${originalResponse.statusText}`);
      
      const originalResponseText = await originalResponse.text();
      console.log('Original user response:', originalResponseText);
      
    } else {
      console.log('❌ Fresh user login failed - there might be a system issue');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testFreshLogin();