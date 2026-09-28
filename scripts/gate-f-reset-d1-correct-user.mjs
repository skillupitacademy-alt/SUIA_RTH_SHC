#!/usr/bin/env node

/**
 * Gate F: D1 Block State Reset (CORRECTED)
 * 
 * Purpose: Delete block_learning_state record using CORRECT shadowUserId
 * 
 * Root cause identified:
 * - Previous script used b438fb19-fa32-4df4-93b4-91837a5a15ef (from users table)
 * - ILS API actually uses afc355ca-6bae-4165-89dd-198494a62f85 (shadowUserId from JWT)
 * - block_learning_state exists with 640 seconds for afc355ca
 * 
 * Target:
 * - user_id: afc355ca-6bae-4165-89dd-198494a62f85
 * - navigation_node_id: whatisjava
 * - block_id: 8680bd00-ecfe-4da7-a78f-9b6a0b6a1749
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const CORRECT_SHADOW_USER_ID = 'afc355ca-6bae-4165-89dd-198494a62f85';
const NAVIGATION_NODE_ID = 'whatisjava';
const BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== Gate F: D1 Block State Reset (Corrected) ===\n');
    console.log('Target:');
    console.log(`  userId: ${CORRECT_SHADOW_USER_ID} (shadowUserId from JWT)`);
    console.log(`  navigationNodeId: ${NAVIGATION_NODE_ID}`);
    console.log(`  blockId: ${BLOCK_ID}`);
    console.log('');

    // Query current state
    console.log('1. Querying current block_learning_state...');
    const queryResult = await pool.query(
      `SELECT 
        user_id,
        navigation_node_id,
        block_id,
        block_version,
        active_time_sec,
        completed_at,
        visit_count,
        created_at,
        updated_at
      FROM block_learning_state
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND block_id = $3`,
      [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID, BLOCK_ID]
    );

    if (queryResult.rows.length === 0) {
      console.log('   ✅ No block_learning_state found (already clean)');
    } else {
      console.log(`   Found ${queryResult.rows.length} record(s):`);
      queryResult.rows.forEach((row, idx) => {
        console.log(`   [${idx}]:`);
        console.log(`     block_version: ${row.block_version}`);
        console.log(`     active_time_sec: ${row.active_time_sec}`);
        console.log(`     completed_at: ${row.completed_at}`);
        console.log(`     visit_count: ${row.visit_count}`);
        console.log(`     created_at: ${row.created_at}`);
        console.log(`     updated_at: ${row.updated_at}`);
      });

      // Delete the record
      console.log('\n2. Deleting block_learning_state record...');
      const deleteResult = await pool.query(
        `DELETE FROM block_learning_state
         WHERE user_id = $1
           AND navigation_node_id = $2
           AND block_id = $3`,
        [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID, BLOCK_ID]
      );

      console.log(`   ✅ Deleted ${deleteResult.rowCount} record(s)`);
    }

    // Verify deletion
    console.log('\n3. Verifying deletion...');
    const verifyResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM block_learning_state
       WHERE user_id = $1
         AND navigation_node_id = $2
         AND block_id = $3`,
      [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID, BLOCK_ID]
    );

    const count = parseInt(verifyResult.rows[0].count);
    if (count === 0) {
      console.log('   ✅ Verification passed: block_learning_state is clean');
    } else {
      console.log(`   ❌ Verification failed: ${count} record(s) still exist`);
    }

    // Check for any other block_learning_state records for this user/navigation
    console.log('\n4. Checking for other block_learning_state records...');
    const otherRecordsResult = await pool.query(
      `SELECT 
        block_id,
        block_version,
        active_time_sec,
        completed_at
       FROM block_learning_state
       WHERE user_id = $1
         AND navigation_node_id = $2`,
      [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID]
    );

    if (otherRecordsResult.rows.length === 0) {
      console.log('   ℹ️  No other block_learning_state records for this user/navigation');
    } else {
      console.log(`   Found ${otherRecordsResult.rows.length} other record(s) for whatisjava:`);
      otherRecordsResult.rows.forEach((row, idx) => {
        console.log(`   [${idx}] blockId=${row.block_id.substring(0, 8)}..., version=${row.block_version}, activeTimeSec=${row.active_time_sec}, completed=${row.completed_at !== null}`);
      });
    }

    console.log('\n=== Reset Complete ===\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
