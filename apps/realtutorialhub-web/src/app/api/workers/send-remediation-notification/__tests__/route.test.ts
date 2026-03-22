import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformEventTypes } from '@quiz/events';
import { SignatureError } from '@upstash/qstash';

const mocks = vi.hoisted(() => {
  return {
    receiverVerify: vi.fn(),
    publishJSON: vi.fn(),
    loggerInfo: vi.fn(),
    loggerError: vi.fn(),
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
    },
    Receiver: class {
      verify = mocks.receiverVerify;
    },
    SignatureError: MockSignatureError,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
  },
}));

import { POST } from '../route';

const createEnvelope = (data: Record<string, unknown>) => ({
  id: crypto.randomUUID(),
  type: PlatformEventTypes.EXAM_COMPLETED,
  correlationId: crypto.randomUUID(),
  source: 'exam-engine',
  occurredAt: new Date().toISOString(),
  version: 1,
  data,
});

const createRequest = (data: Record<string, unknown>, signature = 'valid-signature') =>
  new Request('https://realtutorialhub.test/api/workers/send-remediation-notification', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'upstash-signature': signature,
    },
    body: JSON.stringify(createEnvelope(data)),
  });

describe('send-remediation-notification worker', () => {
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
    mocks.receiverVerify.mockResolvedValue(undefined);

    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current-signing-key');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next-signing-key');
    vi.stubEnv('QSTASH_TOKEN', 'qstash-token');
  });

  it('processes remediation notification successfully', async () => {
    const response = await POST(createRequest({
      userId,
      examResultId,
      weakSubtopics,
    }));

    expect(response.status).toBe(200);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'remediation.notification.received',
        userId,
        examResultId,
        weakCount: 1,
      })
    );
  });

  it('returns 401 for invalid QStash signature', async () => {
    mocks.receiverVerify.mockRejectedValue(new SignatureError('invalid signature'));

    const response = await POST(createRequest({
      userId,
      examResultId,
      weakSubtopics,
    }));

    expect(response.status).toBe(401);
  });

  it('returns 400 for malformed payloads', async () => {
    // Missing required fields
    const malformed = createEnvelope({
      examResultId,
    });

    const response = await POST(new Request('https://realtutorialhub.test/api/workers/send-remediation-notification', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'upstash-signature': 'valid-signature',
      },
      body: JSON.stringify(malformed),
    }));

    expect(response.status).toBe(400);
  });
});
