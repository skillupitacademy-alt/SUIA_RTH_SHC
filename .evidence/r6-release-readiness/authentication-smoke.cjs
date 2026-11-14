const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const dotenv = require('dotenv');

const root = path.resolve(__dirname, '../..');
const env = dotenv.parse(fs.readFileSync(path.join(root, '.env.auth-qualification.local')));
const shcControl = process.env.R6_SHC_REPLAY_CONTROL === 'true';
const output = path.join(__dirname, shcControl ? 'SHC_REPLAY_CONTROL.json' : 'AUTHENTICATED_LOCALHOST_RESULTS.json');
const report = {
  startedUtc: new Date().toISOString(),
  mode: 'Existing approved identities, localhost UI login and single-session logout only',
  originalHarness: { exitCode: 1, discovered: 0, outcome: 'Collection failed before execution; safe reporter suppressed detailed diagnostics' },
  results: [],
};
const fixtures = [
  { brand: 'skillup', origin: 'http://skillup.localhost:3009', prefix: 'TEST_SUIA_LEARNER' },
  { brand: 'realtutorialhub', origin: 'http://realtutorialhub.localhost:3003', prefix: 'TEST_RTH_LEARNER' },
  { brand: 'skillhubcore', origin: 'http://skillhubcore.localhost:3007', prefix: 'TEST_SHC_ADMIN' },
];
const origins = new Set(fixtures.map(f => f.origin));
function save() {
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
}
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const fixture of fixtures) {
      if (shcControl && fixture.brand !== 'skillhubcore') continue;
      const record = { brand: fixture.brand, origin: fixture.origin, credentialReferenceAvailable: false };
      report.results.push(record);
      const email = env[`${fixture.prefix}_EMAIL`];
      const password = env[`${fixture.prefix}_PASSWORD`];
      if (!email || !password) {
        record.outcome = 'BLOCKED_MISSING_CREDENTIAL_REFERENCE';
        save();
        continue;
      }
      record.credentialReferenceAvailable = true;
      const context = await browser.newContext({ serviceWorkers: 'block' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        return origins.has(url.origin) ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      const session = { cookies: [], loggedIn: false };
      const request = async (route, method = 'GET') => {
        const csrf = (await context.cookies(fixture.origin)).find(c => c.name === 'csrfToken')?.value;
        return context.request.fetch(fixture.origin + route, {
          method, timeout: 45000, maxRedirects: 0,
          headers: { origin: fixture.origin, ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        });
      };
      const ownRoute = fixture.brand === 'skillhubcore' ? '/api/admin/auth/me' : '/api/profile';
      try {
        record.anonymousPrivateStatus = (await request(ownRoute)).status();
        await page.goto(fixture.origin + '/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.locator('input[type="email"]').first().fill(email);
        await page.locator('input[type="password"]').first().fill(password);
        const loginResponse = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/auth/login', { timeout: 60000 });
        await page.locator('button[type="submit"]').first().click();
        const response = await loginResponse;
        record.loginStatus = response.status();
        if (response.ok()) {
          session.loggedIn = true;
          await page.waitForURL(url => url.pathname !== '/login', { timeout: 30000 }).catch(() => {});
          record.landingPath = new URL(page.url()).pathname;
          session.cookies = await context.cookies(fixture.origin);
          record.accessCookieEstablished = session.cookies.some(c => c.name === 'accessToken');
          record.refreshCookieEstablished = session.cookies.some(c => c.name === 'refreshToken');
          const access = session.cookies.find(c => c.name === 'accessToken')?.value;
          if (access) {
            try {
              const payload = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString());
              record.tokenBrandMatches = payload.brand === fixture.brand;
              record.distinctPersonClaim = typeof payload.shadowUserId === 'string' && payload.shadowUserId !== payload.userId;
              // These comparisons describe token claims. The authenticated endpoints
              // below provide the independent server acceptance evidence.
            } catch { record.claimInspection = 'UNAVAILABLE'; }
          }
          const own = await request(ownRoute);
          record.authenticatedPrivateStatus = own.status();
          if (own.ok()) {
            const body = await own.json().catch(() => null);
            const principal = body?.data?.user ?? body?.user ?? body?.data ?? body;
            record.ownEmailMatches = typeof principal?.email === 'string' && principal.email.trim().toLowerCase() === email.trim().toLowerCase();
          }
          const dashboard = await request('/dashboard');
          record.dashboardStatus = dashboard.status();
          record.dashboardRedirectPath = dashboard.headers().location ? new URL(dashboard.headers().location, fixture.origin).pathname : null;
          if (fixture.brand === 'skillhubcore') {
            record.adminReadStatus = (await request('/api/admin/domains')).status();
          } else {
            const foreign = fixtures.find(f => f.brand !== fixture.brand && f.brand !== 'skillhubcore');
            const foreignContext = await browser.newContext();
            try {
              await foreignContext.addCookies(session.cookies.filter(c => ['accessToken', 'refreshToken', 'csrfToken'].includes(c.name)).map(c => ({ ...c, domain: new URL(foreign.origin).hostname })));
              record.foreignPrivateStatus = (await foreignContext.request.get(foreign.origin + '/api/profile', { timeout: 45000, maxRedirects: 0 })).status();
            } finally { await foreignContext.close(); }
          }
        }
      } catch (error) {
        record.errorCategory = error?.name === 'TimeoutError' ? 'TIMEOUT' : 'SANITIZED_RUNTIME_ERROR';
      } finally {
        if (session.loggedIn) {
          try {
            record.logoutStatus = (await request('/api/auth/logout', 'POST')).status();
            record.afterLogoutPrivateStatus = (await request(ownRoute)).status();
            const remaining = await context.cookies(fixture.origin);
            record.authCookiesCleared = !remaining.some(c => ['accessToken', 'admin_accessToken', 'refreshToken'].includes(c.name));
            const replay = await browser.newContext();
            try {
              await replay.addCookies(session.cookies);
              record.revokedSessionReplayStatus = (await replay.request.get(fixture.origin + ownRoute, { timeout: 45000, maxRedirects: 0 })).status();
              if (fixture.brand === 'skillhubcore') {
                record.revokedSessionAdminReadStatus = (await replay.request.get(fixture.origin + '/api/admin/domains', { timeout: 45000, maxRedirects: 0 })).status();
              }
            } finally { await replay.close(); }
          } catch { record.logoutOutcome = 'UNVERIFIED'; }
        }
        await context.close();
        save();
        console.log(JSON.stringify(record));
      }
    }
  } finally {
    await browser.close();
    report.finishedUtc = new Date().toISOString();
    save();
  }
}
main().catch(() => {
  report.fatal = 'SANITIZED_RUN_FAILURE';
  save();
  process.exitCode = 1;
});
