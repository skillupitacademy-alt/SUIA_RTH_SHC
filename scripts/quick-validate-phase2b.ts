/**
 * Quick Phase 2B Validation
 * ==========================
 * Runs infrastructure and basic API tests without requiring authentication
 */

// Suppress SSL warnings from pg library
process.env.NODE_NO_WARNINGS = '1';

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { validateInfrastructure } from './validate-phase2b/validate-infrastructure';

interface ValidationResult {
  passed: boolean;
  score: number;
  tests: number;
  failures: number;
  warnings?: string[];
  errors?: string[];
  duration: number;
}

interface ValidationResults {
  [key: string]: ValidationResult;
}

async function main() {
  console.log('================================================================');
  console.log('                                                                ');
  console.log('     PHASE 2B QUICK VALIDATION                                 ');
  console.log('                                                                ');
  console.log('     Infrastructure & Database Validation                      ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('');

  const results: ValidationResults = {};

  // Layer 1: Infrastructure
  console.log('Layer 1: Infrastructure Validation');
  console.log('----------------------------------------------------------------');
  results.infrastructure = await validateInfrastructure();
  console.log('');

  // Summary
  console.log('================================================================');
  console.log('                                                                ');
  console.log('     VALIDATION SUMMARY                                         ');
  console.log('                                                                ');
  console.log('================================================================');
  console.log('');

  const failures: string[] = [];

  for (const [layer, result] of Object.entries(results)) {
    const icon = result.passed ? '[PASS]' : '[FAIL]';
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${icon} ${status} ${layer}: ${result.score}/100`);
    console.log(`   Tests: ${result.tests}, Failures: ${result.failures}, Duration: ${result.duration}ms`);
    
    if (!result.passed) {
      failures.push(layer);
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log(`   [WARNING] Warnings: ${result.warnings.length}`);
      result.warnings.forEach((w: string) => console.log(`      - ${w}`));
    }

    if (result.errors && result.errors.length > 0) {
      console.log(`   [ERROR] Errors: ${result.errors.length}`);
      result.errors.forEach((e: string) => console.log(`      - ${e}`));
    }
  }

  console.log('');
  console.log('----------------------------------------------------------------');

  if (failures.length > 0) {
    console.log(`[FAIL] VALIDATION FAILED: ${failures.length} layer(s) failed`);
    console.log(`   Failed layers: ${failures.join(', ')}`);
    console.log('');
    console.log('Next Steps:');
    console.log('   1. Review error messages above');
    console.log('   2. Fix infrastructure issues');
    console.log('   3. Re-run validation');
    process.exit(1);
  }

  console.log('[PASS] INFRASTRUCTURE VALIDATION PASSED');
  console.log('');
  console.log('Note: Full API, Security, and Performance validation requires');
  console.log('   TEST_ADMIN_TOKEN environment variable. Run:');
  console.log('   export TEST_ADMIN_TOKEN="your-token-here"');
  console.log('   npm run validate:phase2b');
  console.log('');
  process.exit(0);
}

main().catch((error) => {
  console.error('');
  console.error('================================================================');
  console.error('                                                                ');
  console.error('     VALIDATION SUITE CRASHED                                  ');
  console.error('                                                                ');
  console.error('================================================================');
  console.error('');
  console.error('Error:', error);
  console.error('');
  process.exit(1);
});
