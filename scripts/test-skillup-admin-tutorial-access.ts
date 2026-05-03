#!/usr/bin/env tsx
/**
 * Test SkillUp Admin Access to Tutorial DB
 * Tests if SkillUp admin can access tutorial_db APIs
 */

async function testSkillUpAdminAccess() {
  const baseUrl = 'https://api.realtutorialhub.com';
  
  console.log('\n🔐 Testing SkillUp Admin Access to Tutorial DB\n');
  console.log('='.repeat(60));

  // Step 1: Login as SkillUp admin
  console.log('\n📝 Step 1: Login as SkillUp Admin');
  console.log('-'.repeat(60));

  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@skillupitacademy.com',
        password: 'admin123',
        platform: 'skillup',
      }),
    });

    console.log(`Login Status: ${loginResponse.status}`);

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    console.log('✅ Login successful');

    // Extract token
    const setCookie = loginResponse.headers.get('set-cookie');
    let token: string | null = null;

    if (setCookie) {
      const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
        console.log(`🎫 Token: ${token.substring(0, 50)}...`);
      }
    }

    if (!token) {
      console.log('❌ No token found');
      return;
    }

    // Step 2: Test Tutorial DB API access
    console.log('\n📝 Step 2: Test Tutorial DB API Access');
    console.log('-'.repeat(60));

    const apiTests = [
      {
        name: 'List Layman Sections',
        url: `${baseUrl}/api/admin/layman/sections`,
        method: 'GET',
      },
      {
        name: 'Review Queue',
        url: `${baseUrl}/api/admin/layman/review/queue`,
        method: 'GET',
      },
    ];

    for (const test of apiTests) {
      console.log(`\n🔍 Testing: ${test.name}`);
      
      try {
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ SUCCESS`);
          console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}...`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ FAILED`);
          console.log(`   Error: ${errorText.substring(0, 200)}`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete\n');

  } catch (error) {
    console.log(`❌ ERROR: ${error}`);
  }
}

testSkillUpAdminAccess();
