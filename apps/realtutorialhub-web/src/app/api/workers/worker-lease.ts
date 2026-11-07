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
  envelope?: Record<string, unknown> | null;
  status: WorkerOutboxStatus;
  attemptCount: number;
  ownerToken: string | null;
  leaseExpiresAt?: string | null;
  publishedAt: string | null;
  lastError: string | null;
}

const DEFAULT_OUTBOX_LEASE_MS = 300_000;

export function deriveDeterministicEventUuid(seed: string): string {
  const bytes = Buffer.from(createHash('sha256').update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function canonicalizeOutboxJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeOutboxJson(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalizeOutboxJson(v)}`).join(',')}}`;
}

function deepFreezeObject<T>(obj: T): T {
  if (obj !== null && typeof obj === 'object') {
    Object.freeze(obj);
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        deepFreezeObject(value);
      }
    }
  }
  return obj;
}

function cloneAndFreezePayload<T extends Record<string, unknown>>(payload: T): T {
  return deepFreezeObject(JSON.parse(JSON.stringify(payload)) as T);
}

interface WorkerOutboxTestAdapterState {
  byCompositeKey: Record<string, WorkerOutboxRecord>;
  compositeKeyByEventId: Record<string, string>;
}

const OUTBOX_TEST_ADAPTER_SYMBOL = Symbol.for('quiz.worker.outbox.test.adapter');

function getIsolatedOutboxTestAdapter(): WorkerOutboxTestAdapterState {
  const g = globalThis as unknown as Record<symbol, WorkerOutboxTestAdapterState>;
  if (!g[OUTBOX_TEST_ADAPTER_SYMBOL]) {
    g[OUTBOX_TEST_ADAPTER_SYMBOL] = { byCompositeKey: {}, compositeKeyByEventId: {} };
  }
  return g[OUTBOX_TEST_ADAPTER_SYMBOL];
}

function buildOutboxKey(tenantId: string, eventType: string, aggregateId: string): string {
  return `outbox:${tenantId.trim().toLowerCase()}:${eventType.trim()}:${aggregateId.trim()}`;
}

function hydrateOutboxRecord(record: WorkerOutboxRecord): WorkerOutboxRecord {
  const frozenPayload = cloneAndFreezePayload(record.payload);
  const frozenEnvelope = record.envelope ? cloneAndFreezePayload(record.envelope) : null;
  const copy: WorkerOutboxRecord = {
    ...record,
    payload: frozenPayload,
    envelope: frozenEnvelope,
  };
  Object.defineProperty(copy, 'payload', {
    value: frozenPayload,
    writable: false,
    configurable: false,
    enumerable: true,
  });
  return copy;
}

export function getWorkerOutboxIntent(
  tenantId: string,
  eventType: string,
  aggregateId: string
): WorkerOutboxRecord | undefined {
  const state = getIsolatedOutboxTestAdapter();
  const found = state.byCompositeKey[buildOutboxKey(tenantId, eventType, aggregateId)];
  return found !== undefined ? hydrateOutboxRecord(found) : undefined;
}

export function upsertWorkerOutboxIntent(input: {
  tenantId: string;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  envelope?: Record<string, unknown> | null;
  eventId?: string;
  ownerToken?: string;
}): WorkerOutboxRecord {
  const normalizedTenant = input.tenantId.trim().toLowerCase();
  const normalizedType = input.eventType.trim();
  const normalizedAggregate = input.aggregateId.trim();
  if (!normalizedTenant || !normalizedType || !normalizedAggregate) {
    throw new Error('Outbox intent requires non-empty tenantId, eventType, and aggregateId');
  }

  const state = getIsolatedOutboxTestAdapter();
  const key = buildOutboxKey(normalizedTenant, normalizedType, normalizedAggregate);
  const deterministicEventId =
    input.eventId?.trim() ||
    deriveDeterministicEventUuid(`${normalizedTenant}:${normalizedType}:${normalizedAggregate}`);

  const existingByKey = state.byCompositeKey[key];
  const existingKeyByEventId = state.compositeKeyByEventId[deterministicEventId];
  const existingByEventId = existingKeyByEventId ? state.byCompositeKey[existingKeyByEventId] : undefined;
  const existing = existingByKey ?? existingByEventId;

  const incomingPayloadCanonical = canonicalizeOutboxJson(input.payload);

  if (existing !== undefined) {
    const storedPayloadCanonical = canonicalizeOutboxJson(existing.payload);
    if (
      existing.tenantId !== normalizedTenant ||
      existing.eventType !== normalizedType ||
      existing.aggregateId !== normalizedAggregate ||
      existing.eventId !== deterministicEventId ||
      storedPayloadCanonical !== incomingPayloadCanonical
    ) {
      throw new Error('Conflicting outbox payload for existing event identity');
    }

    if (input.envelope !== undefined && input.envelope !== null && !existing.envelope) {
      existing.envelope = cloneAndFreezePayload(input.envelope);
      state.byCompositeKey[key] = existing;
    }

    return hydrateOutboxRecord(existing);
  }

  const frozenPayload = cloneAndFreezePayload(input.payload);
  const frozenEnvelope =
    input.envelope !== undefined && input.envelope !== null
      ? cloneAndFreezePayload(input.envelope)
      : null;

  const record: WorkerOutboxRecord = {
    id: deriveDeterministicEventUuid(`outbox-row:${normalizedTenant}:${normalizedType}:${normalizedAggregate}`),
    tenantId: normalizedTenant,
    eventType: normalizedType,
    eventId: deterministicEventId,
    aggregateId: normalizedAggregate,
    payload: frozenPayload,
    envelope: frozenEnvelope,
    status: 'pending',
    attemptCount: 0,
    ownerToken: input.ownerToken ?? null,
    leaseExpiresAt: null,
    publishedAt: null,
    lastError: null,
  };
  state.byCompositeKey[key] = record;
  state.compositeKeyByEventId[deterministicEventId] = key;
  return hydrateOutboxRecord(record);
}

