const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const credentials = dotenv.parse(fs.readFileSync('.env.auth-qualification.local'));
const databaseEnv = dotenv.parse(fs.readFileSync('.env.local'));
const plan = JSON.parse(fs.readFileSync('.local-secrets/r6-production-smoke-plan.json'));
const fixture = {
  skillup: { origin: 'http://skillup.localhost:3009', prefix: 'TEST_SUIA_LEARNER' },
  realtutorialhub: { origin: 'http://realtutorialhub.localhost:3003', prefix: 'TEST_RTH_LEARNER' },
  skillhubcore: { origin: 'http://skillhubcore.localhost:3007', prefix: 'TEST_SHC_ADMIN' },
};
const brand = process.env.R6_SMOKE_BRAND;
if (!fixture[brand]) throw new Error('Explicit approved brand required');
const { origin, prefix } = fixture[brand];
const email = credentials[prefix + '_EMAIL'];
const password = credentials[prefix + '_PASSWORD'];
const report = { brand, origin, startedUtc: new Date().toISOString(), boundary: 'Existing localhost frontend/BFF/gateway/API against configured protected stores after authorized PeopleDB migration', checks: [] };
const output = path.join('.evidence/r6-production-cutover', 'SMOKE-' + brand + '.json');
const save = () => fs.writeFileSync(output, JSON.stringify(report, null, 2));
const record = (name, actual, expected) => { report.checks.push({ name, actual, expected, status: expected.includes(actual) ? 'PASS' : 'FAIL' }); save(); };
async function step(name, operation) {
  try { await operation(); } catch (error) { report.checks.push({ name, status: 'BLOCKED', category: /timeout/i.test(error.message) ? 'TIMEOUT_65_SECONDS' : error.name }); save(); }
}
let browser, context, page;
async function call(route, method = 'GET', data, headers = {}) {
  const cookies = await context.cookies(origin);
  const csrf = cookies.find(cookie => cookie.name === 'csrfToken')?.value;
  return context.request.fetch(origin + route, { method, data, timeout: 65000, maxRedirects: 0, headers: { origin, ...(csrf ? { 'x-csrf-token': csrf } : {}), ...headers } });
}
async function login() {
  await page.goto(origin + '/login', { waitUntil: 'domcontentloaded', timeout: 65000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  const pending = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/auth/login', { timeout: 65000 });
  await page.locator('button[type="submit"]').first().click();
  return pending;
}
async function main() {
  if (!email || !password) throw new Error('Approved secure credential reference required');
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ serviceWorkers: 'block' });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  page = await context.newPage(); page.setDefaultTimeout(65000);
  await step('Login warmup', async () => { const response = await context.request.get(origin + '/login', { timeout: 65000 }); record('Login warmup', response.status(), [200]); });
  const own = brand === 'skillhubcore' ? '/api/admin/auth/me' : '/api/profile';
  await step('Anonymous private access', async () => record('Anonymous private access', (await call(own)).status(), [401]));
  let loggedIn = false, captured;
  try {
    const response = await login(); record('Real UI login', response.status(), [200]);
    if (!response.ok()) return;
    loggedIn = true;
    await page.waitForURL(url => url.pathname !== '/login', { timeout: 20000 }).catch(() => undefined);
    captured = await context.cookies(origin);
    record('Access and refresh cookies established', captured.some(cookie => cookie.name === 'accessToken') && captured.some(cookie => cookie.name === 'refreshToken'), [true]);
    await step('Protected own identity', async () => {
      const response = await call(own); record('Protected own identity', response.status(), [200]);
      if (response.ok()) { const body = await response.json(); const principal = body.data?.user ?? body.user ?? body.data ?? body; record('Response belongs to approved account', principal.email?.trim().toLowerCase() === email.trim().toLowerCase(), [true]); }
    });
    await step('Protected dashboard', async () => {
      const response = await page.goto(origin + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 65000 });
      record('Protected dashboard HTTP', response.status(), [200]); record('Protected dashboard path', new URL(page.url()).pathname, ['/dashboard']);
    });
    if (brand === 'skillhubcore') {
      await step('Authorized administrative API', async () => record('Authorized administrative API', (await call('/api/admin/domains')).status(), [200]));
    } else {
      const account = plan.accounts.find(account => account.brand === brand);
      await step('Own signed identity', async () => {
        const token = captured.find(cookie => cookie.name === 'accessToken')?.value;
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        record('Signed learner subject matches brand authority', payload.userId === account.userId && payload.brand === brand, [true]);
        record('Signed person claim matches stored brand link', payload.shadowUserId === account.personId, [true]);
      });
      await step('Spoofed identity headers', async () => {
        const response = await call('/api/profile', 'GET', undefined, { 'x-user-id': '00000000-0000-4000-8000-000000000099', 'x-brand': brand === 'skillup' ? 'realtutorialhub' : 'skillup' });
        if ([401, 403].includes(response.status())) record('Spoofed identity denied', response.status(), [401, 403]);
        else { const body = await response.json(); record('Spoofed headers cannot replace approved account', (body.data?.email ?? body.email)?.toLowerCase() === email.toLowerCase(), [true]); }
      });
      await step('Cross-brand access denial', async () => {
        const foreign = brand === 'skillup' ? fixture.realtutorialhub.origin : fixture.skillup.origin;
        const foreignContext = await browser.newContext();
        try {
          await foreignContext.addCookies(captured.map(cookie => ({ ...cookie, domain: new URL(foreign).hostname })));
          record('Own cookie pair denied in other brand', (await foreignContext.request.get(foreign + '/api/profile', { timeout: 65000, maxRedirects: 0 })).status(), [401, 403]);
        } finally { await foreignContext.close(); }
      });
      const selection = plan.tutorials[brand].selected[0];
      if (!selection) record('Published tutorial fixture exists', false, [true]);
      else {
        await step('Published tutorial rendering', async () => {
          const response = await page.goto(origin + selection.path, { waitUntil: 'domcontentloaded', timeout: 65000 });
          record('Published tutorial HTTP', response.status(), [200]); record('Published tutorial path retained', new URL(page.url()).pathname, [selection.path]);
          if (selection.expectedText) {
            await page.waitForFunction(expected => document.body.innerText.replace(/\s+/g, ' ').includes(expected.replace(/\s+/g, ' ')), selection.expectedText, { timeout: 15000 });
            record('Published lesson content rendered', true, [true]);
          } else record('Published text control available', false, [true]);
        });
        await step('Own tutorial progress read', async () => record('Own tutorial progress read', (await call('/api/tutorial/progress?subtopicId=' + selection.subtopicId)).status(), [200]));
      }
      await step('Own quiz result', async () => {
        const exam = account.exams.find(exam => exam.status === 'completed') || account.exams[0];
        if (!exam) { record('Existing own exam available', false, [true]); return; }
        const response = await call('/api/quiz/result?examId=' + exam.id); record('Own quiz result', response.status(), exam.status === 'completed' ? [200] : [200, 202]);
      });
      await step('Foreign exam denial', async () => {
        const other = plan.accounts.find(account => account.brand !== brand);
        const exam = other.exams[0];
        if (!exam) { record('Foreign control exam available', false, [true]); return; }
        record('Foreign quiz result denied', (await call('/api/quiz/result?examId=' + exam.id)).status(), [403, 404]);
      });
    }
  } finally {
    if (loggedIn) {
      await step('Logout', async () => record('Logout', (await call('/api/auth/logout', 'POST')).status(), [200]));
      await step('Identity after logout', async () => record('Identity after logout', (await call(own)).status(), [401]));
      await step('Captured cookie replay', async () => {
        const replay = await browser.newContext();
        try {
          await replay.addCookies(captured || []);
          record('Captured identity cookie replay denied', (await replay.request.get(origin + own, { timeout: 65000, maxRedirects: 0 })).status(), [401]);
          if (brand === 'skillhubcore') {
            record('Captured admin cookie replay denied', (await replay.request.get(origin + '/api/admin/domains', { timeout: 65000, maxRedirects: 0 })).status(), [401]);
            record('Revoked refresh cannot restore session', (await replay.request.post(origin + '/api/auth/refresh', { timeout: 65000, maxRedirects: 0, headers: { origin } })).status(), [401, 403, 404]);
          }
        } finally { await replay.close(); }
      });
      await step('Fresh login after logout', async () => {
        record('Fresh UI login after logout', (await login()).status(), [200]);
        record('Fresh session identity', (await call(own)).status(), [200]);
        record('Fresh session cleanup logout', (await call('/api/auth/logout', 'POST')).status(), [200]);
      });
    }
  }
}
main().catch(error => { report.fatal = /timeout/i.test(error.message) ? 'TIMEOUT_65_SECONDS' : error.name; }).finally(async () => {
  await context?.close(); await browser?.close(); report.finishedUtc = new Date().toISOString();
  report.status = report.fatal || report.checks.some(check => check.status !== 'PASS') ? 'FAIL_OR_BLOCKED' : 'PASS'; save();
  console.log(JSON.stringify({ brand, status: report.status, checks: report.checks, fatal: report.fatal }));
});
