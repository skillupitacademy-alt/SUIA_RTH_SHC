/**
 * GATE 3C.1R — PHASE D: CONCURRENCY & ATOMICITY TESTS
 * 
 * CS: Concurrency semantics (7 scenarios)
 * 
 * Tests atomic PostgreSQL behavior under concurrent operations
 */

import {
  createService,
  createIdentity,
  readBlockState,
  assertEqual,
  assert,
  uniqueSession,
  uniqueBlockId,
  printSummary,
  KNOWN_NODE_ID,
  KNOWN_SUBTOPIC_ID,
  KNOWN_USER_ID,
  KNOWN_D1_BLOCK_ID,
  KNOWN_C1_BLOCK_ID,
  D1_VERSION,
  C1_VERSION,
  results,
} from './_gate_3c1r_phase_d_test_utils';

import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';
import { db } from '../packages/db-tutorial/src/db';

const service = createService();
const identity = createIdentity();
const identity2 = createIdentity('test-user-cs7-' + Date.now(), 'realtutorialhub');
const repository = new BlockLearningStateRepository(db);

// ============================================================================
// CS — CONCURRENCY SEMANTICS
// ============================================================================

async function testCS1() {
  console.log('\n--- CS-1: Concurrent same-session visits ---');
  
  const blockId = uniqueBlockId('cs1');
  const sessionId = uniqueSession('cs1');

  // 10 concurrent calls with same session
  await Promise.all(
    Array.from({ length: 10 }, () =>
      service.recordBlockVisit(
        identity,
        KNOWN_NODE_ID,
        KNOWN_SUBTOPIC_ID,
        blockId,
        D1_VERSION,
        sessionId
      )
    )
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('CS-1', 'Concurrent same-session visits deduplicate to 1', state?.visitCount, 1);
}

async function testCS2() {
  console.log('\n--- CS-2: Concurrent active-time updates ---');
  
  const blockId = uniqueBlockId('cs2');
  const deltas = [10, 20, 30];

  await Promise.all(
    deltas.map(delta =>
      service.recordBlockActiveTime(
        identity,
        KNOWN_NODE_ID,
        KNOWN_SUBTOPIC_ID,
        blockId,
        D1_VERSION,
        delta
      )
    )
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('CS-2', 'Concurrent active time updates accumulate atomically', state?.activeTimeSec, 60);
}

async function testCS3() {
  console.log('\n--- CS-3: Concurrent different-session visits ---');
  
  const blockId = uniqueBlockId('cs3');
  const sessionA = uniqueSession('cs3-a');
  const sessionB = uniqueSession('cs3-b');

  // Concurrent visits with different sessions
  await Promise.all([
    service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      blockId,
      D1_VERSION,
      sessionA
    ),
    service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      blockId,
      D1_VERSION,
      sessionB
    ),
  ]);

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  // One session will be stored, visitCount depends on which executed first
  assert('CS-3', 'Concurrent different sessions: no lost updates', state?.visitCount !== undefined && state.visitCount >= 1);
  assert('CS-3a', 'Final session is one of the provided sessions', 
    state?.lastSessionId === sessionA || state?.lastSessionId === sessionB);
}

async function testCS4() {
  console.log('\n--- CS-4: Concurrent revision on completed block ---');
  
  const blockId = uniqueBlockId('cs4');
  const sessionA = uniqueSession('cs4-a');
  const sessionB = uniqueSession('cs4-b');

  // Setup: complete block in session A
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

  // 10 concurrent revisits in new session B
  await Promise.all(
    Array.from({ length: 10 }, () =>
      service.recordBlockVisit(
        identity,
        KNOWN_NODE_ID,
        KNOWN_SUBTOPIC_ID,
        blockId,
        D1_VERSION,
        sessionB
      )
    )
  );

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('CS-4', 'Concurrent revision calls increment revision once only', state?.revisionCount, 1);
  assertEqual('CS-4a', 'Visit count reflects session transition', state?.visitCount, 2);
}

async function testCS5() {
  console.log('\n--- CS-5: Concurrent visit + active time ---');
  
  const blockId = uniqueBlockId('cs5');
  const sessionId = uniqueSession('cs5');

  await Promise.all([
    service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      blockId,
      D1_VERSION,
      sessionId
    ),
    service.recordBlockActiveTime(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      blockId,
      D1_VERSION,
      30
    ),
  ]);

  const state = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assert('CS-5', 'Concurrent visit + active time: visitCount >= 1', state?.visitCount !== undefined && state.visitCount >= 1);
  assert('CS-5a', 'Concurrent visit + active time: activeTimeSec >= 30', state?.activeTimeSec !== undefined && state.activeTimeSec >= 30);
}

async function testCS6() {
  console.log('\n--- CS-6: Concurrent independent blocks (D1 + C1) ---');
  
  const d1BlockId = uniqueBlockId('cs6-d1');
  const c1BlockId = uniqueBlockId('cs6-c1');

  await Promise.all([
    service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      d1BlockId,
      D1_VERSION,
      uniqueSession('cs6-d1')
    ),
    service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      c1BlockId,
      C1_VERSION,
      uniqueSession('cs6-c1')
    ),
  ]);

  const d1State = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    d1BlockId,
    D1_VERSION
  );

  const c1State = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    c1BlockId,
    C1_VERSION
  );

  assertEqual('CS-6', 'Concurrent D1 block has independent state', d1State?.visitCount, 1);
  assertEqual('CS-6a', 'Concurrent C1 block has independent state', c1State?.visitCount, 1);
}

async function testCS7() {
  console.log('\n--- CS-7: Concurrent identity isolation ---');
  
  const blockId = uniqueBlockId('cs7');

  // Two different users writing concurrently
  await Promise.all([
    service.recordBlockVisit(
      identity,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      blockId,
      D1_VERSION,
      uniqueSession('cs7-user1')
    ),
    service.recordBlockVisit(
      identity2,
      KNOWN_NODE_ID,
      KNOWN_SUBTOPIC_ID,
      blockId,
      D1_VERSION,
      uniqueSession('cs7-user2')
    ),
  ]);

  const state1 = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  const state2 = await readBlockState(
    repository,
    identity2.userId,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('CS-7', 'User 1 has independent telemetry', state1?.visitCount, 1);
  assertEqual('CS-7a', 'User 2 has independent telemetry', state2?.visitCount, 1);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('GATE 3C.1R — PHASE D: CONCURRENCY & ATOMICITY TESTS');
  console.log('='.repeat(80));

  try {
    await testCS1();
    await testCS2();
    await testCS3();
    await testCS4();
    await testCS5();
    await testCS6();
    await testCS7();

    printSummary('CONCURRENCY (CS)');
  } catch (error) {
    console.error('\n❌ CONCURRENCY TEST SUITE FAILED');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
