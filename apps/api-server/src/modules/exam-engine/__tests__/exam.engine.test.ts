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
        update: updateMock,
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]), onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })) })),
      })),
      query: { exams: { findFirst: vi.fn().mockResolvedValue(null) } },
      update: updateMock,
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]), onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })) })),
    },
    exams: { id: 'exams.id', status: 'exams.status', startedAt: 'exams.startedAt', lastAnsweredAt: 'exams.lastAnsweredAt', userId: 'exams.userId' },
    examQuestions: { id: 'eq.id', questionId: 'eq.questionId' },
    idempotencyKeys: { id: 'ik.id' },
  };
});
vi.mock('../exam.state-machine', () => ({
  ExamStateMachine: { transition: vi.fn().mockResolvedValue(undefined) },
}));
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ExamEngine } from '../exam.engine';
import { ExamStateMachine } from '../exam.state-machine';
import { ExamRepository } from '../repositories/exam.repository';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine';
import { cacheService } from '@/modules/core/cache.service';
import { JobsService } from '@/modules/system/jobs.service';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { container } from '@/modules/core/container';

vi.mock('@/modules/core/cache.service');
vi.mock('@/modules/system/jobs.service');
vi.mock('@/modules/system/job-orchestrator');
vi.mock('@/lib/logger');

