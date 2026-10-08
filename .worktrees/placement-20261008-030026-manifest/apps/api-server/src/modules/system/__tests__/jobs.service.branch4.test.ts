import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsService } from '../jobs.service';
import { JobStatus } from '@quiz/types';

vi.mock('@quiz/db', () => {
  const db = {
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    query: {
      backgroundJobs: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
  const backgroundJobs = { id: 'id', userId: 'userId', status: 'status', createdAt: 'createdAt' } as any;
  return { db, backgroundJobs };
});

let dbMock: any;
const originalEnv = { ...process.env };

describe('JobsService additional branches', () => {
  beforeEach(async () => {
    const mod = await import('@quiz/db');
    dbMock = mod.db as any;
    vi.clearAllMocks();
    (JobsService as any)._db = undefined;
    JobsService.withDb(dbMock);
    Object.assign(process.env, originalEnv);
  });

  it('retryJob throws when original job missing', async () => {
    dbMock.query.backgroundJobs.findFirst.mockResolvedValueOnce(undefined);
    await expect(JobsService.retryJob('nope', 'u1')).rejects.toThrow(/Original job not found/);
  });

  it('simulateJob catch path marks failed when update throws', async () => {
    process.env.ALLOW_MOCK_JOBS = 'true';
    const spyUpdate = vi.spyOn(JobsService, 'updateJobStatus')
      .mockRejectedValueOnce(new Error('fail-processing'))
      .mockResolvedValueOnce({} as any); // catch branch fallback

    vi.useFakeTimers();
    const promise = JobsService.simulateJob('job', 'u1');
    await vi.runAllTimersAsync();
    await promise;

    expect(spyUpdate).toHaveBeenCalledWith('job', JobStatus.PROCESSING);
    expect(spyUpdate).toHaveBeenCalledWith('job', JobStatus.FAILED, expect.objectContaining({ error: 'fail-processing' }));
    vi.useRealTimers();
  }, 10000);
});


