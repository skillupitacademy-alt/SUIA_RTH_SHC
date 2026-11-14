const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { rootCertificates } = require('node:tls');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const root = process.cwd();
const protectedEnv = dotenv.parse(fs.readFileSync('.env.local'));
const local = dotenv.parse(fs.readFileSync('.local-secrets/r6-neon-test.env'));
const target = new URL(local.R6_NEON_TEST_URL);
if (target.hostname !== 'ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech' || target.pathname !== '/people_prod') throw new Error('Unexpected disposable target');
target.hostname = target.hostname.replace('-pooler.', '.');
const work = JSON.parse(fs.readFileSync('.local-secrets/r6-client-work.json'));
const run = 'r6b_e2e_' + crypto.randomBytes(5).toString('hex');
const receipt = { run, started: new Date().toISOString(), resources: [], commands: [], fixtures: [], status: 'RUNNING' };
const state = { run, work, databases: {}, fixtures: [], ids: {}, processes: [], copies: [] };
const save = () => {
  fs.writeFileSync('.evidence/r6-e2e/SETUP.json', JSON.stringify(receipt, null, 2));
  fs.writeFileSync('.local-secrets/r6-e2e-runtime.json', JSON.stringify(state, null, 2));
};
const cert = path.join(work.work, 'trusted-roots.pem');
fs.writeFileSync(cert, rootCertificates.join('\n'));
function url(database) { const u = new URL(target); u.pathname = '/' + database; return u.toString(); }
const pools = [];
async function connect(connectionString) {
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15000, statement_timeout: 60000 });
  pool.on('error', () => undefined); pools.push(pool); return pool;
}
async function verify(pool, database) {
  const row = (await pool.query("SELECT current_database() AS database,current_setting('neon.project_id') AS project,current_setting('neon.branch_id') AS branch")).rows[0];
  if (row.database !== database || row.project !== 'bitter-tree-18287476' || row.branch !== 'br-young-silence-a1b1ta26') throw new Error('Disposable identity mismatch');
}
function utility(name, args, connectionString, readOnly) {
  const u = new URL(connectionString);
  const env = { ...process.env, PGHOST: u.hostname.replace('-pooler.', '.'), PGPORT: '5432', PGUSER: decodeURIComponent(u.username), PGPASSWORD: decodeURIComponent(u.password), PGDATABASE: u.pathname.slice(1), PGSSLMODE: 'verify-full', PGSSLROOTCERT: cert, PGCONNECT_TIMEOUT: '15', PGAPPNAME: 'r6b-isolated-e2e', ...(readOnly ? { PGOPTIONS: '-c default_transaction_read_only=on' } : {}) };
  const r = spawnSync(path.join(work.bin, name + '.exe'), args, { env, windowsHide: true, encoding: 'utf8', timeout: 180000 });
  receipt.commands.push({ utility: name, database: u.pathname.slice(1), host: u.hostname, readOnly, exitCode: r.status }); save();
  if (r.status !== 0) {
    const sqlstate = r.stderr?.match(/(?:ERROR|FATAL):\s+([A-Z0-9]{5}):/)?.[1];
    receipt.failureStage = { utility: name, database: u.pathname.slice(1), sqlstate: sqlstate || null };
    // Retain only diagnostics with all known connection/password values removed.
    let diagnostic = r.stderr || '';
    for (const value of [u.password, decodeURIComponent(u.password), connectionString]) diagnostic = diagnostic.replaceAll(value, '[REDACTED]');
    fs.writeFileSync('.evidence/r6-e2e/setup-failure.log', diagnostic);
    throw new Error('Schema utility failed');
  }
}
async function insert(pool, table, values) {
  const columns = new Set((await pool.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2', ['public', table])).rows.map(x => x.column_name));
  const entries = Object.entries(values).filter(([key]) => columns.has(key));
  await pool.query(`INSERT INTO public."${table}" (${entries.map(([key]) => '"' + key + '"').join(',')}) VALUES (${entries.map((_, i) => '$' + (i + 1)).join(',')})`, entries.map(([, value]) => value));
}
async function main() {
  const control = await connect(url('people_prod'));
  await verify(control, 'people_prod');
  const definitions = [
    ['main', 'DATABASE_DIRECT_URL'], ['skillup', 'DATABASE_DIRECT_URL_SKILLUP'],
    ['realtutorialhub', 'DATABASE_DIRECT_URL_RTH'], ['tutorial', 'DATABASE_DIRECT_URL_TUTORIAL'],
    ['people', 'DATABASE_DIRECT_URL_PEOPLE'],
  ];
  const dbs = {};
  for (const [kind, key] of definitions) {
    const source = protectedEnv[key];
    const sourceUrl = new URL(source);
    if (sourceUrl.hostname.startsWith('ep-fragrant-brook-')) throw new Error('Unexpected schema source');
    const schema = path.join(work.work, kind + '-schema.sql');
    utility('pg_dump', ['--schema-only', '--no-owner', '--no-acl', '--no-comments', '--file', schema], source, true);
    const name = run + '_' + kind;
    await verify(control, 'people_prod');
    await control.query('CREATE DATABASE "' + name + '"');
    receipt.resources.push({ kind, database: name, created: true });
    state.databases[kind] = url(name); save();
    const pool = await connect(url(name)); dbs[kind] = pool;
    await verify(pool, name);
    utility('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', schema], url(name), false);
    receipt.resources.at(-1).schemaSha256 = crypto.createHash('sha256').update(fs.readFileSync(schema)).digest('hex'); save();
  }
  // Restore only the existing PeopleDB migration metadata, with no user rows.
  const source = await connect(protectedEnv.DATABASE_DIRECT_URL_PEOPLE);
  await source.query('BEGIN READ ONLY');
  const ledger = (await source.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at,id')).rows;
  await source.query('ROLLBACK');
  for (const row of ledger) await dbs.people.query('INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES($1,$2)', [row.hash, row.created_at]);
  receipt.peopleLedgerRestored = ledger.length; save();

  const sharedEmail = run + '@example.invalid';
  for (const [brand, role] of [['skillup', 'student'], ['realtutorialhub', 'student'], ['skillhubcore', 'admin']]) {
    const id = crypto.randomUUID();
    const password = crypto.randomBytes(24).toString('base64url');
    const email = brand === 'skillhubcore' ? run + '-admin@example.invalid' : sharedEmail;
    const hash = await bcrypt.hash(password, 10);
    const fixture = { brand, id, email, password, role };
    state.fixtures.push(fixture);
    if (brand === 'skillhubcore') {
      await insert(dbs.people, 'users', { id, email, password_hash: hash, role, platform: brand, is_active: true });
    } else {
      await insert(dbs[brand], 'users', { id, email, password_hash: hash, email_verified: true, is_onboarded: true });
      const roleId = crypto.randomUUID();
      await insert(dbs[brand], 'roles', { id: roleId, name: role });
      await insert(dbs[brand], 'user_roles', { user_id: id, role_id: roleId });
      await insert(dbs[brand], 'user_profiles', { user_id: id, name: 'Synthetic qualification learner', onboarding_completed: true });
    }
    // Existing MainDB audit/exam FKs require a synthetic owner fixture.
    // This creates no cross-database identity implementation.
    await insert(dbs.main, 'users', { id, email: run + '-' + brand + '@example.invalid', password_hash: hash, email_verified: true });
    receipt.fixtures.push({ brand, synthetic: true, passwordRecorded: false }); save();
  }
  const academic = [
    ['domains', null, null], ['subjects', 'domain_id', 'domains'],
    ['topics', 'subject_id', 'subjects'], ['subtopics', 'topic_id', 'topics'],
  ];
  for (const [table, parentColumn, parentTable] of academic) {
    const id = crypto.randomUUID(); state.ids[table] = id;
    const values = { id, name: 'R6 synthetic ' + table, slug: run + '-' + table, is_active: true };
    if (parentColumn) values[parentColumn] = state.ids[parentTable];
    await insert(dbs.main, table, values); save();
  }
  const catalog = {};
  for (const [kind, pool] of Object.entries(dbs)) {
    catalog[kind] = (await pool.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name,ordinal_position", [['users', 'tutorial_domains', 'tutorial_subjects', 'tutorial_topics', 'tutorial_subtopics', 'tutorials', 'tutorial_progress', 'tutorial_content', 'tutorial_pages', 'exams', 'questions', 'exam_questions']])).rows;
  }
  fs.writeFileSync('.evidence/r6-e2e/FIXTURE_SCHEMA_CATALOG.json', JSON.stringify(catalog, null, 2));
  receipt.status = 'PASS'; receipt.finished = new Date().toISOString(); save();
}
main().catch(error => {
  receipt.status = 'FAIL'; receipt.failure = 'Sanitized isolated fixture setup failure';
  receipt.sqlstate = /^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : null;
  save(); console.error(JSON.stringify({ status: receipt.status, sqlstate: receipt.sqlstate, stage: receipt.failureStage })); process.exitCode = 1;
}).finally(async () => { for (const pool of pools) await pool.end(); });
