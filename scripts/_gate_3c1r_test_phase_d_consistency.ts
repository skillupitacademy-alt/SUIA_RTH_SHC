/**
 * GATE 3C.1R — PHASE D: DATA CONSISTENCY & ISOLATION TESTS
 * 
 * DC: Data consistency and boundary enforcement (7 scenarios)
 * 
 * Tests identity isolation, soft-delete, missing records, brand boundaries
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
  D1_VERSION,
  C1_VERSION,
  results,
} from './_gate_3c1r_phase_d_test_utils';

import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { db } from '../packages/db-tutorial/src/db';
import { eq, and } from 'drizzle-orm';

const service = createService();
const identity = createIdentity();
const repository = new BlockLearningStateRepository(db);

// ============================================================================
// DC — DATA CONSISTENCY
// ============================================================================

async function testDC1() {
  console.log('\n--- DC-1: User isolation ---');
  
  const blockId = uniqueBlockId('dc1');
  const user1Id = KNOWN_USER_ID;
  const user2Id = 'test-user-dc1-' + Date.now();

  const identity1 = createIdentity(user1Id);
  const identity2 = createIdentity(user2Id);

  // User 1 creates telemetry
  await service.recordBlockVisit(
    identity1,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc1-user1')
  );

  // User 2 creates telemetry
  await service.recordBlockVisit(
    identity2,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc1-user2')
  );

  const state1 = await readBlockState(repository, user1Id, KNOWN_NODE_ID, blockId, D1_VERSION);
  const state2 = await readBlockState(repository, user2Id, KNOWN_NODE_ID, blockId, D1_VERSION);

  assertEqual('DC-1', 'User 1 has independent state', state1?.visitCount, 1);
  assertEqual('DC-1a', 'User 2 has independent state', state2?.visitCount, 1);
  assert('DC-1b', 'User 1 userId matches', state1?.userId === user1Id);
  assert('DC-1c', 'User 2 userId matches', state2?.userId === user2Id);
}

async function testDC2() {
  console.log('\n--- DC-2: Navigation node isolation ---');
  
  const blockId = uniqueBlockId('dc2');
  const nodeA = KNOWN_NODE_ID;
  const nodeB = 'test-node-dc2-' + Date.now();

  // Same block on different navigation nodes
  await service.recordBlockVisit(
    identity,
    nodeA,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc2-a')
  );

  await service.recordBlockVisit(
    identity,
    nodeB,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc2-b')
  );

  const stateA = await readBlockState(repository, KNOWN_USER_ID, nodeA, blockId, D1_VERSION);
  const stateB = await readBlockState(repository, KNOWN_USER_ID, nodeB, blockId, D1_VERSION);

  assertEqual('DC-2', 'Node A has independent state', stateA?.visitCount, 1);
  assertEqual('DC-2a', 'Node B has independent state', stateB?.visitCount, 1);
  assertEqual('DC-2b', 'Node A navigationNodeId matches', stateA?.navigationNodeId, nodeA);
  assertEqual('DC-2c', 'Node B navigationNodeId matches', stateB?.navigationNodeId, nodeB);
}

async function testDC3() {
  console.log('\n--- DC-3: Block ID isolation ---');
  
  const blockIdA = uniqueBlockId('dc3-a');
  const blockIdB = uniqueBlockId('dc3-b');

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockIdA,
    D1_VERSION,
    uniqueSession('dc3-a')
  );

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockIdB,
    D1_VERSION,
    uniqueSession('dc3-b')
  );

  const stateA = await readBlockState(repository, KNOWN_USER_ID, KNOWN_NODE_ID, blockIdA, D1_VERSION);
  const stateB = await readBlockState(repository, KNOWN_USER_ID, KNOWN_NODE_ID, blockIdB, D1_VERSION);

  assertEqual('DC-3', 'Block A has independent state', stateA?.visitCount, 1);
  assertEqual('DC-3a', 'Block B has independent state', stateB?.visitCount, 1);
  assertEqual('DC-3b', 'Block A blockId matches', stateA?.blockId, blockIdA);
  assertEqual('DC-3c', 'Block B blockId matches', stateB?.blockId, blockIdB);
}

async function testDC4() {
  console.log('\n--- DC-4: Block version isolation ---');
  
  const blockId = uniqueBlockId('dc4');

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc4-d1')
  );

  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    C1_VERSION,
    uniqueSession('dc4-c1')
  );

  const stateD1 = await readBlockState(repository, KNOWN_USER_ID, KNOWN_NODE_ID, blockId, D1_VERSION);
  const stateC1 = await readBlockState(repository, KNOWN_USER_ID, KNOWN_NODE_ID, blockId, C1_VERSION);

  assertEqual('DC-4', 'D1 version has independent state', stateD1?.visitCount, 1);
  assertEqual('DC-4a', 'C1 version has independent state', stateC1?.visitCount, 1);
  assertEqual('DC-4b', 'D1 blockVersion matches', stateD1?.blockVersion, D1_VERSION);
  assertEqual('DC-4c', 'C1 blockVersion matches', stateC1?.blockVersion, C1_VERSION);
}

async function testDC5() {
  console.log('\n--- DC-5: Soft-delete behavior ---');
  
  const blockId = uniqueBlockId('dc5');
  const sessionId = uniqueSession('dc5');

  // Create a record
  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    sessionId
  );

  // Verify it exists
  const beforeDelete = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assert('DC-5', 'Record exists before soft delete', beforeDelete !== undefined);

  // Soft delete using database (no public repository method)
  await db
    .update(blockLearningState)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(blockLearningState.userId, KNOWN_USER_ID),
        eq(blockLearningState.navigationNodeId, KNOWN_NODE_ID),
        eq(blockLearningState.blockId, blockId),
        eq(blockLearningState.blockVersion, D1_VERSION)
      )
    );

  // Verify repository excludes soft-deleted record
  const afterDelete = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('DC-5a', 'Soft-deleted record excluded from active queries', afterDelete, undefined);

  // Create same identity again (partial unique index allows this)
  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc5-new')
  );

  const afterRecreate = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('DC-5b', 'New active record created after soft delete', afterRecreate?.visitCount, 1);
}

async function testDC6() {
  console.log('\n--- DC-6: Missing record behavior ---');
  
  const blockId = uniqueBlockId('dc6');

  // Query non-existent record
  const beforeCreate = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('DC-6', 'Missing record returns undefined', beforeCreate, undefined);

  // Create record
  await service.recordBlockVisit(
    identity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc6')
  );

  const afterCreate = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('DC-6a', 'Record created successfully', afterCreate?.visitCount, 1);
}

async function testDC7() {
  console.log('\n--- DC-7: Brand/identity boundary ---');
  
  const blockId = uniqueBlockId('dc7');

  // RealTutorialHub user
  const rthIdentity = createIdentity(KNOWN_USER_ID, 'realtutorialhub');

  // SkillUp user (different brand but could theoretically be same UUID in different brand namespace)
  // In practice, user IDs are brand-scoped at identity layer
  const skillupUserId = 'test-user-dc7-skillup-' + Date.now();
  const skillupIdentity = createIdentity(skillupUserId, 'skillup');

  // RTH user creates telemetry
  await service.recordBlockVisit(
    rthIdentity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc7-rth')
  );

  // SkillUp user creates telemetry
  await service.recordBlockVisit(
    skillupIdentity,
    KNOWN_NODE_ID,
    KNOWN_SUBTOPIC_ID,
    blockId,
    D1_VERSION,
    uniqueSession('dc7-skillup')
  );

  const rthState = await readBlockState(
    repository,
    KNOWN_USER_ID,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  const skillupState = await readBlockState(
    repository,
    skillupUserId,
    KNOWN_NODE_ID,
    blockId,
    D1_VERSION
  );

  assertEqual('DC-7', 'RTH user has independent telemetry', rthState?.visitCount, 1);
  assertEqual('DC-7a', 'SkillUp user has independent telemetry', skillupState?.visitCount, 1);
  
  // Brand isolation is enforced via user identity (no brand column in telemetry table)
  assert(
    'DC-7b',
    'Brand isolation enforced through authenticated identity boundary',
    rthState?.userId !== skillupState?.userId
  );
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('GATE 3C.1R — PHASE D: DATA CONSISTENCY & ISOLATION TESTS');
  console.log('='.repeat(80));

  try {
    await testDC1();
    await testDC2();
    await testDC3();
    await testDC4();
    await testDC5();
    await testDC6();
    await testDC7();

    printSummary('DATA CONSISTENCY (DC)');
  } catch (error) {
    console.error('\n❌ DATA CONSISTENCY TEST SUITE FAILED');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
