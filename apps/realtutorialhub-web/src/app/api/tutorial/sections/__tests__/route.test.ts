import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
}));

vi.mock('@/lib/assignment-auth', () => ({
  AssignmentAuthError: class AssignmentAuthError extends Error {
    constructor(message: string, public readonly statusCode: 401 | 403 = 401) {
      super(message);
      this.name = 'AssignmentAuthError';
    }
  },
  requireStudent: mocks.requireStudent,
}));

import { AssignmentAuthError } from '@/lib/assignment-auth';
import { GET } from '../[subtopicId]/route';

describe('GET /api/tutorial/sections/[subtopicId]', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('INTERNAL_API_URL', 'http://localhost:3000');
    vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret');
    mocks.requireStudent.mockResolvedValue({
      userId: 'rth-student-1',
      brand: 'realtutorialhub',
      roles: ['student'],
    });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should return 404 when subtopic not found upstream', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: 'Subtopic not found' }, { status: 404 }),
    );

    const request = new NextRequest('http://localhost:3003/api/tutorial/sections/non-existent');
    const context = { params: Promise.resolve({ subtopicId: 'non-existent' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Subtopic not found');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('should return sections for valid subtopic with RTH brand headers and private cache-control', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        subtopicId: 'component-architecture',
        subtopicName: 'Component Architecture',
        sections: {
          notes: { simpleWords: 'Test content' },
          layman: { overview: 'Test overview' },
        },
        totalSections: 2,
      }),
    );

    const request = new NextRequest('http://localhost:3003/api/tutorial/sections/component-architecture');
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(data.subtopicId).toBe('component-architecture');
    expect(data.subtopicName).toBe('Component Architecture');
    expect(data.sections.notes).toBeDefined();
    expect(data.sections.layman).toBeDefined();
    expect(data.totalSections).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/tutorial/sections/component-architecture',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({
          'X-Brand': 'realtutorialhub',
          'X-User-ID': 'rth-student-1',
          'X-Internal-Secret': 'test-internal-secret',
        }),
      }),
    );
  });

  it('should forward difficulty and sectionType query parameters to upstream', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        subtopicId: 'component-architecture',
        difficulty: 'intermediate',
        sectionType: 'notes',
        content: { simpleWords: 'Test content' },
      }),
    );

    const request = new NextRequest(
      'http://localhost:3003/api/tutorial/sections/component-architecture?difficulty=intermediate&sectionType=notes',
    );
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.difficulty).toBe('intermediate');
    expect(data.sectionType).toBe('notes');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/tutorial/sections/component-architecture?difficulty=intermediate&sectionType=notes',
      expect.any(Object),
    );
  });

  it('should reject unauthenticated or wrong-brand callers before calling upstream', async () => {
    mocks.requireStudent.mockRejectedValueOnce(new AssignmentAuthError('Forbidden - brand mismatch', 403));

    const request = new NextRequest('http://localhost:3003/api/tutorial/sections/component-architecture');
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should handle upstream transport errors gracefully with sanitized 500 response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3003/api/tutorial/sections/component-architecture');
    const context = { params: Promise.resolve({ subtopicId: 'component-architecture' }) };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
