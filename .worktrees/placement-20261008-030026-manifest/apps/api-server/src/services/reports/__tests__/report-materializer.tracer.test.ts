import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { ReportMaterializer } from '../ReportMaterializer';

const { makeSelect } = vi.hoisted(() => ({
  makeSelect: (rows: any[] = []) => ({
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve(rows),
  })
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: vi.fn() },
      subtopics: { findMany: vi.fn() },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      })),
    })),
    select: vi.fn().mockReturnValue(makeSelect([])),
  },
  exams: { id: 'id' },
  users: { id: 'id' },
  examQuestions: { id: 'eq' },
  questions: { id: 'q' },
  topics: { id: 't' },
  subjects: { id: 's' },
  domains: { id: 'd' },
  subtopics: { id: 'st' }
}));

describe('ReportMaterializer Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls withSpan in materialize', async () => {
    (db.query.exams.findFirst as any).mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      examQuestions: []
    });

    try {
        await ReportMaterializer.materialize('e1');
    } catch (e) {
        // Ignore errors from unmocked patterns/null-objects deep inside
    }
    
    expect(withSpan).toHaveBeenCalledWith('ReportMaterializer.materialize', expect.any(Function));
  });
});
