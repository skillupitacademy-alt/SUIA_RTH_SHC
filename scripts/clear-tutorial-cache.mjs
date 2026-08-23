#!/usr/bin/env node

/**
 * Clear Tutorial Delivery Cache Script
 * 
 * Manually clears Upstash Redis cache for tutorial delivery.
 * This is a workaround for when automatic cache invalidation fails.
 * 
 * Usage:
 *   node scripts/clear-tutorial-cache.mjs <subtopic-slug>
 *   node scripts/clear-tutorial-cache.mjs whatisjava
 *   node scripts/clear-tutorial-cache.mjs all  # Clear all tutorial caches
 */

import { Redis } from '@upstash/redis';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('❌ UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set.');
  console.error('   Check your .env.local file');
  process.exit(1);
}

const redis = new Redis({ url, token });

const TUTORIAL_CACHE_VERSIONS = ['v1', 'v2'];
const TUTORIAL_DIFFICULTIES = ['simple'];

async function clearTutorialCache(subtopicSlug) {
  console.log(`\n🗑️  Clearing cache for: ${subtopicSlug}`);
  console.log('━'.repeat(60));

  // Generate all cache keys for this subtopic
  const keys = TUTORIAL_CACHE_VERSIONS.flatMap((version) => [
    ...TUTORIAL_DIFFICULTIES.map(
      (difficulty) => `tutorial:${version}:sections:${subtopicSlug}:${difficulty}`
    ),
  ]);

  // Also add path keys
  const pathKeys = TUTORIAL_CACHE_VERSIONS.map((version) => `tutorial:${version}:paths`);
  keys.push(...pathKeys);

  console.log(`\n📋 Keys to delete (${keys.length}):`);
  keys.forEach((key) => console.log(`   - ${key}`));

  let deleted = 0;
  let notFound = 0;
  let errors = 0;

  for (const key of keys) {
    try {
      const existed = await redis.exists(key);
      if (existed) {
        await redis.del(key);
        console.log(`   ✅ Deleted: ${key}`);
        deleted++;
      } else {
        console.log(`   ⚪ Not found: ${key}`);
        notFound++;
      }
    } catch (error) {
      console.error(`   ❌ Error deleting ${key}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Deleted: ${deleted}`);
  console.log(`   ⚪ Not found: ${notFound}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('━'.repeat(60));

  return { deleted, notFound, errors };
}

async function clearAllTutorialCaches() {
  console.log('\n🗑️  Clearing ALL tutorial caches');
  console.log('━'.repeat(60));

  try {
    // Scan for all tutorial cache keys
    const patterns = TUTORIAL_CACHE_VERSIONS.map((version) => `tutorial:${version}:*`);
    
    let allKeys = [];
    for (const pattern of patterns) {
      console.log(`\n🔍 Scanning for pattern: ${pattern}`);
      
      // Use scan to find all matching keys
      let cursor = 0;
      do {
        const result = await redis.scan(cursor, { match: pattern, count: 100 });
        cursor = result[0];
        const keys = result[1];
        
        if (keys.length > 0) {
          allKeys = allKeys.concat(keys);
          console.log(`   Found ${keys.length} keys`);
        }
      } while (cursor !== 0);
    }

    if (allKeys.length === 0) {
      console.log('\n⚪ No tutorial cache keys found');
      return { deleted: 0, errors: 0 };
    }

    console.log(`\n📋 Total keys found: ${allKeys.length}`);
    allKeys.forEach((key) => console.log(`   - ${key}`));

    let deleted = 0;
    let errors = 0;

    console.log('\n🗑️  Deleting keys...');
    for (const key of allKeys) {
      try {
        await redis.del(key);
        console.log(`   ✅ Deleted: ${key}`);
        deleted++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${key}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '━'.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Deleted: ${deleted}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('━'.repeat(60));

    return { deleted, errors };
  } catch (error) {
    console.error(`\n❌ Scan failed: ${error.message}`);
    return { deleted: 0, errors: 1 };
  }
}

async function main() {
  const subtopicSlug = process.argv[2];

  if (!subtopicSlug) {
    console.error('❌ Usage: node scripts/clear-tutorial-cache.mjs <subtopic-slug|all>');
    console.error('\nExamples:');
    console.error('  node scripts/clear-tutorial-cache.mjs whatisjava');
    console.error('  node scripts/clear-tutorial-cache.mjs what-is-java?');
    console.error('  node scripts/clear-tutorial-cache.mjs all');
    process.exit(1);
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   TUTORIAL CACHE CLEARING UTILITY                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n📡 Upstash Redis: ${url}`);

  // Test connection
  console.log('\n🔌 Testing Redis connection...');
  try {
    await redis.ping();
    console.log('   ✅ Connected successfully');
  } catch (error) {
    console.error('   ❌ Connection failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if Upstash Redis URL is accessible from this environment');
    console.error('   2. Verify UPSTASH_REDIS_REST_TOKEN is correct');
    console.error('   3. Check network/firewall/VPN settings');
    process.exit(1);
  }

  let result;
  if (subtopicSlug.toLowerCase() === 'all') {
    result = await clearAllTutorialCaches();
  } else {
    result = await clearTutorialCache(subtopicSlug);
  }

  if (result.errors > 0) {
    console.log('\n⚠️  Some operations failed. Check the errors above.');
    process.exit(1);
  } else if (result.deleted === 0 && result.notFound > 0) {
    console.log('\n⚪ No cache entries were found to delete.');
    process.exit(0);
  } else {
    console.log('\n✅ Cache clearing completed successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n❌ Script failed:', err);
  process.exit(1);
});
