#!/usr/bin/env node

/**
 * Monitor Shared Branding Deployment
 * 
 * This script helps monitor the deployment progress and verify the fix
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🔍 Monitoring Shared Branding Deployment...\n');

// Function to check HTTP status
function checkUrl(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      resolve({
        url,
        status: response.statusCode,
        headers: response.headers
      });
    });
    
    request.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message
      });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout'
      });
    });
  });
}

// Function to check if page contains shared branding content
function checkSharedBranding(url, expectedText) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const hasExpectedContent = data.includes(expectedText);
        resolve({
          url,
          status: response.statusCode,
          hasSharedBranding: hasExpectedContent,
          contentLength: data.length
        });
      });
    });
    
    request.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message,
        hasSharedBranding: false
      });
    });
    
    request.setTimeout(15000, () => {
      request.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
        hasSharedBranding: false
      });
    });
  });
}

async function monitorDeployment() {
  console.log('📊 Deployment Monitoring Dashboard');
  console.log('=' .repeat(50));
  
  // Check GitHub Actions status
  console.log('\n🔄 GitHub Actions Status:');
  try {
    const actionsUrl = 'https://github.com/realtutorialhub/quiz-platform/actions';
    console.log(`   View at: ${actionsUrl}`);
    console.log('   ⏱️  Expected duration: 15-20 minutes per service');
  } catch (error) {
    console.log('   ❌ Could not check GitHub Actions status');
  }
  
  // Test URLs to monitor
  const testUrls = [
    {
      url: 'https://user.realtutorialhub.com/',
      name: 'RTH User Domain',
      expectedText: 'Learn Smarter. Not Harder.',
      description: 'Should show RTH shared branding'
    },
    {
      url: 'https://user.skillupitacademy.com/',
      name: 'SkillUp User Domain', 
      expectedText: 'Skill Up. Stand Out.',
      description: 'Should show SkillUp shared branding'
    },
    {
      url: 'https://api.realtutorialhub.com/api/health/live',
      name: 'API Health Check',
      expectedText: null,
      description: 'API server health status'
    }
  ];
  
  console.log('\n🌐 Service Status Check:');
  
  for (const test of testUrls) {
    console.log(`\n📍 ${test.name}:`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Expected: ${test.description}`);
    
    if (test.expectedText) {
      // Check for shared branding content
      const result = await checkSharedBranding(test.url, test.expectedText);
      
      if (result.status === 200) {
        if (result.hasSharedBranding) {
          console.log('   ✅ SHARED BRANDING DETECTED - Fix successful!');
        } else {
          console.log('   ⚠️  Page loads but shared branding not detected yet');
          console.log('   📝 This may indicate deployment is still in progress');
        }
      } else if (result.status === 'ERROR' || result.status === 'TIMEOUT') {
        console.log(`   ❌ Connection issue: ${result.error}`);
      } else {
        console.log(`   ⚠️  HTTP ${result.status} - Service may be updating`);
      }
    } else {
      // Simple status check
      const result = await checkUrl(test.url);
      
      if (result.status === 200) {
        console.log('   ✅ Service healthy');
      } else if (result.status === 'ERROR' || result.status === 'TIMEOUT') {
        console.log(`   ❌ Connection issue: ${result.error}`);
      } else {
        console.log(`   ⚠️  HTTP ${result.status}`);
      }
    }
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Wait for GitHub Actions deployment to complete (~15-20 min)');
  console.log('2. Run this script again to verify the fix');
  console.log('3. Test authentication on both domains');
  console.log('4. Verify shared branding is working correctly');
  
  console.log('\n🔄 To check again, run: node monitor-deployment.js');
  console.log('📊 GitHub Actions: https://github.com/realtutorialhub/quiz-platform/actions');
}

// Run the monitoring
monitorDeployment().catch(console.error);