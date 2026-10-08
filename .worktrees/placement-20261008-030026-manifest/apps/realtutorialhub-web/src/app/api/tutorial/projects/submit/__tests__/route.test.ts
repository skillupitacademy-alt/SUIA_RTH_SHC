import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectNotEligibleError } from '@quiz/types';

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  submitProject: vi.fn(),
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
    submitProject = mocks.submitProject;
  },
}));

import { POST } from '../route';

const userId = crypto.randomUUID();
const projectId = crypto.randomUUID();

const createRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/tutorial/projects/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('tutorial project submit route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] });
    mocks.submitProject.mockResolvedValue({ submissionId: 'submission-1' });
  });

  it('submits a project for authenticated students', async () => {
    const response = await POST(createRequest({
      projectId,
      deliverable: { repoUrl: 'https://github.com/example/repo' },
    }));

    expect(response.status).toBe(202);
    expect(mocks.submitProject).toHaveBeenCalledWith(
      userId,
      projectId,
      expect.objectContaining({ repoUrl: 'https://github.com/example/repo' })
    );
  });

  it('returns 403 when the project is not eligible', async () => {
    mocks.submitProject.mockRejectedValueOnce(new ProjectNotEligibleError('missing subtopic'));

    const response = await POST(createRequest({
      projectId,
      deliverable: { repoUrl: 'https://github.com/example/repo' },
    }));

    expect(response.status).toBe(403);
  });

  it('returns 401 when student auth is missing', async () => {
    mocks.requireStudent.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await POST(createRequest({
      projectId,
      deliverable: { repoUrl: 'https://github.com/example/repo' },
    }));

    expect(response.status).toBe(401);
  });

  it('returns 400 for malformed payloads', async () => {
    const response = await POST(createRequest({
      deliverable: { repoUrl: 'https://github.com/example/repo' },
    }));

    expect(response.status).toBe(400);
  });
});
