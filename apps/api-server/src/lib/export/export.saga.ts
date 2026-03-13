import { JobStatus, JobType } from '@quiz/types';
import { Client } from '@upstash/workflow';

import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { logger } from '@/lib/logger';
import { JobsService } from '@/modules/system/jobs.service';

import { ExportEngine } from './exportEngine';
import type { ExportFormat } from './exportTypes';

const qstashUrl = typeof process.env.QSTASH_URL === 'string' && process.env.QSTASH_URL.trim() !== ''
  ? process.env.QSTASH_URL
  : 'https://qstash.upstash.io';
const qstashToken = typeof process.env.QSTASH_TOKEN === 'string' ? process.env.QSTASH_TOKEN : '';

const workflowClient = new Client({
    baseUrl: qstashUrl,
    token: qstashToken,
});

export interface ExportSagaData {
    examId: string;
    userId: string;
    format: ExportFormat;
}

export class ExportSaga {
    static async start(examId: string, userId: string, format: ExportFormat) {
        const queuesEnabled = process.env.QUEUE_ENABLED === 'true';
        
        const job = await JobsService.createJob({
            userId,
            type: JobType.EXPORT_SAGA,
            payload: { 
                examId,
                format,
                metadata: { processedSteps: [] }
            }
        });

        const hasQstashToken = typeof process.env.QSTASH_TOKEN === 'string' && process.env.QSTASH_TOKEN.trim() !== '';
        const apiUrl = typeof process.env.NEXT_PUBLIC_API_URL === 'string' ? process.env.NEXT_PUBLIC_API_URL : '';
        
        if (queuesEnabled && hasQstashToken) {
            const workflowUrl = `${apiUrl.replace(/\/$/, '')}/api/export/workflow`;
            logger.info({ examId, jobId: job.id, workflowUrl }, '[ExportSaga] Triggering Upstash Workflow');
            
            try {
                await workflowClient.trigger({
                    url: workflowUrl,
                    body: {
                        examId,
                        userId,
                        format,
                        jobId: job.id
                    },
                    retries: 3
                });
                logger.info({ examId, jobId: job.id }, '[ExportSaga] Workflow triggered successfully');
            } catch (err) {
                logger.error({ err, examId, jobId: job.id }, '[ExportSaga] Failed to trigger workflow, falling back to local execution');
                void this.execute(job.id, { examId, userId, format });
            }
        } else {
            logger.info({ examId, jobId: job.id }, '[ExportSaga] Running export saga locally');
            void this.execute(job.id, { examId, userId, format });
        }
        
        return job.id;
    }

    static async execute(
        jobId: string,
        data: ExportSagaData
    ) {
        const { examId, userId, format } = data;
        logger.info({ examId, jobId, format }, '[ExportSaga] Starting execution');

        try {
            await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING);
            
            const exportEngine = ExportEngine.getInstance();
            const downloadUrl = await exportEngine.processExport(examId, userId, format);

            await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
                result: {
                    examId,
                    format,
                    downloadUrl,
                    completedAt: new Date().toISOString()
                }
            });

            void eventBus.emitEvent(AppEvents.EXPORT_COMPLETE, {
                examId,
                userId,
                format,
                downloadUrl,
                completedAt: new Date()
            });

            logger.info({ examId, jobId }, '[ExportSaga] Export completed successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error({ err: error, examId, jobId }, '[ExportSaga] Execution failed');
            
            await JobsService.updateJobStatus(jobId, JobStatus.FAILED, { error: message });
            throw error;
        }
    }
}
