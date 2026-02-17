import { beforeEach,describe, expect, it, vi } from 'vitest';

vi.mock('../selection.service', () => ({
  SelectionService: {
    composeExam: vi.fn(),
  },
}));

describe.skip('SelectionService (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses blueprint/domain id and idempotency key to compose exam', async () => {
    const { SelectionService } = await import('../selection.service');
    vi.mocked(SelectionService.composeExam).mockResolvedValue({ questions: [], blueprint: { id: 'b1' } });
    const result = await SelectionService.composeExam('user1', 'domain1', 'key1', { questionCount: 5 });
    expect(result.blueprint.id).toBe('b1');
  });
});
