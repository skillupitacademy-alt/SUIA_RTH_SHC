import { TutorialContentRepository } from '@quiz/db-tutorial';
import type { TutorialContentJSON, TutorialDifficulty, TutorialContentRecord } from '@quiz/types';
import { z } from 'zod';

import { DEFAULT_TUTORIAL_CONTENT, SEED_SUBTOPIC_ID } from './tutorial-content';
import { logger } from './logger';

export const tutorialContentRepository = new TutorialContentRepository();
const tutorialApiBase = (() => {
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal && internal.length > 0) {
    return internal.replace(/\/+$/, '');
  }

  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicUrl && publicUrl.length > 0) {
    return publicUrl.replace(/\/+$/, '');
  }

  return 'https://api.skillhubcore.in/api';
})();

export type TutorialContentApiDTO = {
  id: string;
  subtopicId: string;
  difficulty: TutorialDifficulty;
  contentType: string;
  content: TutorialContentJSON;
  version: number;
  language: string;
  isPublished: boolean;
  generatedByAi: boolean;
  aiModelUsed: string | null;
  generationJobId: string | null;
  adminApprovedBy: string | null;
  adminApprovedAt: string | null;
  qualityScore: Record<string, unknown> | null;
  regenerationCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

const tutorialContentParamSchema = z.object({
  subtopicId: z.string().uuid(),
});

export function toTutorialContentDTO(record: TutorialContentRecord): TutorialContentApiDTO {
  return {
    id: record.id,
    subtopicId: record.subtopicId,
    difficulty: record.difficulty,
    contentType: record.contentType,
    content: record.content,
    version: record.version,
    language: record.language,
    isPublished: record.isPublished,
    generatedByAi: record.generatedByAi,
    aiModelUsed: record.aiModelUsed,
    generationJobId: record.generationJobId,
    adminApprovedBy: record.adminApprovedBy,
    adminApprovedAt: record.adminApprovedAt ? record.adminApprovedAt.toISOString() : null,
    qualityScore: record.qualityScore,
    regenerationCount: record.regenerationCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
  };
}

export async function getTutorialContentBySubtopicId(subtopicId: string): Promise<TutorialContentApiDTO | null> {
  const parsed = tutorialContentParamSchema.safeParse({ subtopicId });
  if (!parsed.success) {
    return null;
  }

  try {
    const response = await fetch(`${tutorialApiBase}/tutorial/content/${parsed.data.subtopicId}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const payload = (await response.json()) as { data?: TutorialContentApiDTO };
      if (payload.data != null) {
        return payload.data;
      }
    }
  } catch (error) {
    logger.warn({ err: error, subtopicId: parsed.data.subtopicId }, 'Tutorial content api-server lookup failed, falling back to direct DB access');
  }

  try {
    const rows = await tutorialContentRepository.getPublished(parsed.data.subtopicId, 'simple');
    const record = rows[0] ?? null;
    if (record != null) {
      return toTutorialContentDTO(record);
    }
  } catch (error) {
    logger.warn({ err: error, subtopicId: parsed.data.subtopicId }, 'Tutorial content read failed, using fallback when possible');
  }

  if (parsed.data.subtopicId === SEED_SUBTOPIC_ID) {
    return {
      id: 'seed',
      subtopicId: SEED_SUBTOPIC_ID,
      difficulty: 'simple',
      contentType: 'standard',
      content: DEFAULT_TUTORIAL_CONTENT,
      version: 1,
      language: 'en',
      isPublished: true,
      generatedByAi: false,
      aiModelUsed: null,
      generationJobId: null,
      adminApprovedBy: null,
      adminApprovedAt: null,
      qualityScore: null,
      regenerationCount: 0,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      deletedAt: null,
    };
  }

  return null;
}
