import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

// 1. Dynamic Root .env.local Loader
function loadRootEnv() {
  try {
    const rootEnvPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(rootEnvPath)) {
      const envContent = fs.readFileSync(rootEnvPath, 'utf8');
      for (const line of envContent.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            if (val.startsWith("'") && val.endsWith("'")) {
              val = val.substring(1, val.length - 1);
            }
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Root .env.local loader warning:', e.message);
  }
}

loadRootEnv();

// 2. Resolve credentials
const url = process.env.UPSTASH_REDIS_REST_URL || 'https://national-goose-7390.upstash.io';
const token = process.env.UPSTASH_REDIS_REST_TOKEN || 'ARzeAAImcDIwMjYwNTJiNTY5NjM0MjJhYTg2MzlmYjIwYWFkMGNkNHAyNzM5MA';

if (!url || !token) {
  console.error('❌ Error: Redis credentials not found in env or .env.local.');
  process.exit(1);
}

const redis = new Redis({ url, token });
const subtopicArg = process.argv[2]?.trim().toLowerCase();

async function run() {
  try {
    console.log('⚡ Connected to Upstash Redis:');
    console.log(`🔗 Endpoint: ${url}\n`);

    // Case 1: Specific Subtopic Slug provided
    if (subtopicArg) {
      if (subtopicArg === 'all') {
        console.log('🧹 Scanning for ALL cached tutorial keys...');
        const keys = await redis.keys('tutorial:v2:*');
        
        if (keys.length === 0) {
          console.log('✅ No cached keys found. Redis is already clean!');
          return;
        }

        console.log(`Found ${keys.length} cache keys to clear.`);
        const deletedCount = await redis.del(...keys);
        console.log(`🗑️ Successfully deleted ${deletedCount} cache keys from Redis!`);
        return;
      }

      console.log(`🔍 Invalidating cache for subtopic: "${subtopicArg}"...`);
      const keysToClear = [
        `tutorial:v2:sections:${subtopicArg}:simple`,
        `tutorial:v2:sections:${subtopicArg}:medium`,
        `tutorial:v2:sections:${subtopicArg}:hard`,
        'tutorial:v2:paths'
      ];

      let clearedCount = 0;
      for (const key of keysToClear) {
        const existed = await redis.exists(key);
        if (existed) {
          await redis.del(key);
          console.log(`🗑️  Deleted: "${key}"`);
          clearedCount++;
        }
      }

      if (clearedCount === 0) {
        console.log(`ℹ️  No active cache found in Redis for "${subtopicArg}".`);
      } else {
        console.log(`\n✅ Invalidation complete. ${clearedCount} keys purged.`);
      }
      return;
    }

    // Case 2: Interactive List & Guides
    console.log('📊 Active Tutorial Cache Map in Redis:');
    const sectionsKeys = await redis.keys('tutorial:v2:sections:*');
    const pathKeys = await redis.keys('tutorial:v2:paths');

    const allKeys = [...sectionsKeys, ...pathKeys];

    if (allKeys.length === 0) {
      console.log('🟢 Redis Cache is empty (clean slate).');
    } else {
      allKeys.forEach((key) => {
        console.log(` • 🔑 ${key}`);
      });
    }

    console.log('\n💡 Usage Instructions:');
    console.log('----------------------------------------------------');
    console.log('1. Clear a specific subtopic:');
    console.log('   node scratch/clear-redis-cache.mjs <subtopicSlug>');
    console.log('   Example: node scratch/clear-redis-cache.mjs whatisjavascript\n');
    console.log('2. Purge absolutely everything:');
    console.log('   node scratch/clear-redis-cache.mjs all');
    console.log('----------------------------------------------------');

  } catch (error) {
    console.error('❌ Error executing cache purge:', error);
  }
}

run();
