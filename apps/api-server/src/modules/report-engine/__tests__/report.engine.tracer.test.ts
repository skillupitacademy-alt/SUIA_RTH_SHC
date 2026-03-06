import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { ReportEngine } from '../report.engine';

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: vi.fn(), findMany: vi.fn() },
      resultsByDimension: { findMany: vi.fn() },
    },
  },
  exams: { id: 'id', userId: 'userId', status: 'status', blueprintId: 'blueprintId' },
  resultsByDimension: { examId: 'examId' }
}));

describe('ReportEngine Tracing', () => {
  let engine: ReportEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ReportEngine(db as any);
  });

  it('calls withSpan in getUserPerformance', async () => {
    (db.query.exams.findMany as any).mockResolvedValue([]);
    await engine.getUserPerformance('u1');
    expect(withSpan).toHaveBeenCalledWith('ReportEngine.getUserPerformance', expect.any(Function));
  });

  it('calls withSpan in getExamReport', async () => {
    (db.query.exams.findFirst as any).mockResolvedValue({ id: 'e1', userId: 'u1', examQuestions: [] });
    (db.query.resultsByDimension.findMany as any).mockResolvedValue([]);
    await engine.getExamReport('e1');
    expect(withSpan).toHaveBeenCalledWith('ReportEngine.getExamReport', expect.any(Function));
  });
});
