#!/usr/bin/env tsx
/**
 * Test Live Login
 * Tests login against live API to debug authentication issues
 */

async function testLogin() {
  const baseUrl = 'https://api.realtutorialhub.com';
  const credentials = [
    { email: 'admin@realtutorialhub.com', password: 'admin123', platform: 'realtutorialhub' },
    { email: 'admin@quizplatform.com', password: 'admin123', platform: 'realtutorialhub' },
    { email: 'admin@test.com', password: 'admin123', platform: 'realtutorialhub' },
  ];

  console.log('🔐 Testing Live Login Endpoints\n');
  console.log(`Base URL: ${baseUrl}\n`);

  for (const cred of credentials) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${cred.email}`);
    console.log(`${'='.repeat(60)}`);

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

      const text = await response.text();
      console.log(`Response Body:`, text.substring(0, 500));

      if (response.ok) {
        console.log('✅ LOGIN SUCCESSFUL!');
        
        // Check for token in Set-Cookie
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
          if (tokenMatch) {
            console.log(`\n🎫 Token Found: ${tokenMatch[1].substring(0, 50)}...`);
          }
        }
      } else {
        console.log('❌ LOGIN FAILED');
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error}`);
    }
  }
}

testLogin();
