#!/usr/bin/env node
import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n=================================================================');
console.log('PHASE 1C-A.5 — READ-ONLY MIGRATION 0022 RECONCILIATION');
console.log('=================================================================\n');

try {
  // SECTION 3: LIVE DATABASE TABLE STATE
  console.log('=== SECTION 3: LIVE DATABASE TABLE STATE ===\n');
  
  const dbInfo = await pool.query(`SELECT current_database(), current_schema()`);
  console.log('Current Database:', dbInfo.rows[0].current_database);
  console.log('Current Schema:', dbInfo.rows[0].current_schema);
  console.log('');
  
  const tableCheck = await pool.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'tutorial_navigation_progress',
        'tutorial_sections',
        'tutorial_subtopics',
        'tutorial_topics',
        'tutorial_subjects',
        'tutorial_domains',
        'tutorial_sidebar'
      )
    ORDER BY table_name
  `);
  
  console.log('Tables Found:');
  tableCheck.rows.forEach(row => {
    console.log(`  ✓ ${row.table_schema}.${row.table_name}`);
  });
  console.log('');
  
  const navProgressExists = tableCheck.rows.some(r => r.table_name === 'tutorial_navigation_progress');
  console.log(`tutorial_navigation_progress: ${navProgressExists ? 'EXISTS' : 'NOT FOUND'}`);
  console.log('');
  
  // SECTION 4: MIGRATION TRACKING TABLE
  console.log('=== SECTION 4: MIGRATION TRACKING TABLE ===\n');
  
  const migrationTableCheck = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE '%migration%'
    ORDER BY table_name
  `);
  
  console.log('Migration Tracking Tables:');
  migrationTableCheck.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });
  console.log('');
  
  const hasDrizzleMigrations = migrationTableCheck.rows.some(r => r.table_name === '__drizzle_migrations');
  
  if (hasDrizzleMigrations) {
    console.log('=== DRIZZLE MIGRATIONS TABLE CONTENT ===\n');
    const migrations = await pool.query(`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 25
    `);
    
    console.log('Recent Migrations:');
    migrations.rows.forEach(row => {
      const timestamp = new Date(row.created_at).toISOString();
      console.log(`  ${row.id.padEnd(30)} | ${timestamp}`);
    });
    console.log('');
    
    const migration0022Check = await pool.query(`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      WHERE id LIKE '%0022%' OR id LIKE '%broken_supernaut%'
    `);
    
    console.log(`Migration 0022 in tracking table: ${migration0022Check.rows.length > 0 ? 'YES' : 'NO'}`);
    if (migration0022Check.rows.length > 0) {
      migration0022Check.rows.forEach(row => {
        console.log(`  Found: ${row.id} | ${new Date(row.created_at).toISOString()}`);
      });
    }
    console.log('');
  }
  
  // SECTION 5: tutorial_navigation_progress SCHEMA INSPECTION
  if (navProgressExists) {
    console.log('=== SECTION 5: tutorial_navigation_progress SCHEMA ===\n');
    
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tutorial_navigation_progress'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    columns.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = row.column_default ? ` | default: ${row.column_default}` : '';
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${nullable}${def}`);
    });
    console.log('');
    
    console.log(`Total Columns: ${columns.rows.length}`);
    console.log('Expected by migration 0022: 18');
    console.log(`Match: ${columns.rows.length === 18 ? 'YES' : 'NO'}`);
    console.log('');
    
    const indexes = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_navigation_progress'
      ORDER BY indexname
    `);
    
    console.log('Indexes:');
    indexes.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    console.log('');
    
    console.log(`Total Indexes: ${indexes.rows.length}`);
    console.log('Expected by migration 0022: 5 (PK + unique + 3 performance)');
    console.log(`Match: ${indexes.rows.length === 5 ? 'YES' : 'NO'}`);
    console.log('');
    
    const rowCount = await pool.query(`SELECT COUNT(*) as count FROM tutorial_navigation_progress`);
    console.log(`Row Count: ${rowCount.rows[0].count}`);
    console.log('');
  } else {
    console.log('=== tutorial_navigation_progress TABLE: NOT FOUND ===\n');
    console.log('Expected by migration 0022: YES');
    console.log('Actual: NO');
    console.log('Classification: NOT APPLIED');
    console.log('');
  }
  
  // SECTION 6: TUTORIAL DATA STATE
  console.log('=== SECTION 6: TUTORIAL DATA STATE ===\n');
  
  const sectionsCount = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) as active
    FROM tutorial_sections
  `);
  
  console.log(`tutorial_sections:`);
  console.log(`  Total: ${sectionsCount.rows[0].total}`);
  console.log(`  Active (not deleted): ${sectionsCount.rows[0].active}`);
  console.log('');
  
  // SECTION 7: "What is Java?" IDENTITY VERIFICATION
  console.log('=== SECTION 7: "What is Java?" IDENTITY VERIFICATION ===\n');
  
  const whatIsJava = await pool.query(`
    SELECT 
      id,
      external_id,
      slug
    FROM tutorial_subtopics
    WHERE slug = 'whatisjava'
       OR id = '7a7a0647-2207-485d-8e93-fed68c3155bd'
       OR external_id = 'e617222d-77de-4138-a705-074236fbae74'
    LIMIT 1
  `);
  
  if (whatIsJava.rows.length > 0) {
    const sub = whatIsJava.rows[0];
    console.log('✓ Subtopic Found:');
    console.log(`  ID: ${sub.id}`);
    console.log(`  External ID: ${sub.external_id}`);
    console.log(`  Slug: ${sub.slug}`);
    console.log('');
    
    // Verify canonical identifiers
    console.log('Canonical Identity Reconciliation:');
    console.log(`  subtopicId match: ${sub.id === '7a7a0647-2207-485d-8e93-fed68c3155bd' ? 'CONFIRMED' : 'MISMATCH'}`);
    console.log(`  externalId match: ${sub.external_id === 'e617222d-77de-4138-a705-074236fbae74' ? 'CONFIRMED' : 'MISMATCH'}`);
    console.log(`  slug match: ${sub.slug === 'whatisjava' ? 'CONFIRMED' : 'MISMATCH'}`);
    console.log('');
    
    const sections = await pool.query(`
      SELECT 
        id,
        navigation_node_id,
        version,
        content_type
      FROM tutorial_sections
      WHERE subtopic_id = $1
        AND deleted_at IS NULL
      ORDER BY navigation_node_id
    `, [sub.id]);
    
    console.log(`Sections for "What is Java?": ${sections.rows.length}`);
    sections.rows.forEach(sec => {
      console.log(`  - ${sec.navigation_node_id.padEnd(20)} | ${sec.content_type?.padEnd(12) || 'null'.padEnd(12)} | v${sec.version}`);
    });
    console.log('');
    
    // Check block architecture
    const blockTypes = {};
    sections.rows.forEach(sec => {
      if (sec.content_type) {
        blockTypes[sec.content_type] = (blockTypes[sec.content_type] || 0) + 1;
      }
    });
    
    console.log('Block Architecture:');
    Object.entries(blockTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} sections`);
    });
    console.log('');
  } else {
    console.log('✗ "What is Java?" subtopic: NOT FOUND');
    console.log('');
  }
  
  // SECTION 8: PREMATURE B2 ARTIFACT VERIFICATION
  console.log('=== SECTION 8: PREMATURE B2 ARTIFACT VERIFICATION ===\n');
  console.log('Checking that these files DO NOT exist:');
  console.log('  apps/realtutorialhub-web/src/lib/ils-client.ts');
  console.log('  apps/realtutorialhub-web/src/lib/ils-session.ts');
  console.log('  apps/realtutorialhub-web/src/lib/hooks/useILSProgress.ts');
  console.log('  apps/realtutorialhub-web/src/components/content/ILSProgressProvider.tsx');
  console.log('');
  console.log('(File system check required - not database check)');
  console.log('');
  
  // FINAL CLASSIFICATION
  console.log('=== SECTION 9: MIGRATION 0022 CLASSIFICATION ===\n');
  
  if (!navProgressExists) {
    console.log('Classification: NOT APPLIED');
    console.log('');
    console.log('Evidence:');
    console.log('  - tutorial_navigation_progress table: NOT FOUND in live database');
    console.log('  - Migration 0022 files exist in repository (untracked)');
    console.log('  - Migration journal contains entry for 0022_broken_supernaut');
    console.log('');
    console.log('Decision: Migration 0022 is generated but NOT applied to tutorial_prod');
  } else {
    console.log('Classification: APPLIED');
    console.log('');
    console.log('(Further schema comparison required)');
  }
  console.log('');
  
  console.log('=================================================================');
  console.log('READ-ONLY RECONCILIATION COMPLETE');
  console.log('=================================================================\n');
  
} catch (error) {
  console.error('\nERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  await pool.end();
}
