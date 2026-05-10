import 'dotenv/config';

async function testLogin() {
  console.log('🔐 Testing SkillHub Core Login with Debug Info\n');

  const loginUrl = 'https://api.skillhubcore.in/api/auth/login';
  
  const payload = {
    email: 'admin@skillhubcore.in',
    password: 'testing',
    brand: 'skillhubcore',
  };

  console.log('📤 Request:');
  console.log('  URL:', loginUrl);
  console.log('  Payload:', JSON.stringify(payload, null, 2));
  console.log('  Headers:');
  console.log('    x-brand: skillhubcore');
  console.log('    x-platform: skillhubcore');
  console.log();

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand': 'skillhubcore',
        'x-platform': 'skillhubcore',
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 Response:');
    console.log('  Status:', response.status, response.statusText);
    console.log('  Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`    ${key}: ${value}`);
    }
    console.log();

    const data = await response.json();
    console.log('  Body:', JSON.stringify(data, null, 2));
    console.log();

    if (response.ok) {
      console.log('✅ LOGIN SUCCESSFUL');
      console.log('  Access Token:', data.accessToken?.substring(0, 50) + '...');
      console.log('  User ID:', data.user?.id);
      console.log('  Email:', data.user?.email);
      console.log('  Is Admin:', data.user?.isAdmin);
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('  Error:', data.message || data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testLogin();
