import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformEventTypes } from '@quiz/events';
import { SignatureError } from '@upstash/qstash';

const mocks = vi.hoisted(() => {
  const state = {
    selectRows: [] as Array<Record<string, unknown>>,
    insertRows: [] as Array<Record<string, unknown>>,
    updateRows: [] as Array<Record<string, unknown>>,
    dbInsertThrows: null as Error | null,
    dbUpdateThrows: null as Error | null,
  };

  const dbInsertReturning = vi.fn(async () => {
    if (state.dbInsertThrows !== null) {
      throw state.dbInsertThrows;
    }
    return state.insertRows;
  });

  const dbUpdateReturning = vi.fn(async () => {
    if (state.dbUpdateThrows !== null) {
      throw state.dbUpdateThrows;
    }
    return state.updateRows;
  });

  const transactionClient = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: dbInsertReturning,
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: dbUpdateReturning,
        })),
      })),
    })),
  };

  return {
    state,
    receiverVerify: vi.fn(),
    redisGet: vi.fn(),
    redisSet: vi.fn(),
    redisDel: vi.fn(),
    publishJSON: vi.fn(),
    dbSelectWhere: vi.fn(async () => state.selectRows),
    dbInsertReturning,
    dbUpdateReturning,
    dbTransaction: vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient)
    ),
    loggerInfo: vi.fn(),
    loggerError: vi.fn(),
    withTimeout: vi.fn((promise: Promise<unknown>) => promise),
  };
});

vi.mock('@upstash/qstash', () => {
  class MockSignatureError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SignatureError';
    }
  }

  return {
    Client: class {
      publishJSON = mocks.publishJSON;
      constructor() {}
    },
    Receiver: class {
      verify = mocks.receiverVerify;
      constructor() {}
    },
    SignatureError: MockSignatureError,
  };
});

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = mocks.redisGet;
    set = mocks.redisSet;
    del = mocks.redisDel;
    constructor() {}
  },
}));

vi.mock('@quiz/db-tutorial', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: mocks.dbSelectWhere,
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mocks.dbInsertReturning,
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: mocks.dbUpdateReturning,
        })),
      })),
    })),
    transaction: mocks.dbTransaction,
  },
  remediationTriggers: { name: 'remediation_triggers' },
  STANDARD_QUERY_TIMEOUT: 15_000,
  withTimeout: mocks.withTimeout,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { POST } from '../route';

const createEnvelope = (data: Record<string, unknown>) => ({
  id: crypto.randomUUID(),
  type: PlatformEventTypes.EXAM_COMPLETED,
  correlationId: crypto.randomUUID(),
  source: 'exam-engine',
  occurredAt: new Date('2026-03-22T12:00:00.000Z').toISOString(),
  version: 1,
  data,
});

const createRequest = (data: Record<string, unknown>, signature = 'valid-signature') =>
  new Request('https://realtutorialhub.test/api/workers/handle-exam-completed', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'upstash-signature': signature,
    },
    body: JSON.stringify(createEnvelope(data)),
  });

