import { describe, expect, it, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { container } from '@/modules/core/container';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ExamObserver } from '@/modules/exam-engine/exam.observer';

const mockPerformanceService = {
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  refreshAnalytics: vi.fn().mockResolvedValue(undefined),
  cacheReport: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/modules/report-engine/performance.service', () => ({
  PerformanceService: vi.fn().mockImplementation(() => mockPerformanceService),
}));

describe('ScoringEngine (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.register(PerformanceService, mockPerformanceService as any);
  });

  it('calculates results for an exam by fetching from DB', async () => {
    const exam = {
      id: 'e1',
      status: 'started',
      startedAt: new Date(),
      examQuestions: [
        { 
          isCorrect: true, 
          question: { id: 'q1', topicId: 't1', difficulty: 'simple', questionSkills: [] } 
        }
      ],
      blueprint: { scoringStrategy: 'percentage' }
    };

    const topic = {
      id: 't1',
      name: 'Topic 1',
      subject: { id: 's1', name: 'S1', domain: { id: 'd1', name: 'D1' } },
      topicSkills: [],
      subtopics: []
    };

    (db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(exam) };
    (db.query as any).topics = { findMany: vi.fn().mockResolvedValue([topic]) };
    (db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    (db as any).insert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    (db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    const score = await container.get(ScoringEngine).calculateExamResults('e1');
    
    expect(score).toBe(100);
    expect((db.query as any).exams.findFirst).toHaveBeenCalled();
    expect((db as any).update).toHaveBeenCalled();
  });

  it('initializes observer only once across instances', () => {
    (ScoringEngine as any).observerInitialized = false;
    const initSpy = vi.spyOn(ExamObserver, 'init').mockImplementation(() => undefined);

    new ScoringEngine(mockPerformanceService as any, {} as any, {} as any);
    new ScoringEngine(mockPerformanceService as any, {} as any, {} as any);

    expect(initSpy).toHaveBeenCalledTimes(1);
  });
});
