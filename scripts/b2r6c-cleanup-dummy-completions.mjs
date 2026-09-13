#!/usr/bin/env node
/**
 * B.2-R-6C — Transactional Cleanup of Dummy Completions
 * 
 * SCOPE: Remove only gate-3c1r-* dummy completion records from specific test fixture
 * TARGET: ajayshah@gmail.com (RTH) whatisjava navigation node
 * 
 * SAFETY:
 * - Mandatory --dry-run mode (default)
 * - Requires explicit --execute flag for mutation
 * - Transaction with rollback on verification failure
 * - Validates status transitions against repository contract
 * - Preserves all non-dummy completions
 * - Aborts if target row differs from inspection
 * - Post-update verification before commit
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Target fixture
const TARGET_EMAIL = 'ajayshah@gmail.com';
const TARGET_NAVIGATION_NODE = 'whatisjava';
const DUMMY_PATTERN = /^gate-3c1r-/;

// Expected dummy IDs from B.2-R-6B inspection (September 12, 2026)
const EXPECTED_DUMMY_IDS = [
  'gate-3c1r-phase-d-block-le3-1789057672929-cbxbbt',
  'gate-3c1r-phase-d-block-le4-1789057673771-og3ccr',
  'gate-3c1r-phase-d-block-le7-1789057676750-8zifbx',
  'gate-3c1r-phase-d-completion-1789058906687-fjogsh',
];

// Expected row state from B.2-R-6B inspection (September 12, 2026)
// These values must match to ensure row hasn't changed since inspection
const EXPECTED_PROGRESS_ID = '5bd7b4d9-e53e-42d5-83fc-b4f960f87e37';
const EXPECTED_VERSION = 86;
const EXPECTED_STATUS = 'in_progress';
const EXPECTED_COMPLETION_COUNT = 4;

// Valid status transitions from TutorialNavigationProgressRepository
// Source: packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts
// NOTE: Repository only defines forward transitions. Cleanup operations may need
// to handle edge cases where all completions are removed.
const VALID_FORWARD_TRANSITIONS = {
  not_started: ['in_progress', 'completed'],
  in_progress: ['completed'],
  completed: ['completed'], // idempotent
};

// For cleanup: Allow backward transition from in_progress to not_started
// ONLY when ALL completions are removed (empty array).
// This is a data correction scenario not handled by normal repository flow.
const CLEANUP_ALLOWED_TRANSITIONS = {
  ...VALID_FORWARD_TRANSITIONS,
  in_progress: ['completed', 'not_started'], // Allow reset when cleaning all completions
};

function redactId(id) {
  if (!id) return 'NULL';
  if (id.length <= 8) return '***';
  return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
}

function isDummyCompletion(completion) {
  // Defensive check: ensure completion is valid object with blockId string
  return (
    completion &&
    typeof completion === 'object' &&
    typeof completion.blockId === 'string' &&
    DUMMY_PATTERN.test(completion.blockId)
  );
}

function isCompletionObject(completion) {
  // Minimal validation: completion must be non-null object with blockId string
  // Does not enforce blockVersion or completedAt to preserve unknown metadata
  return (
    completion !== null &&
    typeof completion === 'object' &&
    !Array.isArray(completion) &&
    typeof completion.blockId === 'string'
  );
}

function stableJson(value) {
  // Stable JSON serialization for exact array comparison
  return JSON.stringify(value);
}

function validateStatusTransition(oldStatus, newStatus, newCompletedBlocks) {
  // Special case: Allow in_progress → not_started ONLY when removing ALL completions
  if (oldStatus === 'in_progress' && newStatus === 'not_started' && newCompletedBlocks.length === 0) {
    return true; // Cleanup scenario: all completions removed
  }
  
  const validNext = CLEANUP_ALLOWED_TRANSITIONS[oldStatus] || [];
  return validNext.includes(newStatus);
}

function calculateNewStatus(completedBlocks, currentStatus) {
  // Based on TutorialNavigationProgressRepository logic:
  // - Empty completedBlocks → not_started (only if currently not_started or in_progress)
  // - Has completions + not completed status → in_progress
  // - Status 'completed' is set explicitly by completeNode(), not by markBlockCompleted()
  
  if (completedBlocks.length === 0) {
    // Empty completions - reset to not_started only if not explicitly completed
    return currentStatus === 'completed' ? 'completed' : 'not_started';
  }
  
  // Has completions - preserve existing status
  // (markBlockCompleted only sets not_started→in_progress, never in_progress→completed)
  return currentStatus;
}

async function main() {
  const args = process.argv.slice(2);
  const executeMode = args.includes('--execute');
  const dryRun = !executeMode;

  const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL_PEOPLE });
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  // Track transaction state for accurate error reporting
  let transactionCommitted = false;
  let preservedValidCompletionsCount = 0;

  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('B.2-R-6C TRANSACTIONAL CLEANUP — DUMMY COMPLETIONS');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`MODE: ${dryRun ? '🔍 DRY-RUN (read-only)' : '⚠️  EXECUTE (will modify data)'}`);
  console.log('TARGET: ajayshah@gmail.com / whatisjava');
  console.log('PATTERN: gate-3c1r-* dummy completions');
  console.log('');

  if (dryRun) {
    console.log('⚠️  DRY-RUN MODE: No database mutations will occur');
    console.log('   To execute cleanup, run with --execute flag');
    console.log('');
  } else {
    console.log('⚠️  EXECUTE MODE: Database will be modified');
    console.log('   Transaction will be used with verification before commit');
    console.log('');
  }

  try {
    // Step 1: Resolve user from People DB
    console.log('[Step 1] Resolving user from People DB...');
    console.log('');

    const userResult = await peoplePool.query(`
      SELECT id, email, platform as brand
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
      LIMIT 1
    `, [TARGET_EMAIL]);

    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${TARGET_EMAIL}`);
    }

    const user = userResult.rows[0];
    console.log(`  User ID (redacted): ${redactId(user.id)}`);
    console.log(`  Brand: ${user.brand}`);
    console.log('');

    // Step 2: Begin transaction (even for dry-run, will rollback)
    const client = await tutorialPool.connect();
    let transactionOpen = false;
    
    try {
      await client.query('BEGIN');
      transactionOpen = true;
      console.log('[Step 2] Transaction started');
      console.log('');

      // Step 3: Lock and read current progress row
      console.log('[Step 3] Reading current progress row (with row lock)...');
      console.log('');

      const progressResult = await client.query(`
        SELECT 
          id, user_id, navigation_node_id, status,
          completed_blocks, completed_at, version, updated_at
        FROM tutorial_navigation_progress
        WHERE user_id = $1
          AND navigation_node_id = $2
          AND deleted_at IS NULL
        FOR UPDATE
      `, [user.id, TARGET_NAVIGATION_NODE]);

      if (progressResult.rows.length !== 1) {
        throw new Error(
          `Safety check failed: expected exactly one progress row, found ${progressResult.rows.length}`
        );
      }

      const progress = progressResult.rows[0];
      console.log(`  Progress ID (redacted): ${redactId(progress.id)}`);
      console.log(`  Current Status: ${progress.status}`);
      console.log(`  Current Version: ${progress.version}`);
      console.log(`  Completed At: ${progress.completed_at || 'NULL'}`);
      console.log(`  Last Updated: ${progress.updated_at}`);
      console.log('');

      // Validate completed_blocks is an array
      if (!Array.isArray(progress.completed_blocks)) {
        throw new Error(
          'Safety check failed: completed_blocks is not an array\n' +
          `  Type: ${typeof progress.completed_blocks}\n` +
          `  Value: ${JSON.stringify(progress.completed_blocks)}`
        );
      }

      // Step 3.5: Validate row matches inspection expectations
      console.log('[Step 3.5] Validating row state matches B.2-R-6B inspection...');
      console.log('');

      if (progress.id !== EXPECTED_PROGRESS_ID) {
        throw new Error(
          `Safety check failed: Progress ID mismatch\n` +
          `  Expected: ${EXPECTED_PROGRESS_ID}\n` +
          `  Actual:   ${progress.id}\n` +
          `  Wrong progress row targeted`
        );
      }
      console.log(`  ✅ Progress ID matches: ${redactId(progress.id)}`);

      if (progress.version !== EXPECTED_VERSION) {
        throw new Error(
          `Safety check failed: Row version mismatch\n` +
          `  Expected: ${EXPECTED_VERSION} (from B.2-R-6B inspection)\n` +
          `  Actual:   ${progress.version}\n` +
          `  Row may have been modified since inspection`
        );
      }
      console.log(`  ✅ Version matches: ${progress.version}`);

      if (progress.status !== EXPECTED_STATUS) {
        throw new Error(
          `Safety check failed: Status mismatch\n` +
          `  Expected: ${EXPECTED_STATUS} (from B.2-R-6B inspection)\n` +
          `  Actual:   ${progress.status}\n` +
          `  Row state has changed since inspection`
        );
      }
      console.log(`  ✅ Status matches: ${progress.status}`);

      const currentCount = progress.completed_blocks.length;
      if (currentCount !== EXPECTED_COMPLETION_COUNT) {
        throw new Error(
          `Safety check failed: Completion count mismatch\n` +
          `  Expected: ${EXPECTED_COMPLETION_COUNT} (from B.2-R-6B inspection)\n` +
          `  Actual:   ${currentCount}\n` +
          `  Completion data has changed since inspection`
        );
      }
      console.log(`  ✅ Completion count matches: ${currentCount}`);
      console.log('');

      // Step 4: Analyze current completions
      console.log('[Step 4] Analyzing current completions...');
      console.log('');

      const currentCompletions = progress.completed_blocks;
      console.log(`  Current completion count: ${currentCompletions.length}`);
      console.log('');

      if (currentCompletions.length === 0) {
        console.log('✅ No completions found - already clean');
        await client.query('ROLLBACK');
        transactionOpen = false;
        client.release();
        console.log('');
        console.log('Transaction rolled back (no changes needed)');
        console.log('');
        await peoplePool.end();
        await tutorialPool.end();
        process.exit(0);
      }

      // Validate all completions are valid objects
      const malformedCompletions = currentCompletions.filter(c => !isCompletionObject(c));
      if (malformedCompletions.length > 0) {
        throw new Error(
          `Safety check failed: ${malformedCompletions.length} malformed completion(s) found\n` +
          `  All completions must be non-null objects with blockId string`
        );
      }

      // Classify completions using defensive check
      const dummyCompletions = currentCompletions.filter(c => isDummyCompletion(c));
      const validCompletions = currentCompletions.filter(c => !isDummyCompletion(c));
      
      // Store count in outer scope for final summary
      preservedValidCompletionsCount = validCompletions.length;

      console.log('[Current Completions]');
      console.log('');
      currentCompletions.forEach((comp, i) => {
        const isDummy = isDummyCompletion(comp);
        const icon = isDummy ? '🔴' : '✅';
        const label = isDummy ? 'DUMMY' : 'VALID';
        console.log(`  [${i + 1}] ${icon} ${label}: ${comp.blockId}`);
      });
      console.log('');

      console.log(`  Dummy (gate-3c1r-*): ${dummyCompletions.length}`);
      console.log(`  Valid: ${validCompletions.length}`);
      console.log('');

      // Step 5: Validate safety conditions
      console.log('[Step 5] Safety validation...');
      console.log('');

      // Check 1: Exact count matches
      if (dummyCompletions.length !== EXPECTED_DUMMY_IDS.length) {
        throw new Error(
          `Safety check failed: Expected exactly ${EXPECTED_DUMMY_IDS.length} dummy entries, ` +
          `found ${dummyCompletions.length}`
        );
      }

      // Check 2: No duplicates
      const dummyIds = dummyCompletions.map(c => c.blockId);
      const uniqueDummyIds = new Set(dummyIds);
      
      if (uniqueDummyIds.size !== dummyIds.length) {
        throw new Error('Safety check failed: duplicate dummy block IDs found');
      }

      // Check 3: All expected dummy IDs present
      const missingExpected = EXPECTED_DUMMY_IDS.filter(id => !dummyIds.includes(id));
      const unexpectedDummy = dummyIds.filter(id => !EXPECTED_DUMMY_IDS.includes(id));

      if (missingExpected.length > 0) {
        console.log(`  ⚠️  Expected dummy IDs not found: ${missingExpected.length}`);
        missingExpected.forEach(id => console.log(`      - ${id}`));
        console.log('');
        throw new Error('Safety check failed: Expected dummy IDs not present');
      }

      if (unexpectedDummy.length > 0) {
        console.log(`  ⚠️  Unexpected dummy IDs found: ${unexpectedDummy.length}`);
        unexpectedDummy.forEach(id => console.log(`      - ${id}`));
        console.log('');
        throw new Error('Safety check failed: Unexpected dummy IDs found');
      }

      console.log(`  ✅ Exact count matches: ${EXPECTED_DUMMY_IDS.length} dummy entries`);
      console.log(`  ✅ No duplicate dummy IDs`);
      console.log(`  ✅ All ${EXPECTED_DUMMY_IDS.length} expected dummy IDs present`);
      console.log(`  ✅ No unexpected dummy IDs found`);
      console.log('');

      // Check 4: No valid completions will be removed
      if (validCompletions.length > 0) {
        console.log(`  ⚠️  WARNING: ${validCompletions.length} valid completion(s) present`);
        console.log('      These will be PRESERVED');
        console.log('');
      } else {
        console.log(`  ✅ No valid completions - safe to clean`);
        console.log('');
      }

      // Check 5: Confirm scope constraints
      console.log('[Scope Validation]');
      console.log('');
      console.log(`  ✅ Target user ID: ${redactId(user.id)} (${TARGET_EMAIL})`);
      console.log(`  ✅ Target navigation node: ${TARGET_NAVIGATION_NODE}`);
      console.log(`  ✅ Target table: tutorial_navigation_progress`);
      console.log(`  ✅ Target field: completed_blocks, status, completed_at, version, updated_at`);
      console.log(`  ✅ No tutorial content/page/section tables affected`);
      console.log(`  ✅ No user/access/subscription tables affected`);
      console.log('');

      // Step 6: Calculate proposed changes
      console.log('[Step 6] Calculating proposed changes...');
      console.log('');

      const newCompletedBlocks = validCompletions;
      const newStatus = calculateNewStatus(newCompletedBlocks, progress.status);
      const newCompletedAt = newCompletedBlocks.length === 0 ? null : progress.completed_at;

      console.log(`  Old completion count: ${currentCompletions.length}`);
      console.log(`  New completion count: ${newCompletedBlocks.length}`);
      console.log(`  Removed count: ${dummyCompletions.length}`);
      console.log('');
      console.log(`  Old status: ${progress.status}`);
      console.log(`  New status: ${newStatus}`);
      console.log('');
      console.log(`  Old completed_at: ${progress.completed_at || 'NULL'}`);
      console.log(`  New completed_at: ${newCompletedAt || 'NULL'}`);
      console.log('');

      // Validate status transition
      if (progress.status !== newStatus) {
        console.log('[Status Transition Validation]');
        console.log('');
        
        if (!validateStatusTransition(progress.status, newStatus, newCompletedBlocks)) {
          throw new Error(
            `Invalid status transition: ${progress.status} → ${newStatus}\n` +
            `Valid transitions from ${progress.status}: ${CLEANUP_ALLOWED_TRANSITIONS[progress.status].join(', ')}`
          );
        }
        
        if (progress.status === 'in_progress' && newStatus === 'not_started') {
          console.log(`  ⚠️  Cleanup transition: ${progress.status} → ${newStatus}`);
          console.log(`  Reason: All completions removed (empty array)`);
          console.log(`  This is a data correction scenario`);
        } else {
          console.log(`  ✅ Valid transition: ${progress.status} → ${newStatus}`);
        }
        console.log('');
      } else {
        console.log(`  Status unchanged: ${progress.status}`);
        console.log('');
      }

      // Step 7: Execute or simulate update
      if (dryRun) {
        console.log('[Step 7] DRY-RUN: Simulating update...');
        console.log('');
        console.log('  SQL that would be executed:');
        console.log('');
        console.log('  UPDATE tutorial_navigation_progress');
        console.log('  SET');
        console.log(`    completed_blocks = $1,`);
        console.log(`    status = $2,`);
        console.log(`    completed_at = $3,`);
        console.log(`    version = version + 1,`);
        console.log(`    updated_at = NOW()`);
        console.log('  WHERE id = $4');
        console.log('    AND user_id = $5');
        console.log('    AND navigation_node_id = $6');
        console.log('    AND version = $7');
        console.log('    AND deleted_at IS NULL');
        console.log('');
        console.log(`  Parameters:`);
        console.log(`    $1: ${JSON.stringify(newCompletedBlocks)} (${newCompletedBlocks.length} items)`);
        console.log(`    $2: '${newStatus}'`);
        console.log(`    $3: ${newCompletedAt || 'NULL'}`);
        console.log(`    $4: ${redactId(progress.id)}`);
        console.log(`    $5: ${redactId(user.id)}`);
        console.log(`    $6: '${TARGET_NAVIGATION_NODE}'`);
        console.log(`    $7: ${progress.version} (version check - compare-and-swap)`);
        console.log('');

        await client.query('ROLLBACK');
        transactionOpen = false;
        console.log('✅ Transaction rolled back (dry-run mode)');
        console.log('');
      } else {
        console.log('[Step 7] Executing update...');
        console.log('');

        const updateResult = await client.query(`
          UPDATE tutorial_navigation_progress
          SET
            completed_blocks = $1::jsonb,
            status = $2,
            completed_at = $3,
            version = version + 1,
            updated_at = NOW()
          WHERE id = $4
            AND user_id = $5
            AND navigation_node_id = $6
            AND version = $7
            AND deleted_at IS NULL
          RETURNING id, status, completed_blocks, completed_at, version, updated_at
        `, [
          JSON.stringify(newCompletedBlocks),
          newStatus,
          newCompletedAt,
          progress.id,
          user.id,
          TARGET_NAVIGATION_NODE,
          progress.version, // Compare-and-swap: only update if version matches
        ]);

        if (updateResult.rows.length !== 1) {
          throw new Error(
            `Update affected ${updateResult.rows.length} rows; expected exactly 1`
          );
        }

        const updated = updateResult.rows[0];
        console.log('  ✅ Update executed');
        console.log('');

        // Step 8: Verify update
        console.log('[Step 8] Verifying update...');
        console.log('');

        const actualCompletions = updated.completed_blocks || [];
        
        // Verify completed_blocks is still an array after update
        if (!Array.isArray(actualCompletions)) {
          throw new Error(
            'Verification failed: updated completed_blocks is not an array'
          );
        }

        console.log(`  Expected completion count: ${newCompletedBlocks.length}`);
        console.log(`  Actual completion count: ${actualCompletions.length}`);
        console.log('');
        console.log(`  Expected status: ${newStatus}`);
        console.log(`  Actual status: ${updated.status}`);
        console.log('');
        console.log(`  Expected version: ${progress.version + 1}`);
        console.log(`  Actual version: ${updated.version}`);
        console.log('');

        // Verify version incremented correctly
        if (updated.version !== progress.version + 1) {
          throw new Error(
            `Verification failed: expected version ${progress.version + 1}, got ${updated.version}`
          );
        }

        console.log('  ✅ Version incremented correctly');
        console.log('');

        // Verify no dummy records remain (defensive check)
        const remainingDummy = actualCompletions.filter(isDummyCompletion);
        if (remainingDummy.length > 0) {
          throw new Error(
            `Verification failed: ${remainingDummy.length} dummy record(s) still present after update`
          );
        }

        console.log('  ✅ No dummy records remain');
        console.log('');

        // Verify counts match
        if (actualCompletions.length !== newCompletedBlocks.length) {
          throw new Error(
            `Verification failed: completion count mismatch (expected ${newCompletedBlocks.length}, got ${actualCompletions.length})`
          );
        }

        console.log('  ✅ Completion count matches');
        console.log('');

        // Verify exact array match
        if (stableJson(actualCompletions) !== stableJson(newCompletedBlocks)) {
          throw new Error(
            'Verification failed: resulting completed_blocks does not match the expected array'
          );
        }

        console.log('  ✅ Exact array match (stable JSON comparison)');
        console.log('');

        // Verify status
        if (updated.status !== newStatus) {
          throw new Error(
            `Verification failed: status mismatch (expected ${newStatus}, got ${updated.status})`
          );
        }

        console.log('  ✅ Status matches');
        console.log('');

        // All verifications passed - commit
        await client.query('COMMIT');
        transactionOpen = false;
        transactionCommitted = true;
        console.log('✅ Transaction committed');
        console.log('');

        console.log('[Update Summary]');
        console.log('');
        console.log(`  Progress ID: ${redactId(updated.id)}`);
        console.log(`  New Version: ${updated.version}`);
        console.log(`  Updated At: ${updated.updated_at}`);
        console.log(`  Completions: ${actualCompletions.length}`);
        console.log(`  Status: ${updated.status}`);
        console.log(`  Completed At: ${updated.completed_at || 'NULL'}`);
        console.log('');
      }

      client.release();

    } catch (error) {
      if (transactionOpen) {
        await client.query('ROLLBACK');
        transactionOpen = false;
      }
      client.release();
      throw error;
    }

    // Final summary
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(dryRun ? 'DRY-RUN COMPLETE' : 'CLEANUP COMPLETE');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('');

    if (dryRun) {
      console.log('[Next Steps]');
      console.log('');
      console.log('1. Review the proposed changes above');
      console.log('2. Verify the status transition is correct');
      console.log('3. If approved, run with --execute flag:');
      console.log('');
      console.log('   node scripts/b2r6c-cleanup-dummy-completions.mjs --execute');
      console.log('');
    } else {
      console.log('[Result]');
      console.log('');
      console.log(`✅ Successfully removed ${EXPECTED_DUMMY_IDS.length} dummy completion records`);
      console.log('✅ All verifications passed');
      console.log('✅ Transaction committed');
      console.log('');
      console.log('[What Changed]');
      console.log('');
      console.log(`  Target: ajayshah@gmail.com / whatisjava`);
      console.log(`  Removed: ${EXPECTED_DUMMY_IDS.length} gate-3c1r-* dummy completions`);
      console.log(`  Preserved: ${preservedValidCompletionsCount} valid completions`);
      console.log('');
    }

    await peoplePool.end();
    await tutorialPool.end();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ CLEANUP FAILED');
    console.error('');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    
    if (transactionCommitted) {
      console.error('⚠️  Transaction was already committed before the error');
      console.error('    Database may have been modified');
    } else {
      console.error('✅ Transaction rolled back - no changes made');
    }
    console.error('');

    await peoplePool.end();
    await tutorialPool.end();
    process.exit(1);
  }
}

main();
