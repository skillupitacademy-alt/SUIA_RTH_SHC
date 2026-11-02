#!/usr/bin/env node

/**
 * W0.2 Quality Gate Orchestrator Tests - Production Runner with Stub Commands
 * 
 * Tests the ACTUAL quality-gate-skillhubcore.mjs orchestrator by:
 * 1. Temporarily replacing stage commands with disposable stubs
 * 2. Executing the real orchestrator script
 * 3. Verifying behavioral correctness via execution traces
 * 4. Restoring original commands
 * 
 * Tests:
 * 1. Duplicate --stage arguments rejected (exit 255)
 * 2. Malformed --stage= rejected (exit 255)
 * 3. Invalid stage name rejected (exit 255)
 * 4. toString attack rejected (exit 255)
 * 5. constructor attack rejected (exit 255)
 * 6. __proto__ attack rejected (exit 255)
 * 7. Unknown flag rejected (exit 255)
 * 8. Failed stage propagates correct exit code (stub commands)
 * 9. Later stages not executed after failure (stub commands, trace verification)
 * 10. Successful aggregate execution (stub commands, trace verification)
 */

import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

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
    if (error.details) {
      console.error(`   ${error.details}`);
    }
    failed++;
  }
}

function assert(condition, message, details) {
  if (!condition) {
    const error = new Error(message || 'Assertion failed');
    if (details) error.details = details;
    throw error;
  }
}

function runRealOrchestrator(...args) {
  try {
    const output = execSync(`node scripts/quality-gate-skillhubcore.mjs ${args.join(' ')}`, {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 10000,
    });
    return { exitCode: 0, output };
  } catch (error) {
    return { 
      exitCode: error.status || 1, 
      output: (error.stdout || '') + (error.stderr || ''),
      signal: error.signal
    };
  }
}

/**
 * Create stub commands that write to trace file instead of running real stages
 * Returns modified orchestrator content with stub commands
 */
function createStubOrchestratorContent(tracePath, stageFailures) {
  const originalPath = join(ROOT, 'scripts/quality-gate-skillhubcore.mjs');
  let content = readFileSync(originalPath, 'utf8');
  
  // Replace real stage commands with stub commands that write to trace
  // The trace path needs to be escaped for Windows paths
  const escapedTracePath = tracePath.replace(/\\/g, '\\\\');
  
  // Stage: guards
  content = content.replace(
    /execSync\('node scripts\/check-architecture-violations\.mjs'[\s\S]*?\);[\s\S]*?execSync\('node scripts\/check-api-boundaries\.mjs'[\s\S]*?\);/,
    `fs.appendFileSync('${escapedTracePath}', 'guards\\n');
      if (${stageFailures.guards || false}) throw new Error('guards failed');`
  );
  
  // Stage: security
  content = content.replace(
    /execSync\('pnpm run test:security'[\s\S]*?\);/,
    `fs.appendFileSync('${escapedTracePath}', 'security\\n');
      if (${stageFailures.security || false}) throw new Error('security failed');`
  );
  
  // Stage: lint
  content = content.replace(
    /execSync\('pnpm exec eslint[\s\S]*?\);/,
    `fs.appendFileSync('${escapedTracePath}', 'lint\\n');
      if (${stageFailures.lint || false}) throw new Error('lint failed');`
  );
  
  // Stage: typecheck
  content = content.replace(
    /execSync\('pnpm run type-check'[\s\S]*?\);/,
    `fs.appendFileSync('${escapedTracePath}', 'typecheck\\n');
      if (${stageFailures.typecheck || false}) throw new Error('typecheck failed');`
  );
  
  // Stage: test
  content = content.replace(
    /execSync\('pnpm run test:isolated'[\s\S]*?\);/,
    `fs.appendFileSync('${escapedTracePath}', 'test\\n');
      if (${stageFailures.test || false}) throw new Error('test failed');`
  );
  
  // Stage: build
  content = content.replace(
    /execSync\('pnpm run build'[\s\S]*?\);/,
    `fs.appendFileSync('${escapedTracePath}', 'build\\n');
      if (${stageFailures.build || false}) throw new Error('build failed');`
  );
  
  // Add fs import if not present
  if (!content.includes("import fs from 'fs';")) {
    content = content.replace(
      "import { execSync } from 'child_process';",
      "import { execSync } from 'child_process';\nimport fs from 'fs';"
    );
  }
  
  return content;
}

function runStubOrchestrator(stubOrchestratorPath, ...args) {
  try {
    const output = execSync(`node "${stubOrchestratorPath}" ${args.join(' ')}`, {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 5000,
    });
    return { exitCode: 0, output };
  } catch (error) {
    return { 
      exitCode: error.status || 1, 
      output: (error.stdout || '') + (error.stderr || '')
    };
  }
}

console.log('\n🧪 W0.2 Quality Gate Orchestrator Tests - Production Runner with Stub Commands\n');

/**
 * Tests 1-7: Validation tests (use real orchestrator, no stubs needed)
 */

test('Duplicate --stage arguments rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=guards', '--stage=build');
  assert(
    result.exitCode === 255, 
    `Expected exit 255, got ${result.exitCode}`,
    `Output: ${result.output.substring(0, 200)}`
  );
  assert(
    result.output.includes('Conflicting stage arguments') || result.output.includes('Only one'),
    'Should report conflicting stage arguments'
  );
});

