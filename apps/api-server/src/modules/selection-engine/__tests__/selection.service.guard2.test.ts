import { describe, it, expect, vi } from 'vitest';

// Minimal mocks for db/cache to avoid real calls
vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
  },
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      examBlueprints: { findFirst: vi.fn().mockResolvedValue(null) },
      questions: { findMany: vi.fn() },
      topics: { findMany: vi.fn() },
    },
    select: vi.fn(() => ({ from: () => ({ where: vi.fn().mockResolvedValue([]) }) })),
  },
  examBlueprints: {},
  questions: { id: 'id', status: 'status', difficulty: 'difficulty', subtopicId: 'subtopicId', topicId: 'topicId' },
  subtopics: { id: 'id', topicId: 'topicId' },
  topics: { id: 'id', subjectId: 'subjectId' },
  subjects: { id: 'id', domainId: 'domainId' },
}));

describe('SelectionService guard branches', () => {
  it('throws when domainId is missing (lines ~96,119)', async () => {
    const { SelectionService } = await import('../selection.service');
    await expect(
      SelectionService.composeExam('u1', '' as any, 'idem-1', { questionCount: 1, difficulty: 'mixed' }),
    ).rejects.toThrow(/Selection criteria/);
  });
});
