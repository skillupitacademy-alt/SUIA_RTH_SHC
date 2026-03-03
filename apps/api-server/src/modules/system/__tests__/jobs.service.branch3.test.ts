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
let bgTable: any;
const originalEnv = { ...process.env };

describe('JobsService branch coverage', () => {
  beforeEach(async () => {
    const mod = await import('@quiz/db');
    dbMock = mod.db as any;
    bgTable = mod.backgroundJobs as any;
    vi.clearAllMocks();
    (JobsService as any)._db = undefined;
    process.env.NODE_ENV = 'test';
    JobsService.withDb(dbMock);
  });

  it('listJobs applies filters and returns total', async () => {
    dbMock.query.backgroundJobs.findMany.mockResolvedValueOnce([{ id: 'j1' }]);
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ count: 5 }]),
    } as any);

    const res = await JobsService.listJobs({ userId: 'u1', status: JobStatus.PENDING, limit: 10, offset: 2 });

    expect(dbMock.query.backgroundJobs.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.anything(),
      limit: 10,
      offset: 2,
    }));
    expect(res.total).toBe(5);
    expect(res.items[0].id).toBe('j1');
  });

  it('retryJob clones payload when original exists', async () => {
    dbMock.query.backgroundJobs.findFirst.mockResolvedValueOnce({
      userId: 'u2',
      type: 'TYPE',
      payload: { hello: 'world' },
    });
    dbMock.insert.mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-job' }]),
    } as any);

    const job = await JobsService.retryJob('old', 'u2');
    expect(job.id).toBe('new-job');
  });

  it('simulateJob early-returns when mock jobs disabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_JOBS = 'false';
    const spyUpdate = vi.spyOn(JobsService, 'updateJobStatus').mockResolvedValue({} as any);
    await JobsService.simulateJob('job', 'u1');
    expect(spyUpdate).not.toHaveBeenCalled();
    Object.assign(process.env, originalEnv);
    spyUpdate.mockRestore();
  }, 1000);

  it('simulateJob drives happy path when allowed', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_JOBS = 'true';
    const spyUpdate = vi.spyOn(JobsService, 'updateJobStatus').mockResolvedValue({} as any);
    vi.useFakeTimers();
    const promise = JobsService.simulateJob('job', 'u1');
    await vi.runAllTimersAsync();
    await promise;
    expect(spyUpdate).toHaveBeenCalledWith('job', JobStatus.PROCESSING);
    expect(spyUpdate).toHaveBeenCalledWith('job', JobStatus.COMPLETED, expect.anything());
    vi.useRealTimers();
    Object.assign(process.env, originalEnv);
  }, 10000);
});
