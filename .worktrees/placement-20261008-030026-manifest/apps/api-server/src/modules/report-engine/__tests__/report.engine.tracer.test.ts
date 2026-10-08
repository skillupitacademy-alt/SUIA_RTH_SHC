import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { ReportEngine } from '../report.engine';
import { installSelectMock } from '../../../test/select-mock';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      exams: { findFirst: vi.fn(), findMany: vi.fn() },
      resultsByDimension: { findMany: vi.fn() },
    },
  },
  exams: { id: 'id', userId: 'userId', status: 'status', blueprintId: 'blueprintId' },
  examBlueprints: {},
  examQuestions: {},
  questions: {},
  resultsByDimension: { examId: 'examId' }
}));

describe('ReportEngine Tracing', () => {
  let engine: ReportEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ReportEngine(db as any);
  });

  it('calls withSpan in getUserPerformance', async () => {
    installSelectMock(db as any, [
      { resolveOn: 'orderBy', result: [{ exam: { id: 'e1', totalScore: 80 }, dimensions: null }] },
    ]);
    await engine.getUserPerformance('u1');
    expect(withSpan).toHaveBeenCalledWith('ReportEngine.getUserPerformance', expect.any(Function));
  });

  it('calls withSpan in getExamReport', async () => {
    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [{ exam: { id: 'e1', userId: 'u1', status: 'completed', startedAt: new Date(), completedAt: new Date(), blueprintId: null }, blueprint: null }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [] }, // resultsByDimension
      { resolveOn: 'where', result: [{ id: 'p1', totalScore: 50, isCorrect: true }] }, // percentile cohort
    ]);
    await engine.getExamReport('e1');
    expect(withSpan).toHaveBeenCalledWith('ReportEngine.getExamReport', expect.any(Function));
  });
});


