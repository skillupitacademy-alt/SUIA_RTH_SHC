#!/usr/bin/env node
/**
 * Check All Relevant Table Schemas
 * 
 * READ-ONLY schema inspection for:
 * - Composer content tables
 * - ILS progress tables
 * - Navigation/hierarchy tables
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  console.log('================================================================');
  console.log('COMPOSER → ILS TABLE SCHEMA INSPECTION');
  console.log('================================================================\n');

  const tables = [
    'tutorial_page_content_v2',
    'tutorial_sections',
    'tutorial_subtopics',
    'tutorial_navigation_progress',
    'block_learning_state',
    'tutorial_blocks',
    'tutorial_block_instances',
  ];

  for (const tableName of tables) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`TABLE: ${tableName}`);
    console.log('='.repeat(70));

    // Check if table exists
    const tableExistsResult = await tutorialPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);

    if (!tableExistsResult.rows[0].exists) {
      console.log(`\n❌ Table does NOT exist\n`);
      continue;
    }

    console.log(`\n✅ Table exists\n`);

    // Get all columns
    const columnsResult = await tutorialPool.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    console.log('COLUMNS:\n');
    columnsResult.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const def = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name}`);
      console.log(`    Type: ${col.data_type}${length}`);
      console.log(`    ${nullable} ${def}`);
      console.log('');
    });

    // Get primary key
    const pkResult = await tutorialPool.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
        AND i.indisprimary
    `, [tableName]);

    if (pkResult.rows.length > 0) {
      console.log('PRIMARY KEY:');
      pkResult.rows.forEach(row => {
        console.log(`  ${row.attname}`);
      });
      console.log('');
    }

    // Get foreign keys
    const fkResult = await tutorialPool.query(`
      SELECT
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
        AND tc.table_name = $1
      ORDER BY kcu.column_name
    `, [tableName]);

    if (fkResult.rows.length > 0) {
      console.log('FOREIGN KEYS:');
      fkResult.rows.forEach(row => {
        console.log(`  ${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
      console.log('');
    }

    // Get indexes
    const indexResult = await tutorialPool.query(`
      SELECT
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = $1
        AND t.relkind = 'r'
      ORDER BY i.relname, a.attnum
    `, [tableName]);

    if (indexResult.rows.length > 0) {
      console.log('INDEXES:');
      const indexGroups = {};
      indexResult.rows.forEach(row => {
        if (!indexGroups[row.index_name]) {
          indexGroups[row.index_name] = {
            columns: [],
            unique: row.is_unique
          };
        }
        indexGroups[row.index_name].columns.push(row.column_name);
      });
      
      Object.keys(indexGroups).forEach(indexName => {
        const idx = indexGroups[indexName];
        const unique = idx.unique ? 'UNIQUE' : '';
        console.log(`  ${indexName} ${unique}`);
        console.log(`    Columns: ${idx.columns.join(', ')}`);
      });
      console.log('');
    }

    // Get row count
    try {
      const countResult = await tutorialPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`ROW COUNT: ${countResult.rows[0].count}`);
    } catch (err) {
      console.log(`ROW COUNT: Error - ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('SCHEMA INSPECTION COMPLETE');
  console.log('================================================================\n');

  await tutorialPool.end();
}

main().catch(err => {
  console.error('SCHEMA INSPECTION ERROR:', err);
  process.exit(1);
});
