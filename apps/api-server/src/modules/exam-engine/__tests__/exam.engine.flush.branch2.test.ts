import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { db } from '@quiz/db';
import { ExamEngine } from '../exam.engine';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService, JobType } from '@/modules/system/jobs.service';

vi.mock('../../core/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
  },
}));

vi.mock('@/modules/system/job-orchestrator', () => ({
  JobOrchestrator: {
    runJob: vi.fn(),
  },
}));

vi.mock('@/modules/system/jobs.service', () => ({
  JobsService: {
    createJob: vi.fn(),
  },
  JobType: {
    EXAM_SCORING: 'EXAM_SCORING',
  },
}));

describe('ExamEngine completeExam additional branches', () => {
  const baseExam = {
    id: 'examX',
    userId: 'u1',
    status: 'started',
    durationSeconds: 600,
    lastAnsweredAt: null,
    startedAt: new Date().toISOString(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QSTASH_TOKEN = undefined; // force local runner path
  });

  afterEach(() => {
    (ExamEngine as any).db = undefined;
  });

  it('uses idempotency key mapping when existing key is found (lines ~298-301)', async () => {
    const idempotentExam = { ...baseExam, id: 'examFromKey', status: 'started' };

    (db.query as any) = {
      idempotencyKeys: {
        findFirst: vi.fn().mockResolvedValue({ examId: 'examFromKey' }),
      },
      exams: {
        findFirst: vi.fn()
          // first call for idempotent target
          .mockResolvedValueOnce(idempotentExam)
          // second call inside flush (with questions)
          .mockResolvedValueOnce({ ...idempotentExam, examQuestions: [] }),
      },
    };

    (db.update as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'examFromKey' }]),
        }),
      }),
    });

    (db.insert as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    });

    (JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-123' });
    (JobOrchestrator.runJob as any) = vi.fn();

    const res = await ExamEngine.completeExam('origExam', 'u1', 'key-1');
    expect(res.examId).toBe('examFromKey');
    expect((db.query as any).idempotencyKeys.findFirst).toHaveBeenCalled();
  });

  it('enters flush catch when cache getter throws (lines ~344)', async () => {
    const { cacheService } = await import('../../core/cache.service');

    const examWithQuestions = {
      ...baseExam,
      examQuestions: [
        { id: 'eq1', questionId: 'q1', responseMetadata: null, question: { type: 'mcq', correctAnswer: 'A' } },
      ],
    };

    (db.query as any) = {
      exams: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(baseExam)
          .mockResolvedValueOnce(examWithQuestions),
      },
    };

    (db.update as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'examX' }]),
        }),
      }),
    });

    (db.insert as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    });

    (JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-xyz' });
    (JobOrchestrator.runJob as any) = vi.fn();

    (cacheService.get as any) = vi.fn().mockRejectedValue(new Error('redis boom'));

    const res = await ExamEngine.completeExam('examX', 'u1');
    expect(res.status).toBe('processing');
    expect(cacheService.get).toHaveBeenCalled();
  });
});
