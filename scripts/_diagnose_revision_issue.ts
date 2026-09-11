/**
 * Diagnostic: Check revision increment behavior
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

import { db } from '../packages/db-tutorial/src/db';
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { like, and, isNull } from 'drizzle-orm';

async function main() {
  // Find recent le7 test blocks
  const results = await db
    .select()
    .from(blockLearningState)
    .where(and(like(blockLearningState.blockId, '%le7%'), isNull(blockLearningState.deletedAt)))
    .limit(10);

  console.log('Recent LE-7 test blocks:');
  console.log('');

  for (const result of results) {
    console.log(`Block: ${result.blockId}`);
    console.log(`  visitCount: ${result.visitCount}`);
    console.log(`  revisionCount: ${result.revisionCount}`);
    console.log(`  completedAt: ${result.completedAt}`);
    console.log(`  lastSessionId: ${result.lastSessionId}`);
    console.log('');
  }

  if (results.length === 0) {
    console.log('No LE-7 blocks found');
  }
}

main();
