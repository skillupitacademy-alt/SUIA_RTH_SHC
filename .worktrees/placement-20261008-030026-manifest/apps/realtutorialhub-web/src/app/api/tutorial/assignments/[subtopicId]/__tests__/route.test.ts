import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentTierAlreadyCompletedError, AssignmentTierLockedError } from '@quiz/types';

const mocks = vi.hoisted(() => {
  return {
    requireStudent: vi.fn(),
    requireAssignmentAccess: vi.fn(),
    getAssignmentsForSubtopic: vi.fn(),
    startTier: vi.fn(),
    completeTier: vi.fn(),
  };
});

vi.mock('@/lib/assignment-auth', () => ({
  requireStudent: mocks.requireStudent,
  requireAssignmentAccess: mocks.requireAssignmentAccess,
}));

vi.mock('@/lib/assignment', () => ({
  assignmentService: {
    getAssignmentsForSubtopic: mocks.getAssignmentsForSubtopic,
    startTier: mocks.startTier,
    completeTier: mocks.completeTier,
  },
  assignmentDifficultySchema: {
    safeParse: (value: unknown) => {
      if (value === 'simple' || value === 'mixed' || value === 'intermediate' || value === 'expert') {
        return { success: true, data: value };
      }
      return { success: false, error: { issues: [{ message: 'Invalid difficulty' }] } };
    },
  },
  assignmentStartSchema: {
    safeParse: (value: unknown) => {
      if (typeof value === 'object' && value !== null && 'difficulty' in value) {
        return { success: true, data: value as { difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert' } };
      }
      return { success: false, error: { issues: [{ message: 'Invalid payload' }] } };
    },
  },
  assignmentCompleteSchema: {
    safeParse: (value: unknown) => {
      if (typeof value === 'object' && value !== null && 'difficulty' in value) {
        return { success: true, data: value as { difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert' } };
      }
      return { success: false, error: { issues: [{ message: 'Invalid payload' }] } };
    },
  },
}));

import { GET } from '../route';
import { POST as POSTComplete } from '../complete/route';
import { POST as POSTStart } from '../start/route';

const subtopicId = crypto.randomUUID();
const userId = crypto.randomUUID();

const makeGetRequest = (difficulty = 'simple') =>
  new NextRequest(`http://localhost/api/tutorial/assignments/${subtopicId}?difficulty=${difficulty}`, {
    method: 'GET',
  });

const makeJsonRequest = (url: string, body: unknown) =>
  new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const params = { params: Promise.resolve({ subtopicId }) };

describe('assignment routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] });
    mocks.requireAssignmentAccess.mockResolvedValue({ userId, roles: ['student'] });
    mocks.getAssignmentsForSubtopic.mockResolvedValue({
      locked: false,
      assignments: [
        { id: 'assignment-1', question: 'What is a promise?' },
      ],
      progress: { status: 'in_progress' },
      tierStatus: {
        simple: { status: 'self_completed', isUnlocked: true, startedAt: null, completedAt: null },
        mixed: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
        intermediate: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
        expert: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
      },
    });
    mocks.startTier.mockResolvedValue({ id: 'progress-1', status: 'in_progress' });
    mocks.completeTier.mockResolvedValue({ progress: { id: 'progress-1', status: 'self_completed' }, nextUnlockedTier: 'mixed' });
  });

  it('returns assignments for a valid student request', async () => {
    const response = await GET(makeGetRequest(), params);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.locked).toBe(false);
    expect(mocks.getAssignmentsForSubtopic).toHaveBeenCalledWith(userId, subtopicId, 'simple');
  });

  it('returns 401 when student auth is missing', async () => {
    mocks.requireAssignmentAccess.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await GET(makeGetRequest(), params);

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid difficulty', async () => {
    const response = await GET(makeGetRequest('invalid'), params);

    expect(response.status).toBe(400);
  });

  it('starts a tier after validation', async () => {
    const response = await POSTStart(makeJsonRequest(`http://localhost/api/tutorial/assignments/${subtopicId}/start`, {
      difficulty: 'simple',
    }), { params: Promise.resolve({ subtopicId }) });

    expect(response.status).toBe(200);
    expect(mocks.startTier).toHaveBeenCalledWith(userId, subtopicId, 'simple');
  });

  it('returns 403 when starting a locked tier', async () => {
    mocks.startTier.mockRejectedValueOnce(new AssignmentTierLockedError('mixed', 'simple'));

    const response = await POSTStart(makeJsonRequest(`http://localhost/api/tutorial/assignments/${subtopicId}/start`, {
      difficulty: 'mixed',
    }), { params: Promise.resolve({ subtopicId }) });

    expect(response.status).toBe(403);
  });

  it('completes a tier and returns the next unlocked tier', async () => {
    const response = await POSTComplete(makeJsonRequest(`http://localhost/api/tutorial/assignments/${subtopicId}/complete`, {
      difficulty: 'simple',
    }), { params: Promise.resolve({ subtopicId }) });

    expect(response.status).toBe(200);
    expect(mocks.completeTier).toHaveBeenCalledWith(userId, subtopicId, 'simple');
    const json = await response.json();
    expect(json.data.nextUnlockedTier).toBe('mixed');
  });

  it('returns 409 when completing an already completed tier', async () => {
    mocks.completeTier.mockRejectedValueOnce(new AssignmentTierAlreadyCompletedError('simple'));

    const response = await POSTComplete(makeJsonRequest(`http://localhost/api/tutorial/assignments/${subtopicId}/complete`, {
      difficulty: 'simple',
    }), { params: Promise.resolve({ subtopicId }) });

    expect(response.status).toBe(409);
  });
});
