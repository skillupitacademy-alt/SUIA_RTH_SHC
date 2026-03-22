import { SignatureError } from '@upstash/qstash';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakeTx = {};

const mocks = vi.hoisted(() => ({
  mode: 'ok' as 'ok' | 'signature',
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  publishEvent: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
  dbTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx)),
  getSubmission: vi.fn(),
  getProject: vi.fn(),
  updateSubmissionStatus: vi.fn(),
}));

vi.mock('@upstash/qstash', () => ({
  SignatureError: class SignatureError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SignatureError';
    }
  },
  createQStashHandler: (_type: unknown, callback: (envelope: unknown) => Promise<unknown>) => {
    return async (req: Request) => {
      if (mocks.mode === 'signature') {
        throw new SignatureError('invalid signature');
      }
      return callback(await req.json());
    };
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class Redis {
    get = mocks.redisGet;
    set = mocks.redisSet;
    del = vi.fn();
    constructor() {}
  },
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    PROJECT_SUBMITTED: 'project.submitted',
  },
  createQStashHandler: (_type: unknown, callback: (envelope: unknown) => Promise<unknown>) => {
    return async (req: Request) => {
      if (mocks.mode === 'signature') {
        throw new SignatureError('invalid signature');
      }
      return callback(await req.json());
    };
  },
}));

vi.mock('@quiz/db-tutorial', () => ({
  ProjectRepository: class ProjectRepository {
    getSubmission = mocks.getSubmission;
    getProject = mocks.getProject;
    updateSubmissionStatus = mocks.updateSubmissionStatus;
    withDb = vi.fn(function () {
      return this;
    });
  },
  db: {
    transaction: mocks.dbTransaction,
  },
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
  STANDARD_QUERY_TIMEOUT: 30_000,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
  },
}));

import { POST } from '../route';

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/workers/review-project', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('review project worker', () => {
  const submissionId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const projectId = crypto.randomUUID();

  beforeEach(() => {
    mocks.mode = 'ok';
    vi.clearAllMocks();
    mocks.redisGet.mockResolvedValue(null);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.getSubmission.mockResolvedValue({
      id: submissionId,
      userId,
      projectId,
      submissionContent: {
        deliverableUrl: 'https://example.com',
        readme: 'README',
        requirements: 'requirements',
      },
    });
    mocks.getProject.mockResolvedValue({ id: projectId });
    mocks.updateSubmissionStatus.mockResolvedValue({
      id: submissionId,
      status: 'needs_review',
    });
  });

  it('reviews a submission and marks it as needing review', async () => {
    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.submitted',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId,
        userId,
        projectId,
      },
    }));

    expect(response.status).toBe(200);
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.updateSubmissionStatus).toHaveBeenCalledWith(submissionId, 'ai_reviewing');
    expect(mocks.updateSubmissionStatus).toHaveBeenCalledWith(
      submissionId,
      'needs_review',
      expect.objectContaining({
        suggestedStatus: 'needs_review',
      })
    );
  });

  it('returns 200 for duplicate events', async () => {
    mocks.redisGet.mockResolvedValueOnce('processed');

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.submitted',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId,
        userId,
        projectId,
      },
    }));

    expect(response.status).toBe(200);
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it('returns 401 when signature verification fails', async () => {
    mocks.mode = 'signature';

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.submitted',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId,
        userId,
        projectId,
      },
    }));

    expect(response.status).toBe(401);
  });
});
