import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockSql: any = vi.fn();
  return { sql: mockSql };
});
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

import { redis } from '@/lib/redis';
import { sql } from '@/lib/db';
import { UserAnalyticsService } from '../user-analytics.service';

describe('UserAnalyticsService branch coverage', () => {
  it('ignores cache get/set errors and still returns snapshot', async () => {
    const mockSql = vi.mocked(sql);
    // force cache get error
    vi.mocked(redis.get).mockRejectedValue(new Error('redis down'));
    // force cache set error
    vi.mocked(redis.set).mockRejectedValue(new Error('redis down'));

    mockSql
      .mockResolvedValueOnce([{ topicId: 't1', topicName: 'Topic', accuracy: 0.5 }]) // topics
      .mockResolvedValueOnce([{ difficulty: 'simple', accuracy: 0.6 }]) // difficulty
      .mockResolvedValueOnce([{ min: 1, q1: 2, median: 3, q3: 4, max: 5 }]); // pacing

    const res = await UserAnalyticsService.getAdaptiveSnapshot('user-x');
    expect(res.topics[0].topicId).toBe('t1');
  });

  it('getDifficultyAccuracy ignores unknown labels and lowercases', async () => {
    const mockSql = vi.mocked(sql);
    mockSql.mockResolvedValueOnce([
      { difficulty: 'Simple', accuracy: 0.7 },
      { difficulty: 'EXPERT', accuracy: null },
      { difficulty: 'unknown', accuracy: 0.9 },
    ]);

    const res = await UserAnalyticsService.getDifficultyAccuracy('u1');
    expect(res.simple).toBe(0.7);
    expect(res.expert).toBe(0); // null -> 0
    expect(res.intermediate).toBe(0);
  });

  it('getPacingStats returns null when no data', async () => {
    const mockSql = vi.mocked(sql);
    mockSql.mockResolvedValueOnce([{ min: null, q1: null, median: null, q3: null, max: null }]);
    const res = await UserAnalyticsService.getPacingStats('u1');
    expect(res).toBeNull();
  });
});
