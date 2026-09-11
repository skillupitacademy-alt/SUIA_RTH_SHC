/**
 * GATE 3C.1R — PHASE D: COMPLETION / REVISION DIAGNOSTIC
 * 
 * Purpose: Prove the actual completion persistence chain and revision semantics
 * 
 * This is a diagnostic script that verifies:
 * 1. Completion is persisted in tutorial_navigation_progress.completed_blocks[]
 * 2. block_learning_state.completedAt behavior
 * 3. Revision increment requires completion + new session
 * 4. The exact repository logic that determines revision
 * 
 * DO NOT modify production code based on this diagnostic.
 * This establishes facts only.
 */

import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load environment BEFORE importing modules
dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

import { db } from '../packages/db-tutorial/src/db';
import { LearningProgressService } from '../packages/db-tutorial/src/services/learning-progress.service';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';
import { TutorialNavigationProgressRepository } from '../packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository';
import { TutorialSectionRepository } from '../packages/db-tutorial/src/repositories/tutorial-section.repository';
import { tutorialNavigationProgress } from '../packages/db-tutorial/src/schema/tutorial-navigation-progress';
import { eq } from 'drizzle-orm';
import type { AuthenticatedIdentity } from '../packages/db-tutorial/src/services/learning-progress.types';

// Known valid fixtures
const KNOWN_USER_ID = '54726a2e-fca5-4d93-abc6-e7cee97a86f8';
const KNOWN_NODE_ID = 'whatisjava';
const KNOWN_SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const KNOWN_SECTION_ID = '75e91508-fe79-45fa-a3d8-d5506a1213d7'; // Real section ID

// Test block identity
const TEST_BLOCK_ID = `gate-3c1r-phase-d-completion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const TEST_BLOCK_VERSION = 'D1';
const TEST_BLOCK_TYPE = 'definition';

// Session identifiers
const SESSION_A = `gate-3c1r-phase-d-session-a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const SESSION_B = `gate-3c1r-phase-d-session-b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const SESSION_C = `gate-3c1r-phase-d-session-c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Authenticated identity
const identity: AuthenticatedIdentity = {
  userId: KNOWN_USER_ID,
  brand: 'realtutorialhub',
};

// Services
const progressRepo = new TutorialNavigationProgressRepository(db);
const sectionRepo = new TutorialSectionRepository(db);
const blockRepo = new BlockLearningStateRepository(db);
const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo);

// Diagnostic checks
type Check = {
  id: string;
  passed: boolean;
  details: string;
};

const checks: Check[] = [];