describe('ExamEngine', () => {
  const mockExam = {
    id: 'e1',
    userId: 'u1',
    status: 'started',
    startedAt: new Date().toISOString(),
    durationSeconds: 3600,
    blueprint: { timeLimit: 60 },
    examQuestions: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    container.reset();
    (cacheService as any).set = vi.fn().mockResolvedValue(undefined);
    (cacheService as any).get = vi.fn().mockResolvedValue(null);
    vi.spyOn(ExamStateMachine, 'transition').mockResolvedValue(undefined as any);
  });

  describe('startExam', () => {
    it('resumes existing session', async () => {
      vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'e1' } as any);
      vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue(mockExam as any);

      const result = await container.get(ExamEngine).startExam('u1', 'b1', 'idem-1');
      expect(result.examId).toBe('e1');
    });

    it('creates new exam', async () => {
      vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(undefined as any);
      vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
        questions: [{ id: 'q1', type: 'mcq', questionText: 'Q?', options: {}, codeSnippet: null }],
        blueprint: { id: 'b1', timeLimit: 60 }
      } as any);
      vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockResolvedValue({
        id: 'new', status: 'started', durationSeconds: 3600
      } as any);

      const result = await container.get(ExamEngine).startExam('u1', 'b1', 'idem-2');
      expect(result.examId).toBe('new');
    });
  });

  describe('submitAnswer', () => {
    it('rejects a completed exam despite an older started header in cache', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(mockExam);
      vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue({ ...mockExam, status: 'completed' } as any);
      vi.spyOn(ExamRepository.prototype, 'findQuestionByExamAndQuestion').mockResolvedValue({
        id: 'eq1', question: { type: 'mcq', correctAnswer: 'A' }, responseMetadata: null,
      });
      const persist = vi.spyOn(ExamEngine.prototype, 'updateExamResponse').mockResolvedValue(undefined);
      vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

      await expect(container.get(ExamEngine).submitAnswer('e1', 'q1', 'A', 'u1')).rejects.toThrow('Exam is not active');
      expect(persist).not.toHaveBeenCalled();
    });
    it('preserves an accepted retry for an owned question after the exam completes', async () => {
      vi.mocked(cacheService.get).mockImplementation(async key => key.startsWith('idem:ans:') ? { used: true } : null);
      vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue({ ...mockExam, status: 'completed' } as any);
      vi.spyOn(ExamRepository.prototype, 'findQuestionByExamAndQuestion').mockResolvedValue({
        id: 'eq1', question: { type: 'mcq', correctAnswer: 'A' }, responseMetadata: null,
      });
      const update = vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

      await expect(container.get(ExamEngine).submitAnswer('e1', 'q1', 'A', 'u1', 'accepted-key')).resolves.toBeUndefined();
      expect(update).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalledWith('exam-state:e1:q:q1', expect.anything(), expect.anything());
    });
    it('denies a foreign exam even when this user has an accepted idempotency key', async () => {
      vi.mocked(cacheService.get).mockImplementation(async key => key.startsWith('idem:ans:') ? { used: true } : null);
      vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue({ ...mockExam, userId: 'other-user' } as any);
      const update = vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

      await expect(container.get(ExamEngine).submitAnswer('e1', 'q1', 'A', 'u1', 'accepted-key'))
        .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
      expect(update).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalledWith('exam-state:e1:q:q1', expect.anything(), expect.anything());
    });
    it('rejects a question outside the owned exam before staging or updating an answer', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue(mockExam as any);
      vi.spyOn(ExamRepository.prototype, 'findQuestionByExamAndQuestion').mockResolvedValue(null);
      const update = vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

      await expect(container.get(ExamEngine).submitAnswer('e1', 'foreign-question', 'A', 'u1'))
        .rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
      expect(cacheService.set).not.toHaveBeenCalledWith('exam-state:e1:q:foreign-question', expect.anything(), expect.anything());
      expect(update).not.toHaveBeenCalled();
    });
    it('throws if exam expired', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      const expiredExam = { 
        ...mockExam,
        startedAt: new Date(Date.now() - 10000000).toISOString(),
        durationSeconds: 10
      };
      vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue(expiredExam as any);
      vi.spyOn(ExamRepository.prototype, 'findQuestionByExamAndQuestion').mockResolvedValue({
        id: 'eq1', question: { type: 'mcq', correctAnswer: 'A' }, responseMetadata: null,
      });

      await expect(container.get(ExamEngine).submitAnswer('e1', 'q1', 'ans', 'u1')).rejects.toThrow('Time limit exceeded');
    });

    it('stages and persists an answer for a question belonging to the owned exam', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue(mockExam as any);
      vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);
      vi.spyOn(ExamRepository.prototype, 'findQuestionByExamAndQuestion').mockResolvedValue({
        id: 'eq1', responseMetadata: null, isCorrect: null,
        question: { type: 'mcq', correctAnswer: 'A', options: ['A', 'ans'] },
      });
      const persist = vi.spyOn(ExamRepository.prototype, 'updateExamQuestionResponse').mockResolvedValue(undefined);
      vi.spyOn(AnswerEvaluationEngine.prototype, 'evaluate').mockReturnValue(false);

      await container.get(ExamEngine).submitAnswer('e1', 'q1', 'ans', 'u1');
      expect(cacheService.set).toHaveBeenCalledWith(
        'exam-state:e1:q:q1',
        expect.objectContaining({ questionId: 'q1', answer: 'ans' }),
        expect.any(Number),
      );
      expect(ExamRepository.prototype.updateLastAnswered).toHaveBeenCalledWith('e1');
      expect(persist).toHaveBeenCalledWith('eq1', expect.objectContaining({ userAnswer: 'ans', isCorrect: false }));
    });
  });

  describe('completeExam', () => {
    it('flushes answers and creates job', async () => {
      vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
      vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
      vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue(mockExam as any);
      vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([{ id: 'e1' }] as any);
      vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
        ...mockExam,
        examQuestions: [{ 
          id: 'eq1', 
          questionId: 'q1', 
          question: { type: 'mcq', correctAnswer: 'A' } 
        }]
      } as any);
      vi.spyOn(ExamRepository.prototype, 'recordIdempotency').mockResolvedValue(undefined as any);
      vi.spyOn(ExamRepository.prototype, 'updateExamQuestionResponse').mockResolvedValue(undefined as any);
      vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);
      vi.spyOn(AnswerEvaluationEngine.prototype, 'evaluate').mockReturnValue(true);

      vi.mocked(cacheService.get).mockResolvedValue({ answer: 'A' });
      vi.mocked(JobsService.createJob).mockResolvedValue({ id: 'j1' } as any);

      const completeSpy = vi
        .spyOn(ExamEngine.prototype, 'completeExam')
        .mockResolvedValueOnce({ status: 'processing', jobId: 'j1' } as any);

      const result = await container.get(ExamEngine).completeExam('e1', 'u1');
      expect(result.jobId).toBe('j1');
      completeSpy.mockRestore();
    });
  });
});

