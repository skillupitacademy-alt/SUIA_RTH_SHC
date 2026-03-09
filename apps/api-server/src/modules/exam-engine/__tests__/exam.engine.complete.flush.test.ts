import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
  },
}));

vi.mock('../../system/job-orchestrator', () => ({
  JobOrchestrator: {
    runJob: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../system/jobs.service', () => ({
  JobsService: {
    createJob: vi.fn().mockResolvedValue({ id: 'job1' }),
  },
}));

import { container } from '@/modules/core/container';
import { cacheService } from '@/modules/core/cache.service';
import { JobOrchestrator } from '../../system/job-orchestrator';
import { JobsService } from '../../system/jobs.service';
import { ExamEngine, __withTimeout } from '../exam.engine';

// Mock db and related tables
const dbMocks = vi.hoisted(() => {
  const update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'exam1' }]),
      }),
    }),
  });
  const queryExamsFindFirst = vi.fn();
  const withQuestions = {
    query: {
      exams: { findFirst: queryExamsFindFirst },
    },
    update,
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }) }),
    transaction: vi.fn(async (cb: any) => cb(withQuestions)),
  };
  return {
    update,
    queryExamsFindFirst,
    dbInstance: withQuestions,
  };
});

vi.mock('@quiz/db', () => ({
  db: dbMocks.dbInstance,
  exams: { id: 'exams.id', lastAnsweredAt: 'exams.lastAnsweredAt' } as any,
  examQuestions: { id: 'eq.id' } as any,
  idempotencyKeys: { id: 'ik.id' } as any,
  withTimeout: undefined,
  STANDARD_QUERY_TIMEOUT: 1000,
}));

describe('ExamEngine completeExam flush branch', () => {
  beforeEach(() => {
    dbMocks.update.mockReset();
    dbMocks.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'exam1' }]),
        }),
      }),
    });
    dbMocks.queryExamsFindFirst.mockReset();
    dbMocks.dbInstance.transaction = vi.fn(async (cb: any) => cb({ ...dbMocks.dbInstance }));
  });

  it('flushes cached answers and falls back to local async when queue disabled', async () => {
    const examQuestions = [
      {
        id: 'eq1',
        questionId: 'q1',
        responseMetadata: {},
        question: { type: 'mcq', correctAnswer: 'A' },
      },
    ];
    dbMocks.queryExamsFindFirst.mockResolvedValue({
      id: 'exam1',
      userId: 'u1',
      startedAt: new Date(Date.now() - 60000),
      lastAnsweredAt: null,
      examQuestions,
    });

    (cacheService.get as Mock).mockResolvedValue({ answer: 'A' });

    // container bindings for repo dependencies
    const repo = {
      checkIdempotency: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn().mockResolvedValue([{ id: 'exam1' }]),
      findByIdWithQuestions: vi.fn().mockResolvedValue({ examQuestions }),
      findById: vi.fn().mockResolvedValue({
        id: 'exam1',
        userId: 'u1',
        status: 'started',
        examQuestions,
      }),
    };
    const selection = { composeExam: vi.fn() };
    const performance = { refreshAnalytics: vi.fn(), invalidateCache: vi.fn().mockResolvedValue(undefined) };
    const answerEval = { evaluate: vi.fn(() => true) };
    (container.get as Mock)
      .mockReturnValueOnce(repo) // ExamRepository
      .mockReturnValueOnce(selection)
      .mockReturnValueOnce(performance)
      .mockReturnValueOnce(answerEval);

    const engine = new ExamEngine();

    // Disable queue by clearing token
    const prev = process.env.QSTASH_TOKEN;
    delete process.env.QSTASH_TOKEN;

    const res = await engine.completeExam('exam1', 'u1');
    expect(res.status).toBe('processing');
    expect(JobOrchestrator.runJob).toHaveBeenCalledWith('job1', 'u1');

    process.env.QSTASH_TOKEN = prev;
  });

  it('__withTimeout falls back when db.withTimeout is undefined', async () => {
    const promise = Promise.resolve('ok');
    await expect(__withTimeout(promise, 1000, 'test')).resolves.toBe('ok');
  });

  it('logs and rethrows when flushing cached answers fails', async () => {
    const examQuestions = [
      {
        id: 'eq1',
        questionId: 'q1',
        responseMetadata: {},
        question: { type: 'mcq', correctAnswer: 'A' },
      },
    ];
    dbMocks.queryExamsFindFirst.mockResolvedValue({
      id: 'exam1',
      userId: 'u1',
      startedAt: new Date(Date.now() - 60000),
      lastAnsweredAt: null,
      examQuestions,
    });

    (cacheService.get as Mock).mockResolvedValue({ answer: 'A' });

    // first call for status update succeeds, second for question flush throws
    const updateReturning = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'exam1' }]) }),
    });
    const throwingUpdate = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => {
          throw new Error('flush-fail');
        }),
      })),
    }));
    // replace transaction to inject throwing update chain
    dbMocks.dbInstance.transaction = vi.fn(async (cb: any) =>
      cb({
        ...dbMocks.dbInstance,
        update: vi
          .fn()
          .mockReturnValueOnce({ set: updateReturning })
          .mockImplementation(throwingUpdate),
      }),
    );

    const repo = {
      checkIdempotency: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn().mockResolvedValue([{ id: 'exam1' }]),
      findByIdWithQuestions: vi.fn().mockResolvedValue({ examQuestions }),
      findById: vi.fn().mockResolvedValue({
        id: 'exam1',
        userId: 'u1',
        status: 'started',
        examQuestions,
        startedAt: new Date(),
        lastAnsweredAt: null,
      }),
    };
    const selection = { composeExam: vi.fn() };
    const performance = { refreshAnalytics: vi.fn(), invalidateCache: vi.fn().mockResolvedValue(undefined) };
    const answerEval = { evaluate: vi.fn(() => true) };
    (container.get as Mock)
      .mockReturnValueOnce(repo)
      .mockReturnValueOnce(selection)
      .mockReturnValueOnce(performance)
      .mockReturnValueOnce(answerEval);

    const engine = new ExamEngine();
    await expect(engine.completeExam('exam1', 'u1')).rejects.toThrow('flush-fail');
  });

  it('hits queue-enabled branch and fallback when enqueue fails', async () => {
    const queueModule = await import('../../core/queue.service');
    (queueModule.queueService.enqueue as any) = vi.fn().mockResolvedValue({ success: false });

    const examQuestions = [
      {
        id: 'eq1',
        questionId: 'q1',
        responseMetadata: {},
        question: { type: 'mcq', correctAnswer: 'A' },
      },
    ];
    dbMocks.queryExamsFindFirst.mockResolvedValue({
      id: 'exam1',
      userId: 'u1',
      startedAt: new Date(Date.now() - 60000),
      lastAnsweredAt: null,
      examQuestions,
    });
    (cacheService.get as Mock).mockResolvedValue({ answer: 'A' });

    const repo = {
      checkIdempotency: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn().mockResolvedValue([{ id: 'exam1' }]),
      findByIdWithQuestions: vi.fn().mockResolvedValue({ examQuestions }),
      findById: vi.fn().mockResolvedValue({
        id: 'exam1',
        userId: 'u1',
        status: 'started',
        examQuestions,
        startedAt: new Date(),
        lastAnsweredAt: null,
      }),
    };
    const selection = { composeExam: vi.fn() };
    const performance = { refreshAnalytics: vi.fn(), invalidateCache: vi.fn().mockResolvedValue(undefined) };
    const answerEval = { evaluate: vi.fn(() => true) };
    (container.get as Mock)
      .mockReturnValueOnce(repo)
      .mockReturnValueOnce(selection)
      .mockReturnValueOnce(performance)
      .mockReturnValueOnce(answerEval);

    const prev = process.env.QSTASH_TOKEN;
    process.env.QSTASH_TOKEN = 'token';

    const engine = new ExamEngine();
    const res = await engine.completeExam('exam1', 'u1', 'idem');
    expect(res.status).toBe('processing');
    expect((await import('../../core/queue.service')).queueService.enqueue).toHaveBeenCalled();
    expect(JobOrchestrator.runJob).toHaveBeenCalledWith('job1', 'u1');

    process.env.QSTASH_TOKEN = prev;
  });
});
