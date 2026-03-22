import { Index } from '@upstash/vector';

import { STANDARD_QUERY_TIMEOUT, withTimeout } from '@quiz/db-tutorial';
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

export type AiTutorVectorResult = {
  id: string | number;
  score: number;
  data?: string;
  metadata?: Partial<AiTutorVectorMetadata>;
};

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

export async function queryAiTutorVector(
  question: string,
  options: {
    subtopicId: string;
    difficulty?: TutorialDifficulty;
    topK?: number;
  }
) {
  const index = createAiTutorVectorIndex();
  const filterParts = [`subtopicId = '${options.subtopicId}'`];
  if (options.difficulty !== undefined) {
    filterParts.push(`difficulty = '${options.difficulty}'`);
  }

  return withTimeout(
    index.query<AiTutorVectorMetadata>({
      data: question,
      topK: options.topK ?? 3,
      includeData: true,
      includeMetadata: true,
      filter: filterParts.join(' and '),
    }),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.vector.query'
  );
}
