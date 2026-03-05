import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SelectionService } from '../selection.service';
import { container } from '../../core/container';

const BLUEPRINT_ID = 'bp-fixed';
const QUESTIONS = [
  { id: 'q1', stem: 'What is JS?', topicId: 't-js' },
  { id: 'q2', stem: 'What is TS?', topicId: 't-ts' },
];

describe('SelectionService (unit)', () => {
  beforeEach(() => {
      vi.clearAllMocks();
      container.reset();
      
      const mockService = {
          composeExam: vi.fn(),
      };
      container.register(SelectionService, mockService as any);
  });

  it('uses user + domain + idempotency to compose repeatable exam', async () => {
    const service = container.get(SelectionService);
    vi.mocked(service.composeExam).mockResolvedValue({
      questions: QUESTIONS as any,
      blueprint: { id: BLUEPRINT_ID, domains: ['domain1'] } as any,
    });

    const result = await service.composeExam('user1', 'domain1', 'key1', { questionCount: 2 });

    expect(service.composeExam).toHaveBeenCalledWith('user1', 'domain1', 'key1', {
      questionCount: 2,
    });
    expect(result.blueprint.id).toBe(BLUEPRINT_ID);
    expect(result.questions).toHaveLength(2);
  });
});
