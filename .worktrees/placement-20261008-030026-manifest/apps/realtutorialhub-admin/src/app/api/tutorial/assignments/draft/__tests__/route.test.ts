import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const tutorialApiMock = vi.hoisted(() => {
  class TutorialAuthError extends Error {
    constructor(message: string, public readonly statusCode: 401 | 403) {
      super(message);
      this.name = 'TutorialAuthError';
    }
  }

  const dbMock = {
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(async () => [{ id: 'draft-1' }]),
        })),
      })),
    })),
  };

  return {
    TutorialAuthError,
    isTutorialAuthError: (error: unknown) => error instanceof TutorialAuthError,
    requireAdmin: vi.fn(),
    logRouteError: vi.fn(),
    dbMock,
    tutorialAssignments: {
      insert: vi.fn(),
    },
  };
});

vi.mock('@/lib/tutorial-content-api', () => tutorialApiMock);
vi.mock('@quiz/db-tutorial', () => ({
  db: tutorialApiMock.dbMock,
  tutorialAssignments: tutorialApiMock.tutorialAssignments,
}));

import { requireAdmin, TutorialAuthError } from '@/lib/tutorial-content-api';

import { POST } from '../route';

function createRequest(body: unknown) {
  return new Request('http://localhost/api/tutorial/assignments/draft', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/tutorial/assignments/draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Forbidden', 403));

    const response = await POST(createRequest({}));

    expect(response.status).toBe(403);
  });

  it('returns draft id for admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ userId: 'admin-1', roles: ['ADMIN'], isAdmin: true } as never);

    const response = await POST(createRequest({
      subtopicId: '11111111-1111-1111-1111-111111111111',
      difficulty: 'simple',
      assignments: [
        {
          question_type: 'mcq',
          question: 'What is a promise?',
          hints: ['Think async'],
          reference_answer: 'A future value placeholder',
        },
      ],
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ draftId: 'draft-1' });
  });
});
