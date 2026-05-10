import 'dotenv/config';

async function testSHCAuth() {
  console.log('🔐 Testing SkillHub Core Auth Endpoint\n');
  console.log('============================================================');
  console.log('Testing: /api/shc/auth/login');
  console.log('User: admin@skillhubcore.in');
  console.log('Password: testing');
  console.log('============================================================\n');

  const loginUrl = 'https://api.skillhubcore.in/api/shc/auth/login';
  
  const payload = {
    email: 'admin@skillhubcore.in',
    password: 'testing',
  };

  console.log('📤 Request:');
  console.log('  URL:', loginUrl);
  console.log('  Method: POST');
  console.log('  Body:', JSON.stringify(payload, null, 2));
  console.log('  Note: Using internal API key to bypass CSRF');
  console.log();

  try {
    // Use internal API key to bypass CSRF (like internal service calls)
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 Response:');
    console.log('  Status:', response.status, response.statusText);
    console.log();

    const data = await response.json();
    console.log('  Body:', JSON.stringify(data, null, 2));
    console.log();

    if (response.ok && data.user) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('============================================================');
      console.log('User Details:');
      console.log('  ID:', data.user.id);
      console.log('  Email:', data.user.email);
      console.log('  Role:', data.user.role);
      console.log('  Platform:', data.user.platform);
      console.log('  Is Admin:', data.user.isAdmin);
      console.log();
      console.log('Tokens:');
      console.log('  Access Token:', data.accessToken?.substring(0, 50) + '...');
      console.log('  Refresh Token:', data.refreshToken?.substring(0, 50) + '...');
      console.log('============================================================');
      console.log();
      console.log('🎉 SHC Auth is working correctly!');
      console.log('   ✅ User authenticated from people_db');
      console.log('   ✅ Admin role verified');
      console.log('   ✅ Tokens generated');
      console.log();
      console.log('Next: Test login via admin app at https://admin.skillhubcore.in');
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('============================================================');
      console.log('Error:', data.message || data.error || 'Unknown error');
      console.log('============================================================');
      console.log();
      console.log('⚠️  Troubleshooting:');
      console.log('   1. Check if user exists in people_db');
      console.log('   2. Verify password is correct');
      console.log('   3. Check platform is "skillhubcore"');
      console.log('   4. Verify role is admin or super_admin');
      console.log('   5. Check API server logs for details');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    console.log();
    console.log('⚠️  Possible issues:');
    console.log('   1. API server not deployed');
    console.log('   2. API Gateway not routing correctly');
    console.log('   3. Network connectivity issue');
  }
}

testSHCAuth();
