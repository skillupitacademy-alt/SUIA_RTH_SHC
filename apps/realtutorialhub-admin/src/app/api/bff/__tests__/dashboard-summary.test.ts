import { describe, expect, it, vi } from 'vitest';

import { GET } from '../dashboard-summary/route';

vi.mock('@quiz/api-client', () => ({
  apiClient: {
    admin: {
      getMetrics: vi.fn().mockResolvedValue({
        totalUsers: 10,
        totalQuestions: 20,
        totalExams: 5,
      }),
      getQueueStats: vi.fn().mockResolvedValue({
        queues: [{ counts: { waiting: 2, failed: 1 }, status: 'online' }],
      }),
      getSecurityMetrics: vi.fn().mockResolvedValue({
        activeSessions: 4,
        recentEvents: 3,
      }),
      getExamActivity: vi.fn().mockResolvedValue({
        started: 1,
        completed: 2,
      }),
    },
  },
  applyBffCacheHeaders: vi.fn((response: Response, policy: string) => {
    if (policy === 'BFF_PRIVATE' && response?.headers) {
      response.headers.set('Cache-Control', 'private, no-store');
    }
    return response;
  }),
}));

describe('GET /api/bff/dashboard-summary', () => {
  it('applies private cache headers', async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');

    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.metrics.totalUsers).toBe(10);
  });
});
