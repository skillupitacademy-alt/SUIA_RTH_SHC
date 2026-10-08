import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const envBackup = { ...process.env };

vi.mock('../jobs.service', () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
  },
}));
vi.mock('@/modules/core/resilience.manager', () => ({
  resilienceManager: { isHighLoad: vi.fn().mockReturnValue(false) },
}));
vi.mock('@/modules/analytics/analytics.service', () => ({
  AnalyticsService: { refreshAllViews: vi.fn() },
}));
vi.mock('@/modules/scoring-engine/scoring.engine', () => ({
  ScoringEngine: { calculateExamResults: vi.fn().mockResolvedValue(10) },
}));
vi.mock('@/modules/tutor/tutor.service', () => ({
  TutorService: { processExamResults: vi.fn() },
}));

describe('JobOrchestrator guard branches', () => {
  beforeEach(() => {
    process.env = { ...envBackup, NODE_ENV: 'production' };
  });
  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('processOnce no-ops when NODE_ENV is not test (lines 15-16)', async () => {
    const { JobOrchestrator } = await import('../job-orchestrator');
    const res = await JobOrchestrator.processOnce('job1', 'user1');
    expect(res).toBeUndefined(); // returns early without throwing
  });
});