/**
 * Executes a domain-plus-outbox database transaction (`db.transaction`).
 * Snapshots and rolls back the outbox state if any operation inside `tx` fails.
 */
export async function runInWorkerOutboxTransaction<
  TDb extends { transaction: (...args: any[]) => Promise<any> },
  TResult,
>(
  dbClient: TDb,
  callback: (tx: Parameters<Parameters<TDb['transaction']>[0]>[0]) => Promise<TResult>
): Promise<TResult> {
  const state = getIsolatedOutboxTestAdapter();
  const snapshotByKey: Record<string, WorkerOutboxRecord> = {};
  for (const [k, v] of Object.entries(state.byCompositeKey)) {
    snapshotByKey[k] = {
      ...v,
      payload: cloneAndFreezePayload(v.payload),
      envelope: v.envelope ? cloneAndFreezePayload(v.envelope) : null,
    };
  }
  const snapshotByEventId = { ...state.compositeKeyByEventId };

  try {
    return await dbClient.transaction(async (tx: Parameters<Parameters<TDb['transaction']>[0]>[0]) =>
      callback(tx)
    );
  } catch (error) {
    state.byCompositeKey = snapshotByKey;
    state.compositeKeyByEventId = snapshotByEventId;
    throw error;
  }
}

/**
 * Enlists the outbox publication intent in the caller's active database transaction `tx`.
 * When `tx` provides an `EventOutboxRepository` or full SQL query interface (`select`, `insert`, `update`),
 * executes `EventOutboxRepository(tx).upsertIntent(input)` directly on `tx` and fails closed on SQL error.
 */
export async function upsertTransactionalOutboxIntent(
  input: {
    tenantId: string;
    eventType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    envelope?: Record<string, unknown> | null;
    eventId?: string;
    ownerToken?: string;
  },
  tx: unknown
): Promise<WorkerOutboxRecord> {
  if (tx !== null && tx !== undefined && typeof tx === 'object') {
    const candidate = tx as {
      upsertIntent?: (arg: typeof input) => Promise<WorkerOutboxRecord>;
      select?: unknown;
      insert?: unknown;
      update?: unknown;
    };

    if (typeof candidate.upsertIntent === 'function') {
      const dbRecord = await candidate.upsertIntent(input);
      upsertWorkerOutboxIntent(input);
      return hydrateOutboxRecord(dbRecord);
    }

    const hasFullSqlExecutor =
      typeof candidate.select === 'function' &&
      typeof candidate.insert === 'function' &&
      typeof candidate.update === 'function';

    if (hasFullSqlExecutor && Boolean(process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_URL)) {
      const tutorialDb = await import('@quiz/db-tutorial');
      if ('EventOutboxRepository' in tutorialDb && typeof tutorialDb.EventOutboxRepository === 'function') {
        const repo = new tutorialDb.EventOutboxRepository(tx as any);
        const dbRecord = await repo.upsertIntent(input);
        upsertWorkerOutboxIntent(input);
        return hydrateOutboxRecord(dbRecord as unknown as WorkerOutboxRecord);
      }
    }
  }

  return upsertWorkerOutboxIntent(input);
}

