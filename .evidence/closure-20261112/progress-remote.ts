import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { TutorialProgressRepository } from '../../packages/db-tutorial/src/repositories/tutorial-progress.repository';

neonConfig.webSocketConstructor = WebSocket;
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const env = parse(fs.readFileSync(path.join(root, '.env.local')));
const connectionString = env.DATABASE_DIRECT_URL_TUTORIAL || env.DATABASE_URL_TUTORIAL;
const target = new URL(connectionString);
assert.equal(crypto.createHash('sha256').update(target.hostname + target.pathname).digest('hex').slice(0, 12), 'd69fe9af7c33');
const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
const db = drizzle(pool);
const repo = new TutorialProgressRepository(db as never);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
function safeCode(e: unknown): string | undefined {
  if (!e || typeof e !== 'object') return undefined;
  return 'code' in e ? String(e.code) : 'cause' in e ? safeCode(e.cause) : undefined;
}

async function worker() {
  const [user, topic, block, marker, release] = process.argv.slice(3);
  const original = repo.getProgress.bind(repo);
  let first = true;
  repo.getProgress = async (...args) => {
    const row = await original(...args);
    if (first) {
      first = false;
      fs.writeFileSync(marker, 'ready');
      const deadline = Date.now() + 20000;
      while (!fs.existsSync(release)) {
        if (Date.now() > deadline) throw new Error('barrier timeout');
        await sleep(30);
      }
    }
    return row;
  };
  try {
    await repo.markBlockComplete(user, topic, block as 'code', 'skillup');
    console.log(JSON.stringify({ pass: true }));
  } catch (e) {
    console.log(JSON.stringify({ pass: false, code: safeCode(e), error: e instanceof Error ? e.name : 'unknown' }));
    process.exitCode = 1;
  } finally { await pool.end(); }
}

