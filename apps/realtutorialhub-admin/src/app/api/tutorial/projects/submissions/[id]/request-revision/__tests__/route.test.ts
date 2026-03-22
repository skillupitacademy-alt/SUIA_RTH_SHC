import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getSubmission: vi.fn(),
  updateSubmissionStatus: vi.fn(),
}));

vi.mock('@/lib/tutorial-content-api', () => ({
  TutorialAuthError: class TutorialAuthError extends Error {
    constructor(message: string, public readonly statusCode: 401 | 403) {
      super(message);
      this.name = 'TutorialAuthError';
    }
  },
  isTutorialAuthError: (error: unknown) => error instanceof Error && (error as { statusCode?: number }).statusCode !== undefined,
  requireAdmin: mocks.requireAdmin,
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@quiz/db-tutorial', () => ({
  ProjectRepository: class ProjectRepository {
    getSubmission = mocks.getSubmission;
    updateSubmissionStatus = mocks.updateSubmissionStatus;
    constructor() {}
  },
}));

import { POST } from '../route';

const adminId = crypto.randomUUID();
const submissionId = crypto.randomUUID();

const createRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/tutorial/projects/submissions/${submissionId}/request-revision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('project revision request route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: adminId, roles: ['ADMIN'], isAdmin: true });
    mocks.getSubmission.mockResolvedValue({
      id: submissionId,
      userId: 'user-1',
      projectId: 'project-1',
      status: 'needs_review',
    });
    mocks.updateSubmissionStatus.mockResolvedValue({
      id: submissionId,
      status: 'revision_needed',
    });
  });

  it('requests a revision for admin users', async () => {
    const response = await POST(createRequest({ notes: 'Please revise' }), {
      params: Promise.resolve({ id: submissionId }),
    });

    expect(response.status).toBe(200);
    expect(mocks.updateSubmissionStatus).toHaveBeenCalledWith(
      submissionId,
      'revision_needed',
      expect.objectContaining({
        requestedBy: adminId,
        notes: 'Please revise',
      })
    );
  });

  it('returns 403 for non-admin users', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { statusCode: 403 }));

    const response = await POST(createRequest({ notes: 'Please revise' }), {
      params: Promise.resolve({ id: submissionId }),
    });

    expect(response.status).toBe(403);
  });
});
