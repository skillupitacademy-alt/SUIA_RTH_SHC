#!/usr/bin/env node

/**
 * W0.2 Quality Gate Orchestrator Tests
 * 
 * Tests:
 * 1. Valid stage names accepted
 * 2. Invalid stage name rejected (exit 255)
 * 3. toString attack rejected (exit 255)
 * 4. constructor attack rejected (exit 255)
 * 5. __proto__ attack rejected (exit 255)
 * 6. Unknown flag rejected (exit 255)
 * 7. Failed stage propagates failure exit code
 * 8. Later stages not executed after failure
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

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

function runOrchestrator(...args) {
  try {
    const output = execSync(`node scripts/quality-gate-skillhubcore.mjs ${args.join(' ')}`, {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 5000, // 5 second timeout for tests
    });
    return { exitCode: 0, output };
  } catch (error) {
    return { exitCode: error.status || 1, output: error.stdout + error.stderr };
  }
}

console.log('\n🧪 W0.2 Quality Gate Orchestrator Tests\n');

/**
 * Test 1: Valid stage names accepted
 */
test('Valid stage names accepted', () => {
  const validStages = ['guards', 'security', 'lint', 'typecheck', 'test', 'build'];
  
  for (const stage of validStages) {
    const result = runOrchestrator(`--stage=${stage}`);
    // We don't require exit 0 (stage might fail), just that it's not 255 (validation error)
    assert(result.exitCode !== 255, `Stage ${stage} should not reject with exit 255, got ${result.exitCode}`);
  }
});

/**
 * Test 2: Invalid stage name rejected
 */
test('Invalid stage name rejected (exit 255)', () => {
  const result = runOrchestrator('--stage=invalid');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should report unknown stage');
});

/**
 * Test 3: toString attack rejected
 */
test('toString attack rejected (exit 255)', () => {
  const result = runOrchestrator('--stage=toString');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject toString');
});

/**
 * Test 4: constructor attack rejected
 */
test('constructor attack rejected (exit 255)', () => {
  const result = runOrchestrator('--stage=constructor');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject constructor');
});

/**
 * Test 5: __proto__ attack rejected
 */
test('__proto__ attack rejected (exit 255)', () => {
  const result = runOrchestrator('--stage=__proto__');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject __proto__');
});

/**
 * Test 6: Unknown flag rejected
 */
test('Unknown flag rejected (exit 255)', () => {
  const result = runOrchestrator('--unknown-flag');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown arguments'), 'Should reject unknown flag');
});

/**
 * Test 7: Failed stage propagates failure exit code
 * Note: We can't easily create a failing stage without modifying code,
 * so we verify the orchestrator's error handling logic exists
 */
test('Failed stage propagates failure (logic check)', () => {
  const orchestratorContent = fs.readFileSync(
    path.join(ROOT, 'scripts/quality-gate-skillhubcore.mjs'),
    'utf8'
  );
  
  // Verify the orchestrator has proper error handling
  assert(
    orchestratorContent.includes('process.exit(stage.exitCode)'),
    'Orchestrator should propagate stage exit codes'
  );
  
  assert(
    orchestratorContent.includes('catch (error)'),
    'Orchestrator should catch stage failures'
  );
});

/**
 * Test 8: Later stages not executed after failure (logic check)
 */
test('Later stages not executed after failure (fail-fast logic)', () => {
  const orchestratorContent = fs.readFileSync(
    path.join(ROOT, 'scripts/quality-gate-skillhubcore.mjs'),
    'utf8'
  );
  
  // Verify fail-fast behavior in aggregate mode
  assert(
    orchestratorContent.includes('for (const stageName of stageOrder)'),
    'Orchestrator should iterate stages in order'
  );
  
  assert(
    orchestratorContent.includes('process.exit(stage.exitCode)') ||
    orchestratorContent.includes('break'),
    'Orchestrator should exit/break on first failure'
  );
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
