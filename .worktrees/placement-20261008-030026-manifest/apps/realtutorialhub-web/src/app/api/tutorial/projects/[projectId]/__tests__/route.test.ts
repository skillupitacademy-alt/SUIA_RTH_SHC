import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getProject: vi.fn(),
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
    getProject = mocks.getProject;
  },
}));

import { GET } from '../route';

const userId = crypto.randomUUID();
const projectId = crypto.randomUUID();

const makeRequest = () => new NextRequest(`http://localhost/api/tutorial/projects/${projectId}`, { method: 'GET' });

describe('tutorial project route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] });
    mocks.getProject.mockResolvedValue({
      project: { id: projectId },
      submission: { id: 'submission-1' },
    });
  });

  it('returns the project and submission for authenticated students', async () => {
    const response = await GET(makeRequest(), { params: Promise.resolve({ projectId }) });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(mocks.getProject).toHaveBeenCalledWith(projectId, userId);
  });

  it('returns 401 when student auth is missing', async () => {
    mocks.requireStudent.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await GET(makeRequest(), { params: Promise.resolve({ projectId }) });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid project ids', async () => {
    const response = await GET(new NextRequest('http://localhost/api/tutorial/projects/not-a-uuid', { method: 'GET' }), {
      params: Promise.resolve({ projectId: 'not-a-uuid' }),
    });

    expect(response.status).toBe(400);
  });
});
