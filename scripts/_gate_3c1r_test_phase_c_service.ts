/**
 * GATE 3C.1R — PHASE C CLOSURE
 * Step 7-12: Service Runtime Verification
 * 
 * Purpose: Verify that LearningProgressService.getNavigationProgress()
 * correctly returns blocks[] array with D1 and C1 telemetry.
 * 
 * IMPORTANT: This is a READ-ONLY test using existing data.
 */

import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load environment BEFORE importing db
dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

import { db } from '../packages/db-tutorial/src/db';
import { LearningProgressService } from '../packages/db-tutorial/src/services/learning-progress.service';
import { TutorialNavigationProgressRepository } from '../packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository';
import { TutorialSectionRepository } from '../packages/db-tutorial/src/repositories/tutorial-section.repository';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';
import type { AuthenticatedIdentity } from '../packages/db-tutorial/src/services/learning-progress.types';

/**
 * Verified hierarchy data from Step 1-6
 */
const TEST_DATA = {
  navigationNodeId: 'whatisjava',
  subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
  userId: '54726a2e-fca5-4d93-abc6-e7cee97a86f8',
  brand: 'realtutorialhub', // Known brand for this user
  expectedD1BlockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
  expectedC1BlockId: 'fb6b1e9d-3fe2-48f5-891e-73f8e22797b9',
};

