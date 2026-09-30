#!/usr/bin/env node
import { getTutorialDb } from './packages/db-tutorial/src/index.ts';

async function reconcileMigration0022() {
  const db = getTutorialDb();
  
  console.log('=== SECTION 3: LIVE DATABASE TABLE STATE ===\n');
  
  // Check current database
  const dbInfo = await db.execute(`SELECT current_database(), current_schema()`);
  console.log('Current Database:', dbInfo.rows[0].current_database);
  console.log('Current Schema:', dbInfo.rows[0].current_schema);
  console.log('');
  
  // Check if tutorial_navigation_progress exists
  const tableCheck = await db.execute(`
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
    console.log(`  - ${row.table_schema}.${row.table_name}`);
  });
  console.log('');
  
  // Check migration tracking table
  console.log('=== SECTION 4: MIGRATION TRACKING TABLE ===\n');
  
  const migrationTableCheck = await db.execute(`
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
  
  // If drizzle migrations table exists, check for 0022
  if (migrationTableCheck.rows.some(r => r.table_name === '__drizzle_migrations')) {
    console.log('=== DRIZZLE MIGRATIONS TABLE CONTENT ===\n');
    const migrations = await db.execute(`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 25
    `);
    
    console.log('Recent Migrations:');
    migrations.rows.forEach(row => {
      console.log(`  ${row.id} | ${row.hash} | ${row.created_at}`);
    });
    console.log('');
    
    const migration0022Check = await db.execute(`
      SELECT COUNT(*) as count
      FROM __drizzle_migrations
      WHERE hash LIKE '%0022%' OR hash LIKE '%broken_supernaut%'
    `);
    
    console.log(`Migration 0022 in tracking: ${migration0022Check.rows[0].count > 0 ? 'YES' : 'NO'}`);
    console.log('');
  }
  
  // If tutorial_navigation_progress exists, inspect schema
  const navProgressExists = tableCheck.rows.some(r => r.table_name === 'tutorial_navigation_progress');
  
  if (navProgressExists) {
    console.log('=== SECTION 5: tutorial_navigation_progress SCHEMA ===\n');
    
    const columns = await db.execute(`
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
      console.log(`  ${row.column_name} | ${row.data_type} | nullable:${row.is_nullable} | default:${row.column_default || 'none'}`);
    });
    console.log('');
    
    // Check indexes
    const indexes = await db.execute(`
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
      console.log(`  ${row.indexname}`);
      console.log(`    ${row.indexdef}`);
    });
    console.log('');
    
    // Check row count
    const rowCount = await db.execute(`SELECT COUNT(*) as count FROM tutorial_navigation_progress`);
    console.log(`Row Count: ${rowCount.rows[0].count}`);
    console.log('');
  } else {
    console.log('=== tutorial_navigation_progress TABLE: NOT FOUND ===\n');
  }
  
  // Check tutorial_sections
  console.log('=== SECTION 6: TUTORIAL DATA STATE ===\n');
  
  const sectionsCount = await db.execute(`
    SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE deleted_at IS NULL) as active
    FROM tutorial_sections
  `);
  
  console.log(`tutorial_sections: ${sectionsCount.rows[0].total} total, ${sectionsCount.rows[0].active} active`);
  
  // Check for "What is Java?" canonical identity
  console.log('\n=== SECTION 7: "What is Java?" IDENTITY VERIFICATION ===\n');
  
  const whatIsJava = await db.execute(`
    SELECT 
      id,
      external_id,
      slug,
      status,
      navigation_node_id
    FROM tutorial_subtopics
    WHERE slug = 'whatisjava'
       OR id = '7a7a0647-2207-485d-8e93-fed68c3155bd'
       OR external_id = 'e617222d-77de-4138-a705-074236fbae74'
    LIMIT 1
  `);
  
  if (whatIsJava.rows.length > 0) {
    const sub = whatIsJava.rows[0];
    console.log('Subtopic Found:');
    console.log(`  ID: ${sub.id}`);
    console.log(`  External ID: ${sub.external_id}`);
    console.log(`  Slug: ${sub.slug}`);
    console.log(`  Status: ${sub.status}`);
    console.log(`  Navigation Node ID: ${sub.navigation_node_id}`);
    console.log('');
    
    // Check sections for this subtopic
    const sections = await db.execute(`
      SELECT 
        id,
        navigation_node_id,
        status,
        version
      FROM tutorial_sections
      WHERE subtopic_id = $1
        AND deleted_at IS NULL
    `, [sub.id]);
    
    console.log(`Sections for "What is Java?": ${sections.rows.length}`);
    sections.rows.forEach(sec => {
      console.log(`  - ${sec.navigation_node_id} | status:${sec.status} | v${sec.version}`);
    });
    console.log('');
  } else {
    console.log('"What is Java?" subtopic: NOT FOUND');
    console.log('');
  }
  
  await db.end();
  process.exit(0);
}

reconcileMigration0022().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
