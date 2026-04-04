import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (redisClient !== null) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (typeof url !== 'string' || url.trim() === '' || typeof token !== 'string' || token.trim() === '') {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export const redis = new Proxy({} as Redis, {
  get(_target, property, receiver) {
    const client = getRedisClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
