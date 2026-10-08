import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const tutorialApiMock = vi.hoisted(() => {
  class TutorialAuthError extends Error {
    constructor(message: string, public readonly statusCode: 401 | 403) {
      super(message);
      this.name = 'TutorialAuthError';
    }
  }

  return {
    TutorialAuthError,
    isTutorialAuthError: (error: unknown) => error instanceof TutorialAuthError,
    requireAdmin: vi.fn(),
    tutorialContentRepository: {
      findBySubtopicId: vi.fn(),
      findById: vi.fn(),
      getVersionSnapshots: vi.fn(),
    },
    logRouteError: vi.fn(),
  };
});

vi.mock('@/lib/tutorial-content-api', () => tutorialApiMock);

import {
  requireAdmin,
  TutorialAuthError,
  tutorialContentRepository,
} from '@/lib/tutorial-content-api';

import { GET } from '../route';

function createRequest(query = '') {
  return new Request(`http://localhost/api/tutorial/content/versions${query}`, {
    method: 'GET',
  }) as NextRequest;
}

describe('GET /api/tutorial/content/versions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Forbidden', 403));

    const response = await GET(createRequest());

    expect(response.status).toBe(403);
  });

  it('returns version snapshots for a subtopic', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ userId: 'admin-1', roles: ['ADMIN'], isAdmin: true } as never);
    vi.mocked(tutorialContentRepository.findBySubtopicId).mockResolvedValueOnce([
      { id: 'content-1', subtopicId: 'subtopic-1', difficulty: 'simple' },
    ] as never);
    vi.mocked(tutorialContentRepository.getVersionSnapshots).mockResolvedValueOnce([
      {
        id: 'version-1',
        contentId: 'content-1',
        version: 2,
        content: {},
        savedBy: 'admin-1',
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ] as never);

    const response = await GET(createRequest('?subtopicId=11111111-1111-1111-1111-111111111111'));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'version-1',
          version: 2,
          contentId: 'content-1',
          subtopicId: 'subtopic-1',
          difficulty: 'simple',
        }),
      ])
    );
  });
});

