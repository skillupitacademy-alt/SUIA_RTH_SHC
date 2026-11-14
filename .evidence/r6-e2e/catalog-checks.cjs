const fs = require('node:fs');
const { Pool } = require('pg');
const state = JSON.parse(fs.readFileSync('.local-secrets/r6-e2e-runtime.json'));
const report = { recordedUtc: new Date().toISOString(), checks: [], databases: {} };
const pools = [];
const record = (name, passed) => report.checks.push({ name, status: passed ? 'PASS' : 'FAIL' });
async function connect(kind) {
  const pool = new Pool({ connectionString: state.databases[kind], max: 1 });
  pool.on('error', () => undefined); pools.push(pool);
  const identity = (await pool.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch")).rows[0];
  if (identity.database !== state.run + '_' + kind || identity.branch !== 'br-young-silence-a1b1ta26') throw new Error('Unexpected catalog target');
  report.databases[kind] = identity.database;
  return pool;
}
(async () => {
  const people = await connect('people');
  report.ledger = (await people.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
  report.emailIndexes = (await people.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='users' AND indexname IN ('users_email_unique','uniq_users_email_platform')")).rows;
  record('Ledger includes registered 0009 and 0010', report.ledger.length === 11);
  record('Global email uniqueness replaced', report.emailIndexes.length === 1 && report.emailIndexes[0].indexname === 'uniq_users_email_platform');
  const persons = [];
  for (const brand of ['skillup', 'realtutorialhub']) {
    const fixture = state.fixtures.find(item => item.brand === brand);
    const local = await connect(brand);
    const learner = (await local.query('SELECT shadow_user_id FROM users WHERE id=$1', [fixture.id])).rows[0];
    const person = (await people.query('SELECT id,platform,external_id,email FROM users WHERE platform=$1 AND external_id=$2 AND deleted_at IS NULL', [brand, fixture.id])).rows[0];
    record(brand + ' projection and persisted brand link agree', Boolean(person && person.id !== fixture.id && person.id === learner.shadow_user_id));
    const grants = await people.query('SELECT 1 FROM platform_access WHERE user_id=$1 AND platform=$2 AND deleted_at IS NULL', [person.id, brand]);
    record(brand + ' active own-platform grant exists', grants.rowCount === 1);
    persons.push(person);
  }
  record('Same normalized email retains distinct platform-qualified people', persons[0].email.trim().toLowerCase() === persons[1].email.trim().toLowerCase() && persons[0].id !== persons[1].id);
  const main = await connect('main');
  for (const brand of ['skillup', 'realtutorialhub']) {
    const fixture = state.fixtures.find(item => item.brand === brand);
    const rows = (await main.query("SELECT e.status,q.user_answer FROM exams e JOIN exam_questions q ON q.exam_id=e.id WHERE e.user_id=$1 AND q.question_id=$2", [fixture.id, state.questionId])).rows;
    report[brand + 'ExamStates'] = rows;
    record(brand + ' answered and submitted exam physically persisted', rows.some(row => row.user_answer === 'A' && ['completed', 'processing'].includes(row.status)));
  }
})().catch(error => { report.failure = /^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : error.name; }).finally(async () => {
  for (const pool of pools) await pool.end();
  report.status = report.failure || report.checks.some(check => check.status !== 'PASS') ? 'FAIL_OR_BLOCKED' : 'PASS';
  fs.writeFileSync('.evidence/r6-e2e/FINAL_CATALOG.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify({ status: report.status, checks: report.checks }));
});
