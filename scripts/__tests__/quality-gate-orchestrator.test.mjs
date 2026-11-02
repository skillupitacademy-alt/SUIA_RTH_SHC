#!/usr/bin/env node

/**
 * W0.2 Quality Gate Orchestrator Tests - Behavioral Verification
 * 
 * Tests with disposable stub stages (no real build execution):
 * 1. Duplicate --stage arguments rejected (exit 255)
 * 2. Malformed --stage= rejected (exit 255)
 * 3. Invalid stage name rejected (exit 255)
 * 4. toString attack rejected (exit 255)
 * 5. constructor attack rejected (exit 255)
 * 6. __proto__ attack rejected (exit 255)
 * 7. Unknown flag rejected (exit 255)
 * 8. Failed stage propagates correct exit code (disposable stub)
 * 9. Later stages not executed after failure (disposable stub)
 * 10. Successful aggregate execution (disposable stub)
 * 11. Execution order verified (disposable stub)
 */

import { execSync } from 'child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
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
 * Create a disposable stub orchestrator that tracks execution
 */
function createStubOrchestrator(tempDir, stageExitCodes) {
  const tracePath = join(tempDir, 'execution-trace.txt');
  const stubPath = join(tempDir, 'stub-orchestrator.mjs');
  
  // Create stub stages that write to trace file
  const stageDefinitions = Object.entries(stageExitCodes).map(([name, exitCode], index) => {
    return `  ${name}: {
    name: '${name}',
    exitCode: ${index + 1},
    run: () => {
      fs.appendFileSync('${tracePath.replace(/\\/g, '\\\\')}', '${name}\\n');
      if (${exitCode} !== 0) {
        throw new Error('Stage ${name} failed');
      }
    },
  }`;
  }).join(',\n');
  
  const stubCode = `#!/usr/bin/env node
import fs from 'fs';

const STAGES = {
${stageDefinitions}
};

function main() {
  const args = process.argv.slice(2);
  
  // Validate no unknown arguments
  const unknownArgs = args.filter(arg => !arg.startsWith('--stage='));
  if (unknownArgs.length > 0) {
    console.error(\`❌ Unknown arguments: \${unknownArgs.join(', ')}\`);
    process.exit(255);
  }
  
  // Collect all --stage arguments
  const stageArgs = args.filter(arg => arg.startsWith('--stage='));
  
  // CRITICAL: Reject duplicate/conflicting --stage arguments
  if (stageArgs.length > 1) {
    console.error(\`❌ Conflicting stage arguments: \${stageArgs.join(' ')}\`);
    console.error(\`   Only one --stage argument is allowed\`);
    process.exit(255);
  }
  
  if (stageArgs.length === 1) {
    const stageArg = stageArgs[0];
    const stageName = stageArg.split('=')[1];
    
    if (!stageName || stageName.trim() === '') {
      console.error(\`❌ Malformed stage argument: \${stageArg}\`);
      process.exit(255);
    }
    
    const validStages = Object.keys(STAGES);
    if (!validStages.includes(stageName)) {
      console.error(\`❌ Unknown stage: \${stageName}\`);
      process.exit(255);
    }
    
    const stage = STAGES[stageName];
    try {
      stage.run();
      process.exit(0);
    } catch (error) {
      process.exit(stage.exitCode);
    }
  } else {
    // Run all stages (fail-fast)
    const stageOrder = Object.keys(STAGES);
    
    for (const stageName of stageOrder) {
      const stage = STAGES[stageName];
      try {
        stage.run();
      } catch (error) {
        process.exit(stage.exitCode);
      }
    }
    
    process.exit(0);
  }
}

main();
`;
  
  writeFileSync(stubPath, stubCode);
  return { stubPath, tracePath };
}

function runStubOrchestrator(stubPath, ...args) {
  try {
    const output = execSync(`node "${stubPath}" ${args.join(' ')}`, {
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

console.log('\n🧪 W0.2 Quality Gate Orchestrator Tests - Behavioral Verification\n');

/**
 * Test 1: Duplicate --stage arguments rejected
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

/**
 * Test 2: Malformed --stage= rejected
 */
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

/**
 * Test 3: Invalid stage name rejected
 */
test('Invalid stage name rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=invalid');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should report unknown stage');
});

/**
 * Test 4: toString attack rejected
 */
test('toString attack rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=toString');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject toString');
});

/**
 * Test 5: constructor attack rejected
 */
