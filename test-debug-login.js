#!/usr/bin/env node

/**
 * Test Debug Login Endpoint
 * Uses the debug endpoint to see detailed login flow information
 */

const https = require('https');

// Test credentials
const TEST_ACCOUNTS = [
  { 
    email: 'ajayshah@gmail.com', 
    password: 'testing', 
    brand: 'realtutorialhub',
    debugUrl: 'https://api.realtutorialhub.com/api/debug/login'
  },
  { 
    email: 'student@skillupitacademy.com', 
    password: 'testing', 
    brand: 'skillup',
    debugUrl: 'https://api.skillupitacademy.com/api/debug/login'
  }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DebugTest/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testDebugLogin(account) {
  console.log(`\n🔍 Debug Testing: ${account.email} (${account.brand})`);
  console.log('='.repeat(60));
  
  try {
    console.log(`🔗 POST ${account.debugUrl}`);
    
    const response = await makeRequest(account.debugUrl, {
      method: 'POST',
      body: {
        email: account.email,
        password: account.password,
        platform: account.brand
      }
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.status === 200 && response.data) {
      const debug = response.data.data || response.data;
      
      console.log(`\n📋 Debug Information:`);
      console.log(`   Success: ${debug.success ? '✅' : '❌'}`);
      
      if (debug.debug) {
        console.log(`\n🔍 Request Details:`);
        if (debug.debug.request) {
          console.log(`   Host: ${debug.debug.request.host}`);
          console.log(`   Origin: ${debug.debug.request.origin}`);
        }
        
        if (debug.debug.loginData) {
          console.log(`\n📝 Login Data:`);
          console.log(`   Email: ${debug.debug.loginData.email}`);
          console.log(`   Platform: ${debug.debug.loginData.platform}`);
          console.log(`   Resolved Brand: ${debug.debug.loginData.resolvedBrand}`);
          console.log(`   IP: ${debug.debug.loginData.ip}`);
        }
        
        console.log(`\n📊 Steps Completed:`);
        debug.debug.steps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step}`);
        });
        
        if (debug.debug.loginError) {
          console.log(`\n❌ Login Error:`);
          console.log(`   Message: ${debug.debug.loginError.message}`);
          console.log(`   Name: ${debug.debug.loginError.name}`);
          if (debug.debug.loginError.stack) {
            console.log(`   Stack: ${debug.debug.loginError.stack.join(' -> ')}`);
          }
        }
        
        if (debug.debug.loginResult) {
          console.log(`\n✅ Login Result:`);
          console.log(`   User ID: ${debug.debug.loginResult.userId}`);
          console.log(`   Email: ${debug.debug.loginResult.email}`);
          console.log(`   Is Admin: ${debug.debug.loginResult.isAdmin}`);
          console.log(`   Has Access Token: ${debug.debug.loginResult.hasAccessToken}`);
        }
      }
      
      if (debug.error) {
        console.log(`\n❌ Error: ${debug.error}`);
      }
      
      return {
        success: debug.success,
        error: debug.error,
        debugInfo: debug.debug
      };
      
    } else {
      console.log('❌ Debug endpoint failed');
      console.log('📄 Response:', response.rawData);
      
      return {
        success: false,
        error: 'Debug endpoint failed',
        status: response.status
      };
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Starting Debug Login Test\n');
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    const result = await testDebugLogin(account);
    results.push({
      account: account.email,
      brand: account.brand,
      ...result
    });
  }
  
  console.log('\n📋 Debug Summary');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n${result.account} (${result.brand}):`);
    console.log(`  Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  console.log('\n🎯 This debug information will help identify the exact failure point in the login flow.');
}

main().catch(console.error);