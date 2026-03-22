import { SignatureError } from '@upstash/qstash';
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
  logger: typeof logger;
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
  logger,
};

const buildErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export async function processIndexContentEnvelope(
  envelope: IndexContentEnvelope,
  deps: WorkerDeps = defaultDeps
): Promise<Response> {
  const { subtopicId, difficulty, content } = envelope.data;
  const sourceDocuments =
    content !== undefined
      ? [{
          subtopicId,
          difficulty: difficulty ?? 'simple',
          content,
        }]
      : await deps.getPublishedContent(subtopicId, difficulty);

  if (sourceDocuments.length === 0) {
    throw new Error('Published tutorial content not found');
  }

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

  deps.logger.info({
    event: 'ai_tutor.vector_indexed',
    subtopicId,
    chunkCount: chunks.length,
    difficulty: difficulty ?? sourceDocuments[0]?.difficulty,
  });

  return new Response('ok', { status: 200 });
}

export function buildIndexContentVectorHandler() {
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
