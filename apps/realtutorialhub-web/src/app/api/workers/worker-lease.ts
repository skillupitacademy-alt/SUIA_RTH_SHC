export interface WorkerRedisLike {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
  del?(key: string): Promise<unknown> | unknown;
  eval?(script: string, keys: string[], args: Array<string | number>): Promise<unknown> | unknown;
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
redis.call("DEL", KEYS[1])
return 1
`.trim();

const claimingWorkerKeysByStore = new WeakMap<object, Set<string>>();

export function isPendingWorkerLeaseValue(raw: string): boolean {
  const normalized = raw.trim();
  return (
    normalized === 'processing' ||
    normalized.startsWith('processing:') ||
    normalized.startsWith('pending:')
  );
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
  if (redis === null || typeof redis !== 'object' || typeof redis.get !== 'function' || typeof redis.set !== 'function') {
    throw new Error('Unsupported worker lease Redis adapter');
  }

  let storeClaims = claimingWorkerKeysByStore.get(redis);
  if (storeClaims === undefined) {
    storeClaims = new Set<string>();
    claimingWorkerKeysByStore.set(redis, storeClaims);
  }
  if (storeClaims.has(key)) {
    return { kind: 'busy' };
  }
  storeClaims.add(key);

  try {
    const existing = await redis.get(key);
    if (existing !== null && existing !== undefined && String(existing).trim().length > 0) {
      const existingStr = String(existing).trim();
      if (isPendingWorkerLeaseValue(existingStr)) {
        return { kind: 'busy' };
      }
      return { kind: 'already-completed', existingValue: existingStr };
    }

    const ownerToken = options.ownerToken ?? crypto.randomUUID();
    const pendingValue = `${options.pendingPrefix ?? 'processing'}:${ownerToken}`;
    const claimed = await redis.set(key, pendingValue, {
      ex: options.leaseSeconds,
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
  } finally {
    storeClaims.delete(key);
  }
}

export async function completeWorkerLeaseIfOwner(
  redis: WorkerRedisLike,
  key: string,
  expectedPending: string,
  completedValue: string,
  retentionSeconds: number
): Promise<WorkerLeaseTransitionOutcome> {
  if (typeof redis.completeIfOwner === 'function') {
    return redis.completeIfOwner({
      key,
      expectedPending,
      completedValue,
      retentionSeconds,
    });
  }

  if (typeof redis.eval === 'function') {
    const result = await redis.eval(
      WORKER_COMPLETE_IF_OWNER_LUA,
      [key],
      [expectedPending, completedValue, retentionSeconds]
    );
    return result === 1 || result === '1' || result === 'OK' || result === true
      ? 'applied'
      : 'owner-lost';
  }

  const firstSnapshot = await redis.get(key);
  if (firstSnapshot === null || firstSnapshot === undefined || String(firstSnapshot) !== expectedPending) {
    return 'owner-lost';
  }
  const secondSnapshot = await redis.get(key);
  if (secondSnapshot === null || secondSnapshot === undefined || String(secondSnapshot) !== expectedPending) {
    return 'owner-lost';
  }

  await redis.set(key, completedValue, { ex: retentionSeconds });
  return 'applied';
}

export async function releaseWorkerLeaseIfOwner(
  redis: WorkerRedisLike,
  key: string,
  expectedPending: string
): Promise<WorkerLeaseTransitionOutcome> {
  if (typeof redis.releaseIfOwner === 'function') {
    return redis.releaseIfOwner({
      key,
      expectedPending,
    });
  }

  if (typeof redis.eval === 'function') {
    const result = await redis.eval(
      WORKER_RELEASE_IF_OWNER_LUA,
      [key],
      [expectedPending]
    );
    return result === 1 || result === '1' || result === 'OK' || result === true
      ? 'applied'
      : 'owner-lost';
  }

  const firstSnapshot = await redis.get(key);
  if (firstSnapshot === null || firstSnapshot === undefined || String(firstSnapshot) !== expectedPending) {
    return 'owner-lost';
  }
  const secondSnapshot = await redis.get(key);
  if (secondSnapshot === null || secondSnapshot === undefined || String(secondSnapshot) !== expectedPending) {
    return 'owner-lost';
  }

  if (typeof redis.del === 'function') {
    await redis.del(key);
  } else {
    await redis.set(key, '');
  }
  return 'applied';
}

