// Test connection to admin.skillhub.core.in

const BASE_URL = 'https://admin.skillhubcore.in';

console.log(`Testing connection to: ${BASE_URL}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

async function testConnection() {
  try {
    console.log('Attempting to fetch /api/auth/login...');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@skillhubcore.in',
        password: 'testing'
      }),
    });
    
    console.log(`✅ Connected! Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      const error = await response.text();
      console.log(`❌ Login failed: ${error}`);
    }
    
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    console.error('\nPossible causes:');
    console.error('  - Server is down');
    console.error('  - Network/firewall blocking');
    console.error('  - SSL certificate issue');
    console.error('  - DNS resolution problem');
  }
}

testConnection();
