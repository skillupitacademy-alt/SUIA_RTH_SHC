import { describe, it, expect, beforeEach, vi } from 'vitest';

const { dbcMock } = vi.hoisted(() => {
  return {
    dbcMock: {
      query: {
        exams: { findMany: vi.fn() },
        userProfiles: { findFirst: vi.fn() },
      },
    },
  };
});

vi.mock('@quiz/db', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    withTimeout: actual.withTimeout ?? (async (promise: Promise<any>) => promise),
    dbc: { ...actual.dbc, ...dbcMock },
  };
});

import { dbc } from '@quiz/db';
import { AdaptiveTutorService } from '@/modules/adaptive-engine/adaptive-tutor.service';
import { ReportEngine } from '../report.engine';
import { installSelectMock } from '../../../test/select-mock';

vi.mock('@/modules/adaptive-engine/adaptive-tutor.service', () => ({
  AdaptiveTutorService: {
    generateInsights: vi.fn().mockResolvedValue([{ topicId: 't1', advice: 'practice' }]),
  },
}));

vi.mock('../report-interpreter.service', () => ({
  ReportInterpreter: {
    interpret: vi.fn().mockReturnValue({ interpreted: true }),
  },
}));

vi.mock('../performance.service', () => ({
  PerformanceService: {
    cacheReport: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('ReportEngine branch coverage (action plan + tutor insights)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ReportEngine as any)._db = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('orders action plan priorities and runs tutor insights + percentile happy path', async () => {
    // Cohort for percentile (length > 1 executes map/filter branch)
    vi.spyOn(dbc.query.exams, 'findMany').mockResolvedValue([
      { id: 'peer1', totalScore: 80, examQuestions: [{ isCorrect: true }, { isCorrect: false }] },
      { id: 'peer2', totalScore: 95, examQuestions: [{ isCorrect: true }, { isCorrect: true }] },
    ] as any);

    const exam = {
      id: 'ex-branch',
      userId: 'user-1',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      blueprintId: 'bp-1',
      examQuestions: [],
    };

    // Skill results to hit critical (<50), growth (<75), stable branches and sorting
    const results = [
      { dimensionType: 'skill', dimensionId: 's1', name: 'Loops', accuracy: 40, score: 0 },
      { dimensionType: 'skill', dimensionId: 's2', name: 'Arrays', accuracy: 60, score: 0 },
      { dimensionType: 'skill', dimensionId: 's3', name: 'Types', accuracy: 90, score: 0 },
      // topic result so reducer still works
      { dimensionType: 'topic', dimensionId: 't1', name: 'JS', accuracy: 80, score: 0 },
    ] as any[];

    const coreRow = {
      score: 80,
      question_count: 10,
      total_time: 120,
      mastery: 70,
      readiness: 60,
      percentile: 55,
      confidence: 'MEDIUM',
      is_inconsistent: false,
      weakest_subtopic: 'loops',
      weakest_skill: 'arrays',
      weakest_difficulty: 'easy',
      time_pattern: 'balanced',
      stable_count: 5,
      logic_count: 3,
      error_count: 2,
      stable_time_sec: 30,
      logic_time_sec: 20,
      neural_time_sec: 10,
      expert_drop_off: false,
      subtopics: [{ topicId: 't1', name: 'JS', accuracy: 70, attempts: 3 }],
      skills: [{ name: 'Loops', accuracy: 40, attempts: 2 }],
      heatmap: null,
      difficulty: null,
    };

    const rawQuestions = [
      {
        id: 'q1',
        text: 'What is JS?',
        user_answer: 'A language',
        correct_answer: 'A language',
        explanation: 'Yes',
        is_correct: 1,
        time_spent: 5,
      },
    ];

    const mockDb = {
      query: {
        exams: { findFirst: vi.fn().mockResolvedValue(exam) },
        resultsByDimension: { findMany: vi.fn().mockResolvedValue(results) },
        userProfiles: { findFirst: vi.fn().mockResolvedValue({ name: 'User One' }) },
      },
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [coreRow] }) // core metrics
        .mockResolvedValueOnce({ rows: rawQuestions }), // raw questions
    };

    installSelectMock(mockDb as any, [
      { resolveOn: 'limit', result: [{ exam, blueprint: { id: 'bp-1' } }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: results }, // resultsByDimension
      { resolveOn: 'where', result: [
        { id: 'peer1', totalScore: 80, isCorrect: true },
        { id: 'peer1', totalScore: 80, isCorrect: false },
        { id: 'peer2', totalScore: 95, isCorrect: true },
      ] }, // percentile cohort
    ]);

    (ReportEngine as any)._db = mockDb;

    const report = await ReportEngine.getExamReport('ex-branch');

    // Action plan should be sorted by priority: critical, growth, stable
    const priorities = report.actionPlan.map((a: any) => a.priority);
    expect(priorities[0]).toBe('critical');
    expect(priorities[1]).toBe('growth');
    expect(priorities[2]).toBe('stable');

    // Tutor insights path should call AdaptiveTutorService.generateInsights (score < 95)
    expect(report.tutorInsights).toEqual([{ topicId: 't1', advice: 'practice' }]);

    // Percentile main branch executed (cohort length > 1)
    expect(report.percentile).toBeGreaterThan(0);
  });

  it('computes user performance averages (lines ~171-174)', async () => {
    const exams = [
      { id: 'e1', totalScore: 80, dimensions: [{ name: 'd1' }] },
      { id: 'e2', totalScore: null, dimensions: [{ name: 'd2' }] }, // null totalScore exercises fallback to 0
    ];

    const mockDb = {
      query: {
        exams: {
          findMany: vi.fn().mockResolvedValue(exams),
        },
      },
    };
    installSelectMock(mockDb as any, [
      { resolveOn: 'orderBy', result: exams.map((examRow) => ({ exam: examRow, dimensions: examRow.dimensions[0] })) },
    ]);
    (ReportEngine as any)._db = mockDb;

    const perf = await ReportEngine.getUserPerformance('user-1');

    expect(perf.examsCompleted).toBe(2);
    expect(perf.averageScore).toBe(40); // (80 + 0) / 2
    expect(perf.dimensions.length).toBe(2);
  });

  it('calculatePercentile respects blueprint filter branch (195-205)', async () => {
    vi.spyOn(dbc.query.exams, 'findMany').mockResolvedValueOnce([
      { id: 'peerA', totalScore: 70, examQuestions: [{ isCorrect: true }] },
      { id: 'peerB', totalScore: 90, examQuestions: [{ isCorrect: true }, { isCorrect: true }] },
    ] as any);

    const percentile = await (ReportEngine as any).calculatePercentile('e-blue', 'bp-filter', 75);

    expect(percentile).toBeGreaterThan(0);
    expect(percentile).toBeLessThanOrEqual(99);
  });

  it('calculatePercentile clamps within 1–99 when myAccuracy leads (195-205, blueprint null)', async () => {
    vi.spyOn(dbc.query.exams, 'findMany').mockResolvedValueOnce([
      { id: 'p1', totalScore: 50, examQuestions: [{ isCorrect: true }, { isCorrect: false }] }, // 50%
      { id: 'p2', totalScore: 60, examQuestions: [{ isCorrect: true }, { isCorrect: false }] }, // 50%
    ] as any);

    const percentile = await (ReportEngine as any).calculatePercentile('e-null', null, 90);

    expect(percentile).toBeGreaterThanOrEqual(1);
    expect(percentile).toBeLessThanOrEqual(99);
  });

  it('calculatePercentile clamps floor to 1 when lowerScores are zero (195-205)', async () => {
    const mockDb = {
      query: {
        exams: {
          findMany: vi.fn().mockResolvedValue([
            { id: 'p1', totalScore: 10, examQuestions: [{ isCorrect: true }, { isCorrect: false }] }, // 50%
            { id: 'p2', totalScore: 20, examQuestions: [{ isCorrect: true }, { isCorrect: false }] }, // 50%
            { id: 'p3', totalScore: 30, examQuestions: [{ isCorrect: true }, { isCorrect: false }] }, // 50%
          ]),
        },
      },
    };
    installSelectMock(mockDb as any, [
      { resolveOn: 'where', result: [
        { id: 'p1', totalScore: 10, isCorrect: true },
        { id: 'p1', totalScore: 10, isCorrect: false },
        { id: 'p2', totalScore: 20, isCorrect: true },
        { id: 'p2', totalScore: 20, isCorrect: false },
        { id: 'p3', totalScore: 30, isCorrect: true },
        { id: 'p3', totalScore: 30, isCorrect: false },
      ] },
    ]);
    (ReportEngine as any)._db = mockDb;

    const percentile = await (ReportEngine as any).calculatePercentile('e-low', null, 1); // very low accuracy

    expect(percentile).toBe(1);
  });

  it('calculatePercentile clamps ceiling to 99 when everyone else is lower (195-205)', async () => {
    const mockDb = {
      query: {
        exams: {
          findMany: vi.fn().mockResolvedValue([
            { id: 'p1', totalScore: 10, examQuestions: [{ isCorrect: false }, { isCorrect: false }] }, // 0%
            { id: 'p2', totalScore: 20, examQuestions: [{ isCorrect: false }, { isCorrect: false }] }, // 0%
            { id: 'p3', totalScore: 30, examQuestions: [{ isCorrect: false }, { isCorrect: false }] }, // 0%
          ]),
        },
      },
    };
    installSelectMock(mockDb as any, [
      { resolveOn: 'where', result: [
        { id: 'p1', totalScore: 10, isCorrect: false },
        { id: 'p1', totalScore: 10, isCorrect: false },
        { id: 'p2', totalScore: 20, isCorrect: false },
        { id: 'p2', totalScore: 20, isCorrect: false },
        { id: 'p3', totalScore: 30, isCorrect: false },
        { id: 'p3', totalScore: 30, isCorrect: false },
      ] },
    ]);
    (ReportEngine as any)._db = mockDb;

    const percentile = await (ReportEngine as any).calculatePercentile('e-high', null, 100); // higher than peers

    expect(percentile).toBe(99);
  });

  it('tutor insights calls generateInsights when score < 95 (line 591)', async () => {
    (AdaptiveTutorService.generateInsights as any).mockResolvedValue([{ topicId: 't1', advice: 'practice' }]);

    const exam = {
      id: 'ex-tutor',
      userId: 'u2',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      blueprintId: null,
      examQuestions: [],
    };

    const coreRow = {
      score: 80,
      question_count: 5,
      total_time: 50,
      mastery: 60,
      readiness: 60,
      percentile: 50,
      confidence: 'MEDIUM',
      is_inconsistent: false,
      weakest_subtopic: null,
      weakest_skill: null,
      weakest_difficulty: null,
      time_pattern: null,
      stable_count: 2,
      logic_count: 2,
      error_count: 1,
      stable_time_sec: 10,
      logic_time_sec: 10,
      neural_time_sec: 5,
      expert_drop_off: false,
      subtopics: [
        { topicId: 't1', name: 'Loops', accuracy: 70, attempts: 2 },
        { topicId: 't2', name: 'Arrays', accuracy: 60, attempts: 1 },
      ],
      skills: null,
      heatmap: null,
      difficulty: null,
    };

    const mockDb = {
      query: {
        exams: { findFirst: vi.fn().mockResolvedValue(exam) },
        resultsByDimension: { findMany: vi.fn().mockResolvedValue([
          { dimensionType: 'topic', dimensionId: 't1', name: 'Loops', accuracy: 70, score: 0 },
        ]) },
        userProfiles: { findFirst: vi.fn().mockResolvedValue({ name: 'User Two' }) },
      },
      execute: vi.fn()
        .mockResolvedValueOnce({ rows: [coreRow] }) // core metrics
        .mockResolvedValueOnce({ rows: [] }), // raw questions
    };

    installSelectMock(mockDb as any, [
      { resolveOn: 'limit', result: [{ exam, blueprint: null }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [
        { dimensionType: 'topic', dimensionId: 't1', name: 'Loops', accuracy: 70, score: 0 },
      ] }, // resultsByDimension
      { resolveOn: 'where', result: [
        { id: 'p1', totalScore: 50, isCorrect: true },
        { id: 'p1', totalScore: 50, isCorrect: false },
      ] }, // percentile cohort
    ]);

    (ReportEngine as any)._db = mockDb;

    const report = await ReportEngine.getExamReport('ex-tutor');

    expect(AdaptiveTutorService.generateInsights).toHaveBeenCalled();
    expect(report.tutorInsights).toEqual([{ topicId: 't1', advice: 'practice' }]);
  });
});

