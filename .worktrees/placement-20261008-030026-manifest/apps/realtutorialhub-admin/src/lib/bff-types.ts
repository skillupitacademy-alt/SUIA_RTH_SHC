/**
 * Admin Dashboard BFF Response Contract
 */
export interface AdminDashboardSummary {
  status: 'healthy' | 'degraded';
  generatedAt: string; // ISO timestamp
  metrics: {
    totalUsers: number | null;
    totalQuestions: number | null;
    totalExams: number | null;
    totalBlueprints: number | null;
  };
  queue: {
    pendingJobs: number | null;
    failedJobs: number | null;
    isHealthy: boolean | null;
  };
  security: {
    activeSessions: number | null;
    recentAuthEvents: number | null;
  };
  activity: {
    activeExams: number | null;
    submissionsToday: number | null;
  };
  sources: {
    // which upstream calls succeeded
    metrics: 'ok' | 'failed';
    queue: 'ok' | 'failed';
    security: 'ok' | 'failed';
    activity: 'ok' | 'failed';
  };
}
