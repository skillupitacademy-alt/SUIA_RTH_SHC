import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/content/TutorialExperience', () => ({
  TutorialExperience: () => null,
}));
vi.mock('@/lib/domain-themes', () => ({
  getDomainTheme: vi.fn(() => ({})),
}));
vi.mock('@/lib/tutorial-content', () => ({
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
      layman: {
        simpleExplanation: 'Promises help you handle future values without blocking the app.',
      },
    },
    updatedAt: new Date('2026-03-22T00:00:00.000Z'),
  })),
  slugifySegment: (value: string) => value.toLowerCase().replace(/\s+/g, '-'),
}));

import { generateMetadata } from '../page';

describe('tutorial subtopic page metadata', () => {
  it('builds metadata from hierarchy and published content', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        domainSlug: 'full-stack',
        subjectSlug: 'javascript',
        topicSlug: 'async-programming',
        subtopicSlug: 'promises',
      }),
    });

    expect(metadata.title).toBe('Promises — Async Programming | RealTutorialHub');
    expect(metadata.description).toContain('Promises help you handle future values');
    expect(metadata.openGraph?.type).toBe('article');
  });
});
