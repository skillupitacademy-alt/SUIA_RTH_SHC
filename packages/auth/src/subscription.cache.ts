import { Redis } from '@upstash/redis';

const CACHE_TTL_SECONDS = 300;

type SubscriptionSnapshot = Record<string, unknown>;

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (typeof url !== 'string' || url.trim().length === 0 || typeof token !== 'string' || token.trim().length === 0) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export function getSubscriptionCacheKey(userId: string) {
  return `sub:${userId}`;
}

export async function getSubscriptionCache<T extends SubscriptionSnapshot>(userId: string): Promise<T | null> {
  const client = getRedisClient();
  if (client === null) {
    return null;
  }

  const value = await client.get(getSubscriptionCacheKey(userId));
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  return value as T;
}

export async function setSubscriptionCache<T extends SubscriptionSnapshot>(userId: string, value: T, ttlSeconds = CACHE_TTL_SECONDS) {
  const client = getRedisClient();
  if (client === null) {
    return false;
  }

  await client.set(getSubscriptionCacheKey(userId), JSON.stringify(value), { ex: ttlSeconds });
  return true;
}

export async function getOrSetSubscriptionCache<T extends SubscriptionSnapshot>(
  userId: string,
  loader: () => Promise<T>,
  ttlSeconds = CACHE_TTL_SECONDS,
) {
  const cached = await getSubscriptionCache<T>(userId);
  if (cached !== null) {
    return cached;
  }

  const value = await loader();
  await setSubscriptionCache(userId, value, ttlSeconds);
  return value;
}
