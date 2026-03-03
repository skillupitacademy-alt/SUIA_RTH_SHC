import { describe, it, expect, vi } from 'vitest';
import { JobOrchestrator } from '../job-orchestrator';
import { JobStatus, JobType } from '@quiz/types';

// Mocks
vi.mock('../jobs.service', () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn().mockResolvedValue(undefined),
    simulateJob: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/modules/core/resilience.manager', () => ({
  resilienceManager: { isHighLoad: vi.fn() },
}));

vi.mock('@/modules/scoring-engine/scoring.engine', () => ({
  ScoringEngine: { calculateExamResults: vi.fn().mockResolvedValue(95) },
}));

vi.mock('@/modules/tutor/tutor.service', () => ({
  TutorService: { processExamResults: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/modules/analytics/analytics.service', () => ({
  AnalyticsService: { refreshAllViews: vi.fn().mockResolvedValue(undefined) },
}));

// dynamic import stub for semantic indexing
vi.mock('@/modules/intelligence/semantic-search.service', () => ({
  SemanticSearchService: { indexQuestion: vi.fn().mockResolvedValue(undefined) },
}));

const { JobsService } = await import('../jobs.service');
const { resilienceManager } = await import('@/modules/core/resilience.manager');

describe('JobOrchestrator branch coverage', () => {
  it('skips when job not found', async () => {
    vi.mocked(JobsService.getJob).mockResolvedValueOnce(undefined);
    await JobOrchestrator.runJob('missing', 'u1');
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });

  it('returns when job already terminal', async () => {
    vi.mocked(JobsService.getJob).mockResolvedValueOnce({ status: 'completed', type: JobType.EXAM_SCORING } as any);
    await JobOrchestrator.runJob('done', 'u1');
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });

  it('drops analytics job on high load', async () => {
    vi.mocked(resilienceManager.isHighLoad).mockReturnValueOnce(true);
    vi.mocked(JobsService.getJob).mockResolvedValueOnce({ id: 'j1', status: 'pending', type: JobType.ANALYTICS_REFRESH } as any);

    await JobOrchestrator.runJob('j1', 'u1');

    expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j1', JobStatus.FAILED, expect.objectContaining({
      error: expect.stringMatching(/heavy load/i),
    }));
  });

  it('handles semantic indexing branch', async () => {
    vi.mocked(resilienceManager.isHighLoad).mockReturnValueOnce(false);
    vi.mocked(JobsService.getJob).mockResolvedValueOnce({
      id: 'j2',
      status: 'pending',
      type: JobType.SEMANTIC_INDEXING,
      payload: { questionId: 'q1', text: 'hello' },
    } as any);

    await JobOrchestrator.runJob('j2', 'u1');

    expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j2', JobStatus.PROCESSING);
    expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j2', JobStatus.COMPLETED, expect.anything());
  });

  it('marks unknown job type as failed', async () => {
    vi.mocked(resilienceManager.isHighLoad).mockReturnValueOnce(false);
    vi.mocked(JobsService.getJob).mockResolvedValueOnce({
      id: 'j3',
      status: 'pending',
      type: 'weird' as any,
    });

    await JobOrchestrator.runJob('j3', 'u1');

    expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j3', JobStatus.PROCESSING);
    expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j3', JobStatus.FAILED, expect.objectContaining({
      error: expect.stringMatching(/Unknown job type/),
    }));
  });
});
