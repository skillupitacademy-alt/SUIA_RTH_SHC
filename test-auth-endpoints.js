const credentials = {
  rth: { email: 'ajayshah@gmail.com', password: 'testing' },
  skillup: { email: 'student@skillupitacademy.com', password: 'testing' }
};

async function testAuth(brand, creds) {
  console.log(`\n=== Testing ${brand.toUpperCase()} Authentication ===`);
  
  const apiUrl = brand === 'rth' 
    ? 'https://user.realtutorialhub.com/api/auth/login'
    : 'https://user.skillupitacademy.com/api/auth/login';
    
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AuthDebug/1.0'
      },
      body: JSON.stringify({
        email: creds.email,
        password: creds.password,
        platform: brand === 'rth' ? 'realtutorialhub' : 'skillup'
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.ok) {
      console.log('✅ Authentication successful');
    } else {
      console.log('❌ Authentication failed');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function main() {
  await testAuth('rth', credentials.rth);
  await testAuth('skillup', credentials.skillup);
}

main().catch(console.error);