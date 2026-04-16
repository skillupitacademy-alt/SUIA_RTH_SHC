#!/usr/bin/env node

const https = require('https');

async function testTokenServiceFix() {
  console.log('🔍 Testing TokenService Fix Deployment');
  console.log('=====================================');
  
  // Test if we can create a valid login and then use /api/auth/me
  // This will verify if the TokenService is properly reading cookies
  
  const testCredentials = {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    platform: 'realtutorialhub'
  };
  
  try {
    console.log('1. Testing direct API server login...');
    
    const loginData = JSON.stringify(testCredentials);
    const loginOptions = {
      hostname: 'quiz-api-server-1776307747362.us-central1.run.app',
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
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: JSON.parse(data),
              cookies: res.headers['set-cookie'] || []
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
              cookies: res.headers['set-cookie'] || []
            });
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.write(loginData);
      req.end();
    });
    
    console.log(`   Direct API Server Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log('   ✅ Direct API server login works');
      
      // Extract cookies and test /api/auth/me
      const cookies = loginResponse.cookies
        .map(cookie => cookie.split(';')[0])
        .join('; ');
      
      console.log('   📝 Cookies received:', cookies.substring(0, 100) + '...');
      
      console.log('\n2. Testing /api/auth/me with cookies (TokenService fix test)...');
      
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
            try {
              resolve({
                status: res.statusCode,
                data: JSON.parse(data)
              });
            } catch (e) {
              resolve({
                status: res.statusCode,
                data: data
              });
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        req.end();
      });
      
      console.log(`   /api/auth/me Status: ${meResponse.status}`);
      
      if (meResponse.status === 200) {
        console.log('   ✅ TokenService fix is working!');
        console.log('   👤 User data:', {
          email: meResponse.data.user?.email,
          id: meResponse.data.user?.id
        });
        return { tokenServiceFixed: true, loginWorks: true };
      } else {
        console.log('   ❌ TokenService fix not working');
        console.log('   Response:', meResponse.data);
        return { tokenServiceFixed: false, authMeIssue: true };
      }
      
    } else {
      console.log('   ❌ Direct API server login fails');
      console.log('   Response:', loginResponse.data);
      
      // Check if it's a credential issue or deployment issue
      if (loginResponse.status === 401 && loginResponse.data?.message === 'Invalid credentials') {
        return { credentialIssue: true, tokenServiceFixed: false };
      } else {
        return { deploymentIssue: true, tokenServiceFixed: false };
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return { error: error.message };
  }
}

testTokenServiceFix().then(result => {
  console.log('\n📊 DIAGNOSIS RESULT:');
  console.log('===================');
  
  if (result.tokenServiceFixed && result.loginWorks) {
    console.log('✅ TokenService fix is deployed and working');
    console.log('✅ Authentication system is functional');
    console.log('🔍 Issue might be with BFF routing or environment variables');
  } else if (result.credentialIssue) {
    console.log('❌ Credential issue - test users may not exist or passwords incorrect');
    console.log('🔍 Need to verify test user credentials in database');
  } else if (result.deploymentIssue) {
    console.log('❌ Deployment issue - API server may not be updated');
    console.log('🔍 Need to wait for deployment to complete');
  } else if (result.authMeIssue) {
    console.log('✅ Login works but /api/auth/me fails');
    console.log('❌ TokenService fix may not be fully deployed');
  } else {
    console.log('❌ Unknown issue - need further investigation');
  }
}).catch(console.error);