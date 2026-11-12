const fs = require('node:fs');
const path = require('node:path');
const { Pool, neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
const environment = require('dotenv').parse(fs.readFileSync(path.join(root, '.env.local')));
(async () => {
  const results = [];
  for (const [name, key] of [['skillup', 'DATABASE_URL_SKILLUP'], ['realtutorialhub', 'DATABASE_URL_RTH'], ['people', 'DATABASE_URL_PEOPLE']]) {
    const pool = new Pool({ connectionString: environment[key], max: 1, connectionTimeoutMillis: 10000 });
    const client = await pool.connect();
    try {
      await client.query('BEGIN READ ONLY');
      await client.query("SET LOCAL statement_timeout='15s'");
      const columns = (await client.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('users','user_roles','roles','refresh_tokens','platform_access','audit_logs') ORDER BY table_name,ordinal_position")).rows;
      const foreignKeys = (await client.query("SELECT c.conrelid::regclass::text AS child, pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.users'::regclass ORDER BY child")).rows;
      const roles = name === 'people' ? [] : (await client.query("SELECT name FROM roles WHERE name IN ('student','faculty','admin') ORDER BY name")).rows.map(row => row.name);
      results.push({ name, columns, foreignKeys, roles });
    } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
  }
  fs.writeFileSync(path.join(__dirname, 'database-preflight.json'), JSON.stringify({ boundary: 'Read-only metadata for bounded synthetic learner session fixtures. No personal records or credentials exported.', results }, null, 2));
  console.log(JSON.stringify(results.map(result => ({ name: result.name, columns: result.columns.length, foreignKeys: result.foreignKeys.length, roles: result.roles }))));
})().catch(error => { console.error(JSON.stringify({ name: error.name, code: error.code })); process.exitCode = 1; });
