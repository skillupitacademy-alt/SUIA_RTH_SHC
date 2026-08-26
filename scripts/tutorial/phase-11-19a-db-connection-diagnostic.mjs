/**
 * PHASE 11.19A — DATABASE CONNECTION DIAGNOSTIC
 * Tests database connectivity using same configuration as RTH Tutorial SSR
 * Follows patterns from scripts/check-rth-database.mjs and scripts/test-db-from-app.cjs
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load RTH environment
const rthEnvPath = resolve(__dirname, '../../apps/realtutorialhub-web/.env.local');
dotenv.config({ path: rthEnvPath });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in RTH environment');
  process.exit(1);
}

console.log('\n🔬 PHASE 11.19A — DATABASE CONNECTION DIAGNOSTIC');
console.log('════════════════════════════════════════════════════════\n');

// Mask sensitive info
const maskedUrl = DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//USER:****@');
console.log(`Database: ${maskedUrl.split('/').pop()?.split('?')[0] || 'unknown'}`);
console.log(`Pooler: ${DATABASE_URL.includes('pooler') ? 'YES' : 'NO'}`);
console.log(`SSL: ${DATABASE_URL.includes('sslmode=require') ? 'REQUIRED' : 'optional'}\n`);

// Test counters
const results = {
  connectivity: { pass: 0, fail: 0 },
  domainsQuery: { pass: 0, fail: 0 },
  repeated: { pass: 0, fail: 0 }
};

// Test 1: Basic Connectivity
async function testConnectivity() {
  console.log('═══ TEST 1: Basic Connectivity ═══');
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  
  try {
    const start = Date.now();
    const client = await pool.connect();
    const duration = Date.now() - start;
    
    console.log(`✅ Connection established (${duration}ms)`);
    
    const result = await client.query('SELECT 1 as test, current_database(), version()');
    console.log(`✅ SELECT 1 query successful`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Version: ${result.rows[0].version.substring(0, 60)}...`);
    
    client.release();
    await pool.end();
    console.log('✅ Connection closed cleanly\n');
    
    results.connectivity.pass++;
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    console.error(`   Code: ${error.code || 'none'}`);
    console.error(`   Name: ${error.name || 'Error'}\n`);
    
    try { await pool.end(); } catch {}
    results.connectivity.fail++;
    return false;
  }
}

// Test 2: Domains Query (exact query failing in SSR)
async function testDomainsQuery() {
  console.log('═══ TEST 2: Domains Query (SSR Failure Point) ═══');
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connection established');
    
    // Exact query from tutorialSidebarDelivery.ts:184
    const query = `
      SELECT "id", "name", "description", "category", "status", 
             "order", "created_at", "updated_at", "deleted_at"
      FROM "domains"
      WHERE "domains"."deleted_at" IS NULL
    `;
    
    const start = Date.now();
    const result = await client.query(query);
    const duration = Date.now() - start;
    
    console.log(`✅ Domains query successful (${duration}ms)`);
    console.log(`   Domains found: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log(`   Sample: ${result.rows[0].name} (${result.rows[0].category || 'no category'})`);
    }
    
    client.release();
    await pool.end();
    console.log('✅ Connection closed cleanly\n');
    
    results.domainsQuery.pass++;
    return true;
  } catch (error) {
    console.error(`❌ Query failed: ${error.message}`);
    console.error(`   Code: ${error.code || 'none'}`);
    console.error(`   Detail: ${error.detail || 'none'}\n`);
    
    try { await pool.end(); } catch {}
    results.domainsQuery.fail++;
    return false;
  }
}

// Test 3: Repeated Connectivity (connection pool stress test)
async function testRepeatedConnectivity(iterations = 10) {
  console.log(`═══ TEST 3: Repeated Connectivity (${iterations} iterations) ═══`);
  
  for (let i = 1; i <= iterations; i++) {
    const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
    
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      
      process.stdout.write(`✅ ${i} `);
      results.repeated.pass++;
    } catch (error) {
      process.stdout.write(`❌ ${i} `);
      results.repeated.fail++;
      try { await pool.end(); } catch {}
    }
    
    // Small delay between iterations
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n');
  return results.repeated.fail === 0;
}

// Test 4: Connection Pool Test (reuse single pool)
async function testConnectionPool(queries = 5) {
  console.log(`═══ TEST 4: Connection Pool Reuse (${queries} queries) ═══`);
  const pool = new Pool({ connectionString: DATABASE_URL, max: 2 });
  
  let successes = 0;
  let failures = 0;
  
  try {
    for (let i = 1; i <= queries; i++) {
      try {
        const result = await pool.query('SELECT $1 as query_num', [i]);
        console.log(`✅ Query ${i}: ${result.rows[0].query_num}`);
        successes++;
      } catch (error) {
        console.error(`❌ Query ${i} failed: ${error.message}`);
        failures++;
      }
    }
    
    console.log(`\n✅ Pool test complete: ${successes}/${queries} successful\n`);
    await pool.end();
    return failures === 0;
  } catch (error) {
    console.error(`❌ Pool test failed: ${error.message}\n`);
    try { await pool.end(); } catch {}
    return false;
  }
}

// Run all tests
async function runDiagnostic() {
  try {
    await testConnectivity();
    await testDomainsQuery();
    await testRepeatedConnectivity(10);
    await testConnectionPool(5);
    
    // Summary
    console.log('════════════════════════════════════════════════════════');
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log(`TEST 1 - Basic Connectivity:`);
    console.log(`  Pass: ${results.connectivity.pass}, Fail: ${results.connectivity.fail}`);
    
    console.log(`\nTEST 2 - Domains Query (SSR failure point):`);
    console.log(`  Pass: ${results.domainsQuery.pass}, Fail: ${results.domainsQuery.fail}`);
    
    console.log(`\nTEST 3 - Repeated Connectivity:`);
    console.log(`  Pass: ${results.repeated.pass}, Fail: ${results.repeated.fail}`);
    
    const totalTests = results.connectivity.pass + results.connectivity.fail +
                       results.domainsQuery.pass + results.domainsQuery.fail +
                       results.repeated.pass + results.repeated.fail;
    const totalPass = results.connectivity.pass + results.domainsQuery.pass + results.repeated.pass;
    
    console.log(`\n${'═'.repeat(56)}`);
    console.log(`OVERALL: ${totalPass}/${totalTests} tests passed`);
    
    if (totalPass === totalTests) {
      console.log('\n✅ DATABASE CONNECTION: HEALTHY');
      console.log('\nConclusion: Database is reachable and queries execute successfully.');
      console.log('The HTTP 500 in Tutorial SSR is likely caused by:');
      console.log('  - Connection pool exhaustion during concurrent SSR');
      console.log('  - Next.js HMR creating multiple DB clients');
      console.log('  - Long-running query timeout during first compilation');
      console.log('  - Application-level connection management issue\n');
    } else {
      console.log('\n❌ DATABASE CONNECTION: ISSUES DETECTED');
      console.log('\nInvestigate:');
      console.log('  - Network connectivity to Neon');
      console.log('  - Database pooler configuration');
      console.log('  - SSL certificate issues');
      console.log('  - Connection timeout settings\n');
    }
    
    process.exit(totalPass === totalTests ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

runDiagnostic();
