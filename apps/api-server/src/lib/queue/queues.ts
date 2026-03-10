import { Queue } from 'bullmq';

import { logger } from '../logger';
import {
  AnalyticsJobPayload,
  CleanupJobPayload,
  EmailJobPayload,
  ExamSagaPayload,
  NotificationJobPayload,
  ScoringJobPayload
} from './job-types';
import { BULLMQ_CONNECTION, QUEUE_ENABLED } from './queue.config';

export interface DeadLetterPayload {
  originalQueue: string;
  originalJobId?: string;
  data: unknown;
  failedReason: string;
  failedAt: string;
}

function makeQueue<T>(name: string) {
  if (!QUEUE_ENABLED) {
    // Lightweight stub that never connects; callers should guard on QUEUE_ENABLED
    return {
      name,
      add: async () => { throw new Error('Queues are disabled'); },
      getJobCounts: async () => ({ wait: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 }),
      getFailed: async () => [],
      client: Promise.resolve({ ping: async () => 'QUEUES_DISABLED' } as unknown),
    } as unknown as Queue<T>;
  }
  return new Queue<T>(name, BULLMQ_CONNECTION);
}

// Exported Queue Instances (real when enabled, stub otherwise)
export const scoringQueue = makeQueue<ScoringJobPayload>('scoringQueue');
export const emailQueue = makeQueue<EmailJobPayload>('emailQueue');
export const cleanupQueue = makeQueue<CleanupJobPayload>('cleanupQueue');
export const notificationQueue = makeQueue<NotificationJobPayload>('notificationQueue');
export const analyticsQueue = makeQueue<AnalyticsJobPayload>('analyticsQueue');
export const sagaQueue = makeQueue<ExamSagaPayload>('sagaQueue');
export const deadLetterQueue = makeQueue<DeadLetterPayload>('deadLetterQueue');

/**
 * Ensures all primary queues are registered and ready.
 * Validates connection without crashing the app.
 */
export async function registerQueues() {
  if (!QUEUE_ENABLED) {
    logger.info('Queues disabled via QUEUE_ENABLED=false. Skipping registration.');
    return;
  }

  try {
    const sClient = await scoringQueue.client;
    await sClient.ping();
    logger.info('BullMQ scoringQueue connected to Redis');

    // Check connections for other queues
    await emailQueue.client.then(c => c.ping());
    await notificationQueue.client.then(c => c.ping());
    await analyticsQueue.client.then(c => c.ping());
    await sagaQueue.client.then(c => c.ping());
    await deadLetterQueue.client.then(c => c.ping());
    await cleanupQueue.client.then(c => c.ping());

  } catch (error) {
    logger.error({ error }, 'Failed to initialize BullMQ. Ensure REDIS_URL is valid and accepts standard connections.');
  }
}
