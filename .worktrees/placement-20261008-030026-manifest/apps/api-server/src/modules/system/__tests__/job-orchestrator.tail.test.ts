import { describe, it, expect, vi } from 'vitest';
import { JobOrchestrator } from '../job-orchestrator';
import { JobsService } from '../jobs.service';
import { resilienceManager } from '@/modules/core/resilience.manager';
import { JobType, JobStatus } from '@quiz/types';

vi.mock('../jobs.service', () => ({
  JobsService: {
    getJob: vi.fn(),
    updateJobStatus: vi.fn().mockResolvedValue(undefined),
    simulateJob: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/modules/core/resilience.manager', () => ({
  resilienceManager: { isHighLoad: vi.fn().mockReturnValue(false) },
}));

describe('JobOrchestrator tail branches', () => {
  it('returns on job not found', async () => {
    vi.mocked(JobsService.getJob).mockResolvedValue(undefined);
    await JobOrchestrator.runJob('missing', 'u1');
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });

  it('skips non-pending job', async () => {
    vi.mocked(JobsService.getJob).mockResolvedValue({ status: 'completed' } as any);
    await JobOrchestrator.runJob('done', 'u1');
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });

  it('drops analytics job under high load', async () => {
    vi.mocked(resilienceManager.isHighLoad).mockReturnValue(true);
    vi.mocked(JobsService.getJob).mockResolvedValue({ status: 'pending', type: JobType.ANALYTICS_REFRESH } as any);
    await JobOrchestrator.runJob('j1', 'u1');
    expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j1', JobStatus.FAILED, expect.any(Object));
  });

  it('fails unknown job type', async () => {
    vi.mocked(resilienceManager.isHighLoad).mockReturnValue(false);
    vi.mocked(JobsService.getJob).mockResolvedValue({ status: 'pending', type: 'WEIRD' } as any);
    await JobOrchestrator.runJob('j2', 'u1');
    expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j2', JobStatus.FAILED, expect.any(Object));
  });
});
