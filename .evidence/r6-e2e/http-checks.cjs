const fs = require('node:fs');
const crypto = require('node:crypto');
const { request } = require('@playwright/test');
const { Pool } = require('pg');
const state = JSON.parse(fs.readFileSync('.local-secrets/r6-e2e-runtime.json'));
const brand = process.env.R6_E2E_BRAND;
const fixture = state.fixtures.find(item => item.brand === brand);
if (!fixture) throw new Error('Explicit fixture required');
const origin = state.origins[brand];
const report = { brand, origin, boundary: 'Actual localhost HTTP/BFF/gateway/backend and disposable PostgreSQL. Browser rendering is recorded separately.', startedUtc: new Date().toISOString(), checks: [] };
const output = `.evidence/r6-e2e/HTTP-${brand}.json`;
const save = () => fs.writeFileSync(output, JSON.stringify(report, null, 2));
const record = (name, actual, expected) => { report.checks.push({ name, actual, expected, status: expected.includes(actual) ? 'PASS' : 'FAIL' }); save(); };
async function step(name, operation) {
  try { await operation(); } catch (error) {
    report.checks.push({ name, status: 'BLOCKED', category: /timeout/i.test(error.message) ? 'TIMEOUT_65_SECONDS' : error.name }); save();
  }
}
let context;
async function call(path, method = 'GET', data) {
  const cookies = (await context.storageState()).cookies;
  const csrf = cookies.find(cookie => cookie.name === 'csrfToken')?.value;
  return context.fetch(origin + path, { method, data, timeout: 65000, maxRedirects: 0, headers: { origin, ...(csrf ? { 'x-csrf-token': csrf } : {}) } });
}
async function main() {
  let examId;
  if (brand !== 'skillhubcore') {
    const main = new Pool({ connectionString: state.databases.main, max: 1 });
    main.on('error', () => undefined);
    try {
      const identity = (await main.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch")).rows[0];
      if (identity.database !== state.run + '_main' || identity.branch !== 'br-young-silence-a1b1ta26') throw new Error('Fixture target mismatch');
      examId = crypto.randomUUID();
      await main.query("INSERT INTO exams(id,user_id,status,duration_seconds) VALUES($1,$2,'started',3600)", [examId, fixture.id]);
      await main.query('INSERT INTO exam_questions(exam_id,question_id,"order") VALUES($1,$2,1)', [examId, state.questionId]);
      report.freshSyntheticExam = true;
    } finally { await main.end(); }
  }
  context = await request.newContext();
  const own = brand === 'skillhubcore' ? '/api/admin/auth/me' : '/api/profile';
  let captured;
  try {
    const response = await call('/api/auth/login', 'POST', { email: fixture.email, password: fixture.password });
    record('Login BFF', response.status(), [200]);
    if (!response.ok()) return;
    captured = await context.storageState();
    await step('Own identity', async () => record('Own identity', (await call(own)).status(), [200]));
    if (brand === 'skillhubcore') {
      await step('Authorized admin API', async () => record('Authorized admin API', (await call('/api/admin/domains')).status(), [200]));
    } else {
      const foreign = brand === 'skillup' ? 'realtutorialhub' : 'skillup';
      await step('Cross-brand denial', async () => {
        const response = await context.get(`http://127.0.0.1:${state.ports.gateway}/api/auth/me`, { timeout: 65000, headers: { cookie: captured.cookies.map(item => `${item.name}=${item.value}`).join('; '), origin: state.origins[foreign], 'x-original-host': new URL(state.origins[foreign]).hostname, 'x-internal-secret': state.runtimeEnv.INTERNAL_GATEWAY_SECRET } });
        record('Own cookies denied in foreign brand context', response.status(), [401, 403]);
      });
      await step('Progress write', async () => record('Progress write', (await call('/api/tutorial/progress', 'POST', { subtopicId: state.ids.subtopics, blockType: 'notes', status: 'viewed' })).status(), [200]));
      await step('Progress read', async () => record('Progress read', (await call('/api/tutorial/progress?subtopicId=' + state.ids.subtopics)).status(), [200]));
      await step('Foreign exam denial', async () => record('Foreign exam denial', (await call('/api/quiz/submit', 'POST', { examId: state.examIds[foreign] })).status(), [403, 404]));
      await step('Own result', async () => record('Own result', (await call('/api/quiz/result?examId=' + examId)).status(), [200, 202]));
      await step('Own answer', async () => record('Own answer', (await call('/api/quiz/answer', 'POST', { examId, questionId: state.questionId, answer: 'A' })).status(), [200]));
      await step('Own submit', async () => record('Own submit', (await call('/api/quiz/submit', 'POST', { examId })).status(), [200, 202]));
      const pool = new Pool({ connectionString: state.databases.tutorial, max: 1 });
      pool.on('error', () => undefined);
      try {
        const rows = (await pool.query('SELECT tenant_id,blocks_completed FROM tutorial_progress WHERE user_id=$1 AND subtopic_id=$2', [fixture.id, state.ids.subtopics])).rows;
        record('Tenant-qualified progress persisted', rows.some(row => row.tenant_id === brand && row.blocks_completed.includes('notes')), [true]);
      } finally { await pool.end(); }
      const main = new Pool({ connectionString: state.databases.main, max: 1 });
      main.on('error', () => undefined);
      try {
        const row = (await main.query('SELECT e.user_id,e.status,q.user_answer FROM exams e JOIN exam_questions q ON q.exam_id=e.id WHERE e.id=$1 AND q.question_id=$2', [examId, state.questionId])).rows[0];
        record('Owned answer and submitted exam persisted', row?.user_id === fixture.id && row.user_answer === 'A' && ['processing', 'completed'].includes(row.status), [true]);
      } finally { await main.end(); }
    }
  } finally {
    if (captured) {
      await step('Logout', async () => record('Logout', (await call('/api/auth/logout', 'POST')).status(), [200]));
      const replay = await request.newContext({ storageState: captured });
      try {
        await step('Captured cookie replay', async () => record('Captured cookie replay', (await replay.get(origin + own, { timeout: 65000 })).status(), [401]));
        if (brand === 'skillhubcore') {
          await step('Captured admin replay', async () => record('Captured admin replay', (await replay.get(origin + '/api/admin/domains', { timeout: 65000 })).status(), [401]));
          await step('Revoked refresh', async () => record('Revoked refresh cannot renew', (await replay.post(origin + '/api/auth/refresh', { timeout: 65000, headers: { origin } })).status(), [401, 403, 404]));
          await step('Fresh login', async () => {
            record('Fresh login', (await call('/api/auth/login', 'POST', { email: fixture.email, password: fixture.password })).status(), [200]);
            record('Fresh identity', (await call(own)).status(), [200]);
            record('Fresh session logout', (await call('/api/auth/logout', 'POST')).status(), [200]);
          });
        }
      } finally { await replay.dispose(); }
    }
  }
}
main().catch(error => { report.fatal = /timeout/i.test(error.message) ? 'TIMEOUT_65_SECONDS' : error.name; }).finally(async () => {
  await context?.dispose(); report.finishedUtc = new Date().toISOString();
  report.status = report.fatal || report.checks.some(item => item.status !== 'PASS') ? 'FAIL_OR_BLOCKED' : 'PASS'; save();
  console.log(JSON.stringify(report));
});
