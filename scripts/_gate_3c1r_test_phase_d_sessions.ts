/**
 * GATE 3C.1R — PHASE D: SESSION SEMANTICS TESTS
 * 
 * SS: Session-aware visit/revision semantics (6 scenarios)
 * 
 * Critical: Revision requires BOTH new session AND prior completion
 */

import {
  createService,
  createIdentity,
  readBlockState,
  assertEqual,
  uniqueSession,
  uniqueBlockId,
  printSummary,
  KNOWN_NODE_ID,
  KNOWN_SUBTOPIC_ID,
  KNOWN_USER_ID,
  D1_VERSION,
  results,
} from './_gate_3c1r_phase_d_test_utils';

import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';
import { db } from '../packages/db-tutorial/src/db';

const service = createService();
const identity = createIdentity();
const repository = new BlockLearningStateRepository(db);

// ============================================================================
// SS — SESSION SEMANTICS
// ============================================================================

async function testSS1() {
  console.log('\n--- SS-1: NULL → first session ---');
  
  const blockId = uniqueBlockId('ss1');
  const sessionId = uniqueSession('ss1');

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionId
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('SS-1', 'NULL session transitions to supplied session', state?.lastSessionId, sessionId);
  assertEqual('SS-1a', 'First session creates one visit', state?.visitCount, 1);
}

async function testSS2() {
  console.log('\n--- SS-2: A → A (same session deduplication) ---');
  
  const blockId = uniqueBlockId('ss2');
  const sessionId = uniqueSession('ss2');

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionId
  );

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionId
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('SS-2', 'Same session does not increment visits', state?.visitCount, 1);
}

async function testSS3() {
  console.log('\n--- SS-3: A → B (session transition) ---');
  
  const blockId = uniqueBlockId('ss3');
  const sessionA = uniqueSession('ss3-a');
  const sessionB = uniqueSession('ss3-b');

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionA
  );

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionB
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('SS-3', 'Session transition increments visit count', state?.visitCount, 2);
  assertEqual('SS-3a', 'Latest session is persisted', state?.lastSessionId, sessionB);
}

async function testSS4() {
  console.log('\n--- SS-4: New session BEFORE completion (no revision) ---');
  
  const blockId = uniqueBlockId('ss4');

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('ss4-a')
  );

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('ss4-b')
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('SS-4', 'New session before completion does not create revision', state?.revisionCount, 0);
}

async function testSS5() {
  console.log('\n--- SS-5: New session AFTER completion (creates revision) ---');
  
  const blockId = uniqueBlockId('ss5');
  const sessionA = uniqueSession('ss5-a');
  const sessionB = uniqueSession('ss5-b');

  // First visit
  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionA
  );

  // Complete in session A
  await service.recordBlockCompletion(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    null,
    blockId,
    'definition',
    D1_VERSION,
    sessionA
  );

  // Revisit in new session B
  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionB
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual(
    'SS-5',
    'Completed block revisited in new session increments revision',
    state?.revisionCount,
    1
  );
}

async function testSS6() {
  console.log('\n--- SS-6: Same session after completion (no additional revision) ---');
  
  const blockId = uniqueBlockId('ss6');
  const sessionA = uniqueSession('ss6-a');

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionA
  );

  await service.recordBlockCompletion(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    null,
    blockId,
    'definition',
    D1_VERSION,
    sessionA
  );

  // Same session revisits
  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionA
  );

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionA
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('SS-6', 'Same session after completion does not increment revision', state?.revisionCount, 0);
  assertEqual('SS-6a', 'visitCount remains stable for same session', state?.visitCount, 1);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('GATE 3C.1R — PHASE D: SESSION SEMANTICS TESTS');
  console.log('='.repeat(80));

  try {
    await testSS1();
    await testSS2();
    await testSS3();
    await testSS4();
    await testSS5();
    await testSS6();

    printSummary('SESSION SEMANTICS (SS)');
  } catch (error) {
    console.error('\n❌ SESSION TEST SUITE FAILED');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
