#!/usr/bin/env node

const https = require('https');

const BRANDS = [
  {
    name: 'RTH',
    host: 'user.realtutorialhub.com',
    email: 'ajayshah@gmail.com',
    password: 'testing',
    forbidden: 'skillup',
  },
  {
    name: 'SkillUp',
    host: 'user.skillupitacademy.com',
    email: 'student@skillupitacademy.com',
    password: 'testing',
    forbidden: 'realtutorialhub',
  },
];

// ============================
// HTTP HELPER
// ============================

function request(host, path, method = 'GET', body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const req = https.request(
      {
        hostname: host,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie && { Cookie: cookie }),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: raw,
            cookie: res.headers['set-cookie']?.join('; ') || '',
          });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ============================
// 1. AUTH FLOW TEST
// ============================

async function testAuth(brand) {
  const login = await request(
    brand.host,
    '/api/auth/login',
    'POST',
    { email: brand.email, password: brand.password }
  );

  if (login.status !== 200) throw new Error('Login failed');

  const profile = await request(
    brand.host,
    '/api/auth/me',
    'GET',
    null,
    login.cookie
  );

  if (profile.status !== 200) throw new Error('Profile failed');

  return profile.data;
}

// ============================
// 2. CROSS-BRAND CHECK
// ============================

function checkLeakage(data, brand) {
  if (data.includes(brand.forbidden)) {
    throw new Error(`Cross-brand leakage detected (${brand.forbidden})`);
  }
}

// ============================
// 3. FAILURE SIMULATION
// ============================

async function simulateFailure(brand) {
  const res = await request(brand.host, '/api/__force_fail__', 'GET');

  // Accept 403, 404, 502, 503 as valid failure responses
  if (![403, 404, 502, 503].includes(res.status)) {
    throw new Error(`Failure handling incorrect (${res.status})`);
  }
}

// ============================
// MAIN
// ============================

(async () => {
  console.log('🔐 AUTH SAFETY GATE');
  console.log('====================================');

  for (const brand of BRANDS) {
    console.log(`\n🔍 ${brand.name}`);

    try {
      const data = await testAuth(brand);
      console.log('  Auth: ✅');

      checkLeakage(data, brand);
      console.log('  No leakage: ✅');

      await simulateFailure(brand);
      console.log('  Failure handling: ✅');
    } catch (err) {
      console.error(`❌ ${brand.name} FAILED:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n✅ SYSTEM SAFE');
  process.exit(0);
})();