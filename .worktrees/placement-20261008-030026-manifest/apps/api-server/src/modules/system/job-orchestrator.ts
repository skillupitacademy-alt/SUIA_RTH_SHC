import { JobStatus, JobType } from '@quiz/types';

import type { ExportFormat } from '@/lib/export/exportTypes';
import { logger } from '@/lib/logger';
import { EmailService } from '@/modules/email/EmailService';

type EmailJobPayload =
    | { type: 'password_reset'; email: string; data: { resetUrl: string } }
    | { type: 'generic'; email: string; data: { subject: string; html: string; from: string } };

type AnalyticsProcessPayload =
    | { type: 'post_exam_processing'; examId: string }
    | { type: 'daily_refresh'; examId?: string }
    | { type: 'refresh_views' };

type ExamSagaPayload = { examId: string; userId: string };
type ExportSagaPayload = { examId: string; format: ExportFormat };
type ExamScoringPayload = { examId: string };
type SemanticIndexPayload = { questionId: string; text: string; metadata?: Record<string, unknown> };

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
        const { JobsService } = await import('./jobs.service');
        const { resilienceManager } = await import('@/modules/core/resilience.manager');

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
                    await this.handleExamScoring(jobId, job.payload as ExamScoringPayload);
                    break;
                case JobType.ANALYTICS_REFRESH:
                    await this.handleAnalyticsRefresh(jobId);
                    break;
                case JobType.SEMANTIC_INDEXING:
                    await this.handleSemanticIndexing(jobId, job.payload as SemanticIndexPayload);
                    break;
                case JobType.MOCK_JOB:
                    await JobsService.simulateJob(jobId, userId);
                    break;
                case JobType.DATA_CLEANUP:
                    await this.handleDataCleanup(jobId);
                    break;
                case JobType.EMAIL_SEND:
                    await this.handleEmailSend(jobId, job.payload as EmailJobPayload);
                    break;
                case JobType.ANALYTICS_PROCESS:
                    await this.handleAnalyticsProcess(jobId, job.payload as AnalyticsProcessPayload);
                    break;
                case JobType.EXAM_SAGA:
                    await this.handleExamSaga(jobId, job.payload as ExamSagaPayload, userId);
                    break;
                case JobType.EXPORT_SAGA:
                    await this.handleExportSaga(jobId, job.payload as ExportSagaPayload, userId);
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

    private static async handleExamSaga(jobId: string, payload: ExamSagaPayload, userId: string): Promise<void> {
        const { ExamSaga } = await import('../exam-engine/exam.saga');
        await ExamSaga.execute(jobId, { examId: payload.examId, userId });
    }

    private static async handleExportSaga(jobId: string, payload: ExportSagaPayload, userId: string): Promise<void> {
        const { ExportSaga } = await import('@/lib/export/export.saga');
        await ExportSaga.execute(jobId, { examId: payload.examId, userId, format: payload.format });
    }

    /**
     * Executes the CORE logic of a job type without modifying the database job record.
     * This is used for internal orchestration (Sagas).
     */
    static async runJobDirectly(
        type: JobType | string,
        payload: AnalyticsProcessPayload | EmailJobPayload | ExamScoringPayload,
        userId: string
    ): Promise<void> {
        this.log.info({ type, userId }, '[JobOrchestrator] Running job logic directly');
        const jobId = 'direct-exec';
        const { AnalyticsService } = await import('@/modules/analytics/analytics.service');
        const { ScoringEngine } = await import('@/modules/scoring-engine/scoring.engine');
        const { TutorService } = await import('@/modules/tutor/tutor.service');

        switch (type) {
            case JobType.EXAM_SCORING: {
                const p = payload as ExamScoringPayload;
                await ScoringEngine.calculateExamResults(p.examId);
                void TutorService.processExamResults(p.examId);
                break;
            }
            case JobType.ANALYTICS_PROCESS: {
                const { PerformanceService } = await import('@/modules/report-engine/performance.service');
                const { ReportEngine } = await import('@/modules/report-engine/report.engine');
                const { container } = await import('@/modules/core/container');
                const p = payload as AnalyticsProcessPayload;
                if (p.type === 'post_exam_processing') {
                    const performanceService = container.get(PerformanceService);
                    const reportEngine = container.get(ReportEngine);
                    await performanceService.refreshAnalytics();
                    const { ReportMaterializer } = await import('../../services/reports/ReportMaterializer');
                    await ReportMaterializer.materialize(p.examId);
                    const reportData = await reportEngine.getPremiumExamReport(p.examId);
                    await performanceService.cacheReport(p.examId, reportData);
                } else {
                    await AnalyticsService.refreshAllViews();
                }
                break;
            }
            case JobType.EMAIL_SEND: {
                await this.handleEmailSend(jobId, payload as EmailJobPayload);
                break;
            }
            default:
                throw new Error(`Direct execution not implemented for type: ${type}`);
        }
    }

    private static async handleExamScoring(jobId: string, payload: { examId: string }): Promise<void> {
        if (payload.examId === undefined || payload.examId === null || payload.examId === '') throw new Error('Missing examId in payload');

        const { JobsService } = await import('./jobs.service');
        const { ScoringEngine } = await import('@/modules/scoring-engine/scoring.engine');
        const { TutorService } = await import('@/modules/tutor/tutor.service');

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
            const { JobsService } = await import('./jobs.service');
            const { AnalyticsService } = await import('@/modules/analytics/analytics.service');
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
        const { JobsService } = await import('./jobs.service');
        
        await SemanticSearchService.indexQuestion(payload.questionId, payload.text, payload.metadata || {});

        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: {
                indexedAt: new Date().toISOString()
            }
        });
    }

    private static async handleDataCleanup(jobId: string): Promise<void> {
        const { RetentionService } = await import('./retention.service');
        const { JobsService } = await import('./jobs.service');
        const results = await RetentionService.performCleanup();

        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: {
                ...results,
                timestamp: new Date().toISOString()
            }
        });
    }

    private static async handleEmailSend(jobId: string, payload: EmailJobPayload): Promise<void> {
        const { JobsService } = await import('./jobs.service');
        const { type, email, data } = payload;
        const provider = EmailService.getInstance();

        switch (type) {
            case 'password_reset':
                await provider.sendPasswordResetEmail(email, data.resetUrl);
                break;
            case 'generic':
                await provider.sendEmail({
                    to: email,
                    subject: data.subject,
                    html: data.html,
                    from: data.from,
                });
                break;
            default:
                throw new Error(`Unknown email job type: ${type}`);
        }

        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: { sentAt: new Date().toISOString() }
        });
    }

    private static async handleAnalyticsProcess(jobId: string, payload: AnalyticsProcessPayload): Promise<void> {
        const { AnalyticsService } = await import('@/modules/analytics/analytics.service');
        const { JobsService } = await import('./jobs.service');
        const { PerformanceService } = await import('@/modules/report-engine/performance.service');
        const { ReportEngine } = await import('@/modules/report-engine/report.engine');
        const { container } = await import('@/modules/core/container');
        const { type } = payload;
        const performanceService = container.get(PerformanceService);
        const reportEngine = container.get(ReportEngine);

        switch (type) {
            case 'post_exam_processing': {
                if (typeof payload.examId !== 'string' || payload.examId.trim() === '') throw new Error('examId is required');
                await performanceService.refreshAnalytics();
                const { ReportMaterializer } = await import('../../services/reports/ReportMaterializer');
                await ReportMaterializer.materialize(payload.examId);
                const reportData = await reportEngine.getPremiumExamReport(payload.examId);
                await performanceService.cacheReport(payload.examId, reportData);
                break;
            }
            case 'daily_refresh': {
                await performanceService.refreshAnalytics();
                break;
            }
            case 'refresh_views': {
                await AnalyticsService.refreshAllViews();
                break;
            }
            default:
                throw new Error(`Unknown analytics job type: ${type}`);
        }

        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: { processedAt: new Date().toISOString() }
        });
    }
}
