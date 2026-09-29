#!/usr/bin/env node
/**
 * ILS / LSNB R-Y-G Forensic Preflight
 * 
 * PURPOSE:
 * Read-only investigation of I1, D1, C1 blocks to determine:
 * 1. Exact block identities
 * 2. Current learner state
 * 3. Whether R/Y/G implementation exists
 * 4. Reset feasibility
 * 5. Certification test plan
 * 
 * NO PRODUCTION MODIFICATIONS
 * NO DATABASE MUTATIONS
 * NO INVENTED THRESHOLDS
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

// From existing successful scripts
const USER_ID = 'afc355ca-6bae-4165-89dd-198494a62f85'; // shadowUserId
const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SECTION_ID = '45f4e65b-2178-4bca-867e-9377f064fb20';

// From check-whatisjava-current-state.mjs
const BLOCKS = {
  I1: {
    blockId: '7ffd2ee6-ec25-456d-9f0c-a85dc9e67b17',
    blockVersion: 'I1',
    blockType: 'introduction',
    name: 'Introduction',
  },
  D1: {
    blockId: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749',
    blockVersion: 'D1',
    blockType: 'definition',
    name: 'Definition',
  },
  C1: {
    blockId: 'bb5dd80e-4b94-413f-8d46-b28d6e71f47f',
    blockVersion: 'C1',
    blockType: 'code',
    name: 'Code',
  },
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('');
    console.log('============================================================');
    console.log('ILS / LSNB R-Y-G FORENSIC PREFLIGHT');
    console.log('============================================================');
    console.log('');

    // A. BLOCK IDENTITY
    console.log('============================================================');
    console.log('A. BLOCK IDENTITY');
    console.log('============================================================');
    console.log('');
    
    console.log('Navigation Context:');
    console.log(`  navigationNodeId: ${NAVIGATION_NODE_ID}`);
    console.log(`  subtopicId: ${SUBTOPIC_ID}`);
    console.log(`  sectionId: ${SECTION_ID}`);
    console.log('');

    for (const [key, block] of Object.entries(BLOCKS)) {
      console.log(`${key}:`);
      console.log(`  blockId: ${block.blockId}`);
      console.log(`  blockVersion: ${block.blockVersion}`);
      console.log(`  blockType: ${block.blockType}`);
      console.log(`  name: ${block.name}`);
      
      // Query expected time from database
      const expectedResult = await pool.query(
        `SELECT expected_time_sec FROM block_learning_state 
         WHERE user_id = $1 AND navigation_node_id = $2 
           AND block_id = $3 AND block_version = $4
         LIMIT 1`,
        [USER_ID, NAVIGATION_NODE_ID, block.blockId, block.blockVersion]
      );
      
      if (expectedResult.rows.length > 0) {
        console.log(`  expectedTimeSec: ${expectedResult.rows[0].expected_time_sec}`);
      } else {
        console.log(`  expectedTimeSec: NOT YET RECORDED`);
      }
      console.log('');
    }

    // B. LEARNER IDENTITY
    console.log('============================================================');
    console.log('B. LEARNER IDENTITY');
    console.log('============================================================');
    console.log('');
    console.log(`Application user (shadowUserId): ${USER_ID}`);
    console.log(`ILS learner identity: ${USER_ID} (same)`);
    console.log(`Navigation node: ${NAVIGATION_NODE_ID}`);
    console.log(`Subtopic: ${SUBTOPIC_ID}`);
    console.log('');

    // C. CURRENT STATE
    console.log('============================================================');
    console.log('C. CURRENT STATE');
    console.log('============================================================');
    console.log('');

    // Navigation progress
    const progressResult = await pool.query(
      `SELECT status, completed_blocks, 
              time_spent_active_sec, visit_count, revision_count,
              first_viewed_at, last_viewed_at, completed_at
       FROM tutorial_navigation_progress
       WHERE user_id = $1 AND navigation_node_id = $2`,
      [USER_ID, NAVIGATION_NODE_ID]
    );

    console.log('Navigation Progress:');
    if (progressResult.rows.length === 0) {
      console.log('  ❌ No record found');
    } else {
      const prog = progressResult.rows[0];
      console.log(`  status: ${prog.status}`);
      console.log(`  completedBlockCount: ${prog.completed_blocks?.length || 0}`);
      console.log(`  timeSpentActiveSec: ${prog.time_spent_active_sec}`);
      console.log(`  visitCount: ${prog.visit_count}`);
      console.log(`  revisionCount: ${prog.revision_count}`);
      console.log(`  firstViewedAt: ${prog.first_viewed_at}`);
      console.log(`  lastViewedAt: ${prog.last_viewed_at}`);
      console.log(`  completedAt: ${prog.completed_at || 'NULL'}`);
      
      if (prog.completed_blocks?.length > 0) {
        console.log('  completed_blocks:');
        prog.completed_blocks.forEach((cb, idx) => {
          console.log(`    [${idx}] ${cb.blockVersion} @ ${cb.completedAt}`);
        });
      }
    }
    console.log('');

    // Block-level state
    console.log('Block Learning State:');
    console.log('');
    console.log('┌────────┬────────┬───────────┬─────────────┬───────────────┬───────────┬────────────┐');
    console.log('│ Block  │ Visits │ Revisions │ Active Time │ Expected Time │ Completed │ CompletedAt│');
    console.log('├────────┼────────┼───────────┼─────────────┼───────────────┼───────────┼────────────┤');

    for (const [key, block] of Object.entries(BLOCKS)) {
      const stateResult = await pool.query(
        `SELECT visit_count, revision_count, active_time_sec, expected_time_sec, 
                completed_at, first_viewed_at, last_viewed_at
         FROM block_learning_state
         WHERE user_id = $1 AND navigation_node_id = $2 
           AND block_id = $3 AND block_version = $4`,
        [USER_ID, NAVIGATION_NODE_ID, block.blockId, block.blockVersion]
      );

      if (stateResult.rows.length === 0) {
        console.log(`│ ${key.padEnd(6)} │ ${'-'.padEnd(6)} │ ${'-'.padEnd(9)} │ ${'-'.padEnd(11)} │ ${'-'.padEnd(13)} │ ${'-'.padEnd(9)} │ ${'-'.padEnd(10)} │`);
      } else {
        const s = stateResult.rows[0];
        const visits = String(s.visit_count || 0).padEnd(6);
        const revisions = String(s.revision_count || 0).padEnd(9);
        const activeTime = String(s.active_time_sec || 0).padEnd(11);
        const expectedTime = String(s.expected_time_sec || '-').padEnd(13);
        const completed = (s.completed_at ? 'true' : 'false').padEnd(9);
        const completedAt = (s.completed_at ? new Date(s.completed_at).toISOString().substring(0, 10) : 'NULL').padEnd(10);
        
        console.log(`│ ${key.padEnd(6)} │ ${visits} │ ${revisions} │ ${activeTime} │ ${expectedTime} │ ${completed} │ ${completedAt} │`);
      }
    }
    console.log('└────────┴────────┴───────────┴─────────────┴───────────────┴───────────┴────────────┘');
    console.log('');

    // D. R/Y/G IMPLEMENTATION DISCOVERY
    console.log('============================================================');
    console.log('D. R/Y/G IMPLEMENTATION DISCOVERY');
    console.log('============================================================');
    console.log('');
    console.log('⚠️  This requires source code analysis.');
    console.log('   Will be performed separately via grep/file search.');
    console.log('');

    // E. R/Y/G CONTRACT STATUS
    console.log('============================================================');
    console.log('E. R/Y/G CONTRACT STATUS');
    console.log('============================================================');
    console.log('');
    console.log('Status: REQUIRES SOURCE CODE INVESTIGATION');
    console.log('');

    // F. RESET PLAN
    console.log('============================================================');
    console.log('F. RESET PLAN (Proposed - NOT EXECUTED)');
    console.log('============================================================');
    console.log('');
    console.log('Target rows:');
    console.log('  Table: block_learning_state');
    console.log(`  WHERE user_id = '${USER_ID}'`);
    console.log(`    AND navigation_node_id = '${NAVIGATION_NODE_ID}'`);
    console.log(`    AND block_id IN (`);
    for (const [key, block] of Object.entries(BLOCKS)) {
      console.log(`      '${block.blockId}',  -- ${key}`);
    }
    console.log(`    )`);
    console.log('');
    console.log('  Table: tutorial_navigation_progress.completed_blocks');
    console.log(`  WHERE user_id = '${USER_ID}'`);
    console.log(`    AND navigation_node_id = '${NAVIGATION_NODE_ID}'`);
    console.log(`    -- Remove I1, D1, C1 from JSONB array`);
    console.log('');
    console.log('Reset Strategy: DELETE from block_learning_state + JSON array manipulation');
    console.log('Safety: Scoped to single user + single navigation + specific blocks only');
    console.log('Rollback: Transaction-based');
    console.log('');

    // G. CERTIFICATION PLAN
    console.log('============================================================');
    console.log('G. CERTIFICATION PLAN (Proposed)');
    console.log('============================================================');
    console.log('');
    console.log('Test Sequence:');
    console.log('  1. Reset I1, D1, C1 state');
    console.log('  2. Load tutorial page (whatisjava)');
    console.log('  3. Capture initial state (all blocks fresh)');
    console.log('  4. Activate I1 → accumulate time → observe state changes');
    console.log('  5. Capture I1 state + R/Y/G if exists');
    console.log('  6. Activate D1 → accumulate time → observe state changes');
    console.log('  7. Capture D1 state + R/Y/G if exists');
    console.log('  8. Activate C1 → accumulate time → observe state changes');
    console.log('  9. Capture C1 state + R/Y/G if exists');
    console.log('  10. Reload page');
    console.log('  11. Verify persistence');
    console.log('  12. Determine R/Y/G transitions');
    console.log('');
    console.log('Evidence Required:');
    console.log('  - Network requests/responses');
    console.log('  - Database state at each checkpoint');
    console.log('  - Browser console logs');
    console.log('  - DOM state');
    console.log('  - R/Y/G calculation inputs/outputs');
    console.log('');

    // H. GO / NO-GO
    console.log('============================================================');
    console.log('H. GO / NO-GO DECISION');
    console.log('============================================================');
    console.log('');
    console.log('Current Assessment: PENDING SOURCE CODE ANALYSIS');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Search codebase for R/Y/G implementation');
    console.log('  2. Determine if thresholds are authoritative');
    console.log('  3. Verify runtime reachability');
    console.log('  4. Assess block-level vs page-level calculation');
    console.log('  5. Determine final GO/NO-GO');
    console.log('');
    console.log('============================================================');
    console.log('END OF DATABASE FORENSICS');
    console.log('============================================================');
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
