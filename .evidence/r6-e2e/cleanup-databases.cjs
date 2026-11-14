const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const state = JSON.parse(fs.readFileSync('.local-secrets/r6-e2e-runtime.json'));
const target = new URL(dotenv.parse(fs.readFileSync('.local-secrets/r6-neon-test.env')).R6_NEON_TEST_URL);
target.hostname = target.hostname.replace('-pooler.', '.');
const pool = new Pool({ connectionString: target.toString(), max: 1 }); pool.on('error', () => undefined);
const result = { databases: [], temporaryClientsRemoved: false, sharedBranchesModified: false };
const save = () => fs.writeFileSync('.evidence/r6-e2e/DATABASE_CLEANUP.json', JSON.stringify(result, null, 2));
(async () => {
  const identity = (await pool.query("SELECT current_setting('neon.branch_id') AS branch,current_setting('neon.project_id') AS project")).rows[0];
  if (identity.branch !== 'br-young-silence-a1b1ta26' || identity.project !== 'bitter-tree-18287476') throw new Error('Cleanup target mismatch');
  for (const value of Object.values(state.databases)) {
    const u = new URL(value); const name = u.pathname.slice(1);
    if (u.hostname !== target.hostname || !name.startsWith(state.run + '_') || !/^r6b_e2e_[a-f0-9]{10}_[a-z]+$/.test(name)) throw new Error('Unexpected cleanup database');
    await pool.query('DROP DATABASE "' + name + '" WITH (FORCE)');
    result.databases.push({ name, removed: (await pool.query('SELECT 1 FROM pg_database WHERE datname=$1', [name])).rowCount === 0 }); save();
  }
  const clients = JSON.parse(fs.readFileSync('.local-secrets/r6-client-work.json'));
  const work = path.resolve(clients.work);
  if (!work.startsWith(path.join(os.tmpdir(), 'r6b-e2e-clients-'))) throw new Error('Unexpected client cleanup path');
  fs.rmSync(work, { recursive: true, force: true }); result.temporaryClientsRemoved = true;
  // Scrub private generated account credentials after test resources are gone.
  fs.rmSync('.local-secrets/r6-e2e-runtime.json');
  fs.rmSync('.local-secrets/r6-client-work.json');
  save(); console.log('Owned scratch databases and temporary clients removed');
})().catch(() => { result.failure = 'Sanitized cleanup failure; inspect owned resource inventory'; save(); process.exitCode = 1; }).finally(() => pool.end());
