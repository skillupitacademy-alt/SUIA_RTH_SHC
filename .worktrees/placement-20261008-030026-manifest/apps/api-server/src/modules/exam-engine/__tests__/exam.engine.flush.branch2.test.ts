vi.mock('@quiz/db', () => {
  const updateMock = vi.fn(() => ({
    set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'exam1' }]) })) })),
  }));
  return {
    STANDARD_QUERY_TIMEOUT: 15000,
    QUICK_QUERY_TIMEOUT: 5000,
    REPORT_QUERY_TIMEOUT: 30000,
    MIGRATION_TIMEOUT: 120000,
    withTimeout: async <T>(p: Promise<T>) => p,
    db: {
      transaction: vi.fn(async (cb) => cb({
        query: { exams: { findFirst: vi.fn().mockResolvedValue({ examQuestions: [] }) } },
        select: vi.fn(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })),
        update: updateMock,
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]), onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })) })),
      })),
      query: { exams: { findFirst: vi.fn().mockResolvedValue(null) } },
      select: vi.fn(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      })),
      update: updateMock,
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]), onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })) })),
    },
    exams: { id: 'exams.id', status: 'exams.status', startedAt: 'exams.startedAt', lastAnsweredAt: 'exams.lastAnsweredAt', userId: 'exams.userId' },
    examQuestions: { id: 'eq.id', questionId: 'eq.questionId' },
    idempotencyKeys: { id: 'ik.id' },
  };
});
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ExamEngine } from '../exam.engine';
import { ExamRepository } from '../repositories/exam.repository';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService } from '@/modules/system/jobs.service';
import { cacheService } from '@/modules/core/cache.service';
import { container } from '@/modules/core/container';

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

vi.mock('../exam.state-machine', () => ({
  ExamStateMachine: {
    transition: vi.fn().mockResolvedValue(undefined),
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
    container.reset();
    process.env.QSTASH_TOKEN = undefined; // force local runner path
  });

  it('uses idempotency key mapping when existing key is found (lines ~298-301)', async () => {
    const idempotentExam = { ...baseExam, id: 'examFromKey', status: 'started' };

    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'examFromKey' } as any);
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue(idempotentExam as any);
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([{ id: 'examFromKey' }] as any);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
      ...idempotentExam,
      examQuestions: [],
    } as any);
    vi.spyOn(ExamRepository.prototype, 'recordIdempotency').mockResolvedValue(undefined as any);

    (JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-123' });
    (JobOrchestrator.runJob as any) = vi.fn();

    const res = await container.get(ExamEngine).completeExam('origExam', 'u1', 'key-1');
    expect(res.examId).toBe('examFromKey');
  }, 15000);

  it('enters flush catch when cache getter throws (lines ~344)', async () => {
    const examWithQuestions = {
      ...baseExam,
      examQuestions: [
        { id: 'eq1', questionId: 'q1', responseMetadata: null, question: { type: 'mcq', correctAnswer: 'A' } },
      ],
    };

    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue(baseExam as any);
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([{ id: 'examX' }] as any);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue(examWithQuestions as any);
    vi.spyOn(ExamRepository.prototype, 'recordIdempotency').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'updateExamQuestionResponse').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);
    vi.spyOn(AnswerEvaluationEngine.prototype, 'evaluate').mockReturnValue(true);
    vi.mocked(cacheService.get).mockRejectedValue(new Error('cache boom'));

    (JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-xyz' });
    (JobOrchestrator.runJob as any) = vi.fn();

    (cacheService.get as any) = vi.fn().mockRejectedValue(new Error('redis boom'));

    const res = await container.get(ExamEngine).completeExam('examX', 'u1');
    expect(res.status).toBe('processing');
  }, 15000);

  it('skips flush update when cached answer is empty string', async () => {
    const examWithQuestions = {
      ...baseExam,
      examQuestions: [
        { id: 'eq-empty', questionId: 'q-empty', responseMetadata: null, question: { type: 'mcq', correctAnswer: 'A' } },
      ],
    };

    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue(baseExam as any);
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([{ id: 'examX' }] as any);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue(examWithQuestions as any);
    vi.spyOn(ExamRepository.prototype, 'recordIdempotency').mockResolvedValue(undefined as any);
    const updateResponseSpy = vi.spyOn(ExamRepository.prototype, 'updateExamQuestionResponse').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);
    vi.spyOn(AnswerEvaluationEngine.prototype, 'evaluate').mockReturnValue(true);

    (JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-empty' });
    (JobOrchestrator.runJob as any) = vi.fn();
    (cacheService.get as any) = vi.fn().mockResolvedValue({ answer: '' });

    const res = await container.get(ExamEngine).completeExam('examX', 'u1');
    expect(res.status).toBe('processing');
    expect(updateResponseSpy).not.toHaveBeenCalled();
  }, 15000);
});

