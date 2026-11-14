import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { Pool as PgPool } from 'pg';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { migratePeople, preparePeopleMigrations } from '../../packages/db-people/src/migration-compatibility';

neonConfig.webSocketConstructor = WebSocket;
const url = new URL(process.env.R6_NEON_TEST_URL || '');
if (url.hostname !== 'ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech' || url.pathname !== '/people_prod') throw new Error('Explicit disposable target required');
url.hostname = url.hostname.replace('-pooler.', '.');
const root = path.resolve('.');
const evidence = path.join(root, '.evidence/r6-final-migration');
const prefix = 'r6b_final_' + crypto.randomBytes(5).toString('hex');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
const folder = path.join(root, 'packages/db-people/migrations');
const receipts: Array<Record<string, unknown>> = [];
const resources: Array<{ database: string; deleted?: boolean }> = [];
const pgPools: PgPool[] = [];
const migrationPools: Pool[] = [];
let control: PgPool;
let fresh: { pg: PgPool; migration: Pool; name: string };
const names = ['subscription_features_plan_id_subscription_plans_id_fk', 'user_features_cache_user_id_users_id_fk', 'idx_subscription_features_plan', 'idx_subscription_plans_active', 'idx_user_features_cache_user', 'idx_subscriptions_user_active', 'idx_sso_sessions_family'];

