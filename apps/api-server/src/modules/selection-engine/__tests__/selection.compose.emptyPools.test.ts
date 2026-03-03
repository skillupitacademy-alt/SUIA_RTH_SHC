import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { SelectionService } from '../selection.service';

describe('SelectionService composeExam empty pools', () => {
  it('throws when no questions found for mixed tiers', async () => {
    // Mock resolveBlueprint to avoid DB noise
    vi.spyOn(SelectionService as any, 'resolveBlueprint').mockResolvedValue({
      id: 'b1',
      totalQuestions: 3,
      timeLimit: 5,
      domains: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'u1',
      subjects: [],
      topics: [],
      subtopics: [],
      questionIds: [],
    });

    // Make resolveSelectionCriteria return no ids so domainCond branch is used
    vi.spyOn(SelectionService as any, 'resolveSelectionCriteria').mockResolvedValue({
      domainId: 'd1',
      finalSubtopicIds: [],
      actualTopicIds: [],
      actualSubjectIds: [],
      requestedTotal: 3,
      difficultyPref: 'mixed',
    });

    // Force count(*) to 0 so each pool is empty
    vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    } as any);

    await expect(
      SelectionService.composeExam('u1', 'd1', 'key1')
    ).rejects.toThrow(/No questions found/);
  });
});
