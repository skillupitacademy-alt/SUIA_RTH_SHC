import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/selection-engine/selection.service', () => ({
  SelectionService: {
    composeExam: vi.fn(),
  },
}));

const MOCK_SELECTION = {
  questions: [{ id: 'q1', topicId: 't1' }],
  blueprint: { id: 'bp', topicId: 't1' },
};

describe.skip('QuizEngine (unit)', () => {
  it('delegates question selection to SelectionService and returns shaped exam', async () => {
    const { QuizEngine } = await import('@/modules/quiz-engine/quiz.engine');
    const { SelectionService } = await import('@/modules/selection-engine/selection.service');
    vi.mocked(SelectionService.composeExam).mockResolvedValue(MOCK_SELECTION);

    const res = await QuizEngine.startQuiz('u1', { topicId: 't1', count: 3 });

    expect(SelectionService.composeExam).toHaveBeenCalledWith('u1', 't1', expect.any(String), {
      topicId: 't1',
      count: 3,
    });
    expect(res.questions).toEqual(MOCK_SELECTION.questions);
    expect(res.blueprint.id).toBe('bp');
  });
});
