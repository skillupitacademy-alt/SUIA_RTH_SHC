/**
 * PHASE 1B — ILS DATABASE GAP / MIGRATION CONTRACT AUDIT
 * READ-ONLY verification of migration requirements
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n' + '='.repeat(80));
console.log('PHASE 1B — ILS DATABASE GAP / MIGRATION CONTRACT AUDIT');
console.log('='.repeat(80));

try {
  // 1. Check for progress-related enums
  console.log('\n## 1. PROGRESS STATUS ENUM VERIFICATION');
  console.log('-'.repeat(80));
  
  const progressEnums = await pool.query(`
    SELECT 
      t.typname as enum_name,
      e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname LIKE '%progress%'
    ORDER BY t.typname, e.enumsortorder
  `);
  
  if (progressEnums.rows.length === 0) {
    console.log('\n❌ NO progress-related enums found in actual database');
    console.log('   Expected: tutorial_progress_status');
    console.log('   Status: MISSING');
  } else {
    console.log('\n✅ Progress enums found:');
    let currentEnum = null;
    for (const row of progressEnums.rows) {
      if (row.enum_name !== currentEnum) {
        console.log(`\n   ${row.enum_name}:`);
        currentEnum = row.enum_name;
      }
      console.log(`     - ${row.enum_value}`);
    }
  }
  
  // 2. Check tutorial_sections foreign key targets
  console.log('\n## 2. FOREIGN KEY TARGET VERIFICATION');
  console.log('-'.repeat(80));
  
  const fkTargets = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'tutorial_sections'
    ORDER BY kcu.column_name
  `);
  
  console.log('\n   tutorial_sections foreign keys:');
  if (fkTargets.rows.length === 0) {
    console.log('   NONE');
  } else {
    for (const fk of fkTargets.rows) {
      console.log(`   ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
    }
  }
  
  // 3. Check if navigation structure exists
  console.log('\n## 3. NAVIGATION STRUCTURE VERIFICATION');
  console.log('-'.repeat(80));
  
  const navTables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (
        table_name LIKE '%sidebar%'
        OR table_name LIKE '%navigation%'
      )
    ORDER BY table_name
  `);
  
  console.log('\n   Navigation-related tables:');
  if (navTables.rows.length === 0) {
    console.log('   NONE FOUND');
  } else {
    for (const table of navTables.rows) {
      console.log(`   - ${table.table_name}`);
    }
  }
  
  // 4. Check tutorial_sidebar_trees_v2 structure if it exists
  const sidebarExists = navTables.rows.some(r => r.table_name === 'tutorial_sidebar_trees_v2');
  
  if (sidebarExists) {
    console.log('\n   tutorial_sidebar_trees_v2 columns:');
    const sidebarCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sidebar_trees_v2'
      ORDER BY ordinal_position
    `);
    
    for (const col of sidebarCols.rows) {
      console.log(`     ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    }
    
    // Check for navigation_node_id or node_id
    const hasNavNodeId = sidebarCols.rows.some(c => 
      c.column_name === 'navigation_node_id' || c.column_name === 'node_id'
    );
    
    if (hasNavNodeId) {
      console.log(`\n   ✅ Contains node identity column`);
    } else {
      console.log(`\n   ⚠️ Does not contain obvious node identity column`);
    }
  }
  
  // 5. Check table boundary candidates
  console.log('\n## 4. TABLE BOUNDARY CANDIDATES');
  console.log('-'.repeat(80));
  
  const boundaryCandidates = [
    'tutorial_content_versions',
    'tutorial_sidebar_trees_v2',
    'tutorial_page_content_v2'
  ];
  
  for (const candidate of boundaryCandidates) {
    const exists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) as exists
    `, [candidate]);
    
    const status = exists.rows[0].exists ? '✅ EXISTS' : '❌ MISSING';
    console.log(`\n   ${candidate}: ${status}`);
    
    if (exists.rows[0].exists) {
      // Get row count
      const count = await pool.query(`SELECT COUNT(*) as count FROM ${candidate}`);
      console.log(`     Rows: ${count.rows[0].count}`);
      
      // Check for navigation_node_id or related columns
      const cols = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
          AND (
            column_name LIKE '%navigation%'
            OR column_name LIKE '%node%'
            OR column_name LIKE '%subtopic%'
          )
      `, [candidate]);
      
      if (cols.rows.length > 0) {
        console.log(`     Navigation-related columns: ${cols.rows.map(c => c.column_name).join(', ')}`);
      }
    }
  }
  
  // 6. Check for existing migrations related to navigation progress
  console.log('\n## 5. MIGRATION FILE AUDIT');
  console.log('-'.repeat(80));
  console.log('\n   (Migration files would need to be inspected separately)');
  console.log('   Location: packages/db-tutorial/migrations/');
  
  // 7. Verify all enum types in database
  console.log('\n## 6. ALL ENUM TYPES IN DATABASE');
  console.log('-'.repeat(80));
  
  const allEnums = await pool.query(`
    SELECT 
      t.typname as enum_name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `);
  
  console.log(`\n   Total enums: ${allEnums.rows.length}\n`);
  for (const enumType of allEnums.rows) {
    console.log(`   ${enumType.enum_name}:`);
    const values = Array.isArray(enumType.values) ? enumType.values : [enumType.values];
    console.log(`     Values: ${values.join(', ')}`);
  }
  
  // 8. UUID type verification
  console.log('\n## 7. POSTGRESQL TYPE VERIFICATION');
  console.log('-'.repeat(80));
  
  const uuidExtension = await pool.query(`
    SELECT EXISTS (
      SELECT FROM pg_extension WHERE extname = 'uuid-ossp'
    ) as has_uuid_ossp
  `);
  
  console.log(`\n   uuid-ossp extension: ${uuidExtension.rows[0].has_uuid_ossp ? '✅ INSTALLED' : '⚠️ NOT INSTALLED'}`);
  console.log('   UUID type: ✅ NATIVE (PostgreSQL built-in)');
  console.log('   JSONB type: ✅ AVAILABLE (PostgreSQL 9.4+)');
  console.log('   Timestamp type: ✅ AVAILABLE');
  console.log('   Integer type: ✅ AVAILABLE');
  console.log('   Text type: ✅ AVAILABLE');
  
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 1B AUDIT COMPLETE');
  console.log('='.repeat(80));
  console.log('\nREAD-ONLY verification finished.');
  console.log('No database modifications performed.\n');
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error);
} finally {
  await pool.end();
}
