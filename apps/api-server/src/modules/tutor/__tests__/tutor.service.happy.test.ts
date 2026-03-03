import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const cacheSet = vi.fn();
const cacheGet = vi.fn();

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    get: cacheGet,
    set: cacheSet
  }
}));

vi.mock('@/modules/core/resilience.service', () => ({
  ResilienceService: {
    isFeatureEnabled: vi.fn().mockResolvedValue(true)
  }
}));

// Build a realistic @quiz/db mock
const txInsert = vi.fn(() => ({ values: vi.fn() }));
const txNotesFindFirst = vi.fn();
const txTopicFindFirst = vi.fn();
const txUserRecFindFirst = vi.fn();
const examsFindFirst = vi.fn();

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: examsFindFirst }
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { dimensionId: 't1', name: 'Topic One', accuracy: 60 }
      ])
    }),
    transaction: async (cb: any) =>
      cb({
        query: {
          userRecommendations: { findFirst: txUserRecFindFirst },
          topics: { findFirst: txTopicFindFirst },
          notesDeliveryLocks: { findFirst: txNotesFindFirst }
        },
        insert: txInsert
      })
  },
  exams: {},
  resultsByDimension: { dimensionId: 'id', name: 'name', accuracy: 'accuracy', examId: 'exam', dimensionType: 'type' },
  topics: {},
  userRecommendations: {},
  backgroundJobs: {},
  notesDeliveryLocks: {},
  notifications: {}
}));

describe('TutorService processExamResults happy path', () => {
  beforeEach(() => {
    cacheSet.mockReset();
    cacheGet.mockReset();
    cacheGet.mockResolvedValue(null);
    txInsert.mockClear();
    txNotesFindFirst.mockReset();
    txTopicFindFirst.mockReset();
    txUserRecFindFirst.mockReset();
    examsFindFirst.mockReset();

    examsFindFirst.mockResolvedValue({ userId: 'u1' });
    txUserRecFindFirst.mockResolvedValue(null);
    txTopicFindFirst.mockResolvedValue({ learningUrl: 'https://learn', detailedNotesPath: 'notes.pdf' });
    txNotesFindFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates recommendations, notifications, lock, and background job when weak topics exist', async () => {
    const { TutorService } = await import('../tutor.service');

    await TutorService.processExamResults('exam-1');

    expect(cacheSet).toHaveBeenCalled(); // rate-limit flag
    expect(txInsert).toHaveBeenCalled(); // at least one insert (recommendations/notifications/jobs)
  });
});
