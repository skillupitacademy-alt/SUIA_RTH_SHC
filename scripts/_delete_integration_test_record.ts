import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { db } from '../packages/db-tutorial/src/db';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { and, eq, isNull } from 'drizzle-orm';

// Integration test identity (from block-learning-state.integration.test.ts)
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_NAVIGATION_NODE_ID = 'test-node-integration';
const TEST_BLOCK_ID = 'test-block-integration';
const TEST_BLOCK_VERSION = 'D1';

async function main() {
  console.log('=== DELETE INTEGRATION TEST CONTAMINATED RECORD ===\n');

  console.log('Target (from integration test):');
  console.log(`  userId: ${TEST_USER_ID}`);
  console.log(`  navigationNodeId: ${TEST_NAVIGATION_NODE_ID}`);
  console.log(`  blockId: ${TEST_BLOCK_ID}`);
  console.log(`  blockVersion: ${TEST_BLOCK_VERSION}`);
  console.log('');

  const existing = await db
    .select()
    .from(blockLearningState)
    .where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.navigationNodeId, TEST_NAVIGATION_NODE_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION),
        isNull(blockLearningState.deletedAt),
      ),
    );

  console.log(`Active records found: ${existing.length}`);

  if (existing.length === 0) {
    console.log('\n✅ No contaminated record found — tests ready to run');
    process.exit(0);
  }

  for (const record of existing) {
    console.log('');
    console.log(`Contaminated record: ${record.id}`);
    console.log(`  visitCount: ${record.visitCount}`);
    console.log(`  revisionCount: ${record.revisionCount}`);
    console.log(`  activeTimeSec: ${record.activeTimeSec}`);
    console.log(`  lastSessionId: ${record.lastSessionId}`);
    console.log(`  firstViewedAt: ${record.firstViewedAt}`);
    console.log(`  createdAt: ${record.createdAt}`);
    console.log('');
    console.log('⚠️ This record is preventing integration tests from passing');
    console.log('   Tests expect fresh INSERT path, but row already exists');
  }

  const deleted = await db
    .delete(blockLearningState)
    .where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.navigationNodeId, TEST_NAVIGATION_NODE_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION),
        isNull(blockLearningState.deletedAt),
      ),
    )
    .returning();

  console.log(`Deleted records: ${deleted.length}`);

  if (deleted.length === existing.length) {
    console.log('✅ CONTAMINATED RECORD DELETED');
  } else {
    console.error('❌ DELETE COUNT MISMATCH');
    process.exit(1);
  }

  // Verify cleanup
  const remaining = await db
    .select()
    .from(blockLearningState)
    .where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.navigationNodeId, TEST_NAVIGATION_NODE_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION),
        isNull(blockLearningState.deletedAt),
      ),
    );

  console.log(`Remaining active records: ${remaining.length}`);

  if (remaining.length === 0) {
    console.log('✅ DATABASE CLEAN — INTEGRATION TESTS READY');
    console.log('');
    console.log('Next step:');
    console.log('  cd packages/db-tutorial');
    console.log('  pnpm test block-learning-state.integration.test.ts');
  } else {
    console.error('❌ RECORD STILL EXISTS');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Cleanup failed:');
  console.error(error);
  process.exit(1);
});
