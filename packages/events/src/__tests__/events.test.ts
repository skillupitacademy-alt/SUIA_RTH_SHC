import { describe, expect, it, vi } from 'vitest';

vi.mock('@upstash/qstash', () => ({
  Client: class {
    publishJSON() {
      return Promise.resolve({ messageId: 'msg_123' });
    }
  },
  Receiver: class {
    verify() {
      return Promise.resolve(undefined);
    }
  },
}));

import { createQStashHandler } from '../consumer';
import { publishEvent } from '../publisher';
import { PlatformEventTypes, PlatformEventPayloadSchemas, PlatformEventEnvelopeSchemas } from '../types';

describe('events package', () => {
  it('exposes schemas for all 15 Sprint 0 events', () => {
    expect(Object.keys(PlatformEventPayloadSchemas)).toHaveLength(15);
    expect(Object.keys(PlatformEventEnvelopeSchemas)).toHaveLength(15);
  });

  it('validates an event envelope through Zod', () => {
    const envelope = PlatformEventEnvelopeSchemas[PlatformEventTypes.EXAM_COMPLETED].parse({
      id: crypto.randomUUID(),
      type: PlatformEventTypes.EXAM_COMPLETED,
      correlationId: crypto.randomUUID(),
      source: 'exam-service',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        userId: crypto.randomUUID(),
        examId: crypto.randomUUID(),
        score: 91,
        completedAt: new Date().toISOString(),
      },
    });

    expect(envelope.type).toBe(PlatformEventTypes.EXAM_COMPLETED);
  });

  it('short-circuits duplicate consumer deliveries', async () => {
    const idempotencyStore = {
      get: vi.fn().mockResolvedValue('already-seen'),
      set: vi.fn(),
    };
    const receiver = {
      verify: vi.fn().mockResolvedValue(undefined),
    } as any;
    const handler = createQStashHandler(
      PlatformEventTypes.PAYMENT_RECEIVED,
      vi.fn(),
      { idempotencyStore, receiver }
    );

    const response = await handler(new Request('https://example.com', {
      method: 'POST',
      headers: { 'upstash-signature': 'valid' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        type: PlatformEventTypes.PAYMENT_RECEIVED,
        correlationId: crypto.randomUUID(),
        source: 'payment-service',
        occurredAt: new Date().toISOString(),
        version: 1,
        data: {
          userId: crypto.randomUUID(),
          paymentId: crypto.randomUUID(),
          amount: 100,
          receivedAt: new Date().toISOString(),
        },
      }),
    }));

    expect(response.status).toBe(200);
    expect(idempotencyStore.set).not.toHaveBeenCalled();
  });

  it('publishes a QStash-ready event envelope', async () => {
    vi.stubEnv('QSTASH_TOKEN', 'token');
    const result = await publishEvent(
      PlatformEventTypes.STUDENT_CREATED,
      {
        userId: crypto.randomUUID(),
        createdBy: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      { destinationUrl: 'https://placeholder.invalid/webhook' }
    );

    expect(result.envelope.type).toBe(PlatformEventTypes.STUDENT_CREATED);
    expect(result.envelope.data.userId).toBeDefined();
  });
});
