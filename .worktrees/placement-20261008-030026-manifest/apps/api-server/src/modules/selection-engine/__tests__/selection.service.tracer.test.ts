import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      examBlueprints: { findFirst: vi.fn() },
      questions: { findMany: vi.fn() },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 10 }]),
      })),
    })),
  },
  examBlueprints: { id: 'id', domains: 'domains' },
  questions: { id: 'id', subtopicId: 'subtopicId', topicId: 'topicId', difficulty: 'difficulty', status: 'status' },
  subtopics: { id: 'id', topicId: 'topicId' },
  topics: { id: 'id', subjectId: 'subjectId' },
  subjects: { id: 'id', domainId: 'domainId' }
}));

describe('SelectionService Tracing', () => {
  let service: SelectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SelectionService(
      db as any,
      { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined) } as any
    );
    SelectionService.setInstance(service);
  });

  it('calls withSpan in composeExam', async () => {
    (db.query.examBlueprints.findFirst as any).mockResolvedValue({
      id: 'b1',
      questionIds: ['q1']
    });
    (db.query.questions.findMany as any).mockResolvedValue([{ id: 'q1' }]);

    await SelectionService.composeExam('u1', 'b1', 'i1');
    expect(withSpan).toHaveBeenCalledWith('SelectionService.composeExam', expect.any(Function));
  });

  it('calls withSpan in executeDynamicSelection', async () => {
    const criteria = {
      domainId: 'd1',
      finalSubtopicIds: [],
      actualTopicIds: [],
      actualSubjectIds: [],
      requestedTotal: 1,
      difficultyPref: 'simple'
    };
    const blueprint = { id: 'b1', questionIds: [] };

    await (service as any).executeDynamicSelection('u1', 'd1', 'i1', criteria, blueprint).catch(() => undefined);

    expect(withSpan).toHaveBeenCalledWith('SelectionService.executeDynamicSelection', expect.any(Function));
  });
});

