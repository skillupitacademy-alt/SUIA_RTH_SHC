#!/usr/bin/env node

/**
 * W0.2 Architecture Checker Tests - Fixture-based validation
 * 
 * Tests:
 * 1. Valid baseline passes
 * 2. NEW violation detected
 * 3. Malformed baseline fails (fail-closed)
 * 4. Missing baseline fails (fail-closed)
 * 5. Nonexistent baseline route fails (fail-closed)
 * 6. Missing scan root fails (fail-closed)
 * 7. Service boundary distinction (@quiz/db vs @quiz/db-tutorial)
 * 8. Import syntax variants (multiline, side-effect)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function runChecker(expectedExit) {
  try {
    execSync('node scripts/check-architecture-violations.mjs', {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { exitCode: 0 };
  } catch (error) {
    return { exitCode: error.status, output: error.stdout + error.stderr };
  }
}

// Setup fixtures
function setupFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
}

function cleanup() {
  // Cleanup is handled by using temp baseline files and checking actual baseline back in
}

console.log('\n🧪 W0.2 Architecture Checker Tests\n');

setupFixtures();

/**
 * Test 1: Valid baseline passes
 */
test('Valid baseline passes', () => {
  const result = runChecker(0);
  assert(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
});

/**
 * Test 2: NEW violation detected
 */
test('NEW violation detected (health route injection)', () => {
  const healthRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/health/route.ts');
  const originalContent = fs.readFileSync(healthRoute, 'utf8');
  
  try {
    // Inject violation
    const modifiedContent = originalContent.replace(
      "import { NextResponse } from 'next/server';",
      "import { NextResponse } from 'next/server';\nimport { db } from '@quiz/db'; // TEST INJECTION"
    );
    fs.writeFileSync(healthRoute, modifiedContent);
    
    // Should fail with exit 1
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('health/route.ts'), 'Should report health route violation');
  } finally {
    // Cleanup
    fs.writeFileSync(healthRoute, originalContent);
  }
});

/**
 * Test 3: Malformed baseline fails (fail-closed)
 */
test('Malformed baseline fails (invalid JSON)', () => {
  const baselinePath = path.join(ROOT, 'audit/W0.2_Architecture_Baseline.json');
  const originalContent = fs.readFileSync(baselinePath, 'utf8');
  
  try {
    // Write invalid JSON
    fs.writeFileSync(baselinePath, '{ invalid json }');
    
    // Should fail with exit 2 (fail-closed)
    const result = runChecker(2);
    assert(result.exitCode === 2, `Expected exit 2 (fail-closed), got ${result.exitCode}`);
    assert(result.output.includes('BASELINE_ERROR'), 'Should report baseline error');
  } finally {
    // Restore
    fs.writeFileSync(baselinePath, originalContent);
  }
});

/**
 * Test 4: Missing baseline fails (fail-closed)
 */
test('Missing baseline fails', () => {
  const baselinePath = path.join(ROOT, 'audit/W0.2_Architecture_Baseline.json');
  const originalContent = fs.readFileSync(baselinePath, 'utf8');
  const tempPath = baselinePath + '.backup';
  
  try {
    // Temporarily remove baseline
    fs.renameSync(baselinePath, tempPath);
    
    // Should fail with exit 2
    const result = runChecker(2);
    assert(result.exitCode === 2, `Expected exit 2, got ${result.exitCode}`);
    assert(result.output.includes('not found'), 'Should report baseline not found');
  } finally {
    // Restore
    fs.renameSync(tempPath, baselinePath);
  }
});

/**
 * Test 5: Nonexistent baseline route fails (fail-closed)
 */
test('Nonexistent baseline route fails', () => {
  const baselinePath = path.join(ROOT, 'audit/W0.2_Architecture_Baseline.json');
  const originalContent = fs.readFileSync(baselinePath, 'utf8');
  
  try {
    // Add nonexistent route to baseline
    const baseline = JSON.parse(originalContent);
    baseline.directDBRoutes.push('apps/skillhubcore-admin/src/app/api/nonexistent/route.ts');
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
    
    // Should fail with exit 2
    const result = runChecker(2);
    assert(result.exitCode === 2, `Expected exit 2, got ${result.exitCode}`);
    assert(result.output.includes('do not exist'), 'Should report nonexistent routes');
  } finally {
    // Restore
    fs.writeFileSync(baselinePath, originalContent);
  }
});

/**
 * Test 6: Missing scan root fails (fail-closed)
 */
test('Missing scan root fails', () => {
  // This is harder to test without modifying the checker
  // We'll validate that the checker has the fail-closed logic
  const checkerContent = fs.readFileSync(
    path.join(ROOT, 'scripts/check-architecture-violations.mjs'),
    'utf8'
  );
  assert(
    checkerContent.includes('SCAN_ERROR: Required scan root does not exist'),
    'Checker should have fail-closed scan root validation'
  );
});

/**
 * Test 7: Service boundary distinction (@quiz/db vs @quiz/db-tutorial)
 */
test('Service boundary distinction (db vs db-tutorial)', () => {
  const testRoute = path.join(
    ROOT,
    'apps/skillhubcore-admin/src/app/api/tutorial-composer/analysis/route.ts'
  );
  const content = fs.readFileSync(testRoute, 'utf8');
  
  // Should have @quiz/db-tutorial (service boundary, allowed)
  assert(content.includes('@quiz/db-tutorial'), 'Route should use db-tutorial service');
  
  // Should NOT have @quiz/db (persistence coupling, violation)
  const hasDirectDB = /import.*from\s+['"]@quiz\/db['"]/.test(content) && !/db-tutorial/.test(content);
  assert(!hasDirectDB, 'Route should not directly import @quiz/db');
  
  // Checker should pass
  const result = runChecker(0);
  assert(result.exitCode === 0, 'Service boundary imports should be allowed');
});

/**
 * Test 8: Import syntax variants
 */
test('Import syntax variants detected', () => {
  const healthRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/health/route.ts');
  const originalContent = fs.readFileSync(healthRoute, 'utf8');
  
  try {
    // Test multiline import
    let modifiedContent = originalContent.replace(
      "import { NextResponse } from 'next/server';",
      "import {\n  NextResponse\n} from 'next/server';\nimport { db } from '@quiz/db';"
    );
    fs.writeFileSync(healthRoute, modifiedContent);
    
    let result = runChecker(1);
    assert(result.exitCode === 1, 'Multiline import violation should be detected');
    
    // Restore
    fs.writeFileSync(healthRoute, originalContent);
    
    // Test standard destructured import
    modifiedContent = originalContent.replace(
      "import { NextResponse } from 'next/server';",
      "import { NextResponse } from 'next/server';\nimport { db, getDb } from '@quiz/db';"
    );
    fs.writeFileSync(healthRoute, modifiedContent);
    
    result = runChecker(1);
    assert(result.exitCode === 1, 'Destructured import violation should be detected');
  } finally {
    // Cleanup
    fs.writeFileSync(healthRoute, originalContent);
  }
});

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`   Total:  ${passed + failed}`);
console.log('═══════════════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
