import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

import { SemanticSearchService } from '../semantic-search.service';

describe('SemanticSearchService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('findSimilarQuestions returns empty array placeholder', async () => {
    const res = await SemanticSearchService.findSimilarQuestions('text');
    expect(res).toEqual([]);
  });

  it('isDuplicate warns when top score meets threshold', async () => {
    const spy = vi.spyOn(SemanticSearchService, 'findSimilarQuestions').mockResolvedValue([{ score: 0.97 }]);
    await expect(SemanticSearchService.isDuplicate('q', 0.95)).resolves.toBe(true);
    expect(spy).toHaveBeenCalledWith('q', 1);
  });

  it('isDuplicate returns false and logs when similarity lookup throws', async () => {
    vi.spyOn(SemanticSearchService, 'findSimilarQuestions').mockRejectedValue(new Error('boom'));
    await expect(SemanticSearchService.isDuplicate('x')).resolves.toBe(false);
  });

  it('isDuplicate returns false when no similar questions found', async () => {
    vi.spyOn(SemanticSearchService, 'findSimilarQuestions').mockResolvedValue([]);
    await expect(SemanticSearchService.isDuplicate('novel')).resolves.toBe(false);
  });

  it('indexQuestion is a no-op placeholder that should not throw', async () => {
    await expect(SemanticSearchService.indexQuestion('qid', 'text', {})).resolves.toBeUndefined();
  });
});
