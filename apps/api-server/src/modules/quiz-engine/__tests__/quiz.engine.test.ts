import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/selection-engine/selection.service', () => ({
  SelectionService: {
    composeExam: vi.fn(),
  },
}));

describe.skip('QuizEngine (unit)', () => {
  it('delegates question selection to SelectionService', async () => {
    const { QuizEngine } = await import('../quiz.engine');
    const { SelectionService } = await import('@/modules/selection-engine/selection.service');
    vi.mocked(SelectionService.composeExam).mockResolvedValue({ questions: [{ id: 'q1' }], blueprint: { id: 'bp' } });

    const res = await QuizEngine.startQuiz('u1', { topicId: 't1', count: 3 });
    expect(SelectionService.composeExam).toHaveBeenCalled();
    expect(res.questions).toHaveLength(1);
  });
});
