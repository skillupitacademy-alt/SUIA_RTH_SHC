/**
 * A/B Test Script: Tutorial DB Connection Pool Behavior
 * 
 * Tests whether the global singleton pattern prevents pool accumulation
 * across Next.js Fast Refresh cycles.
 * 
 * Protocol:
 * 1. Start dev server
 * 2. Trigger 5 Fast Refresh cycles (touch a file)
 * 3. After each cycle, measure pool state
 * 4. Compare Test A (original) vs Test B (global singleton)
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFile, readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

neonConfig.webSocketConstructor = WebSocket;
config({ path: resolve(__dirname, '../.env.local') });

const TEST_VARIANT = process.env.TEST_VARIANT || 'A';
const NUM_CYCLES = 5;
const SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

console.log('='.repeat(80));
console.log(`A/B Test: Tutorial DB Pool Behavior - Test ${TEST_VARIANT}`);
console.log('='.repeat(80));
console.log();

async function measurePoolState() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
    max: 15, // Match production config
  });
  
  try {
    const startTime = Date.now();
    const result = await pool.query(`
      SELECT id FROM tutorial_subtopics WHERE external_id = $1 LIMIT 1
    `, [SUBTOPIC_ID]);
    
    const duration = Date.now() - startTime;
    
    return {
      duration,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      success: result.rows.length > 0,
    };
  } catch (error) {
    return {
      duration: -1,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      success: false,
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log(`Configuration:`);
  console.log(`  Test Variant: ${TEST_VARIANT}`);
  console.log(`  Refresh Cycles: ${NUM_CYCLES}`);
  console.log(`  Subtopic ID: ${SUBTOPIC_ID}`);
  console.log();
  
  const results = [];
  
  for (let cycle = 1; cycle <= NUM_CYCLES; cycle++) {
    console.log(`[Cycle ${cycle}/${NUM_CYCLES}] Measuring pool state...`);
    
    const state = await measurePoolState();
    results.push({ cycle, ...state });
    
    if (state.success) {
      console.log(`  ✅ Query succeeded in ${state.duration}ms`);
    } else {
      console.log(`  ❌ Query failed: ${state.error || 'unknown'}`);
    }
    
    console.log(`  Pool: ${state.totalCount} total, ${state.idleCount} idle, ${state.waitingCount} waiting`);
    console.log();
    
    if (cycle < NUM_CYCLES) {
      console.log(`  Waiting 3 seconds before next cycle...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  console.table(results);
  console.log();
  
  const successCount = results.filter(r => r.success).length;
  const avgDuration = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / successCount || 0;
  
  const maxTotalCount = Math.max(...results.map(r => r.totalCount));
  const minIdleCount = Math.min(...results.map(r => r.idleCount));
  
  console.log(`Success Rate: ${successCount}/${NUM_CYCLES}`);
  console.log(`Average Duration: ${avgDuration.toFixed(1)}ms`);
  console.log(`Max Pool Size: ${maxTotalCount} connections`);
  console.log(`Min Idle Count: ${minIdleCount} connections`);
  console.log();
  
  // Save results
  const outputPath = `.analysis/runtime-db-investigation/ab-test-${TEST_VARIANT}-results.json`;
  await writeFile(
    resolve(__dirname, '..', outputPath),
    JSON.stringify({ variant: TEST_VARIANT, results, summary: {
      successCount,
      avgDuration,
      maxTotalCount,
      minIdleCount,
    }}, null, 2)
  );
  
  console.log(`Results saved to: ${outputPath}`);
  console.log();
  
  if (maxTotalCount > 15) {
    console.log('⚠️  WARNING: Pool size exceeded configured maximum (15)');
    console.log('   This indicates pool accumulation across multiple instances');
    console.log();
  }
  
  if (successCount < NUM_CYCLES) {
    console.log('⚠️  WARNING: Some queries failed');
    console.log('   This may indicate connection pool exhaustion or timeout');
    console.log();
  }
}

main().catch((error) => {
  console.error('\n❌ A/B test failed:', error);
  process.exit(1);
});
