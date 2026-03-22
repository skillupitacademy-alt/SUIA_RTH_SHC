import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getSubmission: vi.fn(),
  updateSubmissionStatus: vi.fn(),
  getProject: vi.fn(),
  publishJSON: vi.fn(),
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
    getProject = mocks.getProject;
    constructor() {}
  },
}));

vi.mock('@upstash/qstash', () => ({
  Client: class Client {
    publishJSON = mocks.publishJSON;
    constructor() {}
  },
}));

import { POST } from '../route';

const adminId = crypto.randomUUID();
const submissionId = crypto.randomUUID();

const createRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/tutorial/projects/submissions/${submissionId}/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('project approval route', () => {
  beforeEach(() => {
    process.env.QSTASH_TOKEN = 'test-token';
    process.env.NEXT_PUBLIC_APP_URL = 'https://tutorial.example.com';
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
      status: 'approved',
    });
    mocks.getProject.mockResolvedValue({
      id: 'project-1',
      badgeId: 'badge-1',
    });
    mocks.publishJSON.mockResolvedValue({ messageId: 'msg-1' });
  });

  it('approves a submission and enqueues badge awarding', async () => {
    const response = await POST(createRequest({ notes: 'Looks good' }), {
      params: Promise.resolve({ id: submissionId }),
    });

    expect(response.status).toBe(200);
    expect(mocks.updateSubmissionStatus).toHaveBeenCalledWith(
      submissionId,
      'approved',
      expect.objectContaining({
        approvedBy: adminId,
        notes: 'Looks good',
      })
    );
    expect(mocks.publishJSON).toHaveBeenCalledTimes(1);
  });

  it('returns 403 for non-admin users', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { statusCode: 403 }));

    const response = await POST(createRequest({ notes: 'Looks good' }), {
      params: Promise.resolve({ id: submissionId }),
    });

    expect(response.status).toBe(403);
  });
});
