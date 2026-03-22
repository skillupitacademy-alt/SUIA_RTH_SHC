type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export const createRateLimiter = (scope: string, limit: number, windowSeconds: number) => {
  const ttlMillis = windowSeconds * 1000;

  return {
    async check(key: string): Promise<RateLimitResult> {
      const cacheKey = `${scope}:${key}`;
      const now = Date.now();
      const existing = memoryStore.get(cacheKey);

      if (existing !== undefined && existing.expiresAt > now) {
        if (existing.count >= limit) {
          return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
          };
        }

        existing.count += 1;
        memoryStore.set(cacheKey, existing);
        return { allowed: true, retryAfterSeconds: 0 };
      }

      memoryStore.set(cacheKey, { count: 1, expiresAt: now + ttlMillis });
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
};
