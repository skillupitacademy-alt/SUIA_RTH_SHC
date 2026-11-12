import { createHash, randomUUID } from 'node:crypto';
import { Receiver } from '@upstash/qstash';
import { assertWorkerDestination } from './worker-destination';
import type { ZodTypeAny } from 'zod';

import { PlatformEventEnvelopeSchemas, type EventEnvelope, type PlatformEventType } from './types';

export interface ConsumerRedisLike {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
  del?(key: string): Promise<unknown> | unknown;
  eval?(script: string, keys: string[], args: Array<string | number>): Promise<unknown> | unknown;
}

export type EventClaimResult =
  | { kind: 'acquired'; ownerToken: string; pendingRecord: string }
  | { kind: 'busy' }
  | { kind: 'already-completed'; completedRecord: string }
  | { kind: 'payload-conflict' };

export type EventLeaseTransitionResult = 'applied' | 'owner-lost';

export interface DurableEventLeaseStore {
  claim(input: {
    key: string;
    fingerprint: string;
    fnv1aFingerprint?: string;
    eventId: string;
    ownerToken: string;
    pendingRecord?: string;
    leaseSeconds: number;
  }): Promise<EventClaimResult>;

  completeIfOwner(input: {
    key: string;
    expectedPending: string;
    completedValue: string;
    retentionSeconds: number;
  }): Promise<EventLeaseTransitionResult>;

  releaseIfOwner(input: {
    key: string;
    expectedPending: string;
  }): Promise<EventLeaseTransitionResult>;
}

export interface QStashHandlerOptions<TType extends PlatformEventType> {
  receiver?: Receiver;
  idempotencyStore?: ConsumerRedisLike | DurableEventLeaseStore;
  schema?: ZodTypeAny;
  allowedTypes?: readonly string[];
  tenantScope?: string;
  idempotencyTtlSeconds?: number;
  leaseTtlSeconds?: number;
  keyPrefix?: string;
  onDuplicate?: (envelope: EventEnvelope<TType, unknown>) => void | Promise<void>;
}

export const CLAIM_EVENT_LEASE_LUA = `
local current = redis.call("GET", KEYS[1])
if current then
  return current
end
local ok = redis.call("SET", KEYS[1], ARGV[1], "EX", tonumber(ARGV[2]), "NX")
if not ok then
  return redis.call("GET", KEYS[1]) or "BUSY"
end
return "ACQUIRED"
`.trim();

export const COMPLETE_IF_OWNER_LUA = `
if redis.call("GET", KEYS[1]) ~= ARGV[1] then
  return 0
end
redis.call("SET", KEYS[1], ARGV[2], "EX", tonumber(ARGV[3]))
return 1
`.trim();

export const RELEASE_IF_OWNER_LUA = `
if redis.call("GET", KEYS[1]) ~= ARGV[1] then
  return 0
end
return redis.call("DEL", KEYS[1])
`.trim();

const CANONICAL_EVENT_TENANTS = new Set(['realtutorialhub', 'skillup', 'skillhubcore']);
const MAX_LEASE_TTL_SECONDS = 31_536_000;

