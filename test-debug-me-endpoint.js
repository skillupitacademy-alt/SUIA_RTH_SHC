#!/usr/bin/env node

/**
 * Debug /me endpoint to understand why it's returning 401
 */

const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testWithDebug() {
  console.log('🔍 Testing RTH Login + /me with detailed debugging');
  
  // Step 1: Login
  const loginResponse = await makeRequest('https://api.realtutorialhub.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-portal-identity': 'user',
      'x-brand': 'realtutorialhub'
    },
    body: JSON.stringify({
      email: 'ajayshah@gmail.com',
      password: 'testing',
      platform: 'realtutorialhub'
    })
  });

  console.log(`Login Status: ${loginResponse.status}`);
  
  if (loginResponse.status !== 200) {
    console.log('Login failed:', loginResponse.data);
    return;
  }

  // Extract cookies
  const cookies = loginResponse.headers['set-cookie'] || [];
  console.log('Cookies received:');
  cookies.forEach((cookie, i) => {
    const cookieName = cookie.split('=')[0];
    const cookieValue = cookie.split('=')[1]?.split(';')[0];
    console.log(`  ${i + 1}. ${cookieName}: ${cookieValue?.substring(0, 20)}...`);
  });

  const cookieHeader = cookies.join('; ');
  
  // Step 2: Test /me endpoint with detailed headers
  console.log('\n🔍 Testing /me endpoint...');
  
  const meResponse = await makeRequest('https://api.realtutorialhub.com/api/auth/me', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'x-portal-identity': 'user',
      'x-brand': 'realtutorialhub',
      'Host': 'api.realtutorialhub.com',
      'Cookie': cookieHeader
    }
  });

  console.log(`/me Status: ${meResponse.status}`);
  console.log('/me Response:', JSON.stringify(meResponse.data, null, 2));
  console.log('/me Headers:', meResponse.headers);

  // Step 3: Test debug login endpoint for comparison
  console.log('\n🔍 Testing debug login endpoint...');
  
  const debugResponse = await makeRequest('https://api.realtutorialhub.com/api/debug/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-portal-identity': 'user',
      'x-brand': 'realtutorialhub'
    },
    body: JSON.stringify({
      email: 'ajayshah@gmail.com',
      password: 'testing',
      platform: 'realtutorialhub'
    })
  });

  console.log(`Debug Status: ${debugResponse.status}`);
  console.log('Debug Response:', JSON.stringify(debugResponse.data, null, 2));
}

testWithDebug().catch(console.error);