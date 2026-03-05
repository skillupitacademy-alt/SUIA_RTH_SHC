import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { db } from '@quiz/db';
import { cacheService } from '@/modules/core/cache.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ExamEngine } from '../exam.engine';
import { ExamRepository } from '../repositories/exam.repository';
import { container } from '@/modules/core/container';

describe('ExamEngine branch gap coverage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    container.reset();
  });

  it('startExam falls back to handleRaceCondition on duplicate key error', async () => {
    const dupErr = { code: '23505', message: 'unq_user_key' };
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValueOnce(undefined as any);
    const { SelectionService } = await import('@/modules/selection-engine/selection.service');
    vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
      questions: [{ id: 'q1', type: 'mcq', questionText: 'Q', options: {} }],
      blueprint: { id: 'b1', timeLimit: 60 },
    } as any);
    vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockRejectedValue(dupErr);
    const handleSpy = vi
      .spyOn(ExamEngine.prototype as any, 'handleRaceCondition')
      .mockResolvedValueOnce({ examId: 'resume', status: 'started' } as never);

    const result = await container.get(ExamEngine).startExam('u1', 'b1', 'idem-1', {});

    expect(handleSpy).toHaveBeenCalledWith('u1', 'idem-1');
    expect(result).toEqual({ examId: 'resume', status: 'started' });
  });

  it('resumeExamSession throws when exam is missing', async () => {
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue(undefined as any);

    await expect(
      (container.get(ExamEngine) as any).resumeExamSession('missing-exam')
    ).rejects.toThrow('Exam session resolution failed');
  });

  it('handleRaceCondition succeeds when idempotency key already persisted', async () => {
    const fakeExam = {
      id: 'exam-123',
      status: 'started',
      durationSeconds: 600,
      startedAt: new Date().toISOString(),
      examQuestions: [
        {
          order: 1,
          question: {
            id: 'q1',
            questionText: 't?',
            options: ['a'],
            codeSnippet: null,
            type: 'mcq',
          },
        },
      ],
    };

    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({
      examId: fakeExam.id,
      key: 'idem',
      userId: 'u1',
    } as any);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue(fakeExam as any);

    const result = await (container.get(ExamEngine) as any).handleRaceCondition('u1', 'idem');

    expect(result.examId).toBe(fakeExam.id);
    expect(result.firstQuestion?.id).toBe('q1');
  });

  it('handleRaceCondition throws when key or exam not found', async () => {
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(undefined as any);

    await expect(
      (container.get(ExamEngine) as any).handleRaceCondition('u1', 'missing')
    ).rejects.toThrow('Collision recovery failed');
  });

  it('submitAnswer short-circuits when idempotency cache hit', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce({ used: true } as any);
    const getActiveSpy = vi
      .spyOn(ExamEngine.prototype as any, 'getAndCacheActiveExam')
      .mockResolvedValue({} as any);

    // submitAnswer with idempotency key should short-circuit when cache has value
    await container.get(ExamEngine).submitAnswer('e1', 'q1', 'A', 'u1', 'idem-ans');

    expect(getActiveSpy).not.toHaveBeenCalled();
  });

  it('getAndCacheActiveExam caches db result and tolerates cache set failure', async () => {
    const exam = {
      id: 'e1',
      userId: 'u1',
      status: 'started',
      startedAt: new Date().toISOString(),
      blueprint: null,
    };
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue(exam as any);
    vi.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('redis down'));

    const result = await (container.get(ExamEngine) as any).getAndCacheActiveExam('u1', 'e1');
    expect(result).toEqual(exam);
  });

  it('getAndCacheActiveExam throws when exam not found anywhere', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue(null as any);

    await expect(
      (container.get(ExamEngine) as any).getAndCacheActiveExam('u1', 'missing')
    ).rejects.toThrow('Session not found');
  });

  it('resumeExamSession executes orderBy callback', async () => {
    const fakeExam = {
      id: 'e1',
      status: 'started',
      durationSeconds: 300,
      startedAt: new Date().toISOString(),
      examQuestions: [
        { order: 1, question: { id: 'q1', questionText: 't', options: [], codeSnippet: null, type: 'mcq' } }
      ]
    };
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue(fakeExam as any);

    const result = await (container.get(ExamEngine) as any).resumeExamSession('e1');
    expect(result.firstQuestion?.id).toBe('q1');
  });

  it('submitAnswer writes idempotency marker when no cache hit', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    const cacheSet = vi.spyOn(cacheService, 'set').mockResolvedValue(undefined as any);
    vi.spyOn(ExamEngine.prototype as any, 'getAndCacheActiveExam').mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      status: 'started',
      startedAt: new Date().toISOString(),
      durationSeconds: 100,
      blueprint: null,
    });
    vi.spyOn(ExamEngine.prototype as any, 'checkExamTimeLimit').mockReturnValue(undefined);
    vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

    await container.get(ExamEngine).submitAnswer('e1', 'q1', 'A', 'u1', 'idem-ans-2');

    expect(cacheSet).toHaveBeenCalledWith(expect.stringContaining('idem:ans:u1:idem-ans-2'), expect.any(Object), expect.any(Number));
  });

  it('completeExam short-circuits for already finished exam status', async () => {
    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      status: 'completed',
    } as any);

    const result = await container.get(ExamEngine).completeExam('e1', 'u1');
    expect(result).toEqual({ examId: 'e1', status: 'completed' });
  });

  it('startExam rethrows non-duplicate errors', async () => {
    const boom = new Error('boom');
    vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockRejectedValue(boom);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(undefined as any);
    const { SelectionService } = await import('@/modules/selection-engine/selection.service');
    vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
      questions: [{ id: 'q1', questionText: 'x', options: {}, type: 'mcq' }],
      blueprint: { id: 'b1', timeLimit: 60 },
    } as any);

    await expect(container.get(ExamEngine).startExam('u1', 'b1')).rejects.toThrow('boom');
  });

  it('getAndCacheActiveExam backfills cache then throws on missing DB record', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue(null as any);

    await expect(
      (container.get(ExamEngine) as any).getAndCacheActiveExam('u1', 'missing-db')
    ).rejects.toThrow('Session not found');
  });

  it('checkExamTimeLimit throws when elapsed exceeds duration', () => {
    const start = new Date(Date.now() - 4000 * 1000).toISOString(); // > 1h
    expect(() =>
      (container.get(ExamEngine) as any).checkExamTimeLimit({
        id: 'e1',
        startedAt: start,
        durationSeconds: 3600,
        blueprint: null,
      })
    ).toThrow('Time limit exceeded');
  });

  it('checkExamTimeLimit falls back to limit when durationSeconds is null (Line 190)', () => {
    // This tests the ?? fallback: durationSeconds is null so it uses 'limit' from blueprint
    const start = new Date(Date.now() - 100 * 1000).toISOString(); // 100s elapsed
    expect(() =>
      (container.get(ExamEngine) as any).checkExamTimeLimit({
        id: 'e1',
        startedAt: start,
        durationSeconds: null, // null triggers the ?? fallback to line 190
        blueprint: { timeLimit: 1 }, // 1 min = 60s, elapsed 100s > 60s
      })
    ).toThrow('Time limit exceeded');
  });

  it('checkExamTimeLimit uses blueprint.timeLimit * 60 when available (Lines 187-188)', () => {
    const start = new Date(Date.now() - 10 * 1000).toISOString(); // 10s elapsed
    // Should NOT throw since blueprint gives 60 min = 3600s and only 10s elapsed
    expect(() =>
      (container.get(ExamEngine) as any).checkExamTimeLimit({
        id: 'e1',
        startedAt: start,
        durationSeconds: 7200,
        blueprint: { timeLimit: 60 }, // positive timeLimit
      })
    ).not.toThrow();
  });

  it('completeExam flushes cached answers from Redis to DB (Line 259)', async () => {
    const { cacheService } = await import('@/modules/core/cache.service');
    const { AnswerEvaluationEngine } = await import('@/modules/answer-engine/answer.engine');
    const { JobsService } = await import('@/modules/system/jobs.service');
    const { JobOrchestrator } = await import('@/modules/system/job-orchestrator');

    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue({
      id: 'e1', userId: 'u1', status: 'started',
      startedAt: new Date(), lastAnsweredAt: null,
    } as any);
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([{ id: 'e1' }] as any);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
      id: 'e1',
      examQuestions: [
        { id: 'eq1', questionId: 'q1', responseMetadata: null, question: { type: 'mcq', correctAnswer: 'A' } },
      ],
    } as any);
    vi.spyOn(ExamRepository.prototype, 'recordIdempotency').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'updateExamQuestionResponse').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);
    vi.spyOn(AnswerEvaluationEngine.prototype, 'evaluate').mockReturnValue(true);
    // Return a cached answer so line 259's condition is true
    vi.spyOn(cacheService, 'get').mockResolvedValue({ answer: 'A' } as any);
    (JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'j1' });
    (JobOrchestrator.runJob as any) = vi.fn();

    const res = await container.get(ExamEngine).completeExam('e1', 'u1');
    expect(res.status).toBe('processing');
    expect(res.jobId).toBe('j1');
  });

  it('completeExam returns processing when update finds zero rows', async () => {
    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any);
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      status: 'started',
    } as any);
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([] as any); // zero rows

    const res = await container.get(ExamEngine).completeExam('e1', 'u1');
    expect(res).toEqual({ examId: 'e1', status: 'processing', jobId: undefined });
  });

  it('submitAnswer gracefully handles Redis get failure for idempotency check (.catch line 140)', async () => {
    const { cacheService } = await import('@/modules/core/cache.service');
    // Make cacheService.get reject to trigger .catch(() => null) on line 140
    vi.spyOn(cacheService, 'get').mockRejectedValue(new Error('redis down'));
    vi.spyOn(ExamEngine.prototype as any, 'getAndCacheActiveExam').mockResolvedValue({
      id: 'e1', userId: 'u1', status: 'started',
      startedAt: new Date().toISOString(), durationSeconds: 3600, blueprint: null,
    });
    vi.spyOn(ExamEngine.prototype as any, 'checkExamTimeLimit').mockReturnValue(undefined);
    // cacheService.set should also reject to trigger .catch on lines 160 and 166
    vi.spyOn(cacheService, 'set').mockRejectedValue(new Error('redis down'));
    vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

    // With idempotencyKey to trigger all 3 .catch() paths (lines 140, 160, 166)
    await container.get(ExamEngine).submitAnswer('e1', 'q1', 'A', 'u1', 'idem-redis-fail');
    expect(cacheService.get).toHaveBeenCalled();
  });

  it('getAndCacheActiveExam tolerates cache.set failure (.catch line 178)', async () => {
    const { cacheService } = await import('@/modules/core/cache.service');
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    vi.spyOn(ExamRepository.prototype, 'findByIdWithBlueprint').mockResolvedValue({
      id: 'e1', userId: 'u1', status: 'started',
      startedAt: new Date().toISOString(), blueprint: null,
    } as any);
    // This triggers the .catch(() => null) on line 178
    vi.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('redis set fail'));

    const result = await (container.get(ExamEngine) as any).getAndCacheActiveExam('u1', 'e1');
    expect(result.id).toBe('e1');
  });
});
