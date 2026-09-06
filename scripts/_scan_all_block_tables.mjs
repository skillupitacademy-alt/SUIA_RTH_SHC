#!/usr/bin/env node
/**
 * Scan ALL block-level and content tables in TutorialDB
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

async function main() {
  console.log('=== SCANNING ALL BLOCK-LEVEL TABLES IN TUTORIALDB ===\n');

  // List of all potential block/content tables
  const tables = [
    'tutorial_sections',
    'tutorial_page_content_v2',
    'block_learning_state',
    'tutorial_navigation_progress',
    'tutorial_subtopics',
    'tutorial_topics',
    'tutorial_subjects',
    'tutorial_domains',
    'tutorial_sidebar_trees_v2',
    'tutorial_content_versions',
    'tutorial_block_interactions',
    'tutorial_content',
    'tutorial_subsections',
    'tutorial_section_notes',
  ];

  for (const table of tables) {
    try {
      // Check if table exists
      const existsResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [table]);

      if (!existsResult.rows[0].exists) {
        console.log(`❌ ${table}: DOES NOT EXIST\n`);
        continue;
      }

      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(countResult.rows[0].count);

      console.log(`✅ ${table}: ${count} rows`);

      if (count > 0 && count <= 50) {
        // If reasonable number of rows, show sample
        const sampleResult = await pool.query(`
          SELECT * FROM ${table} LIMIT 5
        `);
        console.log('   Sample rows:');
        sampleResult.rows.forEach((row, i) => {
          console.log(`   [${i + 1}]`, JSON.stringify(row, null, 2).substring(0, 200) + '...');
        });
      } else if (count > 50) {
        // Show column list for large tables
        const colResult = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        const columns = colResult.rows.map(r => r.column_name);
        console.log(`   Columns: ${columns.join(', ')}`);
      }

      console.log('');
    } catch (error) {
      console.log(`⚠️  ${table}: ERROR - ${error.message}\n`);
    }
  }

  // Special check: Look for ANY table with "block" or "content" in name
  console.log('\n=== SCANNING FOR ANY BLOCK/CONTENT TABLES ===\n');
  
  const allTablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%block%' 
        OR table_name LIKE '%content%'
        OR table_name LIKE '%tutorial%'
      )
    ORDER BY table_name
  `);

  console.log('All tutorial/block/content tables found:');
  allTablesResult.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });

  await pool.end();
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
