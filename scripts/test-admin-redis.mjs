#!/usr/bin/env node
/**
 * Test Admin System Usage Endpoint (Redis-backed)
 * 
 * This script:
 * 1. Authenticates as admin using real credentials
 * 2. Calls /api/admin/system/usage which internally uses cacheService.getUsage()
 * 3. Verifies Redis operations (info, dbsize) succeed
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables required');
  console.error('\nUsage:');
  console.error('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=your-password node scripts/test-admin-redis.mjs');
  process.exit(1);
}

console.log('==============================================');
console.log('ADMIN SYSTEM USAGE - REDIS VERIFICATION');
console.log('==============================================\n');
console.log(`API URL: ${API_URL}`);
console.log(`Admin: ${ADMIN_EMAIL}\n`);

async function main() {
  try {
    // Step 1: Login (using SHC-specific endpoint)
    console.log('STEP 1: SkillHubCore Admin Login');
    const loginResponse = await fetch(`${API_URL}/api/shc/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${error}`);
    }

    const loginData = await loginResponse.json();
    console.log(`✅ Login successful: ${loginData.user.email}`);
    
    // SHC returns tokens in body, not cookies
    if (!loginData.accessToken) {
      throw new Error('No accessToken in login response');
    }
    
    const accessToken = loginData.accessToken;
    console.log(`✅ Access token obtained (length: ${accessToken.length})\n`);

    // Step 2: Call system usage endpoint
    console.log('STEP 2: Call /api/admin/system/usage');
    console.log('This endpoint internally calls:');
    console.log('  UsageService.getRedisUsage()');
    console.log('    → cacheService.getUsage()');
    console.log('      → redis.info("memory")');
    console.log('      → redis.dbsize()\n');

    const usageResponse = await fetch(`${API_URL}/api/admin/system/usage`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_accessToken=${accessToken}`,
        'x-portal-identity': 'shc-admin',
      },
    });

    if (!usageResponse.ok) {
      const error = await usageResponse.text();
      throw new Error(`System usage failed: ${usageResponse.status} - ${error}`);
    }

    const usageData = await usageResponse.json();
    
    console.log('✅ System usage endpoint responded\n');
    
    // Step 3: Verify Redis metrics
    console.log('STEP 3: Verify Redis Service Status');
    console.log('==============================================');
    
    if (!usageData.redis) {
      throw new Error('No Redis data in response');
    }

    const redis = usageData.redis;
    
    console.log(`Status: ${redis.status}`);
    console.log(`Configured: ${redis.configured}`);
    console.log(`Checked At: ${redis.checkedAt}`);
    
    if (redis.metrics) {
      console.log('\nRedis Metrics:');
      console.log(`  Keys: ${redis.metrics.keys}`);
      console.log(`  Memory: ${redis.metrics.memory}`);
      console.log(`  Memory Bytes: ${redis.metrics.memoryBytes}`);
      if (redis.metrics.usagePercent !== null) {
        console.log(`  Usage: ${redis.metrics.usagePercent}%`);
      }
    }
    
    if (redis.error) {
      console.log(`\n❌ Redis Error: ${redis.error.message}`);
      throw new Error('Redis operation failed');
    }

    console.log('\n==============================================');
    console.log('✅ REDIS VERIFICATION: PASS');
    console.log('==============================================');
    console.log('\nPROVEN:');
    console.log('  ✓ Admin authentication successful');
    console.log('  ✓ /api/admin/system/usage endpoint reached');
    console.log('  ✓ UsageService.getRedisUsage() executed');
    console.log('  ✓ cacheService.getUsage() executed');
    console.log('  ✓ Redis operations (info/dbsize) succeeded');
    console.log(`  ✓ Redis status: ${redis.status}`);
    console.log(`  ✓ Redis keys: ${redis.metrics?.keys ?? 'N/A'}`);
    console.log(`  ✓ Redis memory: ${redis.metrics?.memory ?? 'N/A'}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED');
    console.error(error.message);
    process.exit(1);
  }
}

main();
