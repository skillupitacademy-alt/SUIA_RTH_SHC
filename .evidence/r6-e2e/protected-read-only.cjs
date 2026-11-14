const fs = require('node:fs');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const settings = dotenv.parse(fs.readFileSync('.env.local'));
const target = new URL(settings.DATABASE_URL_PEOPLE);
if (target.pathname !== '/people_prod' || target.hostname.replace('-pooler.', '.') !== 'ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech') throw new Error('Unexpected protected read-only target');
const pool = new Pool({ connectionString: target.toString(), max: 1, options: '-c default_transaction_read_only=on' });
pool.on('error', () => undefined);
const result = { startedUtc: new Date().toISOString(), readOnly: true };
(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    result.identity = (await client.query("SELECT current_database() AS database,current_setting('neon.project_id') AS project,current_setting('neon.branch_id') AS branch,current_setting('transaction_read_only') AS read_only")).rows[0];
    if (result.identity.read_only !== 'on' || result.identity.branch === 'br-young-silence-a1b1ta26') throw new Error('Read-only identity mismatch');
    result.ledger = (await client.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
    result.emailIndexes = (await client.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='users' AND indexname IN ('users_email_unique','uniq_users_email_platform')")).rows;
    result.normalizedSamePlatformDuplicateGroups = Number((await client.query('SELECT count(*) AS count FROM (SELECT lower(trim(email)),platform FROM users WHERE deleted_at IS NULL GROUP BY lower(trim(email)),platform HAVING count(*)>1) conflicts')).rows[0].count);
    await client.query('ROLLBACK');
    result.status = result.ledger.length === 9 && result.emailIndexes.some(index => index.indexname === 'users_email_unique') && result.normalizedSamePlatformDuplicateGroups === 0 ? 'PASS' : 'UNEXPECTED_PREFLIGHT_STATE';
  } finally { client.release(); }
})().catch(error => { result.status = 'FAIL'; result.error = /^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : error.name; }).finally(async () => {
  await pool.end(); result.finishedUtc = new Date().toISOString();
  fs.writeFileSync('.evidence/r6-e2e/PROTECTED_READ_ONLY_FINAL.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ status: result.status, ledgerRows: result.ledger?.length, readOnly: result.identity?.read_only, duplicateGroups: result.normalizedSamePlatformDuplicateGroups }));
});
