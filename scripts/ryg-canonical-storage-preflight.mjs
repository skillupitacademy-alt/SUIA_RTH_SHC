#!/usr/bin/env node
/**
 * R/Y/G Canonical Storage Preflight
 *
 * PURPOSE:
 *   Prove which database structures are authoritative for
 *   page/block completion before any reset or mutation occurs.
 *
 * IMPORTANT:
 *   READ ONLY.
 *   No INSERT.
 *   No UPDATE.
 *   No DELETE.
 *   No migrations.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL || process.env.TUTORIAL_DATABASE_URL || process.env.DATABASE_URL,
});

const USER_ID =
  process.env.RYG_USER_ID ||
  'afc355ca-6bae-4165-89dd-198494a62f85';

const NAVIGATION_NODE_ID = 'whatisjava';

const BLOCKS = [
  {
    blockId: '7ffd2ee6-ec25-456d-9f0c-a85dc9e67b17',
    blockVersion: 'I1',
    blockType: 'introduction',
  },
  {
    blockId: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749',
    blockVersion: 'D1',
    blockType: 'definition',
  },
  {
    blockId: 'bb5dd80e-4b94-413f-8d46-b28d6e71f47f',
    blockVersion: 'C1',
    blockType: 'code',
  },
];

async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
  `, [tableName]);

  return result.rows[0].exists;
}

async function columnExists(tableName, columnName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists
  `, [tableName, columnName]);

  return result.rows[0].exists;
}

async function main() {
  console.log('\n==========================================');
  console.log('R/Y/G CANONICAL STORAGE PREFLIGHT');
  console.log('==========================================\n');

  console.log('User:', USER_ID);
  console.log('Navigation:', NAVIGATION_NODE_ID);
  
  // First, verify we can connect and see what database we're in
  console.log('\n--- DATABASE CONNECTION ---');
  const dbInfo = await pool.query(`
    SELECT current_database() as database,
           current_schema() as schema,
           version() as pg_version
  `);
  console.dir(dbInfo.rows[0], { depth: null });
  
  // List all tables to see what actually exists
  console.log('\n--- ALL TABLES IN PUBLIC SCHEMA ---');
  const allTables = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  console.log(`Found ${allTables.rows.length} tables:`);
  allTables.rows.forEach(row => console.log(`  - ${row.tablename}`));

  console.log('\n--- TABLE EXISTENCE ---');

  const tables = [
    'tutorial_navigation_progress',
    'block_learning_state',
    'tutorial_blocks_completed',
  ];

  for (const table of tables) {
    console.log(
      `${table}:`,
      await tableExists(table)
        ? 'EXISTS'
        : 'NOT FOUND'
    );
  }

  console.log('\n--- NAVIGATION PROGRESS COLUMNS ---');

  for (const column of [
    'completed_blocks',
    'status',
    'time_spent_active_sec',
    'visit_count',
    'revision_count',
    'completed_at',
  ]) {
    console.log(
      `${column}:`,
      await columnExists(
        'tutorial_navigation_progress',
        column
      )
        ? 'EXISTS'
        : 'NOT FOUND'
    );
  }
  
  console.log('\n--- IMPORTANT NOTE ---');
  console.log('completed_block_count and total_block_count are COMPUTED at service layer');
  console.log('  - completedBlockCount = completedBlocks.length');
  console.log('  - totalBlockCount = requiredBlocks.length (from section catalog)');

  console.log('\n--- CURRENT NAVIGATION STATE ---');

  const navigationResult = await pool.query(`
    SELECT
      user_id,
      navigation_node_id,
      status,
      completed_blocks,
      time_spent_active_sec,
      visit_count,
      revision_count,
      completed_at
    FROM tutorial_navigation_progress
    WHERE user_id = $1
      AND navigation_node_id = $2
      AND deleted_at IS NULL
  `, [USER_ID, NAVIGATION_NODE_ID]);

  console.dir(navigationResult.rows, {
    depth: null,
  });

  console.log('\n--- BLOCK LEARNING STATE ---');

  const blockResult = await pool.query(`
    SELECT
      user_id,
      navigation_node_id,
      block_id,
      block_version,
      visit_count,
      revision_count,
      active_time_sec,
      expected_time_sec,
      completed_at
    FROM block_learning_state
    WHERE user_id = $1
      AND navigation_node_id = $2
    ORDER BY block_version
  `, [USER_ID, NAVIGATION_NODE_ID]);

  console.dir(blockResult.rows, {
    depth: null,
  });

  console.log('\n--- TARGET BLOCKS ---');

  for (const block of BLOCKS) {
    const result = await pool.query(`
      SELECT
        block_id,
        block_version,
        visit_count,
        revision_count,
        active_time_sec,
        expected_time_sec,
        completed_at
      FROM block_learning_state
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND block_id = $3
        AND block_version = $4
    `, [USER_ID, NAVIGATION_NODE_ID, block.blockId, block.blockVersion]);

    console.log(`\n${block.blockVersion}:`);
    console.dir(result.rows, { depth: null });
  }

  console.log('\n==========================================');
  console.log('READ-ONLY PREFLIGHT COMPLETE');
  console.log('==========================================\n');
}

main()
  .catch((error) => {
    console.error('\nPREFLIGHT FAILED\n');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
