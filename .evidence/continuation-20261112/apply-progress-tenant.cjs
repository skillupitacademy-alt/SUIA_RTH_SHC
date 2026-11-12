// No connection strings or account data are printed. Default mode rehearses and rolls back.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { Pool, neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const expectedHash = 'fcdf60fa8b018aaa6a02fd60c1e035492dc9ae50e12e914c66f9fd69935b8e33';
const expectedFingerprint = 'd69fe9af7c33';
const receiptPath = path.join(__dirname, 'progress-tenant-execution.json');
const receipt = { startedAt: new Date().toISOString(), sqlHash: expectedHash, committed: false };
const save = () => fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
async function snapshot(client) {
  const queries = {
    columns: "SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='tutorial_progress' ORDER BY ordinal_position",
    indexes: "SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='tutorial_progress' ORDER BY indexname",
    constraints: "SELECT conname,contype,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.tutorial_progress'::regclass OR confrelid='public.tutorial_progress'::regclass ORDER BY conname",
    grants: "SELECT grantee,privilege_type,is_grantable FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='tutorial_progress' ORDER BY grantee,privilege_type",
    triggers: "SELECT tgname,pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid='public.tutorial_progress'::regclass AND NOT tgisinternal ORDER BY tgname",
    security: "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='public.tutorial_progress'::regclass",
    ledger: 'SELECT hash,created_at::text FROM drizzle.__drizzle_migrations ORDER BY created_at,id',
    counts: 'SELECT count(*)::text AS rows FROM public.tutorial_progress',
  };
  const result = {};
  for (const [key, sql] of Object.entries(queries)) result[key] = (await client.query(sql)).rows;
  return result;
}
function requireBefore(s) {
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'progress-design-readonly.json')));
  assert.deepEqual(s.columns, expected.columns, 'Prior columns changed');
  assert.deepEqual(s.indexes, expected.indexes, 'Prior indexes changed');
  assert.deepEqual(s.constraints, expected.constraints, 'Prior constraints changed');
  assert.deepEqual(s.counts, [{ rows: '0' }], 'Rows exist: stop for provenance review');
  assert.equal(s.triggers.length, 0, 'Unexpected trigger');
}
function requireAfter(s, before) {
  const tenant = s.columns.find(c => c.column_name === 'tenant_id');
  assert.deepEqual(tenant, { column_name: 'tenant_id', data_type: 'text', is_nullable: 'NO', column_default: null });
  assert.deepEqual(s.columns.filter(c => c.column_name !== 'tenant_id'), before.columns);
  const names = s.indexes.map(i => i.indexname);
  assert.deepEqual(names, ['idx_tutorial_progress_tenant', 'idx_tutorial_progress_user', 'tutorial_progress_pkey', 'uq_tutorial_progress_tenant_user_subtopic']);
  assert.ok(s.indexes.find(i => i.indexname === 'uq_tutorial_progress_tenant_user_subtopic').indexdef.endsWith('USING btree (tenant_id, user_id, subtopic_id)'));
  assert.equal(s.constraints.length, before.constraints.length + 1);
  const check = s.constraints.find(c => c.conname === 'tutorial_progress_tenant_allowed');
  assert.equal(check.contype, 'c');
  for (const tenant of ['skillup', 'realtutorialhub', 'skillhubcore']) assert.ok(check.definition.includes(`'${tenant}'::text`));
  for (const key of ['grants', 'triggers', 'security', 'ledger', 'counts']) assert.deepEqual(s[key], before[key], `${key} changed unexpectedly`);
}
async function main() {
  const sql = fs.readFileSync(path.join(root, 'packages/db-tutorial/src/migrations/manual/20261112_progress_tenant_empty_table.sql'), 'utf8');
  assert.equal(sha(sql), expectedHash, 'SQL hash mismatch');
  const env = require('dotenv').parse(fs.readFileSync(path.join(root, '.env.local')));
  const connectionString = env.DATABASE_DIRECT_URL_TUTORIAL || env.DATABASE_URL_TUTORIAL;
  const target = new URL(connectionString);
  receipt.targetFingerprint = sha(target.hostname + target.pathname).slice(0, 12);
  assert.equal(receipt.targetFingerprint, expectedFingerprint, 'Wrong database target');
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
  const client = await pool.connect();
  let inTransaction = false;
  try {
    async function beginLocked() {
      await client.query('BEGIN'); inTransaction = true;
      await client.query("SET LOCAL lock_timeout='5s'");
      await client.query("SET LOCAL statement_timeout='30s'");
      await client.query('LOCK TABLE public.tutorial_progress IN ACCESS EXCLUSIVE MODE');
    }
    await beginLocked();
    receipt.before = await snapshot(client); requireBefore(receipt.before); save();
    await client.query(sql);
    requireAfter(await snapshot(client), receipt.before);
    await client.query('ROLLBACK'); inTransaction = false;
    assert.deepEqual(await snapshot(client), receipt.before, 'DDL rollback did not restore prior schema');
    receipt.rollbackRehearsal = 'PASS'; save();
    if (process.argv[2] !== '--apply-approved') { console.log(JSON.stringify({ rehearsal: 'PASS', committed: false })); return; }
    await beginLocked();
    const before = await snapshot(client); requireBefore(before);
    assert.deepEqual(before, receipt.before, 'Database changed after rehearsal');
    await client.query(sql);
    receipt.afterInsideTransaction = await snapshot(client); requireAfter(receipt.afterInsideTransaction, before);
    save();
    await client.query('COMMIT'); inTransaction = false; receipt.committed = true; save();
    await client.query('BEGIN READ ONLY'); inTransaction = true;
    receipt.afterCommitted = await snapshot(client); requireAfter(receipt.afterCommitted, before);
    await client.query('ROLLBACK'); inTransaction = false;
    receipt.finishedAt = new Date().toISOString(); receipt.verification = 'PASS'; save();
    console.log(JSON.stringify({ committed: true, verification: 'PASS', rollbackRehearsal: 'PASS', rows: receipt.afterCommitted.counts, targetFingerprint: receipt.targetFingerprint, sqlHash: expectedHash }));
  } finally {
    if (inTransaction) await client.query('ROLLBACK');
    client.release(); await pool.end();
  }
}
main().catch(e => { receipt.error = { name: e.name, code: e.code, message: e instanceof assert.AssertionError ? e.message : 'Migration failed; inspect safe SQLSTATE and receipt' }; save(); console.error(JSON.stringify(receipt.error)); process.exitCode = 1; });
