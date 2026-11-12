import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@quiz/db', () => ({ withTimeout: (p: Promise<unknown>) => p, STANDARD_QUERY_TIMEOUT: 1000, REPORT_QUERY_TIMEOUT: 1000 }));
vi.mock('../../db', () => ({ db: {} }));
import { TutorialProgressRepository } from '../tutorial-progress.repository';

// This fixture checks real Drizzle predicates against in-memory tenant rows.
// PostgreSQL enforcement remains an integration-test responsibility.
function fixture() {
  const rows = ['skillup', 'realtutorialhub'].map(tenantId => ({
    id: `progress-${tenantId}`, tenantId, userId: 'same-local-id', subtopicId: 'same-content',
    blocksCompleted: ['notes'], status: 'in_progress', completedAt: null, deletedAt: null, version: 1,
  }));
  const dialect = new PgDialect();
  function scopedRows(predicate: SQL) {
    const query = dialect.sqlToQuery(predicate);
    expect(query.sql).toContain('"tutorial_progress"."tenant_id" =');
    const tenant = query.params.find(p => p === 'skillup' || p === 'realtutorialhub');
    expect(tenant).toBeDefined();
    return rows.filter(row => row.tenantId === tenant);
  }
  const selectWhere = vi.fn(async (predicate: SQL) => scopedRows(predicate).map(row => ({ ...row, blocksCompleted: [...row.blocksCompleted] })));
  const updateWhere = vi.fn((values: Record<string, unknown>, predicate: SQL) => ({
    returning: async () => scopedRows(predicate).map(row => Object.assign(row, values)),
  }));
  const db = {
    select: () => ({ from: () => ({ where: selectWhere }) }),
    update: () => ({ set: (values: Record<string, unknown>) => ({ where: (predicate: SQL) => updateWhere(values, predicate) }) }),
  };
  return { repo: new TutorialProgressRepository(db as never), selectWhere, updateWhere, rows };
}

describe('B08-T08 progress repository tenant predicates', () => {
  it('reads the owner marker with explicit tenant context', async () => {
    const f = fixture();
    expect((await f.repo.getProgress('same-local-id', 'same-content', 'skillup'))?.id).toBe('progress-skillup');
    expect(f.selectWhere).toHaveBeenCalledOnce();
  });
  it('keeps colliding user/subtopic identities separate by tenant', async () => {
    const f = fixture();
    const suia = await f.repo.getProgress('same-local-id', 'same-content', 'skillup');
    const rth = await f.repo.getProgress('same-local-id', 'same-content', 'realtutorialhub');
    expect(suia?.id).toBe('progress-skillup');
    expect(rth?.id).toBe('progress-realtutorialhub');
  });
  it('updates RTH progress without altering the colliding SUIA marker', async () => {
    const f = fixture();
    await f.repo.markBlockComplete('same-local-id', 'same-content', 'code', 'realtutorialhub');
    expect(f.rows[0].blocksCompleted).toEqual(['notes']);
    expect(f.rows[1].blocksCompleted).toEqual(expect.arrayContaining(['notes', 'code']));
    expect(f.updateWhere).toHaveBeenCalledOnce();
  });
  it.each([undefined, '', 'shared', 'unknown'] as const)('rejects invalid tenant %s before storage access', async tenant => {
    const f = fixture();
    await expect(f.repo.getProgress('same-local-id', 'same-content', tenant)).rejects.toThrow(/tenant context/i);
    await expect(f.repo.markBlockComplete('same-local-id', 'same-content', 'code', tenant)).rejects.toThrow(/tenant context/i);
    expect(f.selectWhere).not.toHaveBeenCalled();
    expect(f.updateWhere).not.toHaveBeenCalled();
  });
});
