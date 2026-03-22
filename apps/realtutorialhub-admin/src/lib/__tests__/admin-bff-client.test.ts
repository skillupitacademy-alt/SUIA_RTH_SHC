import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminDashboardSummary } from '../admin-bff-client';
import type { AdminDashboardSummary } from '../bff-types';

describe('admin-bff-client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('returns parsed dashboard summary on success', async () => {
    const payload: AdminDashboardSummary = {
      status: 'healthy',
      generatedAt: new Date().toISOString(),
      metrics: { totalUsers: 1, totalQuestions: 2, totalExams: 3, totalBlueprints: null },
      queue: { pendingJobs: 0, failedJobs: 0, isHealthy: true },
      security: { activeSessions: 4, recentAuthEvents: 5 },
      activity: { activeExams: 6, submissionsToday: 7 },
      sources: { metrics: 'ok', queue: 'ok', security: 'ok', activity: 'ok' },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await getAdminDashboardSummary();

    expect(mockFetch).toHaveBeenCalledWith('/api/bff/dashboard-summary', expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(payload);
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({}),
    });

    await expect(getAdminDashboardSummary()).rejects.toThrow('BFF Request Failed: Bad Request');
  });
});
