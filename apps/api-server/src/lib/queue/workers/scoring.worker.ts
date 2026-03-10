import { JobType } from '@quiz/types';

import { JobOrchestrator } from '@/modules/system/job-orchestrator';

import { logger } from '../../logger';
import { ScoringJobPayload } from '../job-types';
import { createWorker } from '../workers';

/**
 * BullMQ Worker for processing exam scoring.
 */
export const scoringWorker = createWorker<ScoringJobPayload, void>(
  'scoringQueue',
  async (job) => {
    const { examId } = job.data;
    logger.info({ examId, jobId: job.id }, '[ScoringWorker] Starting score calculation');

    try {
      await JobOrchestrator.runJobDirectly(
        JobType.EXAM_SCORING,
        { examId },
        'system'
      );
      logger.info({ examId }, '[ScoringWorker] Scoring complete');
    } catch (error) {
       logger.error({ examId, error }, '[ScoringWorker] Scoring failed');
       throw error;
    }
  }
);
