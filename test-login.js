const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🔍 Testing RTH login...');
    
    const response = await fetch('https://api.realtutorialhub.com/api/auth/login', {
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
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testLogin();