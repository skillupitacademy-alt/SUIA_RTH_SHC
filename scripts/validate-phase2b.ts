#!/usr/bin/env tsx
/**
 * 🚀 PHASE 2B PRE-DEPLOYMENT VALIDATION SUITE
 * ============================================
 * 
 * Comprehensive enterprise validation for Layman Section
 * Human-in-the-Loop AI Governance System
 * 
 * Validates:
 * - Layer 1: Infrastructure (DB, Redis, Routes, Schema)
 * - Layer 2: API Functional (16 endpoints, auth, validation)
 * - Layer 3: Governance (lifecycle, revisions, rollback)
 * - Layer 4: Security (RBAC, tamper detection, sanitization)
 * - Layer 5: Performance (latency, concurrency, throughput)
 * 
 * Exit Codes:
 * - 0: All validations passed - DEPLOYMENT APPROVED
 * - 1: Critical validation failed - DEPLOYMENT BLOCKED
 */

// Suppress SSL warnings from pg library
process.env.NODE_NO_WARNINGS = '1';

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded environment from .env.local\n');
}

import { validateInfrastructure } from './validate-phase2b/validate-infrastructure';
import { validateAPI } from './validate-phase2b/validate-api';
import { validateGovernance } from './validate-phase2b/validate-governance';
import { validateSecurity } from './validate-phase2b/validate-security';
import { validatePerformance } from './validate-phase2b/validate-performance';
import { generateFinalReport } from './validate-phase2b/generate-final-report';

interface ValidationResult {
  passed: boolean;
  score: number;
  tests: number;
  failures: number;
  warnings: string[];
  errors: string[];
  duration: number;
}

interface ValidationResults {
  infrastructure: ValidationResult;
  api: ValidationResult;
  governance: ValidationResult;
  security: ValidationResult;
  performance: ValidationResult;
}

