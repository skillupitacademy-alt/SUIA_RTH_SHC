import { db } from '@quiz/db';
import { JobStatus, JobType } from '@quiz/types';
import { sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { JobsService } from '@/modules/system/jobs.service';

export class JobOrchestrator {
    private static log = logger.child({ module: 'system:job-orchestrator' });

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
                case JobType.MOCK_JOB:
                    await JobsService.simulateJob(jobId, userId);
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
            await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_mastery_matrix`);
            await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_daily_snapshots`);

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
}
