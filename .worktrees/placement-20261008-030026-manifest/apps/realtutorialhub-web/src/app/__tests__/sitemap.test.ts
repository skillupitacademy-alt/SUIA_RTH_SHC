import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/tutorial-hierarchy', () => ({
  getPublishedTutorialPaths: vi.fn(async () => [
    {
      domainSlug: 'full-stack',
      subjectSlug: 'javascript',
      topicSlug: 'async-programming',
      subtopicSlug: 'promises',
      subtopicId: 'subtopic-1',
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    },
  ]),
}));

import sitemap from '../sitemap';

describe('sitemap', () => {
  it('returns published tutorial paths', async () => {
    const entries = await sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toContain('/learn/full-stack/javascript/async-programming/promises');
    expect(entries[0]?.changeFrequency).toBe('weekly');
  });
});
