const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync, execFileSync } = require('node:child_process');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { readMigrationFiles } = require('drizzle-orm/migrator');
const settings = dotenv.parse(fs.readFileSync('.env.local'));
const target = new URL(settings.DATABASE_DIRECT_URL_PEOPLE || settings.DATABASE_URL_PEOPLE);
const expectedHost = 'ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech';
if (target.hostname.replace('-pooler.', '.') !== expectedHost || target.pathname !== '/people_prod') throw new Error('Unexpected protected target');
const expected = JSON.parse(fs.readFileSync('.evidence/r6-cutover-preflight/PREFLIGHT.json'));
const recoveryEvidence = JSON.parse(fs.readFileSync('.evidence/r6-recovery-acceptance/RECOVERY_ACCEPTANCE.json'));
const migrations = readMigrationFiles({ migrationsFolder: 'packages/db-people/migrations' });
const journal = JSON.parse(fs.readFileSync('packages/db-people/migrations/meta/_journal.json'));
const directory = '.evidence/r6-production-cutover';
const receiptFile = path.resolve(directory, 'MIGRATION_RECEIPT.json');
const result = {
  startedUtc: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  ownerAuthorization: 'AUTHORIZE R6-B PRODUCTION PEOPLEDB MIGRATION. Please go ahead',
  openCredentialRisk: 'Previously documented, owner-deferred; disclosed in the approved execution gate',
  command: 'pnpm --filter @quiz/db-people db:migrate', snapshot: recoveryEvidence.snapshot,
  recoveryBranch: 'br-withered-wave-a17wttsi', checks: [], migrationInvoked: false,
};
const save = () => fs.writeFileSync(path.join(directory, 'EXECUTION.json'), JSON.stringify(result, null, 2));
const check = (name, passed) => { result.checks.push({ name, status: passed ? 'PASS' : 'FAIL' }); save(); if (!passed) throw new Error('Required execution check failed'); };
const pool = new Pool({ connectionString: target.toString(), max: 1, connectionTimeoutMillis: 15000, options: '-c default_transaction_read_only=on -c statement_timeout=60000' });
pool.on('error', () => undefined);
let recoveryPool;
const quote = value => '"' + value.replaceAll('"', '""') + '"';
async function catalog() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const identity = (await client.query("SELECT current_database() AS database,current_user AS role,current_setting('neon.project_id') AS project,current_setting('neon.branch_id') AS branch,current_setting('transaction_read_only') AS read_only,clock_timestamp() AS observed_at")).rows[0];
    if (identity.database !== 'people_prod' || identity.project !== 'bitter-tree-18287476' || identity.branch !== 'br-misty-wildflower-a1jalxmd' || identity.read_only !== 'on') throw new Error('Protected identity mismatch');
    const ledger = (await client.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at,id')).rows;
    const constraints = (await client.query("SELECT t.relname AS table_name,c.conname,c.contype,c.convalidated,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE c.connamespace='public'::regnamespace ORDER BY t.relname,c.conname")).rows;
    const indexes = (await client.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname")).rows;
    const duplicates = Number((await client.query('SELECT count(*) AS count FROM (SELECT lower(trim(email)),platform FROM users WHERE deleted_at IS NULL GROUP BY lower(trim(email)),platform HAVING count(*)>1) conflicts')).rows[0].count);
    const fingerprints = [];
    for (const { table } of recoveryEvidence.production.tableFingerprints) {
      const row = (await client.query(`SELECT count(*)::int AS count,md5(COALESCE(string_agg(md5(to_jsonb(r)::text),'' ORDER BY md5(to_jsonb(r)::text)),'')) AS fingerprint FROM public.${quote(table)} r`)).rows[0];
      fingerprints.push({ table, ...row });
    }
    await client.query('ROLLBACK'); return { identity, ledger, constraints, indexes, duplicates, fingerprints };
  } finally { client.release(); }
}
(async () => {
  save();
  check('Reviewed source files retain approved hashes', expected.files.every(file => crypto.createHash('sha256').update(fs.readFileSync(file.file)).digest('hex') === file.sha256));
  check('Approved package migration entry point unchanged', JSON.parse(fs.readFileSync('packages/db-people/package.json')).scripts['db:migrate'] === 'tsx scripts/migrate.mts');
  check('Recovery acceptance is PASS', recoveryEvidence.status === 'PASS');
  const recoveryUrl = new URL(target); recoveryUrl.hostname = 'ep-purple-water-a1tdj2jd.ap-southeast-1.aws.neon.tech';
  recoveryPool = new Pool({ connectionString: recoveryUrl.toString(), max: 1, connectionTimeoutMillis: 15000, options: '-c default_transaction_read_only=on' });
  recoveryPool.on('error', () => undefined);
  result.recoveryIdentity = (await recoveryPool.query("SELECT current_database() AS database,current_setting('neon.project_id') AS project,current_setting('neon.branch_id') AS branch")).rows[0];
  check('Retained recovery target exists and is isolated', result.recoveryIdentity.database === 'people_prod' && result.recoveryIdentity.project === 'bitter-tree-18287476' && result.recoveryIdentity.branch === 'br-withered-wave-a17wttsi');
  const recoveryLedger = (await recoveryPool.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at,id')).rows;
  check('Retained recovery ledger matches accepted snapshot state', JSON.stringify(recoveryLedger) === JSON.stringify(recoveryEvidence.recovery.ledger));
  result.before = await catalog(); save();
  check('Protected identity reconfirmed before execution', true);
  check('Exact nine-entry historical ledger prefix', result.before.ledger.length === 9 && result.before.ledger.every((row, index) => row.hash === migrations[index].hash && Number(row.created_at) === migrations[index].folderMillis));
  check('Only approved 0009 then 0010 are pending', journal.entries.slice(9).map(row => row.tag).join(',') === '0009_student_invitations,0010_normalized_platform_email');
  check('Zero conflicting normalized same-platform emails', result.before.duplicates === 0);
  check('Expected old global constraint exists; new index absent', result.before.constraints.some(row => row.conname === 'users_email_unique') && !result.before.indexes.some(row => row.indexname === 'uniq_users_email_platform'));
  check('Protected data still matches accepted pre-migration recovery fingerprints', JSON.stringify(result.before.fingerprints) === JSON.stringify(recoveryEvidence.production.tableFingerprints));
  result.migrationInvoked = true; result.migrationStartedUtc = new Date().toISOString(); save();
  const command = spawnSync('pnpm.cmd', ['--filter', '@quiz/db-people', 'db:migrate'], {
    env: { ...process.env, DATABASE_URL_PEOPLE: target.toString(), DATABASE_DIRECT_URL_PEOPLE: target.toString(), PEOPLE_MIGRATION_RECEIPT: receiptFile },
    shell: true, windowsHide: true, encoding: 'utf8', timeout: 300000, maxBuffer: 2000000,
  });
  result.migrationFinishedUtc = new Date().toISOString(); result.exitCode = command.status;
  let diagnostic = (command.stdout || '') + '\n' + (command.stderr || '');
  for (const secret of [target.toString(), target.password, decodeURIComponent(target.password)]) if (secret) diagnostic = diagnostic.replaceAll(secret, '[REDACTED]');
  diagnostic = diagnostic.replace(/postgres(?:ql)?:\/\/\S+/g, '[REDACTED CONNECTION]').replace(/npg_[A-Za-z0-9]+/g, '[REDACTED]');
  fs.writeFileSync(path.join(directory, 'migration.log'), diagnostic); save();
  result.after = await catalog(); save();
  check('Supported migration command completed successfully', command.status === 0 && fs.existsSync(receiptFile));
  const receipt = JSON.parse(fs.readFileSync(receiptFile));
  check('Committed receipt contains only approved registered migrations', receipt.committed === true && receipt.executed.map(row => row.tag).join(',') === '0009_student_invitations,0010_normalized_platform_email');
  check('Eleven-entry ledger matches all source hashes and timestamps', result.after.ledger.length === 11 && result.after.ledger.every((row, index) => row.hash === migrations[index].hash && Number(row.created_at) === migrations[index].folderMillis));
  check('Normalized partial unique index exists and global constraint is removed', result.after.indexes.some(row => row.indexname === 'uniq_users_email_platform' && /lower\(TRIM/.test(row.indexdef) && /platform/.test(row.indexdef) && /deleted_at IS NULL/.test(row.indexdef)) && !result.after.constraints.some(row => row.conname === 'users_email_unique'));
  check('Invitation schema and foreign key were created', result.after.constraints.some(row => row.table_name === 'student_invitations' && row.contype === 'f' && row.convalidated) && result.after.indexes.some(row => row.indexname === 'student_invitations_token_hash_unq'));
  check('All pre-existing application rows preserved', JSON.stringify(result.before.fingerprints) === JSON.stringify(result.after.fingerprints));
  const accessBefore = result.before.constraints.filter(row => ['platform_access', 'sso_sessions'].includes(row.table_name));
  const accessAfter = result.after.constraints.filter(row => ['platform_access', 'sso_sessions'].includes(row.table_name));
  check('Existing platform access and session constraints preserved', JSON.stringify(accessBefore) === JSON.stringify(accessAfter));
  check('Post-migration normalized conflict count remains zero', result.after.duplicates === 0);
  result.status = 'PASS';
})().catch(error => { result.status = 'FAIL_OR_REVIEW_REQUIRED'; result.failure = /^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : error.name; result.retryAttempted = false; process.exitCode = 1; }).finally(async () => {
  await recoveryPool?.end(); await pool.end(); result.finishedUtc = new Date().toISOString(); save();
  console.log(JSON.stringify({ status: result.status, migrationInvoked: result.migrationInvoked, exitCode: result.exitCode, checks: result.checks, failure: result.failure }));
});
