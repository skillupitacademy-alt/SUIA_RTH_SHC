#!/usr/bin/env tsx
/**
 * Test SkillHub Core Admin Login
 * Tests login for SkillHub Core admin account
 */

async function testSkillHubCoreLogin() {
  // SkillHub Core uses its own API Gateway for authentication
  const apiGatewayUrl = 'https://api.skillhubcore.in';
  const adminUrl = 'https://admin.skillhubcore.in';
  
  const credentials = {
    email: 'admin@skillhubcore.in',
    password: 'testing',
    platform: 'skillhubcore',
    brand: 'SkillHub Core'
  };

  console.log('\n🔐 Testing SkillHub Core Admin Login\n');
  console.log(`Admin URL: ${adminUrl}`);
  console.log(`API Gateway: ${apiGatewayUrl}\n`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📦 ${credentials.brand}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Email: ${credentials.email}`);
  console.log(`Password: ${credentials.password}`);
  console.log(`Platform: ${credentials.platform}\n`);

  try {
    // Test login endpoint via API Gateway
    const loginUrl = `${apiGatewayUrl}/api/auth/login`;
    console.log(`🌐 POST ${loginUrl}\n`);

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        platform: credentials.platform,
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      
      // Extract token from Set-Cookie
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log('🍪 Set-Cookie header found:');
        console.log(`   ${setCookie.substring(0, 100)}...\n`);
        
        const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          console.log(`🎫 Access Token extracted:`);
          console.log(`   ${token.substring(0, 50)}...`);
          console.log(`   Length: ${token.length} characters\n`);
        }
      }

      // Try to parse response body
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        console.log('📦 Response body:');
        console.log(JSON.stringify(data, null, 2));
      }

      console.log('\n' + '='.repeat(60));
      console.log('🎉 SkillHub Core Admin Login Test PASSED');
      console.log('='.repeat(60));
      console.log('\n✅ Next steps:');
      console.log('   1. Visit https://admin.skillhubcore.in/login');
      console.log('   2. Login with admin@test.com / admin123');
      console.log('   3. Verify redirect to /dashboard');
      console.log('   4. Test Content Manager and Prompt Generator tools\n');

    } else {
      const errorText = await response.text();
      console.log(`❌ LOGIN FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${errorText.substring(0, 500)}\n`);
      
      console.log('\n' + '='.repeat(60));
      console.log('❌ SkillHub Core Admin Login Test FAILED');
      console.log('='.repeat(60));
      console.log('\n⚠️  Troubleshooting:');
      console.log('   1. Check if user exists in people_db');
      console.log('   2. Verify password hash matches "admin123"');
      console.log('   3. Check platform is set to "skillhubcore"');
      console.log('   4. Verify admin role is assigned\n');
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}\n`);
    
    console.log('\n' + '='.repeat(60));
    console.log('❌ SkillHub Core Admin Login Test ERROR');
    console.log('='.repeat(60));
    console.log('\n⚠️  Network or connection issue:');
    console.log(`   ${String(error)}\n`);
  }
}

testSkillHubCoreLogin();
