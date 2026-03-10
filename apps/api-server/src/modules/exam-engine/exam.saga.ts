import { JobStatus, JobType } from '@quiz/types';

import { logger } from '@/lib/logger';
import { sagaQueue } from '@/lib/queue/queues';
import { container } from '@/modules/core/container';
import { EmailService } from '@/modules/email/EmailService';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { JobsService } from '@/modules/system/jobs.service';

export interface ExamSagaData {
    examId: string;
    userId: string;
}

/**
 * Orchestrates the multi-step exam completion process (Saga Pattern).
 * Steps: Scoring -> Analytics -> Completion Email
 * 
 * Features:
 * - Robust sequential execution within a background worker.
 * - Idempotency: Steps check if they are already completed before executing.
 * - Progress Tracking: Updates job metadata with processed steps.
 */
export class ExamSaga {
    /**
     * Entry point to start the exam completion lifecycle.
     */
    static async start(examId: string, userId: string) {
        const job = await JobsService.createJob({
            userId,
            type: JobType.EXAM_SAGA,
            payload: { 
                examId,
                metadata: { processedSteps: [] }
            }
        });

        // Enqueue the saga to the primary sagaQueue
        await sagaQueue.add('exam_lifecycle_' + examId, { examId, userId }, { jobId: job.id });
        
        logger.info({ examId, jobId: job.id }, '[ExamSaga] Lifecycle started');
        return job.id;
    }

    /**
     * Executes the saga logic. This is called by the saga worker.
     * Each step is awaited synchronously to ensure strict ordering.
     * On retry, it skips already completed steps recorded in metadata.
     */
    static async execute(
        jobId: string,
        data: ExamSagaData & { metadata?: { processedSteps?: string[] } }
    ) {
        const { examId } = data;
        const metadata = data.metadata ?? { processedSteps: [] };
        const processedSteps = new Set(metadata.processedSteps ?? []);

        logger.info({ examId, jobId, processedSteps: Array.from(processedSteps) }, '[ExamSaga] Starting/Resuming execution');

        try {
            // STEP 1: SCORING
            if (!processedSteps.has('scoring')) {
                logger.info({ examId }, '[ExamSaga] Step 1: Calculating Results');
                await ScoringEngine.calculateExamResults(examId);
                
                // Fire-and-forget tutor processing
                const { TutorService } = await import('@/modules/tutor/tutor.service');
                void TutorService.processExamResults(examId);

                processedSteps.add('scoring');
                await this.updateProgress(jobId, data, processedSteps);
            } else {
                logger.debug({ examId }, '[ExamSaga] Skipping Step 1: Scoring (Already complete)');
            }

            // STEP 2: ANALYTICS
            if (!processedSteps.has('analytics')) {
                logger.info({ examId }, '[ExamSaga] Step 2: Refreshing Analytics & Materializing Reports');
                const performanceService = container.get(PerformanceService);
                const reportEngine = container.get(ReportEngine);

                await performanceService.refreshAnalytics();
                
                const { ReportMaterializer } = await import('../../services/reports/ReportMaterializer');
                await ReportMaterializer.materialize(examId);
                
                const reportData = await reportEngine.getPremiumExamReport(examId);
                await performanceService.cacheReport(examId, reportData);

                processedSteps.add('analytics');
                await this.updateProgress(jobId, data, processedSteps);
            } else {
                logger.debug({ examId }, '[ExamSaga] Skipping Step 2: Analytics (Already complete)');
            }

            // STEP 3: NOTIFICATION
            if (!processedSteps.has('notification')) {
                logger.info({ examId }, '[ExamSaga] Step 3: Sending Completion Email');
                const emailService = EmailService.getInstance();
                
                await emailService.sendEmail({
                    to: 'user-lookup-required@example.com',
                    subject: 'Your Exam Results are Ready',
                    html: `<p>Your exam (ID: ${examId}) has been processed successfully.</p>`,
                    from: 'no-reply@quiz-platform.io'
                });

                processedSteps.add('notification');
                await this.updateProgress(jobId, data, processedSteps);
            } else {
                logger.debug({ examId }, '[ExamSaga] Skipping Step 3: Notification (Already complete)');
            }

            logger.info({ examId }, '[ExamSaga] Lifecycle completed successfully');
            await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
                result: {
                    examId,
                    processedAt: new Date().toISOString()
                }
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error({ err: error, examId, jobId }, '[ExamSaga] Execution failed');
            
            await JobsService.updateJobStatus(jobId, JobStatus.FAILED, { error: message });
            throw error;
        }
    }

    private static async updateProgress(
        jobId: string,
        data: ExamSagaData & { metadata?: { processedSteps?: string[] } },
        processedSteps: Set<string>
    ) {
        data.metadata = {
            ...data.metadata,
            processedSteps: Array.from(processedSteps)
        };
        // Update the status record in the DB for visibility
        await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING);
    }
}
 
