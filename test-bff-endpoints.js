#!/usr/bin/env node

const https = require('https');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      console.log(`${url}: ${res.statusCode} ${res.statusMessage}`);
      resolve({ url, status: res.statusCode, message: res.statusMessage });
    });
    
    req.on('error', (err) => {
      console.log(`${url}: ERROR - ${err.message}`);
      resolve({ url, error: err.message });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`${url}: TIMEOUT`);
      resolve({ url, error: 'TIMEOUT' });
    });
    
    req.end();
  });
}

async function main() {
  console.log('Testing BFF endpoints...\n');
  
  const endpoints = [
    'https://user.realtutorialhub.com/api/auth/me',
    'https://user.skillupitacademy.com/api/auth/me',
    'https://user.realtutorialhub.com/api/onboarding',
    'https://user.skillupitacademy.com/api/onboarding'
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

main().catch(console.error);