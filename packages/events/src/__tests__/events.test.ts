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
import { PlatformEventTypes, PlatformEventPayloadSchemas, PlatformEventEnvelopeSchemas, getPlatformEventSchema } from '../types';
import { EVENT_CONSUMER_MAP } from '../consumer-map';

describe('events package', () => {
  it('exposes schemas for all 16 Sprint 0 events', () => {
    expect(Object.keys(PlatformEventPayloadSchemas)).toHaveLength(16);
    expect(Object.keys(PlatformEventEnvelopeSchemas)).toHaveLength(16);
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
          installmentId: crypto.randomUUID(),
          amount: 100,
          paidAt: new Date().toISOString(),
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
  it('types.ts: gets platform event schema', () => {
    expect(getPlatformEventSchema(PlatformEventTypes.STUDENT_CREATED)).toBeDefined();
  });

  it('consumer-map.ts: validates all events map to valid URLs', () => {
    expect(Object.keys(EVENT_CONSUMER_MAP)).toHaveLength(16);
    for (const key of Object.values(PlatformEventTypes)) {
      expect(EVENT_CONSUMER_MAP[key]).toEqual(expect.arrayContaining([expect.stringMatching(/^https:\/\/(?:placeholder\.invalid|tutorial-service\.invalid)\/(?:api\/workers\/|consumers\/)/)]));
    }
  });

  it('publisher.ts: throws if QSTASH_TOKEN is missing', async () => {
    vi.stubEnv('QSTASH_TOKEN', '');
    await expect(publishEvent(PlatformEventTypes.STUDENT_CREATED, {} as any, { destinationUrl: 'url' })).rejects.toThrow('QSTASH_TOKEN is required');
  });

  it('publisher.ts: throws if destinationUrl is missing', async () => {
    vi.stubEnv('QSTASH_TOKEN', 'token');
    await expect(publishEvent(PlatformEventTypes.STUDENT_CREATED, {} as any)).rejects.toThrow('destinationUrl is required');
  });

  it('publisher.ts: uses all explicit parameters', async () => {
    vi.stubEnv('QSTASH_TOKEN', 'token');
    const result = await publishEvent(
      PlatformEventTypes.STUDENT_CREATED,
      {} as any,
      { destinationUrl: 'url', correlationId: 'cid', source: 'src', occurredAt: 'time', version: 2, headers: { 'x-custom': '1' }, retries: 5 }
    );
    expect(result.envelope.correlationId).toBe('cid');
    expect(result.envelope.source).toBe('src');
    expect(result.envelope.version).toBe(2);
  });

  it('consumer.ts: returns 401 if signature is missing', async () => {
    const handler = createQStashHandler(PlatformEventTypes.PAYMENT_RECEIVED, vi.fn());
    const response = await handler(new Request('https://example.com', { method: 'POST', body: 'body' }));
    expect(response.status).toBe(401);
  });

  it('consumer.ts: throws if missing signing keys and no receiver injected', async () => {
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', '');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', '');
    const handler = createQStashHandler(PlatformEventTypes.PAYMENT_RECEIVED, vi.fn());
    const req = new Request('https://example.com', { method: 'POST', headers: { 'upstash-signature': 'sig' } });
    await expect(handler(req)).rejects.toThrow('QStash signing keys are required');
  });

  it('consumer.ts: throws if only ONE signing key is missing', async () => {
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current');
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', '');
    const handler = createQStashHandler(PlatformEventTypes.PAYMENT_RECEIVED, vi.fn());
    const req = new Request('https://example.com', { method: 'POST', headers: { 'upstash-signature': 'sig' } });
    await expect(handler(req)).rejects.toThrow('QStash signing keys are required');
  });

  it('consumer.ts: uses idempotency store and returns custom responses', async () => {
    const idempotencyStore = { get: vi.fn().mockResolvedValue(null), set: vi.fn() };
    const receiver = { verify: vi.fn().mockResolvedValue(undefined) } as any;
    const customHandler = createQStashHandler(
      PlatformEventTypes.PAYMENT_RECEIVED,
      () => new Response('Created', { status: 201 }),
      { idempotencyStore, receiver }
    );
    const req = new Request('https://example.com', {
      method: 'POST', headers: { 'upstash-signature': 'sig' },
      body: JSON.stringify({
        id: crypto.randomUUID(), type: PlatformEventTypes.PAYMENT_RECEIVED, correlationId: crypto.randomUUID(), source: 'src', occurredAt: new Date().toISOString(), version: 1,
        data: { userId: crypto.randomUUID(), installmentId: crypto.randomUUID(), amount: 100, paidAt: new Date().toISOString() },
      })
    });
    
    const response = await customHandler(req);
    expect(response.status).toBe(201);
    expect(idempotencyStore.set).toHaveBeenCalled();
  });

  it('consumer.ts: returns default 200 response when handler returns void', async () => {
    const receiver = { verify: vi.fn().mockResolvedValue(undefined) } as any;
    const voidHandler = createQStashHandler(PlatformEventTypes.PAYMENT_RECEIVED, () => {}, { receiver });
    const req = new Request('https://example.com', {
      method: 'POST', headers: { 'upstash-signature': 'sig' },
      body: JSON.stringify({
        id: crypto.randomUUID(), type: PlatformEventTypes.PAYMENT_RECEIVED, correlationId: crypto.randomUUID(), source: 'src', occurredAt: new Date().toISOString(), version: 1,
        data: { userId: crypto.randomUUID(), installmentId: crypto.randomUUID(), amount: 100, paidAt: new Date().toISOString() },
      })
    });
    const response = await voidHandler(req);
    expect(response.status).toBe(200);
  });
});
