const fs = require('node:fs');
const { chromium, request } = require('@playwright/test');
const { Pool } = require('pg');
const state = JSON.parse(fs.readFileSync('.local-secrets/r6-e2e-runtime.json'));
const brand = process.env.R6_E2E_BRAND;
const fixture = state.fixtures.find(item => item.brand === brand);
if (!fixture || brand === 'skillhubcore') throw new Error('Explicit learner fixture required');
const origin = state.origins[brand];
const result = { brand, origin, startedUtc: new Date().toISOString(), checks: [], boundary: 'Completed-exam BFF result, with optional warmed Chromium tutorial rendering, using a disposable account' };
let client, browser;
const record = (name, actual, expected) => result.checks.push({ name, actual, expected, status: expected.includes(actual) ? 'PASS' : 'FAIL' });
(async () => {
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
  if (!listening) throw new Error('Isolated process did not start within warmup window');
  client = await request.newContext();
  const login = await client.post(origin + '/api/auth/login', { data: { email: fixture.email, password: fixture.password }, headers: { origin }, timeout: 65000 });
  record('Login BFF', login.status(), [200]);
  if (!login.ok()) return;
  const main = new Pool({ connectionString: state.databases.main, max: 1 });
  main.on('error', () => undefined);
  try {
    const row = (await main.query("SELECT id FROM exams WHERE user_id=$1 AND status='completed' ORDER BY started_at DESC LIMIT 1", [fixture.id])).rows[0];
    record('Own completed exam exists', Boolean(row), [true]);
    if (row) record('Completed exam result BFF', (await client.get(origin + '/api/quiz/result?examId=' + row.id, { timeout: 65000 })).status(), [200]);
  } finally { await main.end(); }
  if (process.env.R6_RESULT_ONLY === 'true') return;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: await client.storageState(), serviceWorkers: 'block' });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const response = await page.goto(origin + state.tutorialPath, { waitUntil: 'domcontentloaded', timeout: 65000 });
  record('Canonical tutorial HTTP', response.status(), [200]);
  record('Canonical tutorial path retained', new URL(page.url()).pathname === state.tutorialPath, [true]);
  const lesson = page.getByText('Synthetic content used only for database identity qualification.', { exact: true });
  await lesson.waitFor({ state: 'visible', timeout: 15000 });
  record('Synthetic lesson rendered', await lesson.isVisible(), [true]);
})().catch(error => { result.failure = /timeout/i.test(error.message) ? 'TIMEOUT_65_SECONDS' : error.name; }).finally(async () => {
  if (client) {
    const state = await client.storageState();
    const csrf = state.cookies.find(cookie => cookie.name === 'csrfToken')?.value;
    try { record('Fixture session logout', (await client.post(origin + '/api/auth/logout', { headers: { origin, ...(csrf ? { 'x-csrf-token': csrf } : {}) }, timeout: 65000 })).status(), [200]); } catch { result.logout = 'BLOCKED'; }
  }
  await browser?.close(); await client?.dispose(); result.finishedUtc = new Date().toISOString();
  result.status = result.failure || result.logout || result.checks.some(check => check.status !== 'PASS') ? 'FAIL_OR_BLOCKED' : 'PASS';
  const prefix = process.env.R6_RESULT_ONLY === 'true' ? 'RESULT' : 'TUTORIAL';
  fs.writeFileSync(`.evidence/r6-e2e/${prefix}-${brand}.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
});
