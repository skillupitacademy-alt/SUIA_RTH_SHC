import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { SelectionService } from '../selection.service';
import { container } from '@/modules/core/container';

describe('SelectionService Configuration Rules (Task 59)', () => {
  let selectionService: SelectionService;

  const mockBlueprint = {
    id: 'bp1',
    totalQuestions: 20,
    timeLimit: 30,
    subjects: [],
    topics: [],
    subtopics: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    selectionService = container.get(SelectionService);

    // Mock db.select for exclusion check
    (db.select as any) = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });
  });

  it('sets simple difficulty and 10 questions when selection is till Topic level', async () => {
    const config = {
      topicIds: ['topic-1'],
    };

    // Accessing private resolveSelectionCriteria for targeted unit test
    const criteria = await (selectionService as any).resolveSelectionCriteria('domain-1', config, mockBlueprint);

    expect(criteria.difficultyPref).toBe('simple');
    expect(criteria.requestedTotal).toBe(10);
  });

  it('sets mixed difficulty and 10 questions when selection is till Subtopic level', async () => {
    const config = {
      subtopicIds: ['subtopic-1'],
    };

    const criteria = await (selectionService as any).resolveSelectionCriteria('domain-1', config, mockBlueprint);

    expect(criteria.difficultyPref).toBe('mixed');
    expect(criteria.requestedTotal).toBe(10);
  });

  it('respects explicit questionCount and difficulty overrides', async () => {
    const config = {
      topicIds: ['topic-1'],
      questionCount: 5,
      difficulty: 'expert',
    };

    const criteria = await (selectionService as any).resolveSelectionCriteria('domain-1', config, mockBlueprint);

    expect(criteria.difficultyPref).toBe('expert');
    expect(criteria.requestedTotal).toBe(5);
  });

  it('uses blueprint defaults when no topic/subtopic is provided', async () => {
    const config = {};

    const criteria = await (selectionService as any).resolveSelectionCriteria('domain-1', config, mockBlueprint);

    // Should use blueprint.totalQuestions (20) and default mixed difficulty
    expect(criteria.requestedTotal).toBe(20);
    expect(criteria.difficultyPref).toBe('mixed');
  });
});
