#!/usr/bin/env node

/**
 * Test script to validate the specific failing credentials via API
 * RTH: ajayshah@gmail.com / testing
 * SkillUp: student@skillupitacademy.com / testing
 */

const https = require('https');

async function testLogin(email, password, brand, apiUrl) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email,
      password,
      platform: brand
    });

    const options = {
      hostname: new URL(apiUrl).hostname,
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'test-script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testCredentials() {
  console.log('🔍 Testing Authentication Credentials via API\n');

  // Test RTH credentials
  console.log('📍 Testing RTH: ajayshah@gmail.com / testing');
  try {
    const rthResult = await testLogin(
      'ajayshah@gmail.com',
      'testing',
      'realtutorialhub',
      'https://api-server-production-1234567890.us-central1.run.app'
    );

    console.log('RTH Response Status:', rthResult.status);
    console.log('RTH Response Body:', JSON.stringify(rthResult.body, null, 2));
  } catch (error) {
    console.log('❌ RTH API Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test SkillUp credentials
  console.log('📍 Testing SkillUp: student@skillupitacademy.com / testing');
  try {
    const skillupResult = await testLogin(
      'student@skillupitacademy.com',
      'testing',
      'skillup',
      'https://api-server-production-1234567890.us-central1.run.app'
    );

    console.log('SkillUp Response Status:', skillupResult.status);
    console.log('SkillUp Response Body:', JSON.stringify(skillupResult.body, null, 2));
  } catch (error) {
    console.log('❌ SkillUp API Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test with localhost if available
  console.log('📍 Testing with localhost (if API server is running)');
  try {
    const localResult = await testLogin(
      'ajayshah@gmail.com',
      'testing',
      'realtutorialhub',
      'http://localhost:3001'
    );

    console.log('Local Response Status:', localResult.status);
    console.log('Local Response Body:', JSON.stringify(localResult.body, null, 2));
  } catch (error) {
    console.log('❌ Local API not available:', error.message);
  }
}

testCredentials().catch(error => {
  console.error('💥 Script Error:', error);
  process.exit(1);
});