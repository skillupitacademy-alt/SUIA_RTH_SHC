#!/usr/bin/env node

/**
 * Cache Invalidation Diagnostic Test
 * 
 * Tests the Upstash Redis cache invalidation that's failing with "fetch failed"
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from workspace root
config({ path: resolve(__dirname, '../.env.local') });

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   CACHE INVALIDATION DIAGNOSTIC TEST                      ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

// Test 1: Check environment variables
console.log('[TEST 1] Check Environment Variables');
console.log(`  UPSTASH_REDIS_REST_URL: ${UPSTASH_REDIS_REST_URL ? '✅ SET' : '❌ MISSING'}`);
if (UPSTASH_REDIS_REST_URL) {
  console.log(`    Value: ${UPSTASH_REDIS_REST_URL}`);
}
console.log(`  UPSTASH_REDIS_REST_TOKEN: ${UPSTASH_REDIS_REST_TOKEN ? '✅ SET' : '❌ MISSING'}`);
if (UPSTASH_REDIS_REST_TOKEN) {
  console.log(`    Value: ${UPSTASH_REDIS_REST_TOKEN.substring(0, 10)}...`);
}
console.log('');

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

// Test 2: Test basic connectivity (PING)
console.log('[TEST 2] Test Redis Connectivity (PING)');
try {
  const pingUrl = `${UPSTASH_REDIS_REST_URL}/ping`;
  console.log(`  Testing: ${pingUrl}`);
  
  const response = await fetch(pingUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  
  console.log(`  Response status: ${response.status}`);
  const result = await response.text();
  console.log(`  Response body: ${result}`);
  
  if (response.ok) {
    console.log('  ✅ Redis connectivity: SUCCESS');
  } else {
    console.log('  ❌ Redis connectivity: FAILED');
  }
} catch (error) {
  console.log(`  ❌ Redis connectivity: FAILED`);
  console.log(`  Error: ${error.message}`);
}
console.log('');

// Test 3: Test SET operation
console.log('[TEST 3] Test SET Operation');
const testKey = 'test:cache:diagnostic';
const testValue = `test-${Date.now()}`;
try {
  const setUrl = `${UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(testKey)}/${encodeURIComponent(testValue)}`;
  console.log(`  Setting key: ${testKey}`);
  console.log(`  URL: ${setUrl}`);
  
  const response = await fetch(setUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  
  console.log(`  Response status: ${response.status}`);
  const result = await response.text();
  console.log(`  Response body: ${result}`);
  
  if (response.ok) {
    console.log('  ✅ SET operation: SUCCESS');
  } else {
    console.log('  ❌ SET operation: FAILED');
  }
} catch (error) {
  console.log(`  ❌ SET operation: FAILED`);
  console.log(`  Error: ${error.message}`);
}
console.log('');

// Test 4: Test DEL operation (the one failing in production)
console.log('[TEST 4] Test DEL Operation');
try {
  const delUrl = `${UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(testKey)}`;
  console.log(`  Deleting key: ${testKey}`);
  console.log(`  URL: ${delUrl}`);
  
  const response = await fetch(delUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
    cache: 'no-store',
  });
  
  console.log(`  Response status: ${response.status}`);
  const result = await response.text();
  console.log(`  Response body: ${result}`);
  
  if (response.ok) {
    console.log('  ✅ DEL operation: SUCCESS');
  } else {
    console.log('  ❌ DEL operation: FAILED');
  }
} catch (error) {
  console.log(`  ❌ DEL operation: FAILED`);
  console.log(`  Error: ${error.message}`);
  console.log(`  Error stack: ${error.stack}`);
}
console.log('');

// Test 5: Test actual cache keys from production
console.log('[TEST 5] Test Actual Production Cache Keys');
const productionKeys = [
  'tutorial:v1:sections:whatisjava:simple',
  'tutorial:v1:paths',
  'tutorial:v2:sections:whatisjava:simple',
  'tutorial:v2:paths',
];

for (const key of productionKeys) {
  console.log(`  Testing key: ${key}`);
  try {
    const delUrl = `${UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(key)}`;
    const response = await fetch(delUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    console.log(`    Status: ${response.status}`);
    if (response.ok) {
      console.log(`    ✅ SUCCESS`);
    } else {
      const errorText = await response.text();
      console.log(`    ❌ FAILED: ${errorText}`);
    }
  } catch (error) {
    console.log(`    ❌ FAILED: ${error.message}`);
  }
}
console.log('');

console.log('════════════════════════════════════════════════════════════');
console.log('DIAGNOSTIC COMPLETE');
console.log('════════════════════════════════════════════════════════════');
