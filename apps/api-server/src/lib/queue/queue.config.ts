import type { QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

import { logger } from '../logger';

/**
 * BullMQ requires a standard Redis connection (not REST).
 * We use ioredis to connect to Upstash via their standard Redis string.
 */
function createRedisClient(): IORedis {
  const redisUrl = process.env.REDIS_URL;
  const queueEnabled = process.env.QUEUE_ENABLED === 'true';

  if (!queueEnabled) {
    // Queues disabled: return a no-op client so imports don't trigger connections during build/edge
    return {} as IORedis;
  }

  if (redisUrl === undefined || redisUrl === null || redisUrl === '') {
    throw new Error('QUEUE_ENABLED=true but REDIS_URL is not set');
  }

  const client = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on('error', (err) => {
    logger.error({ err }, 'BullMQ Redis Client Error');
  });

  return client;
}

export const redisConnection = createRedisClient();

export const BULLMQ_CONNECTION: QueueOptions = {
  connection: redisConnection as unknown as QueueOptions['connection'],
};

export const QUEUE_ENABLED = process.env.QUEUE_ENABLED === 'true';
