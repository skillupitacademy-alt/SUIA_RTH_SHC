import { config } from 'dotenv';
config({ path: '.env.local' });

// Import Drizzle
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Import schema
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';
import { sql } from 'drizzle-orm';

// Helper to build atomic increment (from repository)
function buildAtomicTimeIncrement(column: any, increment: number) {
  return sql`${column} + ${increment}`;
}

function buildAtomicVersionIncrement(column: any) {
  return sql`${column} + 1`;
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  webSocketConstructor: ws as any
});

const db = drizzle(pool);

console.log('=== DRIZZLE ORM GENERATED SQL TEST ===\n');
console.log('Drizzle ORM Version: 0.45.1');
console.log('PostgreSQL Version: 17.11\n');

const testUserId = '00000000-0000-0000-0000-000000000002';
const testNavNodeId = 'test-drizzle-sql';
const testBlockId = 'test-drizzle-block-456';
const testBlockVersion = 'DRIZZLE';

(async () => {
  try {
    console.log('1. Building Drizzle query (same as BlockLearningStateRepository.upsert)\n');
    const now = new Date();

    // VARIANT A: Current implementation using deprecated `where`
    console.log('=== VARIANT A: Using deprecated `where` parameter ===\n');
    const queryA = db
      .insert(blockLearningState)
      .values({
        userId: testUserId,
        navigationNodeId: testNavNodeId,
        blockId: testBlockId,
        blockVersion: testBlockVersion,
        expectedTimeSec: null,
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 0,
        firstViewedAt: now,
        lastViewedAt: now,
        completedAt: null,
        version: 1,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: [
          blockLearningState.userId,
          blockLearningState.navigationNodeId,
          blockLearningState.blockId,
          blockLearningState.blockVersion,
        ],
        where: sql`${blockLearningState.deletedAt} IS NULL`, // DEPRECATED!
        set: {
          visitCount: buildAtomicTimeIncrement(blockLearningState.visitCount, 1),
          revisionCount: blockLearningState.revisionCount,
          activeTimeSec: blockLearningState.activeTimeSec,
          expectedTimeSec: blockLearningState.expectedTimeSec,
          firstViewedAt: blockLearningState.firstViewedAt,
          lastViewedAt: now,
          completedAt: blockLearningState.completedAt,
          version: buildAtomicVersionIncrement(blockLearningState.version),
          updatedAt: now,
        },
      })
      .returning();

    const sqlDataA = queryA.toSQL();
    console.log('Generated SQL:\n');
    console.log(sqlDataA.sql);
    console.log('\nParameters:', sqlDataA.params.length, 'params');

    // Check WHERE position
    const sqlTextA = sqlDataA.sql.toLowerCase();
    const onConflictIdxA = sqlTextA.indexOf('on conflict');
    const doUpdateIdxA = sqlTextA.indexOf('do update');
    const whereIdxA = sqlTextA.indexOf('where');

    console.log('\nWHERE clause position analysis:');
    console.log(`  on conflict at: ${onConflictIdxA}`);
    console.log(`  do update at: ${doUpdateIdxA}`);
    console.log(`  where at: ${whereIdxA}`);

    if (whereIdxA > onConflictIdxA && whereIdxA < doUpdateIdxA) {
      console.log('  ✅ WHERE is INSIDE ON CONFLICT (correct for partial index)');
    } else if (whereIdxA > doUpdateIdxA) {
      console.log('  ❌ WHERE is AFTER DO UPDATE (PostgreSQL cannot infer partial index)');
    } else {
      console.log('  ⚠️  WHERE position unclear or missing');
    }

    // Execute VARIANT A
    console.log('\nExecuting VARIANT A:');
    try {
      const resultA = await queryA;
      console.log('  ✅ SUCCESS');
      console.log('  visitCount:', resultA[0].visitCount);
      
      // Cleanup
      await db.execute(
        sql`DELETE FROM ${blockLearningState} WHERE user_id = ${testUserId} AND navigation_node_id = ${testNavNodeId}`
      );
    } catch (execError: any) {
      console.log('  ❌ EXECUTION FAILED');
      console.log('  Error code:', execError.code);
      console.log('  Error message:', execError.message);
      if (execError.code === '42P10') {
        console.log('  🔍 Error 42P10: PostgreSQL cannot infer partial unique index');
        console.log('  This proves the WHERE clause is not in the correct position');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('=== VARIANT B: Using `targetWhere` parameter ===\n');

    // VARIANT B: Fixed implementation using `targetWhere`
    const queryB = db
      .insert(blockLearningState)
      .values({
        userId: testUserId,
        navigationNodeId: `${testNavNodeId}-v2`,
        blockId: testBlockId,
        blockVersion: testBlockVersion,
        expectedTimeSec: null,
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 0,
        firstViewedAt: now,
        lastViewedAt: now,
        completedAt: null,
        version: 1,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: [
          blockLearningState.userId,
          blockLearningState.navigationNodeId,
          blockLearningState.blockId,
          blockLearningState.blockVersion,
        ],
        targetWhere: sql`${blockLearningState.deletedAt} IS NULL`, // CORRECT!
        set: {
          visitCount: buildAtomicTimeIncrement(blockLearningState.visitCount, 1),
          revisionCount: blockLearningState.revisionCount,
          activeTimeSec: blockLearningState.activeTimeSec,
          expectedTimeSec: blockLearningState.expectedTimeSec,
          firstViewedAt: blockLearningState.firstViewedAt,
          lastViewedAt: now,
          completedAt: blockLearningState.completedAt,
          version: buildAtomicVersionIncrement(blockLearningState.version),
          updatedAt: now,
        },
      })
      .returning();

    const sqlDataB = queryB.toSQL();
    console.log('Generated SQL:\n');
    console.log(sqlDataB.sql);
    console.log('\nParameters:', sqlDataB.params.length, 'params');

    // Check WHERE position
    const sqlTextB = sqlDataB.sql.toLowerCase();
    const onConflictIdxB = sqlTextB.indexOf('on conflict');
    const doUpdateIdxB = sqlTextB.indexOf('do update');
    const whereIdxB = sqlTextB.indexOf('where');

    console.log('\nWHERE clause position analysis:');
    console.log(`  on conflict at: ${onConflictIdxB}`);
    console.log(`  do update at: ${doUpdateIdxB}`);
    console.log(`  where at: ${whereIdxB}`);

    if (whereIdxB > onConflictIdxB && whereIdxB < doUpdateIdxB) {
      console.log('  ✅ WHERE is INSIDE ON CONFLICT (correct for partial index)');
    } else if (whereIdxB > doUpdateIdxB) {
      console.log('  ❌ WHERE is AFTER DO UPDATE (PostgreSQL cannot infer partial index)');
    } else {
      console.log('  ⚠️  WHERE position unclear or missing');
    }

    // Execute VARIANT B
    console.log('\nExecuting VARIANT B:');
    try {
      const resultB = await queryB;
      console.log('  ✅ SUCCESS');
      console.log('  visitCount:', resultB[0].visitCount);
      
      // Cleanup
      await db.execute(
        sql`DELETE FROM ${blockLearningState} WHERE user_id = ${testUserId} AND navigation_node_id LIKE ${testNavNodeId + '%'}`
      );
    } catch (execError: any) {
      console.log('  ❌ EXECUTION FAILED');
      console.log('  Error code:', execError.code);
      console.log('  Error message:', execError.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('CONCLUSION');
    console.log('='.repeat(70) + '\n');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Error code:', error.code);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
})();
