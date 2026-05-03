#!/usr/bin/env tsx
/**
 * Test Both Brands Login
 * Tests login for RTH and SkillUp admin accounts
 */

async function testBothBrands() {
  const baseUrl = 'https://api.realtutorialhub.com';
  const credentials = [
    { 
      email: 'admin@realtutorialhub.com', 
      password: 'admin123', 
      platform: 'realtutorialhub',
      brand: 'RealTutorialHub'
    },
    { 
      email: 'admin@skillupitacademy.com', 
      password: 'admin123', 
      platform: 'skillup',
      brand: 'SkillUp IT Academy'
    },
  ];

  console.log('\n🔐 Testing Both Brand Logins\n');
  console.log(`Base URL: ${baseUrl}\n`);

  const results = [];

  for (const cred of credentials) {
    console.log(`${'='.repeat(60)}`);
    console.log(`📦 ${cred.brand}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Email: ${cred.email}`);
    console.log(`Platform: ${cred.platform}\n`);

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password,
          platform: cred.platform,
        }),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log('✅ LOGIN SUCCESSFUL!\n');
        
        // Extract token from Set-Cookie
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
          if (tokenMatch) {
            const token = tokenMatch[1];
            console.log(`🎫 Token: ${token.substring(0, 50)}...`);
            console.log(`   Length: ${token.length} characters\n`);
            
            results.push({
              brand: cred.brand,
              email: cred.email,
              success: true,
              token: token
            });
          }
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ LOGIN FAILED`);
        console.log(`   Response: ${errorText.substring(0, 200)}\n`);
        
        results.push({
          brand: cred.brand,
          email: cred.email,
          success: false,
          error: errorText
        });
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error}\n`);
      results.push({
        brand: cred.brand,
        email: cred.email,
        success: false,
        error: String(error)
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.brand}: ${r.email}`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.brand}: ${r.email}`);
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (successful.length === results.length) {
    console.log('🎉 All logins successful! Ready for validation tests.\n');
  } else {
    console.log('⚠️  Some logins failed. Check credentials and try again.\n');
  }
}

testBothBrands();
