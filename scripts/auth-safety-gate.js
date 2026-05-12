#!/usr/bin/env node

const https = require('https');
require('./load-local-env');

const REQUEST_TIMEOUT_MS = Number(process.env.AUTH_SAFETY_GATE_TIMEOUT_MS || 15000);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const BRANDS = [
  {
    name: 'RTH',
    host: process.env.AUTH_SAFETY_RTH_HOST || 'user.realtutorialhub.com',
    email: requiredEnv('AUTH_SAFETY_RTH_EMAIL'),
    password: requiredEnv('AUTH_SAFETY_RTH_PASSWORD'),
    forbidden: 'skillup',
  },
  {
    name: 'SkillUp',
    host: process.env.AUTH_SAFETY_SKILLUP_HOST || 'user.skillupitacademy.com',
    email: requiredEnv('AUTH_SAFETY_SKILLUP_EMAIL'),
    password: requiredEnv('AUTH_SAFETY_SKILLUP_PASSWORD'),
    forbidden: 'realtutorialhub',
  },
];

function request(host, path, method = 'GET', body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const req = https.request(
      {
        hostname: host,
        path,
        method,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie && { Cookie: cookie }),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: raw,
            cookie: res.headers['set-cookie']?.join('; ') || '',
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testAuth(brand) {
  const login = await request(brand.host, '/api/auth/login', 'POST', {
    email: brand.email,
    password: brand.password,
  });

  if (login.status !== 200) {
    throw new Error(`Login failed with HTTP ${login.status}`);
  }

  const profile = await request(brand.host, '/api/auth/me', 'GET', null, login.cookie);

  if (profile.status !== 200) {
    throw new Error(`Profile failed with HTTP ${profile.status}`);
  }

  return profile.data;
}

function checkLeakage(data, brand) {
  if (data.toLowerCase().includes(brand.forbidden)) {
    throw new Error(`Cross-brand leakage detected (${brand.forbidden})`);
  }
}

async function simulateFailure(brand) {
  const res = await request(brand.host, '/api/__force_fail__', 'GET');

  if (![403, 404, 502, 503].includes(res.status)) {
    throw new Error(`Failure handling incorrect: HTTP ${res.status}`);
  }
}

async function main() {
  console.log('AUTH SAFETY GATE');
  console.log('====================================');

  for (const brand of BRANDS) {
    console.log(`\nChecking ${brand.name} (${brand.host})`);

    const data = await testAuth(brand);
    console.log('  Auth: PASS');

    checkLeakage(data, brand);
    console.log('  No leakage: PASS');

    await simulateFailure(brand);
    console.log('  Failure handling: PASS');
  }

  console.log('\nSYSTEM SAFE');
}

main().catch((error) => {
  console.error('\nAUTH SAFETY GATE FAILED');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
