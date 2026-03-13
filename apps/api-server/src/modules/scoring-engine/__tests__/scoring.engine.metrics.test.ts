import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock metrics
vi.mock('@/lib/metrics', () => ({
  recordCounter: vi.fn(),
  recordTimer: vi.fn(),
}));

// Ensure tracing wrapper always executes the operation in tests
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn() })),
}));

import { METRICS } from '@quiz/observability';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { db } from '@quiz/db';
import { ScoringEngine } from '../scoring.engine';
import { ExamStateMachine } from '../../exam-engine/exam.state-machine';
import { installSelectMock } from '../../../test/select-mock';

vi.mock('../../exam-engine/exam.state-machine', () => ({
  ExamStateMachine: {
    transition: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@quiz/db', () => ({
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
    insert: vi.fn(() => ({ values: vi.fn() })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
    transaction: vi.fn(async (fn) => fn(db)),
  },
  exams: { id: 'id', status: 'status' },
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
}));

describe('ScoringEngine Metrics', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ScoringEngine(
      { invalidateCache: vi.fn() } as any,
      {} as any,
      {} as any
    );
  });

  it('records success metrics on successful scoring', async () => {
    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [{ exam: { id: 'e1', userId: 'u1', status: 'completed', startedAt: new Date(), completedAt: new Date(), blueprintId: null }, blueprint: {} }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [] }, // topicRaw
      { resolveOn: 'where', result: [] }, // topicSkillRows
      { resolveOn: 'where', result: [] }, // subtopicRows
    ]);

    await engine.calculateExamResults('e1');
    
    expect(recordCounter).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.success', 1);
    expect(recordTimer).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.duration', expect.any(Number));
  });

  it('records failure metrics on scoring error', async () => {
    (db as any).select = vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error('DB Error')),
    }));
    
    await expect(engine.calculateExamResults('e1')).rejects.toThrow();
    
    expect(recordCounter).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.failure', 1, expect.objectContaining({ error: 'DB Error' }));
    expect(recordTimer).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.duration', expect.any(Number));
  });
});


