import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SelectionService } from '../selection.service';

vi.mock('@quiz/db', () => {
  const withTimeout = undefined;
  const examBlueprints = { id: 'b.id', domainId: 'b.domainId' } as any;
  const questions = { id: 'q.id', updatedAt: 'q.updatedAt', topicId: 'q.topicId', subtopicId: 'q.subtopicId' } as any;
  const subjects = { id: 's.id', domainId: 's.domainId' } as any;
  const topics = { id: 't.id', subjectId: 't.subjectId', domainId: 't.domainId' } as any;
  const subtopics = { id: 'st.id', topicId: 'st.topicId' } as any;
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ count: 0 }]) })) }));
  const query = {
    examBlueprints: { findFirst: vi.fn().mockResolvedValue({ id: 'b1', domainId: 'd1', questionIds: ['q1'], subjects: [] }) },
    questions: { findMany: vi.fn().mockResolvedValue([{ id: 'q1', questionText: 't', options: [], type: 'mcq' }]) },
    topics: { findMany: vi.fn().mockResolvedValue([]) },
    subjects: { findMany: vi.fn().mockResolvedValue([]) },
    subtopics: { findMany: vi.fn().mockResolvedValue([]) },
  };
  return { db: { query, select }, withTimeout, examBlueprints, questions, subjects, topics, subtopics, STANDARD_QUERY_TIMEOUT: 1000 };
});

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/metrics', () => ({
  recordCounter: vi.fn(),
  recordTimer: vi.fn(),
}));

describe('SelectionService entry branches', () => {
  let service: SelectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SelectionService();
  });

  it('composeExam uses legacy blueprintOrDomainId passthrough and returns questions array', async () => {
    const res = await service.composeExam('u1', 'd1', 'key1', { questionCount: 0 });
    expect(res.questions[0]?.id).toBe('q1');
  });

  it('resolveSelectionCriteria uses defaults when no ids are provided (lines ~73-81)', async () => {
    const crit = await SelectionService.resolveSelectionCriteria('d1', {}, { subjects: [] } as any);
    expect(crit.actualSubjectIds).toEqual([]);
    expect(crit.difficultyPref).toBeDefined();
  });

  it('generateDeterministicUUIDs yields stable sequence for branch coverage (lines 73-81)', () => {
    const service: any = new SelectionService();
    const uuids = service.generateDeterministicUUIDs('seed', 3);
    expect(uuids).toHaveLength(3);
    expect(uuids[0]).toMatch(/^[0-9a-f-]+$/);
    // deterministic: calling again with same seed gives identical output
    expect(service.generateDeterministicUUIDs('seed', 3)).toEqual(uuids);
  });
});
