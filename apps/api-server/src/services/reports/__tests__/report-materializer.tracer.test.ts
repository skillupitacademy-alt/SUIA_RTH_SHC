import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { ReportMaterializer } from '../ReportMaterializer';

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
  },
  exams: { id: 'id' }
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
