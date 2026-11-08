import { randomUUID } from 'node:crypto';
import { redis } from '@/lib/redis';

const RELEASE_JOB_LOCK_IF_OWNER_LUA = `
if redis.call("GET", KEYS[1]) ~= ARGV[1] then
  return 0
end
return redis.call("DEL", KEYS[1])
`.trim();

const activeOwnerTokensByJobId = new Map<string, string>();

export async function acquireJobLock(
  jobId: string,
  ttlSeconds: number = 300,
  ownerToken: string = randomUUID()
): Promise<boolean> {
  const key = `job-lock:${jobId}`;
  const result: unknown = await redis.set(key, ownerToken, { nx: true, ex: ttlSeconds });
  if (result === 'OK' || result === true) {
    activeOwnerTokensByJobId.set(jobId, ownerToken);
    return true;
  }
  return false;
}

export async function releaseJobLock(
  jobId: string,
  expectedOwnerToken?: string
): Promise<boolean> {
  const key = `job-lock:${jobId}`;
  const ownerToken = expectedOwnerToken ?? activeOwnerTokensByJobId.get(jobId);
  activeOwnerTokensByJobId.delete(jobId);

  if (typeof ownerToken === 'string' && ownerToken.trim().length > 0 && typeof redis.eval === 'function') {
    const result = await redis.eval(RELEASE_JOB_LOCK_IF_OWNER_LUA, [key], [ownerToken]);
    return result === 1 || result === '1';
  }

  return false;
}
