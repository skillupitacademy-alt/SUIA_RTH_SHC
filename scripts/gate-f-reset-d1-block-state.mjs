/**
 * Gate F - Reset D1 Block Learning State
 * 
 * PURPOSE:
 * Clear D1 block_learning_state record to establish clean starting state for Gate F certification.
 * 
 * FORENSIC EVIDENCE:
 * Browser console showed:
 * - activeTimeSec: 530 (historical contamination)
 * - expectedTimeSec: 210
 * - shouldComplete: true (530 >= 168)
 * - Automatic completion triggered correctly
 * 
 * ROOT CAUSE:
 * The orchestrator behaves correctly. The test-state was contaminated with
 * 530 seconds of historical active time from block_learning_state table.
 * 
 * SCOPE:
 * This script ONLY resets block_learning_state for D1.
 * It does NOT modify:
 * - tutorial_navigation_progress (page-level completion tracking)
 * - telemetry events
 * - other blocks (I1, C1)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Pool } = pg;

const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';
const STUDENT_EMAIL = 'student@skillupitacademy.com';
const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  console.log('[GATE F RESET] Starting D1 block learning state reset...');
  console.log('[GATE F RESET] Target:', {
    user: STUDENT_EMAIL,
    navigationNode: NAVIGATION_NODE_ID,
    blockId: D1_BLOCK_ID,
  });
  
  const tutorialPool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });
  
  const skillupPool = new Pool({
    connectionString: process.env.DATABASE_URL_SKILLUP,
  });
  
  try {
    // Step 1: Get user ID
    console.log('\n[GATE F RESET] Step 1: Looking up user...');
    const userResult = await skillupPool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [STUDENT_EMAIL]
    );
    
    if (userResult.rows.length === 0) {
      console.log('[GATE F RESET] ❌ User not found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('[GATE F RESET] ✅ User found:', userId);
    
    // Step 2: Check current block_learning_state
    console.log('\n[GATE F RESET] Step 2: Inspecting current block_learning_state...');
    const currentState = await tutorialPool.query(`
      SELECT 
        id,
        block_id,
        block_version,
        navigation_node_id,
        active_time_sec,
        completed_at,
        visit_count,
        revision_count,
        first_viewed_at,
        last_viewed_at
      FROM block_learning_state
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND block_id = $3
        AND deleted_at IS NULL
    `, [userId, NAVIGATION_NODE_ID, D1_BLOCK_ID]);
    
    if (currentState.rows.length === 0) {
      console.log('[GATE F RESET] ℹ️  No block_learning_state record exists for D1');
      console.log('[GATE F RESET] D1 is already in clean state');
      return;
    }
    
    const state = currentState.rows[0];
    console.log('[GATE F RESET] Current state:', {
      active_time_sec: state.active_time_sec,
      completed_at: state.completed_at,
      visit_count: state.visit_count,
      revision_count: state.revision_count,
      first_viewed_at: state.first_viewed_at,
      last_viewed_at: state.last_viewed_at,
    });
    
    // Step 3: Delete the block_learning_state record
    console.log('\n[GATE F RESET] Step 3: Deleting block_learning_state record...');
    
    const deleteResult = await tutorialPool.query(`
      DELETE FROM block_learning_state
      WHERE id = $1
      RETURNING id
    `, [state.id]);
    
    if (deleteResult.rowCount === 0) {
      console.log('[GATE F RESET] ❌ Failed to delete record');
      return;
    }
    
    console.log('[GATE F RESET] ✅ Record deleted');
    
    // Step 4: Verify deletion
    console.log('\n[GATE F RESET] Step 4: Verifying deletion...');
    const verifyResult = await tutorialPool.query(`
      SELECT COUNT(*) as count
      FROM block_learning_state
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND block_id = $3
        AND deleted_at IS NULL
    `, [userId, NAVIGATION_NODE_ID, D1_BLOCK_ID]);
    
    const remainingCount = parseInt(verifyResult.rows[0].count);
    
    if (remainingCount > 0) {
      console.log('[GATE F RESET] ❌ VERIFICATION FAILED: Record still exists');
    } else {
      console.log('[GATE F RESET] ✅ VERIFICATION PASSED: Record deleted');
      console.log('\n[GATE F RESET] ========================================');
      console.log('[GATE F RESET] D1 block learning state is now clean');
      console.log('[GATE F RESET] ========================================');
      console.log('\n[GATE F RESET] Expected behavior on next page load:');
      console.log('[GATE F RESET]   - ILSProvider will fetch progress');
      console.log('[GATE F RESET]   - D1 will have NO block_learning_state record');
      console.log('[GATE F RESET]   - ILSProvider will return default state:');
      console.log('[GATE F RESET]       activeTimeSec: 0');
      console.log('[GATE F RESET]       isCompleted: false');
      console.log('[GATE F RESET]       visitCount: 0');
      console.log('\n[GATE F RESET] Gate F can now be certified with clean state');
    }
    
  } catch (error) {
    console.error('[GATE F RESET] ❌ Error:', error.message);
    throw error;
  } finally {
    await tutorialPool.end();
    await skillupPool.end();
  }
}

main().catch(console.error);
