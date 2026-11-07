import { chromium } from 'playwright';

// Credentials are injected only at the authorized UAT invocation; never commit values.
function requireUatCredential(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`Missing required UAT credential binding: ${name}`);
  return value;
}


async function runBrowserQualification() {
  console.log('--- STARTING PLAYWRIGHT PHYSICAL BROWSER QUALIFICATION ---');
  const browser = await chromium.launch({ headless: true });

  const results = {
    suiaStudentLogin: false,
    suiaAdminLogin: false,
    rthStudentLogin: false,
    accountSwitching: false,
    tenantCookieBoundary: false,
    serviceWorkerCacheExclusion: false,
    details: [],
  };

  try {
    // 1. SUIA Student Login Test
    console.log('[Test 1] Testing SUIA Student Login (http://skillup.localhost:3009/login)...');
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    await studentPage.goto('http://skillup.localhost:3009/login', { waitUntil: 'networkidle' });
    await studentPage.fill('input[name="email"]', requireUatCredential('UAT_SUIA_STUDENT_EMAIL'));
    await studentPage.fill('input[name="password"]', requireUatCredential('UAT_SUIA_STUDENT_PASSWORD'));
    
    await studentPage.click('button:has-text("Sign In")');
    await studentPage.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => null);

    const suiaStudentUrl = studentPage.url();
    const studentCookies = await studentContext.cookies();
    const hasStudentToken = studentCookies.some(c => c.name.includes('token') || c.name.includes('session') || c.name.includes('auth') || c.name.includes('jwt'));
    
    console.log('  SUIA Student destination URL:', suiaStudentUrl);
    console.log('  SUIA Student cookies observed:', studentCookies.map(c => c.name));
    results.details.push({
      test: 'SUIA Student Login',
      destinationUrl: suiaStudentUrl,
      cookieNames: studentCookies.map(c => c.name),
      success: !suiaStudentUrl.includes('/login') || hasStudentToken,
    });
    results.suiaStudentLogin = !suiaStudentUrl.includes('/login') || hasStudentToken;

    // 2. Tenant Boundary & Cookie Isolation Check (RC-ID-01 / G2)
    // Pass SUIA session to RTH domain and ensure no cross-brand bleed
    console.log('[Test 2] Testing Tenant Boundary & Cross-Brand Session Bleed...');
    const rthPageCross = await studentContext.newPage();
    await rthPageCross.goto('http://realtutorialhub.localhost:3003/dashboard', { waitUntil: 'networkidle' });
    const crossUrl = rthPageCross.url();
    const rthCookiesForStudent = await studentContext.cookies('http://realtutorialhub.localhost:3003');
    const crossBrandIsolated = crossUrl.includes('/login') || rthCookiesForStudent.length === 0;
    console.log('  RTH response when presenting SUIA context:', crossUrl);
    console.log('  RTH cookies scoped to student:', rthCookiesForStudent.map(c => c.name));
    results.details.push({
      test: 'Tenant Cookie Boundary (RC-ID-01)',
      crossUrl,
      isolated: crossBrandIsolated,
    });
    results.tenantCookieBoundary = crossBrandIsolated;
    await studentContext.close();

    // 3. RTH Student Login Test
    console.log('[Test 3] Testing RTH Student Login (http://realtutorialhub.localhost:3003/login)...');
    const rthContext = await browser.newContext();
    const rthPage = await rthContext.newPage();
    await rthPage.goto('http://realtutorialhub.localhost:3003/login', { waitUntil: 'networkidle' });
    await rthPage.fill('input[name="email"]', requireUatCredential('UAT_RTH_STUDENT_EMAIL'));
    await rthPage.fill('input[name="password"]', requireUatCredential('UAT_RTH_STUDENT_PASSWORD'));
    
    await rthPage.click('button:has-text("Sign In")');
    await rthPage.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => null);

    const rthStudentUrl = rthPage.url();
    const rthCookies = await rthContext.cookies();
    const hasRthToken = rthCookies.some(c => c.name.includes('token') || c.name.includes('session') || c.name.includes('auth') || c.name.includes('jwt'));
    console.log('  RTH Student destination URL:', rthStudentUrl);
    console.log('  RTH Student cookies observed:', rthCookies.map(c => c.name));
    results.details.push({
      test: 'RTH Student Login',
      destinationUrl: rthStudentUrl,
      cookieNames: rthCookies.map(c => c.name),
      success: !rthStudentUrl.includes('/login') || hasRthToken,
    });
    results.rthStudentLogin = !rthStudentUrl.includes('/login') || hasRthToken;
    await rthContext.close();

    // 4. Admin Login Test
    console.log('[Test 4] Testing Admin Login (http://skillup.localhost:3009/login)...');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto('http://skillup.localhost:3009/login', { waitUntil: 'networkidle' });
    await adminPage.fill('input[name="email"]', requireUatCredential('UAT_ADMIN_EMAIL'));
    await adminPage.fill('input[name="password"]', requireUatCredential('UAT_ADMIN_PASSWORD'));

    await adminPage.click('button:has-text("Sign In")');
    await adminPage.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => null);

    const adminUrl = adminPage.url();
    const adminCookies = await adminContext.cookies();
    const hasAdminToken = adminCookies.some(c => c.name.includes('token') || c.name.includes('session') || c.name.includes('auth') || c.name.includes('jwt'));
    console.log('  Admin destination URL:', adminUrl);
    console.log('  Admin cookies observed:', adminCookies.map(c => c.name));
    results.details.push({
      test: 'Admin Login',
      destinationUrl: adminUrl,
      cookieNames: adminCookies.map(c => c.name),
      success: !adminUrl.includes('/login') || hasAdminToken,
    });
    results.suiaAdminLogin = !adminUrl.includes('/login') || hasAdminToken;
    await adminContext.close();

    // 5. Service Worker Cache API Private Storage Inspection (G6 / FND07)
    console.log('[Test 5] Verifying Service Worker Cache Exclusion of Authenticated State...');
    const swContext = await browser.newContext();
    const swPage = await swContext.newPage();
    await swPage.goto('http://skillup.localhost:3009/login', { waitUntil: 'networkidle' });
    
    // Check what CacheStorage contains
    const cacheKeys = await swPage.evaluate(async () => {
      if (!('caches' in window)) return ['NO_CACHE_API'];
      const keys = await window.caches.keys();
      return keys;
    });
    console.log('  Browser Cache Storage Keys:', cacheKeys);
    // Legacy cache 'skillup-app-shell-v1' must not exist
    const legacyCacheAbsent = !cacheKeys.includes('skillup-app-shell-v1');
    results.serviceWorkerCacheExclusion = legacyCacheAbsent;
    results.details.push({
      test: 'Service Worker Cache Safety (G6)',
      cacheKeys,
      legacyCacheAbsent,
    });
    await swContext.close();

  } finally {
    await browser.close();
  }

  console.log('--- PLAYWRIGHT BROWSER QUALIFICATION COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));
}

runBrowserQualification().catch(err => {
  console.error('Fatal Browser Qualification Failure:', err);
  process.exit(1);
});
