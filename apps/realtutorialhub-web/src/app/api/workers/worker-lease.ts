import { createHash, randomUUID } from 'node:crypto';

export interface WorkerRedisLike {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
  del?(key: string): Promise<unknown> | unknown;
  eval?(script: string, keys: string[], args: Array<string | number>): Promise<unknown> | unknown;
  claim?(input: {
    key: string;
    ownerToken: string;
    pendingValue: string;
    leaseSeconds: number;
  }): Promise<WorkerLeaseClaimOutcome>;
  completeIfOwner?(input: {
    key: string;
    expectedPending: string;
    completedValue: string;
    retentionSeconds: number;
  }): Promise<'applied' | 'owner-lost'>;
  releaseIfOwner?(input: {
    key: string;
    expectedPending: string;
  }): Promise<'applied' | 'owner-lost'>;
}

export type WorkerLeaseClaimOutcome =
  | { kind: 'acquired'; ownerToken: string; pendingValue: string }
  | { kind: 'busy' }
  | { kind: 'already-completed'; existingValue: string };

export type WorkerLeaseTransitionOutcome = 'applied' | 'owner-lost';

export const WORKER_CLAIM_LEASE_LUA = `
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

export const WORKER_COMPLETE_IF_OWNER_LUA = `
if redis.call("GET", KEYS[1]) ~= ARGV[1] then
  return 0
end
redis.call("SET", KEYS[1], ARGV[2], "EX", tonumber(ARGV[3]))
return 1
`.trim();

export const WORKER_RELEASE_IF_OWNER_LUA = `
if redis.call("GET", KEYS[1]) ~= ARGV[1] then
  return 0
