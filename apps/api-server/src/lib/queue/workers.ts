import { Processor, Worker, WorkerOptions } from 'bullmq';

import { logger } from '../logger';
import { BULLMQ_CONNECTION } from './queue.config';

// Store all active workers for graceful shutdown
const activeWorkers: Worker[] = [];

/**
 * Creates and registers a new robust BullMQ Worker for the given queue name.
 * Default settings apply concurrency controls and exponential backoff retry.
 * 
 * @param queueName Target queue (e.g., 'scoringQueue')
 * @param processor Callback to process the job payload
 * @param options Additional worker options (overrides defaults)
 */
export function createWorker<TMessage, TResult>(
  queueName: string,
  processor: Processor<TMessage, TResult>,
  options?: Partial<WorkerOptions>
): Worker<TMessage, TResult> {
  const mergedOptions: WorkerOptions = {
    ...BULLMQ_CONNECTION,
    concurrency: 5, // Process up to 5 jobs at once by default
    limiter: {
      max: 1000,
      duration: 5000,
    },
    ...options,
  };

  const worker = new Worker<TMessage, TResult>(queueName, processor, mergedOptions);

  worker.on('active', (job) => {
    logger.debug({ jobId: job.id, queue: queueName }, 'Job started processing');
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, queue: queueName, result }, 'Job completed successfully');
  });

  worker.on('failed', (job, err) => {
    void (async () => {
      if (!job) return;

      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts ?? 1;

      logger.error({
        jobId: job.id,
        queue: queueName,
        error: err.message,
        attemptsMade,
        maxAttempts
      }, 'Job failed');

      const payload = job.data as unknown;
      if (payload !== null && typeof payload === 'object') {
         (payload as Record<string, unknown>).metadata = {
           ...(payload as Record<string, unknown>).metadata as Record<string, unknown> ?? {},
           retryCount: attemptsMade,
           lastError: err.message
         };
         try {
           await job.updateData(payload as TMessage);
         } catch (updateErr) {
           logger.error({ updateErr, jobId: job.id }, 'Failed to update job metadata on failure');
         }
      }

      if (attemptsMade >= maxAttempts) {
         try {
           const { deadLetterQueue } = await import('./queues');
           await deadLetterQueue.add(`dead_${job.id ?? Date.now()}`, {
              originalQueue: queueName,
              originalJobId: job.id,
              data: job.data,
              failedReason: err.message,
              failedAt: new Date().toISOString()
           });
           logger.warn({ jobId: job.id, queue: queueName }, 'Job moved to Dead Letter Queue');
         } catch (dlqErr) {
           logger.error({ dlqErr, jobId: job.id }, 'Failed to move job to DLQ');
         }
      }
    })();
  });

  worker.on('error', (err) => {
    // Network errors or internal Redis client drops
    logger.error({ error: err }, `Worker error on [${queueName}]`);
  });

  activeWorkers.push(worker);
  return worker;
}

/**
 * Safely tear down all active workers (for SIGTERM / SIGINT)
 */
export async function gracefulShutdownWorkers() {
  logger.info(`Initiating graceful shutdown of ${activeWorkers.length} active workers...`);
  
  const closePromises = activeWorkers.map(async (worker) => {
    try {
      await worker.close();
      logger.info(`Worker for ${worker.name} closed.`);
    } catch (err) {
      logger.error({ err }, `Failed to cleanly close worker for ${worker.name}`);
    }
  });

  await Promise.all(closePromises);
  logger.info('All workers shutdown successfully.');
}

// Attach listeners for server shutdown
process.on('SIGTERM', () => { void gracefulShutdownWorkers(); });
process.on('SIGINT', () => { void gracefulShutdownWorkers(); });
