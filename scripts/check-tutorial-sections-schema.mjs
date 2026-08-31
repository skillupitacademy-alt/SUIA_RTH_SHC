import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\nTUTORIAL_SECTIONS DEEP COMPARISON\n');

try {
  // Get all columns
  const columns = await pool.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tutorial_sections'
    ORDER BY ordinal_position
  `);
  
  console.log(`Total columns: ${columns.rows.length}\n`);
  
  // Check for navigation_node_id specifically
  const navColumn = columns.rows.find(c => c.column_name === 'navigation_node_id');
  if (navColumn) {
    console.log('✅ navigation_node_id EXISTS in database:');
    console.log(`   Type: ${navColumn.data_type}`);
    console.log(`   Nullable: ${navColumn.is_nullable}`);
    console.log(`   Default: ${navColumn.column_default || 'none'}\n`);
  } else {
    console.log('❌ navigation_node_id NOT FOUND in database\n');
  }
  
  // Get all indexes
  const indexes = await pool.query(`
    SELECT
      i.relname as index_name,
      a.attname as column_name,
      ix.indisunique as is_unique,
      pg_get_expr(ix.indpred, ix.indrelid) as predicate
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relname = 'tutorial_sections'
      AND t.relkind = 'r'
    ORDER BY i.relname, a.attnum
  `);
  
  console.log('\nIndexes on tutorial_sections:\n');
  
  const indexMap = new Map();
  indexes.rows.forEach(row => {
    if (!indexMap.has(row.index_name)) {
      indexMap.set(row.index_name, {
        columns: [],
        unique: row.is_unique,
        predicate: row.predicate
      });
    }
    if (row.column_name) {
      indexMap.get(row.index_name).columns.push(row.column_name);
    }
  });
  
  let foundDelivery = false;
  let foundIdentity = false;
  
  for (const [name, info] of indexMap) {
    console.log(`${name}:`);
    console.log(`   Columns: ${info.columns.join(', ')}`);
    console.log(`   Unique: ${info.unique}`);
    if (info.predicate) {
      console.log(`   Predicate: ${info.predicate}`);
    }
    console.log();
    
    if (name === 'idx_tutorial_v2_delivery') foundDelivery = true;
    if (name === 'uq_tutorial_v2_identity_active') foundIdentity = true;
  }
  
  console.log('\nKey indexes status:');
  console.log(`idx_tutorial_v2_delivery: ${foundDelivery ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  console.log(`uq_tutorial_v2_identity_active: ${foundIdentity ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