describe('handle-exam-completed worker', () => {
  const userId = crypto.randomUUID();
  const examResultId = crypto.randomUUID();
  const weakSubtopics = [
    {
      subtopicId: crypto.randomUUID(),
      subtopicName: 'Promise chains',
      score: 41,
      threshold: 60,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.selectRows = [];
    mocks.state.insertRows = [
      {
        id: crypto.randomUUID(),
        examResultId,
        userId,
        weakSubtopicIds: weakSubtopics.map((item) => item.subtopicId),
        recommendedContentTypes: [],
        status: 'pending',
        createdAt: new Date('2026-03-22T12:00:00.000Z'),
        updatedAt: new Date('2026-03-22T12:00:00.000Z'),
        deletedAt: null,
      },
    ];
    mocks.state.updateRows = [
      {
        ...mocks.state.insertRows[0],
        status: 'completed',
      },
    ];
    mocks.state.dbInsertThrows = null;
    mocks.state.dbUpdateThrows = null;

    mocks.receiverVerify.mockResolvedValue(undefined);
    mocks.redisGet.mockResolvedValue(null);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.redisDel.mockResolvedValue(1);
    mocks.publishJSON.mockResolvedValue({ messageId: 'msg_123' });

    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current-signing-key');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next-signing-key');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token');
    vi.stubEnv('QSTASH_TOKEN', 'qstash-token');
  });

  it('creates a remediation trigger and enqueues a notification for weak subtopics', async () => {
    const response = await POST(createRequest({
      userId,
      examResultId,
      weakSubtopics,
    }));

    expect(response.status).toBe(200);
    expect(mocks.dbSelectWhere).toHaveBeenCalledTimes(1);
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.publishJSON).toHaveBeenCalledTimes(1);
    expect(mocks.publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://realtutorialhub.test/api/workers/send-remediation-notification',
        body: {
          userId,
          examResultId,
          weakSubtopics,
        },
        retries: 3,
      })
    );
    expect(mocks.redisSet).toHaveBeenNthCalledWith(1, `remediation:${examResultId}`, 'processing', { ex: 86_400, nx: true });
    expect(mocks.redisSet).toHaveBeenNthCalledWith(2, `remediation:${examResultId}`, 'processed', { ex: 86_400 });
    expect(mocks.loggerError).not.toHaveBeenCalled();
  });

  it('returns 200 and skips the DB write for duplicate examResultId values', async () => {
    mocks.redisGet.mockResolvedValue('processed');

    const response = await POST(createRequest({
      userId,
      examResultId,
      weakSubtopics,
    }));

    expect(response.status).toBe(200);
    expect(mocks.dbSelectWhere).not.toHaveBeenCalled();
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
    expect(mocks.publishJSON).not.toHaveBeenCalled();
    expect(mocks.redisSet).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid QStash signature', async () => {
    mocks.receiverVerify.mockRejectedValue(new SignatureError('invalid signature'));

    const response = await POST(createRequest({
      userId,
      examResultId,
      weakSubtopics,
    }));

    expect(response.status).toBe(401);
    expect(mocks.dbSelectWhere).not.toHaveBeenCalled();
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
    expect(mocks.publishJSON).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed payloads', async () => {
    const malformed = createEnvelope({
      examResultId,
      weakSubtopics,
    });

    const response = await POST(new Request('https://realtutorialhub.test/api/workers/handle-exam-completed', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'upstash-signature': 'valid-signature',
      },
      body: JSON.stringify(malformed),
    }));

    expect(response.status).toBe(400);
    expect(mocks.dbSelectWhere).not.toHaveBeenCalled();
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
    expect(mocks.publishJSON).not.toHaveBeenCalled();
  });

  it('accepts an empty weakSubtopics array without enqueueing a notification', async () => {
    const response = await POST(createRequest({
      userId,
      examResultId,
      weakSubtopics: [],
    }));

    expect(response.status).toBe(200);
    expect(mocks.publishJSON).not.toHaveBeenCalled();
    expect(mocks.dbTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.redisSet).toHaveBeenNthCalledWith(2, `remediation:${examResultId}`, 'processed', { ex: 86_400 });
  });

  it('returns 500 and logs transaction and worker errors when the DB write fails', async () => {
    mocks.state.dbUpdateThrows = new Error('db failed');

    const response = await POST(createRequest({
      userId,
      examResultId,
      weakSubtopics,
    }));

    expect(response.status).toBe(500);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'transaction_failed',
        operation: 'handle-exam-completed.remediation-upsert',
        error: 'db failed',
        context: { userId, examResultId },
      })
    );
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'remediation.worker_failed',
        examResultId,
        userId,
        error: 'db failed',
      })
    );
    expect(mocks.redisDel).toHaveBeenCalledWith(`remediation:${examResultId}`);
  });
});
