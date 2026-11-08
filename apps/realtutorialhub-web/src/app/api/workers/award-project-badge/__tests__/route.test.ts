import { SignatureError } from '@upstash/qstash';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIsolatedTestOutboxRepository } from '../../worker-lease';

const testOutboxRepo = createIsolatedTestOutboxRepository();

const fakeTx = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => []),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(async () => []),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  })),
  upsertIntent: (input: any) => testOutboxRepo.upsertIntent!(input),
};

const mocks = vi.hoisted(() => ({
  mode: 'ok' as 'ok' | 'signature',
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  publishJSON: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
  dbTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx)),
  getSubmission: vi.fn(),
  updateSubmissionStatus: vi.fn(),
  getProject: vi.fn(),
  awardBadge: vi.fn(),
  checkCertificateEligibility: vi.fn(),
}));

vi.mock('@upstash/qstash', () => ({
  SignatureError: class SignatureError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SignatureError';
    }
  },
  Client: class Client {
    publishJSON = mocks.publishJSON;
    constructor() {}
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
    eval = vi.fn(async (_script: string, _keys: string[], _args: Array<string | number>) => 1);
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

vi.mock('../../qstash', () => ({
  verifyQStashRequest: vi.fn(async (request: Request) => {
    if (mocks.mode === 'signature') {
      throw new SignatureError('invalid signature');
    }
    return request.text();
  }),
}));

vi.mock('@quiz/db-tutorial', () => ({
  ProjectRepository: class ProjectRepository {
    getSubmission = mocks.getSubmission;
    updateSubmissionStatus = mocks.updateSubmissionStatus;
    getProject = mocks.getProject;
    awardBadge = mocks.awardBadge;
    withDb = vi.fn(function (this: object) {
      return this;
    });
  },
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => []),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => undefined),
      })),
    })),
    claimIntent: (input: any) => testOutboxRepo.claimIntent(input),
    markPublished: (input: any) => testOutboxRepo.markPublished(input),
    markFailed: (input: any) => testOutboxRepo.markFailed(input),
    findIntent: (t: any, e: any, a: any) => testOutboxRepo.findIntent!(t, e, a),
    upsertIntent: (input: any) => testOutboxRepo.upsertIntent!(input),
    transaction: mocks.dbTransaction,
  },
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
  STANDARD_QUERY_TIMEOUT: 30_000,
  tutorialProjectSubmissions: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
  },
}));

vi.mock('@/server/project.service', () => ({
  ProjectService: class ProjectService {
    checkCertificateEligibility = mocks.checkCertificateEligibility;
  },
}));

import { POST } from '../route';

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/workers/award-project-badge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('award project badge worker', () => {
  const submissionId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const projectId = crypto.randomUUID();
  const badgeId = crypto.randomUUID();

  beforeEach(() => {
    mocks.mode = 'ok';
    vi.clearAllMocks();
    vi.stubEnv('QSTASH_TOKEN', 'test-token');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://tutorial.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    mocks.redisGet.mockResolvedValue(null);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.getSubmission.mockResolvedValue({
      id: submissionId,
      userId,
      projectId,
    });
    mocks.getProject.mockResolvedValue({
      id: projectId,
      scope: 'topic',
      parentId: crypto.randomUUID(),
    });
    mocks.awardBadge.mockResolvedValue({
      id: 'student-badge-1',
      userId,
      badgeId,
    });
    mocks.checkCertificateEligibility.mockResolvedValue({
      eligible: true,
      missingRequirements: [],
    });
  });

  it('awards a badge and publishes the certificate worker when eligible', async () => {
    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.approved',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId,
        userId,
        projectId,
        badgeId,
      },
    }));

    const responseText = await response.clone().text();
    if (response.status !== 200) console.log('Response Error:', responseText);
    expect(response.status).toBe(200);
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.publishJSON).toHaveBeenCalledTimes(1);
  });

  it('returns 200 for duplicate events', async () => {
    mocks.redisGet.mockResolvedValueOnce('processed');

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.approved',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId,
        userId,
        projectId,
        badgeId,
      },
    }));

    expect(response.status).toBe(200);
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it('returns 401 when signature verification fails', async () => {
    mocks.mode = 'signature';

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.approved',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId,
        userId,
        projectId,
        badgeId,
      },
    }));

    expect(response.status).toBe(401);
  });

  it('fails closed with 500 when QSTASH_TOKEN is absent', async () => {
    vi.stubEnv('QSTASH_TOKEN', '');
    const freshSubmissionId = crypto.randomUUID();
    mocks.getSubmission.mockResolvedValueOnce({
      id: freshSubmissionId,
      userId,
      projectId,
    });

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.approved',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        submissionId: freshSubmissionId,
        userId,
        projectId,
        badgeId,
      },
    }));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('error');
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('QSTASH_TOKEN'),
      })
    );
  });
});
