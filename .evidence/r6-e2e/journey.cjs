const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');
const { Pool } = require('pg');
const state = JSON.parse(fs.readFileSync('.local-secrets/r6-e2e-runtime.json'));
const brand = process.env.R6_E2E_BRAND;
const fixture = state.fixtures.find(f => f.brand === brand);
if (!fixture) throw new Error('Explicit synthetic brand fixture required');
const origin = state.origins[brand];
const report = { brand, origin, startedUtc: new Date().toISOString(), boundary: 'Actual isolated Next UI/BFF, existing gateway, backend and disposable PostgreSQL schemas', checks: [] };
const file = '.evidence/r6-e2e/JOURNEY-' + brand + '.json';
const save = () => fs.writeFileSync(file, JSON.stringify(report, null, 2));
const record = (check, actual, allowed, detail = {}) => {
  const pass = allowed.includes(actual);
  report.checks.push({ check, actual, expected: allowed, status: pass ? 'PASS' : 'FAIL', ...detail }); save();
};
let browser, context;
async function request(route, method = 'GET', data, extra = {}) {
  const csrf = (await context.cookies(origin)).find(c => c.name === 'csrfToken')?.value;
  return context.request.fetch(origin + route, {
    method, ...(data === undefined ? {} : { data }), maxRedirects: 0, timeout: 65000,
    headers: { origin, ...(csrf ? { 'x-csrf-token': csrf } : {}), ...extra },
  });
}
async function step(name, fn) {
  try { await fn(); } catch (e) { report.checks.push({ check: name, status: 'BLOCKED', category: e.name === 'TimeoutError' ? 'TIMEOUT_65_SECONDS' : 'SANITIZED_RUNTIME_FAILURE' }); save(); }
}
async function main() {
  const net = require('node:net');
  const deadline = Date.now() + 65000;
  let listening = false;
  while (!listening && Date.now() < deadline) {
    listening = await new Promise(resolve => {
      const socket = net.connect({ host: '127.0.0.1', port: Number(new URL(origin).port) });
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => resolve(false));
    });
    if (!listening) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!listening) throw new Error('Isolated process did not start');
  if (brand !== 'skillhubcore') {
    const main = new Pool({ connectionString: state.databases.main, max: 1 });
    main.on('error', () => undefined);
    try {
      const identity = (await main.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch")).rows[0];
      if (identity.database !== state.run + '_main' || identity.branch !== 'br-young-silence-a1b1ta26') throw new Error('Unexpected fixture target');
      const id = crypto.randomUUID();
      await main.query("INSERT INTO exams(id,user_id,status,duration_seconds) VALUES($1,$2,'started',3600)", [id, fixture.id]);
      await main.query('INSERT INTO exam_questions(exam_id,question_id,"order") VALUES($1,$2,1)', [id, state.questionId]);
      state.examIds[brand] = id;
      fs.writeFileSync('.local-secrets/r6-e2e-runtime.json', JSON.stringify(state, null, 2));
      report.freshSyntheticExam = true;
    } finally { await main.end(); }
  }
  try {
    const warm = await fetch(origin + '/login', { signal: AbortSignal.timeout(65000), redirect: 'manual' });
    await warm.arrayBuffer(); record('Login-page warmup', warm.status, [200]);
  } catch {
    report.checks.push({ check: 'Login-page warmup', status: 'BLOCKED', category: 'TIMEOUT_65_SECONDS' }); save();
  }
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ serviceWorkers: 'block' });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === origin ? route.continue() : route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(65000);
  const own = brand === 'skillhubcore' ? '/api/admin/auth/me' : '/api/profile';
  let loggedIn = false, captured = [];
  try {
    await step('Anonymous denial', async () => record('Anonymous private request', (await request(own)).status(), [401]));
    await page.goto(origin + '/login', { waitUntil: 'domcontentloaded', timeout: 65000 });
    await page.locator('input[type="email"]').first().fill(fixture.email);
    await page.locator('input[type="password"]').first().fill(fixture.password);
    const pending = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/auth/login', { timeout: 65000 });
    await page.locator('button[type="submit"]').first().click();
    const login = await pending;
    record('Real login form', login.status(), [200]);
    loggedIn = login.ok();
    if (!loggedIn) return;
    await page.waitForURL(u => u.pathname !== '/login', { timeout: 20000 }).catch(() => undefined);
    captured = await context.cookies(origin);
    record('Access and refresh cookies established', captured.some(c => c.name === 'accessToken') && captured.some(c => c.name === 'refreshToken'), [true]);
    await step('Own identity', async () => {
      const response = await request(own); record('Own profile or identity', response.status(), [200]);
      if (response.ok()) { const body = await response.json(); const principal = body.data?.user ?? body.user ?? body.data ?? body; record('Returned own account', principal.email?.trim().toLowerCase() === fixture.email.trim().toLowerCase(), [true]); }
    });
    await step('Protected dashboard', async () => {
      const response = await page.goto(origin + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 65000 });
      record('Protected dashboard page', response?.status(), [200]);
      record('Dashboard URL retained', new URL(page.url()).pathname, ['/dashboard']);
    });
    if (brand === 'skillhubcore') {
      await step('Authorized admin API', async () => record('Authorized domains API', (await request('/api/admin/domains')).status(), [200]));
    } else {
      await step('Spoofed headers', async () => {
        const response = await request('/api/profile', 'GET', undefined, { 'x-user-id': crypto.randomUUID(), 'x-brand': brand === 'skillup' ? 'realtutorialhub' : 'skillup' });
        if ([401, 403].includes(response.status())) record('Spoofed client identity or brand', response.status(), [401, 403]);
        else { const body = await response.json(); record('Spoofed headers do not replace account', body.email === fixture.email || body.data?.email === fixture.email, [true]); }
      });
      await step('Foreign brand gateway denial', async () => {
        const foreign = brand === 'skillup' ? 'realtutorialhub' : 'skillup';
        const response = await context.request.get(`http://127.0.0.1:${state.ports.gateway}/api/auth/me`, {
          timeout: 65000, maxRedirects: 0,
          headers: {
            cookie: captured.map(c => c.name + '=' + c.value).join('; '),
            origin: state.origins[foreign], 'x-original-host': new URL(state.origins[foreign]).hostname,
            'x-internal-secret': state.runtimeEnv.INTERNAL_GATEWAY_SECRET,
          },
        });
        record('Valid cookie pair denied in foreign brand context', response.status(), [401, 403]);
      });
      await step('Canonical tutorial', async () => {
        const response = await page.goto(origin + state.tutorialPath, { waitUntil: 'domcontentloaded', timeout: 65000 });
        record('Canonical tutorial page', response?.status(), [200]);
        record('Canonical tutorial URL retained', new URL(page.url()).pathname === state.tutorialPath, [true]);
      });
      await step('Progress write', async () => record('Own progress write', (await request('/api/tutorial/progress', 'POST', { subtopicId: state.ids.subtopics, blockType: 'notes', status: 'viewed' })).status(), [200]));
      await step('Progress read', async () => record('Own progress read', (await request('/api/tutorial/progress?subtopicId=' + state.ids.subtopics)).status(), [200]));
      const tutorial = new Pool({ connectionString: state.databases.tutorial, max: 1 }); tutorial.on('error', () => undefined);
      try {
        const rows = (await tutorial.query('SELECT user_id,tenant_id,blocks_completed FROM tutorial_progress WHERE user_id=$1 AND subtopic_id=$2', [fixture.id, state.ids.subtopics])).rows;
        record('Progress persisted under learner and tenant', rows.some(r => r.tenant_id === brand && r.blocks_completed.includes('notes')), [true]);
      } finally { await tutorial.end(); }
      await step('Foreign exam owner denial', async () => {
        const other = brand === 'skillup' ? 'realtutorialhub' : 'skillup';
        record('Foreign exam submit denied', (await request('/api/quiz/submit', 'POST', { examId: state.examIds[other] })).status(), [403, 404]);
      });
      await step('Own exam result', async () => record('Own started exam result', (await request('/api/quiz/result?examId=' + state.examIds[brand])).status(), [200, 202]));
      await step('Own populated exam answer', async () => record('Own question answer', (await request('/api/quiz/answer', 'POST', { examId: state.examIds[brand], questionId: state.questionId, answer: 'A' })).status(), [200]));
      await step('Own quiz submit', async () => record('Own exam submit', (await request('/api/quiz/submit', 'POST', { examId: state.examIds[brand] })).status(), [200, 202]));
      const main = new Pool({ connectionString: state.databases.main, max: 1 }); main.on('error', () => undefined);
      try { const row = (await main.query('SELECT user_id,status FROM exams WHERE id=$1', [state.examIds[brand]])).rows[0]; record('Exam persisted under correct learner', row.user_id === fixture.id && ['processing', 'completed'].includes(row.status), [true]); } finally { await main.end(); }
    }
  } finally {
    if (loggedIn) {
      await step('Logout', async () => record('Logout HTTP', (await request('/api/auth/logout', 'POST')).status(), [200]));
      await step('After logout denial', async () => record('Profile after logout', (await request(own)).status(), [401]));
      await step('Captured credentials replay', async () => {
        const replay = await browser.newContext();
        try {
          await replay.addCookies(captured);
          record('Captured pre-logout identity replay', (await replay.request.get(origin + own, { timeout: 65000, maxRedirects: 0 })).status(), [401]);
          if (brand === 'skillhubcore') record('Captured pre-logout admin replay', (await replay.request.get(origin + '/api/admin/domains', { timeout: 65000, maxRedirects: 0 })).status(), [401]);
          if (brand === 'skillhubcore') {
            record('Revoked refresh cannot restore browser session', (await replay.request.post(origin + '/api/auth/refresh', { timeout: 65000, maxRedirects: 0, headers: { origin } })).status(), [401, 403, 404]);
          }
        } finally { await replay.close(); }
      });
      if (brand === 'skillhubcore') {
        await step('Fresh UI login after logout', async () => {
          await page.goto(origin + '/login', { waitUntil: 'domcontentloaded', timeout: 65000 });
          await page.locator('input[type="email"]').first().fill(fixture.email);
          await page.locator('input[type="password"]').first().fill(fixture.password);
          const pending = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/auth/login', { timeout: 65000 });
          await page.locator('button[type="submit"]').first().click();
          record('Fresh login after logout', (await pending).status(), [200]);
          record('Fresh login identity', (await request(own)).status(), [200]);
          record('Fresh-session cleanup logout', (await request('/api/auth/logout', 'POST')).status(), [200]);
        });
      }
    }
  }
}
main().catch(e => { report.fatal = e.name === 'TimeoutError' ? 'TIMEOUT_65_SECONDS' : 'SANITIZED_RUNTIME_FAILURE'; }).finally(async () => {
  await context?.close(); await browser?.close(); report.finishedUtc = new Date().toISOString();
  report.status = report.fatal || report.checks.some(c => c.status !== 'PASS') ? 'FAIL_OR_BLOCKED' : 'PASS'; save();
  console.log(JSON.stringify({ brand, status: report.status, checks: report.checks }));
});
