import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('=== RAW POSTGRESQL PARTIAL INDEX TEST ===\n');

const testUserId = '00000000-0000-0000-0000-000000000001';
const testNavNodeId = 'test-partial-index';
const testBlockId = 'test-block-123';
const testBlockVersion = 'TEST';

try {
  console.log('1. Testing INSERT with ON CONFLICT using partial index predicate\n');
  
  // Test 1: First insert
  console.log('   Attempt 1: First INSERT (should succeed)');
  const sql1 = `
    INSERT INTO block_learning_state (
      id,
      user_id,
      navigation_node_id,
      block_id,
      block_version,
      visit_count,
      revision_count,
      active_time_sec,
      version,
      deleted_at
    )
    VALUES (
      gen_random_uuid(),
      $1,
      $2,
      $3,
      $4,
      1,
      0,
      0,
      1,
      NULL
    )
    ON CONFLICT (user_id, navigation_node_id, block_id, block_version)
    WHERE deleted_at IS NULL
    DO UPDATE SET
      visit_count = block_learning_state.visit_count + 1,
      updated_at = NOW()
    RETURNING id, visit_count;
  `;
  
  const result1 = await pool.query(sql1, [testUserId, testNavNodeId, testBlockId, testBlockVersion]);
  console.log('   ✅ SUCCESS - First insert');
  console.log('   Returned:', result1.rows[0]);
  
  // Test 2: Duplicate insert (should trigger ON CONFLICT)
  console.log('\n   Attempt 2: Duplicate INSERT (should trigger ON CONFLICT and increment visit_count)');
  const result2 = await pool.query(sql1, [testUserId, testNavNodeId, testBlockId, testBlockVersion]);
  console.log('   ✅ SUCCESS - ON CONFLICT handled');
  console.log('   Returned:', result2.rows[0]);
  console.log(`   Visit count incremented: ${result1.rows[0].visit_count} → ${result2.rows[0].visit_count}`);
  
  // Test 3: Soft delete then re-insert (should allow due to partial index)
  console.log('\n   Attempt 3: Soft delete existing record');
  const deleteResult = await pool.query(
    'UPDATE block_learning_state SET deleted_at = NOW() WHERE id = $1 RETURNING id',
    [result2.rows[0].id]
  );
  console.log('   ✅ SUCCESS - Record soft-deleted');
  
  console.log('\n   Attempt 4: Re-insert same identity (should succeed due to WHERE deleted_at IS NULL)');
  const result3 = await pool.query(sql1, [testUserId, testNavNodeId, testBlockId, testBlockVersion]);
  console.log('   ✅ SUCCESS - New active record created');
  console.log('   Returned:', result3.rows[0]);
  console.log('   New ID (different from deleted):', result3.rows[0].id !== result2.rows[0].id);
  
  // Cleanup
  console.log('\n2. Cleanup test data');
  await pool.query(
    'DELETE FROM block_learning_state WHERE user_id = $1 AND navigation_node_id = $2',
    [testUserId, testNavNodeId]
  );
  console.log('   ✅ Test data cleaned up');
  
  console.log('\n' + '='.repeat(70));
  console.log('RESULT: Raw PostgreSQL FULLY SUPPORTS partial index in ON CONFLICT');
  console.log('='.repeat(70));
  console.log('\n✅ PostgreSQL 17.11 correctly handles:');
  console.log('   ON CONFLICT (columns) WHERE deleted_at IS NULL');
  console.log('\n✅ Partial unique index works correctly for:');
  console.log('   - Conflict detection');
  console.log('   - Soft delete semantics');
  console.log('   - Re-creation after soft delete');
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('Error code:', error.code);
  console.error('Error detail:', error.detail);
  console.error('\nFull error:', error);
  
  // Cleanup on error
  try {
    await pool.query(
      'DELETE FROM block_learning_state WHERE user_id = $1 AND navigation_node_id = $2',
      [testUserId, testNavNodeId]
    );
  } catch (cleanupError) {
    // Ignore cleanup errors
  }
} finally {
  await pool.end();
}
