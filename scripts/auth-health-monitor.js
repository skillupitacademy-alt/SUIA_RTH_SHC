#!/usr/bin/env node

/**
 * 🚨 AUTH HEALTH MONITOR
 * 
 * Monitors authentication system health in Phase 5 (SAFE MODE)
 * Detects gateway failures, fallback usage, and auth degradation
 */

const { execSync } = require('child_process');

function checkLogs(query, label, alertThreshold = 1) {
  try {
    const output = execSync(query, { encoding: 'utf-8', timeout: 10000 });
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    if (lines.length >= alertThreshold) {
      console.log(`🚨 ALERT: ${label} (${lines.length} occurrences)`);
      if (lines.length <= 3) {
        lines.forEach(line => console.log(`  ${line}`));
      } else {
        console.log(`  (showing first 3 of ${lines.length})`);
        lines.slice(0, 3).forEach(line => console.log(`  ${line}`));
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`⚠️  Failed to check ${label}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 AUTH HEALTH MONITOR - Phase 5 SAFE MODE');
  console.log('═══════════════════════════════════════════');
  
  const timeWindow = '5m'; // Check last 5 minutes
  let alertCount = 0;

  // 1️⃣ CRITICAL: Fallback usage (should NEVER happen in normal operation)
  console.log('\n🔴 CRITICAL CHECKS:');
  if (checkLogs(
    `gcloud logging read 'textPayload:"AUTH_FALLBACK_TRIGGERED"' --freshness=${timeWindow} --limit=10`,
    'Fallback triggered (CRITICAL - should not happen)',
    1
  )) {
    alertCount++;
  }

  // 2️⃣ Gateway failures (monitor for patterns)
  console.log('\n🟡 WARNING CHECKS:');
  if (checkLogs(
    `gcloud logging read 'textPayload:"AUTH_GATEWAY_FAIL"' --freshness=${timeWindow} --limit=10`,
    'Gateway failures detected',
    5 // Alert if 5+ failures in 5 minutes
  )) {
    alertCount++;
  }

  // 3️⃣ Auth errors (general health)
  if (checkLogs(
    `gcloud logging read 'severity>=ERROR AND textPayload:"auth"' --freshness=${timeWindow} --limit=10`,
    'Authentication errors',
    3 // Alert if 3+ auth errors in 5 minutes
  )) {
    alertCount++;
  }

  // 4️⃣ 503 responses (service unavailable)
  if (checkLogs(
    `gcloud logging read 'textPayload:"Authentication service temporarily unavailable"' --freshness=${timeWindow} --limit=10`,
    'Auth service unavailable (503 responses)',
    2 // Alert if 2+ 503s in 5 minutes
  )) {
    alertCount++;
  }

  console.log('\n📊 HEALTH METRICS:');
  
  // Success rate check
  try {
    const successLogs = execSync(
      `gcloud logging read 'textPayload:"gateway_success"' --freshness=${timeWindow} --limit=100`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    const failureLogs = execSync(
      `gcloud logging read 'textPayload:"gateway_failure"' --freshness=${timeWindow} --limit=100`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    
    const successCount = successLogs.trim().split('\n').filter(line => line.trim()).length;
    const failureCount = failureLogs.trim().split('\n').filter(line => line.trim()).length;
    const totalCount = successCount + failureCount;
    
    if (totalCount > 0) {
      const successRate = ((successCount / totalCount) * 100).toFixed(1);
      console.log(`  Gateway success rate: ${successRate}% (${successCount}/${totalCount})`);
      
      if (parseFloat(successRate) < 95.0 && totalCount >= 10) {
        console.log(`🚨 ALERT: Low gateway success rate (${successRate}%)`);
        alertCount++;
      }
    } else {
      console.log('  No auth traffic detected in monitoring window');
    }
  } catch (error) {
    console.log(`  ⚠️  Could not calculate success rate: ${error.message}`);
  }

  console.log('\n🏁 MONITOR SUMMARY:');
  console.log('═══════════════════════════════════════════');
  
  if (alertCount === 0) {
    console.log('✅ ALL CLEAR - Auth system healthy');
    process.exit(0);
  } else {
    console.log(`❌ ${alertCount} ALERT(S) DETECTED - Review required`);
    console.log('\n🔧 EMERGENCY RECOVERY:');
    console.log('  If gateway is failing consistently:');
    console.log('  1. Set AUTH_CONFIG.ENABLE_FALLBACK = true');
    console.log('  2. Deploy immediately');
    console.log('  3. Investigate gateway issues');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkLogs };