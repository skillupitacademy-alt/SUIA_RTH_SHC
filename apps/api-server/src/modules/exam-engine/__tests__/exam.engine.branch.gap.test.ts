import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { db } from '@quiz/db';
import { cacheService } from '@/modules/core/cache.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ExamEngine } from '../exam.engine';

describe('ExamEngine branch gap coverage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('startExam falls back to handleRaceCondition on duplicate key error', async () => {
    const dupErr = { code: '23505', message: 'unq_user_key' };
    vi.spyOn(db, 'transaction').mockRejectedValueOnce(dupErr as never);
    const handleSpy = vi
      .spyOn(ExamEngine as unknown as { handleRaceCondition: typeof ExamEngine['handleRaceCondition'] }, 'handleRaceCondition')
      .mockResolvedValueOnce({ examId: 'resume', status: 'started' } as never);

    const result = await ExamEngine.startExam('u1', 'b1', 'idem-1', {});

    expect(handleSpy).toHaveBeenCalledWith('u1', 'idem-1');
    expect(result).toEqual({ examId: 'resume', status: 'started' });
  });

  it('resumeExamSession throws when exam is missing', async () => {
    const tx = {
      query: { exams: { findFirst: vi.fn().mockResolvedValue(undefined) } },
    } as unknown as Parameters<Parameters<typeof db.transaction>[0]>[0];

    await expect(
      // @ts-expect-error accessing private for coverage
      (ExamEngine as any).resumeExamSession(tx, 'missing-exam')
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

    const idKeyMock = vi.fn().mockResolvedValue({
      examId: fakeExam.id,
      key: 'idem',
      userId: 'u1',
    });
    const orderSpy = vi.fn();
    const examFindMock = vi.fn().mockImplementation(async (opts: any) => {
      opts.with.examQuestions.orderBy({} as any, { asc: (v: any) => { orderSpy(v); return v; } });
      return fakeExam;
    });
    (db as any).query = { idempotencyKeys: { findFirst: idKeyMock }, exams: { findFirst: examFindMock } };

    const result = await (ExamEngine as any).handleRaceCondition('u1', 'idem');

    expect(result.examId).toBe(fakeExam.id);
    expect(result.firstQuestion?.id).toBe('q1');
  });

  it('handleRaceCondition throws when key or exam not found', async () => {
    const idKeyMock = vi.fn().mockResolvedValue(undefined);
    (db as any).query = { idempotencyKeys: { findFirst: idKeyMock } };

    await expect(
      (ExamEngine as any).handleRaceCondition('u1', 'missing')
    ).rejects.toThrow('Collision recovery failed');
  });

  it('executeSubmitAnswer short-circuits when idempotency cache hit', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce({ used: true } as any);
    const getActiveSpy = vi
      .spyOn(ExamEngine as any, 'getAndCacheActiveExam')
      .mockResolvedValue({} as any);

    const tx = {} as Parameters<Parameters<typeof db.transaction>[0]>[0];
    // @ts-expect-error private call for coverage
    await (ExamEngine as any).executeSubmitAnswer(tx, 'e1', 'q1', 'A', 'u1', 'idem-ans');

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
    const examFindMock = vi.fn().mockResolvedValue(exam as any);
    (db as any).query = { exams: { findFirst: examFindMock } };
    vi.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('redis down'));

    // @ts-expect-error private call for coverage
    const result = await (ExamEngine as any).getAndCacheActiveExam('u1', 'e1');
    expect(result).toEqual(exam);
  });

  it('getAndCacheActiveExam throws when exam not found anywhere', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    const examFindMock = vi.fn().mockResolvedValue(null);
    (db as any).query = { exams: { findFirst: examFindMock } };

    await expect(
      // @ts-expect-error private call for coverage
      (ExamEngine as any).getAndCacheActiveExam('u1', 'missing')
    ).rejects.toThrow('Session not found');
  });

  it('resumeExamSession executes orderBy callback', async () => {
    const orderSpy = vi.fn();
    const tx = {
      query: {
        exams: {
          findFirst: vi.fn(async (opts: any) => {
            opts.with.examQuestions.orderBy({} as any, { asc: (v: any) => { orderSpy(v); return v; } });
            return {
              id: 'e1',
              status: 'started',
              durationSeconds: 300,
              startedAt: new Date().toISOString(),
              examQuestions: [
                { order: 1, question: { id: 'q1', questionText: 't', options: [], codeSnippet: null, type: 'mcq' } }
              ]
            };
          })
        }
      }
    } as any;

    const result = await (ExamEngine as any).resumeExamSession(tx, 'e1');
    expect(orderSpy).toHaveBeenCalled();
    expect(result.firstQuestion?.id).toBe('q1');
  });

  it('executeSubmitAnswer writes idempotency marker when no cache hit', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    const cacheSet = vi.spyOn(cacheService, 'set').mockResolvedValue(undefined as any);
    vi.spyOn(ExamEngine as any, 'getAndCacheActiveExam').mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      status: 'started',
      startedAt: new Date().toISOString(),
      durationSeconds: 100,
      blueprint: null,
    });
    vi.spyOn(ExamEngine as any, 'checkExamTimeLimit').mockReturnValue(undefined);
    const tx = { update: () => ({ set: () => ({ where: () => undefined }) }) } as any;

    await (ExamEngine as any).executeSubmitAnswer(tx, 'e1', 'q1', 'A', 'u1', 'idem-ans-2');

    expect(cacheSet).toHaveBeenCalledWith(expect.stringContaining('idem:ans:u1:idem-ans-2'), expect.any(Object), expect.any(Number));
  });

  it('completeExam short-circuits for already finished exam status', async () => {
    vi.spyOn(PerformanceService, 'invalidateCache').mockResolvedValueOnce(undefined as any);
    (db as any).query = {
      exams: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'e1',
          userId: 'u1',
          status: 'completed',
        }),
      },
      idempotencyKeys: { findFirst: vi.fn().mockResolvedValue(null) },
    };

    const result = await ExamEngine.completeExam('e1', 'u1');
    expect(result).toEqual({ examId: 'e1', status: 'completed' });
  });

  it('startExam rethrows non-duplicate errors', async () => {
    const boom = new Error('boom');
    vi.spyOn(db, 'transaction').mockRejectedValueOnce(boom as never);

    await expect(ExamEngine.startExam('u1', 'b1')).rejects.toThrow('boom');
  });

  it('getAndCacheActiveExam backfills cache then throws on missing DB record', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    vi.spyOn(db.query.exams, 'findFirst').mockResolvedValueOnce(null);

    await expect(
      // @ts-expect-error private
      (ExamEngine as any).getAndCacheActiveExam('u1', 'missing-db')
    ).rejects.toThrow('Session not found');
  });

  it('checkExamTimeLimit throws when elapsed exceeds duration', () => {
    const start = new Date(Date.now() - 4000 * 1000).toISOString(); // > 1h
    expect(() =>
      // @ts-expect-error private
      (ExamEngine as any).checkExamTimeLimit({
        id: 'e1',
        startedAt: start,
        durationSeconds: 3600,
        blueprint: null,
      })
    ).toThrow('Time limit exceeded');
  });

  it('completeExam returns processing when update finds zero rows', async () => {
    vi.spyOn(PerformanceService, 'invalidateCache').mockResolvedValueOnce(undefined as any);
    (db as any).query = {
      exams: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: 'e1', userId: 'u1', status: 'started' }) // fullExam
          .mockResolvedValueOnce(null), // examWithQuestions to skip flush loop
      },
      idempotencyKeys: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    vi.spyOn(db, 'update').mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => [], // updated length 0
        }),
      }),
    } as any);

    const res = await ExamEngine.completeExam('e1', 'u1');
    expect(res).toEqual({ examId: 'e1', status: 'processing', jobId: undefined });
  });
});
