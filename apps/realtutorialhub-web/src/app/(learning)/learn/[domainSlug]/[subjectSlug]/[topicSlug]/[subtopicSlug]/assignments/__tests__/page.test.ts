import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/content/LearnerProgressPanel', () => ({
  LearnerProgressPanel: () => null,
}));
vi.mock('@/lib/domain-themes', () => ({
  getDomainTheme: vi.fn(() => ({})),
})); 
vi.mock('@/lib/tutorial-content', () => ({
  SEED_SUBTOPIC_ID: 'subtopic-seed',
  getSeededTutorialContent: vi.fn(async () => ({})),
}));
vi.mock('@/lib/tutorial-hierarchy', () => ({
  getHierarchyBySlugs: vi.fn(async () => ({
    domain: { id: 'domain-1', name: 'Full Stack', slug: 'full-stack' },
    subject: { id: 'subject-1', name: 'JavaScript', slug: 'javascript' },
    topic: { id: 'topic-1', name: 'Async Programming', slug: 'async-programming' },
    subtopic: { id: 'subtopic-1', name: 'Promises', slug: 'promises' },
  })),
  getPublishedTutorialContent: vi.fn(async () => ({
    id: 'content-1',
    subtopicId: 'subtopic-1',
    difficulty: 'simple',
    content: {
      notes: {
        markdown: 'Practice paths stay tied to the same hierarchy as the lesson notes.',
      },
    },
    updatedAt: new Date('2026-03-22T00:00:00.000Z'),
  })),
  slugifySegment: (value: string) => value.toLowerCase().replace(/\s+/g, '-'),
}));

import { generateMetadata } from '../page';

describe('tutorial assignments page metadata', () => {
  it('builds metadata from hierarchy and notes', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        domainSlug: 'full-stack',
        subjectSlug: 'javascript',
        topicSlug: 'async-programming',
        subtopicSlug: 'promises',
      }),
    });

    expect(metadata.title).toBe('Promises Assignments - Async Programming | RealTutorialHub');
    expect(metadata.description).toContain('Practice paths stay tied to the same hierarchy');
    expect(metadata.openGraph?.type).toBe('article');
  });
});
