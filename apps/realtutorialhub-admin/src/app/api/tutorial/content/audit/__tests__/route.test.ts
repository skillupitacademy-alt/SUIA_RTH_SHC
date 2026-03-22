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
        getAuditEntries: vi.fn(),
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
  return new Request(`http://localhost/api/tutorial/content/audit${query}`, {
    method: 'GET',
  }) as NextRequest;
}

describe('GET /api/tutorial/content/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Forbidden', 403));

    const response = await GET(createRequest());

    expect(response.status).toBe(403);
  });

  it('returns audit entries for admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ userId: 'admin-1', roles: ['ADMIN'], isAdmin: true } as never);
    vi.mocked(tutorialContentRepository.getAuditEntries).mockResolvedValueOnce([
      {
        id: 'audit-1',
        contentId: 'content-1',
        userId: 'admin-1',
        action: 'published',
        diff: { after: true },
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ] as never);

    const response = await GET(createRequest('?contentId=11111111-1111-1111-1111-111111111111&limit=10'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'audit-1', action: 'published' }),
        ]),
      })
    );
  });

  it('returns audit entries for a subtopic filter', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ userId: 'admin-1', roles: ['ADMIN'], isAdmin: true } as never);
    vi.mocked(tutorialContentRepository.findBySubtopicId).mockResolvedValueOnce([
      { id: 'content-1' },
      { id: 'content-2' },
    ] as never);
    vi.mocked(tutorialContentRepository.getAuditEntries).mockResolvedValue([
      {
        id: 'audit-1',
        contentId: 'content-1',
        userId: 'admin-1',
        action: 'updated',
        diff: { after: true },
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ] as never);

    const response = await GET(createRequest('?subtopicId=11111111-1111-1111-1111-111111111111'));

    expect(response.status).toBe(200);
    expect(tutorialContentRepository.findBySubtopicId).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });
});
