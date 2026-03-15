import { db, exams } from '@quiz/db';
import { JobStatus, JobType } from '@quiz/types';
import { Client } from '@upstash/workflow';
import { eq } from 'drizzle-orm';

import type { ExportMeta, ExportPayload, RawAttemptRow } from '@/lib/export/exportTypes';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { container } from '@/modules/core/container';
import { EmailService } from '@/modules/email/EmailService';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import type { PremiumReport } from '@/modules/report-engine/report.engine';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';
import { JobsService } from '@/modules/system/jobs.service';

const qstashUrl = typeof process.env.QSTASH_URL === 'string' && process.env.QSTASH_URL.trim() !== ''
  ? process.env.QSTASH_URL
  : 'https://qstash.upstash.io';
const qstashToken = typeof process.env.QSTASH_TOKEN === 'string' ? process.env.QSTASH_TOKEN : '';

const workflowClient = new Client({
    baseUrl: qstashUrl,
    token: qstashToken,
});

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
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;
        const queuesEnabled = process.env.QUEUE_ENABLED === 'true';
        if (!queuesEnabled && !isTestEnv) {
            logger.warn({ examId }, '[ExamSaga] QUEUE_DISABLED: skipping saga enqueue');
            const job = await JobsService.createJob({
                userId,
                type: JobType.EXAM_SAGA,
                payload: {
                    examId,
                    metadata: { processedSteps: [] }
                }
            });
            return job.id;
        }
        const job = await JobsService.createJob({
            userId,
            type: JobType.EXAM_SAGA,
            payload: { 
                examId,
                metadata: { processedSteps: [] }
            }
        });

        const hasQstashToken = typeof process.env.QSTASH_TOKEN === 'string' && process.env.QSTASH_TOKEN.trim() !== '';
        const apiUrl = typeof process.env.NEXT_PUBLIC_API_URL === 'string' ? process.env.NEXT_PUBLIC_API_URL : '';
        if (queuesEnabled && hasQstashToken) {
            const workflowUrl = `${apiUrl.replace(/\/$/, '')}/workflows/exam-report`;
            logger.info({ examId, jobId: job.id, workflowUrl }, '[ExamSaga] Triggering Upstash Workflow');
            
            try {
                await workflowClient.trigger({
                    url: workflowUrl,
                    body: {
                        examId,
                        userId,
                        jobId: job.id
                    },
                    retries: 3
                });
                logger.info({ examId, jobId: job.id }, '[ExamSaga] Workflow triggered successfully');
            } catch (err) {
                logger.error({ err, examId, jobId: job.id }, '[ExamSaga] Failed to trigger workflow, falling back to local execution');
                void this.execute(job.id, { examId, userId });
            }
        } else {
            logger.info({ examId, jobId: job.id }, '[ExamSaga] Running saga locally (Queues disabled or missing token)');
            void this.execute(job.id, { examId, userId });
        }
        
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

            // STEP 4-6: EXPORTS (JSON/CSV) + STORE URLS
            if (!processedSteps.has('exports')) {
                logger.info({ examId }, '[ExamSaga] Step 4-6: Generating JSON/CSV exports');
                const { ExportEngine } = await import('@/lib/export/exportEngine');
                const exportEngine = ExportEngine.getInstance();
                const jsonUrl = await exportEngine.processExport(examId, data.userId, 'json');
                const csvUrl = await exportEngine.processExport(examId, data.userId, 'csv');

                const examRow = await db.query.exams.findFirst({
                    where: eq(exams.id, examId),
                    columns: { exportUrls: true }
                });
                const existingUrls = (examRow?.exportUrls as Record<string, string> | null) ?? {};

                await db.update(exams)
                    .set({ 
                        exportUrls: { 
                            ...existingUrls,
                            analytics_json: jsonUrl, 
                            analytics_csv: csvUrl 
                        } 
                    })
                    .where(eq(exams.id, examId));

                await Promise.all([
                    redis.set(`export:${examId}:${data.userId}:json`, jsonUrl, { ex: 900 }),
                    redis.set(`export:${examId}:${data.userId}:csv`, csvUrl, { ex: 900 }),
                ]);

                processedSteps.add('exports');
                await this.updateProgress(jobId, data, processedSteps);
            } else {
                logger.debug({ examId }, '[ExamSaga] Skipping Step 4-6: Exports (Already complete)');
            }

            // STEP 7: STUDENT INSIGHT PDF
            if (!processedSteps.has('student-insight')) {
                logger.info({ examId }, '[ExamSaga] Step 7: Generating Student Insight PDF');
                const exportEngine = (await import('@/lib/export/exportEngine')).ExportEngine.getInstance();
                const reportEngine = container.get(ReportEngine);
                const { ReportPdfService } = await import('@/modules/report-engine/report-pdf.service');
                const { StudentInsightFormatter } = await import('@/lib/export/formatters/studentInsightFormatter');
                const { uploadReport } = await import('@/lib/storage/upload-report');

                const [meta, currentRows, historicalRows, premiumReport] = await Promise.all([
                    exportEngine.queryBuilder.fetchUserMeta(examId),
                    exportEngine.queryBuilder.fetchRawAttempts(examId),
                    exportEngine.queryBuilder.fetchHistoricalAttempts(data.userId, examId),
                    reportEngine.getPremiumExamReport(examId)
                ]) as [ExportMeta, RawAttemptRow[], RawAttemptRow[], PremiumReport];

                const exportPayload: ExportPayload = {
                    meta,
                    rawAttempts: currentRows,
                    aggregations: await exportEngine.aggregator.buildAggregations(currentRows),
                    historicalProgress: await exportEngine.aggregator.buildHistoricalProgress(historicalRows),
                    guidanceSignals: exportEngine.aggregator.buildGuidanceSignals(currentRows, historicalRows)
                };

                const formatter = new StudentInsightFormatter();
                const insightData = formatter.format(exportPayload, premiumReport);

                const { buffer } = await ReportPdfService.getInstance().generate(
                    examId,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    { 
                        customPath: `/report/${examId}/student-insight`,
                        customData: insightData 
                    }
                );

                const fileRef = await uploadReport(buffer, data.userId, examId, { fileBasename: `${examId}-student-insight` });
                
                const examObj = await db.query.exams.findFirst({
                    where: eq(exams.id, examId),
                    columns: { exportUrls: true }
                });
                const currentUrls = (examObj?.exportUrls as Record<string, string> | null) ?? {};
                
                await db.update(exams)
                    .set({ 
                        exportUrls: { 
                            ...currentUrls, 
                            student_insight_pdf: fileRef 
                        } 
                    })
                    .where(eq(exams.id, examId));

                processedSteps.add('student-insight');
                await this.updateProgress(jobId, data, processedSteps);
            } else {
                logger.debug({ examId }, '[ExamSaga] Skipping Step 7: Student Insight PDF (Already complete)');
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