async function main() {
  const startTime = Date.now();
  
  console.log('\n');
  console.log('================================================================');
  console.log('                                                                ');
  console.log('     PHASE 2B PRE-DEPLOYMENT VALIDATION SUITE                  ');
  console.log('                                                                ');
  console.log('     Layman Section Human-in-Loop AI Governance System         ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('\n');

  const results: Partial<ValidationResults> = {};
  let criticalFailure = false;

  // Layer 1: Infrastructure Validation
  console.log('[Layer] Layer 1: Infrastructure Validation');
  console.log('-'.repeat(64));
  try {
    results.infrastructure = await validateInfrastructure();
    if (results.infrastructure) {
      printLayerResult('Infrastructure', results.infrastructure);
      
      if (!results.infrastructure.passed) {
        console.error('[FAIL] CRITICAL: Infrastructure validation failed');
        console.error('   Cannot proceed without valid infrastructure');
        criticalFailure = true;
      }
    }
  } catch (error) {
    console.error('[FAIL] CRITICAL: Infrastructure validation crashed:', error);
    criticalFailure = true;
  }

  if (criticalFailure) {
    console.log('\n[BLOCKED] DEPLOYMENT BLOCKED: Infrastructure validation failed\n');
    process.exit(1);
  }

  // Layer 2: API Functional Validation
  console.log('\n[Layer] Layer 2: API Functional Validation');
  console.log('-'.repeat(64));
  try {
    results.api = await validateAPI();
    if (results.api) {
      printLayerResult('API', results.api);
    }
  } catch (error) {
    console.error('[FAIL] API validation crashed:', error);
    results.api = createFailedResult('API validation crashed');
  }

  // Layer 3: Governance Validation
  console.log('\n[Layer] Layer 3: Governance Validation');
  console.log('-'.repeat(64));
  try {
    results.governance = await validateGovernance();
    if (results.governance) {
      printLayerResult('Governance', results.governance);
    }
  } catch (error) {
    console.error('[FAIL] Governance validation crashed:', error);
    results.governance = createFailedResult('Governance validation crashed');
  }

  // Layer 4: Security Validation
  console.log('\n[Layer] Layer 4: Security Validation');
  console.log('-'.repeat(64));
  try {
    results.security = await validateSecurity();
    if (results.security) {
      printLayerResult('Security', results.security);
    }
  } catch (error) {
    console.error('[FAIL] Security validation crashed:', error);
    results.security = createFailedResult('Security validation crashed');
  }

  // Layer 5: Performance Validation
  console.log('\n[Layer] Layer 5: Performance Validation');
  console.log('-'.repeat(64));
  try {
    results.performance = await validatePerformance();
    if (results.performance) {
      printLayerResult('Performance', results.performance);
    }
  } catch (error) {
    console.error('[FAIL] Performance validation crashed:', error);
    results.performance = createFailedResult('Performance validation crashed');
  }

  // Generate Final Report
  const totalDuration = Date.now() - startTime;
  const finalReport = generateFinalReport(results as ValidationResults, totalDuration);

  console.log('\n');
  console.log('================================================================');
  console.log('                                                                ');
  console.log('              [REPORT] FINAL VALIDATION SUMMARY                ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('\n');

  console.log(finalReport.summary);

  // Determine deployment status
  const failures = Object.entries(results).filter(
    ([_, result]) => result && !result.passed
  );

  const criticalFailures = failures.filter(([key]) => 
    ['infrastructure', 'api', 'security'].includes(key)
  );

  if (criticalFailures.length > 0) {
    console.log('\n');
    console.log('[BLOCKED] DEPLOYMENT BLOCKED');
    console.log('='.repeat(64));
    console.log(`   ${criticalFailures.length} critical validation layer(s) failed:`);
    criticalFailures.forEach(([key, result]) => {
      console.log(`   [FAIL] ${key.toUpperCase()}: Score ${result?.score}/100`);
      if (result?.errors && result.errors.length > 0) {
        result.errors.forEach(error => console.log(`      - ${error}`));
      }
    });
    console.log('\n');
    process.exit(1);
  }

  if (failures.length > 0) {
    console.log('\n');
    console.log('[WARNING] DEPLOYMENT WARNING');
    console.log('='.repeat(64));
    console.log(`   ${failures.length} non-critical validation layer(s) failed:`);
    failures.forEach(([key, result]) => {
      console.log(`   [WARNING] ${key.toUpperCase()}: Score ${result?.score}/100`);
    });
    console.log('   Review warnings before deploying');
    console.log('\n');
  }

  if (finalReport.overallScore >= 95) {
    console.log('\n');
    console.log('================================================================');
    console.log('                                                                ');
    console.log('        [SUCCESS] ALL SYSTEMS VALIDATED - DEPLOYMENT APPROVED  ');
    console.log('                                                                ');
    console.log(`              Overall Score: ${finalReport.overallScore}/100                        `);
    console.log(`              Production Status: ${finalReport.productionReady ? 'APPROVED [PASS]' : 'REVIEW [WARNING]'}              `);
    console.log('                                                                ');
    console.log('================================================================');
    console.log('\n');
    process.exit(0);
  } else {
    console.log('\n');
    console.log('[WARNING] DEPLOYMENT REQUIRES REVIEW');
    console.log(`   Overall Score: ${finalReport.overallScore}/100 (minimum 95 required)`);
    console.log('   Address issues before production deployment');
    console.log('\n');
    process.exit(1);
  }
}

function printLayerResult(layerName: string, result: ValidationResult) {
  const status = result.passed ? '[PASS]' : '[FAIL]';
  const scoreIndicator = result.score >= 90 ? '[GOOD]' : result.score >= 70 ? '[OK]' : '[BAD]';
  
  console.log(`${status} ${layerName}: ${scoreIndicator} ${result.score}/100`);
  console.log(`   Tests: ${result.tests}, Failures: ${result.failures}, Duration: ${result.duration}ms`);
  
  if (result.warnings.length > 0) {
    console.log(`   Warnings: ${result.warnings.length}`);
    result.warnings.slice(0, 3).forEach(w => console.log(`   [WARNING] ${w}`));
  }
  
  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.length}`);
    result.errors.slice(0, 3).forEach(e => console.log(`   [FAIL] ${e}`));
  }
}

function createFailedResult(error: string): ValidationResult {
  return {
    passed: false,
    score: 0,
    tests: 0,
    failures: 1,
    warnings: [],
    errors: [error],
    duration: 0,
  };
}

// Run validation
const startTime = Date.now();
main().catch((error) => {
  console.error('\n[BLOCKED] FATAL ERROR: Validation suite crashed\n', error);
  process.exit(1);
});
