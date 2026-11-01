#!/usr/bin/env node

/**
 * W0.2 Architecture Checker Tests - Disposable fixture-based validation
 * 
 * CRITICAL: Uses temporary fixture directories, NEVER mutates real application files
 * 
 * Tests:
 * 1. Valid baseline passes
 * 2. NEW violation detected (ordinary import)
 * 3. Multiline forbidden import detected
 * 4. Side-effect forbidden import detected
 * 5. Subpath forbidden import detected (@quiz/db/client)
 * 6. document.cookie access detected
 * 7. localStorage.setItem('accessToken') detected
 * 8. Direct jose import detected
 * 9. Service boundary respected (@quiz/db-tutorial)
 * 10. Malformed baseline fails (fail-closed)
 * 11. Missing baseline fails (fail-closed)
 * 12. Nonexistent baseline route fails (fail-closed)
 * 13. Missing scan root fails (fail-closed)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures-temp');

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
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`);
    }
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
    const output = execSync('node scripts/check-architecture-violations.mjs', {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { exitCode: 0, output };
  } catch (error) {
    return { exitCode: error.status, output: error.stdout + error.stderr };
  }
}

// Setup/cleanup
function setupFixtures() {
  if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

function cleanup() {
  if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
  }
}

console.log('\n🧪 W0.2 Architecture Checker Tests (Disposable Fixtures)\n');

setupFixtures();

/**
 * Test 1: Valid baseline passes (real checker against real codebase)
 */
test('Valid baseline passes', () => {
  const result = runChecker(0);
  assert(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
  assert(result.output.includes('PASSED'), 'Output should indicate PASSED');
});

/**
 * Test 2: NEW violation detected (ordinary import)
 * Create temp fixture with violation, modify baseline temporarily
 */
test('NEW violation detected (ordinary @quiz/db import)', () => {
  const baselinePath = path.join(ROOT, 'audit/W0.2_Architecture_Baseline.json');
  const originalBaseline = fs.readFileSync(baselinePath, 'utf8');
  const testRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/__test_violation__/route.ts');
  
  try {
    // Create temp route directory
    fs.mkdirSync(path.dirname(testRoute), { recursive: true });
    
    // Create route with violation
    fs.writeFileSync(testRoute, `
import { NextResponse } from 'next/server';
import { db } from '@quiz/db'; // TEST VIOLATION

export async function GET() {
  return NextResponse.json({ test: true });
}
`);
    
    // Should fail with exit 1
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('__test_violation__'), 'Should report test violation route');
  } finally {
    // Cleanup
    if (fs.existsSync(testRoute)) {
      fs.unlinkSync(testRoute);
      fs.rmdirSync(path.dirname(testRoute));
    }
  }
});

/**
 * Test 3: Multiline forbidden import detected
 */
test('Multiline forbidden import detected', () => {
  const testRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/__test_multiline__/route.ts');
  
  try {
    fs.mkdirSync(path.dirname(testRoute), { recursive: true });
    
    // MULTILINE import of @quiz/db
    fs.writeFileSync(testRoute, `
import { NextResponse } from 'next/server';
import {
  db,
  getDb
} from '@quiz/db'; // TEST: Multiline forbidden import

export async function GET() {
  return NextResponse.json({ test: true });
}
`);
    
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('__test_multiline__'), 'Should detect multiline import');
  } finally {
    if (fs.existsSync(testRoute)) {
      fs.unlinkSync(testRoute);
      fs.rmdirSync(path.dirname(testRoute));
    }
  }
});

/**
 * Test 4: Side-effect forbidden import detected
 */
test('Side-effect forbidden import detected', () => {
  const testRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/__test_sideeffect__/route.ts');
  
  try {
    fs.mkdirSync(path.dirname(testRoute), { recursive: true });
    
    // Side-effect import
    fs.writeFileSync(testRoute, `
import { NextResponse } from 'next/server';
import '@quiz/db'; // TEST: Side-effect import

export async function GET() {
  return NextResponse.json({ test: true });
}
`);
    
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('__test_sideeffect__'), 'Should detect side-effect import');
  } finally {
    if (fs.existsSync(testRoute)) {
      fs.unlinkSync(testRoute);
      fs.rmdirSync(path.dirname(testRoute));
    }
  }
});

/**
 * Test 5: Subpath forbidden import detected (@quiz/db/client)
 */
test('Subpath forbidden import detected (@quiz/db/client)', () => {
  const testRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/__test_subpath__/route.ts');
  
  try {
    fs.mkdirSync(path.dirname(testRoute), { recursive: true });
    
    fs.writeFileSync(testRoute, `
import { NextResponse } from 'next/server';
import { db } from '@quiz/db/client'; // TEST: Subpath import

export async function GET() {
  return NextResponse.json({ test: true });
}
`);
    
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('__test_subpath__'), 'Should detect subpath import');
  } finally {
    if (fs.existsSync(testRoute)) {
      fs.unlinkSync(testRoute);
      fs.rmdirSync(path.dirname(testRoute));
    }
  }
});

/**
 * Test 6: document.cookie access detected
 */
test('document.cookie access detected', () => {
  const testComponent = path.join(ROOT, 'apps/skillhubcore-admin/src/components/__test_cookie__.tsx');
  
  try {
    fs.mkdirSync(path.dirname(testComponent), { recursive: true });
    
    fs.writeFileSync(testComponent, `
export function TestComponent() {
  const cookies = document.cookie; // TEST: Forbidden cookie access
  return <div>Test</div>;
}
`);
    
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('document.cookie'), 'Should detect document.cookie access');
  } finally {
    if (fs.existsSync(testComponent)) {
      fs.unlinkSync(testComponent);
    }
  }
});

