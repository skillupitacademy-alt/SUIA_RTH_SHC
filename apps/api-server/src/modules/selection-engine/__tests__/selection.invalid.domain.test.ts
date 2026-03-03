import { describe, it, expect, vi } from 'vitest';

import { SelectionService } from '../selection.service';

describe('SelectionService guard rails', () => {
  it('throws when domainId is missing', async () => {
    // bypass resolveBlueprint to avoid DB work; provide minimal stub
    vi.spyOn(SelectionService as any, 'resolveBlueprint').mockResolvedValue({
      id: 'b1',
      totalQuestions: 5,
      timeLimit: 10,
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

    await expect(
      SelectionService.composeExam('user1', '', 'key1', { questionCount: 3 })
    ).rejects.toThrow(/Selection criteria/i);
  });
});