function assertPositiveBoundedTtl(ttlSeconds: number, label: string): number {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > MAX_LEASE_TTL_SECONDS) {
    throw new Error(`Invalid ${label}: expected positive integer seconds`);
  }
  return ttlSeconds;
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
  if (raw.startsWith('pending:') || raw.startsWith('processing:') || raw === 'processing') {
    const prefix = raw.startsWith('pending:') ? 'pending:' : 'processing:';
    const rest = raw.startsWith(prefix) ? raw.slice(prefix.length) : '';
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

function classifyExistingRecord(
  serializedRecord: string,
  fingerprint: string,
  fnv1aFingerprint?: string
): Exclude<EventClaimResult, { kind: 'acquired' }> {
  const parsedRecord = parseIdempotencyRecord(serializedRecord);
  if (parsedRecord.state === 'pending') {
    return { kind: 'busy' };
  }
  if (parsedRecord.state === 'completed' && parsedRecord.fingerprint !== null) {
    const expectedDigest = parsedRecord.fingerprint.startsWith('fnv1a:')
      ? (fnv1aFingerprint ?? fingerprint).toLowerCase()
      : fingerprint.toLowerCase();
    if (parsedRecord.fingerprint !== expectedDigest) {
      return { kind: 'payload-conflict' };
    }
  }
  return { kind: 'already-completed', completedRecord: serializedRecord };
}

function isDurableEventLeaseStore(
  store: ConsumerRedisLike | DurableEventLeaseStore
): store is DurableEventLeaseStore {
  const candidate = store as Partial<DurableEventLeaseStore>;
  return (
    typeof candidate.claim === 'function' &&
    typeof candidate.completeIfOwner === 'function' &&
    typeof candidate.releaseIfOwner === 'function'
  );
}

export function createDurableEventLeaseStore(
  store: ConsumerRedisLike | DurableEventLeaseStore
): DurableEventLeaseStore {
  if (store === null || typeof store !== 'object') {
    throw new Error('Unsupported atomic event lease adapter');
  }
  if (isDurableEventLeaseStore(store)) {
    return store;
  }

  const redisStore = store as ConsumerRedisLike;
  if (typeof redisStore.eval === 'function') {
    const evalFn = redisStore.eval.bind(redisStore);
    return {
      async claim(input) {
        const leaseSeconds = assertPositiveBoundedTtl(input.leaseSeconds, 'leaseSeconds');
        const pendingRecord = input.pendingRecord ?? `pending:${input.fingerprint}:${input.eventId}:${input.ownerToken}`;
        const rawResult = await evalFn(
          CLAIM_EVENT_LEASE_LUA,
          [input.key],
          [pendingRecord, leaseSeconds]
        );
        if (rawResult === 'ACQUIRED') {
          return { kind: 'acquired', ownerToken: input.ownerToken, pendingRecord };
        }
        if (rawResult === 'BUSY') {
          return { kind: 'busy' };
        }
        if (typeof rawResult === 'string' && rawResult.trim().length > 0) {
          return classifyExistingRecord(rawResult, input.fingerprint, input.fnv1aFingerprint);
        }
        return { kind: 'busy' };
      },
      async completeIfOwner(input) {
        const retentionSeconds = assertPositiveBoundedTtl(input.retentionSeconds, 'retentionSeconds');
        if (typeof input.expectedPending !== 'string' || input.expectedPending.trim().length === 0) {
          return 'owner-lost';
        }
        const result = await evalFn(
          COMPLETE_IF_OWNER_LUA,
          [input.key],
          [input.expectedPending, input.completedValue, retentionSeconds]
        );
        return result === 1 || result === '1'
          ? 'applied'
          : 'owner-lost';
      },
      async releaseIfOwner(input) {
        if (typeof input.expectedPending !== 'string' || input.expectedPending.trim().length === 0) {
          return 'owner-lost';
        }
        const result = await evalFn(
          RELEASE_IF_OWNER_LUA,
          [input.key],
          [input.expectedPending]
        );
        return result === 1 || result === '1'
          ? 'applied'
          : 'owner-lost';
      },
    };
  }

  throw new Error('Unsupported atomic event lease adapter');
}

export interface InMemoryEventLeaseStoreHooks {
  onBeforeClaim?: (key: string, entries: Map<string, string>) => void | Promise<void>;
  onBeforeComplete?: (key: string, expectedPending: string, entries: Map<string, string>) => void | Promise<void>;
  onBeforeRelease?: (key: string, expectedPending: string, entries: Map<string, string>) => void | Promise<void>;
}

export function createInMemoryEventLeaseStore(
  entries = new Map<string, string>(),
  hooks: InMemoryEventLeaseStoreHooks = {}
): DurableEventLeaseStore & ConsumerRedisLike & { readonly entries: Map<string, string> } {
  return {
    entries,
    get(key: string) {
      return entries.get(key) ?? null;
    },
    set(key: string, value: string, options?: { ex?: number; nx?: boolean }) {
      if (options?.nx && entries.has(key)) return null;
      entries.set(key, value);
      return 'OK';
    },
    del(key: string) {
      return entries.delete(key) ? 1 : 0;
    },
    async claim(input) {
      await hooks.onBeforeClaim?.(input.key, entries);
      const pendingRecord = input.pendingRecord ?? `pending:${input.fingerprint}:${input.eventId}:${input.ownerToken}`;
      const existing = entries.get(input.key);
      if (existing !== undefined && existing.trim().length > 0) {
        return classifyExistingRecord(existing, input.fingerprint, input.fnv1aFingerprint);
      }
      entries.set(input.key, pendingRecord);
      return { kind: 'acquired', ownerToken: input.ownerToken, pendingRecord };
    },
    async completeIfOwner(input) {
      await hooks.onBeforeComplete?.(input.key, input.expectedPending, entries);
      if (entries.get(input.key) !== input.expectedPending) {
        return 'owner-lost';
      }
      entries.set(input.key, input.completedValue);
      return 'applied';
    },
    async releaseIfOwner(input) {
      await hooks.onBeforeRelease?.(input.key, input.expectedPending, entries);
      if (entries.get(input.key) !== input.expectedPending) {
        return 'owner-lost';
      }
      entries.delete(input.key);
      return 'applied';
    },
  };
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
    assertWorkerDestination(signature.trim(), request.url);

    const rawJson: unknown = JSON.parse(body);
    const parsed = (options.schema ?? PlatformEventEnvelopeSchemas[type]).parse(rawJson) as EventEnvelope<TType, unknown>;
    const resolvedMeta = resolveEventIdentityAndType(parsed, rawJson, type, options);
    const scopePrefix = resolvedMeta.tenantScope;
    const idempotencyKey = `${options.keyPrefix ?? 'event'}:${scopePrefix}:${type}:${resolvedMeta.eventId}`;
    const leaseToken = randomUUID();
    const pendingRecord = `pending:${resolvedMeta.fingerprint}:${resolvedMeta.eventId}:${leaseToken}`;
    const completedRecord = `completed:${resolvedMeta.fingerprint}:${resolvedMeta.eventId}:${leaseToken}`;

    const leaseStore =
      options.idempotencyStore !== undefined
        ? createDurableEventLeaseStore(options.idempotencyStore)
        : undefined;

    if (leaseStore !== undefined) {
      const claimOutcome = await leaseStore.claim({
        key: idempotencyKey,
        fingerprint: resolvedMeta.fingerprint,
        fnv1aFingerprint: resolvedMeta.fnv1aFingerprint,
        eventId: resolvedMeta.eventId,
        ownerToken: leaseToken,
        pendingRecord,
        leaseSeconds: options.leaseTtlSeconds ?? 300,
      });

      if (claimOutcome.kind === 'payload-conflict') {
        return new Response('Conflicting event payload for existing event ID', { status: 409 });
      }
      if (claimOutcome.kind === 'already-completed') {
        await options.onDuplicate?.(parsed);
        return new Response('Duplicate event ignored', { status: 200 });
      }
      if (claimOutcome.kind === 'busy') {
        return new Response('Event claim not acquired', { status: 409 });
      }
    }

    let response: Response | void;
    try {
      response = await handler(parsed);
    } catch (error) {
      if (leaseStore !== undefined) {
        await leaseStore.releaseIfOwner({
          key: idempotencyKey,
          expectedPending: pendingRecord,
        });
      }
      throw error;
    }

    if (response instanceof Response && !response.ok && response.status >= 500) {
      if (leaseStore !== undefined) {
        await leaseStore.releaseIfOwner({
          key: idempotencyKey,
          expectedPending: pendingRecord,
        });
      }
      return response;
    }

    if (leaseStore !== undefined) {
      const transition = await leaseStore.completeIfOwner({
        key: idempotencyKey,
        expectedPending: pendingRecord,
        completedValue: completedRecord,
        retentionSeconds: options.idempotencyTtlSeconds ?? 86_400,
      });
      if (transition !== 'applied') {
        return new Response('Event lease ownership lost before completion', { status: 409 });
      }
    }

    if (response instanceof Response) return response;
    return new Response('OK', { status: 200 });
  };
}