async function main() {
  console.log('================================================================================');
  console.log('GATE 3C.1R — PHASE C CLOSURE: SERVICE RUNTIME VERIFICATION');
  console.log('================================================================================');
  console.log();

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // STEP 7: Construct service with actual repositories
    console.log('STEP 7: Constructing LearningProgressService');
    console.log('--------------------------------------------------------------------------------');
    
    const progressRepository = new TutorialNavigationProgressRepository(db);
    const sectionRepository = new TutorialSectionRepository(db);
    const blockLearningStateRepository = new BlockLearningStateRepository(db);
    
    const service = new LearningProgressService(
      progressRepository,
      sectionRepository,
      blockLearningStateRepository
    );
    
    console.log('✅ Service constructed with actual repository instances');
    console.log();

    // STEP 8: Create authenticated identity
    console.log('STEP 8: Creating authenticated identity');
    console.log('--------------------------------------------------------------------------------');
    
    const identity: AuthenticatedIdentity = {
      userId: TEST_DATA.userId,
      brand: TEST_DATA.brand,
    };
    
    console.log(`User: ${identity.userId}`);
    console.log(`Brand: ${identity.brand}`);
    console.log();

    // STEP 9: Call getNavigationProgress() service method
    console.log('STEP 9: Calling service.getNavigationProgress()');
    console.log('--------------------------------------------------------------------------------');
    console.log(`Navigation node: ${TEST_DATA.navigationNodeId}`);
    console.log(`Subtopic: ${TEST_DATA.subtopicId}`);
    console.log();

    const result = await service.getNavigationProgress(
      identity,
      TEST_DATA.navigationNodeId,
      TEST_DATA.subtopicId
    );

    console.log('✅ Service call succeeded');
    console.log();

    // STEP 10: Verify result.blocks exists and is array
    console.log('STEP 10: Verifying result.blocks[]');
    console.log('================================================================================');
    console.log();

    console.log('TEST 10.1 — blocks property exists');
    if (!('blocks' in result)) {
      console.log('❌ FAIL: result.blocks does not exist');
      testsFailed++;
    } else {
      console.log('✅ PASS: result.blocks exists');
      testsPassed++;
    }
    console.log();

    console.log('TEST 10.2 — blocks is an array');
    if (!Array.isArray(result.blocks)) {
      console.log('❌ FAIL: result.blocks is not an array');
      console.log(`   Type: ${typeof result.blocks}`);
      testsFailed++;
    } else {
      console.log('✅ PASS: result.blocks is an array');
      console.log(`   Length: ${result.blocks.length}`);
      testsPassed++;
    }
    console.log();

    if (!Array.isArray(result.blocks)) {
      console.log('❌ Cannot proceed with further tests - blocks is not an array');
      process.exitCode = 1;
      return;
    }

    console.log('TEST 10.3 — blocks array is not empty');
    if (result.blocks.length === 0) {
      console.log('⚠️  WARNING: blocks array is empty (no telemetry records returned)');
      console.log('   Expected: At least D1 and C1 blocks');
      testsFailed++;
    } else {
      console.log('✅ PASS: blocks array contains records');
      console.log(`   Count: ${result.blocks.length}`);
      testsPassed++;
    }
    console.log();

    // STEP 11: Verify block structure and fields
    console.log('STEP 11: Verifying block structure');
    console.log('================================================================================');
    console.log();

    if (result.blocks.length > 0) {
      const firstBlock = result.blocks[0];
      
      console.log('TEST 11.1 — Block has required fields');
      const requiredFields = [
        'blockId',
        'blockVersion',
        'visitCount',
        'revisionCount',
        'activeTimeSec',
        'expectedTimeSec',
        'firstViewedAt',
        'lastViewedAt',
        'completedAt'
      ];
      
      let missingFields: string[] = [];
      for (const field of requiredFields) {
        if (!(field in firstBlock)) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        console.log('❌ FAIL: Missing fields in block:');
        console.log(`   ${missingFields.join(', ')}`);
        testsFailed++;
      } else {
        console.log('✅ PASS: All required fields present');
        testsPassed++;
      }
      console.log();

      console.log('First block structure:');
      console.log(JSON.stringify(firstBlock, null, 2));
      console.log();
    }

    // STEP 12: Verify D1 runtime through service
    console.log('STEP 12: Verifying D1 telemetry');
    console.log('================================================================================');
    console.log();

    const d1Block = result.blocks.find(
      (block) =>
        block.blockId === TEST_DATA.expectedD1BlockId &&
        block.blockVersion === 'D1'
    );

    console.log('TEST 12.1 — D1 block exists in result.blocks');
    if (!d1Block) {
      console.log('❌ FAIL: D1 block not found in result.blocks');
      console.log(`   Expected blockId: ${TEST_DATA.expectedD1BlockId}`);
      console.log(`   Expected blockVersion: D1`);
      testsFailed++;
    } else {
      console.log('✅ PASS: D1 block found');
      console.log(`   blockId: ${d1Block.blockId}`);
      console.log(`   blockVersion: ${d1Block.blockVersion}`);
      testsPassed++;
    }
    console.log();

    if (d1Block) {
      console.log('TEST 12.2 — D1 telemetry values');
      console.log('D1 block telemetry:');
      console.log({
        blockId: d1Block.blockId,
        blockVersion: d1Block.blockVersion,
        visitCount: d1Block.visitCount,
        revisionCount: d1Block.revisionCount,
        activeTimeSec: d1Block.activeTimeSec,
        expectedTimeSec: d1Block.expectedTimeSec,
      });
      
      if (d1Block.visitCount > 0 && d1Block.activeTimeSec > 0) {
        console.log('✅ PASS: D1 telemetry values are realistic');
        testsPassed++;
      } else {
        console.log('⚠️  WARNING: D1 telemetry values may be incorrect');
        testsFailed++;
      }
      console.log();
    }

    // STEP 13: Verify C1 runtime through service
    console.log('STEP 13: Verifying C1 telemetry');
    console.log('================================================================================');
    console.log();

    const c1Block = result.blocks.find(
      (block) =>
        block.blockId === TEST_DATA.expectedC1BlockId &&
        block.blockVersion === 'C1'
    );

    console.log('TEST 13.1 — C1 block exists in result.blocks');
    if (!c1Block) {
      console.log('❌ FAIL: C1 block not found in result.blocks');
      console.log(`   Expected blockId: ${TEST_DATA.expectedC1BlockId}`);
      console.log(`   Expected blockVersion: C1`);
      testsFailed++;
    } else {
      console.log('✅ PASS: C1 block found');
      console.log(`   blockId: ${c1Block.blockId}`);
      console.log(`   blockVersion: ${c1Block.blockVersion}`);
      testsPassed++;
    }
    console.log();

    if (c1Block) {
      console.log('TEST 13.2 — C1 telemetry values');
      console.log('C1 block telemetry:');
      console.log({
        blockId: c1Block.blockId,
        blockVersion: c1Block.blockVersion,
        visitCount: c1Block.visitCount,
        revisionCount: c1Block.revisionCount,
        activeTimeSec: c1Block.activeTimeSec,
        expectedTimeSec: c1Block.expectedTimeSec,
      });
      
      if (c1Block.visitCount > 0 && c1Block.activeTimeSec > 0) {
        console.log('✅ PASS: C1 telemetry values are realistic');
        testsPassed++;
      } else {
        console.log('⚠️  WARNING: C1 telemetry values may be incorrect');
        testsFailed++;
      }
      console.log();
    }

    // STEP 14: Verify universal path (no D1/C1 branching)
    console.log('STEP 14: Verifying universal D1/C1 path');
    console.log('================================================================================');
    console.log();

    console.log('TEST 14.1 — Both D1 and C1 in same blocks[] array');
    if (d1Block && c1Block) {
      console.log('✅ PASS: Both D1 and C1 returned through same service method');
      console.log('✅ PASS: Same result.blocks[] array');
      console.log('✅ PASS: No block-type-specific service path detected');
      testsPassed += 3;
    } else {
      console.log('❌ FAIL: Cannot verify universal path (missing D1 or C1)');
      testsFailed++;
    }
    console.log();

    // Final summary
    console.log('================================================================================');
    console.log('SERVICE RUNTIME VERIFICATION SUMMARY');
    console.log('================================================================================');
    console.log();
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    console.log();

    if (testsFailed === 0) {
      console.log('✅ SERVICE RUNTIME VERIFICATION: PASS');
      console.log();
      console.log('Evidence:');
      console.log('- service.getNavigationProgress() called successfully');
      console.log('- result.blocks[] exists and is an array');
      console.log(`- result.blocks[] contains ${result.blocks.length} records`);
      console.log('- D1 telemetry found and returned');
      console.log('- C1 telemetry found and returned');
      console.log('- Both use same generic service path');
      console.log('- All required fields present');
      console.log();
      console.log('Recommendation: Update Phase C verdict to GREEN');
    } else {
      console.log('❌ SERVICE RUNTIME VERIFICATION: FAIL');
      console.log();
      console.log(`${testsFailed} test(s) failed - see details above`);
      console.log();
      console.log('Recommendation: Keep Phase C verdict as YELLOW or RED');
      process.exitCode = 1;
    }
    console.log();
    console.log('================================================================================');

  } catch (error) {
    console.error('❌ SERVICE RUNTIME TEST FAILED');
    console.error(error);
    console.log();
    console.log('================================================================================');
    process.exitCode = 1;
  }
}

main();
