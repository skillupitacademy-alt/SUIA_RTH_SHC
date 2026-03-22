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
    tutorialContentWriteSchema: {
      safeParse: (value: unknown) => {
        if (typeof value !== 'object' || value === null) {
          return {
            success: false,
            error: { issues: [{ path: ['root'], message: 'Invalid payload' }] },
          };
        }

        return { success: true, data: value };
      },
    },
    normalizeTutorialWritePayload: (value: unknown) => value,
    tutorialContentRepository: {
      withDb: vi.fn(() => tutorialApiMock.tutorialContentRepository),
      upsertBlocks: vi.fn(),
      updateById: vi.fn(),
      publish: vi.fn(),
      createAuditEntry: vi.fn(),
      createVersionSnapshot: vi.fn(),
      getVersionSnapshot: vi.fn(),
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

const validContent = {
  notes: { markdown: 'Notes content', image: null },
  layman: {
    simpleExplanation: 'Layman explanation',
    analogyOrStory: 'Analogy story',
    example1: { company: 'Zomato', content: 'Example one' },
    example2: { company: 'Uber', content: 'Example two' },
    image: null,
  },
  real_life: {
    title: 'Real life example',
    scenario: 'Scenario text',
    bullets: [{ label: 'Step 1', detail: 'Detail one' }],
    tip: 'Helpful tip',
    image: null,
  },
  technical: {
    markdown: 'Technical content',
    bullets: [{ term: 'Term', detail: 'Detail' }],
    tip: 'Technical tip',
    image: null,
  },
  code: {
    language: 'javascript',
    intro: 'Code intro',
    code: 'console.log("hello")',
    steps: ['Step 1'],
    image: null,
  },
  ai_tutor: {
    greeting: 'Tutor greeting',
    qa_pairs: [
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
      { question: 'Q3', answer: 'A3' },
    ],
  },
} as const;

function createRequest(body: unknown) {
  return new Request('http://localhost/api/tutorial/content', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/tutorial/content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tutorialApiMock.dbMock.transaction).mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({}));
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Unauthorized', 401));

    const response = await POST(createRequest(validContent));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when authenticated non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Forbidden', 403));

    const response = await POST(createRequest(validContent));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('creates content for admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ userId: 'admin-1', roles: ['ADMIN'], isAdmin: true } as never);
    vi.mocked(tutorialContentRepository.upsertBlocks).mockResolvedValueOnce({
      id: 'content-1',
      subtopicId: '11111111-1111-1111-1111-111111111111',
      difficulty: 'simple',
      contentType: 'standard',
      content: validContent,
      version: 1,
      language: 'en',
      isPublished: false,
      generatedByAi: false,
      aiModelUsed: null,
      generationJobId: null,
      adminApprovedBy: null,
      adminApprovedAt: null,
      qualityScore: null,
      regenerationCount: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    } as never);
    vi.mocked(tutorialContentRepository.createAuditEntry).mockResolvedValueOnce({
      id: 'audit-1',
      contentId: 'content-1',
      userId: 'admin-1',
      action: 'created',
      diff: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as never);
    vi.mocked(toTutorialContentDTO).mockReturnValueOnce({ id: 'content-1' } as never);

    const response = await POST(createRequest({
      subtopicId: '11111111-1111-1111-1111-111111111111',
      difficulty: 'simple',
      content: validContent,
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: { id: 'content-1' } });
    expect(tutorialContentRepository.createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'created' })
    );
  });
});
