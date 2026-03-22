import { SignatureError } from '@upstash/qstash';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakeTx = {
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(async () => [{
        id: 'certificate-1',
        userId: 'user-1',
        scope: 'topic',
        parentId: 'parent-1',
        parentName: 'Topic One',
        verificationCode: 'verification-1',
        issuedAt: new Date('2026-01-01T00:00:00.000Z'),
      }]),
    })),
  })),
};

const mocks = vi.hoisted(() => ({
  mode: 'ok' as 'ok' | 'signature',
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  publishEvent: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
  dbTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx)),
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
    CERTIFICATE_ISSUED: 'certificate.issued',
  },
  createQStashHandler: (_type: unknown, callback: (envelope: unknown) => Promise<unknown>) => {
    return async (req: Request) => {
      if (mocks.mode === 'signature') {
        throw new SignatureError('invalid signature');
      }
      return callback(await req.json());
    };
  },
  publishEvent: mocks.publishEvent,
}));

vi.mock('@quiz/db-tutorial', () => ({
  certificates: {},
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => []),
      })),
    })),
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
  new Request('http://localhost/api/workers/issue-certificate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('issue certificate worker', () => {
  const userId = crypto.randomUUID();
  const parentId = crypto.randomUUID();
  beforeEach(() => {
    mocks.mode = 'ok';
    vi.clearAllMocks();
    process.env.QSTASH_TOKEN = 'test-token';
    process.env.CERTIFICATE_ISSUED_EVENT_URL = 'https://tutorial.example.com/api/events/certificate-issued';
    mocks.redisGet.mockResolvedValue(null);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.publishEvent.mockResolvedValue({ messageId: 'event-1', envelope: {} });
  });

  it('issues a certificate and publishes the issued event', async () => {
    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.certificate_requested',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        userId,
        scope: 'topic',
        parentId,
        parentName: 'Topic One',
      },
    }));

    expect(response.status).toBe(200);
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.publishEvent).toHaveBeenCalledTimes(1);
  });

  it('returns 200 for duplicate events', async () => {
    mocks.redisGet.mockResolvedValueOnce('processed');

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.certificate_requested',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        userId,
        scope: 'topic',
        parentId,
        parentName: 'Topic One',
      },
    }));

    expect(response.status).toBe(200);
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it('returns 401 when signature verification fails', async () => {
    mocks.mode = 'signature';

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'project.certificate_requested',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        userId,
        scope: 'topic',
        parentId,
        parentName: 'Topic One',
      },
    }));

    expect(response.status).toBe(401);
  });
});
