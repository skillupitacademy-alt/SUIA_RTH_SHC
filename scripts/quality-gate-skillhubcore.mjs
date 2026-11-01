#!/usr/bin/env node

/**
 * W0.2 SkillHubCore Quality Gate - Fail-fast aggregate enforcement
 * 
 * Execution order (fail-fast):
 * 1. Architecture Guards (direct-DB route baseline + API boundary authorization)
 * 2. Security Tests (admin boundary, upstream proxy validation)
 * 3. Lint (ESLint with EXPLICIT --max-warnings=0)
 * 4. Type Check (TypeScript strict mode)
 * 5. Unit Tests (ISOLATED safe tests, no ambient DB access)
 * 6. Build (Next.js production build)
 * 
 * Exit codes:
 * - 0: All gates passed
 * - 1-6: Gate N failed (architecture=1, security=2, lint=3, typecheck=4, test=5, build=6)
 * 
 * Usage:
 *   node scripts/quality-gate-skillhubcore.mjs [--stage=<name>]
 * 
 * Stages (independently runnable):
 *   --stage=guards        Architecture violation check + API boundary check
 *   --stage=security      Security tests only
 *   --stage=lint          Lint with --max-warnings=0
 *   --stage=typecheck     Type check only
 *   --stage=test          Isolated unit tests only
 *   --stage=build         Build only
 *   (no --stage)          Run all stages in order (fail-fast)
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const SKILLHUBCORE_DIR = resolve(ROOT, 'apps/skillhubcore-admin');

const STAGES = {
  guards: {
    name: 'Architecture Guards',
    exitCode: 1,
    run: () => {
      console.log('\n🏛️  Gate 1: Architecture Guards');
      console.log('   Part 1: Direct-DB route baseline compliance...\n');
      execSync('node scripts/check-architecture-violations.mjs', {
        cwd: ROOT,
        stdio: 'inherit',
      });
      
      console.log('\n   Part 2: API authorization boundary check...\n');
      execSync('node scripts/check-api-boundaries.mjs', {
        cwd: SKILLHUBCORE_DIR,
        stdio: 'inherit',
      });
      
      console.log('   ✅ Architecture guards passed\n');
    },
  },
  security: {
    name: 'Security Tests',
    exitCode: 2,
    run: () => {
      console.log('\n🔒 Gate 2: Security Tests');
      console.log('   Running admin boundary and upstream proxy tests...\n');
      execSync('pnpm run test:security', {
        cwd: SKILLHUBCORE_DIR,
        stdio: 'inherit',
      });
      console.log('   ✅ Security tests passed\n');
    },
  },
  lint: {
    name: 'Lint',
    exitCode: 3,
    run: () => {
      console.log('\n🧹 Gate 3: Lint');
      console.log('   Running ESLint with EXPLICIT --max-warnings=0...\n');
      // EXPLICIT --max-warnings=0 (Sol Review correction)
      execSync('pnpm exec eslint --ext .ts,.tsx,.js,.jsx . --max-warnings=0', {
        cwd: SKILLHUBCORE_DIR,
        env: {
          ...process.env,
          ESLINT_USE_FLAT_CONFIG: 'false',
        },
        stdio: 'inherit',
      });
      console.log('   ✅ Lint passed\n');
    },
  },
  typecheck: {
    name: 'Type Check',
    exitCode: 4,
    run: () => {
      console.log('\n🔍 Gate 4: Type Check');
      console.log('   Running TypeScript compiler in noEmit mode...\n');
      execSync('pnpm run type-check', {
        cwd: SKILLHUBCORE_DIR,
        stdio: 'inherit',
      });
      console.log('   ✅ Type check passed\n');
    },
  },
  test: {
    name: 'Unit Tests',
    exitCode: 5,
    run: () => {
      console.log('\n🧪 Gate 5: Unit Tests (ISOLATED safe tests)');
      console.log('   Running isolated unit tests (no ambient DB access)...\n');
      // ISOLATED test selection (Sol Review correction)
      // Run only safe unit tests, exclude DB integration tests
      execSync('pnpm run test:isolated', {
        cwd: SKILLHUBCORE_DIR,
        stdio: 'inherit',
      });
      console.log('   ✅ Unit tests passed\n');
    },
  },
  build: {
    name: 'Build',
    exitCode: 6,
    run: () => {
      console.log('\n🏗️  Gate 6: Build');
      console.log('   Running Next.js production build...\n');
      execSync('pnpm run build', {
        cwd: SKILLHUBCORE_DIR,
        stdio: 'inherit',
      });
      console.log('   ✅ Build passed\n');
    },
  },
};

function main() {
  const args = process.argv.slice(2);
  const stageArg = args.find(arg => arg.startsWith('--stage='));
  
  if (stageArg) {
    // Run single stage
    const stageName = stageArg.split('=')[1];
    const stage = STAGES[stageName];
    
    if (!stage) {
      console.error(`❌ Unknown stage: ${stageName}`);
      console.error(`   Valid stages: ${Object.keys(STAGES).join(', ')}`);
      process.exit(255);
    }
    
    console.log(`\n🎯 Running single stage: ${stage.name}`);
    try {
      stage.run();
      console.log(`\n✅ Stage "${stageName}" completed successfully\n`);
      process.exit(0);
    } catch (error) {
      console.error(`\n❌ Stage "${stageName}" failed\n`);
      process.exit(stage.exitCode);
    }
  } else {
    // Run all stages (fail-fast)
    console.log('\n🚀 SkillHubCore Quality Gate - Running all stages (fail-fast)\n');
    console.log('   Target: apps/skillhubcore-admin');
    console.log('   Baseline: 26 direct-DB routes (W0.2 corrected)');
    console.log('   Isolated tests: Safe unit tests only (no ambient DB)\n');
    
    const stageOrder = ['guards', 'security', 'lint', 'typecheck', 'test', 'build'];
    
    for (const stageName of stageOrder) {
      const stage = STAGES[stageName];
      try {
        stage.run();
      } catch (error) {
        console.error(`\n❌ Quality gate failed at stage: ${stage.name}`);
        console.error(`   Exiting with code ${stage.exitCode}\n`);
        process.exit(stage.exitCode);
      }
    }
    
    console.log('\n✅ All quality gates passed!\n');
    console.log('   Summary:');
    console.log('   - Architecture Guards: ✅ PASS (baseline + API boundary)');
    console.log('   - Security Tests:      ✅ PASS');
    console.log('   - Lint:                ✅ PASS (--max-warnings=0)');
    console.log('   - Type Check:          ✅ PASS');
    console.log('   - Unit Tests:          ✅ PASS (isolated)');
    console.log('   - Build:               ✅ PASS\n');
    process.exit(0);
  }
}

main();
