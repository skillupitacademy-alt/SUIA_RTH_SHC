/**
 * Monitor Tutorial Composer API Response Times
 * 
 * Polls the API endpoint repeatedly and logs response times.
 * Run this while triggering Hot Module Reload to observe degradation.
 * 
 * Usage:
 *   node scripts/monitor-tutorial-api.mjs
 * 
 * Then in another terminal, trigger HMR by editing files.
 */

import { setTimeout as sleep } from 'timers/promises';

const API_URL = 'http://localhost:3007/api/tutorial-composer/sections?subtopicId=12efacf1-b5ad-4b43-9fe4-17ba1cf249e4&navigationNodeId=whatisjava&brandId=shared&limit=1';
const POLL_INTERVAL_MS = 5000; // 5 seconds
const TIMEOUT_MS = 20000; // 20 seconds

let attemptNumber = 0;
const results = [];

console.log('='.repeat(80));
console.log('Tutorial Composer API Monitor');
console.log('='.repeat(80));
console.log();
console.log(`Target: ${API_URL}`);
console.log(`Poll Interval: ${POLL_INTERVAL_MS}ms`);
console.log(`Timeout: ${TIMEOUT_MS}ms`);
console.log();
console.log('Press Ctrl+C to stop monitoring');
console.log();
console.log('Time       | Attempt | Status | Duration | Notes');
console.log('-'.repeat(80));

async function pollApi() {
  attemptNumber++;
  const timestamp = new Date().toISOString().substr(11, 8);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    const status = response.status;
    const statusText = response.ok ? '✅ OK' : response.status === 401 ? '🔒 AUTH' : '❌ ERR';
    
    let note = '';
    if (duration > 10000) {
      note = '⚠️  SLOW';
    } else if (duration > 5000) {
      note = '⚠️  slow';
    }
    
    console.log(`${timestamp} | ${attemptNumber.toString().padStart(7)} | ${statusText.padEnd(6)} | ${duration.toString().padStart(8)}ms | ${note}`);
    
    results.push({
      attempt: attemptNumber,
      timestamp: new Date().toISOString(),
      status,
      duration,
      success: response.ok || status === 401,
    });
    
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    let statusText = '❌ FAIL';
    let note = error.message;
    
    if (error.name === 'AbortError') {
      statusText = '⏱️  TIMEOUT';
      note = `Exceeded ${TIMEOUT_MS}ms`;
    }
    
    console.log(`${timestamp} | ${attemptNumber.toString().padStart(7)} | ${statusText.padEnd(6)} | ${duration.toString().padStart(8)}ms | ${note}`);
    
    results.push({
      attempt: attemptNumber,
      timestamp: new Date().toISOString(),
      status: 0,
      duration,
      success: false,
      error: error.message,
    });
  }
}

async function main() {
  // Initial poll
  await pollApi();
  
  // Continuous polling
  while (true) {
    await sleep(POLL_INTERVAL_MS);
    await pollApi();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log();
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Total Attempts: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log();
  
  if (successful.length > 0) {
    const durations = successful.map(r => r.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    console.log(`Response Times (successful):`);
    console.log(`  Min: ${min}ms`);
    console.log(`  Avg: ${avg.toFixed(1)}ms`);
    console.log(`  Max: ${max}ms`);
    console.log();
  }
  
  if (failed.length > 0) {
    console.log(`Failed attempts:`);
    failed.forEach(r => {
      console.log(`  #${r.attempt} at ${r.timestamp}: ${r.error || 'Unknown error'}`);
    });
    console.log();
  }
  
  process.exit(0);
});

main().catch((error) => {
  console.error('\n❌ Monitor failed:', error);
  process.exit(1);
});