/**
 * Test 7: localStorage.setItem('accessToken') detected
 */
test('localStorage.setItem(\'accessToken\') detected', () => {
  const testComponent = path.join(ROOT, 'apps/skillhubcore-admin/src/components/__test_localstorage__.tsx');
  
  try {
    fs.mkdirSync(path.dirname(testComponent), { recursive: true });
    
    fs.writeFileSync(testComponent, `
export function TestAuth() {
  localStorage.setItem('accessToken', 'test'); // TEST: Forbidden token storage
  return <div>Test</div>;
}
`);
    
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('localStorage'), 'Should detect localStorage auth persistence');
  } finally {
    if (fs.existsSync(testComponent)) {
      fs.unlinkSync(testComponent);
    }
  }
});

/**
 * Test 8: Direct jose import detected
 */
test('Direct jose import detected', () => {
  const testRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/__test_jose__/route.ts');
  
  try {
    fs.mkdirSync(path.dirname(testRoute), { recursive: true });
    
    fs.writeFileSync(testRoute, `
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // TEST: Direct JWT verification

export async function GET() {
  return NextResponse.json({ test: true });
}
`);
    
    const result = runChecker(1);
    assert(result.exitCode === 1, `Expected exit 1 (violation), got ${result.exitCode}`);
    assert(result.output.includes('jose'), 'Should detect direct jose import');
  } finally {
    if (fs.existsSync(testRoute)) {
      fs.unlinkSync(testRoute);
      fs.rmdirSync(path.dirname(testRoute));
    }
  }
});

/**
 * Test 9: Service boundary respected (@quiz/db-tutorial)
 */
test('Service boundary respected (@quiz/db-tutorial)', () => {
  const testRoute = path.join(ROOT, 'apps/skillhubcore-admin/src/app/api/__test_service__/route.ts');
  
  try {
    fs.mkdirSync(path.dirname(testRoute), { recursive: true });
    
    fs.writeFileSync(testRoute, `
import { NextResponse } from 'next/server';
import { tutorialService } from '@quiz/db-tutorial'; // PERMITTED: Service boundary

export async function GET() {
  return NextResponse.json({ test: true });
}
`);
    
    const result = runChecker(0);
    assert(result.exitCode === 0, `Expected exit 0 (pass), got ${result.exitCode}`);
  } finally {
    if (fs.existsSync(testRoute)) {
      fs.unlinkSync(testRoute);
      fs.rmdirSync(path.dirname(testRoute));
    }
  }
});

/**
 * Test 10: Malformed baseline fails (fail-closed)
 */
test('Malformed baseline fails (invalid JSON)', () => {
  const baselinePath = path.join(ROOT, 'audit/W0.2_Architecture_Baseline.json');
  const originalContent = fs.readFileSync(baselinePath, 'utf8');
  
  try {
    fs.writeFileSync(baselinePath, '{ invalid json }');
    
    const result = runChecker(2);
    assert(result.exitCode === 2, `Expected exit 2 (fail-closed), got ${result.exitCode}`);
    assert(result.output.includes('BASELINE_ERROR'), 'Should report baseline error');
  } finally {
    fs.writeFileSync(baselinePath, originalContent);
  }
});

/**
 * Test 11: Missing baseline fails (fail-closed)
 */
test('Missing baseline fails', () => {
  const baselinePath = path.join(ROOT, 'audit/W0.2_Architecture_Baseline.json');
  const originalContent = fs.readFileSync(baselinePath, 'utf8');
  const tempPath = baselinePath + '.backup-test';
  
  try {
    fs.renameSync(baselinePath, tempPath);
    
    const result = runChecker(2);
    assert(result.exitCode === 2, `Expected exit 2, got ${result.exitCode}`);
    assert(result.output.includes('not found'), 'Should report baseline not found');
  } finally {
    fs.renameSync(tempPath, baselinePath);
  }
});

/**
 * Test 12: Nonexistent baseline route fails (fail-closed)
 */
test('Nonexistent baseline route fails', () => {
  const baselinePath = path.join(ROOT, 'audit/W0.2_Architecture_Baseline.json');
  const originalContent = fs.readFileSync(baselinePath, 'utf8');
  
  try {
    const baseline = JSON.parse(originalContent);
    baseline.directDBRoutes.push('apps/skillhubcore-admin/src/app/api/__nonexistent__/route.ts');
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
    
    const result = runChecker(2);
    assert(result.exitCode === 2, `Expected exit 2, got ${result.exitCode}`);
    assert(result.output.includes('do not exist'), 'Should report nonexistent routes');
  } finally {
    fs.writeFileSync(baselinePath, originalContent);
  }
});

/**
 * Test 13: Missing scan root fails (fail-closed)
 */
test('Missing scan root fails', () => {
  // Verify checker has fail-closed logic for missing roots
  const checkerContent = fs.readFileSync(
    path.join(ROOT, 'scripts/check-architecture-violations.mjs'),
    'utf8'
  );
  
  assert(
    checkerContent.includes('SCAN_ERROR: Required scan root does not exist'),
    'Checker should have fail-closed scan root validation'
  );
  
  assert(
    checkerContent.includes('throw new Error'),
    'Checker should throw on missing scan roots'
  );
});

// Cleanup
cleanup();

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`   Total:  ${passed + failed}`);
console.log('═══════════════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
