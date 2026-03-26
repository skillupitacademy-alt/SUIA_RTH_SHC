import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPublished: vi.fn(),
}));

vi.mock('@quiz/db-tutorial', () => ({
  TutorialContentRepository: class {
    getPublished = mocks.getPublished;
  },
}));

import { GET } from '../route';

describe('GET /api/tutorial/content/[subtopicId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when content is missing', async () => {
    mocks.getPublished.mockResolvedValueOnce([]);

    const response = await GET(
      new NextRequest('http://localhost/api/tutorial/content/11111111-1111-1111-1111-111111111111'),
      { params: Promise.resolve({ subtopicId: '11111111-1111-1111-1111-111111111111' }) },
    );

    expect(response.status).toBe(404);
  });

  it('returns published content when available', async () => {
    mocks.getPublished.mockResolvedValueOnce([
      {
        id: 'content-1',
        subtopicId: '11111111-1111-1111-1111-111111111111',
        difficulty: 'simple',
        contentType: 'standard',
        content: { notes: { markdown: 'Promises keep async code readable.' } },
        version: 3,
        language: 'en',
        isPublished: true,
        generatedByAi: false,
        aiModelUsed: null,
        generationJobId: null,
        adminApprovedBy: null,
        adminApprovedAt: null,
        qualityScore: null,
        regenerationCount: 0,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
        deletedAt: null,
      },
    ]);

    const response = await GET(
      new NextRequest('http://localhost/api/tutorial/content/11111111-1111-1111-1111-111111111111'),
      { params: Promise.resolve({ subtopicId: '11111111-1111-1111-1111-111111111111' }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

    const body = (await response.json()) as {
      data: { id: string; subtopicId: string; content: { notes: { markdown: string } } };
    };

    expect(body.data.id).toBe('content-1');
    expect(body.data.subtopicId).toBe('11111111-1111-1111-1111-111111111111');
    expect(body.data.content.notes.markdown).toContain('Promises keep async code readable');
  });
});
