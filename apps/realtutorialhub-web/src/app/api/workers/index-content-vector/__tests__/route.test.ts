const validWorkerSignature = `header.${Buffer.from(JSON.stringify({ sub: 'https://realtutorialhub.test/api/workers/index-content-vector' })).toString('base64url')}.signature`;
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformEventTypes } from '@quiz/events';
import { SignatureError } from '@upstash/qstash';

const mocks = vi.hoisted(() => {
  return {
    receiverVerify: vi.fn(),
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

const createRequest = (body: unknown, signature = validWorkerSignature) =>
  new Request('https://realtutorialhub.test/api/workers/index-content-vector', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'upstash-signature': signature,
    },
    body: JSON.stringify(body),
  });

describe('index-content-vector worker (Retired Lifecycle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.receiverVerify.mockResolvedValue(undefined);
    mocks.indexUpsert.mockResolvedValue({ success: true });
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current-signing-key');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next-signing-key');
  });

  it('terminates with 200 and zero vector upserts when legacy content is present inline', async () => {
    const response = await POST(createRequest(createEnvelope()));

    expect(response.status).toBe(200);
    expect(mocks.indexUpsert).not.toHaveBeenCalled();
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ai_tutor.vector_index_retired',
      })
    );
  });

  it('terminates with 200 and zero vector upserts when legacy content is absent', async () => {
    const envelopeWithoutContent = createEnvelope();
    delete (envelopeWithoutContent.data as Record<string, unknown>).content;

    const response = await POST(createRequest(envelopeWithoutContent));

    expect(response.status).toBe(200);
    expect(mocks.indexUpsert).not.toHaveBeenCalled();
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ai_tutor.vector_index_retired',
      })
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
});
