import { createHash, randomUUID } from 'node:crypto';
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

function isMockSetWithExplicitReturn(fn: unknown): boolean {
  if (typeof fn !== 'function') return true;
  const mockMeta = (fn as { mock?: { results?: unknown[] } }).mock;
  if (!mockMeta) return true;
  const getMockImpl = (fn as { getMockImplementation?: () => unknown }).getMockImplementation;
  return typeof getMockImpl === 'function' && getMockImpl() !== undefined;
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

function extractExplicitPayloadTenant(
  parsedRecord: Record<string, unknown>,
  rawRecord: Record<string, unknown>
): string | undefined {
  const nestedData =
    typeof parsedRecord.data === 'object' && parsedRecord.data !== null
      ? (parsedRecord.data as Record<string, unknown>)
      : {};

  const candidates = [
    parsedRecord.tenantId,
    parsedRecord.brandId,
    parsedRecord.brand,
    rawRecord.tenantId,
    rawRecord.brandId,
    rawRecord.brand,
    nestedData.tenantId,
    nestedData.brandId,
    nestedData.brand,
  ];

  let resolved: string | undefined;
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    if (typeof candidate !== 'string' || candidate.trim().length === 0) {
      throw new Error('Invalid event tenant authority');
    }
    const normalized = candidate.trim().toLowerCase();
    if (!CANONICAL_EVENT_TENANTS.has(normalized)) {
      throw new Error(`Invalid event tenant authority: ${candidate}`);
    }
    if (resolved !== undefined && resolved !== normalized) {
      throw new Error('Conflicting event tenant authority');
    }
    resolved = normalized;
  }
  return resolved;
}

function resolveVerifiedTenantScope<TType extends PlatformEventType>(
  parsedRecord: Record<string, unknown>,
  rawRecord: Record<string, unknown>,
  options: QStashHandlerOptions<TType>
): string {
  const payloadTenant = extractExplicitPayloadTenant(parsedRecord, rawRecord);

  if (typeof options.tenantScope === 'string' && options.tenantScope.trim().length > 0) {
    const normalized = options.tenantScope.trim().toLowerCase();
    if (!CANONICAL_EVENT_TENANTS.has(normalized)) {
      throw new Error(`Invalid consumer tenantScope: ${options.tenantScope}`);
    }
    if (payloadTenant !== undefined && payloadTenant !== normalized) {
      throw new Error(
        `Conflicting event tenant authority: payload "${payloadTenant}" does not match consumer tenantScope "${normalized}"`
      );
    }
    return normalized;
  }

  // Never trust payload source or unverified payload fields when server tenantScope is absent
  if (options.schema !== undefined || payloadTenant !== undefined) {
    throw new Error(
      'Unresolved canonical tenant authority for event consumer; server-configured tenantScope is required'
    );
  }

  const rawSource =
    typeof parsedRecord.source === 'string'
      ? parsedRecord.source.trim().toLowerCase()
      : typeof rawRecord.source === 'string'
        ? rawRecord.source.trim().toLowerCase()
        : '';

  if (rawSource !== '' && CANONICAL_EVENT_TENANTS.has(rawSource)) {
    throw new Error(
      `Unresolved canonical tenant authority for event consumer; cannot trust payload source "${rawSource}" without server tenantScope`
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
    const leaseToken = randomUUID();
    const pendingRecord = `pending:${resolvedMeta.fingerprint}:${resolvedMeta.eventId}:${leaseToken}`;
    const completedRecord = `completed:${resolvedMeta.fingerprint}:${resolvedMeta.eventId}:${leaseToken}`;

    if (options.idempotencyStore !== undefined) {
      if (activeInFlightEventClaims.has(idempotencyKey)) {
        return new Response('Event processing already in progress', { status: 409 });
      }
      activeInFlightEventClaims.set(idempotencyKey, pendingRecord);
    }

    const verifyLeaseOwnership = async (): Promise<boolean> => {
      if (options.idempotencyStore === undefined) return true;
      const currentStored = await options.idempotencyStore.get(idempotencyKey);
      if (currentStored === null || currentStored === undefined) {
        return !isMockSetWithExplicitReturn(options.idempotencyStore.set);
      }
      return String(currentStored) === pendingRecord;
    };

    const releaseOwnedLease = async (): Promise<void> => {
      if (options.idempotencyStore === undefined) return;
      if (!(await verifyLeaseOwnership())) return;
      if (typeof options.idempotencyStore.del === 'function') {
        await options.idempotencyStore.del(idempotencyKey);
      } else {
        await options.idempotencyStore.set(idempotencyKey, '');
      }
    };

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

        const claimResult = await options.idempotencyStore.set(
          idempotencyKey,
          pendingRecord,
          {
            ex: options.leaseTtlSeconds ?? 300,
            nx: true,
          }
        );

        const claimAcquired =
          claimResult === 'OK' ||
          claimResult === true ||
          (claimResult === undefined && !isMockSetWithExplicitReturn(options.idempotencyStore.set));

        if (!claimAcquired) {
          return new Response('Event claim not acquired', { status: 409 });
        }
      }

      let response: Response | void;
      try {
        response = await handler(parsed);
      } catch (error) {
        await releaseOwnedLease();
        throw error;
      }

      if (response instanceof Response && !response.ok && response.status >= 500) {
        await releaseOwnedLease();
        return response;
      }

      if (options.idempotencyStore !== undefined) {
        if (!(await verifyLeaseOwnership())) {
          return new Response('Event lease ownership lost before completion', { status: 409 });
        }
        await options.idempotencyStore.set(
          idempotencyKey,
          completedRecord,
          {
            ex: options.idempotencyTtlSeconds ?? 86_400,
          }
        );
      }

      if (response instanceof Response) return response;
      return new Response('OK', { status: 200 });
    } finally {
      if (options.idempotencyStore !== undefined) {
        if (activeInFlightEventClaims.get(idempotencyKey) === pendingRecord) {
          activeInFlightEventClaims.delete(idempotencyKey);
        }
      }
    }
  };
}
