const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const { Pool, neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = require('ws');

async function main() {
  const env = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../../.env.local')));
  const connectionString = env.DATABASE_DIRECT_URL_TUTORIAL || env.DATABASE_URL_TUTORIAL;
  if (!connectionString) throw new Error('TutorialDB configuration is required');
  const target = new URL(connectionString);
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '10000ms'");
    const queries = {
      transaction: "SELECT current_setting('transaction_read_only') AS read_only, current_setting('transaction_isolation') AS isolation",
      columns: "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='tutorial_progress' ORDER BY ordinal_position",
      counts: 'SELECT count(*) AS rows, count(*) FILTER (WHERE deleted_at IS NOT NULL) AS retained_deleted_rows FROM public.tutorial_progress',
      duplicates: 'SELECT count(*) AS groups FROM (SELECT user_id, subtopic_id FROM public.tutorial_progress GROUP BY user_id, subtopic_id HAVING count(*) > 1) d',
      indexes: "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='tutorial_progress' ORDER BY indexname",
      constraints: "SELECT conname, contype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.tutorial_progress'::regclass OR confrelid='public.tutorial_progress'::regclass ORDER BY conname",
      views: "SELECT DISTINCT v.schemaname, v.viewname FROM pg_views v JOIN pg_class c ON c.relname=v.viewname JOIN pg_rewrite r ON r.ev_class=c.oid JOIN pg_depend d ON d.objid=r.oid WHERE d.refobjid='public.tutorial_progress'::regclass",
      triggers: "SELECT tgname, pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid='public.tutorial_progress'::regclass AND NOT tgisinternal",
      functions: "SELECT DISTINCT n.nspname AS schema, p.proname AS function FROM pg_depend d JOIN pg_proc p ON p.oid=d.objid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE d.classid='pg_proc'::regclass AND d.refobjid='public.tutorial_progress'::regclass",
      rowSecurity: "SELECT relrowsecurity AS enabled, relforcerowsecurity AS forced FROM pg_class WHERE oid='public.tutorial_progress'::regclass",
      policies: "SELECT policyname, permissive, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='tutorial_progress'",
      migrationLedger: "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name='__drizzle_migrations' ORDER BY table_schema",
    };
    const report = {
      timestamp: new Date().toISOString(),
      source: 'f245e11ee5584018a0f751080595192325e74ee6',
      targetFingerprint: crypto.createHash('sha256').update(target.hostname + target.pathname).digest('hex').slice(0, 12),
    };
    for (const [name, sql] of Object.entries(queries)) report[name] = (await client.query(sql)).rows;
    fs.writeFileSync(path.join(__dirname, 'progress-design-readonly.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ readOnly: report.transaction, fingerprint: report.targetFingerprint,
      rows: report.counts, hasTenant: report.columns.some(c => c.column_name === 'tenant_id'),
      indexCount: report.indexes.length, foreignKeyCount: report.constraints.filter(c => c.contype === 'f').length,
      viewCount: report.views.length, triggerCount: report.triggers.length }));
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
}
main().catch(error => { console.error(JSON.stringify({ errorType: error.name, code: error.code })); process.exitCode = 1; });
