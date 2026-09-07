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

console.log('=== DRIZZLE SQL GENERATION INSPECTION (READ-ONLY) ===\n');
console.log('Drizzle ORM Version: 0.45.1\n');

const testUserId = '00000000-0000-0000-0000-000000000002';
const testNavNodeId = 'test-sql-inspection';
const testBlockId = 'test-block-456';
const testBlockVersion = 'TEST';
const now = new Date();

// VARIANT A: Current implementation using deprecated `where`
console.log('='.repeat(70));
console.log('VARIANT A: Using deprecated `where` parameter');
console.log('='.repeat(70) + '\n');

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
console.log('Generated SQL:');
console.log(sqlDataA.sql);
console.log('\nParameter count:', sqlDataA.params.length);

// Analyze WHERE clause position
const sqlTextA = sqlDataA.sql.toLowerCase();
const onConflictIdxA = sqlTextA.indexOf('on conflict');
const doUpdateIdxA = sqlTextA.indexOf('do update');
const whereIdxA = sqlTextA.indexOf('where');

console.log('\nWHERE clause position analysis:');
console.log(`  "on conflict" position: ${onConflictIdxA}`);
console.log(`  "do update" position: ${doUpdateIdxA}`);
console.log(`  "where" position: ${whereIdxA}`);

if (whereIdxA > onConflictIdxA && whereIdxA < doUpdateIdxA) {
  console.log('\n  ✅ CORRECT: WHERE is between ON CONFLICT and DO UPDATE');
  console.log('     SQL pattern: ON CONFLICT (...) WHERE ... DO UPDATE ...');
} else if (whereIdxA > doUpdateIdxA) {
  console.log('\n  ❌ INCORRECT: WHERE is AFTER DO UPDATE');
  console.log('     SQL pattern: ON CONFLICT (...) DO UPDATE ... WHERE ...');
  console.log('     PostgreSQL ERROR: Cannot infer partial unique index (42P10)');
} else {
  console.log('\n  ⚠️  UNCLEAR: WHERE position ambiguous or missing');
}

// VARIANT B: Fixed implementation using `targetWhere`
console.log('\n\n' + '='.repeat(70));
console.log('VARIANT B: Using `targetWhere` parameter');
console.log('='.repeat(70) + '\n');

const queryB = db
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
console.log('Generated SQL:');
console.log(sqlDataB.sql);
console.log('\nParameter count:', sqlDataB.params.length);

// Analyze WHERE clause position
const sqlTextB = sqlDataB.sql.toLowerCase();
const onConflictIdxB = sqlTextB.indexOf('on conflict');
const doUpdateIdxB = sqlTextB.indexOf('do update');
const whereIdxB = sqlTextB.indexOf('where');

console.log('\nWHERE clause position analysis:');
console.log(`  "on conflict" position: ${onConflictIdxB}`);
console.log(`  "do update" position: ${doUpdateIdxB}`);
console.log(`  "where" position: ${whereIdxB}`);

if (whereIdxB > onConflictIdxB && whereIdxB < doUpdateIdxB) {
  console.log('\n  ✅ CORRECT: WHERE is between ON CONFLICT and DO UPDATE');
  console.log('     SQL pattern: ON CONFLICT (...) WHERE ... DO UPDATE ...');
} else if (whereIdxB > doUpdateIdxB) {
  console.log('\n  ❌ INCORRECT: WHERE is AFTER DO UPDATE');
  console.log('     SQL pattern: ON CONFLICT (...) DO UPDATE ... WHERE ...');
  console.log('     PostgreSQL ERROR: Cannot infer partial unique index (42P10)');
} else {
  console.log('\n  ⚠️  UNCLEAR: WHERE position ambiguous or missing');
}

console.log('\n' + '='.repeat(70));
console.log('CONCLUSION');
console.log('='.repeat(70));
console.log('\nNo database execution performed - SQL inspection only.');
console.log('Use the generated SQL patterns above to determine correctness.\n');

pool.end();
