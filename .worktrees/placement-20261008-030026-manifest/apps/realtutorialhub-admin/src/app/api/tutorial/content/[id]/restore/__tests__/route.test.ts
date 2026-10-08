import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const tutorialApiMock = vi.hoisted(() => {
  const dbMock = {
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({})),
  };

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
      withDb: vi.fn(() => tutorialApiMock.tutorialContentRepository),
      findById: vi.fn(),
      getVersionSnapshot: vi.fn(),
      updateById: vi.fn(),
      createAuditEntry: vi.fn(),
    },
    toTutorialContentDTO: vi.fn(),
    logRouteError: vi.fn(),
    dbMock,
  };
});

vi.mock('@/lib/tutorial-content-api', () => tutorialApiMock);
vi.mock('@quiz/db-tutorial', () => ({
  db: tutorialApiMock.dbMock,
}));

import {
  requireAdmin,
  toTutorialContentDTO,
  TutorialAuthError,
  tutorialContentRepository,
} from '@/lib/tutorial-content-api';

import { POST } from '../route';

const content = {
  notes: { markdown: 'Notes' },
  layman: {
    simpleExplanation: 'Simple',
    analogyOrStory: 'Analogy',
    example1: { company: 'A', content: 'One' },
    example2: { company: 'B', content: 'Two' },
  },
  real_life: { title: 'Real', scenario: 'Scenario', bullets: [], tip: 'Tip' },
  technical: { markdown: 'Tech', bullets: [], tip: 'Tip' },
  code: { language: 'javascript', intro: 'Intro', code: 'console.log(1)', steps: [] },
  ai_tutor: { greeting: 'Hello', qa_pairs: [] },
} as const;

function createRequest(body: unknown) {
  return new Request('http://localhost/api/tutorial/content/11111111-1111-1111-1111-111111111111/restore', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/tutorial/content/[id]/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tutorialApiMock.dbMock.transaction).mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({}));
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Forbidden', 403));

    const response = await POST(createRequest({ versionId: '11111111-1111-1111-1111-111111111111' }), {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    });

    expect(response.status).toBe(403);
  });

  it('restores snapshot content for admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ userId: 'admin-1', roles: ['ADMIN'], isAdmin: true } as never);
    vi.mocked(tutorialContentRepository.findById).mockResolvedValueOnce({
      id: 'content-1',
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      contentType: 'standard',
      content,
      version: 3,
      language: 'en',
      isPublished: true,
      generatedByAi: false,
      aiModelUsed: null,
      generationJobId: null,
      adminApprovedBy: null,
      adminApprovedAt: null,
      qualityScore: null,
      regenerationCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as never);
    vi.mocked(tutorialContentRepository.getVersionSnapshot).mockResolvedValueOnce({
      id: 'version-1',
      contentId: 'content-1',
      version: 2,
      content,
      savedBy: 'admin-1',
      createdAt: new Date(),
    } as never);
    vi.mocked(tutorialContentRepository.updateById).mockResolvedValueOnce({
      id: 'content-1',
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
      contentType: 'standard',
      content,
      version: 4,
      language: 'en',
      isPublished: false,
      generatedByAi: false,
      aiModelUsed: null,
      generationJobId: null,
      adminApprovedBy: null,
      adminApprovedAt: null,
      qualityScore: null,
      regenerationCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as never);
    vi.mocked(tutorialContentRepository.createAuditEntry).mockResolvedValueOnce({
      id: 'audit-1',
      contentId: 'content-1',
      userId: 'admin-1',
      action: 'restored',
      diff: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(toTutorialContentDTO).mockReturnValueOnce({ id: 'content-1' } as never);

    const response = await POST(createRequest({ versionId: '22222222-2222-2222-2222-222222222222' }), {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: 'content-1' } });
    expect(tutorialContentRepository.createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'restored' })
    );
  });
});
