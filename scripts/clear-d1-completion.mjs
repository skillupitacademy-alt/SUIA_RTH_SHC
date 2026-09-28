/**
 * Clear D1 Block Completion State
 * 
 * Removes the D1 block ID from the completed_blocks array in tutorial_navigation_progress
 * for the E2E test user, allowing fresh F/G/H certification testing.
 * 
 * Target:
 * - User: student@skillupitacademy.com
 * - Navigation Node: whatisjava
 * - Block: D1 (8680bd00-ecfe-4da7-a78f-9b6a0b6a1749)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from workspace root
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Pool } = pg;

const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';
const STUDENT_EMAIL = 'student@skillupitacademy.com';
const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  console.log('[CLEAR D1] Starting D1 completion state reset...');
  console.log('[CLEAR D1] Target user:', STUDENT_EMAIL);
  console.log('[CLEAR D1] Navigation node:', NAVIGATION_NODE_ID);
  console.log('[CLEAR D1] Block ID:', D1_BLOCK_ID);
  
  // Connect to tutorial database
  const tutorialPool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });
  
  // Connect to skillup database (for user lookup)
  const skillupPool = new Pool({
    connectionString: process.env.DATABASE_URL_SKILLUP,
  });
  
  try {
    // Step 1: Get user ID from email
    console.log('\n[CLEAR D1] Step 1: Looking up user ID...');
    const userResult = await skillupPool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [STUDENT_EMAIL]
    );
    
    if (userResult.rows.length === 0) {
      console.log('[CLEAR D1] ❌ User not found:', STUDENT_EMAIL);
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('[CLEAR D1] ✅ User found:', userId);
    
    // Step 2: Get current progress state
    console.log('\n[CLEAR D1] Step 2: Checking current progress state...');
    const progressResult = await tutorialPool.query(
      `SELECT 
        id, 
        completed_blocks, 
        status,
        time_spent_active_sec,
        visit_count,
        completed_at
       FROM tutorial_navigation_progress 
       WHERE user_id = $1 
       AND navigation_node_id = $2
       AND deleted_at IS NULL`,
      [userId, NAVIGATION_NODE_ID]
    );
    
    if (progressResult.rows.length === 0) {
      console.log('[CLEAR D1] ⚠️  No progress record found for this tutorial');
      console.log('[CLEAR D1] D1 is already in clean/incomplete state');
      return;
    }
    
    const progress = progressResult.rows[0];
    const completedBlocks = progress.completed_blocks || [];
    
    console.log('[CLEAR D1] Current state:');
    console.log('[CLEAR D1]   Status:', progress.status);
    console.log('[CLEAR D1]   Completed blocks:', completedBlocks);
    console.log('[CLEAR D1]   Time spent:', progress.time_spent_active_sec, 'seconds');
    console.log('[CLEAR D1]   Visit count:', progress.visit_count);
    console.log('[CLEAR D1]   Completed at:', progress.completed_at);
    
    // Check if D1 is in completed_blocks
    const d1Index = completedBlocks.indexOf(D1_BLOCK_ID);
    
    if (d1Index === -1) {
      console.log('\n[CLEAR D1] ✅ D1 is NOT in completed_blocks array');
      console.log('[CLEAR D1] No changes needed - D1 already in clean state');
      return;
    }
    
    console.log('\n[CLEAR D1] ⚠️  D1 IS in completed_blocks at index:', d1Index);
    
    // Step 3: Remove D1 from completed_blocks
    console.log('[CLEAR D1] Step 3: Removing D1 from completed_blocks...');
    
    const newCompletedBlocks = completedBlocks.filter(id => id !== D1_BLOCK_ID);
    
    const updateResult = await tutorialPool.query(
      `UPDATE tutorial_navigation_progress
       SET 
         completed_blocks = $1::jsonb,
         updated_at = NOW()
       WHERE id = $2
       RETURNING completed_blocks, status`,
      [JSON.stringify(newCompletedBlocks), progress.id]
    );
    
    console.log('[CLEAR D1] ✅ Update successful');
    console.log('[CLEAR D1] New completed_blocks:', updateResult.rows[0].completed_blocks);
    console.log('[CLEAR D1] Status:', updateResult.rows[0].status);
    
    // Step 4: Verify
    console.log('\n[CLEAR D1] Step 4: Verifying final state...');
    const verifyResult = await tutorialPool.query(
      `SELECT completed_blocks FROM tutorial_navigation_progress WHERE id = $1`,
      [progress.id]
    );
    
    const finalBlocks = verifyResult.rows[0].completed_blocks || [];
    const stillHasD1 = finalBlocks.includes(D1_BLOCK_ID);
    
    if (stillHasD1) {
      console.log('[CLEAR D1] ❌ VERIFICATION FAILED: D1 still in completed_blocks');
    } else {
      console.log('[CLEAR D1] ✅ VERIFICATION PASSED: D1 removed from completed_blocks');
      console.log('[CLEAR D1] ');
      console.log('[CLEAR D1] ========================================');
      console.log('[CLEAR D1] D1 block is now ready for F/G/H certification');
      console.log('[CLEAR D1] ========================================');
      console.log('[CLEAR D1]');
      console.log('[CLEAR D1] Next step: Run the F/G/H test with proper timeout');
      console.log('[CLEAR D1]');
      console.log('[CLEAR D1] Command:');
      console.log('[CLEAR D1]   cd E:\\onlinewebsites\\quiz-platform');
      console.log('[CLEAR D1]   pnpm playwright test --grep "Gates F/G/H: Automatic completion full certification" --project=suia --timeout=360000');
    }
    
  } catch (error) {
    console.error('[CLEAR D1] ❌ Error:', error.message);
    throw error;
  } finally {
    await tutorialPool.end();
    await skillupPool.end();
  }
}

main().catch(console.error);
