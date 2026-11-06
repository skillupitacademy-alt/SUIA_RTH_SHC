import { createHash } from 'node:crypto';
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

const CANONICAL_EVENT_TENANTS = new Set(['realtutorialhub', 'skillup', 'skillhubcore']);
const activeInFlightEventClaims = new Map<string, string>();

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

function computePayloadSha256(value: unknown): string {
  const serialized = stableJsonSerialize(value);
  return `sha256:${createHash('sha256').update(serialized).digest('hex')}`;
}

function computePayloadFnv1a(value: unknown): string {
  const serialized = stableJsonSerialize(value);
  let hash = 2166136261;
  for (let i = 0; i < serialized.length; i += 1) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function parseIdempotencyRecord(raw: string): {
  state: 'pending' | 'completed' | 'legacy_completed';
  fingerprint: string | null;
} {
  if (raw.startsWith('pending:')) {
    const rest = raw.slice('pending:'.length);
    const match = /^(sha256:[0-9a-f]+|fnv1a:[0-9a-f]+)(?::.*)?$/i.exec(rest);
    return { state: 'pending', fingerprint: match ? match[1].toLowerCase() : null };
  }
  if (raw.startsWith('completed:')) {
    const rest = raw.slice('completed:'.length);
    const match = /^(sha256:[0-9a-f]+|fnv1a:[0-9a-f]+)(?::.*)?$/i.exec(rest);
    return { state: 'completed', fingerprint: match ? match[1].toLowerCase() : null };
  }
  return { state: 'legacy_completed', fingerprint: null };
}

function resolveVerifiedTenantScope<TType extends PlatformEventType>(
  parsedRecord: Record<string, unknown>,
  rawRecord: Record<string, unknown>,
  options: QStashHandlerOptions<TType>
): string {
  if (typeof options.tenantScope === 'string' && options.tenantScope.trim().length > 0) {
    const normalized = options.tenantScope.trim().toLowerCase();
    if (!CANONICAL_EVENT_TENANTS.has(normalized)) {
      throw new Error(`Invalid consumer tenantScope: ${options.tenantScope}`);
    }
    return normalized;
  }

  const nestedData =
    typeof parsedRecord.data === 'object' && parsedRecord.data !== null
      ? (parsedRecord.data as Record<string, unknown>)
      : {};

  const explicitTenantCandidate =
    parsedRecord.tenantId ??
    parsedRecord.brandId ??
    parsedRecord.brand ??
    rawRecord.tenantId ??
    rawRecord.brandId ??
    rawRecord.brand ??
    nestedData.tenantId ??
    nestedData.brandId ??
    nestedData.brand;

  if (typeof explicitTenantCandidate === 'string' && explicitTenantCandidate.trim().length > 0) {
    const normalized = explicitTenantCandidate.trim().toLowerCase();
    if (!CANONICAL_EVENT_TENANTS.has(normalized)) {
      throw new Error(`Invalid event tenant authority: ${explicitTenantCandidate}`);
    }
    return normalized;
  }

  const rawSource =
    typeof parsedRecord.source === 'string'
      ? parsedRecord.source.trim().toLowerCase()
      : typeof rawRecord.source === 'string'
        ? rawRecord.source.trim().toLowerCase()
        : '';

  if (rawSource !== '' && CANONICAL_EVENT_TENANTS.has(rawSource)) {
    return rawSource;
  }

  if (options.schema !== undefined && rawSource !== '') {
    throw new Error(
      `Unresolved canonical tenant authority for event consumer; cannot use non-tenant source "${rawSource}" as tenant scope`
    );
  }

  return 'default';
}

function resolveEventIdentityAndType<TType extends PlatformEventType>(
  parsed: unknown,
  rawBody: unknown,
  registeredType: TType,
  options: QStashHandlerOptions<TType>
): {
  envelopeType: string;
  eventId: string;
  tenantScope: string;
  fingerprint: string;
  fnv1aFingerprint: string;
} {
  const parsedRecord = (parsed !== null && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
  const rawRecord = (rawBody !== null && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;

  const permittedTypes = new Set<string>([registeredType, ...(options.allowedTypes ?? [])]);
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
  } else if (!options.allowedTypes || options.allowedTypes.length === 0) {
    if ('type' in rawRecord && rawRecord.type !== registeredType) {
      throw new Error(`Event envelope type mismatch: expected ${registeredType}`);
    }
  }

  const envelopeType = explicitType ?? registeredType;
  const fingerprint = computePayloadSha256(parsed);
  const fnv1aFingerprint = computePayloadFnv1a(parsed);
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

  const tenantScope = resolveVerifiedTenantScope(parsedRecord, rawRecord, options);

  return {
    envelopeType,
    eventId: explicitId,
    tenantScope,
    fingerprint,
    fnv1aFingerprint,
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
    const resolvedMeta = resolveEventIdentityAndType(parsed, rawJson, type, options);
    const scopePrefix = resolvedMeta.tenantScope;
    const idempotencyKey = `${options.keyPrefix ?? 'event'}:${scopePrefix}:${type}:${resolvedMeta.eventId}`;

    if (options.idempotencyStore !== undefined) {
      if (activeInFlightEventClaims.has(idempotencyKey)) {
        return new Response('Event processing already in progress', { status: 409 });
      }
      activeInFlightEventClaims.set(idempotencyKey, resolvedMeta.fingerprint);
    }

    try {
      if (options.idempotencyStore !== undefined) {
        const existingRecord = await options.idempotencyStore.get(idempotencyKey);
        if (existingRecord !== null && existingRecord !== undefined && String(existingRecord).trim().length > 0) {
          const serializedRecord = String(existingRecord);
          const parsedRecord = parseIdempotencyRecord(serializedRecord);
          if (parsedRecord.state === 'pending') {
            return new Response('Event processing already in progress', { status: 409 });
          }
          if (parsedRecord.state === 'completed' && parsedRecord.fingerprint !== null) {
            const expectedDigest = parsedRecord.fingerprint.startsWith('fnv1a:')
              ? resolvedMeta.fnv1aFingerprint.toLowerCase()
              : resolvedMeta.fingerprint.toLowerCase();
            if (parsedRecord.fingerprint !== expectedDigest) {
              return new Response('Conflicting event payload for existing event ID', { status: 409 });
            }
          }
          await options.onDuplicate?.(parsed);
          return new Response('Duplicate event ignored', { status: 200 });
        }

        await options.idempotencyStore.set(
          idempotencyKey,
          `pending:${resolvedMeta.fingerprint}:${resolvedMeta.eventId}`,
          {
            ex: options.leaseTtlSeconds ?? 300,
            nx: true,
          }
        );
      }

      let response: Response | void;
      try {
        response = await handler(parsed);
      } catch (error) {
        if (options.idempotencyStore !== undefined) {
          if (typeof options.idempotencyStore.del === 'function') {
            await options.idempotencyStore.del(idempotencyKey);
          } else {
            await options.idempotencyStore.set(idempotencyKey, '');
          }
        }
        throw error;
      }

      if (response instanceof Response && !response.ok && response.status >= 500) {
        if (options.idempotencyStore !== undefined) {
          if (typeof options.idempotencyStore.del === 'function') {
            await options.idempotencyStore.del(idempotencyKey);
          } else {
            await options.idempotencyStore.set(idempotencyKey, '');
          }
        }
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
    } finally {
      if (options.idempotencyStore !== undefined) {
        activeInFlightEventClaims.delete(idempotencyKey);
      }
    }
  };
}
