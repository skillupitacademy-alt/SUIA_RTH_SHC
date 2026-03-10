import { Job, Processor, Queue, type QueueOptions,Worker } from 'bullmq';

import { logger } from './logger';
import { bullConnection, defaultQueueOptions, queueConnection } from './queue-config';

const log = logger.child({ component: 'queue-factory' });
const queuesDisabled = process.env.QUEUE_ENABLED !== 'true';

/**
 * Factory for creating BullMQ Queues and Workers.
 */
export class QueueFactory {
  private static queues = new Map<string, Queue>();

  /**
   * Gets or creates a BullMQ Queue.
   */
  static getQueue<T = unknown, R = unknown>(name: string): Queue<T, R> {
    if (queuesDisabled) {
      // Return a no-op stub to avoid Redis connections in tests/disabled envs
      return {
        add: async () => undefined,
        getJob: async () => undefined,
        on: () => undefined,
      } as unknown as Queue<T, R>;
    }
    if (!this.queues.has(name)) {
      const queue = new Queue(name, defaultQueueOptions as QueueOptions);
      this.queues.set(name, queue);
      log.info(`Initialized queue: ${name}`);
    }
    return this.queues.get(name) as Queue<T, R>;
  }

  /**
   * Creates a BullMQ Worker.
   */
  static createWorker<T = unknown, R = unknown>(
    name: string,
    processor: Processor<T, R>,
    concurrency: number = 5
  ): Worker<T, R> {
    if (queuesDisabled) {
      return {
        on: () => undefined,
        close: async () => undefined,
      } as unknown as Worker<T, R>;
    }
    const worker = new Worker(name, processor, {
      connection: bullConnection ?? (queueConnection as unknown as QueueOptions['connection']),
      concurrency,
    });

    worker.on('completed', (job: Job) => {
      log.info({ jobId: job.id, queue: name }, `Job completed`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
      log.error({ jobId: job?.id, queue: name, error: err.message }, `Job failed`);
    });

    log.info(`Initialized worker for queue: ${name} (concurrency: ${concurrency})`);
    return worker;
  }
}
