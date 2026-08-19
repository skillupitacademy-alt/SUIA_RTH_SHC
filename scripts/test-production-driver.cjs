#!/usr/bin/env node
/**
 * Test the ACTUAL @neondatabase/serverless driver in production
 * This runs INSIDE the production container to test the exact same driver configuration
 */

const { Pool } = require('@neondatabase/serverless');

async function testProductionDriver() {
    console.log('================================================');
    console.log('PRODUCTION DRIVER TEST (@neondatabase/serverless)');
    console.log('================================================\n');

    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL not set');
        process.exit(1);
    }

    // Mask credentials
    const masked = DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://USER:****@');
    console.log(`DATABASE_URL: ${masked.substring(0, 100)}...`);
    console.log('');

    console.log('[Test 1/4] Basic Connection Test');
    console.log('-------------------------------------------');
    
    const pool = new Pool({
        connectionString: DATABASE_URL,
        max: 1,
        connectionTimeoutMillis: 10000,
    });

    try {
        const start = Date.now();
        const result = await pool.query('SELECT 1 AS test');
        const duration = Date.now() - start;
        console.log(`✓ Connection successful (${duration}ms)`);
        console.log(`  Result: ${result.rows[0].test}`);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.error('  Code:', err.code);
        console.error('  Name:', err.name);
        await pool.end();
        process.exit(1);
    }
    console.log('');

    console.log('[Test 2/4] Database Info');
    console.log('-------------------------------------------');
    try {
        const result = await pool.query('SELECT current_database(), current_user');
        console.log(`✓ Query successful`);
        console.log(`  Database: ${result.rows[0].current_database}`);
        console.log(`  User: ${result.rows[0].current_user}`);
    } catch (err) {
        console.error('❌ Query failed:', err.message);
    }
    console.log('');

    console.log('[Test 3/4] Count Domains');
    console.log('-------------------------------------------');
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM domains');
        console.log(`✓ Domains count successful`);
        console.log(`  Count: ${result.rows[0].count}`);
    } catch (err) {
        console.error('❌ Domains count failed:', err.message);
        console.error('  Code:', err.code);
    }
    console.log('');

    console.log('[Test 4/4] Exact Production Query (FAILING in Next.js)');
    console.log('-------------------------------------------');
    try {
        const result = await pool.query(`
            SELECT 
                id, 
                name, 
                description, 
                category, 
                status, 
                "order", 
                created_at, 
                updated_at, 
                deleted_at 
            FROM domains 
            WHERE deleted_at IS NULL 
            LIMIT 3
        `);
        console.log(`✓ Exact query successful!`);
        console.log(`  Found ${result.rows.length} domain(s):`);
        result.rows.forEach(row => {
            console.log(`    - ${row.name} (${row.id})`);
        });
    } catch (err) {
        console.error('❌ Exact query failed:', err.message);
        console.error('  Code:', err.code);
        console.error('  Name:', err.name);
        console.error('  Stack:', err.stack ? err.stack.split('\n')[0] : 'N/A');
    }
    console.log('');

    await pool.end();

    console.log('================================================');
    console.log('DRIVER TEST COMPLETE');
    console.log('================================================\n');
}

testProductionDriver().catch(err => {
    console.error('\n❌ FATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
});
