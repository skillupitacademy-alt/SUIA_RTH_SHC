import { JobStatus, JobType } from '@quiz/types';

import { logger } from '@/lib/logger';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { resilienceManager } from '@/modules/core/resilience.manager';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { JobsService } from '@/modules/system/jobs.service';
import { TutorService } from '@/modules/tutor/tutor.service';

export class JobOrchestrator {
    private static log = logger.child({ module: 'system:job-orchestrator' });

    // Test seam: allow single-iteration processing in tests without tight loop
    static async processOnce(jobId: string, userId: string) {
        if (process.env.NODE_ENV !== 'test') return;
        await this.runJob(jobId, userId);
    }

    /**
     * Executes a job based on its type.
     * This is intended to be called in a "fire-and-forget" manner from the API
     * or by a periodic worker.
     */
    static async runJob(jobId: string, userId: string): Promise<void> {
        const job = await JobsService.getJob(jobId, userId);
        if (job === undefined) {
            this.log.error({ jobId, userId }, 'Job not found');
            return;
        }

        if (job.status !== 'pending') {
            this.log.warn({ jobId, status: job.status }, 'Job already in terminal state');
            return;
        }

        // Phase 4 Resilience: Drop non-priority jobs during high load
        if (resilienceManager.isHighLoad() && job.type === JobType.ANALYTICS_REFRESH) {
            this.log.warn({ jobId, type: job.type }, '[Resilience] Dropping non-critical job due to high load');
            // We keep it pending to be picked up later or just fail it
            await JobsService.updateJobStatus(jobId, JobStatus.FAILED, {
                error: 'System under heavy load. Analytics refresh deferred.'
            });
            return;
        }

        try {
            // 1. Mark as processing
            await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING);

            // 2. Route based on type
            switch (job.type) {
                case JobType.EXAM_SCORING:
                    await this.handleExamScoring(jobId, job.payload as { examId: string });
                    break;
                case JobType.ANALYTICS_REFRESH:
                    await this.handleAnalyticsRefresh(jobId);
                    break;
                case JobType.SEMANTIC_INDEXING:
                    await this.handleSemanticIndexing(jobId, job.payload as { questionId: string; text: string; metadata?: Record<string, unknown> });
                    break;
                case JobType.MOCK_JOB:
                    await JobsService.simulateJob(jobId, userId);
                    break;
                case JobType.DATA_CLEANUP:
                    await this.handleDataCleanup(jobId);
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }
        } catch (err) {
            this.log.error(
                { jobId, error: err instanceof Error ? err.message : 'unknown error' },
                'Job failed',
            );
            await JobsService.updateJobStatus(jobId, JobStatus.FAILED, {
                error: err instanceof Error ? err.message : 'Unknown error during execution'
            });
        }
    }

    private static async handleExamScoring(jobId: string, payload: { examId: string }): Promise<void> {
        if (payload.examId === undefined || payload.examId === null || payload.examId === '') throw new Error('Missing examId in payload');

        const finalScore = await ScoringEngine.calculateExamResults(payload.examId);

        // Fire-and-forget tutor processing; do not block scoring completion
        void TutorService.processExamResults(payload.examId);
        
        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: {
                examId: payload.examId,
                finalScore,
                completedAt: new Date().toISOString()
            }
        });
    }

    private static async handleAnalyticsRefresh(jobId: string): Promise<void> {
        try {
            /** 
             * SQL Note: REFRESH MATERIALIZED VIEW CONCURRENTLY works 
             * without locking out readers, but requires a UNIQUE INDEX 
             * on the view. This is essential for Absolute Zero zero-downtime.
             */
            await AnalyticsService.refreshAllViews();

            await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
                result: {
                    refreshedAt: new Date().toISOString()
                }
            });
        } catch (err) {
            this.log.error(
                { jobId, error: err instanceof Error ? err.message : 'unknown error' },
                'Analytics refresh failed',
            );
            throw err;
        }
    }

    private static async handleSemanticIndexing(jobId: string, payload: { questionId: string; text: string; metadata?: Record<string, unknown> }): Promise<void> {
        if (!payload.questionId || !payload.text) throw new Error('Missing questionId or text in semantic indexing payload');

        this.log.info({ questionId: payload.questionId }, 'Starting semantic indexing');
        
        // Import dynamically to avoid potentially heavy modules and circular deps
        const { SemanticSearchService } = await import('@/modules/intelligence/semantic-search.service');
        
        await SemanticSearchService.indexQuestion(payload.questionId, payload.text, payload.metadata || {});

        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: {
                indexedAt: new Date().toISOString()
            }
        });
    }

    private static async handleDataCleanup(jobId: string): Promise<void> {
        const { RetentionService } = await import('./retention.service');
        const results = await RetentionService.performCleanup();

        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: {
                ...results,
                timestamp: new Date().toISOString()
            }
        });
    }
}
