import { JobStatus, JobType } from '@quiz/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getJob = vi.fn();
const updateJobStatus = vi.fn();
const simulateJob = vi.fn();
const isHighLoad = vi.fn();

// Fix paths: JobOrchestrator is at ../job-orchestrator.ts
// It imports ./jobs.service which is ../jobs.service from here.
vi.mock('../jobs.service', () => ({
    JobsService: {
        getJob,
        updateJobStatus,
        simulateJob,
    },
}));

vi.mock('@/modules/core/resilience.manager', () => ({
    resilienceManager: {
        isHighLoad,
    },
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        child: () => ({
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
        }),
    },
}));

import { JobOrchestrator } from '../job-orchestrator';

describe('JobOrchestrator - Branch 7 (Resilience & Direct)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isHighLoad.mockReturnValue(false);
    });

    it('drops non-priority jobs during high load', async () => {
        isHighLoad.mockReturnValue(true);
        getJob.mockResolvedValue({
            id: 'job-1',
            type: JobType.ANALYTICS_REFRESH,
            status: 'pending',
        });

        await JobOrchestrator.runJob('job-1', 'user-1');

        expect(updateJobStatus).toHaveBeenCalledWith('job-1', JobStatus.FAILED, expect.objectContaining({
            error: expect.stringContaining('heavy load'),
        }));
    });

    it('throws error for unknown job type', async () => {
        getJob.mockResolvedValue({
            id: 'job-2',
            type: 'UNKNOWN_TYPE' as any,
            status: 'pending',
        });

        await JobOrchestrator.runJob('job-2', 'user-1');

        expect(updateJobStatus).toHaveBeenCalledWith('job-2', JobStatus.FAILED, expect.objectContaining({
            error: expect.stringContaining('Unknown job type'),
        }));
    });

    it('runJobDirectly throws for unhandled type', async () => {
        await expect(JobOrchestrator.runJobDirectly('FAKE_TYPE' as any, {} as any, 'user-1'))
            .rejects.toThrow('Direct execution not implemented');
    });

    it('returns early if job already terminal', async () => {
        getJob.mockResolvedValue({
            id: 'job-3',
            type: JobType.MOCK_JOB,
            status: JobStatus.COMPLETED,
        });

        await JobOrchestrator.runJob('job-3', 'user-1');
        expect(updateJobStatus).not.toHaveBeenCalled();
    });
    
    it('handles generic error during job execution', async () => {
      getJob.mockResolvedValue({
          id: 'job-err',
          type: JobType.MOCK_JOB,
          status: 'pending',
      });
      simulateJob.mockRejectedValueOnce(new Error('simulated failure'));

      await JobOrchestrator.runJob('job-err', 'user-1');
      
      expect(updateJobStatus).toHaveBeenCalledWith('job-err', JobStatus.FAILED, expect.objectContaining({
        error: 'simulated failure'
      }));
    });
});
