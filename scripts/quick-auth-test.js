#!/usr/bin/env node

const https = require('https');

const BRANDS = [
  {
    name: 'RTH',
    baseUrl: 'user.realtutorialhub.com',
    email: 'ajayshah@gmail.com',
    password: 'testing'
  },
  {
    name: 'SkillUp',
    baseUrl: 'user.skillupitacademy.com',
    email: 'student@skillupitacademy.com',
    password: 'testing'
  }
];

function makeRequest(hostname, path, method, body, cookies) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies })
      },
      timeout: 10000
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        resolve({ 
          status: res.statusCode, 
          data: data ? JSON.parse(data) : null,
          cookies: cookies ? cookies.map(c => c.split(';')[0]).join('; ') : null
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testBrand(brand) {
  console.log(`\n🔍 Testing ${brand.name}`);
  console.log('====================================');

  try {
    // LOGIN
    console.log('  🔑 Logging in...');
    const loginBody = JSON.stringify({
      email: brand.email,
      password: brand.password
    });

    const loginRes = await makeRequest(
      brand.baseUrl,
      '/api/auth/login',
      'POST',
      loginBody
    );

    if (loginRes.status === 200) {
      console.log('  ✅ Login successful');
    } else {
      console.log(`  ❌ Login failed: ${loginRes.status}`);
      return;
    }

    // TEST /api/profile
    console.log('  📊 Testing /api/profile...');
    const profileRes = await makeRequest(
      brand.baseUrl,
      '/api/profile',
      'GET',
      null,
      loginRes.cookies
    );

    if (profileRes.status === 200) {
      console.log('  ✅ /api/profile successful');
    } else {
      console.log(`  ❌ /api/profile failed: ${profileRes.status}`);
    }

    // TEST /api/onboarding
    console.log('  📊 Testing /api/onboarding...');
    const onboardingBody = JSON.stringify({
      primaryGoal: 'test',
      domain: 'test'
    });

    const onboardingRes = await makeRequest(
      brand.baseUrl,
      '/api/onboarding',
      'POST',
      onboardingBody,
      loginRes.cookies
    );

    if (onboardingRes.status === 200) {
      console.log('  ✅ /api/onboarding successful');
    } else {
      console.log(`  ❌ /api/onboarding failed: ${onboardingRes.status}`);
    }

    // TEST /api/auth/sessions
    console.log('  📊 Testing /api/auth/sessions...');
    const sessionsRes = await makeRequest(
      brand.baseUrl,
      '/api/auth/sessions',
      'GET',
      null,
      loginRes.cookies
    );

    if (sessionsRes.status === 200) {
      console.log('  ✅ /api/auth/sessions successful');
      const hasCurrent = sessionsRes.data?.sessions?.some(s => s.isCurrent);
      console.log(`  ${hasCurrent ? '✅' : '❌'} Current session marked: ${hasCurrent}`);
    } else {
      console.log(`  ❌ /api/auth/sessions failed: ${sessionsRes.status}`);
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
}

(async () => {
  console.log('🚀 QUICK AUTH TEST\n');

  for (const brand of BRANDS) {
    await testBrand(brand);
  }

  console.log('\n🏁 Test complete!');
})();
