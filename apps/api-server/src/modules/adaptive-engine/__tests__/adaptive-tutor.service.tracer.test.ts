import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { AdaptiveTutorService } from '../adaptive-tutor.service';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      topics: { findMany: vi.fn() },
    },
  },
  topics: { id: 'id', name: 'name' }
}));

vi.mock('../../analytics/user-analytics.service', () => ({
  UserAnalyticsService: { getTopicPerformance: vi.fn().mockResolvedValue([]) }
}));

describe('AdaptiveTutorService Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.query.topics.findMany as any).mockResolvedValue([]);
  });

  it('calls withSpan in generateInsights', async () => {
    const service = new AdaptiveTutorService(db as any);
    await service.generateInsights('u1', [{ topicId: 't1', accuracy: 50 }]);
    expect(withSpan).toHaveBeenCalledWith('AdaptiveTutorService.generateInsights', expect.any(Function));
  });
});


