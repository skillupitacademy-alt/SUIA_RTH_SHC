#!/usr/bin/env node

const https = require('https');

async function testTokenServiceFix() {
  console.log('🔍 Testing TokenService Fix Deployment');
  console.log('=====================================');
  
  // Test the specific scenario that was broken:
  // 1. Login to get cookies
  // 2. Call /api/auth/me which should use TokenService.getAccessToken() without scope
  // 3. If fix is deployed, it should read the accessToken cookie
  
  const testCredentials = {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    platform: 'realtutorialhub'
  };
  
  try {
    console.log('1. Testing login to get cookies...');
    
    const loginData = JSON.stringify(testCredentials);
    const loginOptions = {
      hostname: 'user.realtutorialhub.com',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await new Promise((resolve, reject) => {
      const req = https.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data),
            cookies: res.headers['set-cookie'] || []
          });
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      console.log('   ❌ Login failed - checking if this is the TokenService bug...');
      
      // The bug is that TokenService.getAccessToken() doesn't check cookies when no scope is specified
      // This affects /api/auth/me and /api/onboarding endpoints
      // Let's check if we can directly test the API server
      
      console.log('\n2. Testing direct API server access...');
      
      const apiServerUrl = 'https://quiz-api-server-1776307747362.us-central1.run.app';
      
      const directLoginOptions = {
        hostname: 'quiz-api-server-1776307747362.us-central1.run.app',
        port: 443,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      };
      
      const directLoginResponse = await new Promise((resolve, reject) => {
        const req = https.request(directLoginOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: JSON.parse(data),
              cookies: res.headers['set-cookie'] || []
            });
          });
        });
        req.on('error', reject);
        req.write(loginData);
        req.end();
      });
      
      console.log(`   Direct API Server Login Status: ${directLoginResponse.status}`);
      
      if (directLoginResponse.status === 200) {
        console.log('   ✅ Direct API server login works');
        console.log('   🔍 Issue is in BFF → API Server communication');
        
        // Extract cookies and test /api/auth/me
        const cookies = directLoginResponse.cookies
          .map(cookie => cookie.split(';')[0])
          .join('; ');
        
        console.log('\n3. Testing /api/auth/me with cookies...');
        
        const meOptions = {
          hostname: 'quiz-api-server-1776307747362.us-central1.run.app',
          port: 443,
          path: '/api/auth/me',
          method: 'GET',
          headers: {
            'Cookie': cookies
          }
        };
        
        const meResponse = await new Promise((resolve, reject) => {
          const req = https.request(meOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({
                status: res.statusCode,
                data: JSON.parse(data)
              });
            });
          });
          req.on('error', reject);
          req.end();
        });
        
        console.log(`   /api/auth/me Status: ${meResponse.status}`);
        
        if (meResponse.status === 200) {
          console.log('   ✅ TokenService fix is working!');
          console.log('   🔍 Issue is in BFF routing or environment variables');
          return { tokenServiceFixed: true, bffIssue: true };
        } else {
          console.log('   ❌ TokenService fix not working');
          console.log('   Response:', meResponse.data);
          return { tokenServiceFixed: false, bffIssue: false };
        }
        
      } else {
        console.log('   ❌ Direct API server login also fails');
        console.log('   Response:', directLoginResponse.data);
        return { tokenServiceFixed: false, credentialIssue: true };
      }
      
    } else {
      console.log('   ✅ Login works - TokenService fix deployed successfully');
      return { tokenServiceFixed: true, loginWorks: true };
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return { error: error.message };
  }
}

testTokenServiceFix().then(result => {
  console.log('\n📊 DIAGNOSIS RESULT:');
  console.log('===================');
  
  if (result.tokenServiceFixed) {
    console.log('✅ TokenService fix is deployed and working');
    if (result.bffIssue) {
      console.log('🔍 Issue is in BFF configuration or routing');
    }
  } else if (result.credentialIssue) {
    console.log('❌ Credential issue - test users may not exist');
  } else {
    console.log('❌ TokenService fix not deployed or not working');
  }
}).catch(console.error);