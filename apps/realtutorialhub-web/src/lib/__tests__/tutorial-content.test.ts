import { describe, it, expect } from 'vitest';
import { getSeededTutorialContent, DEFAULT_TUTORIAL_CONTENT } from '../tutorial-content';

describe('tutorial-content (Decoupled)', () => {
  it('returns DEFAULT_TUTORIAL_CONTENT without database access', async () => {
    const result = await getSeededTutorialContent();
    expect(result).toEqual(DEFAULT_TUTORIAL_CONTENT);
  });
});
