import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { db } from '../packages/db-tutorial/src/db';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { eq, and, isNull } from 'drizzle-orm';

// RTH test user (ajayshah@gmail.com)
const RTH_USER_ID = '54726a2e-fca5-4d93-abc6-e7cee97a86f8';
const NAVIGATION_NODE_ID = 'whatisjava';
const BLOCK_ID = '79ae6e0f-0374-4dfe-8d76-cefbe42f8996';
const BLOCK_VERSION = 'D1';

(async () => {
  try {
    console.log('=== RTH BLOCK VISIT VERIFICATION ===\n');
    console.log('RTH Test User: ajayshah@gmail.com');
    console.log('Searching for block visit record:');
    console.log(`  userId: ${RTH_USER_ID}`);
    console.log(`  navigationNodeId: ${NAVIGATION_NODE_ID}`);
    console.log(`  blockId: ${BLOCK_ID}`);
    console.log(`  blockVersion: ${BLOCK_VERSION}`);
    console.log('');
    
    // Find the specific block visit record
    const records = await db
      .select()
      .from(blockLearningState)
      .where(
        and(
          eq(blockLearningState.userId, RTH_USER_ID),
          eq(blockLearningState.navigationNodeId, NAVIGATION_NODE_ID),
          eq(blockLearningState.blockId, BLOCK_ID),
          eq(blockLearningState.blockVersion, BLOCK_VERSION),
          isNull(blockLearningState.deletedAt)
        )
      );
    
    if (records.length === 0) {
      console.log('❌ NO RECORD FOUND');
      console.log('Expected: Row created by browser visit');
      console.log('Actual: No active record exists');
      process.exit(1);
    }
    
    if (records.length > 1) {
      console.log(`⚠️ MULTIPLE RECORDS FOUND: ${records.length}`);
      console.log('Expected: Single record per block identity');
    }
    
    const record = records[0];
    
    console.log('✅ RECORD FOUND\n');
    console.log('=== DATABASE STATE ===');
    console.log(`ID: ${record.id}`);
    console.log(`User ID: ${record.userId}`);
    console.log(`Navigation Node: ${record.navigationNodeId}`);
    console.log(`Block ID: ${record.blockId}`);
    console.log(`Block Version: ${record.blockVersion}`);
    console.log('');
    console.log('=== METRICS ===');
    console.log(`Visit Count: ${record.visitCount}`);
    console.log(`Revision Count: ${record.revisionCount}`);
    console.log(`Active Time (sec): ${record.activeTimeSec}`);
    console.log(`Expected Time (sec): ${record.expectedTimeSec}`);
    console.log('');
    console.log('=== SESSION TRACKING (Phase 4.6) ===');
    console.log(`Last Session ID: ${record.lastSessionId}`);
    console.log('');
    console.log('=== TIMESTAMPS ===');
    console.log(`First Viewed At: ${record.firstViewedAt}`);
    console.log(`Last Viewed At: ${record.lastViewedAt}`);
    console.log(`Completed At: ${record.completedAt}`);
    console.log('');
    console.log('=== AUDIT ===');
    console.log(`Version: ${record.version}`);
    console.log(`Created At: ${record.createdAt}`);
    console.log(`Updated At: ${record.updatedAt}`);
    console.log(`Deleted At: ${record.deletedAt}`);
    console.log('');
    
    // Verification checks
    console.log('=== VERIFICATION CHECKS ===');
    
    const checks = {
      rowCreated: records.length > 0,
      visitCountValid: record.visitCount >= 0,
      activeTimeAccumulated: record.activeTimeSec > 0,
      lastSessionIdPopulated: record.lastSessionId !== null,
      firstViewedAtPopulated: record.firstViewedAt !== null,
      lastViewedAtPopulated: record.lastViewedAt !== null,
      notDeleted: record.deletedAt === null,
    };
    
    console.log(`Row Created: ${checks.rowCreated ? '✅' : '❌'}`);
    console.log(`Visit Count Valid (>= 0): ${checks.visitCountValid ? '✅' : '❌'} (actual: ${record.visitCount})`);
    console.log(`Active Time Accumulated (> 0): ${checks.activeTimeAccumulated ? '✅' : '❌'} (actual: ${record.activeTimeSec}s)`);
    console.log(`Last Session ID Populated: ${checks.lastSessionIdPopulated ? '✅' : '❌'}`);
    console.log(`First Viewed At Populated: ${checks.firstViewedAtPopulated ? '✅' : '❌'}`);
    console.log(`Last Viewed At Populated: ${checks.lastViewedAtPopulated ? '✅' : '❌'}`);
    console.log(`Not Soft-Deleted: ${checks.notDeleted ? '✅' : '❌'}`);
    
    const allPassed = Object.values(checks).every(v => v === true);
    
    console.log('');
    if (allPassed) {
      console.log('✅ ALL VERIFICATION CHECKS PASSED');
    } else {
      console.log('⚠️ SOME VERIFICATION CHECKS FAILED');
    }
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error querying database:', error);
    process.exit(1);
  }
})();
