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
      upsertBlocks: vi.fn(),
      updateById: vi.fn(),
      publish: vi.fn(),
    },
    toTutorialContentDTO: vi.fn(),
    logRouteError: vi.fn(),
  };
});

vi.mock('@/lib/tutorial-content-api', () => tutorialApiMock);

const eventsMock = vi.hoisted(() => ({
  publishEvent: vi.fn(async () => ({
    messageId: 'msg-1',
    envelope: {
      id: 'envelope-1',
      type: 'content.approved_and_published',
      correlationId: 'correlation-1',
      source: 'admin-app',
      occurredAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      version: 1,
      data: {},
    },
  })),
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    CONTENT_APPROVED_AND_PUBLISHED: 'content.approved_and_published',
  },
  publishEvent: eventsMock.publishEvent,
}));

const cacheMock = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: cacheMock.revalidateTag,
}));

import { publishEvent } from '@quiz/events';

import {
  requireAdmin,
  toTutorialContentDTO,
  TutorialAuthError,
  tutorialContentRepository,
} from '@/lib/tutorial-content-api';

import { POST } from '../route';

function createRequest() {
  return new Request('http://localhost/api/tutorial/content/11111111-1111-1111-1111-111111111111/publish', {
    method: 'POST',
  }) as NextRequest;
}

describe('POST /api/tutorial/content/[id]/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Unauthorized', 401));

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when authenticated non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new TutorialAuthError('Forbidden', 403));

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('publishes content for admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ userId: 'admin-1', roles: ['ADMIN'], isAdmin: true } as never);
    vi.mocked(tutorialContentRepository.publish).mockResolvedValueOnce({
      id: 'content-1',
      subtopicId: '11111111-1111-1111-1111-111111111111',
      difficulty: 'simple',
      contentType: 'standard',
      content: {},
      version: 2,
      language: 'en',
      isPublished: true,
      generatedByAi: false,
      aiModelUsed: null,
      generationJobId: null,
      adminApprovedBy: null,
      adminApprovedAt: null,
      qualityScore: null,
      regenerationCount: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      deletedAt: null,
    } as never);
    vi.mocked(toTutorialContentDTO).mockReturnValueOnce({ id: 'content-1' } as never);

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: 'content-1' }, revalidated: true });
    expect(cacheMock.revalidateTag).toHaveBeenCalledWith('tutorial-content:11111111-1111-1111-1111-111111111111', 'max');
    expect(cacheMock.revalidateTag).toHaveBeenCalledWith('tutorial-content', 'max');
    expect(publishEvent).toHaveBeenCalledWith(
      'content.approved_and_published',
      expect.objectContaining({
        subtopicId: '11111111-1111-1111-1111-111111111111',
        approvedBy: 'admin-1',
        version: 2,
      }),
      expect.objectContaining({
        destinationUrl: expect.stringContaining('/api/workers/index-content-vector'),
        source: 'admin-app',
      })
    );
  });
});
