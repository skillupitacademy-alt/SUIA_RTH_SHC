import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

vi.mock('@/modules/exam-engine/exam.state-machine', () => ({
  ExamStateMachine: {
    transition: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/modules/core/event-bus', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock('@quiz/db', () => {
  const deleteWhere = vi.fn().mockResolvedValue(undefined);
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const insertValues = vi.fn().mockResolvedValue(undefined);

  return {
    STANDARD_QUERY_TIMEOUT: 15000,
    QUICK_QUERY_TIMEOUT: 5000,
    REPORT_QUERY_TIMEOUT: 30000,
    MIGRATION_TIMEOUT: 120000,
    withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
      query: {
        exams: { findFirst: vi.fn() },
        topics: { findMany: vi.fn() },
      },
      select: vi.fn(),
      delete: vi.fn(() => ({ where: deleteWhere })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: insertValues })),
      transaction: vi.fn(async (fn) => fn(db)),
    },
    exams: { id: 'id' },
    examBlueprints: {},
    examQuestions: {},
    questions: {},
    questionSkills: {},
    skills: {},
    resultsByDimension: { examId: 'examId' },
    topics: {},
    subjects: {},
    domains: {},
    subtopics: {},
    topicSkills: {},
  };
});

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { ScoringEngine } from '../scoring.engine';
import { installSelectMock } from '../../../test/select-mock';

describe('ScoringEngine Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reaches calculation path for tracer-enabled engine', async () => {
    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [{ exam: { id: 'exam-1', userId: 'u1', status: 'completed', startedAt: new Date(), completedAt: new Date(), blueprintId: null }, blueprint: { scoringStrategy: 'percentage' } }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [] }, // topicRaw
      { resolveOn: 'where', result: [] }, // topicSkillRows
      { resolveOn: 'where', result: [] }, // subtopicRows
    ]);

    const perf = {
      invalidateCache: vi.fn().mockResolvedValue(undefined),
      refreshAnalytics: vi.fn().mockResolvedValue(undefined),
    };
    const engine = new ScoringEngine(perf as any, {} as any, {} as any);
    await expect(engine.calculateExamResults('exam-1')).resolves.toBe(0);

    expect(withSpan).toHaveBeenCalledWith('ScoringEngine.calculateExamResults', expect.any(Function));
  });
});

