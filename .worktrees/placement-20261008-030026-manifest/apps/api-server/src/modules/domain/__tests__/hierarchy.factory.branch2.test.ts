import { describe, it, expect, vi, afterEach } from 'vitest';

import { HierarchyFactory } from '../hierarchy.factory';

const baseTx = () =>
  ({
    query: {
      domains: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      skills: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      subjects: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      topics: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      subtopics: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue([{ id: 'new-id' }]),
      }),
    })),
    update: vi.fn(() => ({ set: () => ({ where: () => undefined }) })),
  } as any);

describe('HierarchyFactory batch branches', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handleBatchDomains skips existing and adds new domains', async () => {
    const tx = baseTx();
    tx.query.domains.findMany.mockResolvedValueOnce([{ id: 'existing', name: 'FullStack' }]);
    tx.query.domains.findFirst
      .mockResolvedValueOnce({ id: 'existing', name: 'FullStack' })
      .mockResolvedValueOnce(undefined);
    tx.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue([{ id: 'new-domain' }]),
      }),
    });

    const results = HierarchyFactory['initResults']();
    await HierarchyFactory['handleBatchDomains'](
      tx,
      [{ name: 'FullStack' }, { name: 'AI' }],
      results
    );

    expect(results.batchDomains).toEqual(['new-domain', 'existing']);
    expect(results.stats.domains.skipped).toBe(1);
    expect(results.stats.domains.added).toBe(1);
  });

  it('handleBatchSkills skips existing and adds new skills', async () => {
    const tx = baseTx();
    tx.query.skills.findMany.mockResolvedValueOnce([{ id: 'skill-old', name: 'JS' }]);
    tx.query.skills.findFirst
      .mockResolvedValueOnce({ id: 'skill-old', name: 'JS' })
      .mockResolvedValueOnce(undefined);
    tx.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue([{ id: 'skill-new' }]),
      }),
    });

    const results = HierarchyFactory['initResults']();
    await HierarchyFactory['handleBatchSkills'](
      tx,
      [{ name: 'JS' }, { name: 'TS', mappingType: 'technical', category: 'technical' }],
      results
    );

    expect(results.batchSkills).toEqual(['skill-new', 'skill-old']);
    expect(results.stats.skills.skipped).toBe(1);
    expect(results.stats.skills.added).toBe(1);
  });
});
