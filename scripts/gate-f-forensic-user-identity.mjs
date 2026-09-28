/**
 * Gate F Forensic - User Identity Investigation
 * 
 * PURPOSE:
 * Determine the EXACT user ID used by the ILS API vs the reset script.
 * 
 * HYPOTHESIS:
 * The reset script may have queried with originalUserId (b438fb19...)
 * while the API uses shadowUserId (afc355ca...).
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Pool } = pg;

const STUDENT_EMAIL = 'student@skillupitacademy.com';
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';
const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  console.log('[FORENSIC] Investigating user identity discrepancy...\n');
  
  const tutorialPool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });
  
  const skillupPool = new Pool({
    connectionString: process.env.DATABASE_URL_SKILLUP,
  });
  
  try {
    // Step 1: Get user from SkillUp database
    console.log('[FORENSIC] Step 1: Query SkillUp users table...');
    const userResult = await skillupPool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [STUDENT_EMAIL]
    );
    
    if (userResult.rows.length === 0) {
      console.log('[FORENSIC] ❌ User not found in SkillUp users table');
      return;
    }
    
    const skillupUserId = userResult.rows[0].id;
    console.log('[FORENSIC] SkillUp users.id:', skillupUserId);
    console.log('[FORENSIC] Email:', userResult.rows[0].email);
    
    // Step 2: Check block_learning_state for BOTH potential user IDs
    console.log('\n[FORENSIC] Step 2: Query block_learning_state for SkillUp userId...');
    const skillupBlockState = await tutorialPool.query(`
      SELECT 
        id,
        user_id,
        navigation_node_id,
        block_id,
        block_version,
        active_time_sec,
        completed_at,
        visit_count,
        revision_count
      FROM block_learning_state
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND block_id = $3
        AND deleted_at IS NULL
    `, [skillupUserId, NAVIGATION_NODE_ID, D1_BLOCK_ID]);
    
    if (skillupBlockState.rows.length === 0) {
      console.log('[FORENSIC] No block_learning_state for SkillUp userId');
    } else {
      console.log('[FORENSIC] ✅ FOUND block_learning_state:');
      console.log('[FORENSIC]   active_time_sec:', skillupBlockState.rows[0].active_time_sec);
      console.log('[FORENSIC]   completed_at:', skillupBlockState.rows[0].completed_at);
      console.log('[FORENSIC]   visit_count:', skillupBlockState.rows[0].visit_count);
    }
    
    // Step 3: Query ALL block_learning_state for this block (any user)
    console.log('\n[FORENSIC] Step 3: Query ALL users with D1 block_learning_state...');
    const allBlockStates = await tutorialPool.query(`
      SELECT 
        id,
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
      WHERE navigation_node_id = $1
        AND block_id = $2
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 10
    `, [NAVIGATION_NODE_ID, D1_BLOCK_ID]);
    
    console.log(`[FORENSIC] Found ${allBlockStates.rows.length} block_learning_state records for D1`);
    
    allBlockStates.rows.forEach((row, index) => {
      console.log(`\n[FORENSIC] Record ${index + 1}:`);
      console.log('[FORENSIC]   user_id:', row.user_id);
      console.log('[FORENSIC]   active_time_sec:', row.active_time_sec);
      console.log('[FORENSIC]   completed_at:', row.completed_at);
      console.log('[FORENSIC]   visit_count:', row.visit_count);
      console.log('[FORENSIC]   created_at:', row.created_at);
      console.log('[FORENSIC]   updated_at:', row.updated_at);
      
      if (row.user_id === skillupUserId) {
        console.log('[FORENSIC]   ⭐ MATCHES SkillUp users.id');
      }
      
      // Check if this is the 530-second record
      if (row.active_time_sec === 530) {
        console.log('[FORENSIC]   🔴 THIS IS THE 530-SECOND RECORD');
      }
    });
    
    // Step 4: Summary
    console.log('\n[FORENSIC] ========================================');
    console.log('[FORENSIC] SUMMARY');
    console.log('[FORENSIC] ========================================');
    console.log('[FORENSIC] SkillUp users.id:', skillupUserId);
    console.log('[FORENSIC] Block states found:', allBlockStates.rows.length);
    console.log('[FORENSIC]');
    
    if (allBlockStates.rows.length === 0) {
      console.log('[FORENSIC] ✅ No block_learning_state exists for D1');
      console.log('[FORENSIC] If API returned 530, investigate:');
      console.log('[FORENSIC]   - Durable client queue replay');
      console.log('[FORENSIC]   - POST creating state after reset');
      console.log('[FORENSIC]   - Different database');
    } else {
      const has530 = allBlockStates.rows.some(r => r.active_time_sec === 530);
      if (has530) {
        console.log('[FORENSIC] ⚠️  FOUND 530-SECOND RECORD IN DATABASE');
        console.log('[FORENSIC] This proves state existed at query time');
      }
      
      const matchesSkillup = allBlockStates.rows.some(r => r.user_id === skillupUserId);
      if (!matchesSkillup && allBlockStates.rows.length > 0) {
        console.log('[FORENSIC] ⚠️  NO RECORDS MATCH SkillUp users.id');
        console.log('[FORENSIC] Possible shadow/external user ID in use');
      }
    }
    
  } catch (error) {
    console.error('[FORENSIC] ❌ Error:', error.message);
    throw error;
  } finally {
    await tutorialPool.end();
    await skillupPool.end();
  }
}

main().catch(console.error);
