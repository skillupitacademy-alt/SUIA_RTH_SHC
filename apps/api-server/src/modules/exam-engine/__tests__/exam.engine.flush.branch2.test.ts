import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ExamEngine } from '../exam.engine';
import { ExamRepository } from '../repositories/exam.repository';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService, JobType } from '@/modules/system/jobs.service';
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
  });

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

    (JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-xyz' });
    (JobOrchestrator.runJob as any) = vi.fn();

    (cacheService.get as any) = vi.fn().mockRejectedValue(new Error('redis boom'));

    const res = await container.get(ExamEngine).completeExam('examX', 'u1');
    expect(res.status).toBe('processing');
    expect(cacheService.get).toHaveBeenCalled();
  });
});
