import { describe, expect, it, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { ExamEngine } from '../exam.engine';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { cacheService } from '@/modules/core/cache.service';
import { JobsService } from '@/modules/system/jobs.service';
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';

vi.mock('@/modules/selection-engine/selection.service');
vi.mock('@/modules/core/cache.service');
vi.mock('@/modules/system/jobs.service');
vi.mock('@/modules/answer-engine/answer.engine');
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
    
    // Ensure nested objects exist on the mocked db.query from setup.ts
    if (!(db.query as any).idempotencyKeys) (db.query as any).idempotencyKeys = { findFirst: vi.fn() };
    if (!(db.query as any).exams) (db.query as any).exams = { findFirst: vi.fn() };

    const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'new' }])
    });
    const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'updated' }])
        })
    });
    (cacheService as any).set = vi.fn().mockResolvedValue(undefined);
    (cacheService as any).get = vi.fn().mockResolvedValue(null);

    (db.transaction as any) = vi.fn(async (fn: any) => {
      const tx = { query: db.query, insert: mockInsert, update: mockUpdate };
      return fn(tx as any);
    });
    
    db.insert = mockInsert as any;
    db.update = mockUpdate as any;
  });

  describe('startExam', () => {
    it('resumes existing session', async () => {
      (vi.spyOn(db.query.idempotencyKeys, 'findFirst') as any).mockResolvedValue({ examId: 'e1' } as any);
      (vi.spyOn(db.query.exams, 'findFirst') as any).mockResolvedValue(mockExam as any);

      const result = await ExamEngine.startExam('u1', 'b1', 'idem-1');
      expect(result.examId).toBe('e1');
    });

    it('creates new exam', async () => {
      (vi.spyOn(db.query.idempotencyKeys, 'findFirst') as any).mockResolvedValue(undefined);
      (vi.spyOn(db.query.exams, 'findFirst') as any).mockResolvedValue(undefined);
      vi.mocked(SelectionService.composeExam).mockResolvedValue({
        questions: [{ id: 'q1', type: 'mcq' }],
        blueprint: { id: 'b1', timeLimit: 60 }
      } as any);

      const result = await ExamEngine.startExam('u1', 'b1', 'idem-2');
      expect(result.examId).toBe('new');
    });
  });

  describe('submitAnswer', () => {
    it('throws if exam expired', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      const expiredExam = { 
        ...mockExam,
        startedAt: new Date(Date.now() - 10000000).toISOString(),
        durationSeconds: 10
      };
      (vi.spyOn(db.query.exams, 'findFirst') as any).mockResolvedValue(expiredExam as any);

      await expect(ExamEngine.submitAnswer('e1', 'q1', 'ans', 'u1')).rejects.toThrow('Time limit exceeded');
    });

    it('stages answer in Redis', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      (vi.spyOn(db.query.exams, 'findFirst') as any).mockResolvedValue(mockExam as any);

      await ExamEngine.submitAnswer('e1', 'q1', 'ans', 'u1');
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('completeExam', () => {
    it('flushes answers and creates job', async () => {
      // completeExam calls findFirst at least twice
      (vi.spyOn(db.query.exams, 'findFirst') as any)
        .mockResolvedValueOnce(mockExam as any) // Status check
        .mockResolvedValueOnce({               // Flush join
          ...mockExam,
          examQuestions: [{ 
            id: 'eq1', 
            questionId: 'q1', 
            question: { type: 'mcq', correctAnswer: 'A' } 
          }]
        } as any);

      vi.mocked(cacheService.get).mockResolvedValue({ answer: 'A' });
      vi.mocked(AnswerEvaluationEngine.evaluate).mockReturnValue(true);
      vi.mocked(JobsService.createJob).mockResolvedValue({ id: 'j1' } as any);

      const result = await ExamEngine.completeExam('e1', 'u1');
      expect(result.jobId).toBe('j1');
    });
  });
});
