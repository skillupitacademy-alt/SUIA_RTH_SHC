import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { db } from '../packages/db-tutorial/src/db';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { eq, and } from 'drizzle-orm';

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_NODE_ID = 'test-node-integration';
const TEST_BLOCK_ID = 'test-block-integration';
const TEST_BLOCK_VERSION = 'D1';

(async () => {
  try {
    console.log('=== BEFORE CLEANUP ===');
    console.log('Searching for test identity records...');
    console.log(`  userId: ${TEST_USER_ID}`);
    console.log(`  navigationNodeId: ${TEST_NODE_ID}`);
    console.log(`  blockId: ${TEST_BLOCK_ID}`);
    console.log(`  blockVersion: ${TEST_BLOCK_VERSION}`);
    console.log('');
    
    // Find all records (active and soft-deleted)
    const allRecords = await db
      .select()
      .from(blockLearningState)
      .where(
        and(
          eq(blockLearningState.userId, TEST_USER_ID),
          eq(blockLearningState.navigationNodeId, TEST_NODE_ID),
          eq(blockLearningState.blockId, TEST_BLOCK_ID),
          eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
        )
      );
    
    console.log(`Total records found: ${allRecords.length}`);
    
    if (allRecords.length > 0) {
      console.log('\nRecord details:');
      allRecords.forEach((record, idx) => {
        console.log(`\n  Record ${idx + 1}:`);
        console.log(`    id: ${record.id}`);
        console.log(`    visitCount: ${record.visitCount}`);
        console.log(`    revisionCount: ${record.revisionCount}`);
        console.log(`    activeTimeSec: ${record.activeTimeSec}`);
        console.log(`    lastSessionId: ${record.lastSessionId}`);
        console.log(`    firstViewedAt: ${record.firstViewedAt}`);
        console.log(`    deletedAt: ${record.deletedAt}`);
      });
      
      // Hard delete all test records
      console.log('\n=== CLEANUP ===');
      console.log('Hard-deleting test records...');
      
      const deleted = await db
        .delete(blockLearningState)
        .where(
          and(
            eq(blockLearningState.userId, TEST_USER_ID),
            eq(blockLearningState.navigationNodeId, TEST_NODE_ID),
            eq(blockLearningState.blockId, TEST_BLOCK_ID),
            eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
          )
        )
        .returning();
      
      console.log(`Records deleted: ${deleted.length}`);
    } else {
      console.log('\nNo test records found - already clean.');
    }
    
    // Verify cleanup
    console.log('\n=== AFTER CLEANUP ===');
    const remainingRecords = await db
      .select()
      .from(blockLearningState)
      .where(
        and(
          eq(blockLearningState.userId, TEST_USER_ID),
          eq(blockLearningState.navigationNodeId, TEST_NODE_ID),
          eq(blockLearningState.blockId, TEST_BLOCK_ID),
          eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
        )
      );
    
    console.log(`Remaining records: ${remainingRecords.length}`);
    
    if (remainingRecords.length === 0) {
      console.log('\n✅ TEST IDENTITY CLEAN');
      console.log('✅ Ready for human runtime verification');
    } else {
      console.log('\n⚠️ WARNING: Cleanup incomplete - records still exist');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
})();
