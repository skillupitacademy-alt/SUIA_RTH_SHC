import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL || process.env.TUTORIAL_DB_URL });

console.log('=== BLOCK_LEARNING_STATE DATABASE INVESTIGATION ===\n');

try {
  // 1. Check if table exists
  console.log('1. Table existence:');
  const tableExists = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'block_learning_state'
    )
  `);
  console.log('   EXISTS:', tableExists.rows[0].exists);
  
  if (!tableExists.rows[0].exists) {
    console.log('\n❌ Table does not exist! Migration 0023 may not have been applied.');
    await pool.end();
    process.exit(1);
  }
  
  // 2. Check table schema
  console.log('\n2. Table columns:');
  const columns = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'block_learning_state'
    ORDER BY ordinal_position
  `);
  columns.rows.forEach(col => {
    console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
  // 3. Check ALL indexes and constraints
  console.log('\n3. Indexes:');
  const indexes = await pool.query(`
    SELECT 
      indexname, 
      indexdef
    FROM pg_indexes 
    WHERE tablename = 'block_learning_state'
    ORDER BY indexname
  `);
  
  if (indexes.rows.length === 0) {
    console.log('   ❌ NO INDEXES FOUND!');
  } else {
    indexes.rows.forEach(idx => {
      console.log(`\n   ${idx.indexname}:`);
      console.log(`   ${idx.indexdef}`);
    });
  }
  
  // 4. Check for unique constraints
  console.log('\n4. Unique constraints:');
  const constraints = await pool.query(`
    SELECT 
      conname as constraint_name,
      pg_get_constraintdef(c.oid) as definition
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'block_learning_state'::regclass
    AND contype = 'u'
  `);
  
  if (constraints.rows.length === 0) {
    console.log('   ⚠️  NO UNIQUE CONSTRAINTS (using partial unique index instead)');
  } else {
    constraints.rows.forEach(con => {
      console.log(`   ${con.constraint_name}: ${con.definition}`);
    });
  }
  
  // 5. Check row count
  console.log('\n5. Row count:');
  const count = await pool.query('SELECT COUNT(*) as count FROM block_learning_state');
  console.log(`   Total rows: ${count.rows[0].count}`);
  
  // 6. If rows exist, show sample
  if (parseInt(count.rows[0].count) > 0) {
    console.log('\n6. Sample rows:');
    const sample = await pool.query('SELECT * FROM block_learning_state LIMIT 3');
    console.log(JSON.stringify(sample.rows, null, 2));
  } else {
    console.log('\n6. ❌ NO ROWS - This is the problem we\'re investigating');
  }
  
  // 7. Check if partial unique index exists with WHERE clause
  console.log('\n7. Checking for partial unique index (WITH WHERE clause):');
  const partialIndex = await pool.query(`
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE tablename = 'block_learning_state'
    AND indexdef LIKE '%WHERE%'
    AND indexdef LIKE '%deleted_at%'
  `);
  
  if (partialIndex.rows.length > 0) {
    console.log('   ✅ FOUND partial unique index:');
    partialIndex.rows.forEach(idx => {
      console.log(`   ${idx.indexname}`);
      console.log(`   ${idx.indexdef}`);
    });
  } else {
    console.log('   ❌ NO PARTIAL UNIQUE INDEX WITH WHERE deleted_at IS NULL');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSIS:');
  console.log('='.repeat(70));
  
  const hasPartialIndex = partialIndex.rows.length > 0;
  const hasUniqueConstraint = constraints.rows.length > 0;
  
  if (hasPartialIndex) {
    console.log('✅ Partial unique index exists (WITH WHERE deleted_at IS NULL)');
    console.log('❓ PostgreSQL ON CONFLICT may not work with partial indexes in standard syntax');
    console.log('💡 Solution: Need to specify index name in ON CONFLICT clause');
  } else if (hasUniqueConstraint) {
    console.log('✅ Unique constraint exists (no WHERE clause needed)');
    console.log('✅ ON CONFLICT should work');
  } else {
    console.log('❌ NO unique constraint or partial index found');
    console.log('❌ Migration 0023 may not have been applied correctly');
  }
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
} finally {
  await pool.end();
}
