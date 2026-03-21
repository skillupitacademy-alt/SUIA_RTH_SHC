import { Receiver } from '@upstash/qstash';
import type { ZodTypeAny } from 'zod';

import { PlatformEventEnvelopeSchemas, type EventEnvelope, type PlatformEventType } from './types';

export interface ConsumerRedisLike {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown> | unknown;
}

export interface QStashHandlerOptions<TType extends PlatformEventType> {
  receiver?: Receiver;
  idempotencyStore?: ConsumerRedisLike;
  schema?: ZodTypeAny;
  idempotencyTtlSeconds?: number;
  keyPrefix?: string;
  onDuplicate?: (envelope: EventEnvelope<TType, unknown>) => void | Promise<void>;
}

const getReceiver = (receiver?: Receiver) => {
  if (receiver !== undefined) return receiver;

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (
    currentSigningKey === undefined || currentSigningKey.trim().length === 0 ||
    nextSigningKey === undefined || nextSigningKey.trim().length === 0
  ) {
    throw new Error('QStash signing keys are required to verify consumer requests');
  }

  return new Receiver({
    currentSigningKey,
    nextSigningKey,
  });
};

export function createQStashHandler<TType extends PlatformEventType>(
  type: TType,
  handler: (envelope: EventEnvelope<TType, unknown>) => Promise<Response | void> | Response | void,
  options: QStashHandlerOptions<TType> = {}
) {
  return async (request: Request): Promise<Response> => {
    const signature = request.headers.get('upstash-signature');
    if (signature === null || signature.trim().length === 0) {
      return new Response('Missing QStash signature', { status: 401 });
    }

    const body = await request.text();
    const receiver = getReceiver(options.receiver);
    await receiver.verify({
      signature: signature.trim(),
      body,
      clockTolerance: 60,
    });

    const parsed = (options.schema ?? PlatformEventEnvelopeSchemas[type]).parse(JSON.parse(body)) as EventEnvelope<TType, unknown>;
    const idempotencyKey = `${options.keyPrefix ?? 'event'}:${parsed.correlationId}`;

    if (options.idempotencyStore !== undefined) {
      const alreadyProcessed = await options.idempotencyStore.get(idempotencyKey);
      if (alreadyProcessed !== null && alreadyProcessed !== undefined && String(alreadyProcessed).length > 0) {
        await options.onDuplicate?.(parsed);
        return new Response('Duplicate event ignored', { status: 200 });
      }

      await options.idempotencyStore.set(idempotencyKey, parsed.id, {
        ex: options.idempotencyTtlSeconds ?? 86_400,
      });
    }

    const response = await handler(parsed);
    if (response instanceof Response) return response;
    return new Response('OK', { status: 200 });
  };
}
