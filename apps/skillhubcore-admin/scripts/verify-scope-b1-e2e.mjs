import { spawn } from 'child_process';
import { chromium, request as pwRequest } from 'playwright';
import { SignJWT } from 'jose';
import * as fs from 'fs';
import * as path from 'path';

// 1. Read secrets strictly from environment or .env.local (no static fallback)
const envLocalPath = path.resolve('apps/skillhubcore-admin/.env.local');
let adminJwtSecret = process.env.ADMIN_JWT_SECRET;
if (!adminJwtSecret && fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const match = content.match(/ADMIN_JWT_SECRET="([^"]+)"/);
  if (match) adminJwtSecret = match[1];
}

if (!adminJwtSecret || adminJwtSecret.length < 32) {
  throw new Error('FATAL: Valid ADMIN_JWT_SECRET is missing. It must be provided in apps/skillhubcore-admin/.env.local or process.env.');
}

const secretKey = new TextEncoder().encode(adminJwtSecret);
const wrongKey = new TextEncoder().encode('wrong-attacker-secret-key-at-least-32-chars!!');

async function createToken(overrides = {}, key = secretKey) {
  const payload = {
    sub: 'admin-1',
    originalUserId: 'admin-1',
    shadowUserId: 'admin-1',
    email: 'admin@skillhubcore.in',
    roles: ['admin'],
    tokenType: 'admin',
    brand: 'skillhubcore',
    aud: 'shc-admin',
    iss: 'skillhubcore.in',
    isAdmin: true,
    ...overrides,
  };

  let b = new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt();
  if (overrides.exp !== undefined) {
    b = b.setExpirationTime(overrides.exp);
  } else {
    b = b.setExpirationTime('2h');
  }
  return b.sign(key);
}

const PORT = 3007;
const BASE_URL = `http://skillhubcore.localhost:${PORT}`;

async function checkRunningServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return true;
  } catch {
    // not running
  }
  return false;
}

