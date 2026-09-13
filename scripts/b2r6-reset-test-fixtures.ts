/**
 * B.2-R-6 — Controlled Test-Data Reset
 * 
 * SCOPE: Reset ONLY known dummy ILS test fixture completion data
 * TARGET: ajayshah@gmail.com (RTH) whatisjava navigation node
 * 
 * DOES NOT:
 * - Delete user accounts
 * - Delete subscription data
 * - Delete visit/telemetry data
 * - Affect other navigation nodes
 * - Affect production data
 * 
 * DRY RUN BY DEFAULT
 */

import { db } from '@quiz/db-people';
import { sql } from 'drizzle-orm';

const TEST_FIXTURES = [
  {
    brand: 'realtutorialhub',
    email: 'ajayshah@gmail.com',
    navigationNodeId: 'whatisjava',
    reason: 'RTH fixture with 4 orphaned gate-3c1r-* completions',
  },
  // SkillUp fixture is already clean (0 completions)
] as const;

interface ResetResult {
  fixture: string;
  beforeState: {
    completedBlocksCount: number;
    completedBlocks: Array<{ blockId: string; blockVersion: string }>;
  } | null;
  afterState: {
    completedBlocksCount: number;
  } | null;
  action: 'reset' | 'skipped' | 'error';
  message: string;
}

async function inspectFixture(email: string, navigationNodeId: string) {
  const result = await db.execute(sql`
    SELECT 
      u.id as user_id,
      u.email,
      p.navigation_node_id,
      p.completed_blocks,
      jsonb_array_length(p.completed_blocks) as completed_count
    FROM users u
    LEFT JOIN tutorial_navigation_progress p 
      ON u.id = p.user_id 
      AND p.navigation_node_id = ${navigationNodeId}
      AND p.deleted_at IS NULL
    WHERE u.email = ${email}
    AND u.deleted_at IS NULL
  `);

  return result.rows[0] || null;
}

async function resetFixtureCompletions(
  email: string, 
  navigationNodeId: string,
  dryRun: boolean
): Promise<ResetResult> {
  const fixture = `${email}:${navigationNodeId}`;

  try {
    // Inspect before state
    const before = await inspectFixture(email, navigationNodeId);

    if (!before || !before.user_id) {
      return {
        fixture,
        beforeState: null,
        afterState: null,
        action: 'skipped',
        message: 'User or progress record not found',
      };
    }

    const beforeState = {
      completedBlocksCount: Number(before.completed_count || 0),
      completedBlocks: before.completed_blocks || [],
    };

    if (beforeState.completedBlocksCount === 0) {
      return {
        fixture,
        beforeState,
        afterState: beforeState,
        action: 'skipped',
        message: 'Already clean (0 completions)',
      };
    }

    // Reset completedBlocks to empty array
    if (!dryRun) {
      await db.execute(sql`
        UPDATE tutorial_navigation_progress
        SET 
          completed_blocks = '[]'::jsonb,
          status = 'not_started',
          updated_at = NOW()
        WHERE user_id = ${before.user_id}
        AND navigation_node_id = ${navigationNodeId}
        AND deleted_at IS NULL
      `);

      // Verify after state
      const after = await inspectFixture(email, navigationNodeId);
      const afterState = {
        completedBlocksCount: Number(after?.completed_count || 0),
      };

      return {
        fixture,
        beforeState,
        afterState,
        action: 'reset',
        message: `Reset ${beforeState.completedBlocksCount} completions`,
      };
    } else {
      return {
        fixture,
        beforeState,
        afterState: null,
        action: 'skipped',
        message: `DRY RUN: Would reset ${beforeState.completedBlocksCount} completions`,
      };
    }
  } catch (error) {
    return {
      fixture,
      beforeState: null,
      afterState: null,
      action: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  console.log('═'.repeat(80));
  console.log('B.2-R-6 CONTROLLED TEST-FIXTURE RESET');
  console.log('═'.repeat(80));
  console.log('');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '⚠️  EXECUTE'}`);
  console.log('Scope: Known ILS test fixtures with dummy completion data');
  console.log('');

  if (!dryRun) {
    console.log('⚠️  WARNING: This will modify database records');
    console.log('⚠️  Press Ctrl+C within 5 seconds to abort');
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('Processing fixtures...');
  console.log('');

  const results: ResetResult[] = [];

  for (const fixture of TEST_FIXTURES) {
    console.log(`[${fixture.brand.toUpperCase()}] ${fixture.email}`);
    console.log(`  Node: ${fixture.navigationNodeId}`);
    console.log(`  Reason: ${fixture.reason}`);
    console.log('');

    const result = await resetFixtureCompletions(
      fixture.email,
      fixture.navigationNodeId,
      dryRun
    );

    results.push(result);

    console.log(`  Before: ${result.beforeState?.completedBlocksCount ?? 'N/A'} completions`);
    if (result.beforeState && result.beforeState.completedBlocksCount > 0) {
      console.log(`  Orphaned IDs:`);
      result.beforeState.completedBlocks.forEach((cb: any, i: number) => {
        console.log(`    [${i + 1}] ${cb.blockId}:${cb.blockVersion}`);
      });
    }
    console.log(`  Action: ${result.action.toUpperCase()}`);
    console.log(`  Result: ${result.message}`);
    if (result.afterState) {
      console.log(`  After: ${result.afterState.completedBlocksCount} completions`);
    }
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log('');

  const resetCount = results.filter(r => r.action === 'reset').length;
  const skippedCount = results.filter(r => r.action === 'skipped').length;
  const errorCount = results.filter(r => r.action === 'error').length;

  console.log(`Reset:   ${resetCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors:  ${errorCount}`);
  console.log('');

  if (dryRun) {
    console.log('ℹ️  This was a DRY RUN. No data was modified.');
    console.log('ℹ️  Run with --execute to perform the reset.');
  } else {
    console.log('✅ Reset complete.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Implement contract-consistent DTO filtering');
    console.log('2. Add contract validation tests');
    console.log('3. Re-run B.2-R-4 API capture to verify');
  }
  console.log('');

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
