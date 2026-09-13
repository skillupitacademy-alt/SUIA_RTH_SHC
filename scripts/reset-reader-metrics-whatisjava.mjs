#!/usr/bin/env node
/**
 * Reader Metrics Reset — whatisjava Fixtures
 * 
 * SCOPE: Reset reader/progress/ILS metrics for two specific user/page fixtures
 * 
 * TARGETS:
 * 1. SkillUp: student@skillupitacademy.com / whatisjava
 * 2. RealTutorialHub: ajayshah@gmail.com / whatisjava
 * 
 * OBJECTIVE:
 * Make both users appear as first-time readers of the whatisjava page
 * 
 * TABLES AFFECTED:
 * - tutorial_navigation_progress (page-level metrics)
 * - block_learning_state (block-level telemetry)
 * - block_telemetry_events (telemetry event history)
 * - tutorial_progress (subtopic-level metrics, if exists)
 * 
 * SAFETY:
 * - Mandatory --dry-run mode (default)
 * - Requires explicit --execute flag for mutation
 * - Transaction per database
 * - Does NOT modify tutorial content, pages, sections, blocks
 * - Does NOT modify users, access, subscriptions
 * - Narrowly scoped to exact user email + navigation node
 * - Post-execution verification
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Target fixtures
const FIXTURES = [
  {
    brand: 'skillupitacademy',
    email: 'student@skillupitacademy.com',
    navigationNode: 'whatisjava',
  },
  {
    brand: 'realtutorialhub',
    email: 'ajayshah@gmail.com',
    navigationNode: 'whatisjava',
  },
];

function redactId(id) {
  if (!id) return 'NULL';
  if (id.length <= 8) return '***';
  return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
}

async function resetFixture(fixture, peoplePool, tutorialPool, dryRun) {
  console.log('─'.repeat(80));
  console.log(`FIXTURE: ${fixture.email} / ${fixture.navigationNode}`);
  console.log('─'.repeat(80));
  console.log('');

  // Step 1: Resolve user from People DB
  console.log('[Step 1] Resolving user from People DB...');
  console.log('');

  const userResult = await peoplePool.query(`
    SELECT id, email, platform as brand
    FROM users
    WHERE email = $1 AND deleted_at IS NULL
    LIMIT 1
  `, [fixture.email]);

  if (userResult.rows.length === 0) {
    console.log(`⚠️  User not found: ${fixture.email}`);
    console.log('   Skipping this fixture');
    console.log('');
    return {
      skipped: true,
      reason: 'User not found',
    };
  }

  const user = userResult.rows[0];
  console.log(`  User ID (redacted): ${redactId(user.id)}`);
  console.log(`  Brand: ${user.brand}`);
  console.log('');

  // Step 2: Begin transaction
  const client = await tutorialPool.connect();
  let transactionOpen = false;
  let transactionCommitted = false;

  try {
    await client.query('BEGIN');
    transactionOpen = true;
    console.log('[Step 2] Transaction started');
    console.log('');

    // Step 3: Query current progress state
    console.log('[Step 3] Querying current reader metrics...');
    console.log('');

    const progressResult = await client.query(`
      SELECT 
        id, status, completed_blocks,
        time_spent_active_sec, visit_count, revision_count,
        first_viewed_at, last_viewed_at, completed_at
      FROM tutorial_navigation_progress
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND deleted_at IS NULL
      FOR UPDATE
    `, [user.id, fixture.navigationNode]);

    const blockStateResult = await client.query(`
      SELECT 
        id, block_id, block_version,
        visit_count, revision_count, active_time_sec,
        first_viewed_at, last_viewed_at, completed_at
      FROM block_learning_state
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND deleted_at IS NULL
      FOR UPDATE
    `, [user.id, fixture.navigationNode]);

    const telemetryResult = await client.query(`
      SELECT COUNT(*) as count
      FROM block_telemetry_events
      WHERE user_id = $1
        AND navigation_node_id = $2
    `, [user.id, fixture.navigationNode]);

    // Check subtopic progress (whatisjava subtopic)
    const subtopicResult = await client.query(`
      SELECT id, subtopic_id
      FROM tutorial_navigation_progress
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND deleted_at IS NULL
    `, [user.id, fixture.navigationNode]);

    let tutorialProgressResult = { rows: [] };
    if (subtopicResult.rows.length > 0) {
      const subtopicId = subtopicResult.rows[0].subtopic_id;
      tutorialProgressResult = await client.query(`
        SELECT 
          id, status, blocks_completed, score,
          time_spent_sec, completed_at
        FROM tutorial_progress
        WHERE user_id = $1
          AND subtopic_id = $2
          AND deleted_at IS NULL
        FOR UPDATE
      `, [user.id, subtopicId]);
    }

    // Display current state
    console.log('[Current State]');
    console.log('');
    console.log(`  tutorial_navigation_progress:`);
    if (progressResult.rows.length > 0) {
      const p = progressResult.rows[0];
      console.log(`    Found: 1 row`);
      console.log(`    ID: ${redactId(p.id)}`);
      console.log(`    Status: ${p.status}`);
      console.log(`    Completed blocks: ${(p.completed_blocks || []).length}`);
      console.log(`    Visit count: ${p.visit_count}`);
      console.log(`    Revision count: ${p.revision_count}`);
      console.log(`    Active time: ${p.time_spent_active_sec}s`);
      console.log(`    First viewed: ${p.first_viewed_at || 'NULL'}`);
      console.log(`    Last viewed: ${p.last_viewed_at || 'NULL'}`);
      console.log(`    Completed at: ${p.completed_at || 'NULL'}`);
    } else {
      console.log(`    Found: 0 rows (already clean)`);
    }
    console.log('');

    console.log(`  block_learning_state:`);
    console.log(`    Found: ${blockStateResult.rows.length} row(s)`);
    if (blockStateResult.rows.length > 0) {
      blockStateResult.rows.forEach((b, i) => {
        console.log(`    [${i + 1}] Block: ${b.block_id} (${b.block_version})`);
        console.log(`        Visits: ${b.visit_count}, Revisions: ${b.revision_count}, Active: ${b.active_time_sec}s`);
      });
    }
    console.log('');

    console.log(`  block_telemetry_events:`);
    console.log(`    Found: ${telemetryResult.rows[0].count} event(s)`);
    console.log('');

    console.log(`  tutorial_progress (subtopic-level):`);
    if (tutorialProgressResult.rows.length > 0) {
      const t = tutorialProgressResult.rows[0];
      console.log(`    Found: 1 row`);
      console.log(`    Status: ${t.status}`);
      console.log(`    Blocks completed: ${(t.blocks_completed || []).length}`);
      console.log(`    Score: ${t.score || 'NULL'}`);
      console.log(`    Time spent: ${t.time_spent_sec}s`);
    } else {
      console.log(`    Found: 0 rows (no subtopic progress)`);
    }
    console.log('');

    // Check if already clean
    const isClean = 
      progressResult.rows.length === 0 &&
      blockStateResult.rows.length === 0 &&
      telemetryResult.rows[0].count === '0' &&
      tutorialProgressResult.rows.length === 0;

    if (isClean) {
      console.log('✅ Already clean - no reader metrics found');
      await client.query('ROLLBACK');
      transactionOpen = false;
      client.release();
      return {
        skipped: false,
        alreadyClean: true,
        deletedRows: 0,
      };
    }

    // Step 4: Execute or simulate deletion
    if (dryRun) {
      console.log('[Step 4] DRY-RUN: Would delete...');
      console.log('');
      console.log(`  DELETE FROM tutorial_navigation_progress`);
      console.log(`    WHERE user_id = '${redactId(user.id)}'`);
      console.log(`      AND navigation_node_id = '${fixture.navigationNode}'`);
      console.log(`    Rows: ${progressResult.rows.length}`);
      console.log('');
      console.log(`  DELETE FROM block_learning_state`);
      console.log(`    WHERE user_id = '${redactId(user.id)}'`);
      console.log(`      AND navigation_node_id = '${fixture.navigationNode}'`);
      console.log(`    Rows: ${blockStateResult.rows.length}`);
      console.log('');
      console.log(`  DELETE FROM block_telemetry_events`);
      console.log(`    WHERE user_id = '${redactId(user.id)}'`);
      console.log(`      AND navigation_node_id = '${fixture.navigationNode}'`);
      console.log(`    Rows: ${telemetryResult.rows[0].count}`);
      console.log('');
      if (tutorialProgressResult.rows.length > 0) {
        console.log(`  DELETE FROM tutorial_progress`);
        console.log(`    WHERE user_id = '${redactId(user.id)}'`);
        console.log(`      AND subtopic_id = '${redactId(subtopicResult.rows[0].subtopic_id)}'`);
        console.log(`    Rows: ${tutorialProgressResult.rows.length}`);
        console.log('');
      }

      await client.query('ROLLBACK');
      transactionOpen = false;
      client.release();
      
      return {
        skipped: false,
        alreadyClean: false,
        dryRun: true,
        wouldDelete: {
          navigationProgress: progressResult.rows.length,
          blockLearningState: blockStateResult.rows.length,
          blockTelemetryEvents: parseInt(telemetryResult.rows[0].count),
          tutorialProgress: tutorialProgressResult.rows.length,
        },
      };
    } else {
      console.log('[Step 4] Executing deletions...');
      console.log('');

      // Delete in order (telemetry events first, then states, then progress)
      const telemetryDelete = await client.query(`
        DELETE FROM block_telemetry_events
        WHERE user_id = $1
          AND navigation_node_id = $2
      `, [user.id, fixture.navigationNode]);

      const blockStateDelete = await client.query(`
        DELETE FROM block_learning_state
        WHERE user_id = $1
          AND navigation_node_id = $2
          AND deleted_at IS NULL
      `, [user.id, fixture.navigationNode]);

      const progressDelete = await client.query(`
        DELETE FROM tutorial_navigation_progress
        WHERE user_id = $1
          AND navigation_node_id = $2
          AND deleted_at IS NULL
      `, [user.id, fixture.navigationNode]);

      let tutorialProgressDelete = { rowCount: 0 };
      if (tutorialProgressResult.rows.length > 0) {
        const subtopicId = subtopicResult.rows[0].subtopic_id;
        tutorialProgressDelete = await client.query(`
          DELETE FROM tutorial_progress
          WHERE user_id = $1
            AND subtopic_id = $2
            AND deleted_at IS NULL
        `, [user.id, subtopicId]);
      }

      console.log(`  ✅ Deleted ${telemetryDelete.rowCount} block_telemetry_events`);
      console.log(`  ✅ Deleted ${blockStateDelete.rowCount} block_learning_state rows`);
      console.log(`  ✅ Deleted ${progressDelete.rowCount} tutorial_navigation_progress row(s)`);
      if (tutorialProgressDelete.rowCount > 0) {
        console.log(`  ✅ Deleted ${tutorialProgressDelete.rowCount} tutorial_progress row(s)`);
      }
      console.log('');

      // Step 5: Verify deletion
      console.log('[Step 5] Verifying deletion...');
      console.log('');

      const verifyProgress = await client.query(`
        SELECT COUNT(*) as count
        FROM tutorial_navigation_progress
        WHERE user_id = $1
          AND navigation_node_id = $2
          AND deleted_at IS NULL
      `, [user.id, fixture.navigationNode]);

      const verifyBlocks = await client.query(`
        SELECT COUNT(*) as count
        FROM block_learning_state
        WHERE user_id = $1
          AND navigation_node_id = $2
          AND deleted_at IS NULL
      `, [user.id, fixture.navigationNode]);

      const verifyTelemetry = await client.query(`
        SELECT COUNT(*) as count
        FROM block_telemetry_events
        WHERE user_id = $1
          AND navigation_node_id = $2
      `, [user.id, fixture.navigationNode]);

      if (verifyProgress.rows[0].count !== '0') {
        throw new Error(`Verification failed: tutorial_navigation_progress still has ${verifyProgress.rows[0].count} row(s)`);
      }
      if (verifyBlocks.rows[0].count !== '0') {
        throw new Error(`Verification failed: block_learning_state still has ${verifyBlocks.rows[0].count} row(s)`);
      }
      if (verifyTelemetry.rows[0].count !== '0') {
        throw new Error(`Verification failed: block_telemetry_events still has ${verifyTelemetry.rows[0].count} row(s)`);
      }

      console.log('  ✅ All reader metrics deleted');
      console.log('  ✅ User now appears as first-time reader');
      console.log('');

      await client.query('COMMIT');
      transactionOpen = false;
      transactionCommitted = true;
      console.log('✅ Transaction committed');
      console.log('');

      client.release();

      return {
        skipped: false,
        alreadyClean: false,
        dryRun: false,
        deleted: {
          navigationProgress: progressDelete.rowCount,
          blockLearningState: blockStateDelete.rowCount,
          blockTelemetryEvents: telemetryDelete.rowCount,
          tutorialProgress: tutorialProgressDelete.rowCount,
        },
      };
    }

  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK');
      transactionOpen = false;
    }
    client.release();
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const executeMode = args.includes('--execute');
  const dryRun = !executeMode;

  const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL_PEOPLE });
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('READER METRICS RESET — whatisjava Fixtures');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`MODE: ${dryRun ? '🔍 DRY-RUN (read-only)' : '⚠️  EXECUTE (will delete data)'}`);
  console.log('SCOPE: Two user/page fixtures only');
  console.log('');

  if (dryRun) {
    console.log('⚠️  DRY-RUN MODE: No data will be deleted');
    console.log('   To execute reset, run with --execute flag');
    console.log('');
  } else {
    console.log('⚠️  EXECUTE MODE: Reader metrics will be deleted');
    console.log('   Transaction used per fixture');
    console.log('');
  }

  const results = [];

  try {
    for (const fixture of FIXTURES) {
      const result = await resetFixture(fixture, peoplePool, tutorialPool, dryRun);
      results.push({ fixture, result });
      console.log('');
    }

    // Summary
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(dryRun ? 'DRY-RUN COMPLETE' : 'RESET COMPLETE');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('');

    results.forEach(({ fixture, result }) => {
      console.log(`${fixture.email} / ${fixture.navigationNode}:`);
      if (result.skipped) {
        console.log(`  ⚠️  Skipped: ${result.reason}`);
      } else if (result.alreadyClean) {
        console.log(`  ✅ Already clean`);
      } else if (result.dryRun) {
        console.log(`  Would delete:`);
        console.log(`    - ${result.wouldDelete.navigationProgress} navigation progress row(s)`);
        console.log(`    - ${result.wouldDelete.blockLearningState} block learning state row(s)`);
        console.log(`    - ${result.wouldDelete.blockTelemetryEvents} block telemetry event(s)`);
        console.log(`    - ${result.wouldDelete.tutorialProgress} tutorial progress row(s)`);
      } else {
        console.log(`  ✅ Reset complete:`);
        console.log(`    - Deleted ${result.deleted.navigationProgress} navigation progress row(s)`);
        console.log(`    - Deleted ${result.deleted.blockLearningState} block learning state row(s)`);
        console.log(`    - Deleted ${result.deleted.blockTelemetryEvents} block telemetry event(s)`);
        console.log(`    - Deleted ${result.deleted.tutorialProgress} tutorial progress row(s)`);
      }
      console.log('');
    });

    if (dryRun) {
      console.log('[Next Steps]');
      console.log('');
      console.log('1. Review the proposed deletions above');
      console.log('2. Verify no tutorial content tables are affected');
      console.log('3. If approved, run with --execute flag:');
      console.log('');
      console.log('   node scripts/reset-reader-metrics-whatisjava.mjs --execute');
      console.log('');
    }

    await peoplePool.end();
    await tutorialPool.end();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ RESET FAILED');
    console.error('');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');

    await peoplePool.end();
    await tutorialPool.end();
    process.exit(1);
  }
}

main();
