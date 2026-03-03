import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getTopicPerformance: vi.fn(),
  findMany: vi.fn(),
}));

function analyticsMockFactory() {
  return {
    __esModule: true,
    UserAnalyticsService: {
      getTopicPerformance: (...args: any[]) => mocks.getTopicPerformance(...args),
    },
  };
}

vi.mock('../analytics/user-analytics.service', analyticsMockFactory);
vi.mock('@/modules/analytics/user-analytics.service', analyticsMockFactory);

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      topics: { findMany: (...args: any[]) => mocks.findMany(...args) },
      users: { findFirst: vi.fn().mockResolvedValue({ email: 'user@example.com' }) },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
  },
  topics: {
    _: { inferSelect: {} },
    id: 'id',
    name: 'name',
  } as any,
  notifications: {} as any,
}));

describe('AdaptiveTutorService branch coverage', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getTopicPerformance.mockReset();
    mocks.findMany.mockReset();
  });

  it('hits conceptual gap and performance dip branches with fallback topic name', async () => {
    mocks.getTopicPerformance.mockResolvedValue([
      { topicId: 't-1', accuracy: 90 },
      { topicId: 't-2', accuracy: 90 },
    ]);
    // No topic details found, forces fallback name/learningUrl
    mocks.findMany.mockResolvedValue([]);

    const { AdaptiveTutorService } = await import('../adaptive-tutor.service');

    const res = await AdaptiveTutorService.generateInsights('u1', [
      { topicId: 't-1', accuracy: 40 }, // conceptual gap path
      { topicId: 't-2', accuracy: 70 }, // performance dip path because past >80
    ]);

    expect(res).toHaveLength(2);
    expect(res[0].priority).toBe('critical');
    expect(res[1].priority).toBe('critical');
    expect(res[0].topicName).toBe('Topic'); // fallback name path
  });
});
