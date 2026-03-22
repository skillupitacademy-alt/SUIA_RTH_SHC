import { Redis } from '@upstash/redis';
import { z } from 'zod';

import { PlatformEventTypes } from '@quiz/events';
import {
  db,
  STANDARD_QUERY_TIMEOUT,
  tutorialDomains,
  tutorialSubjects,
  tutorialTopics,
  tutorialSubtopics,
  withTimeout,
} from '@quiz/db-tutorial';

import { logger } from '@/lib/logger';

const DifficultySchema = z.enum(['simple', 'mixed', 'intermediate', 'expert']);

export const HierarchySyncPayloadSchema = z.object({
  subtopicId: z.string().uuid(),
  subtopicName: z.string().min(1),
  subtopicSlug: z.string().min(1),
  topicId: z.string().uuid(),
  topicName: z.string().min(1),
  topicSlug: z.string().min(1),
  subjectId: z.string().uuid(),
  subjectName: z.string().min(1),
  subjectSlug: z.string().min(1),
  domainId: z.string().uuid(),
  domainName: z.string().min(1),
  domainSlug: z.string().min(1),
  difficulties: z.array(DifficultySchema).default([]),
  publishedAt: z.string().datetime({ offset: true }),
});

export const HierarchySyncEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal(PlatformEventTypes.HIERARCHY_SUBTOPIC_ADDED),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: HierarchySyncPayloadSchema,
});

export type HierarchySyncPayload = z.infer<typeof HierarchySyncPayloadSchema>;

type RedisLike = {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
  del(key: string): Promise<unknown> | unknown;
};

export interface HierarchySyncServiceDependencies {
  dbClient?: typeof db;
  getRedis?: () => RedisLike;
  logger?: typeof logger;
  now?: () => Date;
}

export interface HierarchySyncResult {
  duplicate: boolean;
  synced: boolean;
}

const createRedisClient = (): RedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (
    typeof url !== 'string' || url.trim().length === 0 ||
    typeof token !== 'string' || token.trim().length === 0
  ) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }

  return new Redis({ url, token });
};

const upsertDomain = async (
  tx: typeof db,
  payload: HierarchySyncPayload,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialDomains)
      .values({
        externalId: payload.domainId,
        name: payload.domainName,
        slug: payload.domainSlug,
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialDomains.externalId,
        set: {
          name: payload.domainName,
          slug: payload.domainSlug,
          updatedAt: now,
          deletedAt: null,
        },
      })
      .returning({ id: tutorialDomains.id }),
    STANDARD_QUERY_TIMEOUT,
    'HierarchySyncService.upsertDomain'
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error('Failed to upsert tutorial domain');
  }

  return row.id;
};

const upsertSubject = async (
  tx: typeof db,
  payload: HierarchySyncPayload,
  domainDbId: string,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialSubjects)
      .values({
        externalId: payload.subjectId,
        domainId: domainDbId,
        name: payload.subjectName,
        slug: payload.subjectSlug,
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialSubjects.externalId,
        set: {
          domainId: domainDbId,
          name: payload.subjectName,
          slug: payload.subjectSlug,
          updatedAt: now,
          deletedAt: null,
        },
      })
      .returning({ id: tutorialSubjects.id }),
    STANDARD_QUERY_TIMEOUT,
    'HierarchySyncService.upsertSubject'
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error('Failed to upsert tutorial subject');
  }

  return row.id;
};

const upsertTopic = async (
  tx: typeof db,
  payload: HierarchySyncPayload,
  subjectDbId: string,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialTopics)
      .values({
        externalId: payload.topicId,
        subjectId: subjectDbId,
        name: payload.topicName,
        slug: payload.topicSlug,
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialTopics.externalId,
        set: {
          subjectId: subjectDbId,
          name: payload.topicName,
          slug: payload.topicSlug,
          updatedAt: now,
          deletedAt: null,
        },
      })
      .returning({ id: tutorialTopics.id }),
    STANDARD_QUERY_TIMEOUT,
    'HierarchySyncService.upsertTopic'
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error('Failed to upsert tutorial topic');
  }

  return row.id;
};

const upsertSubtopic = async (
  tx: typeof db,
  payload: HierarchySyncPayload,
  topicDbId: string,
  now: Date,
) => {
  const rows = await withTimeout(
    tx
      .insert(tutorialSubtopics)
      .values({
        externalId: payload.subtopicId,
        topicId: topicDbId,
        name: payload.subtopicName,
        slug: payload.subtopicSlug,
        difficultyLevels: payload.difficulties,
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialSubtopics.externalId,
        set: {
          topicId: topicDbId,
          name: payload.subtopicName,
          slug: payload.subtopicSlug,
          difficultyLevels: payload.difficulties,
          updatedAt: now,
          deletedAt: null,
        },
      })
      .returning({ id: tutorialSubtopics.id }),
    STANDARD_QUERY_TIMEOUT,
    'HierarchySyncService.upsertSubtopic'
  );

  const [row] = rows as Array<{ id: string }>;
  if (row === undefined) {
    throw new Error('Failed to upsert tutorial subtopic');
  }

  return row.id;
};

export class HierarchySyncService {
  private readonly dbClient: typeof db;

  private readonly getRedis: () => RedisLike;

  private readonly log: typeof logger;

  private readonly now: () => Date;

  constructor(dependencies: HierarchySyncServiceDependencies = {}) {
    this.dbClient = dependencies.dbClient ?? db;
    this.getRedis = dependencies.getRedis ?? createRedisClient;
    this.log = dependencies.logger ?? logger;
    this.now = dependencies.now ?? (() => new Date());
  }

  async sync(payload: HierarchySyncPayload): Promise<HierarchySyncResult> {
    const redis = this.getRedis();
    const idempotencyKey = `sync-hierarchy:${payload.subtopicId}`;

    const existing = await redis.get(idempotencyKey);
    if (existing !== null && String(existing).trim().length > 0) {
      return { duplicate: true, synced: false };
    }

    const claimed = await redis.set(idempotencyKey, 'processing', { ex: 86_400, nx: true });
    if (claimed == null || claimed === false) {
      return { duplicate: true, synced: false };
    }

    const now = this.now();

    try {
      await this.dbClient.transaction(async (tx) => {
        const transactionalDb = tx as unknown as typeof db;
        const domainDbId = await upsertDomain(transactionalDb, payload, now);
        const subjectDbId = await upsertSubject(transactionalDb, payload, domainDbId, now);
        const topicDbId = await upsertTopic(transactionalDb, payload, subjectDbId, now);
        await upsertSubtopic(transactionalDb, payload, topicDbId, now);
      });

      await Promise.all([
        Promise.resolve(redis.del('hierarchy:domains')),
        Promise.resolve(redis.del(`hierarchy:subjects:${payload.domainId}`)),
        Promise.resolve(redis.del(`hierarchy:topics:${payload.subjectId}`)),
        Promise.resolve(redis.del(`hierarchy:subtopics:${payload.topicId}`)),
      ]).catch((error) => {
        this.log.warn({
          event: 'hierarchy.cache_invalidation_failed',
          subtopicId: payload.subtopicId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      await Promise.resolve(redis.set(idempotencyKey, 'processed', { ex: 86_400 }));

      this.log.info({
        event: 'hierarchy.synced',
        subtopicId: payload.subtopicId,
        subtopicName: payload.subtopicName,
      });

      return { duplicate: false, synced: true };
    } catch (error) {
      await Promise.resolve(redis.del(idempotencyKey)).catch(() => undefined);
      throw error;
    }
  }
}
