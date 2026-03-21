import { Client } from '@upstash/qstash';

import { createEventEnvelope, type EventEnvelope, type PlatformEventPayloadMap, type PlatformEventType } from './types';

export interface PublishEventOptions {
  destinationUrl?: string;
  correlationId?: string;
  source?: string;
  occurredAt?: string;
  version?: number;
  headers?: Record<string, string>;
  retries?: number;
}

const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (token === undefined || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required to publish events');
  }

  return new Client({ token });
};

export async function publishEvent<TType extends PlatformEventType>(
  type: TType,
  payload: PlatformEventPayloadMap[TType],
  options: PublishEventOptions = {}
): Promise<{ messageId: string; envelope: EventEnvelope<TType, PlatformEventPayloadMap[TType]> }> {
  const envelope = createEventEnvelope(type, payload, {
    id: crypto.randomUUID(),
    correlationId: options.correlationId ?? crypto.randomUUID(),
    source: options.source ?? 'quiz-platform',
    occurredAt: options.occurredAt ?? new Date().toISOString(),
    version: options.version ?? 1,
  });

  const destinationUrl = options.destinationUrl;
  if (destinationUrl === undefined || destinationUrl.trim().length === 0) {
    throw new Error('destinationUrl is required to publish an event');
  }

  const client = getQStashClient();
  const result = await client.publishJSON({
    url: destinationUrl,
    body: envelope,
    retries: options.retries ?? 3,
    headers: {
      'content-type': 'application/json',
      'x-event-type': type,
      'x-correlation-id': envelope.correlationId,
      ...(options.headers ?? {}),
    },
  });

  return {
    messageId: result.messageId,
    envelope,
  };
}
