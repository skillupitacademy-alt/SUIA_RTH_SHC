import { and, eq, isNull } from 'drizzle-orm';
import { Client, SignatureError } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { createQStashHandler, PlatformEventTypes } from '@quiz/events';
import {
  db,
  remediationTriggers,
  STANDARD_QUERY_TIMEOUT,
  withTimeout,
} from '@quiz/db-tutorial';

import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const WeakSubtopicSchema = z.object({
  subtopicId: z.string().uuid(),
  subtopicName: z.string().min(1),
  score: z.number().min(0).max(100),
  threshold: z.number().default(60),
});

const ExamCompletedPayloadSchema = z.object({
  userId: z.string().uuid(),
  examResultId: z.string().uuid(),
  weakSubtopics: z.array(WeakSubtopicSchema),
});

const ExamCompletedEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal(PlatformEventTypes.EXAM_COMPLETED),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: ExamCompletedPayloadSchema,
});

type ExamCompletedEnvelope = z.infer<typeof ExamCompletedEnvelopeSchema>;
type ExamCompletedPayload = z.infer<typeof ExamCompletedPayloadSchema>;

type RedisLike = {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
  del(key: string): Promise<unknown> | unknown;
};

type QStashClientLike = {
  publishJSON(args: { url: string; body: unknown; headers?: Record<string, string>; retries?: number }): Promise<unknown>;
};

type DbLike = typeof db;
type DbTransactionLike = Parameters<DbLike['transaction']>[0] extends (tx: infer T) => Promise<unknown> | unknown ? T : never;

interface WorkerDeps {
  getRedis: () => RedisLike;
  getQStash: () => QStashClientLike;
  dbClient: DbLike;
  logger: typeof logger;
  now: () => Date;
}

const createRedisClient = (): RedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url === undefined || url.trim().length === 0 || token === undefined || token.trim().length === 0) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }

  return new Redis({ url, token });
};

const createQStashClient = (): QStashClientLike => {
  const token = process.env.QSTASH_TOKEN;
  if (token === undefined || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required to publish remediation notifications');
  }

  return new Client({ token });
};

const defaultDeps: WorkerDeps = {
  getRedis: createRedisClient,
  getQStash: createQStashClient,
  dbClient: db,
  logger,
  now: () => new Date(),
};

const buildNotificationUrl = (requestUrl: string) =>
  new URL('/api/workers/send-remediation-notification', requestUrl).toString();

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export async function processExamCompletedEnvelope(
  envelope: ExamCompletedEnvelope,
  requestUrl: string,
  deps: WorkerDeps = defaultDeps
): Promise<Response> {
  const { userId, examResultId, weakSubtopics } = envelope.data as ExamCompletedPayload;
  const redisKey = `remediation:${examResultId}`;
  const redis = deps.getRedis();
  let reserved = false;

  try {
    const existingMarker = await redis.get(redisKey);
    if (existingMarker !== null && String(existingMarker).trim().length > 0) {
      deps.logger.info({
        event: 'remediation.skipped.duplicate',
        examResultId,
        userId,
      });
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const claimed = await redis.set(redisKey, 'processing', { ex: 86_400, nx: true });
    reserved = claimed === 'OK' || claimed === true;
    if (!reserved) {
      deps.logger.info({
        event: 'remediation.skipped.duplicate',
        examResultId,
        userId,
      });
      return new Response('Duplicate event ignored', { status: 200 });
    }

    const existingRows = await withTimeout(
      deps.dbClient
        .select()
        .from(remediationTriggers)
        .where(and(eq(remediationTriggers.examResultId, examResultId), isNull(remediationTriggers.deletedAt))),
      STANDARD_QUERY_TIMEOUT,
      'handle-exam-completed.select'
    );

    let remediation = existingRows[0] ?? null;

    if (remediation === null) {
      try {
        await deps.dbClient.transaction(async (tx: DbTransactionLike) => {
          const insertedRows = await withTimeout(
            tx
              .insert(remediationTriggers)
              .values({
                examResultId,
                userId,
                weakSubtopicIds: weakSubtopics.map((item: { subtopicId: string }) => item.subtopicId),
                recommendedContentTypes: [],
                status: 'pending',
              })
              .returning(),
            STANDARD_QUERY_TIMEOUT,
            'handle-exam-completed.insert'
          );

          remediation = insertedRows[0] ?? null;
          if (remediation === null) {
            throw new Error('Failed to create remediation trigger');
          }
        });
      } catch (error) {
        deps.logger.error({
          event: 'transaction_failed',
          operation: 'handle-exam-completed.remediation-upsert',
          error: toErrorMessage(error),
          context: { userId, examResultId },
        });
        throw error;
      }
    }

    if (remediation === null) {
      throw new Error('Failed to create remediation trigger');
    }

    if (remediation.status !== 'completed') {
      if (weakSubtopics.length > 0) {
        await deps.getQStash().publishJSON({
          url: buildNotificationUrl(requestUrl),
          body: {
            userId,
            examResultId,
            weakSubtopics,
          },
          retries: 3,
        });
      }

      const updatedRows = await withTimeout(
        deps.dbClient
          .update(remediationTriggers)
          .set({
            status: 'completed',
            updatedAt: deps.now(),
          })
          .where(eq(remediationTriggers.id, remediation.id))
          .returning(),
        STANDARD_QUERY_TIMEOUT,
        'handle-exam-completed.complete'
      );

      remediation = updatedRows[0] ?? remediation;
    }

    await redis.set(redisKey, 'processed', { ex: 86_400 });

    deps.logger.info({
      event: 'remediation.created',
      examResultId,
      userId,
      weakCount: weakSubtopics.length,
    });

    return new Response('ok', { status: 200 });
  } catch (error) {
    if (reserved) {
      await Promise.resolve(redis.del(redisKey)).catch(() => undefined);
    }

    deps.logger.error({
      event: 'remediation.worker_failed',
      examResultId,
      userId,
      error: toErrorMessage(error),
    });

    return new Response('error', { status: 500 });
  }
}

export function buildHandleExamCompletedHandler(requestUrl: string, deps: WorkerDeps = defaultDeps) {
  return createQStashHandler(
    PlatformEventTypes.EXAM_COMPLETED,
    async (envelope: unknown) => processExamCompletedEnvelope(envelope as ExamCompletedEnvelope, requestUrl, deps),
    {
      schema: ExamCompletedEnvelopeSchema,
    }
  );
}

export async function POST(req: Request): Promise<Response> {
  try {
    return await buildHandleExamCompletedHandler(req.url)(req);
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
    }

    logger.error({
      event: 'remediation.worker_crashed',
      error: toErrorMessage(error),
    });

    return new Response('error', { status: 500 });
  }
}
