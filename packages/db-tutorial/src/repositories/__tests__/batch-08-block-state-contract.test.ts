import { describe, expect, it, vi } from 'vitest';
import { BlockLearningStateRepository } from '../block-learning-state.repository';
import { blockLearningState } from '../../schema/block-learning-state';

vi.mock('@quiz/db', () => ({ withTimeout: (promise: Promise<unknown>) => promise, STANDARD_QUERY_TIMEOUT: 15000, REPORT_QUERY_TIMEOUT: 30000 }));
describe('block state repository isolated upsert contract', () => {
  it('selects full identity conflict key and supplies additive deltas without touching canary', async () => {
    const rows = new Map<string, number>([['other:node:block:D1', 77]]);
    let pending: any;
    const conflict = vi.fn((options: any) => ({ returning: async () => {
      const key = `${pending.userId}:${pending.navigationNodeId}:${pending.blockId}:${pending.blockVersion}`;
      const total = (rows.get(key) ?? 0) + pending.activeTimeSec; rows.set(key, total);
      return [{ ...pending, activeTimeSec: total }];
    } }));
    const db = { insert: () => ({ values: (data: any) => { pending = data; return { onConflictDoUpdate: conflict }; } }) };
    const repo = new BlockLearningStateRepository(db as never);
    const identity = { userId: 'owner', navigationNodeId: 'node', blockId: 'block', blockVersion: 'D1' };
    expect((await repo.upsert({ ...identity, activeTimeSec: 10 })).activeTimeSec).toBe(10);
    expect((await repo.upsert({ ...identity, activeTimeSec: 20 })).activeTimeSec).toBe(30);
    expect(rows.get('other:node:block:D1')).toBe(77);
    expect(conflict.mock.calls[0][0].target).toEqual([blockLearningState.userId, blockLearningState.navigationNodeId, blockLearningState.blockId, blockLearningState.blockVersion]);
    expect(conflict.mock.calls[0][0].set.activeTimeSec).toBeDefined();
  });
});
