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
      timeout: 15000
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
          data: data ? (data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data) : null,
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

  const results = {
    login: false,
    profile: false,
    onboarding: false,
    sessions: false,
    currentSessionMarked: false
  };

  try {
    // LOGIN
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

    results.login = loginRes.status === 200;
    console.log('  Login:', results.login ? '✅' : '❌', `(${loginRes.status})`);

    if (!results.login) {
      console.log('  ⚠️  Cannot proceed without login');
      return results;
    }

    const cookieJar = loginRes.cookies;

    // PROFILE
    const profileRes = await makeRequest(
      brand.baseUrl,
      '/api/profile',
      'GET',
      null,
      cookieJar
    );

    results.profile = profileRes.status === 200;
    console.log('  Profile:', results.profile ? '✅' : '❌', `(${profileRes.status})`);

    // ONBOARDING (expect 403 if already onboarded)
    const onboardingBody = JSON.stringify({
      primaryGoal: 'test',
      domain: 'test'
    });

    const onboardingRes = await makeRequest(
      brand.baseUrl,
      '/api/onboarding',
      'POST',
      onboardingBody,
      cookieJar
    );

    // 200 = success, 403 = already onboarded (acceptable)
    results.onboarding = onboardingRes.status === 200 || onboardingRes.status === 403;
    console.log('  Onboarding:', results.onboarding ? '✅' : '❌', `(${onboardingRes.status})`);

    // SESSIONS
    const sessionsRes = await makeRequest(
      brand.baseUrl,
      '/api/auth/sessions',
      'GET',
      null,
      cookieJar
    );

    results.sessions = sessionsRes.status === 200;
    console.log('  Sessions:', results.sessions ? '✅' : '❌', `(${sessionsRes.status})`);

    if (results.sessions && sessionsRes.data?.sessions) {
      results.currentSessionMarked = sessionsRes.data.sessions.some(s => s.isCurrent);
      console.log('  Current session marked:', results.currentSessionMarked ? '✅' : '❌');
    }

  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }

  return results;
}

(async () => {
  console.log('🚀 PRE/POST DEPLOY AUTH CHECK\n');

  const results = [];

  for (const brand of BRANDS) {
    const res = await testBrand(brand);
    results.push({ 
      brand: brand.name, 
      login: res.login ? '✅' : '❌',
      profile: res.profile ? '✅' : '❌',
      onboarding: res.onboarding ? '✅' : '❌',
      sessions: res.sessions ? '✅' : '❌',
      currentSession: res.currentSessionMarked ? '✅' : '❌'
    });
  }

  console.log('\n📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.table(results);

  // Check for critical failures
  const criticalFailures = results.filter(r => 
    r.login === '❌' || r.profile === '❌' || r.sessions === '❌'
  );

  console.log('\n🏁 FINAL RESULT');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (criticalFailures.length > 0) {
    console.log('❌ FAIL — DO NOT DEPLOY / ROLLBACK IMMEDIATELY');
    console.log('\nCritical failures detected in:');
    criticalFailures.forEach(r => console.log(`  - ${r.brand}`));
    process.exit(1);
  } else {
    console.log('✅ PASS — SAFE TO DEPLOY/KEEP DEPLOYED');
    console.log('\nAll critical authentication flows working correctly.');
    process.exit(0);
  }
})();
