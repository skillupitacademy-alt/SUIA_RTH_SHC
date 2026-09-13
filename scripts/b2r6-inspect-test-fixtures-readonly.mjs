#!/usr/bin/env node
/**
 * B.2-R-6B — Corrected Read-Only Fixture Inspection
 * 
 * SCOPE: Read-only inspection of known test fixture ILS completion data
 * TARGET: ajayshah@gmail.com (RTH) whatisjava navigation node
 * 
 * SAFETY:
 * - Read-only only (no INSERT, UPDATE, DELETE)
 * - Separate People DB and Tutorial DB connections
 * - No cross-database JOIN
 * - No credential exposure
 * - No --execute flag
 * - Classifies dummy vs valid completions
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Target fixture
const TARGET_EMAIL = 'ajayshah@gmail.com';
const TARGET_NAVIGATION_NODE = 'whatisjava';
const DUMMY_PATTERN = /^gate-3c1r-/;

function redactId(id) {
  if (!id) return 'NULL';
  if (id.length <= 8) return '***';
  return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
}

function classifyCompletion(blockId) {
  if (DUMMY_PATTERN.test(blockId)) {
    return 'dummy_orphaned';
  }
  return 'unknown';
}

async function main() {
  const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL_PEOPLE });
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('B.2-R-6B READ-ONLY FIXTURE INSPECTION');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('SAFETY: Read-only inspection only');
  console.log('TARGET: ajayshah@gmail.com / whatisjava');
  console.log('');

  try {
    // Step 1: Check environment variables (without exposing values)
    console.log('[Step 1] Checking environment configuration...');
    console.log('');

    const hasPeopleUrl = !!process.env.DATABASE_URL_PEOPLE;
    const hasTutorialUrl = !!process.env.DATABASE_URL_TUTORIAL;

    console.log(`  DATABASE_URL_PEOPLE:    ${hasPeopleUrl ? '✅ Set' : '❌ Not set'}`);
    console.log(`  DATABASE_URL_TUTORIAL:  ${hasTutorialUrl ? '✅ Set' : '❌ Not set'}`);
    console.log('');

    if (!hasPeopleUrl || !hasTutorialUrl) {
      throw new Error('Required database environment variables not configured');
    }

    // Step 2: Resolve user ID from People DB
    console.log('[Step 2] Resolving user ID from People DB...');
    console.log('');
    console.log(`  Email: ${TARGET_EMAIL}`);

    const userResult = await peoplePool.query(`
      SELECT 
        id,
        email,
        platform as brand,
        is_active,
        role
      FROM users
      WHERE email = $1
        AND deleted_at IS NULL
      LIMIT 1
    `, [TARGET_EMAIL]);

    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${TARGET_EMAIL}`);
    }

    const user = userResult.rows[0];
    console.log(`  User ID (redacted): ${redactId(user.id)}`);
    console.log(`  Brand: ${user.brand}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active: ${user.is_active}`);
    console.log('');

    // Step 3: Query Tutorial DB for progress record
    console.log('[Step 3] Querying Tutorial DB for progress record...');
    console.log('');
    console.log(`  Navigation Node: ${TARGET_NAVIGATION_NODE}`);

    const progressResult = await tutorialPool.query(`
      SELECT 
        id,
        user_id,
        navigation_node_id,
        status,
        completed_blocks,
        visit_count,
        revision_count,
        first_viewed_at,
        last_viewed_at,
        completed_at,
        created_at,
        updated_at
      FROM tutorial_navigation_progress
      WHERE user_id = $1
        AND navigation_node_id = $2
        AND deleted_at IS NULL
      LIMIT 1
    `, [user.id, TARGET_NAVIGATION_NODE]);

    if (progressResult.rows.length === 0) {
      console.log('  ⚠️  No progress record found');
      console.log('');
      console.log('════════════════════════════════════════════════════════════════════════════════');
      console.log('INSPECTION COMPLETE');
      console.log('════════════════════════════════════════════════════════════════════════════════');
      console.log('');
      console.log('[Assessment]');
      console.log('');
      console.log('✅ No progress record exists - nothing to clean up');
      console.log('');
      console.log('[Safety Confirmation]');
      console.log('');
      console.log('✅ NO DATABASE MUTATION PERFORMED');
      console.log('✅ Read-only inspection completed');
      console.log('✅ Separate People DB and Tutorial DB connections used');
      console.log('✅ No cross-database JOIN attempted');
      console.log('✅ No credentials exposed');
      console.log('');
      await peoplePool.end();
      await tutorialPool.end();
      process.exit(0);
    }

    const progress = progressResult.rows[0];
    console.log(`  Progress ID (redacted): ${redactId(progress.id)}`);
    console.log(`  Status: ${progress.status}`);
    console.log(`  Visit Count: ${progress.visit_count}`);
    console.log(`  Revision Count: ${progress.revision_count}`);
    console.log(`  First Viewed: ${progress.first_viewed_at}`);
    console.log(`  Last Viewed: ${progress.last_viewed_at}`);
    console.log(`  Completed At: ${progress.completed_at || 'NULL'}`);
    console.log('');

    // Step 4: Analyze completions
    console.log('[Step 4] Analyzing completion records...');
    console.log('');

    const completions = progress.completed_blocks || [];
    console.log(`  Total completions: ${completions.length}`);
    console.log('');

    const classifiedCompletions = completions.map((completion) => {
      const classification = classifyCompletion(completion.blockId);
      const isDummy = classification === 'dummy_orphaned';

      return {
        blockId: completion.blockId,
        blockVersion: completion.blockVersion,
        completedAt: completion.completedAt,
        isDummy,
        classification,
      };
    });

    // Step 5: Print detailed completion analysis
    if (completions.length > 0) {
      console.log('[Completion Details]');
      console.log('');

      classifiedCompletions.forEach((comp, index) => {
        const icon = comp.isDummy ? '🔴' : '⚠️';
        const label = comp.isDummy ? 'DUMMY (gate-3c1r)' : 'UNKNOWN';

        console.log(`  [${index + 1}] ${icon} ${label}`);
        console.log(`      Block ID:      ${comp.blockId}`);
        console.log(`      Block Version: ${comp.blockVersion}`);
        console.log(`      Completed At:  ${comp.completedAt}`);
        console.log(`      Classification: ${comp.classification}`);
        console.log('');
      });
    }

    // Step 6: Summary
    const summary = {
      totalCompletions: completions.length,
      dummyOrphaned: classifiedCompletions.filter(c => c.classification === 'dummy_orphaned').length,
      validCurrent: classifiedCompletions.filter(c => c.classification === 'valid_current').length,
      unknown: classifiedCompletions.filter(c => c.classification === 'unknown').length,
    };

    console.log('[Summary]');
    console.log('');
    console.log(`  Total Completions:    ${summary.totalCompletions}`);
    console.log(`  Dummy (gate-3c1r-*):  ${summary.dummyOrphaned}`);
    console.log(`  Valid Current:        ${summary.validCurrent}`);
    console.log(`  Unknown:              ${summary.unknown}`);
    console.log('');

    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('INSPECTION COMPLETE');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('');

    // Assessment
    console.log('[Assessment]');
    console.log('');

    if (summary.totalCompletions === 0) {
      console.log('✅ No completions found - record is already clean');
    } else if (summary.dummyOrphaned === summary.totalCompletions) {
      console.log(`✅ All ${summary.dummyOrphaned} completions are confirmed dummy gate-3c1r-* records`);
      console.log('');
      console.log('   These records match the expected dummy test data pattern.');
      console.log('   A narrowly targeted cleanup removing only these specific');
      console.log('   completion references would be technically safe.');
    } else if (summary.unknown > 0) {
      console.log(`⚠️  WARNING: ${summary.unknown} completion(s) do NOT match dummy pattern`);
      console.log('');
      console.log('   Unknown completions require manual review before cleanup.');
      console.log('   Do NOT proceed with automated cleanup.');
    }

    console.log('');
    console.log('[Safety Confirmation]');
    console.log('');
    console.log('✅ NO DATABASE MUTATION PERFORMED');
    console.log('✅ Read-only inspection completed');
    console.log('✅ Separate People DB and Tutorial DB connections used');
    console.log('✅ No cross-database JOIN attempted');
    console.log('✅ No credentials exposed');
    console.log('');

    console.log('[Next Steps]');
    console.log('');

    if (summary.dummyOrphaned === summary.totalCompletions && summary.totalCompletions > 0) {
      console.log('1. Review inspection results');
      console.log('2. If approved, create narrowly targeted cleanup script that:');
      console.log('   - Removes only gate-3c1r-* completion array entries');
      console.log('   - Preserves any valid completions');
      console.log('   - Updates status based on remaining completions');
      console.log('   - Uses transaction for safety');
      console.log('3. Run cleanup with dry-run first');
      console.log('4. Execute cleanup only after approval');
    } else if (summary.totalCompletions === 0) {
      console.log('No cleanup needed - fixture is already clean');
    } else {
      console.log('Manual review required - unknown completion records found');
    }

    console.log('');

    await peoplePool.end();
    await tutorialPool.end();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ INSPECTION FAILED');
    console.error('');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    console.error('✅ NO DATABASE MUTATION PERFORMED');
    console.error('');
    
    await peoplePool.end();
    await tutorialPool.end();
    process.exit(1);
  }
}

main();
