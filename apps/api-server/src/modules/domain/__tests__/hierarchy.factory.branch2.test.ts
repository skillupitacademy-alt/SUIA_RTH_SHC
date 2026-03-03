import { describe, it, expect, vi, afterEach } from 'vitest';

import { HierarchyFactory } from '../hierarchy.factory';

const baseTx = () =>
  ({
    query: {
      domains: { findFirst: vi.fn() },
      skills: { findFirst: vi.fn() },
      subjects: { findFirst: vi.fn() },
      topics: { findFirst: vi.fn() },
      subtopics: { findFirst: vi.fn() },
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

    expect(results.batchDomains).toEqual(['existing', 'new-domain']);
    expect(results.stats.domains.skipped).toBe(1);
    expect(results.stats.domains.added).toBe(1);
  });

  it('handleBatchSkills skips existing and adds new skills', async () => {
    const tx = baseTx();
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

    expect(results.batchSkills).toEqual(['skill-old', 'skill-new']);
    expect(results.stats.skills.skipped).toBe(1);
    expect(results.stats.skills.added).toBe(1);
  });
});
