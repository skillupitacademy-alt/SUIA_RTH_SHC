import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Use current working directory or find project root
const projectRoot = resolve(process.cwd(), process.cwd().includes('apps') ? '../..' : '.');

// Load environment variables from various locations
dotenv.config({ path: resolve(projectRoot, '.env.local') });
dotenv.config({ path: resolve(projectRoot, 'apps/api-server/.env.local') });
dotenv.config({ path: resolve(projectRoot, '.env') });

async function clearCache() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('Error: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not found in environment.');
    process.exit(1);
  }

  const redis = new Redis({
    url,
    token,
  });

  try {
    console.log('Connecting to Upstash Redis...');
    const dbsize = await redis.dbsize();
    console.log(`Current DB size: ${dbsize} keys`);

    if (dbsize === 0) {
      console.log('Cache is already empty.');
      return;
    }

    const command = process.argv[2] === '--all' ? 'FLUSHDB' : 'DELETE_REPORTS';

    if (command === 'FLUSHDB') {
      console.log('Flushing entire database...');
      await redis.flushdb();
      console.log('Cache cleared successfully.');
    } else {
      console.log('Searching for report-related keys...');
      // Simplistic approach to delete keys with "attempt:" prefix
      // In a production environment with many keys, use SCAN instead
      const keys = await redis.keys('attempt:*');
      console.log(`Found ${keys.length} report keys.`);
      
      if (keys.length > 0) {
        for (let i = 0; i < keys.length; i += 100) {
          const batch = keys.slice(i, i + 100);
          await redis.del(...batch);
        }
        console.log('Report cache cleared successfully (v4 and prior).');
      } else {
        console.log('No report keys found.');
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
