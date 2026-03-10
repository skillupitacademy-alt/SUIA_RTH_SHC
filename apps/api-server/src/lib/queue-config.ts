import { ConnectionOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import IORedis from 'ioredis';

/**
 * Redis connection configuration for BullMQ (Task 106).
 * Uses ioredis as the standard Redis client for advanced BullMQ features.
 */
export const redisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  maxRetriesPerRequest: null, // Critical for BullMQ
};

/**
 * Standard Redis connection instance for BullMQ (Task 106).
 */
export const queueConnection = new IORedis(redisConfig as unknown as RedisOptions);
// BullMQ accepts either connection params or an ioredis instance; cast to appease type checker across duplicated deps.
export const bullConnection = queueConnection as unknown as ConnectionOptions;

/**
 * Shared default queue options.
 */
export const defaultQueueOptions = {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24h
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};
