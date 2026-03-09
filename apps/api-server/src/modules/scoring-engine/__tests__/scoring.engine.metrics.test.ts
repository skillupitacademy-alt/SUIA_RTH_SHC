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
    insert: vi.fn(() => ({ values: vi.fn() })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
    transaction: vi.fn(async (fn) => fn(db)),
  },
  exams: { id: 'id', status: 'status' },
  resultsByDimension: { examId: 'examId' }
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
    (db.query.exams.findFirst as any).mockResolvedValue({ id: 'e1', examQuestions: [], blueprint: {} });
    (db.query.topics.findMany as any).mockResolvedValue([]);
    
    await engine.calculateExamResults('e1');
    
    expect(recordCounter).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.success', 1);
    expect(recordTimer).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.duration', expect.any(Number));
  });

  it('records failure metrics on scoring error', async () => {
    (db.query.exams.findFirst as any).mockRejectedValue(new Error('DB Error'));
    
    await expect(engine.calculateExamResults('e1')).rejects.toThrow();
    
    expect(recordCounter).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.failure', 1, expect.objectContaining({ error: 'DB Error' }));
    expect(recordTimer).toHaveBeenCalledWith(METRICS.CORE.SCORING + '.duration', expect.any(Number));
  });
});


