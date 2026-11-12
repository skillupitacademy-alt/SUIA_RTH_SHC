import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock('@quiz/auth', () => ({
  TokenService: class {
    getAccessToken = mocks.getAccessToken;
  },
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

import { GET, POST } from '../route';

const userId = crypto.randomUUID();
const subtopicId = crypto.randomUUID();

const makeGetRequest = () =>
  new NextRequest(`http://localhost:3003/api/tutorial/progress?subtopicId=${subtopicId}`, {
    method: 'GET',
  });

const makePostRequest = (body: unknown) =>
  new NextRequest('http://localhost:3003/api/tutorial/progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('tutorial progress route', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('INTERNAL_API_URL', 'http://localhost:3000');
    vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret');
    mocks.getAccessToken.mockReturnValue('rth-token');
    mocks.requireStudent.mockResolvedValue({
      userId,
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

  it('returns the current progress snapshot with private cache-control', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        data: {
          blocksViewed: ['notes', 'layman'],
          blocksCompleted: ['notes', 'layman'],
          completionPercent: 33,
          assignmentUnlocked: false,
        },
      }),
    );

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const json = await response.json();
    expect(json.data.blocksViewed).toEqual(['notes', 'layman']);
    expect(json.data.completionPercent).toBe(33);
    expect(json.data.assignmentUnlocked).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/api/tutorial/progress?subtopicId=${subtopicId}`,
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({
          'X-Brand': 'realtutorialhub',
          'X-User-ID': userId,
          'X-Internal-Secret': 'test-internal-secret',
        }),
      }),
    );
  });

  it('returns 400 for an invalid subtopic id without calling upstream', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3003/api/tutorial/progress?subtopicId=invalid', {
        method: 'GET',
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('records a viewed block and returns the updated snapshot', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        data: {
          blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'],
          completionPercent: 100,
          assignmentUnlocked: true,
        },
      }),
    );

    const response = await POST(
      makePostRequest({ subtopicId, blockType: 'code', status: 'viewed' }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/tutorial/progress',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        headers: expect.objectContaining({
          'X-Brand': 'realtutorialhub',
          'X-User-ID': userId,
          'X-Internal-Secret': 'test-internal-secret',
        }),
      }),
    );
    const json = await response.json();
    expect(json.data.assignmentUnlocked).toBe(true);
  });

  it('returns 400 for invalid payloads without calling upstream', async () => {
    const response = await POST(makePostRequest({ subtopicId, blockType: 'code' }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
