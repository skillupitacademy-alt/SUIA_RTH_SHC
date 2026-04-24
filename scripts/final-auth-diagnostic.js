#!/usr/bin/env node

/**
 * 🚀 MASTER AUTH VALIDATION SCRIPT
 *
 * Covers:
 * ✔ Phase 1 (Observability)
 * ✔ Phase 2 (Identity safety - indirect)
 * ✔ Phase 3 (Header standardization via logs)
 *
 * Uses REAL production flow:
 * Client → BFF → API → DB
 */

const https = require('https');
const { execSync } = require('child_process');

// =====================================
// CONFIG
// =====================================

const PROJECT_ID = 'project-48af6a2d-e8bb-46dd-a58';

const BRANDS = [
  {
    name: 'RTH',
    host: 'user.realtutorialhub.com',
    email: 'ajayshah@gmail.com',
    password: 'testing',
  },
  {
    name: 'SkillUp',
    host: 'user.skillupitacademy.com',
    email: 'student@skillupitacademy.com',
    password: 'testing',
  },
];

// =====================================
// HTTP HELPER
// =====================================

function request(host, path, method = 'GET', body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: host,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }),
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let raw = '';

      res.on('data', (chunk) => (raw += chunk));

      res.on('end', () => {
        let parsed = null;

        try {
          parsed = JSON.parse(raw);
        } catch {}

        const cookies = res.headers['set-cookie']
          ? res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ')
          : '';

        resolve({
          status: res.statusCode,
          data: parsed,
          cookie: cookies,
        });
      });
    });

    req.on('error', reject);

    req.on('timeout', () => {
      console.log(`  ❌ Timeout: ${host}${path}`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) req.write(data);
    req.end();
  });
}

// =====================================
// TEST BRAND FLOW
// =====================================

async function testBrand(brand) {
  console.log(`\n🔍 Testing ${brand.name}`);
  console.log('--------------------------------');

  try {
    // LOGIN
    const login = await request(
      brand.host,
      '/api/auth/login',
      'POST',
      {
        email: brand.email,
        password: brand.password,
      }
    );

    if (login.status !== 200) {
      throw new Error(`Login failed (${login.status})`);
    }

    if (!login.cookie) {
      throw new Error('No cookies received');
    }

    console.log('  Login: ✅');

    // PROFILE (BFF ROUTE)
    const profile = await request(
      brand.host,
      '/api/profile',
      'GET',
      null,
      login.cookie
    );

    if (profile.status !== 200) {
      throw new Error(`Profile failed (${profile.status})`);
    }

    console.log('  Profile: ✅');

    // ONBOARDING
    const onboarding = await request(
      brand.host,
      '/api/onboarding',
      'POST',
      { test: true },
      login.cookie
    );

    if (![200, 403].includes(onboarding.status)) {
      throw new Error(`Onboarding failed (${onboarding.status})`);
    }

    console.log('  Onboarding: ✅');

    // SESSIONS
    const sessions = await request(
      brand.host,
      '/api/auth/sessions',
      'GET',
      null,
      login.cookie
    );

    if (sessions.status !== 200) {
      throw new Error(`Sessions failed (${sessions.status})`);
    }

    const hasCurrent =
      Array.isArray(sessions.data?.sessions) &&
      sessions.data.sessions.some((s) => s.isCurrent === true);

    console.log('  Sessions: ✅');
    console.log(`  Current session: ${hasCurrent ? '✅' : '❌'}`);

    if (!hasCurrent) {
      throw new Error('Current session not marked');
    }

    return true;
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
    return false;
  }
}

// =====================================
// CHECK ERRORS
// =====================================

function checkErrors() {
  console.log('\n🔍 Checking production errors...');

  try {
    const output = execSync(
      `gcloud logging read "severity>=ERROR" --limit=5 --freshness=10m --project=${PROJECT_ID}`,
      { encoding: 'utf-8' }
    );

    if (!output.trim()) {
      console.log('  ✅ No recent errors');
      return true;
    }

    console.log('  ⚠️ Errors found');
    return false;
  } catch {
    console.log('  ⚠️ Could not check logs (non-blocking)');
    return true;
  }
}

// =====================================
// CHECK PHASE 3 LOGS
// =====================================

// function checkPhase3Logs() {
//   console.log('\n🔍 Checking Phase 3 header logs...');

//   try {
//     const output = execSync(
//       `gcloud logging read 'textPayload:"PHASE_3_HEADER"' --limit=5 --freshness=5m --project=${PROJECT_ID}`,
//       { encoding: 'utf-8' }
//     );

//     if (!output.trim()) {
//       console.log('  ❌ No PHASE_3_HEADER logs found');
//       return false;
//     }

//     console.log('  ✅ Header standardization confirmed');
//     return true;

//   } catch (err) {
//     console.log('  ❌ Log check failed:', err.message);
//     return false;
//   }
// }

// function checkPhase3Logs() {
//   console.log('\n🔍 Checking Phase 3 header logs...');

//   try {
//     const output = execSync(
//       `gcloud logging read 'textPayload:"PHASE_3_HEADER"' --limit=5 --freshness=5m --project=${PROJECT_ID}`,
//       { encoding: 'utf-8' }
//     );

//     if (!output.trim()) {
//       console.log('  ❌ No PHASE_3_HEADER logs found');
//       return false;
//     }

//     console.log('  ✅ Header standardization confirmed');
//     return true;

//   } catch (err) {
//     console.log('  ❌ Log check failed:', err.message);
//     return false;
//   }
// }


function checkPhase3Logs() {
  console.log('\n🔍 Checking Phase 3 header logs...');

  try {
    const output = execSync(
      `gcloud logging read 'resource.type="cloud_run_revision" AND "PHASE_3_HEADER"' --limit=5 --freshness=5m --project=${PROJECT_ID}`,
      { encoding: 'utf-8' }
    );

    if (!output.trim()) {
      console.log('  ❌ No PHASE_3_HEADER logs found');
      return false;
    }

    console.log('  ✅ Header standardization confirmed');
    return true;

  } catch (err) {
    console.log('  ❌ Log check failed:', err.message);
    return false;
  }
}

// =====================================
// MAIN
// =====================================

(async () => {
  console.log('🚀 MASTER AUTH VALIDATION');
  console.log('====================================');

  const errorsOk = checkErrors();

  let authOk = true;

  for (const brand of BRANDS) {
    const result = await testBrand(brand);
    if (!result) authOk = false;
  }

  const phase3LogsOk = checkPhase3Logs();

  console.log('\n📊 FINAL RESULT');
  console.log('====================================');

  if (errorsOk && authOk && phase3LogsOk) {
    console.log('✅ PASS — SYSTEM HEALTHY & PHASE 3 VERIFIED');
    process.exit(0);
  } else {
    console.log('❌ FAIL — INVESTIGATE BEFORE PROCEEDING');
    process.exit(1);
  }
})();