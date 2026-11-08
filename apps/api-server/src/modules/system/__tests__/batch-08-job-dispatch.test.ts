import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobType } from '@quiz/types';
import { JobsService } from '@/modules/system/jobs.service';
import { ExportSaga } from '@/lib/export/export.saga';
import { JobOrchestrator } from '../job-orchestrator';

vi.mock('@/modules/system/jobs.service', () => ({ JobsService: { getJob: vi.fn(), updateJobStatus: vi.fn() } }));
vi.mock('@/modules/core/resilience.manager', () => ({ resilienceManager: { isHighLoad: () => false } }));
vi.mock('@/lib/export/export.saga', () => ({ ExportSaga: { execute: vi.fn() } }));

describe('stored export job dispatch boundary', () => {
  beforeEach(() => vi.clearAllMocks());
  it('dispatches stored exam and format with the caller subject, ignoring a conflicting payload subject', async () => {
    vi.mocked(JobsService.getJob).mockResolvedValue({ status: 'pending', type: JobType.EXPORT_SAGA,
      payload: { examId: 'exam-1', format: 'json', userId: 'different-subject' } } as never);
    await JobOrchestrator.runJob('job-1', 'owner');
    expect(JobsService.getJob).toHaveBeenCalledExactlyOnceWith('job-1', 'owner');
    expect(JobsService.updateJobStatus).toHaveBeenCalledTimes(1);
    expect(ExportSaga.execute).toHaveBeenCalledExactlyOnceWith('job-1', { examId: 'exam-1', format: 'json', userId: 'owner' });
  });
  it('does not dispatch when the job lookup rejects the caller', async () => {
    vi.mocked(JobsService.getJob).mockResolvedValue(undefined);
    await JobOrchestrator.runJob('job-1', 'other');
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
    expect(ExportSaga.execute).not.toHaveBeenCalled();
  });
});
