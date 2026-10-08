import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformEventTypes } from '@quiz/events';
import { SignatureError } from '@upstash/qstash';

const mocks = vi.hoisted(() => {
  return {
    receiverVerify: vi.fn(),
    redisGet: vi.fn(),
    redisSet: vi.fn(),
    redisDel: vi.fn(),
    indexUpsert: vi.fn(),
    loggerInfo: vi.fn(),
    loggerError: vi.fn(),
    loggerWarn: vi.fn(),
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
    Receiver: class {
      verify = mocks.receiverVerify;
      constructor() {}
    },
    SignatureError: MockSignatureError,
  };
});

vi.mock('@upstash/vector', () => ({
  Index: class {
    upsert = mocks.indexUpsert;
    constructor() {}
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = mocks.redisGet;
    set = mocks.redisSet;
    del = mocks.redisDel;
    constructor() {}
  },
}));

vi.mock('@quiz/db-tutorial', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@quiz/db-tutorial')>();
  return {
    ...actual,
    TutorialContentRepository: class {
      async getPublished() {
        return [];
      }
    },
    withTimeout: async <T>(promise: Promise<T>) => promise,
    STANDARD_QUERY_TIMEOUT: 15_000,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
    debug: vi.fn(),
  },
}));

import { POST } from '../route';

const createEnvelope = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  type: PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED,
  correlationId: crypto.randomUUID(),
  source: 'admin-app',
  occurredAt: new Date('2026-03-22T12:00:00.000Z').toISOString(),
  version: 1,
  data: {
    subtopicId: crypto.randomUUID(),
    approvedBy: crypto.randomUUID(),
    publishedAt: new Date('2026-03-22T12:00:00.000Z').toISOString(),
    version: 1,
    difficulty: 'simple',
    content: {
      notes: { markdown: 'Notes block content', image: null },
      layman: {
        simpleExplanation: 'Simple explanation',
        analogyOrStory: 'Analogy story',
        example1: { company: 'Company A', content: 'Example 1' },
        example2: { company: 'Company B', content: 'Example 2' },
        image: null,
      },
      real_life: {
        title: 'Real life title',
        scenario: 'Real life scenario',
        bullets: [{ label: 'One', detail: 'Detail' }],
        tip: 'Helpful tip',
        image: null,
      },
      technical: {
        markdown: 'Technical notes',
        bullets: [{ term: 'Term', detail: 'Detail' }],
        tip: 'Technical tip',
        image: null,
      },
      code: {
        language: 'javascript',
        intro: 'Code intro',
        code: 'console.log("hello")',
        steps: ['step 1', 'step 2'],
        image: null,
      },
      ai_tutor: {
        greeting: 'Hello',
        qa_pairs: [{ question: 'Q1', answer: 'A1' }],
      },
    },
  },
  ...overrides,
});

const createRequest = (body: unknown, signature = 'valid-signature') =>
  new Request('https://realtutorialhub.test/api/workers/index-content-vector', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'upstash-signature': signature,
    },
    body: JSON.stringify(body),
  });

describe('index-content-vector worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.receiverVerify.mockResolvedValue(undefined);
    mocks.redisGet.mockResolvedValue(null);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.redisDel.mockResolvedValue(1);
    mocks.indexUpsert.mockResolvedValue({ success: true });
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current-signing-key');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next-signing-key');
    vi.stubEnv('UPSTASH_VECTOR_REST_URL', 'https://vector.example.com');
    vi.stubEnv('UPSTASH_VECTOR_REST_TOKEN', 'vector-token');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token');
  });

  it('indexes five chunks for a valid publish payload', async () => {
    const response = await POST(createRequest(createEnvelope()));

    expect(response.status).toBe(200);
    expect(mocks.indexUpsert).toHaveBeenCalledTimes(1);
    const chunks = mocks.indexUpsert.mock.calls[0][0];
    expect(chunks).toHaveLength(5);
    expect(chunks.map((chunk: { id: string }) => chunk.id)).toEqual([
      expect.stringContaining(':notes'),
      expect.stringContaining(':layman'),
      expect.stringContaining(':real_life'),
      expect.stringContaining(':technical'),
      expect.stringContaining(':code'),
    ]);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ai_tutor.vector_indexed',
    }));
  });

  it('skips a duplicate publish for the same version', async () => {
    mocks.redisGet.mockResolvedValueOnce('1');

    const response = await POST(createRequest(createEnvelope()));

    expect(response.status).toBe(200);
    expect(mocks.indexUpsert).not.toHaveBeenCalled();
    expect(mocks.redisSet).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('processing'),
      expect.anything()
    );
  });

  it('returns 401 for an invalid QStash signature', async () => {
    mocks.receiverVerify.mockRejectedValue(new SignatureError('invalid signature'));

    const response = await POST(createRequest(createEnvelope()));

    expect(response.status).toBe(401);
    expect(mocks.indexUpsert).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed payloads', async () => {
    const malformed = createEnvelope({
      data: {
        approvedBy: crypto.randomUUID(),
        publishedAt: new Date('2026-03-22T12:00:00.000Z').toISOString(),
        version: 1,
      },
    });

    const response = await POST(createRequest(malformed));

    expect(response.status).toBe(400);
    expect(mocks.indexUpsert).not.toHaveBeenCalled();
  });

  it('returns 500 and logs an error when vector upsert fails', async () => {
    mocks.indexUpsert.mockRejectedValue(new Error('vector failed'));

    const response = await POST(createRequest(createEnvelope()));

    expect(response.status).toBe(500);
    expect(mocks.loggerError).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ai_tutor.vector_index_failed',
      error: 'vector failed',
    }));
  });
});