function save() { fs.writeFileSync(path.join(evidence, 'SCENARIOS.json'), JSON.stringify({ baseline: '3358fe9b1f61dd75fa5adaeb4710c8b94ca940b4', prefix, resources, receipts }, null, 2)); }
function connection(database: string) { const target = new URL(url); target.pathname = '/' + database; return target.toString(); }
async function verify(pool: PgPool, database: string) {
  const row = (await pool.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch,current_setting('neon.project_id') AS project")).rows[0];
  expect(row).toEqual({ database, branch: 'br-young-silence-a1b1ta26', project: 'bitter-tree-18287476' });
}
async function create(label: string) {
  await verify(control, 'people_prod');
  const name = prefix + '_' + label;
  await control.query('CREATE DATABASE "' + name + '"'); resources.push({ database: name }); save();
  const pg = new PgPool({ connectionString: connection(name), max: 2, options: '-c search_path=public', statement_timeout: 20000 });
  pg.on('error', () => undefined); pgPools.push(pg); await verify(pg, name);
  const migration = new Pool({ connectionString: connection(name), max: 2, connectionTimeoutMillis: 15000 });
  migration.on('error', () => undefined); migrationPools.push(migration);
  return { name, pg, migration };
}
async function check(name: string, body: () => Promise<unknown>) {
  const started = new Date().toISOString();
  try { const detail = await body(); receipts.push({ name, started, finished: new Date().toISOString(), result: 'PASS', detail }); }
  catch (error) { receipts.push({ name, started, result: 'FAIL', message: error instanceof Error ? error.message.replaceAll(decodeURIComponent(url.password), '[REDACTED]') : 'Failure' }); throw error; }
  finally { save(); }
}
function fixtureFolder(label: string, through = 9) {
  const dest = path.join(temporary, label); fs.mkdirSync(path.join(dest, 'meta'), { recursive: true });
  const journal = JSON.parse(fs.readFileSync(path.join(folder, 'meta/_journal.json'), 'utf8'));
  journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx <= through);
  for (const entry of journal.entries) fs.copyFileSync(path.join(folder, entry.tag + '.sql'), path.join(dest, entry.tag + '.sql'));
  fs.writeFileSync(path.join(dest, 'meta/_journal.json'), JSON.stringify(journal)); return dest;
}
async function ledger(pool: PgPool) { return (await pool.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows; }
async function cli(database: string, label: string) {
  const env = { ...process.env, NODE_ENV: 'test', NEXT_TELEMETRY_DISABLED: '1' };
  for (const key of Object.keys(env)) if (/DATABASE|UPSTASH|QSTASH|REDIS|SMTP|RESEND|OPENAI|GEMINI/.test(key)) delete env[key];
  const file = path.join(evidence, label + '-receipt.json');
  Object.assign(env, { DATABASE_DIRECT_URL_PEOPLE: connection(database), DATABASE_URL_PEOPLE: connection(database), PEOPLE_MIGRATION_RECEIPT: file });
  const args = ['--filter', '@quiz/db-people', 'db:migrate'];
  const command = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
  let output = '';
  const code = await new Promise<number | null>(resolve => {
    const child = spawn(process.execPath, [command, ...args], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', data => output += data); child.stderr.on('data', data => output += data); child.on('exit', resolve);
  });
  fs.writeFileSync(path.join(evidence, label + '.log'), output.replaceAll(decodeURIComponent(url.password), '[REDACTED]'));
  expect(code).toBe(0); return { command: 'pnpm ' + args.join(' '), exitCode: code, receipt: JSON.parse(fs.readFileSync(file, 'utf8')) };
}
beforeAll(async () => {
  control = new PgPool({ connectionString: connection('people_prod'), max: 1 }); control.on('error', () => undefined);
  await verify(control, 'people_prod'); fresh = await create('fresh');
});

describe.sequential('Approved PeopleDB migration correction', () => {
  it('fresh supported CLI replays prerequisite 0000 then 0001-0009', () => check('Fresh CLI replay', async () => {
    const result = await cli(fresh.name, 'fresh-cli');
    expect(result.receipt.executed).toHaveLength(10);
    expect(result.receipt.decisions.map((row: { object: string }) => row.object).sort()).toEqual([...names].sort());
    expect(result.receipt.decisions.every((row: { decision: string }) => row.decision === 'equivalent_existing')).toBe(true);
    const migrations = preparePeopleMigrations(folder);
    const rows = await ledger(fresh.pg);
    expect(rows.map(row => row.hash)).toEqual(migrations.map(row => row.originalHash));
    expect(rows.map(row => Number(row.created_at))).toEqual(migrations.map(row => row.folderMillis));
    return { command: result.command, exitCode: 0, ledgerCount: rows.length, decisions: result.receipt.decisions, representationHashes: result.receipt.executed };
  }));
  it('repeated supported CLI is idempotent', () => check('Repeated CLI', async () => {
    const before = await ledger(fresh.pg); const result = await cli(fresh.name, 'repeat-cli');
    expect(result.receipt.executed).toEqual([]); expect(await ledger(fresh.pg)).toEqual(before);
    return { exitCode: 0, changedMigrations: 0 };
  }));
  it('both FK definitions and all index definitions match the catalog and enforce integrity', () => check('Definition and integrity checks', async () => {
    const wrappers = preparePeopleMigrations(folder).find(row => row.tag === '0007_long_sentinels')!.sql.filter(statement => statement.startsWith('DO $people_compat$'));
    for (const statement of wrappers) await fresh.pg.query(statement);
    await expect(fresh.pg.query("INSERT INTO subscription_features(plan_id,feature_key) VALUES($1,'exam.basic')", [crypto.randomUUID()])).rejects.toMatchObject({ code: '23503' });
    await expect(fresh.pg.query('INSERT INTO user_features_cache(user_id) VALUES($1)', [crypto.randomUUID()])).rejects.toMatchObject({ code: '23503' });
    const constraints = (await fresh.pg.query("SELECT conname,pg_get_constraintdef(oid) AS definition,convalidated,condeferrable FROM pg_constraint WHERE conname=ANY($1::text[]) ORDER BY conname", [names.slice(0, 2)])).rows;
    const indexes = (await fresh.pg.query('SELECT indexname,indexdef FROM pg_indexes WHERE indexname=ANY($1::text[]) ORDER BY indexname', [names.slice(2)])).rows;
    expect(constraints).toHaveLength(2); expect(indexes).toHaveLength(5);
    return { constraints, indexes, orphanDenialSQLSTATE: '23503' };
  }));
  for (const name of names) {
    it('creates an absent expected object ' + name, () => check('Absent ' + name, async () => {
      const client = await fresh.pg.connect();
      try {
        await client.query('BEGIN');
        const index = names.indexOf(name);
        const table = ['subscription_features','user_features_cache','subscription_features','subscription_plans','user_features_cache','subscriptions','sso_sessions'][index];
        await client.query(index < 2 ? `ALTER TABLE ${table} DROP CONSTRAINT "${name}"` : `DROP INDEX "${name}"`);
        const wrapper = preparePeopleMigrations(folder).find(row => row.tag === '0007_long_sentinels')!.sql.find(statement => statement.startsWith('DO $people_compat$') && statement.includes(name))!;
        await client.query(wrapper); await client.query('ROLLBACK'); return { createdAndDefinitionValidated: true, fixtureMutationRolledBack: true };
      } finally { await client.query('ROLLBACK').catch(() => {}); client.release(); }
    }));
    it('rejects a mismatched existing object ' + name, () => check('Mismatch ' + name, async () => {
      const client = await fresh.pg.connect();
      try {
        await client.query('BEGIN');
        const index = names.indexOf(name);
        if (index < 2) {
          const table = index === 0 ? 'subscription_features' : 'user_features_cache';
          const column = index === 0 ? 'plan_id' : 'user_id'; const target = index === 0 ? 'subscription_plans' : 'users';
          await client.query(`ALTER TABLE ${table} DROP CONSTRAINT "${name}"; ALTER TABLE ${table} ADD CONSTRAINT "${name}" FOREIGN KEY(${column}) REFERENCES ${target}(id) ON DELETE RESTRICT`);
        } else {
          const table = ['subscription_features','subscription_plans','user_features_cache','subscriptions','sso_sessions'][index-2];
          const columns = ['feature_key,plan_id','name,is_active','cached_at,user_id','status,user_id','revoked_at,jwt_family'][index-2];
          await client.query(`DROP INDEX "${name}"; CREATE INDEX "${name}" ON ${table}(${columns})`);
        }
        const wrapper = preparePeopleMigrations(folder).find(row => row.tag === '0007_long_sentinels')!.sql.find(statement => statement.startsWith('DO $people_compat$') && statement.includes(name))!;
        await expect(client.query(wrapper)).rejects.toMatchObject({ code: 'P0001' });
        return { failedClosedSQLSTATE: 'P0001' };
      } finally { await client.query('ROLLBACK'); client.release(); }
    }));
  }
  it('upgrades an existing 0000-0008 baseline through pending 0009, then repeats safely', () => check('Pending 0009 upgrade', async () => {
    const target = await create('upgrade'); const priorFolder = fixtureFolder('pre9', 8);
    await migratePeople(target.migration, priorFolder);
    const before = await ledger(target.pg); expect(before).toHaveLength(9);
    const result = await migratePeople(target.migration, folder);
    expect(result.executed.map(row => row.tag)).toEqual(['0009_student_invitations']);
    const after = await ledger(target.pg); expect(after.slice(0, 9)).toEqual(before);
    expect((await migratePeople(target.migration, folder)).executed).toEqual([]);
    return { originalLedgerPreserved: true, executed: result.executed, afterCount: after.length };
  }));
  it('rejects definition drift at the supported runner boundary even for an already-applied migration', () => check('Applied definition drift', async () => {
    const name = names[0];
    await fresh.pg.query(`ALTER TABLE subscription_features DROP CONSTRAINT "${name}"; ALTER TABLE subscription_features ADD CONSTRAINT "${name}" FOREIGN KEY(plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT`);
    try {
      const before = await ledger(fresh.pg);
      await expect(migratePeople(fresh.migration, folder)).rejects.toThrow('P0001');
      expect(await ledger(fresh.pg)).toEqual(before);
      return { failedClosed: true, SQLSTATE: 'P0001', appliedLedgerPreserved: true };
    } finally {
      await fresh.pg.query(`ALTER TABLE subscription_features DROP CONSTRAINT "${name}"; ALTER TABLE subscription_features ADD CONSTRAINT "${name}" FOREIGN KEY(plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
  }));
  it('candidate normalized uniqueness upgrade preserves independent same-email brands and access constraints', () => check('Candidate uniqueness and access', async () => {
    const candidate = fixtureFolder('candidate'); const journalPath = path.join(candidate, 'meta/_journal.json');
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    const sql = fs.readFileSync('.evidence/r6-neon-qualification/CANDIDATE_UNIQUENESS_REHEARSAL.sql', 'utf8');
    fs.writeFileSync(path.join(candidate, '0010_candidate.sql'), sql); journal.entries.push({ idx: 10, version: '7', when: 1794618000000, tag: '0010_candidate', breakpoints: true }); fs.writeFileSync(journalPath, JSON.stringify(journal));
    const result = await migratePeople(fresh.migration, candidate); expect(result.executed.map(row => row.tag)).toEqual(['0010_candidate']);
    const email = prefix + '@example.invalid';
    for (const brand of ['skillup', 'realtutorialhub']) await fresh.pg.query('INSERT INTO users(email,password_hash,platform) VALUES($1,$2,$3)', [email, 'synthetic-only', brand]);
    await expect(fresh.pg.query("INSERT INTO users(email,password_hash,platform) VALUES($1,'synthetic-only','skillup')", [' ' + email.toUpperCase() + ' '])).rejects.toMatchObject({ code: '23505' });
    const id = (await fresh.pg.query("SELECT id FROM users WHERE email=$1 AND platform='skillup'", [email])).rows[0].id;
    await fresh.pg.query("INSERT INTO platform_access(user_id,platform) VALUES($1,'skillup')", [id]);
    await expect(fresh.pg.query("INSERT INTO platform_access(user_id,platform) VALUES($1,'skillup')", [id])).rejects.toMatchObject({ code: '23505' });
    await expect(fresh.pg.query("INSERT INTO platform_access(user_id,platform) VALUES($1,'skillup')", [crypto.randomUUID()])).rejects.toMatchObject({ code: '23503' });
    return { sameEmailIndependentBrands: true, normalizedUniquenessSQLSTATE: '23505', grantUniquenessSQLSTATE: '23505', grantForeignKeySQLSTATE: '23503', candidateSourceHash: crypto.createHash('sha256').update(sql).digest('hex') };
  }));
  it('rejects changed pinned inputs before execution', () => check('Pinned source mismatch', async () => {
    const modified = fixtureFolder('tampered'); fs.appendFileSync(path.join(modified, '0007_long_sentinels.sql'), '\n-- unapproved change\n');
    expect(() => preparePeopleMigrations(modified)).toThrow('pinned migration mismatch'); return { databaseExecution: false, failedClosed: true };
  }));
  it('rejects an inconsistent recorded migration hash without advancing the ledger', () => check('Applied hash drift', async () => {
    const before = await ledger(fresh.pg);
    await fresh.pg.query("UPDATE drizzle.__drizzle_migrations SET hash='synthetic-invalid-hash' WHERE id=$1", [before[0].id]);
    try {
      await expect(migratePeople(fresh.migration, fixtureFolder('ledger-candidate'))).rejects.toThrow('MIGRATION_REJECTED');
      expect((await ledger(fresh.pg)).length).toBe(before.length);
      return { failedClosed: true, ledgerAdvancement: false };
    } finally {
      await fresh.pg.query('UPDATE drizzle.__drizzle_migrations SET hash=$1 WHERE id=$2', [before[0].hash, before[0].id]);
    }
  }));
  it('rolls back failed pending DDL and ledger advancement', () => check('Atomic failure rollback', async () => {
    const target = await create('rollback'); await migratePeople(target.migration, folder); const before = await ledger(target.pg);
    const candidate = fixtureFolder('failure'); const journalPath = path.join(candidate, 'meta/_journal.json'); const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    fs.writeFileSync(path.join(candidate, '0010_failure.sql'), 'CREATE TABLE r6_failed_marker(id int);--> statement-breakpoint\nSELECT 1/0;'); journal.entries.push({ idx: 10, version: '7', when: 1794618000000, tag: '0010_failure', breakpoints: true }); fs.writeFileSync(journalPath, JSON.stringify(journal));
    await expect(migratePeople(target.migration, candidate)).rejects.toThrow('22012');
    expect(await ledger(target.pg)).toEqual(before); expect((await target.pg.query("SELECT to_regclass('public.r6_failed_marker') AS object")).rows[0].object).toBeNull();
    return { failedClosedSQLSTATE: '22012', ledgerUnchanged: true, ddlRolledBack: true };
  }));
  it('serializes concurrent supported migrations', () => check('Concurrent migration admission', async () => {
    const target = await create('concurrent'); const results = await Promise.allSettled([migratePeople(target.migration, folder), migratePeople(target.migration, folder)]);
    const completed = results.filter((row): row is PromiseFulfilledResult<Awaited<ReturnType<typeof migratePeople>>> => row.status === 'fulfilled');
    expect(completed.some(row => row.value.executed.length === 10)).toBe(true);
    for (const result of results) if (result.status === 'rejected') expect(String(result.reason)).toContain('55P03');
    expect(await ledger(target.pg)).toHaveLength(10);
    expect((await migratePeople(target.migration, folder)).executed).toEqual([]);
    return { executionCounts: completed.map(row => row.value.executed.length), boundedLockTimeouts: results.length-completed.length, finalLedgerRows: 10, safeRetry: true };
  }));
});

afterAll(async () => {
  for (const pool of migrationPools) await pool.end();
  for (const pool of pgPools) await pool.end();
  try {
    await verify(control, 'people_prod');
    for (const resource of resources) { if (!resource.database.startsWith(prefix + '_')) throw new Error('Unowned cleanup target'); await control.query('DROP DATABASE "' + resource.database + '" WITH (FORCE)'); resource.deleted = true; }
    const remaining = (await control.query('SELECT datname FROM pg_database WHERE datname=ANY($1::text[])', [resources.map(row=>row.database)])).rows;
    expect(remaining).toEqual([]); fs.writeFileSync(path.join(evidence,'CLEANUP.json'), JSON.stringify({ resources, remaining, branchRetained: true }, null, 2));
  } finally { await control?.end(); fs.rmSync(temporary, { recursive:true, force:true }); save(); }
}, 120000);