async function main() {
  const user = crypto.randomUUID();
  const topic = crypto.randomUUID();
  const results: Array<Record<string, unknown>> = [];
  let cleanupVerified = false;
  const run = async (name: string, action: () => Promise<void>) => {
    try { await action(); results.push({ name, pass: true }); }
    catch (e) { results.push({ name, pass: false, code: safeCode(e), error: e instanceof assert.AssertionError ? e.message : e instanceof Error ? e.name : 'unknown' }); }
  };
  async function race(label: string) {
    const release = path.join(here, `${user}-${label}.release`);
    const markers = [0, 1].map(i => path.join(here, `${user}-${label}-${i}.ready`));
    const children = markers.map((marker, i) => {
      const child = spawn(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), '--worker', user, topic, i ? 'technical' : 'code', marker, release], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', chunk => { output += chunk; });
      child.stderr.on('data', () => {});
      const finished = new Promise<{ code: number | null; output: string }>(resolve => child.on('close', code => resolve({ code, output })));
      return { child, finished };
    });
    try {
      const deadline = Date.now() + 45000;
      while (!markers.every(m => fs.existsSync(m))) {
        if (Date.now() > deadline) throw new Error('worker readiness timeout');
        await sleep(50);
      }
      fs.writeFileSync(release, 'go');
      const outcomes = await Promise.all(children.map(c => c.finished));
      const safeOutcomes = outcomes.map(o => ({ code: o.code, result: o.output.trim().split('\n').filter(Boolean).at(-1) }));
      assert.ok(outcomes.every(o => o.code === 0), JSON.stringify(safeOutcomes));
      const progress = await repo.getProgress(user, topic, 'skillup');
      assert.ok(progress?.blocksCompleted.includes('code'));
      assert.ok(progress?.blocksCompleted.includes('technical'));
    } finally {
      for (const c of children) if (c.child.exitCode === null) c.child.kill();
      await Promise.all(children.map(c => c.finished));
      for (const f of [...markers, release]) if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
  const initialCount = (await pool.query('SELECT count(*)::text AS count FROM public.tutorial_progress')).rows[0].count;
  try {
    await run('concurrent_create_independent_processes', () => race('create'));
    await run('independent_tenant_rows_and_fresh_connection', async () => {
      await repo.resetProgress(user, topic, 'realtutorialhub');
      const rows = await pool.query('SELECT tenant_id FROM public.tutorial_progress WHERE user_id=$1 AND subtopic_id=$2 ORDER BY tenant_id', [user, topic]);
      assert.deepEqual(rows.rows.map(r => r.tenant_id), ['realtutorialhub', 'skillup']);
      const otherPool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
      try {
        const other = new TutorialProgressRepository(drizzle(otherPool) as never);
        assert.equal((await other.getProgress(user, topic, 'realtutorialhub'))?.status, 'not_started');
        assert.ok((await other.getProgress(user, topic, 'skillup'))?.blocksCompleted.length);
      } finally { await otherPool.end(); }
    });
    await run('concurrent_update_cas_independent_processes', async () => {
      await repo.resetProgress(user, topic, 'skillup');
      await race('update');
    });
    await run('rth_reset_does_not_clear_suia', async () => {
      const before = await repo.getProgress(user, topic, 'skillup');
      await repo.resetProgress(user, topic, 'realtutorialhub');
      const after = await repo.getProgress(user, topic, 'skillup');
      assert.deepEqual(after?.blocksCompleted, before?.blocksCompleted);
      assert.equal(after?.version, before?.version);
    });
    await run('wrong_tenant_and_missing_tenant_fail_closed', async () => {
      assert.equal(await repo.getProgress(user, topic, 'skillhubcore'), undefined);
      await assert.rejects(() => repo.getProgress(user, topic), /Verified tenant/);
      await assert.rejects(() => repo.getProgress(user, topic, 'shared'), /Invalid tenant/);
    });
    for (const [label, tenant, expectedCode] of [['null_tenant', null, '23502'], ['shared_tenant', 'shared', '23514'], ['duplicate_identity', 'skillup', '23505']] as const) {
      await run(`database_rejects_${label}`, async () => {
        const c = await pool.connect();
        try {
          await c.query('BEGIN');
          let code: string | undefined;
          try { await c.query('INSERT INTO public.tutorial_progress(user_id,subtopic_id,tenant_id) VALUES($1,$2,$3)', [user, topic, tenant]); }
          catch (e) { code = safeCode(e); }
          assert.equal(code, expectedCode);
        } finally { await c.query('ROLLBACK'); c.release(); }
      });
    }
    await run('database_transaction_rolls_back_update', async () => {
      const before = await repo.getProgress(user, topic, 'skillup');
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        await c.query("UPDATE public.tutorial_progress SET blocks_completed='[]'::jsonb WHERE user_id=$1 AND subtopic_id=$2 AND tenant_id='skillup'", [user, topic]);
        await c.query('ROLLBACK');
      } finally { c.release(); }
      assert.deepEqual((await repo.getProgress(user, topic, 'skillup'))?.blocksCompleted, before?.blocksCompleted);
    });
    await run('repeated_completion_is_idempotent', async () => {
      const before = await repo.getProgress(user, topic, 'skillup');
      await repo.markBlockComplete(user, topic, 'code', 'skillup');
      const after = await repo.getProgress(user, topic, 'skillup');
      assert.deepEqual(after?.blocksCompleted, before?.blocksCompleted);
      assert.equal(after?.version, before?.version);
    });
    await run('retained_deleted_identity_is_not_revived', async () => {
      await pool.query("UPDATE public.tutorial_progress SET deleted_at=now() WHERE user_id=$1 AND subtopic_id=$2 AND tenant_id='realtutorialhub'", [user, topic]);
      await assert.rejects(() => repo.markBlockComplete(user, topic, 'code', 'realtutorialhub'), /no active tenant-scoped row/);
      const rows = await pool.query("SELECT deleted_at IS NOT NULL AS retained FROM public.tutorial_progress WHERE user_id=$1 AND subtopic_id=$2 AND tenant_id='realtutorialhub'", [user, topic]);
      assert.deepEqual(rows.rows, [{ retained: true }]);
    });
  } finally {
    await pool.query('DELETE FROM public.tutorial_progress WHERE user_id=$1 AND subtopic_id=$2', [user, topic]);
    cleanupVerified = (await pool.query('SELECT count(*)::int AS count FROM public.tutorial_progress WHERE user_id=$1 AND subtopic_id=$2', [user, topic])).rows[0].count === 0;
    const finalCount = (await pool.query('SELECT count(*)::text AS count FROM public.tutorial_progress')).rows[0].count;
    await pool.end();
    const report = { timestamp: new Date().toISOString(), boundary: 'Owner-approved remote development DB; real repository, real PostgreSQL, independent Node processes. Synthetic progress rows only; no browser/session claim.', initialCount, finalCount, cleanupVerified, results };
    fs.writeFileSync(path.join(here, 'progress-remote-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    if (!cleanupVerified || results.some(r => !r.pass)) process.exitCode = 1;
  }
}
(process.argv[2] === '--worker' ? worker() : main()).catch(e => { console.error(JSON.stringify({ error: e instanceof Error ? e.name : 'unknown', code: safeCode(e) })); process.exitCode = 1; });
