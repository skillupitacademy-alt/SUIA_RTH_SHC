import { Receiver } from '@upstash/qstash';
import type { ZodTypeAny } from 'zod';

import { PlatformEventEnvelopeSchemas, type EventEnvelope, type PlatformEventType } from './types';

export interface ConsumerRedisLike {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
  del?(key: string): Promise<unknown> | unknown;
}

export interface QStashHandlerOptions<TType extends PlatformEventType> {
  receiver?: Receiver;
  idempotencyStore?: ConsumerRedisLike;
  schema?: ZodTypeAny;
  allowedTypes?: readonly string[];
  tenantScope?: string;
  idempotencyTtlSeconds?: number;
  leaseTtlSeconds?: number;
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

function stableJsonSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonSerialize(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJsonSerialize(record[key])}`).join(',')}}`;
}

function computePayloadFingerprint(value: unknown): string {
  const serialized = stableJsonSerialize(value);
  let hash = 2166136261;
  for (let i = 0; i < serialized.length; i += 1) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function resolveEventIdentityAndType<TType extends PlatformEventType>(
  parsed: unknown,
  rawBody: unknown,
  registeredType: TType,
  allowedTypes?: readonly string[]
): {
  envelopeType: string;
  eventId: string;
  tenantScope: string;
  fingerprint: string;
} {
  const parsedRecord = (parsed !== null && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
  const rawRecord = (rawBody !== null && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;

  const permittedTypes = new Set<string>([registeredType, ...(allowedTypes ?? [])]);
  const explicitType =
    typeof parsedRecord.type === 'string' && parsedRecord.type.trim().length > 0
      ? parsedRecord.type.trim()
      : typeof rawRecord.type === 'string' && rawRecord.type.trim().length > 0
        ? rawRecord.type.trim()
        : undefined;

  if (explicitType !== undefined) {
    if (!permittedTypes.has(explicitType)) {
      throw new Error(`Event envelope type mismatch: expected ${registeredType}, received ${explicitType}`);
    }
  } else if (!allowedTypes || allowedTypes.length === 0) {
    // Legacy body-only schema adapter allowed only when no conflicting type field is present
    if ('type' in rawRecord && rawRecord.type !== registeredType) {
      throw new Error(`Event envelope type mismatch: expected ${registeredType}`);
    }
  }

  const envelopeType = explicitType ?? registeredType;
  const fingerprint = computePayloadFingerprint(parsed);
  const explicitId =
    typeof parsedRecord.id === 'string' && parsedRecord.id.trim().length > 0
      ? parsedRecord.id.trim()
      : typeof rawRecord.id === 'string' && rawRecord.id.trim().length > 0
        ? rawRecord.id.trim()
        : typeof parsedRecord.examResultId === 'string' && parsedRecord.examResultId.trim().length > 0
          ? parsedRecord.examResultId.trim()
          : typeof parsedRecord.submissionId === 'string' && parsedRecord.submissionId.trim().length > 0
            ? parsedRecord.submissionId.trim()
            : fingerprint;

  const tenantScope =
    typeof parsedRecord.source === 'string' && parsedRecord.source.trim().length > 0
      ? parsedRecord.source.trim()
      : 'default';

  return {
    envelopeType,
    eventId: explicitId,
    tenantScope,
    fingerprint,
  };
}

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

    const rawJson: unknown = JSON.parse(body);
    const parsed = (options.schema ?? PlatformEventEnvelopeSchemas[type]).parse(rawJson) as EventEnvelope<TType, unknown>;
    const resolvedMeta = resolveEventIdentityAndType(parsed, rawJson, type, options.allowedTypes);
    const scopePrefix = options.tenantScope ?? resolvedMeta.tenantScope;
    const idempotencyKey = `${options.keyPrefix ?? 'event'}:${scopePrefix}:${type}:${resolvedMeta.eventId}`;

    if (options.idempotencyStore !== undefined) {
      const existingRecord = await options.idempotencyStore.get(idempotencyKey);
      if (existingRecord !== null && existingRecord !== undefined && String(existingRecord).length > 0) {
        const serializedRecord = String(existingRecord);
        if (serializedRecord.startsWith('completed:') || serializedRecord.startsWith('pending:')) {
          const [, recordedFingerprint] = serializedRecord.split(':', 3);
          if (
            recordedFingerprint &&
            recordedFingerprint.startsWith('fnv1a:') &&
            recordedFingerprint !== resolvedMeta.fingerprint
          ) {
            return new Response('Conflicting event payload for existing event ID', { status: 409 });
          }
        }
        await options.onDuplicate?.(parsed);
        return new Response('Duplicate event ignored', { status: 200 });
      }
    }

    const response = await handler(parsed);
    if (response instanceof Response && !response.ok && response.status >= 500) {
      return response;
    }

    if (options.idempotencyStore !== undefined) {
      await options.idempotencyStore.set(
        idempotencyKey,
        `completed:${resolvedMeta.fingerprint}:${resolvedMeta.eventId}`,
        {
          ex: options.idempotencyTtlSeconds ?? 86_400,
        }
      );
    }

    if (response instanceof Response) return response;
    return new Response('OK', { status: 200 });
  };
}
