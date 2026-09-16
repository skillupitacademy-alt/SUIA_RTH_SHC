/**
 * Diagnostic Script: Tutorial DB Connection and resolveSubtopicId
 * 
 * PURPOSE:
 * Diagnose why Tutorial Composer API times out at resolveSubtopicId
 * 
 * REPRODUCTION:
 * GET /api/tutorial-composer/sections?subtopicId=12efacf1-b5ad-4b43-9fe4-17ba1cf249e4&navigationNodeId=whatisjava&brandId=shared&limit=1
 * 
 * ERROR:
 * Query "TutorialSectionRepository.resolveSubtopicId" exceeded 15000ms timeout
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CRITICAL: Configure WebSocket before creating pool
neonConfig.webSocketConstructor = WebSocket;

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const EXTERNAL_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const NAVIGATION_NODE_ID = 'whatisjava';
const BRAND_ID = 'shared';

console.log('='.repeat(80));
console.log('DIAGNOSTIC: Tutorial DB Connection and resolveSubtopicId');
console.log('='.repeat(80));
console.log();

async function main() {
  // Step 1: Check environment variables
  console.log('[STEP 1] Check environment variables\n');
  
  const dbUrl = process.env.DATABASE_URL_TUTORIAL;
  const dbDirectUrl = process.env.DATABASE_DIRECT_URL_TUTORIAL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL_TUTORIAL not set');
    process.exit(1);
  }
  
  console.log(`✅ DATABASE_URL_TUTORIAL: ${dbUrl.substring(0, 30)}...`);
  
  if (dbDirectUrl) {
    console.log(`✅ DATABASE_DIRECT_URL_TUTORIAL: ${dbDirectUrl.substring(0, 30)}...`);
  } else {
    console.log('⚠️  DATABASE_DIRECT_URL_TUTORIAL not set (optional)');
  }
  console.log();
  
  // Step 2: Test basic connection
  console.log('[STEP 2] Test basic database connection\n');
  
  let pool;
  try {
    pool = new Pool({
      connectionString: dbUrl,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2_000,
    });
    
    const startTime = Date.now();
    const result = await pool.query('SELECT NOW() as current_time');
    const duration = Date.now() - startTime;
    
    console.log(`✅ Connection successful (${duration}ms)`);
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
  
  // Note: Pool stays open for remaining steps
  
  // Step 3: Check tutorial_subtopics table exists
  console.log('[STEP 3] Check tutorial_subtopics table\n');
  
  try {
    const startTime = Date.now();
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tutorial_subtopics
    `);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Table exists (${duration}ms)`);
    console.log(`   Total rows: ${result.rows[0].count}`);
    console.log();
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.error('   Table tutorial_subtopics does not exist!');
    }
    process.exit(1);
  }
  
  // Step 4: Test resolveSubtopicId query (EXACT REPLICA)
  console.log('[STEP 4] Test resolveSubtopicId query\n');
  console.log(`   External ID: ${EXTERNAL_SUBTOPIC_ID}`);
  console.log();
  
  try {
    const startTime = Date.now();
    const result = await pool.query(`
      SELECT id 
      FROM tutorial_subtopics 
      WHERE external_id = $1 
      LIMIT 1
    `, [EXTERNAL_SUBTOPIC_ID]);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Query executed (${duration}ms)`);
    
    if (result.rows.length === 0) {
      console.log('   ⚠️  No row found - subtopic not synced to tutorial DB');
      console.log('   This explains the issue: resolveSubtopicId returns null');
      console.log();
      
      // Check if it exists in main DB
      console.log('[STEP 4a] Check if subtopic exists in main database\n');
      
      // Note: This would require main DB connection
      console.log('   Skipping main DB check (requires DATABASE_URL)');
      console.log('   Run: pnpm diagnose:subtopic-sync for full check');
      console.log();
    } else {
      console.log(`   ✅ Found internal ID: ${result.rows[0].id}`);
      console.log();
    }
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
  
  // Step 5: Test query with timeout (simulate withTimeout wrapper)
  console.log('[STEP 5] Test query with 15s timeout (simulating production)\n');
  
  try {
    const TIMEOUT_MS = 15_000;
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Query exceeded ${TIMEOUT_MS}ms timeout`));
      }, TIMEOUT_MS);
    });
    
    const queryPromise = pool.query(`
      SELECT id 
      FROM tutorial_subtopics 
      WHERE external_id = $1 
      LIMIT 1
    `, [EXTERNAL_SUBTOPIC_ID]);
    
    const startTime = Date.now();
    const result = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    clearTimeout(timeoutId);
    
    console.log(`✅ Query completed before timeout (${duration}ms)`);
    console.log(`   Result count: ${result.rows.length}`);
    console.log();
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.error('❌ Query TIMED OUT after 15 seconds');
      console.error('   This is the production failure reproduced');
      console.error();
      console.error('   Possible causes:');
      console.error('   - Database connection pool exhausted');
      console.error('   - Database server overloaded');
      console.error('   - Network latency to Neon');
      console.error('   - Stale connection in pool');
      console.error('   - Lock contention');
      console.error();
    } else {
      console.error('❌ Query failed:', error.message);
    }
  }
  
  // Step 6: Check connection pool state
  console.log('[STEP 6] Connection pool diagnostics\n');
  
  console.log(`   Total connections: ${pool.totalCount}`);
  console.log(`   Idle connections: ${pool.idleCount}`);
  console.log(`   Waiting count: ${pool.waitingCount}`);
  console.log();
  
  if (pool.idleCount === 0 && pool.totalCount > 0) {
    console.log('   ⚠️  No idle connections - pool may be exhausted');
  }
  
  if (pool.waitingCount > 0) {
    console.log('   ⚠️  Queries waiting for connections');
  }
  
  // Step 7: Test rapid queries (stress test)
  console.log('[STEP 7] Stress test: 5 rapid queries\n');
  
  try {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        pool.query(`
          SELECT id 
          FROM tutorial_subtopics 
          WHERE external_id = $1 
          LIMIT 1
        `, [EXTERNAL_SUBTOPIC_ID])
      );
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ All 5 queries succeeded (${duration}ms total)`);
    console.log(`   Average: ${(duration / 5).toFixed(1)}ms per query`);
    console.log();
  } catch (error) {
    console.error('❌ Stress test failed:', error.message);
    console.log();
  }
  
  // Step 8: Recommendations
  console.log('[STEP 8] Diagnosis and recommendations\n');
  
  console.log('FINDINGS:');
  console.log('─'.repeat(80));
  console.log();
  
  // Check sync status
  const syncCheck = await pool.query(`
    SELECT id 
    FROM tutorial_subtopics 
    WHERE external_id = $1 
    LIMIT 1
  `, [EXTERNAL_SUBTOPIC_ID]);
  
  if (syncCheck.rows.length === 0) {
    console.log('ROOT CAUSE: Subtopic not synced to tutorial database');
    console.log();
    console.log('The subtopic UUID exists in the main database but has NOT been');
    console.log('synced to the tutorial database (tutorial_subtopics table).');
    console.log();
    console.log('This causes resolveSubtopicId() to search indefinitely for a');
    console.log('non-existent row, eventually timing out.');
    console.log();
    console.log('SOLUTION:');
    console.log('  1. Run: pnpm sync:java-subtopic');
    console.log('  2. Or: Manually sync the subtopic hierarchy');
    console.log();
    console.log('After syncing, the query should complete in <100ms.');
    console.log();
  } else {
    console.log('✅ Subtopic is synced correctly');
    console.log('✅ Query completes quickly');
    console.log();
    console.log('If production still times out, possible causes:');
    console.log('  - Connection pool exhaustion from concurrent requests');
    console.log('  - Stale connections in pool (restart server)');
    console.log('  - Network issues to Neon database');
    console.log('  - Multiple dev instances sharing the connection pool');
    console.log();
    console.log('NEXT STEPS:');
    console.log('  1. Restart the dev server: Ctrl+C then pnpm dev');
    console.log('  2. Clear the connection pool singleton');
    console.log('  3. Monitor connection pool metrics');
    console.log();
  }
  
  // Cleanup
  await pool.end();
  
  console.log('='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
}

main().catch((error) => {
  console.error('\n❌ Diagnostic script failed:', error);
  process.exit(1);
});
