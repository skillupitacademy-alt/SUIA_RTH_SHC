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
    db: {
      query: {
        exams: { findFirst: vi.fn() },
        topics: { findMany: vi.fn() },
      },
      delete: vi.fn(() => ({ where: deleteWhere })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      insert: vi.fn(() => ({ values: insertValues })),
    },
    exams: { id: 'id' },
    resultsByDimension: { examId: 'examId' },
  };
});

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { ScoringEngine } from '../scoring.engine';

describe('ScoringEngine Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reaches calculation path for tracer-enabled engine', async () => {
    (db.query.exams.findFirst as any).mockResolvedValue({
      id: 'exam-1',
      userId: 'u1',
      examQuestions: [],
      blueprint: { scoringStrategy: 'percentage' }
    });
    (db.query.topics.findMany as any).mockResolvedValue([]);

    const perf = { invalidateCache: vi.fn().mockResolvedValue(undefined) };
    const engine = new ScoringEngine(perf as any, {} as any, {} as any);
    await expect(engine.calculateExamResults('exam-1')).resolves.toBe(0);

    expect(withSpan).toHaveBeenCalledWith('ScoringEngine.calculateExamResults', expect.any(Function));
  });
});
