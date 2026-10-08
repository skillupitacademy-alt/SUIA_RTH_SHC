import { describe, it, expect, vi } from 'vitest';
import { container } from '@/modules/core/container';
import { db } from '@quiz/db';

vi.mock('@quiz/db', () => {
  const exams = {};
  const idempotencyKeys = {};
  const makeSelect = (rows: any[] = []) => ({
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve(rows),
  });
  return {
    STANDARD_QUERY_TIMEOUT: 15000,
    QUICK_QUERY_TIMEOUT: 5000,
    REPORT_QUERY_TIMEOUT: 30000,
    MIGRATION_TIMEOUT: 120000,
    db: {
      query: {
        idempotencyKeys: {
          findFirst: vi.fn().mockResolvedValue({ examId: 'existing-exam' }),
        },
        exams: {
          findFirst: vi.fn()
            // first call: fullExam
            .mockResolvedValueOnce({ id: 'existing-exam', userId: 'u1', status: 'started' })
            // second call: examWithQuestions for flush loop (return null to skip)
            .mockResolvedValueOnce(null),
        },
      },
      select: vi.fn().mockReturnValue(makeSelect([{ id: 'existing-exam', userId: 'u1', status: 'started' }])),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'existing-exam' }]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
      }),
      transaction: vi.fn(async (cb) => cb({
        query: { exams: { findFirst: vi.fn().mockResolvedValue(null) } },
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'existing-exam' }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'ik-1' }]),
            onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        select: vi.fn().mockReturnValue(makeSelect([])),
      })),
    },
    withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    exams,
    idempotencyKeys,
    examQuestions: {},
    questions: {},
    eq: vi.fn(),
  };
});

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../queue.service', () => ({
  queueService: { enqueue: vi.fn().mockResolvedValue({ success: true }) },
}));

vi.mock('@/modules/system/job-orchestrator', () => ({
  JobOrchestrator: { runJob: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/modules/system/jobs.service', () => ({
  JobsService: { createJob: vi.fn().mockResolvedValue({ id: 'job-1' }) },
}));

describe('ExamEngine completeExam tails (idempotency & flush catch)', () => {
  it('reuses existing idempotency key (lines 301-309) and returns processing', async () => {
    const { ExamEngine } = await import('../exam.engine');
    const { ExamRepository } = await import('../repositories/exam.repository');
    const { PerformanceService } = await import('@/modules/report-engine/performance.service');
    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    const idemSpy = vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'existing-exam' } as any);
    const repoSpy = vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
      id: 'existing-exam',
      status: 'started',
      userId: 'u1',
      startedAt: new Date(),
      durationSeconds: 60,
      examQuestions: [{ order: 1, question: { id: 'q1', questionText: 'Q1', options: [], codeSnippet: null, type: 'mcq' } }]
    } as any);
    container.reset();
    const res = await container.get(ExamEngine).completeExam('e1', 'u1', 'dup-key');
    expect(res.examId).toBe('existing-exam');
    expect(res.jobId).toBe('job-1');
    expect(res.status).toBe('processing');
    repoSpy.mockRestore();
    idemSpy.mockRestore();
  }, 20000);
});