test('Malformed --stage= rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=');
  assert(
    result.exitCode === 255, 
    `Expected exit 255, got ${result.exitCode}`,
    `Output: ${result.output.substring(0, 200)}`
  );
  assert(
    result.output.includes('Malformed') || result.output.includes('Unknown stage'),
    'Should report malformed stage argument'
  );
});

test('Invalid stage name rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=invalid');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should report unknown stage');
});

test('toString attack rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=toString');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject toString');
});

test('constructor attack rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=constructor');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject constructor');
});

test('__proto__ attack rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=__proto__');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject __proto__');
});

test('Unknown flag rejected (exit 255)', () => {
  const result = runRealOrchestrator('--unknown-flag');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown arguments'), 'Should reject unknown flag');
});

/**
 * Tests 8-10: Behavioral tests (use real orchestrator with stub commands)
 */

test('Failed stage propagates correct exit code (real orchestrator, stub commands)', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'w02-orch-test-'));
  
  try {
    const tracePath = join(tempDir, 'trace.txt');
    const stubOrchestratorPath = join(tempDir, 'quality-gate-stub.mjs');
    
    // Create stub orchestrator with security stage failing
    const stubContent = createStubOrchestratorContent(tracePath, {
      guards: false,
      security: true, // fails
      lint: false,
      typecheck: false,
      test: false,
      build: false,
    });
    
    writeFileSync(stubOrchestratorPath, stubContent);
    
    // Run single stage that fails
    const result = runStubOrchestrator(stubOrchestratorPath, '--stage=security');
    
    assert(result.exitCode === 2, `Expected exit 2 (security's exitCode), got ${result.exitCode}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Later stages not executed after failure (real orchestrator, stub commands, trace)', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'w02-orch-test-'));
  
  try {
    const tracePath = join(tempDir, 'trace.txt');
    const stubOrchestratorPath = join(tempDir, 'quality-gate-stub.mjs');
    
    // Create stub orchestrator with typecheck stage failing
    const stubContent = createStubOrchestratorContent(tracePath, {
      guards: false,
      security: false,
      lint: false,
      typecheck: true, // fails
      test: false,
      build: false,
    });
    
    writeFileSync(stubOrchestratorPath, stubContent);
    
    // Run aggregate (no --stage)
    const result = runStubOrchestrator(stubOrchestratorPath);
    
    // Should fail at typecheck (exit code 4)
    assert(result.exitCode === 4, `Expected exit 4, got ${result.exitCode}`);
    
    // Read execution trace
    const trace = readFileSync(tracePath, 'utf8').trim().split('\n').filter(s => s);
    
    assert(trace.length === 4, `Expected 4 stages executed, got ${trace.length}: ${trace.join(', ')}`);
    assert(trace[0] === 'guards', `Expected guards first, got ${trace[0]}`);
    assert(trace[1] === 'security', `Expected security second, got ${trace[1]}`);
    assert(trace[2] === 'lint', `Expected lint third, got ${trace[2]}`);
    assert(trace[3] === 'typecheck', `Expected typecheck fourth, got ${trace[3]}`);
    assert(!trace.includes('test'), 'test should NOT have executed');
    assert(!trace.includes('build'), 'build should NOT have executed');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Successful aggregate execution (real orchestrator, stub commands, trace)', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'w02-orch-test-'));
  
  try {
    const tracePath = join(tempDir, 'trace.txt');
    const stubOrchestratorPath = join(tempDir, 'quality-gate-stub.mjs');
    
    // Create stub orchestrator with all stages passing
    const stubContent = createStubOrchestratorContent(tracePath, {
      guards: false,
      security: false,
      lint: false,
      typecheck: false,
      test: false,
      build: false,
    });
    
    writeFileSync(stubOrchestratorPath, stubContent);
    
    // Run aggregate
    const result = runStubOrchestrator(stubOrchestratorPath);
    
    assert(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
    
    // Read execution trace
    const trace = readFileSync(tracePath, 'utf8').trim().split('\n').filter(s => s);
    
    assert(trace.length === 6, `Expected 6 stages executed, got ${trace.length}: ${trace.join(', ')}`);
    assert(trace[0] === 'guards', `Expected guards first, got ${trace[0]}`);
    assert(trace[1] === 'security', `Expected security second, got ${trace[1]}`);
    assert(trace[2] === 'lint', `Expected lint third, got ${trace[2]}`);
    assert(trace[3] === 'typecheck', `Expected typecheck fourth, got ${trace[3]}`);
    assert(trace[4] === 'test', `Expected test fifth, got ${trace[4]}`);
    assert(trace[5] === 'build', `Expected build sixth, got ${trace[5]}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
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