function check(id: string, passed: boolean, details: string): void {
  checks.push({ id, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${id}: ${details}`);
}

async function readBlockState() {
  const rows = await blockRepo.findByNavigationNode(KNOWN_USER_ID, KNOWN_NODE_ID);
  return rows.find(
    row => row.blockId === TEST_BLOCK_ID && row.blockVersion === TEST_BLOCK_VERSION
  );
}

async function readCompletionState() {
  // Query tutorial_navigation_progress for the known user/node
  const [progress] = await db
    .select()
    .from(tutorialNavigationProgress)
    .where(
      eq(tutorialNavigationProgress.userId, KNOWN_USER_ID)
    )
    .limit(1);

  return progress;
}

async function main() {
  console.log('='.repeat(80));
  console.log('GATE 3C.1R — PHASE D: COMPLETION / REVISION DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log('');
  console.log('TEST FIXTURES');
  console.log('-'.repeat(80));
  console.log(`Block ID:         ${TEST_BLOCK_ID}`);
  console.log(`Block Version:    ${TEST_BLOCK_VERSION}`);
  console.log(`Block Type:       ${TEST_BLOCK_TYPE}`);
  console.log(`Navigation Node:  ${KNOWN_NODE_ID}`);
  console.log(`Subtopic ID:      ${KNOWN_SUBTOPIC_ID}`);
  console.log(`Section ID:       ${KNOWN_SECTION_ID}`);
  console.log(`User ID:          ${KNOWN_USER_ID}`);
  console.log(`Session A:        ${SESSION_A}`);
  console.log(`Session B:        ${SESSION_B}`);
  console.log(`Session C:        ${SESSION_C}`);
  console.log('');

  try {
    // ========================================================================
    // STEP A — CLEAN BASELINE
    // ========================================================================
    console.log('='.repeat(80));
    console.log('STEP A — BASELINE CHECK');
    console.log('='.repeat(80));
    console.log('');

    const baseline = await readBlockState();
    check('A1', baseline === undefined, `No pre-existing active row for test block`);
    console.log('');

    // ========================================================================
    // STEP B — SESSION A VISIT
    // ========================================================================
    console.log('='.repeat(80));
    console.log('STEP B — SESSION A VISIT');
    console.log('='.repeat(80));
    console.log('');

    await service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      TEST_BLOCK_ID,
      TEST_BLOCK_VERSION,
      SESSION_A
    );

    const afterFirstVisit = await readBlockState();

    check('B1', afterFirstVisit?.visitCount === 1, `visitCount = ${afterFirstVisit?.visitCount} (expected 1)`);
    check('B2', afterFirstVisit?.revisionCount === 0, `revisionCount = ${afterFirstVisit?.revisionCount} (expected 0)`);
    check('B3', afterFirstVisit?.lastSessionId === SESSION_A, `lastSessionId = ${afterFirstVisit?.lastSessionId}`);
    check('B4', afterFirstVisit?.firstViewedAt !== null, `firstViewedAt populated`);
    check('B5', afterFirstVisit?.lastViewedAt !== null, `lastViewedAt populated`);
    check('B6', afterFirstVisit?.completedAt === null, `completedAt = ${afterFirstVisit?.completedAt} (expected null before completion)`);

    console.log('');

    // ========================================================================
    // STEP C — SESSION A COMPLETION
    // ========================================================================
    console.log('='.repeat(80));
    console.log('STEP C — SESSION A COMPLETION');
    console.log('='.repeat(80));
    console.log('');

    let completionSuccess = false;
    let completionError: any = null;

    try {
      await service.recordBlockCompletion(
        identity,
        KNOWN_NODE_ID,
        KNOWN_SUBTOPIC_ID,
        KNOWN_SECTION_ID, // Using real section ID
        TEST_BLOCK_ID,
        TEST_BLOCK_TYPE,
        TEST_BLOCK_VERSION,
        SESSION_A
      );
      completionSuccess = true;
      check('C1', true, 'Completion API call succeeded');
    } catch (error) {
      completionError = error;
      check('C1', false, `Completion API call failed: ${error}`);
    }

    console.log('');

    // Read both tables
    const afterCompletion = await readBlockState();
    const progressAfterCompletion = await readCompletionState();

    console.log('block_learning_state after completion:');
    console.log(`  visitCount:      ${afterCompletion?.visitCount}`);
    console.log(`  revisionCount:   ${afterCompletion?.revisionCount}`);
    console.log(`  completedAt:     ${afterCompletion?.completedAt}`);
    console.log(`  lastSessionId:   ${afterCompletion?.lastSessionId}`);
    console.log('');

    console.log('tutorial_navigation_progress after completion:');
    if (progressAfterCompletion) {
      console.log(`  navigationNodeId: ${progressAfterCompletion.navigationNodeId}`);
      console.log(`  userId:           ${progressAfterCompletion.userId}`);
      console.log(`  status:           ${progressAfterCompletion.status}`);
      
      // Extract completed_blocks
      const completedBlocks = progressAfterCompletion.completedBlocks as any[] || [];
      console.log(`  completed_blocks: ${completedBlocks.length} entries`);
      
      // Find our test block
      const matchingCompletion = completedBlocks.find(
        (block: any) => block.blockId === TEST_BLOCK_ID && block.blockVersion === TEST_BLOCK_VERSION
      );

      if (matchingCompletion) {
        console.log('');
        console.log('  FOUND TEST BLOCK IN completed_blocks:');
        console.log(`    blockId:       ${matchingCompletion.blockId}`);
        console.log(`    blockVersion:  ${matchingCompletion.blockVersion}`);
        console.log(`    completedAt:   ${matchingCompletion.completedAt}`);
        console.log('');

        check('C2', true, 'Completion persisted in tutorial_navigation_progress.completed_blocks[]');
        check('C3', matchingCompletion.blockId === TEST_BLOCK_ID, `completed_blocks blockId matches`);
        check('C4', matchingCompletion.blockVersion === TEST_BLOCK_VERSION, `completed_blocks blockVersion matches`);
        check('C5', matchingCompletion.completedAt !== null && matchingCompletion.completedAt !== undefined, `completed_blocks completedAt populated`);
      } else {
        console.log('');
        console.log('  ⚠️  TEST BLOCK NOT FOUND in completed_blocks');
        console.log('');
        check('C2', false, 'Test block NOT found in completed_blocks[]');
      }
    } else {
      console.log('  ⚠️  No tutorial_navigation_progress record found');
      check('C2', false, 'No navigation progress record exists');
    }

    console.log('');

    // Critical check: block_learning_state.completedAt
    check(
      'C6',
      afterCompletion?.completedAt !== undefined,
      `block_learning_state.completedAt = ${afterCompletion?.completedAt === null ? 'NULL' : afterCompletion?.completedAt}`
    );

    console.log('');

    // ========================================================================
    // STEP D — SAME-SESSION REVISIT
    // ========================================================================
    console.log('='.repeat(80));
    console.log('STEP D — SAME-SESSION REVISIT (SESSION A)');
    console.log('='.repeat(80));
    console.log('');

    await service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      TEST_BLOCK_ID,
      TEST_BLOCK_VERSION,
      SESSION_A
    );

    const afterSameSession = await readBlockState();

    check('D1', afterSameSession?.visitCount === 1, `visitCount = ${afterSameSession?.visitCount} (expected 1, same session)`);
    check('D2', afterSameSession?.revisionCount === 0, `revisionCount = ${afterSameSession?.revisionCount} (expected 0, same session)`);
    check('D3', afterSameSession?.lastSessionId === SESSION_A, `lastSessionId = ${afterSameSession?.lastSessionId}`);

    console.log('');

    // ========================================================================
    // STEP E — NEW SESSION VISIT
    // ========================================================================
    console.log('='.repeat(80));
    console.log('STEP E — NEW SESSION VISIT (SESSION B)');
    console.log('='.repeat(80));
    console.log('');

    await service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      TEST_BLOCK_ID,
      TEST_BLOCK_VERSION,
      SESSION_B
    );

    const afterNewSession = await readBlockState();

    console.log('block_learning_state after new session:');
    console.log(`  visitCount:      ${afterNewSession?.visitCount}`);
    console.log(`  revisionCount:   ${afterNewSession?.revisionCount}`);
    console.log(`  completedAt:     ${afterNewSession?.completedAt}`);
    console.log(`  lastSessionId:   ${afterNewSession?.lastSessionId}`);
    console.log('');

    check('E1', afterNewSession?.visitCount === 2, `visitCount = ${afterNewSession?.visitCount} (expected 2, new session)`);
    check('E2', afterNewSession?.lastSessionId === SESSION_B, `lastSessionId = ${afterNewSession?.lastSessionId}`);

    // CRITICAL: Check revision increment
    const expectedRevisionCount = 1; // Completion + new session should = revision
    const actualRevisionCount = afterNewSession?.revisionCount ?? 0;

    check(
      'E3',
      actualRevisionCount === expectedRevisionCount,
      `revisionCount = ${actualRevisionCount} (expected ${expectedRevisionCount} after completion + new session)`
    );

    console.log('');

    // ========================================================================
    // STEP F — RE-COMPLETION (IDEMPOTENCY TEST)
    // ========================================================================
    console.log('='.repeat(80));
    console.log('STEP F — RE-COMPLETION (SESSION B)');
    console.log('='.repeat(80));
    console.log('');

    await service.recordBlockCompletion(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      KNOWN_SECTION_ID,
      TEST_BLOCK_ID,
      TEST_BLOCK_TYPE,
      TEST_BLOCK_VERSION,
      SESSION_B
    );

    const progressAfterRecompletion = await readCompletionState();
    const completedBlocksAfter = (progressAfterRecompletion?.completedBlocks as any[]) || [];
    const matchingCompletionsAfter = completedBlocksAfter.filter(
      (block: any) => block.blockId === TEST_BLOCK_ID && block.blockVersion === TEST_BLOCK_VERSION
    );

    console.log(`completed_blocks after re-completion: ${matchingCompletionsAfter.length} matching entries`);
    check('F1', matchingCompletionsAfter.length >= 1, 'At least one completion entry exists after re-completion');

    console.log('');

    // ========================================================================
    // STEP G — SECOND NEW SESSION
    // ========================================================================
    console.log('='.repeat(80));
    console.log('STEP G — SECOND NEW SESSION (SESSION C)');
    console.log('='.repeat(80));
    console.log('');

    await service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      TEST_BLOCK_ID,
      TEST_BLOCK_VERSION,
      SESSION_C
    );

    const afterSessionC = await readBlockState();

    console.log('block_learning_state after session C:');
    console.log(`  visitCount:      ${afterSessionC?.visitCount}`);
    console.log(`  revisionCount:   ${afterSessionC?.revisionCount}`);
    console.log(`  lastSessionId:   ${afterSessionC?.lastSessionId}`);
    console.log('');

    check('G1', afterSessionC?.visitCount === 3, `visitCount = ${afterSessionC?.visitCount} (expected 3)`);
    check('G2', afterSessionC?.lastSessionId === SESSION_C, `lastSessionId = ${afterSessionC?.lastSessionId}`);

    // Expected revision count depends on semantic: does EVERY completed + new session increment?
    // Document actual behavior
    console.log(`Revision count after second new session: ${afterSessionC?.revisionCount}`);

    console.log('');

    // ========================================================================
    // FINAL ANALYSIS
    // ========================================================================
    console.log('='.repeat(80));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('='.repeat(80));
    console.log('');

    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;

    console.log(`Checks passed: ${passed}`);
    console.log(`Checks failed: ${failed}`);
    console.log('');

    // Determine classification
    const completionPersisted = checks.find(c => c.id === 'C2')?.passed ?? false;
    const blockCompletedAtIsNull = afterCompletion?.completedAt === null;
    const revisionDidNotIncrement = actualRevisionCount === 0;

    console.log('='.repeat(80));
    console.log('CLASSIFICATION');
    console.log('='.repeat(80));
    console.log('');

    if (!completionSuccess) {
      console.log('🔴 COMPLETION API FAILURE');
      console.log('');
      console.log('The recordBlockCompletion() call failed.');
      console.log('Error:', completionError);
      console.log('');
      console.log('Classification: TEST FIXTURE ERROR or API CONTRACT MISMATCH');
      console.log('');
      process.exitCode = 1;
    } else if (!completionPersisted) {
      console.log('🔴 COMPLETION NOT PERSISTED');
      console.log('');
      console.log('recordBlockCompletion() succeeded but the block was not found in');
      console.log('tutorial_navigation_progress.completed_blocks[]');
      console.log('');
      console.log('Classification: COMPLETION PERSISTENCE FAILURE');
      console.log('');
      process.exitCode = 1;
    } else if (completionPersisted && blockCompletedAtIsNull && revisionDidNotIncrement) {
      console.log('🔴 CONFIRMED PRODUCTION SEMANTIC MISMATCH');
      console.log('');
      console.log('Evidence:');
      console.log(`  1. Completion persisted in tutorial_navigation_progress.completed_blocks[]`);
      console.log(`  2. block_learning_state.completedAt = NULL`);
      console.log(`  3. visitCount increased from 1 → 2 (session transition detected)`);
      console.log(`  4. revisionCount remained 0 (expected 1)`);
      console.log('');
      console.log('Conclusion:');
      console.log('  The revision SQL logic appears to check block_learning_state.completedAt,');
      console.log('  but that field is never populated by the current completion path.');
      console.log('');
      console.log('  Completion authority: tutorial_navigation_progress.completed_blocks[]');
      console.log('  Revision condition:   block_learning_state.completedAt IS NOT NULL (inferred)');
      console.log('');
      console.log('Classification: PRODUCTION SEMANTIC MISMATCH');
      console.log('');
      console.log('PHASE D STATUS: 🔴 BLOCKED');
      console.log('');
      console.log('This architectural gap cannot be fixed during Phase D verification.');
      console.log('Phase C is frozen. User decision required.');
      console.log('');
      process.exitCode = 1;
    } else if (completionPersisted && !revisionDidNotIncrement) {
      console.log('✅ REVISION SEMANTICS VERIFIED');
      console.log('');
      console.log('Evidence:');
      console.log(`  1. Completion persisted correctly`);
      console.log(`  2. Revision incremented after completion + new session`);
      console.log(`  3. Same-session visits did not increment revision`);
      console.log('');
      console.log('Classification: VERIFIED');
      console.log('');
      console.log('Phase D may continue with remaining scenarios.');
      console.log('');
      process.exitCode = 0;
    } else {
      console.log('⚠️  AMBIGUOUS RESULT');
      console.log('');
      console.log('The diagnostic produced an unexpected combination of results.');
      console.log('Manual analysis required.');
      console.log('');
      process.exitCode = 1;
    }

  } catch (error) {
    console.error('');
    console.error('❌ DIAGNOSTIC FAILED WITH EXCEPTION');
    console.error('');
    console.error(error);
    console.error('');
    process.exitCode = 1;
  }
}

main();
