import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { backgroundJobs } from '@quiz/db';
import { JobsService } from '../jobs.service';
import { JobStatus } from '@quiz/types';
import * as drizzle from 'drizzle-orm';

// Hoisted mock functions
const vi_returning = vi.fn();
const vi_values = vi.fn();
const vi_insert = vi.fn();
const vi_findFirst = vi.fn();
const vi_findMany = vi.fn();
const vi_select = vi.fn();
const vi_from = vi.fn();
const vi_where = vi.fn();
const vi_delete = vi.fn();
const vi_update = vi.fn();
const vi_set = vi.fn();

// Mock @quiz/db
vi.mock('@quiz/db', () => ({
  backgroundJobs: {
    id: 'id',
    userId: 'userId',
    status: 'status',
    createdAt: 'createdAt',
  },
  db: {
    insert: vi.fn((...args) => {
      vi_insert(...args);
      return { values: vi_values.mockReturnValue({ returning: vi_returning }) };
    }),
    query: {
      backgroundJobs: {
        findFirst: vi.fn((...args) => vi_findFirst(...args)),
        findMany: vi.fn((...args) => vi_findMany(...args)),
      },
    },
    select: vi.fn((...args) => {
      vi_select(...args);
      return { from: vi.fn((...args) => {
        vi_from(...args);
        return { where: vi_where };
      })};
    }),
    delete: vi.fn((...args) => {
      vi_delete(...args);
      return { where: vi_where.mockReturnValue({ returning: vi_returning }) };
    }),
    update: vi.fn((...args) => {
      vi_update(...args);
      return { set: vi_fn_set() };
    }),
  },
}));

function vi_fn_set() {
    return vi_set.mockReturnValue({ where: vi_fn_where_final() });
}
function vi_fn_where_final() {
    return vi.fn().mockReturnValue({ returning: vi_returning });
}

