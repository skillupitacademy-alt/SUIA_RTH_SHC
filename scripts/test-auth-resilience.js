#!/usr/bin/env node

const https = require('https');
require('./load-local-env');

const REQUEST_TIMEOUT_MS = Number(process.env.AUTH_RESILIENCE_TIMEOUT_MS || 15000);

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
    host: process.env.RTH_TEST_HOST || 'user.realtutorialhub.com',
    email: requiredEnv('RTH_TEST_EMAIL'),
    password: requiredEnv('RTH_TEST_PASSWORD'),
  },
  {
    name: 'SkillUp',
    host: process.env.SKILLUP_TEST_HOST || 'user.skillupitacademy.com',
    email: requiredEnv('SKILLUP_TEST_EMAIL'),
    password: requiredEnv('SKILLUP_TEST_PASSWORD'),
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
            location: res.headers.location || '',
            cookie: res.headers['set-cookie']?.map((item) => item.split(';')[0]).join('; ') || '',
          });
        });
      }
    );

    req.on('timeout', () => req.destroy(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`)));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login(brand) {
  const response = await request(brand.host, '/api/auth/login', 'POST', {
    email: brand.email,
    password: brand.password,
  });

  if (response.status !== 200 || !response.cookie) {
    throw new Error(`${brand.name} login failed: HTTP ${response.status}`);
  }

  return response.cookie;
}

function assertNoLogout(brand, path, response) {
  if (response.status === 401 || response.status === 403) {
    throw new Error(`${brand.name} ${path} lost session: HTTP ${response.status}`);
  }

  if ([301, 302, 303, 307, 308].includes(response.status) && /\/login\b/i.test(response.location)) {
    throw new Error(`${brand.name} ${path} redirected to login`);
  }

  if (response.status >= 500) {
    throw new Error(`${brand.name} ${path} server error: HTTP ${response.status}`);
  }
}

async function testBrand(brand) {
  console.log(`\nChecking ${brand.name} navigation stability`);
  const cookie = await login(brand);
  console.log('  Login: PASS');

  const sequence = ['/api/auth/me', '/dashboard', '/dashboard/profile', '/api/auth/me'];

  for (const path of sequence) {
    const response = await request(brand.host, path, 'GET', null, cookie);
    assertNoLogout(brand, path, response);
    console.log(`  ${path}: PASS (${response.status})`);
  }
}

async function main() {
  console.log('AUTH NAVIGATION RESILIENCE TEST');
  console.log('====================================');

  for (const brand of BRANDS) {
    await testBrand(brand);
  }

  console.log('\nAUTH NAVIGATION RESILIENCE PASSED');
}

main().catch((error) => {
  console.error('\nAUTH NAVIGATION RESILIENCE FAILED');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
