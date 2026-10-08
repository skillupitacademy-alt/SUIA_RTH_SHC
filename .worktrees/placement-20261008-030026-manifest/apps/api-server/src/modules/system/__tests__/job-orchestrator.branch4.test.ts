import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobStatus, JobType } from '@quiz/types';

vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }) },
}));

vi.mock('../jobs.service', () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
    simulateJob: vi.fn(),
  },
}));

vi.mock('@/modules/analytics/analytics.service', () => ({
  AnalyticsService: {
    refreshAllViews: vi.fn(),
  },
}));

vi.mock('@/modules/scoring-engine/scoring.engine', () => ({
  ScoringEngine: { calculateExamResults: vi.fn() },
}));

vi.mock('@/modules/tutor/tutor.service', () => ({
  TutorService: { processExamResults: vi.fn() },
}));

vi.mock('@/modules/core/resilience.manager', () => ({
  resilienceManager: { isHighLoad: vi.fn(() => false) },
}));

import { JobOrchestrator } from '../job-orchestrator';

describe('JobOrchestrator branches (high-level)', () => {
  let JobsService: any;
  let resilienceManager: any;
  let AnalyticsService: any;

  beforeEach(async () => {
    ({ JobsService } = await import('../jobs.service'));
    ({ resilienceManager } = await import('@/modules/core/resilience.manager'));
    ({ AnalyticsService } = await import('@/modules/analytics/analytics.service'));
    vi.clearAllMocks();
    resilienceManager.isHighLoad.mockReturnValue(false);
  });

  it('returns early when job not found', async () => {
    JobsService.getJob.mockResolvedValueOnce(undefined);
    await JobOrchestrator.runJob('missing', 'u1');
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });

  it('returns early when job already non-pending', async () => {
    JobsService.getJob.mockResolvedValueOnce({ id: 'j1', status: 'completed', type: JobType.EXAM_SCORING });
    await JobOrchestrator.runJob('j1', 'u1');
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });

  it('drops analytics job during high load and marks FAILED with message', async () => {
    resilienceManager.isHighLoad.mockReturnValue(true);
    JobsService.getJob.mockResolvedValueOnce({ id: 'j2', status: 'pending', type: JobType.ANALYTICS_REFRESH });

    await JobOrchestrator.runJob('j2', 'u1');

    expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
      'j2',
      JobStatus.FAILED,
      expect.objectContaining({ error: expect.stringContaining('heavy load') }),
    );
    expect(AnalyticsService.refreshAllViews).not.toHaveBeenCalled();
  });

  it('handles unknown job type by marking failed', async () => {
    JobsService.getJob.mockResolvedValueOnce({ id: 'j3', status: 'pending', type: 'WEIRD' });
    await JobOrchestrator.runJob('j3', 'u1');
    expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
      'j3',
      JobStatus.FAILED,
      expect.objectContaining({ error: expect.stringContaining('Unknown') }),
    );
  });
});
