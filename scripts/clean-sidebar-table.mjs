import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

console.log('\n⚠️  TUTORIAL SIDEBAR CLEANUP SCRIPT\n');
console.log('This script will DELETE ALL RECORDS from tutorial_sidebar_trees_v2.');
console.log('This operation is IRREVERSIBLE.\n');

// REQUIREMENT 1: ENVIRONMENT GUARD
if (process.env.ALLOW_TUTORIAL_SIDEBAR_RESET !== 'true') {
  console.error('❌ SAFETY CHECK FAILED\n');
  console.error('This script requires explicit permission to run.');
  console.error('Set ALLOW_TUTORIAL_SIDEBAR_RESET=true to continue.\n');
  console.error('Example:');
  console.error('  ALLOW_TUTORIAL_SIDEBAR_RESET=true node scripts/clean-sidebar-table.mjs\n');
  process.exit(1);
}

// REQUIREMENT 2: SECOND CONFIRMATION
if (process.env.CONFIRM_TUTORIAL_SIDEBAR_DELETE !== 'DELETE') {
  console.error('❌ CONFIRMATION REQUIRED\n');
  console.error('Set CONFIRM_TUTORIAL_SIDEBAR_DELETE=DELETE to proceed.\n');
  console.error('Example:');
  console.error('  ALLOW_TUTORIAL_SIDEBAR_RESET=true CONFIRM_TUTORIAL_SIDEBAR_DELETE=DELETE node scripts/clean-sidebar-table.mjs\n');
  process.exit(1);
}

// REQUIREMENT 3: DATABASE TARGET VERIFICATION
if (!process.env.DATABASE_URL_TUTORIAL) {
  console.error('❌ DATABASE CONNECTION MISSING\n');
  console.error('DATABASE_URL_TUTORIAL is not configured in .env.local\n');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('✅ Safety checks passed\n');
console.log('Database: tutorial (DATABASE_URL_TUTORIAL)');
console.log('Table: tutorial_sidebar_trees_v2\n');
console.log('Waiting 5 seconds before deletion...');
console.log('Press Ctrl+C now to cancel.\n');

await new Promise(resolve => setTimeout(resolve, 5000));

try {
  // REQUIREMENT 4: SHOW RECORD SUMMARY
  console.log('Current records:\n');
  const currentRecords = await pool.query(`
    SELECT id, brand_id, topic_id, version, status, source_format, created_at
    FROM tutorial_sidebar_trees_v2
    ORDER BY created_at ASC
  `);
  
  const beforeCount = currentRecords.rows.length;
  console.log(`Total: ${beforeCount} records\n`);
  
  if (beforeCount === 0) {
    console.log('✅ Table is already empty. Nothing to delete.\n');
    process.exit(0);
  }
  
  currentRecords.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.brand_id} | topic: ${row.topic_id.slice(0, 8)}... | v${row.version} | ${row.status} | ${row.source_format}`);
    console.log(`   id: ${row.id}`);
    console.log(`   created: ${row.created_at}`);
    console.log('');
  });
  
  // REQUIREMENT 5: TRANSACTION
  console.log('Starting deletion in transaction...\n');
  
  await pool.query('BEGIN');
  
  try {
    // Verify count before delete
    const beforeResult = await pool.query('SELECT COUNT(*) FROM tutorial_sidebar_trees_v2');
    const beforeCountVerify = parseInt(beforeResult.rows[0].count);
    console.log(`Before delete: ${beforeCountVerify} records`);
    
    // DELETE OPERATION
    await pool.query('DELETE FROM tutorial_sidebar_trees_v2');
    
    // Verify count after delete
    const afterResult = await pool.query('SELECT COUNT(*) FROM tutorial_sidebar_trees_v2');
    const afterCount = parseInt(afterResult.rows[0].count);
    console.log(`After delete: ${afterCount} records`);
    
    // REQUIREMENT 6: POST-DELETE VERIFICATION
    if (afterCount !== 0) {
      throw new Error(`Deletion verification failed! Expected 0 records, found ${afterCount}`);
    }
    
    await pool.query('COMMIT');
    
    // REQUIREMENT 7: FINAL OUTPUT
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('CLEANUP COMPLETE');
    console.log('════════════════════════════════════════════════════════════════\n');
    console.log(`Before: ${beforeCount} records`);
    console.log(`Deleted: ${beforeCount} records`);
    console.log(`After: 0 records`);
    console.log('\nStatus: ✅ CLEAN TEST BASELINE\n');
    console.log('The tutorial_sidebar_trees_v2 table is now empty and ready for');
    console.log('fresh functional testing with the new universal navigation architecture.\n');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
  
} catch (err) {
  console.error('\n❌ CLEANUP FAILED:', err instanceof Error ? err.message : err);
  console.error('\nThe database was not modified (transaction rolled back).\n');
  process.exit(1);
} finally {
  await pool.end();
}
