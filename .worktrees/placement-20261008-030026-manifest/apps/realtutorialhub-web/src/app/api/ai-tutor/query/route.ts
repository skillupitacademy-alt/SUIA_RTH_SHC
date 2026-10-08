import { NextResponse } from 'next/server';
import { z } from 'zod';

import { TokenService } from '@quiz/auth';
import { STANDARD_QUERY_TIMEOUT, withTimeout } from '@quiz/db-tutorial';
import { Redis } from '@upstash/redis';

import { logger } from '@/lib/logger';
import { markAiTutorBlockComplete } from '@/lib/ai-tutor-progress';
import { DEFAULT_TUTORIAL_CONTENT } from '../../../../lib/tutorial-content';
import {
  queryAiTutorVector,
  type AiTutorVectorMetadata,
} from '../../../../lib/ai-tutor-vector';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  subtopicId: z.string().uuid(),
  question: z.string().min(3).max(500),
  difficulty: z.enum(['simple', 'mixed', 'intermediate', 'expert']),
});

type QueryInput = z.infer<typeof QuerySchema>;

type RedisLike = {
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
};

type QueryDeps = {
  getRedis: () => RedisLike;
  logger: typeof logger;
  now: () => Date;
};

const createRedisClient = (): RedisLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url === undefined || url.trim().length === 0 || token === undefined || token.trim().length === 0) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }

  return new Redis({ url, token });
};

const defaultDeps: QueryDeps = {
  getRedis: createRedisClient,
  logger,
  now: () => new Date(),
};

const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const aiTutorQaPairs = DEFAULT_TUTORIAL_CONTENT.ai_tutor?.qa_pairs ?? [];

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const tokenService = new TokenService();

const buildRateLimitKey = (userId: string, subtopicId: string, now: Date) => {
  const bucket = Math.floor(now.getTime() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  return {
    key: `ai-tutor:${userId}:${subtopicId}:${bucket}`,
    resetAt: new Date((bucket + 1) * RATE_LIMIT_WINDOW_SECONDS * 1000),
  };
};

const rateLimitQuery = async (
  redis: RedisLike,
  userId: string,
  subtopicId: string,
  now: Date
) => {
  const { key, resetAt } = buildRateLimitKey(userId, subtopicId, now);
  const count = await withTimeout(
    redis.incr(key),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.rate-limit.incr'
  );

  if (count === 1) {
    await withTimeout(
      redis.expire(key, RATE_LIMIT_WINDOW_SECONDS),
      STANDARD_QUERY_TIMEOUT,
      'ai-tutor.rate-limit.expire'
    );
  }

  return {
    allowed: count <= RATE_LIMIT,
    count,
    resetAt,
  };
};

const getSessionUserId = async (request: Request): Promise<string | null> => {
  const token = tokenService.getAccessToken(request, { scope: 'user' });
  if (token === undefined) return null;

  try {
    const payload = await TokenService.verifyAccessToken(token, { audience: 'user', isAdmin: false });
    return payload.userId;
  } catch {
    return null;
  }
};

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ');

const tokenize = (value: string) =>
  normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

const findQaPairMatch = (question: string) => {
  const tokens = tokenize(question);
  if (tokens.length === 0) return null;

  return (
    aiTutorQaPairs.find((pair) => {
      const haystack = normalizeText(pair.question);
      return tokens.some((token) => haystack.includes(token));
    }) ?? null
  );
};

const maybeMarkAiTutorComplete = async (userId: string, subtopicId: string) => {
  try {
    await markAiTutorBlockComplete(userId, subtopicId);
  } catch (error) {
    logger.warn({
      event: 'ai_tutor.progress_mark_failed',
      userId,
      subtopicId,
      error: toErrorMessage(error),
    });
  }
};

async function processAiTutorQuery(
  request: Request,
  deps: QueryDeps = defaultDeps
): Promise<Response> {
  const userId = await getSessionUserId(request);
  if (userId === null) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 400 });
  }

  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input: QueryInput = parsed.data;
  try {
    const redis = deps.getRedis();
    const rateLimit = await rateLimitQuery(redis, userId, input.subtopicId, deps.now());

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You have reached the limit for this subtopic this hour.',
        },
        {
          status: 429,
          headers: {
            'retry-after': Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - deps.now().getTime()) / 1000)).toString(),
            'x-ratelimit-limit': RATE_LIMIT.toString(),
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': rateLimit.resetAt.getTime().toString(),
          },
        }
      );
    }

    const questionsRemaining = Math.max(0, RATE_LIMIT - rateLimit.count);
    const qaPairMatch = findQaPairMatch(input.question);

    if (qaPairMatch !== null) {
      await maybeMarkAiTutorComplete(userId, input.subtopicId);
      deps.logger.info({
        event: 'ai_tutor.query',
        userId,
        subtopicId: input.subtopicId,
        scoreRange: null,
      });

      return NextResponse.json({
        source: 'qa_pairs',
        answer: qaPairMatch.answer,
        chunks: null,
        questionsRemaining,
      });
    }

    const results = await queryAiTutorVector(input.question, {
      subtopicId: input.subtopicId,
      difficulty: input.difficulty,
      topK: 3,
    });

    const chunks = results.slice(0, 3).map((result) => ({
      blockType: (result.metadata?.blockType ?? 'notes') as AiTutorVectorMetadata['blockType'],
      content: result.data ?? '',
      score: result.score,
    }));

    if (results.length > 0) {
      const scores = results.map((result) => result.score);
      deps.logger.info({
        event: 'ai_tutor.query',
        userId,
        subtopicId: input.subtopicId,
        scoreRange: {
          min: Math.min(...scores),
          max: Math.max(...scores),
        },
      });
    } else {
      deps.logger.info({
        event: 'ai_tutor.query',
        userId,
        subtopicId: input.subtopicId,
        scoreRange: null,
      });
    }

    await maybeMarkAiTutorComplete(userId, input.subtopicId);

    return NextResponse.json({
      source: 'vector_search',
      answer: null,
      chunks,
      questionsRemaining,
    });
  } catch (error) {
    deps.logger.error({
      event: 'ai_tutor.query_failed',
      userId,
      subtopicId: input.subtopicId,
      error: toErrorMessage(error),
    });

    return new Response('error', { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  return processAiTutorQuery(request);
}