async function waitForServer(maxWaitMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await checkRunningServer()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${BASE_URL} failed to respond within ${maxWaitMs}ms`);
}

async function run() {
  console.log('================================================================');
  console.log('SHC Admin Scope B1 Final Closure — Real HTTP & Chromium Verification');
  console.log('Target Server URL:', BASE_URL);
  console.log('Target Hostname: skillhubcore.localhost:3007 (Normal SHC local target)');
  console.log('================================================================\n');

  // Generate test tokens
  const adminToken = await createToken({ roles: ['admin'] });
  const studentToken = await createToken({ roles: ['student'], isAdmin: false });
  const expiredToken = await createToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
  const wrongIssuerToken = await createToken({ iss: 'untrusted-issuer.example.com' });
  const wrongKeyToken = await createToken({}, wrongKey);

  let spawnedProcess = null;
  const isAlreadyRunning = await checkRunningServer();
  if (!isAlreadyRunning) {
    console.log('[1/4] Spawning local Next.js server on port', PORT, '...');
    spawnedProcess = spawn('pnpm', ['--filter', '@quiz/skillhubcore-admin', 'exec', 'next', 'start', '-p', String(PORT)], {
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'production',
        SHC_ADMIN_ORIGIN: BASE_URL,
        DATABASE_URL: 'postgresql://mock:mock@localhost:5432/mock_test',
        ADMIN_JWT_SECRET: adminJwtSecret,
      },
      shell: true,
      stdio: 'ignore',
    });
    await waitForServer();
    console.log('[1/4] Server is healthy and listening at', BASE_URL, '\n');
  } else {
    console.log('[1/4] Attached to existing SHC Admin server at', BASE_URL, '\n');
  }

  const testResults = [];
  function recordTest(id, name, passed, details = '') {
    testResults.push({ id, name, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${mark}] ${id}: ${name} ${details ? '(' + details + ')' : ''}`);
  }

  try {
    // 2. Real HTTP Tests via Playwright Request Context (Workstream B & Task 13)
    console.log('[2/4] Executing Real HTTP Loopback Tests on http://skillhubcore.localhost:3007...');
    const apiContext = await pwRequest.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
      maxRedirects: 0, // capture raw redirect status codes
      timeout: 60000,
    });

    // Test 7.1: GET unauthenticated /dashboard
    {
      const res = await apiContext.get('/dashboard');
      const status = res.status();
      const location = res.headers()['location'] || '';
      const cacheControl = res.headers()['cache-control'] || '';
      recordTest(
        'Task 7.1',
        'HTTP GET /dashboard unauthenticated',
        status === 307 && location.includes('/login') && cacheControl.includes('private, no-store'),
        `Status ${status}, Location: ${location}`
      );
    }

    // Test 7.2: GET unauthenticated /marketing
    {
      const res = await apiContext.get('/marketing');
      const status = res.status();
      const location = res.headers()['location'] || '';
      recordTest(
        'Task 7.2',
        'HTTP GET /marketing unauthenticated',
        status === 307 && location.includes('/login?redirect=%2Fmarketing'),
        `Status ${status}, Location: ${location}`
      );
    }

    // Test 7.3: GET authenticated admin /dashboard
    {
      const res = await apiContext.get('/dashboard', {
        headers: { cookie: `accessToken=${adminToken}` },
      });
      const status = res.status();
      const cacheControl = res.headers()['cache-control'] || '';
      recordTest(
        'Task 7.3',
        'HTTP GET /dashboard with valid admin token',
        status === 200 && cacheControl.includes('no-store'),
        `Status ${status}, Cache-Control: ${cacheControl}`
      );
    }

    // Test 8: HEAD request on protected page
    {
      const res = await apiContext.head('/dashboard');
      const status = res.status();
      const location = res.headers()['location'] || '';
      const body = await res.body();
      recordTest(
        'Task 8',
        'HTTP HEAD /dashboard unauthenticated',
        status === 307 && location.includes('/login') && body.length === 0,
        `Status ${status}, Body length: ${body.length}`
      );
    }

    // Test 9: React Server Component payload request (RSC: 1)
    {
      const res = await apiContext.get('/questions', {
        headers: { rsc: '1' },
      });
      const status = res.status();
      const location = res.headers()['location'] || '';
      recordTest(
        'Task 9',
        'HTTP GET /questions with RSC header (rsc: 1)',
        status === 307 && location.includes('/login'),
        `Status ${status}`
      );
    }

    // Test 10: Router prefetch request (Next-Router-Prefetch: 1)
    {
      const res = await apiContext.get('/tools/project-llm', {
        headers: { 'next-router-prefetch': '1' },
      });
      const status = res.status();
      const location = res.headers()['location'] || '';
      recordTest(
        'Task 10',
        'HTTP GET /tools/project-llm with prefetch header',
        status === 307 && location.includes('/login'),
        `Status ${status}`
      );
    }

    // Test 11.1: Dynamic route with .js extension (/users/account.js)
    {
      const res = await apiContext.get('/users/account.js');
      const status = res.status();
      const location = res.headers()['location'] || '';
      recordTest(
        'Task 11.1',
        'HTTP GET /users/account.js unauthenticated (dynamic .js extension)',
        status === 307 && location.includes('/login'),
        `Status ${status}`
      );
    }

    // Test 11.2: Dynamic route /subscriptions/example.js
    {
      const res = await apiContext.get('/subscriptions/example.js');
      const status = res.status();
      recordTest(
        'Task 11.2',
        'HTTP GET /subscriptions/example.js unauthenticated',
        status === 307,
        `Status ${status}`
      );
    }

    // Test 12: Forged client header (x-shc-pathname: /dashboard) on unauthenticated /marketing
    {
      const res = await apiContext.get('/marketing', {
        headers: { 'x-shc-pathname': '/dashboard' },
      });
      const status = res.status();
      const location = res.headers()['location'] || '';
      // Must NOT be tricked by forged header; must redirect based on true path /marketing
      recordTest(
        'Task 12',
        'Client-forged x-shc-pathname header injection defeated',
        status === 307 && location.includes('redirect=%2Fmarketing'),
        `Redirected to true path ${location}`
      );
    }

    // Test 13: Direct /forbidden page HTTP status (200 HTML with 403 content)
    {
      const res = await apiContext.get('/forbidden');
      const status = res.status();
      const text = await res.text();
      recordTest(
        'Task 13',
        'HTTP GET /forbidden direct outcome page',
        status === 200 && (text.includes('Access Denied') || text.includes('403') || text.includes('Forbidden')),
        `Status ${status}`
      );
    }

    // Negative JWT Tests (Task 20)
    {
      const resExpired = await apiContext.get('/dashboard', { headers: { cookie: `accessToken=${expiredToken}` } });
      recordTest('Task 20.1', 'JWT expired token rejection', resExpired.status() === 307, `Status ${resExpired.status()}`);

      const resIssuer = await apiContext.get('/dashboard', { headers: { cookie: `accessToken=${wrongIssuerToken}` } });
      recordTest('Task 20.2', 'JWT untrusted issuer rejection', resIssuer.status() === 307, `Status ${resIssuer.status()}`);

      const resKey = await apiContext.get('/dashboard', { headers: { cookie: `accessToken=${wrongKeyToken}` } });
      recordTest('Task 20.3', 'JWT forged secret key rejection', resKey.status() === 307, `Status ${resKey.status()}`);
    }

    // Real BFF Logout Tests (Task 15.1 & 15.2)
    {
      const resUntrusted = await apiContext.post('/api/auth/logout', {
        headers: { origin: 'https://attacker.example.com' },
      });
      recordTest(
        'Task 15.1',
        'HTTP POST /api/auth/logout with untrusted origin rejected',
        resUntrusted.status() === 403,
        `Status ${resUntrusted.status()}`
      );

      const resLogout = await apiContext.post('/api/auth/logout', {
        headers: { origin: BASE_URL, cookie: `accessToken=${adminToken}` },
      });
      const setCookies = resLogout.headers()['set-cookie'] || '';
      const hasClearance = setCookies.includes('accessToken=') && (setCookies.includes('Max-Age=0') || setCookies.includes('Expires=Thu, 01 Jan 1970'));
      recordTest(
        'Task 15.2',
        'HTTP POST /api/auth/logout BFF expires admin cookies',
        (resLogout.status() === 200 || resLogout.status() === 502) && hasClearance,
        `Status ${resLogout.status()}, Set-Cookie includes clearance: ${hasClearance}`
      );
    }

    // 3. Headless Chromium Browser Verification (Tasks 13–17)
    console.log('\n[3/4] Launching Headless Chromium Browser (Tasks 13–17)...');
    const browser = await chromium.launch({ headless: true });

    // Browser Test 14.1: Direct browser navigation unauthenticated -> redirected to /login
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit' }).catch(() => {});
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
      const url = page.url();
      recordTest(
        'Task 14.1',
        'Chromium unauthenticated navigation to /dashboard',
        url.includes('/login'),
        `Final URL: ${url}`
      );
      await context.close();
    }

    // Browser Test 14.2: Direct browser navigation with admin cookie to /dashboard
    {
      const context = await browser.newContext();
      await context.addCookies([
        { name: 'accessToken', value: adminToken, domain: 'skillhubcore.localhost', path: '/' },
      ]);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit' });
      await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 10000 });
      const url = page.url();
      recordTest(
        'Task 14.2',
        'Chromium authenticated admin navigation to /dashboard',
        url.includes('/dashboard'),
        `Final URL: ${url}`
      );
      await context.close();
    }

    // Browser Test 14.3: Forbidden student cookie -> redirected to /forbidden
    {
      const context = await browser.newContext();
      await context.addCookies([
        { name: 'accessToken', value: studentToken, domain: 'skillhubcore.localhost', path: '/' },
      ]);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit' }).catch(() => {});
      await page.waitForURL((url) => url.pathname.includes('/forbidden'), { timeout: 10000 });
      const url = page.url();
      recordTest(
        'Task 14.3',
        'Chromium student cookie navigation to /dashboard -> /forbidden',
        url.includes('/forbidden'),
        `Final URL: ${url}`
      );
      await context.close();
    }

    // Browser Test 16.1: Logout / Back button protection via cookie clearance
    {
      const context = await browser.newContext();
      await context.addCookies([
        { name: 'accessToken', value: adminToken, domain: 'skillhubcore.localhost', path: '/' },
      ]);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit' });

      // Clear cookies (simulating client-side drop)
      await context.clearCookies();

      // Attempt fresh navigation to /dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit' }).catch(() => {});
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
      const urlAfterLogout = page.url();
      recordTest(
        'Task 16.1',
        'Chromium logout and back-navigation protection (client clearance)',
        urlAfterLogout.includes('/login'),
        `URL after cookie cleared: ${urlAfterLogout}`
      );
      await context.close();
    }

    // Browser Test 16.2: Real Browser Logout via BFF endpoint & server Set-Cookie clearance
    {
      const context = await browser.newContext();
      await context.addCookies([
        { name: 'accessToken', value: adminToken, domain: 'skillhubcore.localhost', path: '/' },
      ]);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit' });
      await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 10000 });

      // Execute real BFF logout via browser request context (browser receives Set-Cookie Max-Age=0)
      const logoutRes = await page.request.post(`${BASE_URL}/api/auth/logout`, {
        headers: { origin: BASE_URL },
      });

      // Attempt navigation to /dashboard again - browser must be unauthenticated now
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'commit' }).catch(() => {});
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
      const finalUrl = page.url();

      recordTest(
        'Task 16.2',
        'Chromium real BFF /api/auth/logout roundtrip & browser cookie invalidation',
        finalUrl.includes('/login'),
        `Logout status: ${logoutRes.status()}, Final URL: ${finalUrl}`
      );
      await context.close();
    }

    await browser.close();
    console.log('[3/4] Headless Chromium browser tests completed successfully.\n');

  } finally {
    if (spawnedProcess) {
      console.log('[4/4] Shutting down spawned Next.js server...');
      spawnedProcess.kill();
      await new Promise((r) => setTimeout(r, 1000));
      console.log('[4/4] Next.js server terminated.\n');
    } else {
      console.log('[4/4] Preserved external development server on port 3007 untouched.\n');
    }
  }

  // Summary
  console.log('================================================================');
  console.log('FINAL CLOSURE TEST SUMMARY');
  console.log('Total Integration Tests Executed:', testResults.length);
  const passedCount = testResults.filter((t) => t.passed).length;
  console.log(`Passed: ${passedCount} / ${testResults.length}`);
  console.log('================================================================');

  if (passedCount !== testResults.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
