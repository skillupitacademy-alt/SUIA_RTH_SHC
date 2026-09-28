#!/usr/bin/env node

/**
 * Gate H: D1 Full State Reset
 * 
 * Purpose: Reset BOTH tables for clean Gate H certification
 * 
 * Clears:
 * 1. block_learning_state (activeTimeSec, completedAt)
 * 2. tutorial_navigation_progress.completed_blocks (authoritative completion)
 * 
 * Target:
 * - user_id: afc355ca-6bae-4165-89dd-198494a62f85 (shadowUserId)
 * - navigation_node_id: whatisjava
 * - block_id: 8680bd00-ecfe-4da7-a78f-9b6a0b6a1749 (Java D1)
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
const BLOCK_VERSION = 'D1';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== Gate H: D1 Full State Reset ===\n');
    console.log('Target:');
    console.log(`  userId: ${CORRECT_SHADOW_USER_ID} (shadowUserId from JWT)`);
    console.log(`  navigationNodeId: ${NAVIGATION_NODE_ID}`);
    console.log(`  blockId: ${BLOCK_ID}`);
    console.log(`  blockVersion: ${BLOCK_VERSION}`);
    console.log('');

    // Step 1: Delete block_learning_state
    console.log('STEP 1: Deleting block_learning_state record...');
    const deleteBlockState = await pool.query(
      `DELETE FROM block_learning_state
       WHERE user_id = $1
         AND navigation_node_id = $2
         AND block_id = $3
       RETURNING block_version, active_time_sec, completed_at`,
      [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID, BLOCK_ID]
    );

    if (deleteBlockState.rowCount === 0) {
      console.log('  ✅ No block_learning_state found (already clean)');
    } else {
      console.log(`  ✅ Deleted ${deleteBlockState.rowCount} record(s):`);
      deleteBlockState.rows.forEach((row, idx) => {
        console.log(`    [${idx}] version=${row.block_version}, activeTimeSec=${row.active_time_sec}, completedAt=${row.completed_at}`);
      });
    }

    // Step 2: Remove from tutorial_navigation_progress.completed_blocks
    console.log('\nSTEP 2: Querying tutorial_navigation_progress...');
    const progressQuery = await pool.query(
      `SELECT id, completed_blocks
       FROM tutorial_navigation_progress
       WHERE user_id = $1
         AND navigation_node_id = $2`,
      [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID]
    );

    if (progressQuery.rows.length === 0) {
      console.log('  ⚠️  No tutorial_navigation_progress record found');
    } else {
      const record = progressQuery.rows[0];
      const completedBlocks = record.completed_blocks || [];
      
      console.log(`  Found progress record (id: ${record.id})`);
      console.log(`  Current completed_blocks: ${completedBlocks.length} entries`);
      
      // Find D1 completion
      const d1Completion = completedBlocks.find(
        (c) => c.blockId === BLOCK_ID && c.blockVersion === BLOCK_VERSION
      );

      if (!d1Completion) {
        console.log(`  ✅ D1 block not in completed_blocks (already clean)`);
      } else {
        console.log(`  Found D1 completion: ${JSON.stringify(d1Completion)}`);
        
        // Remove D1 from completed_blocks
        const updatedBlocks = completedBlocks.filter(
          (c) => !(c.blockId === BLOCK_ID && c.blockVersion === BLOCK_VERSION)
        );

        console.log('\nSTEP 3: Removing D1 from completed_blocks...');
        const updateResult = await pool.query(
          `UPDATE tutorial_navigation_progress
           SET completed_blocks = $1,
               updated_at = NOW()
           WHERE id = $2
           RETURNING completed_blocks`,
          [JSON.stringify(updatedBlocks), record.id]
        );

        console.log(`  ✅ Updated: ${updatedBlocks.length} blocks remaining`);
        console.log(`  Removed 1 D1 completion record`);
      }
    }

    // Step 3: Verify clean state
    console.log('\nSTEP 4: Verifying clean state...');
    
    const verifyBlockState = await pool.query(
      `SELECT COUNT(*) as count
       FROM block_learning_state
       WHERE user_id = $1
         AND navigation_node_id = $2
         AND block_id = $3`,
      [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID, BLOCK_ID]
    );

    const blockStateCount = parseInt(verifyBlockState.rows[0].count);
    console.log(`  block_learning_state: ${blockStateCount === 0 ? '✅' : '❌'} ${blockStateCount} records`);

    const verifyProgress = await pool.query(
      `SELECT completed_blocks
       FROM tutorial_navigation_progress
       WHERE user_id = $1
         AND navigation_node_id = $2`,
      [CORRECT_SHADOW_USER_ID, NAVIGATION_NODE_ID]
    );

    if (verifyProgress.rows.length > 0) {
      const completedBlocks = verifyProgress.rows[0].completed_blocks || [];
      const d1Present = completedBlocks.some(
        (c) => c.blockId === BLOCK_ID && c.blockVersion === BLOCK_VERSION
      );
      console.log(`  completed_blocks: ${!d1Present ? '✅' : '❌'} D1 ${d1Present ? 'present' : 'absent'}`);
    } else {
      console.log(`  completed_blocks: ⚠️  No progress record`);
    }

    console.log('\n=== Reset Complete ===\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
