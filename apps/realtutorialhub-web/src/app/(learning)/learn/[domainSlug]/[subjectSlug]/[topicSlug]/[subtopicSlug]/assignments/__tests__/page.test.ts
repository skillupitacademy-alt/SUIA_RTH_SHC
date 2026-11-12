import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNotFound = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/components/content/LearnerProgressPanel', () => ({
  LearnerProgressPanel: (props: { subtopicId: string }) => React.createElement('div', {
    'data-testid': 'learner-progress-panel',
    'data-subtopic-id': props.subtopicId,
  }),
}));

vi.mock('@/lib/domain-themes', () => ({
  getDomainTheme: vi.fn(() => ({})),
}));

const mockGetHierarchyBySlugs = vi.fn();
const mockGetPublishedTutorialContent = vi.fn();

vi.mock('@/lib/tutorial-hierarchy', () => ({
  getHierarchyBySlugs: (...args: unknown[]) => mockGetHierarchyBySlugs(...args),
  getPublishedTutorialContent: (...args: unknown[]) => mockGetPublishedTutorialContent(...args),
  slugifySegment: (value: string) => value.toLowerCase().replace(/\s+/g, '-'),
}));

import TutorialAssignmentsPage, { generateMetadata } from '../page';

describe('tutorial assignments page (Correction R3: Missing Hierarchy Protection)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHierarchyBySlugs.mockResolvedValue({
      domain: { id: 'domain-1', name: 'Full Stack', slug: 'full-stack' },
      subject: { id: 'subject-1', name: 'JavaScript', slug: 'javascript' },
      topic: { id: 'topic-1', name: 'Async Programming', slug: 'async-programming' },
      subtopic: { id: 'subtopic-1', name: 'Promises', slug: 'promises' },
    });
    mockGetPublishedTutorialContent.mockResolvedValue({
      id: 'content-1',
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      content: {
        notes: {
          markdown: 'Practice paths stay tied to the same hierarchy as the lesson notes.',
        },
      },
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });
  });

  it('builds metadata from hierarchy and notes when hierarchy exists', async () => {
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

  it('returns fallback not-found metadata when hierarchy is null without querying content', async () => {
    mockGetHierarchyBySlugs.mockResolvedValueOnce(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({
        domainSlug: 'non-existent',
        subjectSlug: 'none',
        topicSlug: 'none',
        subtopicSlug: 'none',
      }),
    });

    expect(metadata.title).toBe('Assignments Not Found | RealTutorialHub');
    expect(mockGetPublishedTutorialContent).not.toHaveBeenCalled();
  });

  it('calls notFound() and does not mount progress panel or query content when hierarchy is null', async () => {
    mockGetHierarchyBySlugs.mockResolvedValueOnce(null);

    await expect(
      TutorialAssignmentsPage({
        params: Promise.resolve({
          domainSlug: 'non-existent',
          subjectSlug: 'none',
          topicSlug: 'none',
          subtopicSlug: 'none',
        }),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalledTimes(1);
    expect(mockGetPublishedTutorialContent).not.toHaveBeenCalled();
  });
});
