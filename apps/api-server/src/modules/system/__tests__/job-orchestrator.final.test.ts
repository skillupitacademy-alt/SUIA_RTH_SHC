import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 1. Mocks at very top for hoisting
vi.mock('../jobs.service');
vi.mock('@/modules/analytics/analytics.service');
vi.mock('@/modules/core/resilience.manager');
vi.mock('@/modules/scoring-engine/scoring.engine');
vi.mock('@/modules/tutor/tutor.service');
vi.mock('@/modules/intelligence/semantic-search.service', () => ({
  SemanticSearchService: {
    indexQuestion: vi.fn(),
  },
}));
vi.mock('@/lib/logger', () => {
  const mockLog = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  mockLog.child.mockReturnValue(mockLog);
  return { logger: mockLog };
});

// 2. Imports after mocks
import { JobOrchestrator } from '../job-orchestrator';
import { JobsService } from '../jobs.service';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { resilienceManager } from '@/modules/core/resilience.manager';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { TutorService } from '@/modules/tutor/tutor.service';
import { SemanticSearchService } from '@/modules/intelligence/semantic-search.service';
import { JobStatus, JobType } from '@quiz/types';

describe('JobOrchestrator 100% Branch Coverage - FINAL BLITZ', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv, NODE_ENV: 'test' };
        vi.mocked(resilienceManager.isHighLoad).mockReturnValue(false);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('processOnce (Lines 15-17)', () => {
        it('returns early if not in test env (Line 15)', async () => {
            (process.env as any).NODE_ENV = 'production';
            const spyRun = vi.spyOn(JobOrchestrator, 'runJob').mockResolvedValue();
            await JobOrchestrator.processOnce('j', 'u');
            expect(spyRun).not.toHaveBeenCalled();
            spyRun.mockRestore();
        });

        it('calls runJob if in test env (Line 16)', async () => {
            const spyRun = vi.spyOn(JobOrchestrator, 'runJob').mockResolvedValue();
            await JobOrchestrator.processOnce('j', 'u');
            expect(spyRun).toHaveBeenCalled();
            spyRun.mockRestore();
        });
    });

    describe('runJob Core Logic (Lines 24-76)', () => {
        it('handles job not found (Line 27)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue(undefined);
            await JobOrchestrator.runJob('j', 'u');
            expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
        });

        it('handles non-pending job (Line 32)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ status: 'completed' } as any);
            await JobOrchestrator.runJob('j', 'u');
            expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
        });

        it('drops analytics refresh under high load (Lines 37-43)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.ANALYTICS_REFRESH, status: 'pending' } as any);
            vi.mocked(resilienceManager.isHighLoad).mockReturnValue(true);
            
            await JobOrchestrator.runJob('j', 'u');
            
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, expect.objectContaining({
                error: expect.stringContaining('heavy load')
            }));
        });

        it('throws on unknown job type (Line 65)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: 'UNKNOWN' as any, status: 'pending' } as any);
            await JobOrchestrator.runJob('j', 'u');
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, expect.objectContaining({
                error: 'Unknown job type: UNKNOWN'
            }));
        });

        it('handles non-Error objects in catch (Line 73)', async () => {
             vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.EXAM_SCORING, status: 'pending', payload: { examId: 'e1' } } as any);
             // handleExamScoring is private so we can't easily spy on it, but we can make ScoringEngine throw
             vi.mocked(ScoringEngine.calculateExamResults).mockRejectedValue('raw-string-fail');
             
             await JobOrchestrator.runJob('j', 'u');
             expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, {
                 error: 'Unknown error during execution'
             });
        });

        it('handles Error objects in catch (Line 73)', async () => {
             vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.EXAM_SCORING, status: 'pending', payload: { examId: 'e1' } } as any);
             vi.mocked(ScoringEngine.calculateExamResults).mockRejectedValue(new Error('real-error'));
             
             await JobOrchestrator.runJob('j', 'u');
             expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, {
                 error: 'real-error'
             });
        });
    });

    describe('handleAnalyticsRefresh (Lines 95-116)', () => {
        it('completes successfully', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.ANALYTICS_REFRESH, status: 'pending' } as any);
            vi.mocked(AnalyticsService.refreshAllViews).mockResolvedValue();
            
            await JobOrchestrator.runJob('j', 'u');
            
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.COMPLETED, expect.any(Object));
        });

        it('handles error and rethrows (Line 110-114)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.ANALYTICS_REFRESH, status: 'pending' } as any);
            vi.mocked(AnalyticsService.refreshAllViews).mockRejectedValue(new Error('refresh-failed'));
            
            await JobOrchestrator.runJob('j', 'u');
            
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, { error: 'refresh-failed' });
        });

        it('handles non-Error objects in inner catch (Line 111)', async () => {
            vi.mocked(AnalyticsService.refreshAllViews).mockRejectedValue('raw-fail');
            // We call it directly to hit specific lines if needed
            await expect((JobOrchestrator as any).handleAnalyticsRefresh('j')).rejects.toBe('raw-fail');
        });
    });

    describe('handleExamScoring (Lines 78-93)', () => {
        it('throws if examId missing (Line 79)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.EXAM_SCORING, status: 'pending', payload: { examId: '' } } as any);
            await JobOrchestrator.runJob('j', 'u');
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, { error: 'Missing examId in payload' });
        });

        it('completes and calls TutorService (Line 84)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.EXAM_SCORING, status: 'pending', payload: { examId: 'e1' } } as any);
            vi.mocked(ScoringEngine.calculateExamResults).mockResolvedValue(100);
            
            await JobOrchestrator.runJob('j', 'u');
            
            expect(TutorService.processExamResults).toHaveBeenCalledWith('e1');
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.COMPLETED, expect.objectContaining({
                result: expect.objectContaining({ finalScore: 100 })
            }));
        });
    });

    describe('handleSemanticIndexing (Lines 118-133)', () => {
        it('throws if missing questionId/text (Line 119)', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.SEMANTIC_INDEXING, status: 'pending', payload: { } } as any);
            await JobOrchestrator.runJob('j', 'u');
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.FAILED, { error: 'Missing questionId or text in semantic indexing payload' });
        });

        it('completes semantic indexing', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ 
                id: 'j', 
                type: JobType.SEMANTIC_INDEXING, 
                status: 'pending', 
                payload: { questionId: 'q1', text: 'hello' } 
            } as any);

            vi.mocked(SemanticSearchService.indexQuestion).mockResolvedValue(undefined);
            
            await JobOrchestrator.runJob('j', 'u');
            
            expect(SemanticSearchService.indexQuestion).toHaveBeenCalledWith('q1', 'hello', {});
            expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j', JobStatus.COMPLETED, expect.any(Object));
        });
    });

    describe('Mock Job (Line 61)', () => {
        it('routes to simulateJob', async () => {
            vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j', type: JobType.MOCK_JOB, status: 'pending' } as any);
            await JobOrchestrator.runJob('j', 'u');
            expect(JobsService.simulateJob).toHaveBeenCalledWith('j', 'u');
        });
    });
});
