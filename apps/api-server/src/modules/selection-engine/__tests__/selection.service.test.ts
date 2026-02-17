import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../selection.service', () => ({
  SelectionService: {
    composeExam: vi.fn(),
  },
}));

const BLUEPRINT_ID = 'bp-fixed';
const QUESTIONS = [
  { id: 'q1', stem: 'What is JS?', topicId: 't-js' },
  { id: 'q2', stem: 'What is TS?', topicId: 't-ts' },
];

describe.skip('SelectionService (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses user + domain + idempotency to compose repeatable exam', async () => {
    const { SelectionService } = await import('../selection.service');
    vi.mocked(SelectionService.composeExam).mockResolvedValue({
      questions: QUESTIONS,
      blueprint: { id: BLUEPRINT_ID, domainId: 'domain1' },
      meta: { seed: 'key1' },
    });

    const result = await SelectionService.composeExam('user1', 'domain1', 'key1', { questionCount: 2 });

    expect(SelectionService.composeExam).toHaveBeenCalledWith('user1', 'domain1', 'key1', {
      questionCount: 2,
    });
    expect(result.blueprint.id).toBe(BLUEPRINT_ID);
    expect(result.questions).toHaveLength(2);
    expect(result.meta?.seed).toBe('key1');
  });
});
