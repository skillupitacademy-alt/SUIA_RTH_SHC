import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';
import { cacheService } from '@/modules/core/cache.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ExamEngine } from '../exam.engine';

describe('ExamEngine remaining branches', () => {
  it('resumeExamSession returns null firstQuestion when missing question', async () => {
    const tx = {
      query: {
        exams: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'e1',
            status: 'started',
            durationSeconds: 120,
            startedAt: new Date().toISOString(),
            examQuestions: [{ order: 1, question: null }],
          }),
        },
      },
    } as any;

    const res = await (ExamEngine as any).resumeExamSession(tx, 'e1');
    expect(res.firstQuestion).toBeNull();
  });

  it('executeSubmitAnswer handles existing metadata timeSpentSeconds path', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    vi.spyOn(cacheService, 'set').mockResolvedValue(undefined as any);
    vi.spyOn(ExamEngine as any, 'getAndCacheActiveExam').mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      status: 'started',
      startedAt: new Date().toISOString(),
      lastAnsweredAt: new Date().toISOString(),
      durationSeconds: 4000,
      blueprint: { timeLimit: 120 },
    });
    vi.spyOn(ExamEngine as any, 'checkExamTimeLimit').mockReturnValue(undefined);
    const tx = {
      update: () => ({ set: () => ({ where: () => undefined }) }),
    } as any;
    const eqRecord = {
      id: 'eq1',
      responseMetadata: { timeSpentSeconds: 5, firstAnsweredAt: 'iso' },
      question: { type: 'mcq', correctAnswer: 'A' },
    };
    vi.spyOn(db, 'transaction').mockImplementation(async (fn: any) => fn(tx));
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce({ answer: 'A' } as any);

    await (ExamEngine as any).updateExamResponse(tx, { id: 'e1', startedAt: new Date().toISOString(), lastAnsweredAt: new Date().toISOString() }, eqRecord, 'A');
  });

  it('completeExam handles idempotency key remap and zero-updated rows', async () => {
    vi.spyOn(PerformanceService, 'invalidateCache').mockResolvedValueOnce(undefined as any);
    (db as any).query = {
      idempotencyKeys: { findFirst: vi.fn().mockResolvedValue({ examId: 'mapped' }) },
      exams: {
        findFirst: vi
          .fn()
          // fullExam
          .mockResolvedValueOnce({ id: 'mapped', userId: 'u1', status: 'started' })
          // examWithQuestions
          .mockResolvedValueOnce(null),
      },
    };
    vi.spyOn(db, 'update').mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => [],
        }),
      }),
    } as any);

    const res = await ExamEngine.completeExam('orig', 'u1', 'idem');
    expect(res.examId).toBe('mapped');
    expect(res.status).toBe('processing');
  });
});
