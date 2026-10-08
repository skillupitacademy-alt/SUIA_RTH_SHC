import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getMyProjects: vi.fn(),
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

vi.mock('@/server/project.service', () => ({
  ProjectService: class ProjectService {
    getMyProjects = mocks.getMyProjects;
  },
}));

import { GET } from '../route';

const userId = crypto.randomUUID();

const makeRequest = () => new NextRequest('http://localhost/api/tutorial/projects/submissions', { method: 'GET' });

describe('tutorial project submissions route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] });
    mocks.getMyProjects.mockResolvedValue([{ id: 'submission-1' }]);
  });

  it('returns submissions for authenticated students', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(mocks.getMyProjects).toHaveBeenCalledWith(userId);
  });

  it('returns 401 when student auth is missing', async () => {
    mocks.requireStudent.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
  });
});
