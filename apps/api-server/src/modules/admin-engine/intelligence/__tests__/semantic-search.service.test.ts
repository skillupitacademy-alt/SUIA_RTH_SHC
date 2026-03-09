import { describe, it, expect } from 'vitest';

import { SemanticSearchService } from '../semantic-search.service';

describe('SemanticSearchService stub', () => {
  it('returns true only for the literal duplicate marker', async () => {
    await expect(SemanticSearchService.isDuplicate('dup')).resolves.toBe(true);
    await expect(SemanticSearchService.isDuplicate('unique')).resolves.toBe(false);
  });
});
