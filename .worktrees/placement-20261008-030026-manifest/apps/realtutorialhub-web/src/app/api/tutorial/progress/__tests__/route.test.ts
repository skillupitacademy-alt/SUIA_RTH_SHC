import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getProgress: vi.fn(),
  markBlockComplete: vi.fn(),
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

vi.mock('@quiz/db-tutorial', () => ({
  TutorialProgressRepository: class TutorialProgressRepository {
    getProgress = mocks.getProgress;

    markBlockComplete = mocks.markBlockComplete;
  },
}));

import { GET, POST } from '../route';

const userId = crypto.randomUUID();
const subtopicId = crypto.randomUUID();

const makeGetRequest = () => new NextRequest(`http://localhost/api/tutorial/progress?subtopicId=${subtopicId}`, { method: 'GET' });

const makePostRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/tutorial/progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('tutorial progress route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] });
    mocks.getProgress.mockResolvedValue({
      id: 'progress-1',
      userId,
      subtopicId,
      status: 'in_progress',
      blocksCompleted: ['notes', 'layman'],
      remediationTriggered: false,
      score: null,
      timeSpentSec: 0,
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    mocks.markBlockComplete.mockResolvedValue({
      id: 'progress-1',
      userId,
      subtopicId,
      status: 'completed',
      blocksCompleted: ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'],
      remediationTriggered: false,
      score: null,
      timeSpentSec: 0,
      completedAt: new Date(),
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  });

  it('returns the current progress snapshot', async () => {
    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.blocksViewed).toEqual(['notes', 'layman']);
    expect(json.data.completionPercent).toBe(33);
    expect(json.data.assignmentUnlocked).toBe(false);
  });

  it('returns 400 for an invalid subtopic id', async () => {
    const response = await GET(new NextRequest('http://localhost/api/tutorial/progress?subtopicId=invalid', { method: 'GET' }));

    expect(response.status).toBe(400);
  });

  it('records a viewed block and returns the updated snapshot', async () => {
    const response = await POST(
      makePostRequest({ subtopicId, blockType: 'code', status: 'viewed' })
    );

    expect(response.status).toBe(200);
    expect(mocks.markBlockComplete).toHaveBeenCalledWith(userId, subtopicId, 'code');
    const json = await response.json();
    expect(json.data.assignmentUnlocked).toBe(true);
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(makePostRequest({ subtopicId, blockType: 'code' }));

    expect(response.status).toBe(400);
  });
});
