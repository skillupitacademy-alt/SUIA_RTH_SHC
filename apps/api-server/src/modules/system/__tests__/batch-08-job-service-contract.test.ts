import { afterEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { JobType } from '@quiz/types';

describe('real jobs service storage contract', () => {
  afterEach(() => vi.resetModules());
  it('selects only matching owner, denies non-owner and preserves authority on retry', async () => {
    vi.resetModules();
    const { JobsService } = await import('../jobs.service');
    const rows: Array<Record<string, unknown>> = [];
    const findFirst = vi.fn(async ({ where }: any) => {
      const params = new PgDialect().sqlToQuery(where).params;
      return rows.find(row => params.includes(row.id) && params.includes(row.userId));
    });
    const values = vi.fn((data: Record<string, unknown>) => ({ returning: async () => {
      const row = { ...data, id: `job-${rows.length + 1}` }; rows.push(row); return [row];
    } }));
    JobsService.withDb({ insert: () => ({ values }), query: { backgroundJobs: { findFirst } } } as never);
    const initial = await JobsService.createJob({ userId: 'owner', type: JobType.EXPORT_SAGA, payload: { examId: 'exam', format: 'json' } });
    expect((await JobsService.getJob(initial.id, 'owner'))?.userId).toBe('owner');
    expect(await JobsService.getJob(initial.id, 'other')).toBeUndefined();
    await expect(JobsService.retryJob(initial.id, 'other')).rejects.toThrow('Original job not found');
    const retried = await JobsService.retryJob(initial.id, 'owner');
    expect(retried.userId).toBe('owner'); expect(retried.payload).toEqual({ examId: 'exam', format: 'json' });
    expect(values).toHaveBeenCalledTimes(2);
    // The adapter interprets selected SQL parameters, not arbitrary SQL or actual database execution.
  });
});
