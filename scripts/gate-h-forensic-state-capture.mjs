#!/usr/bin/env node

/**
 * Gate H Forensic State Capture
 * 
 * Captures both persistence representations and compares them:
 * 1. tutorial_navigation_progress.completed_blocks (canonical)
 * 2. block_learning_state (per-block)
 * 
 * For both D1 and I1 blocks.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const USER_ID = 'afc355ca-6bae-4165-89dd-198494a62f85';
const NAVIGATION_NODE_ID = 'whatisjava';

const BLOCKS = {
  I1: {
    id: '7ffd2ee6-ec25-456d-9f0c-a85dc9e67b17',
    version: 'I1',
    name: 'Introduction',
    expectedTimeSec: 510,
  },
  D1: {
    id: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749',
    version: 'D1',
    name: 'Definition',
    expectedTimeSec: 210,
  },
  C1: {
    id: 'bb5dd80e-4b94-413f-8d46-b28d6e71f47f',
    version: 'C1',
    name: 'Code',
    expectedTimeSec: 210,
  },
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n========== GATE H FORENSIC STATE CAPTURE ==========\n');
    console.log(`User: ${USER_ID}`);
    console.log(`Navigation: ${NAVIGATION_NODE_ID}\n`);

    // ========================================
    // PART A: Canonical Navigation Completion
    // ========================================
    console.log('--- PART A: Canonical Navigation Completion ---\n');

    const progressResult = await pool.query(
      `SELECT id, completed_blocks, status, updated_at
       FROM tutorial_navigation_progress
       WHERE user_id = $1 AND navigation_node_id = $2`,
      [USER_ID, NAVIGATION_NODE_ID]
    );

    if (progressResult.rows.length === 0) {
      console.log('❌ No tutorial_navigation_progress record found\n');
      return;
    }

    const progress = progressResult.rows[0];
    const completedBlocks = progress.completed_blocks || [];

    console.log(`Status: ${progress.status}`);
    console.log(`Updated: ${progress.updated_at}`);
    console.log(`Completed blocks count: ${completedBlocks.length}\n`);

    const canonicalCompletions = {};

    completedBlocks.forEach((completion, idx) => {
      console.log(`[${idx}] Canonical Completion:`);
      console.log(`    blockId: ${completion.blockId}`);
      console.log(`    blockVersion: ${completion.blockVersion}`);
      console.log(`    completedAt: ${completion.completedAt}`);
      console.log('');

      // Store for comparison
      const key = `${completion.blockId}:${completion.blockVersion}`;
      canonicalCompletions[key] = completion.completedAt;
    });

    // ========================================
    // PART B: Per-Block Learning State
    // ========================================
    console.log('\n--- PART B: Per-Block Learning State ---\n');

    const blockStates = {};

    for (const [blockKey, block] of Object.entries(BLOCKS)) {
      console.log(`--- ${blockKey} (${block.name}) ---`);

      const stateResult = await pool.query(
        `SELECT
          block_id,
          block_version,
          active_time_sec,
          expected_time_sec,
          completed_at,
          visit_count,
          revision_count,
          first_viewed_at,
          last_viewed_at,
          updated_at
         FROM block_learning_state
         WHERE user_id = $1
           AND navigation_node_id = $2
           AND block_id = $3
           AND block_version = $4`,
        [USER_ID, NAVIGATION_NODE_ID, block.id, block.version]
      );

      if (stateResult.rows.length === 0) {
        console.log(`  ❌ No block_learning_state record\n`);
        blockStates[blockKey] = null;
        continue;
      }

      const state = stateResult.rows[0];
      blockStates[blockKey] = state;

      console.log(`  activeTimeSec: ${state.active_time_sec}s`);
      console.log(`  expectedTimeSec: ${state.expected_time_sec}s`);
      console.log(`  completedAt: ${state.completed_at || 'NULL'}`);
      console.log(`  visitCount: ${state.visit_count}`);
      console.log(`  revisionCount: ${state.revision_count}`);
      console.log(`  firstViewedAt: ${state.first_viewed_at}`);
      console.log(`  lastViewedAt: ${state.last_viewed_at}`);
      console.log(`  updated: ${state.updated_at}`);

      // Calculate threshold and auto-completion status
      const expectedTime = state.expected_time_sec;
      const activeTime = state.active_time_sec;
      const threshold = expectedTime * 0.8;
      const crossedThreshold = activeTime >= threshold;
      const shouldAutoComplete = crossedThreshold && !state.completed_at;

      console.log(`\n  Threshold (80%): ${threshold}s`);
      console.log(`  Crossed threshold: ${crossedThreshold ? 'YES ✅' : 'NO'}`);
      console.log(`  Should auto-complete: ${shouldAutoComplete ? 'YES ⚠️' : 'NO'}`);
      console.log('');
    }

    // ========================================
    // PART C: Comparison Table
    // ========================================
    console.log('\n--- PART C: Canonical vs Block State Comparison ---\n');

    for (const [blockKey, block] of Object.entries(BLOCKS)) {
      const key = `${block.id}:${block.version}`;
      const canonicalCompletedAt = canonicalCompletions[key];
      const blockState = blockStates[blockKey];

      console.log(`--- ${blockKey} (${block.name}) ---`);
      console.log(`  Canonical completed_blocks: ${canonicalCompletedAt || 'ABSENT'}`);
      console.log(`  block_learning_state.completedAt: ${blockState?.completed_at || 'NULL/ABSENT'}`);

      // Classification
      if (canonicalCompletedAt && blockState?.completed_at) {
        console.log(`  Status: ✅ BOTH POPULATED (synchronized)`);
      } else if (canonicalCompletedAt && !blockState?.completed_at) {
        console.log(`  Status: ⚠️  CANONICAL ONLY (Gate H scenario)`);
        console.log(`  Note: This is the intended design if resolveBlockCompletedAt() works`);
      } else if (!canonicalCompletedAt && blockState?.completed_at) {
        console.log(`  Status: ❌ BLOCK STATE ONLY (orphaned completion)`);
      } else {
        console.log(`  Status: ℹ️  NEITHER (incomplete)`);
      }

      // Active time analysis
      if (blockState) {
        const activeTime = blockState.active_time_sec;
        const expectedTime = block.expectedTimeSec;
        const threshold = expectedTime * 0.8;

        if (activeTime >= threshold) {
          console.log(`  Active time: ${activeTime}s >= ${threshold}s threshold`);
          if (!canonicalCompletedAt) {
            console.log(`  ⚠️  WARNING: Crossed threshold but no canonical completion`);
          }
        }
      }

      console.log('');
    }

    // ========================================
    // PART D: Decision Tree
    // ========================================
    console.log('\n--- PART D: Gate H Decision Tree ---\n');

    const d1Key = `${BLOCKS.D1.id}:${BLOCKS.D1.version}`;
    const d1CanonicalCompletion = canonicalCompletions[d1Key];
    const d1BlockState = blockStates.D1;

    console.log('D1 Decision Tree:');

    if (d1CanonicalCompletion) {
      console.log('  [1] DB canonical completed_blocks: ✅ HAS completedAt');

      if (d1BlockState?.completed_at) {
        console.log('  [2] DB block_learning_state: ✅ HAS completedAt');
        console.log('\n  → Both representations populated (synchronized)');
      } else {
        console.log('  [2] DB block_learning_state: ❌ NULL completedAt');
        console.log('\n  → Gate H canonical-only scenario');
        console.log('  → Next: Verify navigation API returns canonical completedAt');
        console.log('  → Expected: resolveBlockCompletedAt() should use canonical');
      }
    } else {
      console.log('  [1] DB canonical completed_blocks: ❌ NO completion');
      console.log('\n  → Completion not persisted');
      console.log('  → Investigate: recordBlockCompletion() / markBlockCompleted()');
    }

    console.log('\n========== FORENSIC CAPTURE COMPLETE ==========\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
