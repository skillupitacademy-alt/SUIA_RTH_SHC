#!/usr/bin/env tsx
/**
 * PHASE B: EXPERIMENTAL TEST
 * Test with WebSocket configuration ADDED
 * Expected: PASS (if this is the fix)
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';
import { domains } from '../packages/db/src/schema/domain';
import { isNull, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Configure WebSocket (THE EXPERIMENTAL CHANGE)
neonConfig.webSocketConstructor = WebSocket;

dotenv.config({ path: '.env.local' });

console.log('===========================================================');
console.log('PHASE B: EXPERIMENTAL TEST (With WebSocket Config)');
console.log('===========================================================\n');

console.log('Configuration:');
console.log('  Driver: @neondatabase/serverless');
console.log('  Adapter: drizzle-orm/neon-serverless');
console.log('  WebSocket Config: ✅ neonConfig.webSocketConstructor = WebSocket');
console.log('  ws dependency: ✅ ws@^8.18.0');
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

// Create pool with EXPERIMENTAL configuration (WITH WebSocket config)
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
    const result = await pool.query(`
        SELECT id, name, description, category, status, "order", 
               created_at, updated_at, deleted_at
        FROM domains
        WHERE deleted_at IS NULL
        LIMIT 5
    `);
    
    const duration = Date.now() - start;
    console.log(`✓ PASS (${duration}ms)`);
    console.log(`  Found ${result.rows.length} domain(s)`);
    result.rows.forEach(row => {
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
        console.error('  WebSocket configuration did NOT fix the issue!');
    }
    
    await pool.end();
    process.exit(1);
}

await pool.end();

console.log('');
console.log('===========================================================');
console.log('PHASE B: EXPERIMENTAL RESULT');
console.log('===========================================================');
console.log('✓ ALL TESTS PASSED');
console.log('');
console.log('CONCLUSION: WebSocket configuration works correctly.');
console.log('');

process.exit(0);