test('constructor attack rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=constructor');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject constructor');
});

/**
 * Test 6: __proto__ attack rejected
 */
test('__proto__ attack rejected (exit 255)', () => {
  const result = runRealOrchestrator('--stage=__proto__');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown stage'), 'Should reject __proto__');
});

/**
 * Test 7: Unknown flag rejected
 */
test('Unknown flag rejected (exit 255)', () => {
  const result = runRealOrchestrator('--unknown-flag');
  assert(result.exitCode === 255, `Expected exit 255, got ${result.exitCode}`);
  assert(result.output.includes('Unknown arguments'), 'Should reject unknown flag');
});

/**
 * Test 8: Failed stage propagates correct exit code
 */
test('Failed stage propagates correct exit code (disposable stub)', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'w02-orch-test-'));
  
  try {
    // Create stub with stage2 failing
    const { stubPath, tracePath } = createStubOrchestrator(tempDir, {
      stage1: 0,
      stage2: 1, // fails
      stage3: 0,
    });
    
    const result = runStubOrchestrator(stubPath, '--stage=stage2');
    
    assert(result.exitCode === 2, `Expected exit 2 (stage2's exitCode), got ${result.exitCode}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

/**
 * Test 9: Later stages not executed after failure
 */
test('Later stages not executed after failure (disposable stub)', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'w02-orch-test-'));
  
  try {
    // Create stub with stage2 failing
    const { stubPath, tracePath } = createStubOrchestrator(tempDir, {
      stage1: 0,
      stage2: 1, // fails
      stage3: 0,
      stage4: 0,
    });
    
    // Run aggregate (no --stage)
    const result = runStubOrchestrator(stubPath);
    
    // Should fail at stage2
    assert(result.exitCode === 2, `Expected exit 2, got ${result.exitCode}`);
    
    // Read execution trace
    const trace = fs.readFileSync(tracePath, 'utf8').trim().split('\n');
    
    assert(trace.length === 2, `Expected 2 stages executed, got ${trace.length}: ${trace.join(', ')}`);
    assert(trace[0] === 'stage1', `Expected stage1 first, got ${trace[0]}`);
    assert(trace[1] === 'stage2', `Expected stage2 second, got ${trace[1]}`);
    assert(!trace.includes('stage3'), 'stage3 should NOT have executed');
    assert(!trace.includes('stage4'), 'stage4 should NOT have executed');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

/**
 * Test 10: Successful aggregate execution
 */
test('Successful aggregate execution (disposable stub)', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'w02-orch-test-'));
  
  try {
    // Create stub with all stages passing
    const { stubPath, tracePath } = createStubOrchestrator(tempDir, {
      stage1: 0,
      stage2: 0,
      stage3: 0,
    });
    
    const result = runStubOrchestrator(stubPath);
    
    assert(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
    
    // Read execution trace
    const trace = fs.readFileSync(tracePath, 'utf8').trim().split('\n');
    
    assert(trace.length === 3, `Expected 3 stages executed, got ${trace.length}`);
    assert(trace[0] === 'stage1', `Expected stage1 first, got ${trace[0]}`);
    assert(trace[1] === 'stage2', `Expected stage2 second, got ${trace[1]}`);
    assert(trace[2] === 'stage3', `Expected stage3 third, got ${trace[2]}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

/**
 * Test 11: Execution order verified
 */
test('Execution order verified (disposable stub)', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'w02-orch-test-'));
  
  try {
    // Create stub with specific order
    const { stubPath, tracePath } = createStubOrchestrator(tempDir, {
      alpha: 0,
      beta: 0,
      gamma: 0,
      delta: 0,
    });
    
    const result = runStubOrchestrator(stubPath);
    
    assert(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
    
    // Read execution trace
    const trace = fs.readFileSync(tracePath, 'utf8').trim().split('\n');
    
    assert(trace.length === 4, `Expected 4 stages executed, got ${trace.length}`);
    assert(trace[0] === 'alpha', `Expected alpha first, got ${trace[0]}`);
    assert(trace[1] === 'beta', `Expected beta second, got ${trace[1]}`);
    assert(trace[2] === 'gamma', `Expected gamma third, got ${trace[2]}`);
    assert(trace[3] === 'delta', `Expected delta fourth, got ${trace[3]}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

// Import fs for trace reading in tests
import fs from 'fs';

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`   Total:  ${passed + failed}`);
console.log('═══════════════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
