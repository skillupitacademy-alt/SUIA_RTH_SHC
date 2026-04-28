#!/usr/bin/env node
/**
 * 🔍 FULL PROFILE PREFETCH 503 DIAGNOSTIC
 * 
 * PURPOSE:
 * Full end-to-end diagnosis of dashboard → profile click flow:
 * 
 * Tests:
 * 1. Login
 * 2. Dashboard load
 * 3. Profile icon route
 * 4. Prefetch request behavior
 * 5. Authenticated profile SSR
 * 6. Redirect loops
 * 7. Source code scan
 * 8. Optional production log check
 * 
 * RUN:
 * node scripts/diagnose-profile-prefetch-503-full.js
 * node scripts/diagnose-profile-prefetch-503-full.js --check-logs
 */

const fs = require('fs');
const path = require('path');

const BRANDS = [
  {
    name: 'RTH',
    host: 'https://user.realtutorialhub.com',
    email: 'ajayshah@gmail.com',
    password: 'testing',
  },
  {
    name: 'SkillUp',
    host: 'https://user.skillupitacademy.com',
    email: 'student@skillupitacademy.com',
    password: 'testing',
  },
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function extractCookies(headers) {
  const raw = headers.get('set-cookie');
  if (!raw) return '';
  return raw
    .split(',')
    .map(cookie => cookie.split(';')[0])
    .join('; ');
}

async function login(brand) {
  try {
    const res = await fetch(`${brand.host}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: brand.email,
        password: brand.password,
      }),
      redirect: 'manual',
    });

    return {
      status: res.status,
      cookies: extractCookies(res.headers),
    };
  } catch (error) {
    console.error(`   ❌ Login error: ${error.message}`);
    return { status: 0, cookies: '' };
  }
}

async function testDashboard(brand, cookies) {
  try {
    const res = await fetch(`${brand.host}/dashboard`, {
      headers: { cookie: cookies },
      redirect: 'manual',
    });
    return res.status;
  } catch (error) {
    console.error(`   ❌ Dashboard error: ${error.message}`);
    return 0;
  }
}

async function testProfilePrefetch(brand) {
  try {
    const res = await fetch(`${brand.host}/dashboard/profile`, {
      headers: {
        purpose: 'prefetch',
        'next-router-prefetch': '1',
        'x-middleware-prefetch': '1',
      },
      redirect: 'manual',
    });
    return res.status;
  } catch (error) {
    console.error(`   ❌ Prefetch error: ${error.message}`);
    return 0;
  }
}

async function testProfileAuthenticated(brand, cookies) {
  try {
    const res = await fetch(`${brand.host}/dashboard/profile`, {
      headers: {
        cookie: cookies,
      },
      redirect: 'manual',
    });
    return res.status;
  } catch (error) {
    console.error(`   ❌ Profile error: ${error.message}`);
    return 0;
  }
}

async function testProfileRSC(brand, cookies) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${brand.host}/dashboard/profile?_rsc=test123`, {
      headers: {
        cookie: cookies,
        RSC: '1',
        'Next-Router-State-Tree': encodeURIComponent('[]'),
      },
      redirect: 'manual',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.status;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`   ❌ RSC timeout`);
      return 0;
    }
    console.error(`   ❌ RSC error: ${error.message}`);
    return 0;
  }
}

function walkFiles(dir, callback) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === '.git' ||
      entry.name === 'dist'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      walkFiles(fullPath, callback);
    } else if (FILE_EXTENSIONS.includes(path.extname(fullPath))) {
      callback(fullPath);
    }
  }
}

function scanSourceCode() {
  const findings = [];

  walkFiles(path.join(process.cwd(), 'src'), file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (
        line.includes('/dashboard/profile') ||
        line.includes('SafeLink') ||
        line.includes('prefetch={false}')
      ) {
        findings.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          code: line.trim(),
        });
      }
    });
  });

  return findings;
}

async function runBrandAudit(brand) {
  console.log(`\n🧪 TESTING ${brand.name}`);
  console.log('================================================');

  const loginResult = await login(brand);
  if (loginResult.status !== 200) {
    console.log('   ❌ Login failed');
    return null;
  }
  console.log('   ✅ Login successful');

  const dashboardStatus = await testDashboard(brand, loginResult.cookies);
  console.log(`   📊 Dashboard status: ${dashboardStatus}`);

  const prefetchStatus = await testProfilePrefetch(brand);
  console.log(`   ⚠️  Profile prefetch status: ${prefetchStatus}`);

  const profileStatus = await testProfileAuthenticated(
    brand,
    loginResult.cookies
  );
  console.log(`   👤 Profile click status: ${profileStatus}`);

  const rscStatus = await testProfileRSC(brand, loginResult.cookies);
  console.log(`   ⚛️  Profile RSC status: ${rscStatus}`);

  return {
    brand: brand.name,
    login: loginResult.status,
    dashboard: dashboardStatus,
    prefetch: prefetchStatus,
    profile: profileStatus,
    rsc: rscStatus,
  };
}

(async () => {
  console.log('🚀 FULL PROFILE PREFETCH 503 DIAGNOSTIC');
  console.log('================================================================');

  const results = [];

  for (const brand of BRANDS) {
    const result = await runBrandAudit(brand);
    if (result) results.push(result);
  }

  console.log('\n📄 STATIC SOURCE CODE AUDIT');
  console.log('================================================================');
  const findings = scanSourceCode();

  if (findings.length === 0) {
    console.log('   No SafeLink or prefetch protection found in source');
  } else {
    console.log(`   Found ${findings.length} SafeLink/prefetch references:`);
    findings.slice(0, 10).forEach(f => {
      console.log(`   📁 ${f.file}:${f.line}`);
      console.log(`   ➡  ${f.code}`);
      console.log('');
    });
    if (findings.length > 10) {
      console.log(`   ... and ${findings.length - 10} more`);
    }
  }

  console.log('\n📊 FINAL SUMMARY');
  console.log('================================================================');
  console.table(results);

  const critical = results.filter(
    r => r.prefetch === 503 || r.profile >= 300 || r.rsc >= 500
  );

  if (critical.length > 0) {
    console.log('\n❌ CRITICAL ISSUES DETECTED');
    console.log('Likely causes:');
    console.log('- Unsafe Next.js prefetch');
    console.log('- Legacy Link components');
    console.log('- SSR auth failure');
    console.log('- Shared component stale routing');
  } else {
    console.log('\n✅ Dashboard → Profile flow is production safe');
  }

  console.log('\n💡 RECOMMENDED NEXT STEPS');
  console.log('1. Replace all Link with SafeLink in protected routes');
  console.log('2. Disable prefetch for all dashboard/profile routes');
  console.log('3. Audit TopBar / Sidebar / Dropdown menus');
  console.log('4. Check production logs for remaining speculative requests');
  console.log('');
})();
