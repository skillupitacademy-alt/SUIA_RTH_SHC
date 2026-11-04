import { afterEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { db } from '@quiz/db';
import { JobType } from '@quiz/types';
import { JobsService } from '../jobs.service';

describe('real jobs service storage contract', () => {
  afterEach(() => JobsService.withDb(db));
  it('creates and retries the stored owner/payload and queries both job and subject', async () => {
    const rows: Array<Record<string, unknown>> = [];
    const findFirst = vi.fn(async () => rows[0]);
    const values = vi.fn((data: Record<string, unknown>) => ({ returning: async () => {
      const row = { ...data, id: `job-${rows.length + 1}` }; rows.push(row); return [row];
    } }));
    JobsService.withDb({ insert: () => ({ values }), query: { backgroundJobs: { findFirst } } } as never);
    const initial = await JobsService.createJob({ userId: 'owner', type: JobType.EXPORT_SAGA, payload: { examId: 'exam', format: 'json' } });
    const retried = await JobsService.retryJob(initial.id, 'owner');
    expect(retried.userId).toBe('owner');
    expect(retried.payload).toEqual({ examId: 'exam', format: 'json' });
    expect(values).toHaveBeenCalledTimes(2);
    const sql = new PgDialect().sqlToQuery(findFirst.mock.calls[0]![0].where);
    expect(sql.params).toEqual(expect.arrayContaining([initial.id, 'owner']));

  });
});
