import { apiClient } from '@quiz/api-client';

import { AdminDashboardSummary } from '@/lib/bff-types';

import { GET } from '../route';

vi.mock('@quiz/api-client', () => ({
  apiClient: {
    admin: {
      getMetrics: vi.fn(),
      getQueueStats: vi.fn(),
      getSecurityMetrics: vi.fn(),
      getExamActivity: vi.fn(),
    },
  },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data) => data),
  },
}));

describe('Admin Dashboard BFF Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status when all upstream calls succeed', async () => {
    vi.mocked(apiClient.admin.getMetrics).mockResolvedValue({
      totalUsers: 100,
      activeUsers24h: 50,
      totalExams: 20,
      liveExams: 5,
      totalQuestions: 50,
      recentCompletions: 10,
    });
    vi.mocked(apiClient.admin.getQueueStats).mockResolvedValue({
      enabled: true,
      timestamp: new Date().toISOString(),
      queues: [{ id: '1', queueName: 'default', displayName: 'Default', status: 'online', lastFailed: [], counts: { waiting: 5, failed: 0 } }],
    });
    vi.mocked(apiClient.admin.getSecurityMetrics).mockResolvedValue({
      activeSessions: 10,
      recentEvents: 5,
    });
    vi.mocked(apiClient.admin.getExamActivity).mockResolvedValue({
      started: 15,
      completed: 10,
      abandoned: 5,
      byDomain: [],
      avgCompletionTimeMinutes: 5,
    });

    const response = await GET();
    const data = (await response as unknown) as AdminDashboardSummary;

    expect(data.status).toBe('healthy');
    expect(data.metrics.totalUsers).toBe(100);
    expect(data.sources.metrics).toBe('ok');
    expect(data.sources.queue).toBe('ok');
  });

  it('should return degraded status when some upstream calls fail', async () => {
    vi.mocked(apiClient.admin.getMetrics).mockResolvedValue({
      totalUsers: 100,
      activeUsers24h: 50,
      totalExams: 20,
      liveExams: 5,
      totalQuestions: 50,
      recentCompletions: 10,
    });
    vi.mocked(apiClient.admin.getQueueStats).mockRejectedValue(new Error('Queue Fail'));
    vi.mocked(apiClient.admin.getSecurityMetrics).mockResolvedValue({
      activeSessions: 10,
      recentEvents: 5,
    });
    vi.mocked(apiClient.admin.getExamActivity).mockResolvedValue({
      started: 15,
      completed: 10,
      abandoned: 5,
      byDomain: [],
      avgCompletionTimeMinutes: 5,
    });

    const response = await GET();
    const data = (await response as unknown) as AdminDashboardSummary;

    expect(data.status).toBe('degraded');
    expect(data.queue.pendingJobs).toBeNull();
    expect(data.sources.queue).toBe('failed');
    expect(data.sources.metrics).toBe('ok');
  });

  it('should null out fields for failed sources', async () => {
    vi.mocked(apiClient.admin.getMetrics).mockRejectedValue(new Error('Metrics down'));
    vi.mocked(apiClient.admin.getQueueStats).mockResolvedValue({
      enabled: true,
      timestamp: new Date().toISOString(),
      queues: [{ id: '1', queueName: 'default', displayName: 'Default', status: 'online', lastFailed: [], counts: { waiting: 2, failed: 1 } }],
    });
    vi.mocked(apiClient.admin.getSecurityMetrics).mockRejectedValue(new Error('Security down'));
    vi.mocked(apiClient.admin.getExamActivity).mockRejectedValue(new Error('Activity down'));

    const response = await GET();
    const data = (await response as unknown) as AdminDashboardSummary;

    expect(data.status).toBe('degraded');
    expect(data.metrics.totalUsers).toBeNull();
    expect(data.security.activeSessions).toBeNull();
    expect(data.activity.activeExams).toBeNull();
    expect(data.queue.pendingJobs).toBe(2);
    expect(data.sources.metrics).toBe('failed');
    expect(data.sources.security).toBe('failed');
    expect(data.sources.activity).toBe('failed');
    expect(data.sources.queue).toBe('ok');
  });
});
