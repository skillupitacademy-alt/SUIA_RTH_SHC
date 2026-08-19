#!/usr/bin/env tsx
/**
 * PHASE A: BASELINE TEST
 * Test the CURRENT @quiz/db configuration (WITHOUT WebSocket config)
 * Expected: FAIL with "Connection terminated unexpectedly"
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { domains } from '../packages/db/src/schema/domain';
import { isNull } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('===========================================================');
console.log('PHASE A: BASELINE TEST (Current Configuration)');
console.log('===========================================================\n');

console.log('Configuration:');
console.log('  Driver: @neondatabase/serverless');
console.log('  Adapter: drizzle-orm/neon-serverless');
console.log('  WebSocket Config: ❌ NOT SET (current production state)');
console.log('  ws dependency: ❌ NOT in package.json');
console.log('');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in .env.local');
    process.exit(1);
}

// Show masked URL
const masked = DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://USER:****@');
console.log(`DATABASE_URL: ${masked}`);

// Extract pooler host
const hostMatch = DATABASE_URL.match(/@([^/]+)\//);
if (hostMatch && hostMatch[1].includes('pooler')) {
    console.log(`✓ Using Neon POOLER: ${hostMatch[1]}`);
} else {
    console.log(`⚠ Not using pooler endpoint`);
}
console.log('');

// Create pool with CURRENT configuration (no WebSocket config)
const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10000,
});

const db = drizzle(pool);

console.log('[Test 1/3] SELECT 1');
console.log('-------------------------------------------');
try {
    const start = Date.now();
    const result = await pool.query('SELECT 1 AS test');
    const duration = Date.now() - start;
    console.log(`✓ PASS (${duration}ms)`);
    console.log(`  Result: ${result.rows[0].test}`);
} catch (err) {
    console.error(`❌ FAIL: ${err.message}`);
    console.error(`  Code: ${err.code || 'N/A'}`);
    console.error(`  Name: ${err.name}`);
    await pool.end();
    process.exit(1);
}
console.log('');

console.log('[Test 2/3] SELECT COUNT(*) FROM domains');
console.log('-------------------------------------------');
try {
    const start = Date.now();
    const result = await pool.query('SELECT COUNT(*) as count FROM domains');
    const duration = Date.now() - start;
    console.log(`✓ PASS (${duration}ms)`);
    console.log(`  Count: ${result.rows[0].count}`);
} catch (err) {
    console.error(`❌ FAIL: ${err.message}`);
    console.error(`  Code: ${err.code || 'N/A'}`);
    await pool.end();
    process.exit(1);
}
console.log('');

console.log('[Test 3/3] Exact Production Query (via Drizzle)');
console.log('-------------------------------------------');
console.log('Query: SELECT id, name, description, category, status, "order",');
console.log('       created_at, updated_at, deleted_at FROM domains');
console.log('       WHERE deleted_at IS NULL');
console.log('');

try {
    const start = Date.now();
    const result = await db
        .select({
            id: domains.id,
            name: domains.name,
            description: domains.description,
            category: domains.category,
            status: domains.status,
            order: domains.order,
            created_at: domains.created_at,
            updated_at: domains.updated_at,
            deleted_at: domains.deleted_at,
        })
        .from(domains)
        .where(isNull(domains.deleted_at));
    
    const duration = Date.now() - start;
    console.log(`✓ PASS (${duration}ms)`);
    console.log(`  Found ${result.length} domain(s)`);
    result.slice(0, 3).forEach(row => {
        console.log(`    - ${row.name} (${row.category})`);
    });
} catch (err) {
    console.error(`❌ FAIL: ${err.message}`);
    console.error(`  Code: ${err.code || 'N/A'}`);
    console.error(`  Name: ${err.name}`);
    console.error(`  Cause: ${err.cause?.message || 'N/A'}`);
    
    if (err.message.includes('Connection terminated')) {
        console.error('');
        console.error('⚠ CONNECTION TERMINATED UNEXPECTEDLY');
        console.error('  This matches the production error!');
    }
    
    await pool.end();
    process.exit(1);
}

await pool.end();

console.log('');
console.log('===========================================================');
console.log('PHASE A: BASELINE RESULT');
console.log('===========================================================');
console.log('✓ ALL TESTS PASSED');
console.log('');
console.log('UNEXPECTED: Current configuration works locally!');
console.log('This suggests the issue may be specific to production environment.');
console.log('');

process.exit(0);
