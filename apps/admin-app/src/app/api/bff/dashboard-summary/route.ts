import { apiClient } from '@quiz/api-client';
import { NextResponse } from 'next/server';

import { AdminDashboardSummary } from '@/lib/bff-types';

export async function GET() {
  const generatedAt = new Date().toISOString();

  // Parallel execution using Promise.allSettled()
  const results = await Promise.allSettled([
    apiClient.admin.getMetrics(),
    apiClient.admin.getQueueStats(),
    apiClient.admin.getSecurityMetrics(),
    apiClient.admin.getExamActivity(),
  ]);

  const [metricsRes, queueRes, securityRes, activityRes] = results;

  // Safe access to metrics fields
  const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value : null;

  const response: AdminDashboardSummary = {
    status: 'healthy',
    generatedAt,
    metrics: {
      totalUsers: metrics?.totalUsers ?? null,
      totalQuestions: metrics?.totalQuestions ?? null,
      totalExams: metrics?.totalExams ?? null,
      // totalBlueprints isn't in AdminPlatformMetrics, so we set it to null for now
      totalBlueprints: null,
    },
    queue: {
      pendingJobs: queueRes.status === 'fulfilled' ? (queueRes.value.queues?.[0]?.counts?.waiting ?? null) : null,
      failedJobs: queueRes.status === 'fulfilled' ? (queueRes.value.queues?.[0]?.counts?.failed ?? null) : null,
      isHealthy: queueRes.status === 'fulfilled' ? queueRes.value.queues?.every(q => q.status === 'online') ?? null : null,
    },
    security: {
      activeSessions: securityRes.status === 'fulfilled' ? (securityRes.value.activeSessions as number ?? null) : null,
      recentAuthEvents: securityRes.status === 'fulfilled' ? (securityRes.value.recentEvents as number ?? null) : null,
    },
    activity: {
      activeExams: activityRes.status === 'fulfilled' ? activityRes.value.started : null,
      submissionsToday: activityRes.status === 'fulfilled' ? activityRes.value.completed : null,
    },
    sources: {
      metrics: metricsRes.status === 'fulfilled' ? 'ok' : 'failed',
      queue: queueRes.status === 'fulfilled' ? 'ok' : 'failed',
      security: securityRes.status === 'fulfilled' ? 'ok' : 'failed',
      activity: activityRes.status === 'fulfilled' ? 'ok' : 'failed',
    },
  };

  // Check if any source failed
  if (Object.values(response.sources).includes('failed')) {
    response.status = 'degraded';
  }

  return NextResponse.json(response);
}
