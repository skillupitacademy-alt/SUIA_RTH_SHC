import { describe, it, expect, vi } from 'vitest';

vi.mock('../analytics/user-analytics.service', () => ({
  UserAnalyticsService: { getTopicPerformance: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      topics: { findFirst: vi.fn().mockResolvedValue({ id: 't1', name: 'Topic', detailedNotesPath: null }) },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
  },
  topics: { id: 'id' },
  notifications: {},
  users: {},
}));

describe('AdaptiveTutorService requestMasterNotes tail', () => {
  it('returns false when topic has no detailedNotesPath (line 127)', async () => {
    const { AdaptiveTutorService } = await import('../adaptive-tutor.service');
    const res = await AdaptiveTutorService.requestMasterNotes('u1', 't1');
    expect(res).toBe(false);
  });
});
