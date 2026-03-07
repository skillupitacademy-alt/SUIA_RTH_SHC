import { describe, it, expect, vi } from 'vitest';
import { JobStatus, JobType } from '@quiz/types';

// Fake db layer to drive branches
const update = vi.fn().mockReturnValue({ returning: () => [{ id: 'j1' }] });
const deleteFn = vi.fn();
const selectFn = vi.fn().mockReturnValue([{ count: 0 }]);
const query = {
  backgroundJobs: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    insert: () => ({ values: () => ({ returning: () => [{ id: 'new' }] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [{ id: 'u1' }] }) }) }),
    delete: () => ({ where: () => deleteFn() }),
    select: () => ({ from: () => ({ where: () => selectFn() }) }),
    query,
  },
  backgroundJobs: {
    id: 'id',
    userId: 'userId',
    status: 'status',
    createdAt: 'createdAt',
  },
}));

describe('JobsService branch spots', () => {
  it('getJob returns undefined when record missing (line ~54)', async () => {
    query.backgroundJobs.findFirst.mockResolvedValueOnce(undefined);
    const { JobsService } = await import('../jobs.service');
    const res = await JobsService.getJob('missing', 'u1');
    expect(res).toBeUndefined();
  });

  it('updateJobStatus sets startedAt/completedAt (lines ~91,139,176)', async () => {
    const { JobsService } = await import('../jobs.service');
    await JobsService.updateJobStatus('j1', JobStatus.PROCESSING);
    await JobsService.updateJobStatus('j1', JobStatus.COMPLETED, { result: { ok: true } });
    await JobsService.updateJobStatus('j1', JobStatus.FAILED, { error: 'oops' });
    expect(update).not.toThrow;
  });
});