export async function dispatchWorkerOutboxIntent(
  intent: WorkerOutboxRecord,
  ownerToken: string,
  publishFn: (intent: WorkerOutboxRecord) => Promise<void>,
  dbOrRepo?: unknown
): Promise<{ status: 'published' | 'already-published'; record: WorkerOutboxRecord }> {
  const normalizedOwner = ownerToken?.trim();
  if (!normalizedOwner) {
    throw new Error('ownerToken is required to dispatch an outbox publication intent');
  }

  const repoCandidate = dbOrRepo as {
    claimIntent?: (arg: any) => Promise<any>;
    markPublished?: (arg: any) => Promise<any>;
    markFailed?: (arg: any) => Promise<any>;
  } | null;

  if (
    repoCandidate !== null &&
    repoCandidate !== undefined &&
    typeof repoCandidate === 'object' &&
    typeof repoCandidate.claimIntent === 'function' &&
    typeof repoCandidate.markPublished === 'function' &&
    typeof repoCandidate.markFailed === 'function'
  ) {
    const claimed = await repoCandidate.claimIntent({
      tenantId: intent.tenantId,
      eventType: intent.eventType,
      aggregateId: intent.aggregateId,
      ownerToken: normalizedOwner,
      leaseDurationMs: DEFAULT_OUTBOX_LEASE_MS,
    });
    if (claimed.kind === 'already-published') {
      return { status: 'already-published', record: hydrateOutboxRecord(claimed.record) };
    }
    if (claimed.kind === 'busy') {
      throw new Error('Outbox publication intent is already being published by an active dispatcher');
    }
    const lockedRecord = hydrateOutboxRecord(claimed.record);
    try {
      await publishFn(lockedRecord);
      const published = await repoCandidate.markPublished({
        tenantId: intent.tenantId,
        eventType: intent.eventType,
        aggregateId: intent.aggregateId,
        ownerToken: normalizedOwner,
        envelope: lockedRecord.envelope,
      });
      return { status: 'published', record: hydrateOutboxRecord(published) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await repoCandidate
        .markFailed({
          tenantId: intent.tenantId,
          eventType: intent.eventType,
          aggregateId: intent.aggregateId,
          ownerToken: normalizedOwner,
          errorMessage: message,
        })
        .catch(() => undefined);
      throw error;
    }
  }

  const state = getIsolatedOutboxTestAdapter();
  const key = buildOutboxKey(intent.tenantId, intent.eventType, intent.aggregateId);
  const current = state.byCompositeKey[key] ?? intent;

  if (current.status === 'published') {
    intent.status = 'published';
    intent.publishedAt = current.publishedAt;
    return { status: 'already-published', record: hydrateOutboxRecord(current) };
  }

  const now = new Date();
  if (current.status === 'publishing') {
    const isExpired =
      typeof current.leaseExpiresAt === 'string' &&
      new Date(current.leaseExpiresAt).getTime() <= now.getTime();
    if (!isExpired) {
      throw new Error('Outbox publication intent is already being published by an active dispatcher');
    }
  }

  current.status = 'publishing';
  current.ownerToken = normalizedOwner;
  current.attemptCount += 1;
  current.leaseExpiresAt = new Date(now.getTime() + DEFAULT_OUTBOX_LEASE_MS).toISOString();
  state.byCompositeKey[key] = current;
  state.compositeKeyByEventId[current.eventId] = key;

  intent.status = 'publishing';
  intent.ownerToken = normalizedOwner;
  intent.attemptCount = current.attemptCount;

  const lockedIntent = hydrateOutboxRecord(current);

  try {
    await publishFn(lockedIntent);
    const postState = getIsolatedOutboxTestAdapter();
    const latest = postState.byCompositeKey[key] ?? current;
    if (latest.status !== 'published' && (latest.status !== 'publishing' || latest.ownerToken !== normalizedOwner)) {
      throw new Error('Outbox publication ownership lost before completion');
    }
    const publishedAt = new Date().toISOString();
    latest.status = 'published';
    latest.publishedAt = publishedAt;
    latest.leaseExpiresAt = null;
    latest.lastError = null;
    postState.byCompositeKey[key] = latest;

    intent.status = 'published';
    intent.publishedAt = publishedAt;
    intent.lastError = null;

    return { status: 'published', record: hydrateOutboxRecord(latest) };
  } catch (error) {
    const errState = getIsolatedOutboxTestAdapter();
    const latest = errState.byCompositeKey[key];
    const message = error instanceof Error ? error.message : String(error);
    if (latest !== undefined && latest.status === 'publishing' && latest.ownerToken === normalizedOwner) {
      latest.status = 'failed';
      latest.leaseExpiresAt = null;
      latest.lastError = message;
      errState.byCompositeKey[key] = latest;
      intent.status = 'failed';
      intent.lastError = message;
    }
    throw error;
  }
}

export function clearWorkerOutboxLedgerForTests(): void {
  const store = getIsolatedOutboxTestAdapter();
  store.byCompositeKey = {};
  store.compositeKeyByEventId = {};
}
