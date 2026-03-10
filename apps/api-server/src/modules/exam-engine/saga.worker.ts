import { logger } from '@/lib/logger';
import { createWorker } from '@/lib/queue/workers';

import { ExamSaga, ExamSagaData } from './exam.saga';

/**
 * Worker for processing the Exam Lifecycle Saga (Task 111).
 * Standardized to use the lib/queue/workers utility.
 */
export const sagaWorker = createWorker<ExamSagaData, void>(
    'sagaQueue',
    async (job) => {
        const { jobId } = job.opts;
        // In BullMQ, the jobId can be passed in options or auto-generated.
        // If we enqueued it from ExamSaga.start, it matches the DB jobId.
        if (jobId == null || jobId === '') {
             throw new Error('Job ID missing in saga job options');
        }
        
        await ExamSaga.execute(jobId as string, job.data);
    }
);

logger.info('[SagaWorker] Registered and active');
