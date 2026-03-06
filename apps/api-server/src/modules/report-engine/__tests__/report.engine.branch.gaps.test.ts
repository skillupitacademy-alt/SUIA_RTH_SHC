import { afterEach, describe, expect, it, vi } from 'vitest';

import { container } from '@/modules/core/container';

import { ReportEngine } from '../report.engine';

describe('ReportEngine branch gaps', () => {
  const oldNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = oldNodeEnv;
    vi.restoreAllMocks();
    (ReportEngine as any).singleton = null;
    (ReportEngine as any)._db = undefined;
  });

  it('reuses singleton in non-test mode after first resolve', async () => {
    process.env.NODE_ENV = 'production';
    (ReportEngine as any).singleton = null;

    const fakeEngine = {
      getUserPerformance: vi.fn().mockResolvedValue({ examsCompleted: 0 }),
    };
    const getSpy = vi.spyOn(container, 'get').mockReturnValue(fakeEngine as any);

    await ReportEngine.getUserPerformance('u1');
    await ReportEngine.getUserPerformance('u1');

    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to new instance when container resolution fails in non-test mode', () => {
    process.env.NODE_ENV = 'production';
    (ReportEngine as any).singleton = null;
    vi.spyOn(container, 'get').mockImplementation(() => {
      throw new Error('container unavailable');
    });

    const instance = (ReportEngine as any).getInstance();
    expect(instance).toBeInstanceOf(ReportEngine);
  });

  it('uses injected tutorService.generateInsights in getExamReport', async () => {
    const tutorService = {
      generateInsights: vi.fn().mockResolvedValue([{ topicId: 't1', accuracy: 88 }]),
    };

    const mockDb = {
      query: {
        exams: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'e1',
            userId: 'u1',
            status: 'completed',
            startedAt: new Date('2025-01-01T00:00:00Z'),
            completedAt: new Date('2025-01-01T00:10:00Z'),
            blueprintId: null,
            blueprint: null,
            examQuestions: [],
          }),
          findMany: vi.fn().mockResolvedValue([
            { id: 'peer1', examQuestions: [{ isCorrect: true }] },
            { id: 'peer2', examQuestions: [{ isCorrect: false }] },
          ]),
        },
        resultsByDimension: {
          findMany: vi.fn().mockResolvedValue([
            { dimensionType: 'topic', dimensionId: 't1', name: 'Topic 1', score: 0, accuracy: 88 },
          ]),
        },
      },
    };

    const engine = new ReportEngine(mockDb as any, undefined, tutorService as any, undefined);
    await engine.getExamReport('e1');

    expect(tutorService.generateInsights).toHaveBeenCalledWith('u1', [{ topicId: 't1', accuracy: 88 }]);
  });

  it('handles non-array raw question rows in premium report path', async () => {
    const mockDb = {
      query: {
        exams: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'e2',
            userId: 'u2',
            status: 'completed',
            blueprintId: null,
            completedAt: new Date('2025-01-01T00:20:00Z'),
            startedAt: new Date('2025-01-01T00:00:00Z'),
          }),
        },
        resultsByDimension: { findMany: vi.fn().mockResolvedValue([]) },
        examQuestions: { findFirst: vi.fn().mockResolvedValue(null) },
        userProfiles: { findFirst: vi.fn().mockResolvedValue({ name: 'User 2' }) },
      },
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              score: 96,
              mastery: 75,
              readiness: 70,
              percentile: 50,
              confidence: 'MEDIUM',
              is_inconsistent: false,
              weakest_subtopic: null,
              weakest_skill: null,
              weakest_difficulty: null,
              time_pattern: null,
              stable_count: 1,
              logic_count: 1,
              error_count: 0,
              stable_time_sec: 10,
              logic_time_sec: 10,
              neural_time_sec: 10,
              expert_drop_off: false,
              subtopics: [],
              skills: [],
              heatmap: [],
              difficulty: [],
              total_time: 30,
              question_count: 3,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: null }),
    };

    const performanceService = {
      getCachedReport: vi.fn().mockResolvedValue(null),
      refreshAnalytics: vi.fn().mockResolvedValue(undefined),
      cacheReport: vi.fn().mockResolvedValue(undefined),
    };
    const interpreter = { interpret: vi.fn().mockReturnValue({}) };

    const engine = new ReportEngine(mockDb as any, performanceService as any, undefined, interpreter as any);
    const report = await engine.getPremiumExamReport('e2');

    expect(report.questions).toEqual([]);
  });

  it('maps raw question rows when rows is a real array', async () => {
    const mockDb = {
      query: {
        exams: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'e3',
            userId: 'u3',
            status: 'completed',
            blueprintId: null,
            completedAt: new Date('2025-01-01T00:20:00Z'),
            startedAt: new Date('2025-01-01T00:00:00Z'),
          }),
        },
        resultsByDimension: { findMany: vi.fn().mockResolvedValue([]) },
        examQuestions: { findFirst: vi.fn().mockResolvedValue(null) },
        userProfiles: { findFirst: vi.fn().mockResolvedValue({ name: 'User 3' }) },
      },
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              score: 96,
              mastery: 80,
              readiness: 78,
              percentile: 50,
              confidence: 'HIGH',
              is_inconsistent: false,
              weakest_subtopic: null,
              weakest_skill: null,
              weakest_difficulty: null,
              time_pattern: null,
              stable_count: 1,
              logic_count: 1,
              error_count: 0,
              stable_time_sec: 10,
              logic_time_sec: 10,
              neural_time_sec: 10,
              expert_drop_off: false,
              subtopics: [],
              skills: [],
              heatmap: [],
              difficulty: [],
              total_time: 30,
              question_count: 3,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'q1',
              text: 'Question',
              user_answer: 'A',
              correct_answer: 'A',
              explanation: 'ok',
              is_correct: 1,
              time_spent: 6,
            },
          ],
        }),
    };

    const performanceService = {
      getCachedReport: vi.fn().mockResolvedValue(null),
      refreshAnalytics: vi.fn().mockResolvedValue(undefined),
      cacheReport: vi.fn().mockResolvedValue(undefined),
    };
    const interpreter = { interpret: vi.fn().mockReturnValue({}) };

    const engine = new ReportEngine(mockDb as any, performanceService as any, undefined, interpreter as any);
    const report = await engine.getPremiumExamReport('e3');

    expect(report.questions).toHaveLength(1);
    expect(report.questions[0].isCorrect).toBe(true);
  });
});
