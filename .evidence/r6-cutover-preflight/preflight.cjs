const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { readMigrationFiles } = require('drizzle-orm/migrator');
const folder = 'packages/db-people/migrations';
const journal = JSON.parse(fs.readFileSync(path.join(folder, 'meta/_journal.json')));
const migrations = readMigrationFiles({ migrationsFolder: folder });
const settings = dotenv.parse(fs.readFileSync('.env.local'));
const target = new URL(settings.DATABASE_DIRECT_URL_PEOPLE || settings.DATABASE_URL_PEOPLE);
const host = target.hostname.replace('-pooler.', '.');
if (target.pathname !== '/people_prod' || host !== 'ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech') throw new Error('Unexpected protected target');
const report = { startedUtc: new Date().toISOString(), command: 'node .evidence/r6-cutover-preflight/preflight.cjs', sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), target: { host, database: 'people_prod' }, checks: [], scope: 'Read-only protected PostgreSQL catalogs and local configuration. No migration runner invocation.' };
const record = (name, pass) => report.checks.push({ name, status: pass ? 'PASS' : 'FAIL' });
const pool = new Pool({ connectionString: target.toString(), max: 1, connectionTimeoutMillis: 15000, options: '-c default_transaction_read_only=on -c statement_timeout=30000' });
pool.on('error', () => undefined);
(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    report.identity = (await client.query("SELECT current_database() AS database,current_user AS role,version() AS version,current_setting('neon.project_id') AS project,current_setting('neon.branch_id') AS branch,current_setting('transaction_read_only') AS read_only,clock_timestamp() AS observed_at")).rows[0];
    if (report.identity.project !== 'bitter-tree-18287476' || report.identity.branch !== 'br-misty-wildflower-a1jalxmd' || report.identity.database !== 'people_prod' || report.identity.read_only !== 'on') throw new Error('Protected identity mismatch');
    record('Protected project, branch, database and read-only transaction', true);
    report.ledger = (await client.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at,id')).rows;
    record('Ledger matches exact registered historical prefix', report.ledger.every((row, i) => row.hash === migrations[i]?.hash && Number(row.created_at) === migrations[i]?.folderMillis));
    report.pending = journal.entries.slice(report.ledger.length).map((entry, offset) => ({ tag: entry.tag, timestamp: entry.when, hash: migrations[report.ledger.length + offset].hash }));
    record('Only expected 0009 and 0010 pending', report.ledger.length === 9 && report.pending.map(row => row.tag).join(',') === '0009_student_invitations,0010_normalized_platform_email');
    report.columns = (await client.query("SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('users','platform_access','sso_sessions','student_invitations') ORDER BY table_name,ordinal_position")).rows;
    report.constraints = (await client.query("SELECT c.conname,t.relname AS table_name,c.contype,c.convalidated,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE c.connamespace='public'::regnamespace AND (t.relname IN ('users','platform_access','sso_sessions','student_invitations') OR c.conname IN ('subscription_features_plan_id_subscription_plans_id_fk','user_features_cache_user_id_users_id_fk')) ORDER BY t.relname,c.conname")).rows;
    report.indexes = (await client.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND (tablename IN ('users','platform_access','sso_sessions','student_invitations') OR indexname IN ('idx_subscription_features_plan','idx_subscription_plans_active','idx_user_features_cache_user','idx_subscriptions_user_active','idx_sso_sessions_family')) ORDER BY tablename,indexname")).rows;
    report.enums = (await client.query("SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid WHERE t.typname IN ('people_platform','people_role') ORDER BY t.typname,e.enumsortorder")).rows;
    record('Existing platform enum includes all three application authorities', ['skillup','realtutorialhub','skillhubcore'].every(label => report.enums.some(row => row.typname === 'people_platform' && row.enumlabel === label)));
    record('Old global constraint exists and new index is absent', report.constraints.some(row => row.conname === 'users_email_unique' && row.contype === 'u') && !report.indexes.some(row => row.indexname === 'uniq_users_email_platform'));
    record('Student invitation table is absent before pending 0009', !report.columns.some(row => row.table_name === 'student_invitations'));
    report.duplicateGroups = Number((await client.query('SELECT count(*) AS count FROM (SELECT lower(trim(email)),platform FROM users WHERE deleted_at IS NULL GROUP BY lower(trim(email)),platform HAVING count(*)>1) conflicts')).rows[0].count);
    record('Zero active normalized same-platform email conflicts', report.duplicateGroups === 0);
    report.longTransactions = (await client.query("SELECT pid,state,wait_event_type,wait_event,age(clock_timestamp(),xact_start)::text AS transaction_age FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND xact_start<clock_timestamp()-interval '1 minute'")).rows;
    report.databaseSizeBytes = Number((await client.query('SELECT pg_database_size(current_database()) AS bytes')).rows[0].bytes);
    await client.query('ROLLBACK');
  } finally { client.release(); }
  const roots = ['.', 'apps/api-server', 'apps/skillhubcore-admin', 'apps/skillup-web', 'apps/realtutorialhub-web', 'services/api-gateway'];
  report.configuration = [];
  for (const dir of roots) {
    for (const file of fs.readdirSync(dir).filter(name => /^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(name))) {
      const location = path.join(dir, file);
      if (!fs.statSync(location).isFile()) continue;
      const values = dotenv.parse(fs.readFileSync(location));
      for (const [key, value] of Object.entries(values)) {
        if (!/DATABASE.*URL|SKILLHUBCORE_DATABASE|R6_NEON_TEST_URL|GATEWAY_URL|INTERNAL_API_URL|SHC_IDENTITY_SERVICE_URL/.test(key)) continue;
        let endpoint;
        try { const url = new URL(value); endpoint = { host: url.hostname, path: /DATABASE|R6_NEON/.test(key) ? url.pathname : undefined }; } catch { endpoint = { configured: Boolean(value), parseableUrl: false }; }
        report.configuration.push({ file: location, key, ...endpoint, disposable: /fragrant-brook-a1mhx5dm|r6b_e2e_|br-young-silence/.test(value), template: /example|sample|template/.test(file) });
      }
    }
  }
  record('Active project env references exclude disposable qualification targets', report.configuration.filter(row => !row.template && row.key !== 'R6_NEON_TEST_URL').every(row => !row.disposable));
  report.files = ['packages/db-people/scripts/migrate.mts','packages/db-people/src/migration-compatibility.ts','packages/db-people/drizzle.config.ts','packages/db-people/migrations/meta/_journal.json','packages/db-people/migrations/0009_student_invitations.sql','packages/db-people/migrations/0010_normalized_platform_email.sql'].map(file => ({ file, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') }));
  report.protectedRecoverability = 'NOT VERIFIED - SQL catalogs provide no approved restore-point, retention or protected restore rehearsal evidence';
})().catch(error => { report.failure = /^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : error.name; process.exitCode = 1; }).finally(async () => {
  await pool.end(); report.finishedUtc = new Date().toISOString(); report.status = report.failure || report.checks.some(row => row.status === 'FAIL') ? 'FAIL_OR_REVIEW_REQUIRED' : 'PASS_READ_ONLY_PREFLIGHT';
  fs.writeFileSync('.evidence/r6-cutover-preflight/PREFLIGHT.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, identity: report.identity, checks: report.checks, pending: report.pending, duplicateGroups: report.duplicateGroups, failure: report.failure }));
});
