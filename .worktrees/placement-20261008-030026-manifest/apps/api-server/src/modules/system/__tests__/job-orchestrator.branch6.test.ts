import { describe, it, expect, vi } from 'vitest';
import { JobStatus, JobType } from '@quiz/types';

const jobs = {
  getJob: vi.fn(),
  updateJobStatus: vi.fn(),
  simulateJob: vi.fn(),
};
const resilience = { isHighLoad: vi.fn().mockReturnValue(true) };

vi.mock('../jobs.service', () => ({ JobsService: jobs }));
vi.mock('@/modules/core/resilience.manager', () => ({ resilienceManager: resilience }));
vi.mock('@/modules/analytics/analytics.service', () => ({ AnalyticsService: { refreshAllViews: vi.fn() } }));
vi.mock('@/modules/scoring-engine/scoring.engine', () => ({ ScoringEngine: { calculateExamResults: vi.fn() } }));
vi.mock('@/modules/tutor/tutor.service', () => ({ TutorService: { processExamResults: vi.fn() } }));

describe('JobOrchestrator late branches', () => {
  it('drops analytics job under high load (lines 56-57,96-114)', async () => {
    jobs.getJob.mockResolvedValue({
      id: 'j1',
      userId: 'u1',
      status: JobStatus.PENDING,
      type: JobType.ANALYTICS_REFRESH,
      payload: {},
    });
    const { JobOrchestrator } = await import('../job-orchestrator');
    await JobOrchestrator.runJob('j1', 'u1');
    expect(jobs.updateJobStatus).toHaveBeenCalledWith(
      'j1',
      JobStatus.FAILED,
      expect.objectContaining({ error: expect.stringContaining('load') }),
    );
  });
});
