import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ database: undefined as unknown, failAfterDelete: false }));
vi.mock('@quiz/db', async importOriginal => {
  const actual = await importOriginal<typeof import('@quiz/db')>();
  return { ...actual, getDb: () => state.database };
});
import { AcademicHierarchyService } from '../academic-hierarchy.service';

describe.skipIf(process.env.RUN_HIERARCHY_REMOTE_UAT !== '1')('R3 real remote MainDB hierarchy qualification', () => {
  const tag = `r3-evidence-${randomUUID()}`;
  const domainIds: string[] = [];
  const subjectIds: string[] = [];
  const results: string[] = [];
  let pool: Pool;
  beforeAll(async () => {
    neonConfig.webSocketConstructor = WebSocket;
    const config = parse(readFileSync(path.resolve('../../.env.local')));
    if (!config.DATABASE_URL) throw new Error('Configured MainDB connection required');
    pool = new Pool({ connectionString: config.DATABASE_URL, max: 4, application_name: tag, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
    await pool.query('SELECT id FROM public.domains LIMIT 0');
    const database = drizzle(pool);
    state.database = {
      transaction: <T>(operation: Parameters<typeof database.transaction<T>>[0]) => database.transaction(async tx => {
        const value = await operation(tx);
        if (state.failAfterDelete) throw new Error('R3 injected rollback after domain deletion');
        return value;
      }),
    };
  });
  async function domain() {
    const id = randomUUID();
    await pool.query('INSERT INTO public.domains(id,name) VALUES($1,$2)', [id, `${tag}-${id}`]);
    domainIds.push(id);
    return id;
  }
  async function subject(parent: string, deleted = false) {
    const id = randomUUID();
    await pool.query('INSERT INTO public.subjects(id,domain_id,name,deleted_at) VALUES($1,$2,$3,$4)', [id, parent, `${tag}-${id}`, deleted ? new Date() : null]);
    subjectIds.push(id);
    return id;
  }
  afterAll(async () => {
    state.failAfterDelete = false;
    if (!pool) return;
    let cleanupVerified = false;
    try {
      await pool.query('DELETE FROM public.subjects WHERE id=ANY($1::uuid[]) AND name LIKE $2', [subjectIds, `${tag}%`]);
      await pool.query('DELETE FROM public.domains WHERE id=ANY($1::uuid[]) AND name LIKE $2', [domainIds, `${tag}%`]);
      const remaining = await pool.query('SELECT (SELECT count(*) FROM public.domains WHERE id=ANY($1::uuid[])) + (SELECT count(*) FROM public.subjects WHERE id=ANY($2::uuid[])) AS n', [domainIds, subjectIds]);
      cleanupVerified = Number(remaining.rows[0].n) === 0;
    } finally {
      await pool.end();
      writeFileSync(path.resolve('../../.evidence/r3-acceptance-20261112/hierarchy-remote-results.json'), JSON.stringify({ boundary: 'Actual AcademicHierarchyService with real PostgreSQL transactions, row locks and FK enforcement. Provider binding selects a real Neon connection. Fault injection occurs after the real transactional delete. Domain/subject scope only.', passedScenarios: results, cleanupVerified }, null, 2));
      expect(cleanupVerified).toBe(true);
    }
  });
  it('deletes an empty synthetic domain through the production service', async () => {
    const id = await domain();
    expect((await AcademicHierarchyService.deleteDomain(id)).status).toBe(200);
    expect((await pool.query('SELECT id FROM public.domains WHERE id=$1', [id])).rowCount).toBe(0);
    results.push('empty domain service deletion');
  });
  it('preserves a domain and physically retained soft-deleted subject', async () => {
    const id = await domain(); const child = await subject(id, true);
    expect((await AcademicHierarchyService.deleteDomain(id)).status).toBe(409);
    expect((await pool.query('SELECT id FROM public.subjects WHERE id=$1', [child])).rowCount).toBe(1);
    expect((await pool.query('SELECT id FROM public.domains WHERE id=$1', [id])).rowCount).toBe(1);
    results.push('retained dependency blocks service deletion');
  });
  it('rejects an orphan subject at the actual PostgreSQL FK boundary', async () => {
    const id = randomUUID();
    await expect(pool.query('INSERT INTO public.subjects(id,domain_id,name) VALUES($1,$2,$3)', [id, randomUUID(), `${tag}-${id}`])).rejects.toMatchObject({ code: '23503' });
    results.push('PostgreSQL FK rejects missing parent');
  });
  it('rolls back a real service deletion when the transaction fails afterward', async () => {
    const id = await domain(); state.failAfterDelete = true;
    try { expect((await AcademicHierarchyService.deleteDomain(id)).status).toBe(500); }
    finally { state.failAfterDelete = false; }
    expect((await pool.query('SELECT id FROM public.domains WHERE id=$1', [id])).rowCount).toBe(1);
    results.push('post-delete failure restores row through transaction rollback');
  });
  it('serializes concurrent service deletes into success and missing-row outcomes', async () => {
    const id = await domain();
    const outcomes = await Promise.all([AcademicHierarchyService.deleteDomain(id), AcademicHierarchyService.deleteDomain(id)]);
    expect(outcomes.map(outcome => outcome.status).sort()).toEqual([200, 404]);
    results.push('concurrent production service deletes serialize');
  });
  it('waits for a concurrent child insertion and then denies parent deletion', async () => {
    const id = await domain(); const child = randomUUID();
    const writer = await pool.connect();
    let deletion: ReturnType<typeof AcademicHierarchyService.deleteDomain> | undefined;
    try {
      await writer.query('BEGIN');
      await writer.query('INSERT INTO public.subjects(id,domain_id,name) VALUES($1,$2,$3)', [child, id, `${tag}-${child}`]);
      deletion = AcademicHierarchyService.deleteDomain(id);
      let observedWait = false;
      const deadline = Date.now() + 7000;
      while (Date.now() < deadline) {
        const activity = await pool.query("SELECT 1 FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' LIMIT 1", [tag]);
        if (activity.rowCount) { observedWait = true; break; }
        await new Promise(resolve => setTimeout(resolve, 75));
      }
      expect(observedWait).toBe(true);
      await writer.query('COMMIT'); subjectIds.push(child);
      expect((await deletion).status).toBe(409);
      expect((await pool.query('SELECT id FROM public.domains WHERE id=$1', [id])).rowCount).toBe(1);
      results.push('FOR UPDATE waits for FK writer and retains parent plus child');
    } finally {
      await writer.query('ROLLBACK'); writer.release();
      if (deletion) await deletion;
    }
  }, 30000);
});