end
return redis.call("DEL", KEYS[1])
`.trim();

const MAX_WORKER_LEASE_TTL_SECONDS = 31_536_000;

function assertPositiveBoundedWorkerTtl(ttlSeconds: number, label: string): number {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > MAX_WORKER_LEASE_TTL_SECONDS) {
    throw new Error(`Invalid ${label}: expected positive integer seconds`);
  }
  return ttlSeconds;
}

export function isPendingWorkerLeaseValue(raw: string): boolean {
  const normalized = raw.trim();
  return (
    normalized === 'processing' ||
    normalized.startsWith('processing:') ||
    normalized.startsWith('pending:')
  );
}

export function hasAtomicWorkerLeaseSupport(redis: unknown): redis is WorkerRedisLike {
  if (redis === null || typeof redis !== 'object') {
    return false;
  }
  const candidate = redis as Partial<WorkerRedisLike>;
  const hasExplicitOwnerTransitions =
    typeof candidate.completeIfOwner === 'function' &&
    typeof candidate.releaseIfOwner === 'function' &&
    (typeof candidate.claim === 'function' ||
      (typeof candidate.get === 'function' && typeof candidate.set === 'function'));
  const hasRedisLuaEval = typeof candidate.eval === 'function';
  return hasExplicitOwnerTransitions || hasRedisLuaEval;
}

export function requireAtomicWorkerLeaseAdapter(redis: unknown): WorkerRedisLike {
  if (!hasAtomicWorkerLeaseSupport(redis)) {
    throw new Error('Unsupported atomic worker lease adapter');
  }
  return redis;
}

export async function acquireWorkerLease(
  redis: WorkerRedisLike,
  key: string,
  options: {
    leaseSeconds: number;
    pendingPrefix?: string;
    ownerToken?: string;
  }
): Promise<WorkerLeaseClaimOutcome> {
  const verifiedRedis = requireAtomicWorkerLeaseAdapter(redis);
  const leaseSeconds = assertPositiveBoundedWorkerTtl(options.leaseSeconds, 'leaseSeconds');
  const ownerToken = options.ownerToken ?? randomUUID();
  const pendingValue = `${options.pendingPrefix ?? 'processing'}:${ownerToken}`;

  if (typeof verifiedRedis.claim === 'function') {
    return verifiedRedis.claim({
      key,
      ownerToken,
      pendingValue,
      leaseSeconds,
    });
  }

  if (typeof verifiedRedis.get === 'function' && typeof verifiedRedis.set === 'function') {
    const existing = await verifiedRedis.get(key);
    if (existing !== null && existing !== undefined && String(existing).trim().length > 0) {
      const existingStr = String(existing).trim();
      if (isPendingWorkerLeaseValue(existingStr)) {
        return { kind: 'busy' };
      }
      return { kind: 'already-completed', existingValue: existingStr };
    }

    const claimed = await verifiedRedis.set(key, pendingValue, {
      ex: leaseSeconds,
      nx: true,
    });

    const claimAcquired = claimed === 'OK' || claimed === true;
    if (!claimAcquired) {
      return { kind: 'busy' };
    }

    return {
      kind: 'acquired',
      ownerToken,
      pendingValue,
    };
  }

  if (typeof verifiedRedis.eval === 'function') {
    const rawResult = await verifiedRedis.eval(
      WORKER_CLAIM_LEASE_LUA,
      [key],
      [pendingValue, leaseSeconds]
    );
    if (rawResult === 'ACQUIRED') {
      return {
        kind: 'acquired',
        ownerToken,
        pendingValue,
      };
    }
    if (rawResult === 'BUSY') {
      return { kind: 'busy' };
    }
    if (typeof rawResult === 'string' && rawResult.trim().length > 0) {
      const existingStr = rawResult.trim();
      if (isPendingWorkerLeaseValue(existingStr)) {
        return { kind: 'busy' };
      }
      return { kind: 'already-completed', existingValue: existingStr };
    }
    return { kind: 'busy' };
  }

  throw new Error('Unsupported atomic worker lease adapter');
}

export async function completeWorkerLeaseIfOwner(
  redis: WorkerRedisLike,
  key: string,
  expectedPending: string,
  completedValue: string,
  retentionSeconds: number
): Promise<WorkerLeaseTransitionOutcome> {
  const verifiedRedis = requireAtomicWorkerLeaseAdapter(redis);
  const validRetention = assertPositiveBoundedWorkerTtl(retentionSeconds, 'retentionSeconds');
  if (typeof expectedPending !== 'string' || expectedPending.trim().length === 0) {
    return 'owner-lost';
  }

  if (typeof verifiedRedis.completeIfOwner === 'function') {
    const outcome = await verifiedRedis.completeIfOwner({
      key,
      expectedPending,
      completedValue,
      retentionSeconds: validRetention,
    });
    return outcome === 'applied' ? 'applied' : 'owner-lost';
  }

  if (typeof verifiedRedis.eval === 'function') {
    const result = await verifiedRedis.eval(
      WORKER_COMPLETE_IF_OWNER_LUA,
      [key],
      [expectedPending, completedValue, validRetention]
    );
    return result === 1 || result === '1'
      ? 'applied'
      : 'owner-lost';
  }

  throw new Error('Unsupported atomic worker lease adapter');
}

export async function releaseWorkerLeaseIfOwner(
  redis: WorkerRedisLike,
  key: string,
  expectedPending: string
): Promise<WorkerLeaseTransitionOutcome> {
  const verifiedRedis = requireAtomicWorkerLeaseAdapter(redis);
  if (typeof expectedPending !== 'string' || expectedPending.trim().length === 0) {
    return 'owner-lost';
  }

  if (typeof verifiedRedis.releaseIfOwner === 'function') {
    const outcome = await verifiedRedis.releaseIfOwner({
      key,
      expectedPending,
    });
    return outcome === 'applied' ? 'applied' : 'owner-lost';
  }

  if (typeof verifiedRedis.eval === 'function') {
    const result = await verifiedRedis.eval(
      WORKER_RELEASE_IF_OWNER_LUA,
      [key],
      [expectedPending]
    );
    return result === 1 || result === '1'
      ? 'applied'
      : 'owner-lost';
  }

  throw new Error('Unsupported atomic worker lease adapter');
}

export interface InMemoryWorkerLeaseStoreHooks {
  onBeforeClaim?: (key: string, entries: Map<string, string>) => void | Promise<void>;
  onBeforeComplete?: (key: string, expectedPending: string, entries: Map<string, string>) => void | Promise<void>;
  onBeforeRelease?: (key: string, expectedPending: string, entries: Map<string, string>) => void | Promise<void>;
}

export function createInMemoryWorkerLeaseStore(
  entries = new Map<string, string>(),
  hooks: InMemoryWorkerLeaseStoreHooks = {}
): WorkerRedisLike & { readonly entries: Map<string, string> } {
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
      const existing = entries.get(input.key);
      if (existing !== undefined && existing.trim().length > 0) {
        const trimmed = existing.trim();
        if (isPendingWorkerLeaseValue(trimmed)) {
          return { kind: 'busy' };
        }
        return { kind: 'already-completed', existingValue: trimmed };
      }
      entries.set(input.key, input.pendingValue);
      return {
        kind: 'acquired',
        ownerToken: input.ownerToken,
        pendingValue: input.pendingValue,
      };
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

export type WorkerOutboxStatus = 'pending' | 'publishing' | 'published' | 'failed';

export interface WorkerOutboxRecord {
  id: string;
  tenantId: string;
  eventType: string;
  eventId: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: WorkerOutboxStatus;
  attemptCount: number;
  ownerToken: string | null;
  publishedAt: string | null;
  lastError: string | null;
}

const workerOutboxLedger = new Map<string, WorkerOutboxRecord>();

export function deriveDeterministicEventUuid(seed: string): string {
  const bytes = Buffer.from(createHash('sha256').update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function buildOutboxKey(tenantId: string, eventType: string, aggregateId: string): string {
  return `outbox:${tenantId.trim().toLowerCase()}:${eventType.trim()}:${aggregateId.trim()}`;
}

export function getWorkerOutboxIntent(
  tenantId: string,
  eventType: string,
  aggregateId: string
): WorkerOutboxRecord | undefined {
  return workerOutboxLedger.get(buildOutboxKey(tenantId, eventType, aggregateId));
}

export function upsertWorkerOutboxIntent(input: {
  tenantId: string;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  eventId?: string;
  ownerToken?: string;
}): WorkerOutboxRecord {
  const key = buildOutboxKey(input.tenantId, input.eventType, input.aggregateId);
  const existing = workerOutboxLedger.get(key);
  if (existing !== undefined) {
    existing.payload = input.payload;
    if (input.ownerToken !== undefined) {
      existing.ownerToken = input.ownerToken;
    }
    return existing;
  }

  const deterministicEventId =
    input.eventId ??
    deriveDeterministicEventUuid(`${input.tenantId}:${input.eventType}:${input.aggregateId}`);
  const record: WorkerOutboxRecord = {
    id: deriveDeterministicEventUuid(`outbox-row:${input.tenantId}:${input.eventType}:${input.aggregateId}`),
    tenantId: input.tenantId.trim().toLowerCase(),
    eventType: input.eventType.trim(),
    eventId: deterministicEventId,
    aggregateId: input.aggregateId.trim(),
    payload: input.payload,
    status: 'pending',
    attemptCount: 0,
    ownerToken: input.ownerToken ?? null,
    publishedAt: null,
    lastError: null,
  };
  workerOutboxLedger.set(key, record);
  return record;
}

export async function dispatchWorkerOutboxIntent(
  intent: WorkerOutboxRecord,
  ownerToken: string,
  publishFn: (intent: WorkerOutboxRecord) => Promise<void>
): Promise<{ status: 'published' | 'already-published'; record: WorkerOutboxRecord }> {
  if (intent.status === 'published') {
    return { status: 'already-published', record: intent };
  }

  intent.status = 'publishing';
  intent.ownerToken = ownerToken;
  intent.attemptCount += 1;

  try {
    await publishFn(intent);
    intent.status = 'published';
    intent.publishedAt = new Date().toISOString();
    intent.lastError = null;
    return { status: 'published', record: intent };
  } catch (error) {
    intent.status = 'failed';
    intent.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

export function clearWorkerOutboxLedgerForTests(): void {
  workerOutboxLedger.clear();
}
