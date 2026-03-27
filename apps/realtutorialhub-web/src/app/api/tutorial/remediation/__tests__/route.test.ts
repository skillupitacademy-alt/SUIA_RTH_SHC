import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getStudentRemediationHistory: vi.fn(),
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

vi.mock('@/server/remediation.service', () => ({
  RemediationService: class RemediationService {
    getStudentRemediationHistory = mocks.getStudentRemediationHistory;
  },
}));

import { GET } from '../route';

const userId = crypto.randomUUID();

const makeRequest = (query = '') => new NextRequest(`http://localhost/api/tutorial/remediation${query}`, { method: 'GET' });

describe('tutorial remediation route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] });
    mocks.getStudentRemediationHistory.mockResolvedValue([
      {
        examResultId: crypto.randomUUID(),
        weakSubtopics: [],
        recommendations: ['notes'],
        overallProgress: { completed: 0, total: 0 },
        status: 'pending',
      },
    ]);
  });

  it('returns the remediation history for the authenticated student', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(mocks.getStudentRemediationHistory).toHaveBeenCalledWith(userId);
  });

  it('returns 403 when the requested userId does not match the session', async () => {
    const response = await GET(makeRequest(`?userId=${crypto.randomUUID()}`));

    expect(response.status).toBe(403);
  });

  it('returns 401 when student auth is missing', async () => {
    mocks.requireStudent.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { statusCode: 401 }));

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
  });
});
