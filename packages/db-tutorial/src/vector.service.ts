import pino from 'pino';
import { Index, type QueryResult } from '@upstash/vector';

import { STANDARD_QUERY_TIMEOUT, withTimeout } from '@quiz/db';
import type { TutorialContentJSON, TutorialDifficulty } from '@quiz/types';

export type AiTutorBlockType = 'notes' | 'layman' | 'real_life' | 'technical' | 'code';

export type AiTutorVectorMetadata = Record<string, unknown> & {
  subtopicId: string;
  difficulty: TutorialDifficulty;
  blockType: AiTutorBlockType;
};

export interface AiTutorVectorChunk {
  id: string;
  data: string;
  metadata: AiTutorVectorMetadata;
}

export type AiTutorVectorResult = QueryResult<AiTutorVectorMetadata>;

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level,
  serializers: pino.stdSerializers,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export function createAiTutorVectorIndex() {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (url === undefined || url.trim().length === 0 || token === undefined || token.trim().length === 0) {
    throw new Error('UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN are required');
  }

  return new Index<AiTutorVectorMetadata>({
    url,
    token,
  });
}

export function buildAiTutorVectorChunks(
  content: TutorialContentJSON,
  subtopicId: string,
  difficulty: TutorialDifficulty
): AiTutorVectorChunk[] {
  const chunks: Array<[AiTutorBlockType, string]> = [
    ['notes', content.notes.markdown],
    ['layman', `${content.layman.simpleExplanation}\n\n${content.layman.analogyOrStory}`],
    ['real_life', `${content.real_life.title}\n\n${content.real_life.scenario}\n\n${content.real_life.bullets.map((item) => `${item.label}: ${item.detail}`).join('\n')}\n\n${content.real_life.tip}`],
    ['technical', `${content.technical.markdown}\n\n${content.technical.bullets.map((item) => `${item.term}: ${item.detail}`).join('\n')}\n\n${content.technical.tip}`],
    ['code', `${content.code.intro}\n\n${content.code.code}\n\n${content.code.steps.join('\n')}`],
  ];

  return chunks.map(([blockType, data]) => ({
    id: `${subtopicId}:${difficulty}:${blockType}`,
    data,
    metadata: {
      subtopicId,
      difficulty,
      blockType,
    },
  }));
}

const buildFilter = (subtopicId: string, difficulty?: TutorialDifficulty) => {
  const filterParts = [`subtopicId = '${subtopicId}'`];
  if (difficulty !== undefined) {
    filterParts.push(`difficulty = '${difficulty}'`);
  }
  return filterParts.join(' and ');
};

export async function queryAiTutorVector(
  question: string,
  options: {
    subtopicId: string;
    difficulty?: TutorialDifficulty;
    topK?: number;
  }
): Promise<AiTutorVectorResult[]> {
  const index = createAiTutorVectorIndex();
  return withTimeout(
    index.query<AiTutorVectorMetadata>({
      data: question,
      topK: options.topK ?? 3,
      includeData: true,
      includeMetadata: true,
      filter: buildFilter(options.subtopicId, options.difficulty),
    }),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.vector.query'
  );
}

export async function querySubtopicContent(
  subtopicId: string,
  query: string,
  topK = 3,
  difficulty?: TutorialDifficulty
): Promise<Array<{ blockType: AiTutorBlockType; content: string; score: number }>> {
  const results = await queryAiTutorVector(query, { subtopicId, difficulty, topK });
  return results.slice(0, topK).map((result) => ({
    blockType: (result.metadata?.blockType ?? 'notes') as AiTutorBlockType,
    content: result.data ?? '',
    score: result.score,
  }));
}

export async function indexSubtopicContent(
  subtopicId: string,
  difficulty: TutorialDifficulty,
  content: TutorialContentJSON
) {
  const index = createAiTutorVectorIndex();
  const chunks = buildAiTutorVectorChunks(content, subtopicId, difficulty);

  await withTimeout(
    index.upsert(
      chunks.map((chunk) => ({
        id: chunk.id,
        data: chunk.data,
        metadata: chunk.metadata,
      }))
    ),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.vector.upsert'
  );

  logger.info({
    event: 'content.indexed',
    subtopicId,
    difficulty,
    chunkCount: chunks.length,
  });

  return chunks;
}

export async function deleteSubtopicContent(subtopicId: string, difficulty: TutorialDifficulty) {
  const index = createAiTutorVectorIndex();
  await withTimeout(
    index.delete({
      filter: buildFilter(subtopicId, difficulty),
    }),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.vector.delete'
  );

  logger.info({
    event: 'content.deleted',
    subtopicId,
    difficulty,
  });
}

