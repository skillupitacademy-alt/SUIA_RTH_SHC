const fetch = require('node-fetch');

async function testLocalLogin() {
  try {
    console.log('🔍 Testing local RTH login...');
    
    // Test against local development server
    const response = await fetch('http://localhost:3000/api/auth/login', {
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

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.ok) {
      console.log('✅ Local login successful!');
      
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.accessToken) {
          console.log('🎉 Access token received - authentication working!');
        }
      } catch (e) {
        // Response might not be JSON
      }
    } else {
      console.log('❌ Local login failed');
      
      if (response.status === 500) {
        console.log('💡 Server error - check if the API server is running');
      } else if (response.status === 404) {
        console.log('💡 Endpoint not found - check if the API server is running on port 3000');
      }
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - API server is not running');
      console.log('💡 Start the API server with: npm run dev');
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

testLocalLogin();