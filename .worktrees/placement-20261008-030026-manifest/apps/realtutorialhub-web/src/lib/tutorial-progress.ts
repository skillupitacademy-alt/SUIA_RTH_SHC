import { z } from 'zod';

import type { ContentBlockType } from '@quiz/types';

const blockTypeSchema = z.enum(['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor']);

export type TutorialProgressBlockType = z.infer<typeof blockTypeSchema>;

export type TutorialProgressSnapshot = {
  blocksViewed: TutorialProgressBlockType[];
  completionPercent: number;
  assignmentUnlocked: boolean;
};

const tutorialProgressEndpoint = '/api/tutorial/progress';

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown; message?: unknown } | null;
    if (payload != null) {
      if (typeof payload.error === 'string' && payload.error.length > 0) return payload.error;
      if (typeof payload.message === 'string' && payload.message.length > 0) return payload.message;
    }
  } catch {
    // Ignore JSON parse failures and fall back to status text.
  }

  return `Request failed with status ${response.status}`;
}

export async function reportTutorialBlockViewed(subtopicId: string, blockType: ContentBlockType): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;

  const parsedBlockType = blockTypeSchema.safeParse(blockType);
  if (!parsedBlockType.success) return;

  const response = await fetch(tutorialProgressEndpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      subtopicId,
      blockType: parsedBlockType.data,
      status: 'viewed',
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function getTutorialProgress(subtopicId: string): Promise<TutorialProgressSnapshot> {
  const response = await fetch(`${tutorialProgressEndpoint}?subtopicId=${encodeURIComponent(subtopicId)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { data?: TutorialProgressSnapshot } | null;
  if (payload?.data == null) {
    throw new Error('Invalid progress response');
  }

  return payload.data;
}
