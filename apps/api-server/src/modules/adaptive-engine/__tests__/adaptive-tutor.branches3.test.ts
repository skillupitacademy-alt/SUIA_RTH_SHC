import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getTopicPerformance: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      topics: { findMany: (...args: any[]) => mocks.findMany(...args) },
    },
  },
  topics: {
    _: { inferSelect: {} },
    id: 'id',
    name: 'name',
    learningUrl: 'learningUrl',
    detailedNotesPath: 'detailedNotesPath',
  } as any,
}));

describe('AdaptiveTutorService additional branches', () => {
  beforeEach(() => {
    // keep module mocks intact, just reset call history/implementations
    mocks.getTopicPerformance.mockReset();
    mocks.findMany.mockReset();
  });

  it('covers conceptual gap and performance dip with fallback topic name/learningUrl', async () => {
    const { UserAnalyticsService } = await import('../../analytics/user-analytics.service');
    vi.spyOn(UserAnalyticsService, 'getTopicPerformance').mockResolvedValue([
      { topicId: 't-crit', accuracy: 90 },
      { topicId: 't-dip', accuracy: 90 },
    ]);

    // Force no topic details to exercise fallback fields and null learningUrl
    mocks.findMany.mockResolvedValue([]);

    const { AdaptiveTutorService } = await import('../adaptive-tutor.service');

    const insights = await AdaptiveTutorService.generateInsights('user', [
      { topicId: 't-crit', accuracy: 40 }, // conceptual gap path (priority critical)
      { topicId: 't-dip', accuracy: 70 },  // performance dip path (priority critical)
    ]);

    expect(insights).toHaveLength(2);
    // Sorted with critical first
    expect(insights[0].priority).toBe('critical');
    expect(insights[0].topicName).toBe('Topic'); // fallback name path
    expect(insights[0].learningUrl).toBeUndefined();
  });
});


