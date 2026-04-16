#!/usr/bin/env node

/**
 * Verify Shared Branding Implementation
 * 
 * Run this script after deployment to verify the shared branding fix is working
 */

const https = require('https');

console.log('🔍 Verifying Shared Branding Implementation...\n');

// Test cases for verification
const verificationTests = [
  {
    name: 'RTH Shared Branding',
    url: 'https://user.realtutorialhub.com/',
    checks: [
      { text: 'Learn Smarter. Not Harder.', description: 'RTH hero text' },
      { text: 'AI Tutor', description: 'RTH AI Tutor branding' },
      { text: 'RealTutorialHub', description: 'RTH brand name' },
      { text: '#d03f00', description: 'RTH primary color' },
      { text: '#124fd6', description: 'RTH secondary color' }
    ]
  },
  {
    name: 'SkillUp Shared Branding',
    url: 'https://user.skillupitacademy.com/',
    checks: [
      { text: 'Skill Up. Stand Out.', description: 'SkillUp hero text' },
      { text: 'Live Mentor', description: 'SkillUp Live Mentor branding' },
      { text: 'SkillUp IT Academy', description: 'SkillUp brand name' },
      { text: '#f54a8d', description: 'SkillUp primary color' },
      { text: '#133382', description: 'SkillUp secondary color' }
    ]
  }
];

function fetchPageContent(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          content: data,
          headers: response.headers
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function verifySharedBranding() {
  console.log('🧪 Running Shared Branding Verification Tests\n');
  
  let allTestsPassed = true;
  
  for (const test of verificationTests) {
    console.log(`📋 Testing: ${test.name}`);
    console.log(`🌐 URL: ${test.url}`);
    
    try {
      const result = await fetchPageContent(test.url);
      
      if (result.status !== 200) {
        console.log(`❌ HTTP ${result.status} - Service not responding correctly`);
        allTestsPassed = false;
        continue;
      }
      
      console.log('✅ Page loaded successfully');
      
      let passedChecks = 0;
      let totalChecks = test.checks.length;
      
      for (const check of test.checks) {
        const found = result.content.includes(check.text);
        if (found) {
          console.log(`   ✅ ${check.description}: Found`);
          passedChecks++;
        } else {
          console.log(`   ❌ ${check.description}: Missing`);
        }
      }
      
      const successRate = (passedChecks / totalChecks) * 100;
      console.log(`📊 Success Rate: ${passedChecks}/${totalChecks} (${successRate.toFixed(1)}%)`);
      
      if (successRate >= 80) {
        console.log('🎉 Shared branding verification PASSED!');
      } else {
        console.log('⚠️  Shared branding verification FAILED - Old content still served');
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log(`❌ Error fetching page: ${error.message}`);
      allTestsPassed = false;
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Final summary
  console.log('=' .repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED - Shared Branding Fix Successful!');
    console.log('');
    console.log('✅ user.realtutorialhub.com now serves RTH shared branding');
    console.log('✅ user.skillupitacademy.com now serves SkillUp shared branding');
    console.log('');
    console.log('🔐 Next: Test authentication on both domains');
    console.log('📱 Next: Test responsive design and mobile experience');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Deployment may still be in progress');
    console.log('');
    console.log('🔄 If deployment is complete, check:');
    console.log('   1. GitHub Actions logs for any errors');
    console.log('   2. Cloud Run service logs');
    console.log('   3. API Gateway routing configuration');
    console.log('');
    console.log('⏱️  If deployment is still running, wait and run this script again');
  }
  console.log('=' .repeat(60));
}

// Run verification
verifySharedBranding().catch(console.error);