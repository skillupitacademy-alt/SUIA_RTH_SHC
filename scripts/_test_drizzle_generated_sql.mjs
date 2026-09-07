import { config } from 'dotenv';
config({ path: '.env.local' });

// Import Drizzle
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Import schema
import { blockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state.ts';
import { sql } from 'drizzle-orm';

// Helper to build atomic increment (from repository)
function buildAtomicTimeIncrement(column, increment) {
  return sql`${column} + ${increment}`;
}

function buildAtomicVersionIncrement(column) {
  return sql`${column} + 1`;
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  webSocketConstructor: ws
});

const db = drizzle(pool);

console.log('=== DRIZZLE ORM GENERATED SQL TEST ===\n');
console.log('Drizzle ORM Version: 0.45.1');
console.log('PostgreSQL Version: 17.11\n');

const testUserId = '00000000-0000-0000-0000-000000000002';
const testNavNodeId = 'test-drizzle-sql';
const testBlockId = 'test-drizzle-block-456';
const testBlockVersion = 'DRIZZLE';

try {
  console.log('1. Building Drizzle query (same as BlockLearningStateRepository.upsert)\n');
  
  const now = new Date();
  
  // This is the EXACT code from BlockLearningStateRepository.upsert()
  const query = db
    .insert(blockLearningState)
    .values({
      // Identity
      userId: testUserId,
      navigationNodeId: testNavNodeId,
      blockId: testBlockId,
      blockVersion: testBlockVersion,

      // Telemetry (initial values)
      expectedTimeSec: null,
      visitCount: 1,
      revisionCount: 0,
      activeTimeSec: 0,

      // Timestamps (initial values)
      firstViewedAt: now,
      lastViewedAt: now,
      completedAt: null,

      // Audit
      version: 1,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      // Complete identity for conflict detection
      target: [
        blockLearningState.userId,
        blockLearningState.navigationNodeId,
        blockLearningState.blockId,
        blockLearningState.blockVersion,
      ],
      // WHERE clause for partial unique index (active records only)
      where: sql`${blockLearningState.deletedAt} IS NULL`,
      // Atomic updates on conflict
      set: {
        // Atomic counter increments (cumulative)
        visitCount: buildAtomicTimeIncrement(blockLearningState.visitCount, 1),
        revisionCount: blockLearningState.revisionCount,
        activeTimeSec: blockLearningState.activeTimeSec,

        // Update other fields if provided, preserve if not
        expectedTimeSec: blockLearningState.expectedTimeSec,
        firstViewedAt: blockLearningState.firstViewedAt,
        lastViewedAt: now,
        completedAt: blockLearningState.completedAt,

        // Audit
        version: buildAtomicVersionIncrement(blockLearningState.version),
        updatedAt: now,
      },
    })
    .returning();

  // Get the SQL
  console.log('2. Generated SQL (via toSQL()):\n');
  const sqlData = query.toSQL();
  console.log('SQL:', sqlData.sql);
  console.log('\nParameters:', sqlData.params);
  
  console.log('\n3. Analyzing WHERE clause placement:\n');
  
  const sqlText = sqlData.sql;
  
  // Check if WHERE appears in ON CONFLICT clause
  const onConflictIndex = sqlText.indexOf('on conflict');
  const doUpdateIndex = sqlText.indexOf('do update');
  const whereIndex = sqlText.toLowerCase().indexOf('where');
  
  console.log('   Position of "on conflict":', onConflictIndex);
  console.log('   Position of "do update":', doUpdateIndex);
  console.log('   Position of "where":', whereIndex);
  
  if (whereIndex > onConflictIndex && whereIndex < doUpdateIndex) {
    console.log('\n   ✅ WHERE is INSIDE ON CONFLICT clause (conflict target predicate)');
    console.log('   This is CORRECT for partial index');
  } else if (whereIndex > doUpdateIndex) {
    console.log('\n   ❌ WHERE is AFTER DO UPDATE clause (update condition)');
    console.log('   This is WRONG - PostgreSQL cannot infer partial index');
  } else {
    console.log('\n   ⚠️  WHERE clause position unclear');
  }
  
  console.log('\n4. Attempting to execute query:\n');
  
  try {
    const result = await query;
    console.log('   ✅ SUCCESS - Query executed');
    console.log('   Result:', result[0]);
    
    // Cleanup
    await db.execute(
      sql`DELETE FROM ${blockLearningState} WHERE user_id = ${testUserId} AND navigation_node_id = ${testNavNodeId}`
    );
    console.log('   ✅ Test data cleaned up');
    
  } catch (execError) {
    console.log('   ❌ EXECUTION FAILED');
    console.log('   Error code:', execError.code);
    console.log('   Error message:', execError.message);
    
    if (execError.code === '42P10') {
      console.log('\n   🔍 Error 42P10 confirmed: ON CONFLICT cannot infer partial index');
      console.log('   This means Drizzle is generating incorrect SQL syntax');
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('DRIZZLE SQL GENERATION ANALYSIS COMPLETE');
  console.log('='.repeat(70));
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('Error code:', error.code);
  console.error('\nFull error:', error);
} finally {
  await pool.end();
}