describe('JobsService 100% Branch Coverage - FINAL BLITZ', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test', ALLOW_MOCK_JOBS: 'true' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const callPrivate = (method: string, ...args: any[]) => (JobsService as any)[method](...args);

  describe('Seam & DB Property (Lines 16, 21-23)', () => {
    it('exercises withDb guard (Line 16)', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        (process.env as any).NODE_ENV = 'production';
        const fakeDb = {} as any;
        JobsService.withDb(fakeDb);
        // Should not have set private _db because not in 'test'
        expect((JobsService as any)._db).not.toBe(fakeDb);
        
        (process.env as any).NODE_ENV = 'test';
        JobsService.withDb(fakeDb);
        expect((JobsService as any)._db).toBe(fakeDb);
        
        // Reset
        (JobsService as any)._db = undefined;
        (process.env as any).NODE_ENV = originalNodeEnv;
    });
  });

  describe('listJobs (Lines 49-79)', () => {
    it('hits all optional branches and sql`true` (Lines 54-77)', async () => {
      // 1. All filters
      vi_findMany.mockResolvedValue([]);
      vi_where.mockResolvedValue([{ count: 10 }]);
      await JobsService.listJobs({ userId: 'u1', status: JobStatus.PENDING });
      
      // 2. Empty filters (hits sql`true` fallback)
      await JobsService.listJobs({});
      expect(vi_where).toHaveBeenCalledWith(expect.anything());

      // 3. total fallback null (Line 77)
      vi_where.mockResolvedValue([null]);
      const res = await JobsService.listJobs({});
      expect(res.total).toBe(0);
    });
  });

  describe('retryJob Payload Logic (Line 91)', () => {
    it('handles null payload', async () => {
      vi_findFirst.mockResolvedValue({ userId: 'u1', type: 't', payload: null });
      vi_returning.mockResolvedValue([{ id: 'new' }]);
      await JobsService.retryJob('old', 'u1');
      expect(vi_values).toHaveBeenCalledWith(expect.objectContaining({ payload: undefined }));
    });

    it('handles undefined payload', async () => {
      vi_findFirst.mockResolvedValue({ userId: 'u1', type: 't', payload: undefined });
      vi_returning.mockResolvedValue([{ id: 'new' }]);
      await JobsService.retryJob('old', 'u1');
      expect(vi_values).toHaveBeenCalledWith(expect.objectContaining({ payload: undefined }));
    });

    it('handles object payload', async () => {
      const p = { key: 'val' };
      vi_findFirst.mockResolvedValue({ userId: 'u1', type: 't', payload: p });
      vi_returning.mockResolvedValue([{ id: 'new' }]);
      await JobsService.retryJob('old', 'u1');
      expect(vi_values).toHaveBeenCalledWith(expect.objectContaining({ payload: p }));
    });

    it('throws if job not found (Line 84)', async () => {
        vi_findFirst.mockResolvedValue(undefined);
        await expect(JobsService.retryJob('x', 'u')).rejects.toThrow('Original job not found');
    });
  });

  describe('updateJobStatus (Lines 120-152)', () => {
    it('sets startedAt on PROCESSING (Line 138)', async () => {
        vi_returning.mockResolvedValue([{ id: 'j' }]);
        await JobsService.updateJobStatus('j', JobStatus.PROCESSING);
        expect(vi_set).toHaveBeenCalledWith(expect.objectContaining({ startedAt: expect.any(Date) }));
    });

    it('sets completedAt on COMPLETED (Line 140)', async () => {
        await JobsService.updateJobStatus('j', JobStatus.COMPLETED, { result: { ok: true } });
        const lastSet = vi_set.mock.calls[vi_set.mock.calls.length - 1][0];
        expect(lastSet.completedAt).toBeInstanceOf(Date);
        expect(lastSet.result).toEqual({ ok: true });
    });

    it('sets completedAt on FAILED (Line 142)', async () => {
        await JobsService.updateJobStatus('j', JobStatus.FAILED, { error: 'boom' });
        const lastSet = vi_set.mock.calls[vi_set.mock.calls.length - 1][0];
        expect(lastSet.completedAt).toBeInstanceOf(Date);
        expect(lastSet.error).toBe('boom');
    });

    it('skips data optional checks if undefined', async () => {
        await JobsService.updateJobStatus('j', JobStatus.COMPLETED, undefined);
        const lastSet = vi_set.mock.calls[vi_set.mock.calls.length - 1][0];
        expect(lastSet.result).toBeUndefined();
    });

    it('skips all blocks if status is PENDING (Line 139 branch)', async () => {
        await JobsService.updateJobStatus('j', JobStatus.PENDING);
        const lastSet = vi_set.mock.calls[vi_set.mock.calls.length - 1][0];
        expect(lastSet.startedAt).toBeUndefined();
        expect(lastSet.completedAt).toBeUndefined();
    });
  });

  describe('simulateJob (Lines 157-180)', () => {
    it('obeys allowMock guard (Line 159)', async () => {
        (process.env as any).ALLOW_MOCK_JOBS = 'false';
        (process.env as any).NODE_ENV = 'production';
        const spyStatus = vi.spyOn(JobsService, 'updateJobStatus');
        await JobsService.simulateJob('j', 'u');
        expect(spyStatus).not.toHaveBeenCalled();
    });

    it('handles non-Error objects in catch (Line 176)', async () => {
        // Force failure in first updateJobStatus call to trigger catch
        // But the SECOND call (to set FAILED) must succeed to avoid unhandled rejection
        vi_returning.mockRejectedValueOnce('unknown-fail');
        vi_returning.mockResolvedValue([{ id: 'j' }]);
        
        const spyStatus = vi.spyOn(JobsService, 'updateJobStatus');
        
        vi.useFakeTimers();
        const promise = JobsService.simulateJob('j', 'u');
        await vi.runAllTimersAsync();
        await promise;
        
        expect(spyStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, { error: 'Simulation failed' });
        vi.useRealTimers();
    });

    it('handles Error objects in catch (Line 176)', async () => {
        vi_returning.mockRejectedValueOnce(new Error('real-error'));
        vi_returning.mockResolvedValue([{ id: 'j' }]);
        
        const spyStatus = vi.spyOn(JobsService, 'updateJobStatus');
        
        vi.useFakeTimers();
        const promise = JobsService.simulateJob('j', 'u');
        await vi.runAllTimersAsync();
        await promise;
        
        expect(spyStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, { error: 'real-error' });
        vi.useRealTimers();
    });

    it('completes full success transition (Lines 167-168)', async () => {
        vi_returning.mockResolvedValue([{ id: 'j' }]);
        const spyStatus = vi.spyOn(JobsService, 'updateJobStatus');
        
        vi.useFakeTimers();
        const promise = JobsService.simulateJob('j', 'u');
        
        // Advance 3s for PROCESSING
        await vi.advanceTimersByTimeAsync(3000);
        expect(spyStatus).toHaveBeenCalledWith('j', JobStatus.PROCESSING);
        
        // Advance 10s for COMPLETED
        await vi.advanceTimersByTimeAsync(10000);
        await promise;
        
        expect(spyStatus).toHaveBeenCalledWith('j', JobStatus.COMPLETED, expect.objectContaining({
            result: expect.objectContaining({ message: 'Simulation completed successfully' })
        }));
        vi.useRealTimers();
    });
  });

  describe('getActiveJobCount (Lines 106-118)', () => {
    it('hits the method', async () => {
        vi_where.mockReturnValue([]);
        const count = await JobsService.getActiveJobCount('u1');
        expect(count).toBe(0);
    });
  });

  describe('deleteJob (Lines 95-104)', () => {
    it('hits the method', async () => {
        await JobsService.deleteJob('j', 'u');
        expect(vi_delete).toHaveBeenCalled();
    });
  });

  describe('createJob (Lines 25-37)', () => {
     it('hits the method', async () => {
        vi_returning.mockResolvedValue([{ id: 'j' }]);
        await JobsService.createJob({ userId: 'u', type: 't' });
        expect(vi_insert).toHaveBeenCalled();
     });
  });
});
