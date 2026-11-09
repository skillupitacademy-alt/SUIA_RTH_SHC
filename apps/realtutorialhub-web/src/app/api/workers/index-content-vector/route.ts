import { SignatureError } from '@upstash/qstash';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import {
  createQStashHandler,
  PlatformEventTypes,
} from '@quiz/events';
import { TutorialContentSchema } from '@quiz/types';

import { logger } from '@/lib/logger';
import { createAiTutorVectorIndex } from '../../../../lib/ai-tutor-vector';

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
  getVector?: () => IndexVectorLike;
  logger: typeof logger;
};

const defaultDeps: WorkerDeps = {
  logger,
};

const buildErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Terminal Disposition for Retired Vector Indexing Worker
 *
 * Per OD-04 and Review R1:
 * Legacy monolithic tutorial content vector indexing is permanently retired.
 * Obsolete events terminate with an explicit authenticated HTTP 200 OK
 * with zero vector upserts, zero database reads, and zero infinite retries.
 */
async function processIndexContentEnvelope(
  envelope: IndexContentEnvelope,
  deps: WorkerDeps = defaultDeps
): Promise<Response> {
  const { subtopicId, difficulty, version } = envelope.data;
  const resolvedDifficulty = difficulty ?? 'simple';

  deps.logger.info({
    event: 'ai_tutor.vector_index_retired',
    subtopicId,
    difficulty: resolvedDifficulty,
    version,
    message: 'Legacy content vector indexing is permanently retired (OD-04). No vector mutations performed.',
  });

  return new Response('retired', { status: 200 });
}

function buildIndexContentVectorHandler(deps: WorkerDeps = defaultDeps) {
  return createQStashHandler(
    PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED,
    async (envelope: unknown) => processIndexContentEnvelope(envelope as IndexContentEnvelope, deps),
    {
      schema: IndexContentEnvelopeSchema,
      tenantScope: 'realtutorialhub',
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

    defaultDeps.logger.error({
      event: 'ai_tutor.vector_index_failed',
      error: buildErrorMessage(error),
    });

    return new Response('error', { status: 500 });
  }
}
