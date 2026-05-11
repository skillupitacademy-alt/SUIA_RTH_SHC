import { SignatureError } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import {
  createQStashHandler,
  PlatformEventTypes,
} from '@quiz/events';
import {
  STANDARD_QUERY_TIMEOUT,
  TutorialContentRepository,
  withTimeout,
} from '@quiz/db-tutorial';
import { TutorialContentSchema, type TutorialContentJSON, type TutorialDifficulty } from '@quiz/types';

import { logger } from '@/lib/logger';
import {
  buildAiTutorVectorChunks,
  createAiTutorVectorIndex,
} from '../../../../lib/ai-tutor-vector';

export const dynamic = 'force-dynamic';

const IndexContentPayloadSchema = z.object({
  subtopicId: z.string().uuid(),
  approvedBy: z.string().uuid(),
  publishedAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  difficulty: z.enum(['simple', 'mixed', 'intermediate', 'expert']).optional(),
  content: TutorialContentSchema.optional(),
});

const IndexContentEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal(PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  data: IndexContentPayloadSchema,
});

type IndexContentEnvelope = z.infer<typeof IndexContentEnvelopeSchema>;
type IndexVectorLike = ReturnType<typeof createAiTutorVectorIndex>;

type WorkerDeps = {
  getVector: () => IndexVectorLike;
  getPublishedContent: (subtopicId: string, difficulty?: TutorialDifficulty) => Promise<Array<{
    subtopicId: string;
    difficulty: TutorialDifficulty;
    content: TutorialContentJSON;
  }>>;
  getRedis: () => RedisLike;
  logger: typeof logger;
};

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown>;
  del(key: string): Promise<number>;
};

const createRedisClient = (): RedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (typeof url !== 'string' || url.trim().length === 0 || typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }

  return new Redis({ url, token });
};

const defaultDeps: WorkerDeps = {
  getVector: () => createAiTutorVectorIndex(),
  getPublishedContent: async (subtopicId, difficulty) => {
    const repository = new TutorialContentRepository();
    const rows = await withTimeout(
      repository.getPublished(subtopicId, difficulty),
      STANDARD_QUERY_TIMEOUT,
      'index-content-vector.getPublished'
    );

    return rows.map((row) => ({
      subtopicId: row.subtopicId,
      difficulty: row.difficulty,
      content: row.content,
    }));
  },
  getRedis: createRedisClient,
  logger,
};

const buildErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function processIndexContentEnvelope(
  envelope: IndexContentEnvelope,
  deps: WorkerDeps = defaultDeps
): Promise<Response> {
  const { subtopicId, difficulty, content, version } = envelope.data;
  const resolvedDifficulty = difficulty ?? 'simple';
  const redisKey = `vector-index:${subtopicId}:${resolvedDifficulty}`;
  const redis = deps.getRedis();
  const existingVersion = await redis.get(redisKey);
  if (existingVersion === String(version)) {
    deps.logger.info({
      event: 'ai_tutor.vector_index_skipped',
      subtopicId,
      difficulty: resolvedDifficulty,
      version,
    });
    return new Response('ok', { status: 200 });
  }

  if (existingVersion !== null) {
    await redis.del(redisKey);
  }

  const claimed = await redis.set(redisKey, `processing:${version}`, { ex: 86_400, nx: true });
  if (claimed == null) {
    deps.logger.info({
      event: 'ai_tutor.vector_index_skipped',
      subtopicId,
      difficulty: resolvedDifficulty,
      version,
    });
    return new Response('ok', { status: 200 });
  }

  const sourceDocuments =
    content !== undefined
      ? [{
          subtopicId,
          difficulty: resolvedDifficulty,
          content,
        }]
      : await deps.getPublishedContent(subtopicId, difficulty);

  if (sourceDocuments.length === 0) {
    await redis.del(redisKey);
    throw new Error('Published tutorial content not found');
  }

  try {
    const vector = deps.getVector();
    const chunks = sourceDocuments.flatMap((document) =>
      buildAiTutorVectorChunks(document.content, document.subtopicId, document.difficulty)
    );

    await withTimeout(
      vector.upsert(
        chunks.map((chunk) => ({
          id: chunk.id,
          data: chunk.data,
          metadata: chunk.metadata,
        }))
      ),
      STANDARD_QUERY_TIMEOUT,
      'index-content-vector.upsert'
    );

    await redis.set(redisKey, String(version), { ex: 86_400 });

    deps.logger.info({
      event: 'ai_tutor.vector_indexed',
      subtopicId,
      chunkCount: chunks.length,
      difficulty: resolvedDifficulty,
    });

    return new Response('ok', { status: 200 });
  } catch (error) {
    await redis.del(redisKey);
    throw error;
  }
}

function buildIndexContentVectorHandler() {
  return createQStashHandler(
    PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED,
    async (envelope: unknown) => processIndexContentEnvelope(envelope as IndexContentEnvelope),
    {
      schema: IndexContentEnvelopeSchema,
    }
  );
}

export async function POST(req: Request): Promise<Response> {
  try {
    return await buildIndexContentVectorHandler()(req);
  } catch (error) {
    if (error instanceof SignatureError || (error instanceof Error && error.name === 'SignatureError')) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
    }

    logger.error({
      event: 'ai_tutor.vector_index_failed',
      error: buildErrorMessage(error),
    });

    return new Response('error', { status: 500 });
  }
}
