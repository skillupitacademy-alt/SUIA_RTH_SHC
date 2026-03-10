import { JobType } from '@quiz/types';

import { JobOrchestrator } from '@/modules/system/job-orchestrator';

import { logger } from '../../logger';
import { AnalyticsJobPayload } from '../job-types';
import { createWorker } from '../workers';

/**
 * BullMQ Worker for processing intensive analytics and report materialization.
 */
export const analyticsWorker = createWorker<AnalyticsJobPayload, void>(
  'analyticsQueue',
  async (job) => {
    const { examId, processingType } = job.data;
    logger.info({ examId, processingType, jobId: job.id }, '[AnalyticsWorker] Processing analytics job');

    try {
        await JobOrchestrator.runJobDirectly(
            JobType.ANALYTICS_PROCESS,
            { type: processingType, examId },
            'system'
        );
    } catch (error) {
      logger.error({ examId, error }, '[AnalyticsWorker] Failed to process analytics');
      throw error;
    }
  }
);
