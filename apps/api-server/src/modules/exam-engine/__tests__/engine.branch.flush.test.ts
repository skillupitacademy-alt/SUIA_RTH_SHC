import { describe, it, expect, vi } from 'vitest';

vi.mock('@quiz/db', () => {
  const exams = {};
  const idempotencyKeys = {};
  return {
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
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
      })),
    },
    exams,
    idempotencyKeys,
    examQuestions: {},
  };
});

vi.mock('@/modules/report-engine/performance.service', () => ({
  PerformanceService: { invalidateCache: vi.fn().mockResolvedValue(undefined) },
}));

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
    const res = await ExamEngine.completeExam('e1', 'u1', 'dup-key');
    expect(res.examId).toBe('existing-exam');
    expect(res.jobId).toBe('job-1');
    expect(res.status).toBe('processing');
  });
});
