import { Redis } from '@upstash/redis';

type CacheLike = Pick<Redis, 'get' | 'set' | 'del' | 'exists'>;

const createNoopCache = (): CacheLike => ({
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  exists: async () => 0,
});

export const createCacheClient = (): CacheLike => {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url === undefined || url.trim().length === 0 || token === undefined || token.trim().length === 0) {
    return createNoopCache();
  }

  return new Redis({ url, token });
};

export const cache = createCacheClient();
