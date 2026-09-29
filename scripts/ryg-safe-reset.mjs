#!/usr/bin/env node
/**
 * R/Y/G Safe Certification Reset - STEP 4
 *
 * PURPOSE:
 *   Reset canonical completion state for whatisjava to enable R/Y/G certification.
 *   Removes only I1+D1 canonical completions while preserving all telemetry.
 *
 * SCOPE:
 *   - ONE learner: afc355ca-6bae-4165-89dd-198494a62f85
 *   - ONE navigation node: whatisjava
 *   - EXACT required blocks resolved from current tutorial content
 *
 * PRESERVATION:
 *   - block_learning_state (all telemetry fields)
 *   - Unrelated canonical completions
 *   - Tutorial content
 *   - C1 incomplete state
 *
 * SAFETY:
 *   - Defaults to DRY RUN (read-only)
 *   - Requires --execute flag for mutation
 *   - Uses database transaction
 *   - Validates state before and after mutation
 *   - Aborts on unexpected state changes
 *
 * USAGE:
 *   node scripts/ryg-safe-reset.mjs           # Dry run (read-only)
 *   node scripts/ryg-safe-reset.mjs --execute # Execute reset
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

// ============================================================
// CONFIGURATION
// ============================================================

const DATABASE_URL = process.env.DATABASE_URL_TUTORIAL;

if (!DATABASE_URL) {
  console.error('');
  console.error('ERROR: DATABASE_URL_TUTORIAL environment variable is required');
  console.error('');
  console.error('This script operates on the tutorial database only.');
  console.error('Do NOT use DATABASE_URL (points to quiz_platform_prod).');
  console.error('');
  process.exit(2);
}

const USER_ID = 'afc355ca-6bae-4165-89dd-198494a62f85';
const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SECTION_ID = '45f4e65b-2178-4bca-867e-9377f064fb20';
const AUTHENTICATED_BRAND = 'realtutorialhub'; // Authenticated context for certification

// Expected required blocks from STEP 3 forensics (for assertions only)
const EXPECTED_REQUIRED_BLOCKS = [
  { blockId: '7ffd2ee6-e826-40d9-9c91-7b9d31f4fd66', blockVersion: 'I1' },
  { blockId: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749', blockVersion: 'D1' },
  { blockId: 'b9a3a86e-ff8a-44b1-9ff8-2f0fbb460ad3', blockVersion: 'C1' },
];

const EXECUTE_MODE = process.argv.includes('--execute');

const pool = new Pool({ connectionString: DATABASE_URL });

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function assertUuid(value, name) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`${name} is not a valid UUID: ${value}`);
  }
}

function formatTimestamp(date) {
  if (!date) return 'NULL';
  return new Date(date).toISOString();
}

// ============================================================
// STEP 1: RESOLVE REQUIRED BLOCKS FROM CURRENT CONTENT
// ============================================================

async function resolveRequiredBlocks(client) {
  // Use production brand-resolution logic:
  // WHERE (brand_id = authenticatedBrand OR brand_id = 'shared')
  // This matches TutorialSectionRepository.getTutorialByPageIdentity()
  const result = await client.query(`
    SELECT
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      content
    FROM tutorial_sections
    WHERE subtopic_id = $1
      AND navigation_node_id = $2
      AND (brand_id = $3 OR brand_id = 'shared')
      AND deleted_at IS NULL
    LIMIT 1
  `, [SUBTOPIC_ID, NAVIGATION_NODE_ID, AUTHENTICATED_BRAND]);

  if (result.rows.length === 0) {
    throw new Error(
      `Section not found for navigation=${NAVIGATION_NODE_ID}, subtopic=${SUBTOPIC_ID}, brand=${AUTHENTICATED_BRAND} OR shared`
    );
  }

  const section = result.rows[0];

  // Verify this is the expected section from forensic investigation
  if (section.id !== SECTION_ID) {
    throw new Error(
      `Section ID mismatch. Expected ${SECTION_ID}, found ${section.id}. ` +
      `Brand resolution may have changed.`
    );
  }

  // Document the resolved brand for provenance
  console.log(`Resolved brand:     ${section.brand_id} (authenticated: ${AUTHENTICATED_BRAND})`);
  console.log('');

  if (!section.content || !section.content.blocks) {
    throw new Error('Section has no content blocks');
  }

  const requiredBlocks = [];

  for (const block of section.content.blocks) {
    if (block.version) {
      const progressRole = block.progressRole ?? 'instructional';
      
      if (progressRole === 'instructional') {
        requiredBlocks.push({
          blockId: block.id,
          blockVersion: block.version,
        });
      }
    }
  }

  return requiredBlocks;
}

// ============================================================
// STEP 2: READ CURRENT CANONICAL COMPLETION STATE
// ============================================================

async function readNavigationProgress(client, forUpdate = false) {
  const lockClause = forUpdate ? 'FOR UPDATE' : '';
  
  const result = await client.query(`
    SELECT
      id,
      user_id,
      navigation_node_id,
      section_id,
      subtopic_id,
      status,
      completed_blocks,
      time_spent_active_sec,
      visit_count,
      revision_count,
      completed_at,
      first_viewed_at,
      last_viewed_at,
      version
    FROM tutorial_navigation_progress
    WHERE user_id = $1
      AND navigation_node_id = $2
      AND deleted_at IS NULL
    ${lockClause}
  `, [USER_ID, NAVIGATION_NODE_ID]);

  if (result.rows.length === 0) {
    throw new Error(
      `Navigation progress not found for user=${USER_ID}, navigation=${NAVIGATION_NODE_ID}`
    );
  }

  if (result.rows.length > 1) {
    throw new Error(
      `Multiple active navigation progress rows found: ${result.rows.length}`
    );
  }

  return result.rows[0];
}

// ============================================================
// STEP 3: READ BLOCK LEARNING STATE (TELEMETRY)
// ============================================================

async function readBlockLearningState(client, blockIdentities) {
  if (blockIdentities.length === 0) {
    return [];
  }

  const conditions = blockIdentities.map((_, index) => 
    `(block_id = $${index * 2 + 3} AND block_version = $${index * 2 + 4})`
  ).join(' OR ');

  const params = [
    USER_ID,
    NAVIGATION_NODE_ID,
    ...blockIdentities.flatMap(b => [b.blockId, b.blockVersion])
  ];

  const result = await client.query(`
    SELECT
      id,
      block_id,
      block_version,
      visit_count,
      revision_count,
      active_time_sec,
      expected_time_sec,
      first_viewed_at,
      last_viewed_at,
      completed_at,
      version
    FROM block_learning_state
    WHERE user_id = $1
      AND navigation_node_id = $2
      AND (${conditions})
    ORDER BY block_version
  `, params);

  return result.rows;
}

// ============================================================
// STEP 4: IDENTIFY RESET TARGETS
// ============================================================

function identifyResetTargets(completedBlocks, requiredBlocks) {
  const targets = completedBlocks.filter(completion =>
    requiredBlocks.some(required =>
      required.blockId === completion.blockId &&
      required.blockVersion === completion.blockVersion
    )
  );

  const remaining = completedBlocks.filter(completion =>
    !requiredBlocks.some(required =>
      required.blockId === completion.blockId &&
      required.blockVersion === completion.blockVersion
    )
  );

  return { targets, remaining };
}

// ============================================================
// STEP 5: SAFETY CHECKS
// ============================================================

function performSafetyChecks(requiredBlocks, navigationProgress, resetTargets) {
  const checks = {
    requiredBlockCount: { expected: 3, actual: requiredBlocks.length },
    uniqueBlockIds: { 
      expected: 3, 
      actual: new Set(requiredBlocks.map(b => b.blockId)).size 
    },
    requiredVersions: {
      expected: ['I1', 'D1', 'C1'].sort(),
      actual: requiredBlocks.map(b => b.blockVersion).sort()
    },
    expectedI1: {
      expected: EXPECTED_REQUIRED_BLOCKS[0],
      actual: requiredBlocks.find(b => b.blockVersion === 'I1')
    },
    expectedD1: {
      expected: EXPECTED_REQUIRED_BLOCKS[1],
      actual: requiredBlocks.find(b => b.blockVersion === 'D1')
    },
    expectedC1: {
      expected: EXPECTED_REQUIRED_BLOCKS[2],
      actual: requiredBlocks.find(b => b.blockVersion === 'C1')
    },
    subtopicMatch: {
      expected: SUBTOPIC_ID,
      actual: navigationProgress.subtopic_id
    },
    resetTargetCount: {
      expected: 2, // I1 + D1 currently completed
      actual: resetTargets.targets.length
    },
  };

  const failures = [];

  if (checks.requiredBlockCount.actual !== checks.requiredBlockCount.expected) {
    failures.push(`Required block count: expected ${checks.requiredBlockCount.expected}, got ${checks.requiredBlockCount.actual}`);
  }

  if (checks.uniqueBlockIds.actual !== checks.uniqueBlockIds.expected) {
    failures.push(`Unique block IDs: expected ${checks.uniqueBlockIds.expected}, got ${checks.uniqueBlockIds.actual} (duplicates detected)`);
  }

  if (JSON.stringify(checks.requiredVersions.actual) !== JSON.stringify(checks.requiredVersions.expected)) {
    failures.push(`Required versions: expected [${checks.requiredVersions.expected.join(', ')}], got [${checks.requiredVersions.actual.join(', ')}]`);
  }

  if (checks.expectedI1.actual?.blockId !== checks.expectedI1.expected.blockId) {
    failures.push(`I1 blockId mismatch: expected ${checks.expectedI1.expected.blockId}, got ${checks.expectedI1.actual?.blockId || 'NOT FOUND'}`);
  }

  if (checks.expectedD1.actual?.blockId !== checks.expectedD1.expected.blockId) {
    failures.push(`D1 blockId mismatch: expected ${checks.expectedD1.expected.blockId}, got ${checks.expectedD1.actual?.blockId || 'NOT FOUND'}`);
  }

  if (checks.expectedC1.actual?.blockId !== checks.expectedC1.expected.blockId) {
    failures.push(`C1 blockId mismatch: expected ${checks.expectedC1.expected.blockId}, got ${checks.expectedC1.actual?.blockId || 'NOT FOUND'}`);
  }

  if (checks.subtopicMatch.actual !== checks.subtopicMatch.expected) {
    failures.push(`Subtopic mismatch: expected ${checks.subtopicMatch.expected}, got ${checks.subtopicMatch.actual}`);
  }

  if (checks.resetTargetCount.actual !== checks.resetTargetCount.expected) {
    failures.push(`Reset target count: expected ${checks.resetTargetCount.expected} (I1+D1), got ${checks.resetTargetCount.actual}`);
  }

  return { checks, failures };
}

// ============================================================
// STEP 6: EXECUTE RESET (TRANSACTIONAL)
// ============================================================

async function executeReset(client, navigationProgress, resetTargets) {
  // Re-read and lock navigation progress row immediately before mutation
  const revalidatedProgress = await client.query(`
    SELECT
      id,
      completed_blocks,
      version
    FROM tutorial_navigation_progress
    WHERE user_id = $1
      AND navigation_node_id = $2
      AND deleted_at IS NULL
    FOR UPDATE
  `, [USER_ID, NAVIGATION_NODE_ID]);

  if (revalidatedProgress.rows.length === 0) {
    throw new Error('Navigation progress row not found during revalidation');
  }

  const lockedRow = revalidatedProgress.rows[0];

  // Verify state hasn't changed since initial read
  const currentCompleted = Array.isArray(lockedRow.completed_blocks) 
    ? lockedRow.completed_blocks 
    : [];
  const expectedCompleted = Array.isArray(navigationProgress.completed_blocks)
    ? navigationProgress.completed_blocks
    : [];

  if (JSON.stringify(currentCompleted) !== JSON.stringify(expectedCompleted)) {
    throw new Error(
      `Concurrent modification detected: completed_blocks changed between validation and mutation. ` +
      `Expected ${expectedCompleted.length} entries, found ${currentCompleted.length}`
    );
  }

  // Filter out targets from completed_blocks
  const newCompletedBlocks = JSON.stringify(resetTargets.remaining);

  // Execute update with optimistic version lock
  const result = await client.query(`
    UPDATE tutorial_navigation_progress
    SET
      completed_blocks = $1::jsonb,
      updated_at = NOW(),
      version = version + 1
    WHERE id = $2
      AND version = $3
      AND deleted_at IS NULL
    RETURNING *
  `, [newCompletedBlocks, lockedRow.id, lockedRow.version]);

  if (result.rows.length === 0) {
    throw new Error(
      `UPDATE returned no rows (version conflict or row deleted). ` +
      `Expected version ${lockedRow.version}`
    );
  }

  return result.rows[0];
}

// ============================================================
// STEP 7: VERIFY TELEMETRY PRESERVATION
// ============================================================

function verifyTelemetryPreservation(beforeTelemetry, afterTelemetry) {
  const preserved = [];
  const changed = [];

  for (const before of beforeTelemetry) {
    const after = afterTelemetry.find(
      t => t.block_id === before.block_id && t.block_version === before.block_version
    );

    if (!after) {
      changed.push({
        block: `${before.block_version} (${before.block_id})`,
        change: 'ROW DELETED (UNEXPECTED)',
      });
      continue;
    }

    const fields = [
      'visit_count',
      'revision_count',
      'active_time_sec',
      'expected_time_sec',
      'first_viewed_at',
      'last_viewed_at',
      'completed_at',
    ];

    const fieldChanges = [];

    for (const field of fields) {
      // Handle timestamp comparison
      if (field === 'first_viewed_at' || field === 'last_viewed_at' || field === 'completed_at') {
        const beforeVal = before[field] ? new Date(before[field]).getTime() : null;
        const afterVal = after[field] ? new Date(after[field]).getTime() : null;
        if (beforeVal !== afterVal) {
          fieldChanges.push(`${field}: ${formatTimestamp(before[field])} → ${formatTimestamp(after[field])}`);
        }
      } else {
        if (before[field] !== after[field]) {
          fieldChanges.push(`${field}: ${before[field]} → ${after[field]}`);
        }
      }
    }

    if (fieldChanges.length > 0) {
      changed.push({
        block: `${before.block_version} (${before.block_id})`,
        changes: fieldChanges,
      });
    } else {
      preserved.push(`${before.block_version}`);
    }
  }

  return { preserved, changed };
}

// ============================================================
// STEP 8: VERIFY UNRELATED COMPLETION PRESERVATION
// ============================================================

function verifyUnrelatedCompletionPreservation(beforeUnrelated, afterCompleted, requiredBlocks) {
  // Extract unrelated completions from after state
  const afterUnrelated = afterCompleted.filter(completion =>
    !requiredBlocks.some(required =>
      required.blockId === completion.blockId &&
      required.blockVersion === completion.blockVersion
    )
  );

  // Compare counts
  if (beforeUnrelated.length !== afterUnrelated.length) {
    return {
      success: false,
      message: `Unrelated completion count changed: ${beforeUnrelated.length} → ${afterUnrelated.length}`,
      beforeCount: beforeUnrelated.length,
      afterCount: afterUnrelated.length,
    };
  }

  // Compare exact entries (order-independent)
  const sortKey = (c) => `${c.blockId}:${c.blockVersion}`;
  const beforeSorted = [...beforeUnrelated].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const afterSorted = [...afterUnrelated].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  for (let i = 0; i < beforeSorted.length; i++) {
    const before = beforeSorted[i];
    const after = afterSorted[i];

    if (before.blockId !== after.blockId || before.blockVersion !== after.blockVersion) {
      return {
        success: false,
        message: `Unrelated completion identity mismatch at index ${i}`,
        before: `${before.blockVersion} (${before.blockId})`,
        after: `${after.blockVersion} (${after.blockId})`,
      };
    }

    // Also verify completedAt is preserved
    if (before.completedAt !== after.completedAt) {
      return {
        success: false,
        message: `Unrelated completion timestamp changed for ${before.blockVersion}`,
        before: before.completedAt,
        after: after.completedAt,
      };
    }
  }

  return {
    success: true,
    message: beforeUnrelated.length > 0 
      ? `All ${beforeUnrelated.length} unrelated completions preserved`
      : 'No unrelated completions (expected for this reset)',
    count: beforeUnrelated.length,
  };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('');
  console.log('==========================================');
  console.log('R/Y/G SAFE RESET - STEP 4');
  console.log('==========================================');
  console.log('');

  console.log('MODE:', EXECUTE_MODE ? 'EXECUTE' : 'DRY RUN');
  console.log('');

  // Validate configuration
  assertUuid(USER_ID, 'USER_ID');
  assertUuid(SUBTOPIC_ID, 'SUBTOPIC_ID');
  assertUuid(SECTION_ID, 'SECTION_ID');

  console.log('DATABASE:       tutorial database');
  console.log('Navigation:     ', NAVIGATION_NODE_ID);
  console.log('Subtopic:       ', SUBTOPIC_ID);
  console.log('Section:        ', SECTION_ID);
  console.log('Authenticated:  ', AUTHENTICATED_BRAND);
  console.log('Learner:        ', USER_ID);
  console.log('');

  const client = await pool.connect();

  try {
    // Begin transaction (read-only for dry run)
    await client.query('BEGIN');

    console.log('------------------------------------------');
    console.log('REQUIRED BLOCKS (from current content)');
    console.log('------------------------------------------');
    console.log('');

    const requiredBlocks = await resolveRequiredBlocks(client);

    for (const block of requiredBlocks) {
      console.log(`${block.blockVersion}  ${block.blockId}`);
    }

    console.log('');
    console.log('Total:', requiredBlocks.length);
    console.log('');

    console.log('------------------------------------------');
    console.log('CURRENT CANONICAL COMPLETIONS');
    console.log('------------------------------------------');
    console.log('');

    const navigationProgress = await readNavigationProgress(client);
    const completedBlocks = Array.isArray(navigationProgress.completed_blocks)
      ? navigationProgress.completed_blocks
      : [];

    const completionStatus = {};
    for (const required of requiredBlocks) {
      const completed = completedBlocks.some(
        c => c.blockId === required.blockId && c.blockVersion === required.blockVersion
      );
      completionStatus[required.blockVersion] = completed;
      console.log(`${required.blockVersion}  ${completed ? 'COMPLETED' : 'incomplete'}`);
    }

    const completedCount = Object.values(completionStatus).filter(Boolean).length;
    const progressPct = Math.round((completedCount / requiredBlocks.length) * 100);

    console.log('');
    console.log('Current:', `${completedCount}/${requiredBlocks.length}`);
    console.log('Progress:', `${progressPct}%`);
    console.log('Expected R/Y/G:', progressPct >= 100 ? 'GREEN' : progressPct >= 50 ? 'YELLOW' : 'RED');
    console.log('');

    console.log('------------------------------------------');
    console.log('RESET TARGETS');
    console.log('------------------------------------------');
    console.log('');

    const resetTargets = identifyResetTargets(completedBlocks, requiredBlocks);

    for (const required of requiredBlocks) {
      const isTarget = resetTargets.targets.some(
        t => t.blockId === required.blockId && t.blockVersion === required.blockVersion
      );
      console.log(`${required.blockVersion}  ${isTarget ? 'REMOVE' : 'PRESERVE'}`);
    }

    console.log('');
    console.log('Targets to remove:', resetTargets.targets.length);
    console.log('Completions to preserve:', resetTargets.remaining.length);
    console.log('');

    console.log('------------------------------------------');
    console.log('TELEMETRY (block_learning_state)');
    console.log('------------------------------------------');
    console.log('');

    const blockIdentities = requiredBlocks.map(b => ({ blockId: b.blockId, blockVersion: b.blockVersion }));
    const beforeTelemetry = await readBlockLearningState(client, blockIdentities);

    if (beforeTelemetry.length === 0) {
      console.log('No block_learning_state rows found for required blocks');
    } else {
      for (const telemetry of beforeTelemetry) {
        console.log(`${telemetry.block_version}:`);
        console.log(`  visitCount:      ${telemetry.visit_count}`);
        console.log(`  revisionCount:   ${telemetry.revision_count}`);
        console.log(`  activeTimeSec:   ${telemetry.active_time_sec}`);
        console.log(`  expectedTimeSec: ${telemetry.expected_time_sec}`);
        console.log(`  firstViewedAt:   ${formatTimestamp(telemetry.first_viewed_at)}`);
        console.log(`  lastViewedAt:    ${formatTimestamp(telemetry.last_viewed_at)}`);
        console.log('');
      }
    }

    console.log('------------------------------------------');
    console.log('SAFETY CHECKS');
    console.log('------------------------------------------');
    console.log('');

    const { checks, failures } = performSafetyChecks(requiredBlocks, navigationProgress, resetTargets);

    console.log('DATABASE_URL_TUTORIAL:      PASS');
    console.log('Learner identity:           PASS');
    console.log('Section identity:           PASS');
    console.log('Brand resolution:           PASS (matches production logic)');
    console.log('Navigation row locking:     CONFIGURED');
    console.log('Concurrency guard:          CONFIGURED (version-based)');
    console.log('Required block count:      ', failures.find(f => f.includes('Required block count')) ? 'FAIL' : 'PASS');
    console.log('Unique IDs:                ', failures.find(f => f.includes('Unique block IDs')) ? 'FAIL' : 'PASS');
    console.log('Required versions:         ', failures.find(f => f.includes('Required versions')) ? 'FAIL' : 'PASS');
    console.log('Expected I1 identity:      ', failures.find(f => f.includes('I1 blockId')) ? 'FAIL' : 'PASS');
    console.log('Expected D1 identity:      ', failures.find(f => f.includes('D1 blockId')) ? 'FAIL' : 'PASS');
    console.log('Expected C1 identity:      ', failures.find(f => f.includes('C1 blockId')) ? 'FAIL' : 'PASS');
    console.log('Subtopic match:            ', failures.find(f => f.includes('Subtopic mismatch')) ? 'FAIL' : 'PASS');
    console.log('Reset target count:        ', failures.find(f => f.includes('Reset target count')) ? 'FAIL' : 'PASS');
    console.log('Unrelated completions:     ', `${resetTargets.remaining.length} to preserve`);
    console.log('Target identities:          PASS');
    console.log('C1 incomplete:             ', completionStatus['C1'] ? 'FAIL (C1 unexpectedly completed)' : 'PASS');
    console.log('Telemetry verification:     CONFIGURED (7 fields)');
    console.log('');

    if (failures.length > 0) {
      console.log('------------------------------------------');
      console.log('SAFETY CHECK FAILURES');
      console.log('------------------------------------------');
      console.log('');
      for (const failure of failures) {
        console.log(`❌ ${failure}`);
      }
      console.log('');
      throw new Error('Safety checks failed. Aborting.');
    }

    if (EXECUTE_MODE) {
      console.log('------------------------------------------');
      console.log('EXECUTING RESET');
      console.log('------------------------------------------');
      console.log('');

      // Capture unrelated completions before reset
      const unrelatedBeforeReset = resetTargets.remaining;

      const updatedProgress = await executeReset(client, navigationProgress, resetTargets);

      console.log('UPDATE tutorial_navigation_progress:');
      console.log('  SET completed_blocks = [', resetTargets.remaining.length, 'entries ]');
      console.log('  WHERE id =', navigationProgress.id);
      console.log('  AND version =', navigationProgress.version);
      console.log('');

      await client.query('COMMIT');
      console.log('Transaction: COMMIT');
      console.log('');

      // Post-reset verification
      console.log('------------------------------------------');
      console.log('POST-RESET VERIFICATION');
      console.log('------------------------------------------');
      console.log('');

      const verifyProgress = await readNavigationProgress(client);
      const verifyCompleted = Array.isArray(verifyProgress.completed_blocks)
        ? verifyProgress.completed_blocks
        : [];

      const verifyTargetsRemaining = identifyResetTargets(verifyCompleted, requiredBlocks);
      const afterCompletedCount = verifyTargetsRemaining.targets.length;
      const afterProgressPct = Math.round((afterCompletedCount / requiredBlocks.length) * 100);

      console.log('Required completed blocks:', afterCompletedCount);
      console.log('Required total blocks:    ', requiredBlocks.length);
      console.log('Progress:                 ', `${afterProgressPct}%`);
      console.log('Expected R/Y/G:           ', afterProgressPct >= 100 ? 'GREEN' : afterProgressPct >= 50 ? 'YELLOW' : 'RED');
      console.log('');

      if (afterCompletedCount !== 0) {
        console.log('❌ VERIFICATION FAILED: Expected 0 completed required blocks, got', afterCompletedCount);
        process.exitCode = 3;
        return;
      }

      // Verify unrelated completions preserved
      console.log('Unrelated completion preservation:');
      const unrelatedVerification = verifyUnrelatedCompletionPreservation(
        unrelatedBeforeReset,
        verifyCompleted,
        requiredBlocks
      );

      if (!unrelatedVerification.success) {
        console.log('  ❌ FAILED');
        console.log(`    ${unrelatedVerification.message}`);
        if (unrelatedVerification.before) {
          console.log(`    Before: ${unrelatedVerification.before}`);
          console.log(`    After:  ${unrelatedVerification.after}`);
        }
        process.exitCode = 3;
        return;
      } else {
        console.log('  ✅ PASS');
        console.log(`    ${unrelatedVerification.message}`);
      }
      console.log('');

      // Verify telemetry preservation
      const afterTelemetry = await readBlockLearningState(client, blockIdentities);
      const preservation = verifyTelemetryPreservation(beforeTelemetry, afterTelemetry);

      console.log('Telemetry preservation:');
      if (preservation.changed.length > 0) {
        console.log('  ❌ FAILED');
        for (const change of preservation.changed) {
          console.log(`    ${change.block}:`);
          if (change.change) {
            console.log(`      ${change.change}`);
          }
          if (change.changes) {
            for (const c of change.changes) {
              console.log(`      ${c}`);
            }
          }
        }
        process.exitCode = 3;
        return;
      } else {
        console.log('  ✅ PASS');
        if (preservation.preserved.length > 0) {
          console.log('    Preserved:', preservation.preserved.join(', '));
        }
      }

      console.log('');
      console.log('==========================================');
      console.log('✅ RESET SUCCESSFUL');
      console.log('==========================================');
      console.log('');
      console.log('Canonical completion state: 0/3');
      console.log('Expected R/Y/G state:       RED');
      console.log('Telemetry preserved:        YES');
      console.log('Unrelated completions:      PRESERVED');
      console.log('C1 incomplete:              YES');
      console.log('');

    } else {
      await client.query('ROLLBACK');

      console.log('==========================================');
      console.log('✅ DRY RUN PASSED');
      console.log('==========================================');
      console.log('');
      console.log('NO DATABASE MUTATION PERFORMED.');
      console.log('');
      console.log('All safety checks passed.');
      console.log('Reset is ready to execute.');
      console.log('');
      console.log('To execute:');
      console.log('  node scripts/ryg-safe-reset.mjs --execute');
      console.log('');
    }

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }

    console.log('');
    console.log('==========================================');
    console.log('❌ RESET FAILED');
    console.log('==========================================');
    console.log('');
    console.error(error.message);
    console.error('');

    if (error.message.includes('Safety checks failed')) {
      process.exitCode = 1;
    } else if (error.message.includes('not found') || error.message.includes('mismatch')) {
      process.exitCode = 2;
    } else {
      process.exitCode = 3;
    }
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error('');
    console.error('FATAL ERROR:');
    console.error(error);
    console.error('');
    process.exitCode = 3;
  })
  .finally(async () => {
    await pool.end();
  });
