import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { db } from '../packages/db-tutorial/src/db';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { and, eq, isNull } from 'drizzle-orm';

// RTH test user (ajayshah@gmail.com)
const USER_ID = '54726a2e-fca5-4d93-abc6-e7cee97a86f8';
const NAVIGATION_NODE_ID = 'whatisjava';
const BLOCK_ID = '79ae6e0f-0374-4dfe-8d76-cefbe42f8996';
const BLOCK_VERSION = 'D1';

async function main() {
  console.log('=== DELETE RTH BLOCK VISIT TEST RECORD ===\n');

  console.log('RTH Test User: ajayshah@gmail.com');
  console.log('Target:');
  console.log(`  userId: ${USER_ID}`);
  console.log(`  navigationNodeId: ${NAVIGATION_NODE_ID}`);
  console.log(`  blockId: ${BLOCK_ID}`);
  console.log(`  blockVersion: ${BLOCK_VERSION}`);
  console.log('');

  const existing = await db
    .select()
    .from(blockLearningState)
    .where(
      and(
        eq(blockLearningState.userId, USER_ID),
        eq(blockLearningState.navigationNodeId, NAVIGATION_NODE_ID),
        eq(blockLearningState.blockId, BLOCK_ID),
        eq(blockLearningState.blockVersion, BLOCK_VERSION),
        isNull(blockLearningState.deletedAt),
      ),
    );

  console.log(`Active records found: ${existing.length}`);

  for (const record of existing) {
    console.log('');
    console.log(`Deleting record: ${record.id}`);
    console.log(`  visitCount: ${record.visitCount}`);
    console.log(`  activeTimeSec: ${record.activeTimeSec}`);
    console.log(`  lastSessionId: ${record.lastSessionId}`);
    console.log(`  firstViewedAt: ${record.firstViewedAt}`);
  }

  if (existing.length === 0) {
    console.log('\nNothing to delete.');
    process.exit(0);
  }

  const deleted = await db
    .delete(blockLearningState)
    .where(
      and(
        eq(blockLearningState.userId, USER_ID),
        eq(blockLearningState.navigationNodeId, NAVIGATION_NODE_ID),
        eq(blockLearningState.blockId, BLOCK_ID),
        eq(blockLearningState.blockVersion, BLOCK_VERSION),
        isNull(blockLearningState.deletedAt),
      ),
    )
    .returning();

  console.log(`\nDeleted records: ${deleted.length}`);

  if (deleted.length === existing.length) {
    console.log('✅ DELETE SUCCESSFUL');
  } else {
    console.error('❌ DELETE COUNT MISMATCH');
    process.exit(1);
  }

  // Verify
  const remaining = await db
    .select()
    .from(blockLearningState)
    .where(
      and(
        eq(blockLearningState.userId, USER_ID),
        eq(blockLearningState.navigationNodeId, NAVIGATION_NODE_ID),
        eq(blockLearningState.blockId, BLOCK_ID),
        eq(blockLearningState.blockVersion, BLOCK_VERSION),
        isNull(blockLearningState.deletedAt),
      ),
    );

  console.log(`Remaining active records: ${remaining.length}`);

  if (remaining.length === 0) {
    console.log('✅ DATABASE IS CLEAN — READY FOR FRESH INSERT TEST');
  } else {
    console.error('❌ RECORD STILL EXISTS');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Delete failed:');
  console.error(error);
  process.exit(1);
});
