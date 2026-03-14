import { Redis } from '@upstash/redis';

const examId = process.argv[2];
const userId = process.argv[3];

if (!examId || !userId) {
  console.error('Usage: node scripts/clear-export-cache.mjs <examId> <userId>');
  process.exit(1);
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set.');
  process.exit(1);
}

const redis = new Redis({ url, token });

async function main() {
  const keys = [
    `export:${examId}:${userId}:json`,
    `export:${examId}:${userId}:csv`,
  ];

  const results = await Promise.all(
    keys.map(async (key) => {
      const existed = await redis.exists(key);
      if (existed) {
        await redis.del(key);
        return { key, deleted: true };
      }
      return { key, deleted: false };
    })
  );

  for (const r of results) {
    console.log(`${r.deleted ? 'Deleted' : 'Not found'}: ${r.key}`);
  }
}

main().catch((err) => {
  console.error('Failed to clear cache:', err);
  process.exit(1);
});
