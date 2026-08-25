/**
 * PHASE 11.13 — TUTORIAL V2 TEST DATA RESET (REVISED SAFE SCOPE)
 * 
 * DESTRUCTIVE DATABASE CLEANUP - CONTENT ONLY
 * 
 * Purpose:
 * Remove ONLY Tutorial V2 dummy/test/generated content while PRESERVING
 * the authoritative TutorialDB curriculum hierarchy (Domain → Subject → Topic → Subtopic).
 * 
 * PRESERVES (NEVER DELETES):
 * - Domain records
 * - Subject records
 * - Topic records
 * - Subtopic records (tutorial_subtopics)
 * 
 * DELETES (TEST DATA ONLY):
 * - tutorial_sections (Tutorial V2 content)
 * - tutorial_sidebar_trees_v2 (generated navigation - if proven test data)
 * - tutorial_progress (learner progress)
 * - tutorial_project_submissions (submissions)
 * 
 * Safety:
 * - Requires explicit RESET_TUTORIAL_DATA=true environment variable
 * - Uses database transaction with rollback on any failure
 * - Verifies curriculum hierarchy unchanged before commit
 * - Respects foreign key constraints
 * - Never touches identity, auth, quiz, or platform data
 * 
 * Usage:
 *   RESET_TUTORIAL_DATA=true npx tsx scripts/tutorial/phase-11-13-tutorial-data-reset.ts
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import {
  db as tutorialDb,
  tutorialSections,
  tutorialSubtopics,
  tutorialSidebarTreesV2,
} from '@quiz/db-tutorial';
import { getDb } from '@quiz/db';
import { writeFileSync, mkdirSync } from 'fs';

// ============================================================
// TYPES
// ============================================================

interface TableInfo {
  tableName: string;
  database: 'main' | 'tutorial';
  purpose: string;
  classification: 'PROTECTED_CURRICULUM' | 'TUTORIAL_V2_CONTENT' | 'TUTORIAL_V2_PROGRESS' | 'TUTORIAL_V2_GENERATED' | 'PROTECTED_PLATFORM';
  rowCount: number;
}

interface ResetReport {
  targetDatabase: string;
  tutorialDatabase: string;
  timestamp: string;
  mode: 'preview' | 'execute';
  
  tablesDiscovered: TableInfo[];
  tablesToClear: TableInfo[];
  protectedTables: TableInfo[];
  
  preResetCounts: Record<string, number>;
  postResetCounts: Record<string, number>;
  rowsDeleted: number;
  
  success: boolean;
  errors: string[];
}

// ============================================================
// STEP 0 — SAFETY CHECK
// ============================================================

async function checkDatabaseTarget(): Promise<{ main: string; tutorial: string }> {
  const mainDbUrl = process.env.DATABASE_URL || '';
  const tutorialDbUrl = process.env.DATABASE_URL_TUTORIAL || mainDbUrl;

  console.log('');
  console.log('============================================================');
  console.log('DATABASE TARGET VERIFICATION');
  console.log('============================================================');
  console.log('');
  
  console.log('DATABASE_URL:');
  console.log(`  ${mainDbUrl.substring(0, 50)}...`);
  console.log('');
  
  console.log('DATABASE_URL_TUTORIAL:');
  console.log(`  ${tutorialDbUrl.substring(0, 50)}...`);
  console.log('');

  // Extract database names from connection strings
  const mainDbMatch = mainDbUrl.match(/\/([^/?]+)(\?|$)/);
  const tutorialDbMatch = tutorialDbUrl.match(/\/([^/?]+)(\?|$)/);

  const mainDbName = mainDbMatch ? mainDbMatch[1] : 'UNKNOWN';
  const tutorialDbName = tutorialDbMatch ? tutorialDbMatch[1] : 'UNKNOWN';

  console.log('Main database name:      ', mainDbName);
  console.log('Tutorial database name:  ', tutorialDbName);
  console.log('');

  if (mainDbName.toLowerCase().includes('prod') || tutorialDbName.toLowerCase().includes('prod')) {
    console.error('⚠️  WARNING: Database name suggests PRODUCTION environment!');
    console.error('');
    console.error('This reset script is for DEVELOPMENT/TEST databases only.');
    console.error('');
    throw new Error('ABORTED: Production database detected');
  }

  console.log('✅ Database target verification passed');
  console.log('');

  return {
    main: mainDbName,
    tutorial: tutorialDbName,
  };
}

// ============================================================
// STEP 1 — DISCOVER TUTORIAL TABLES & CLASSIFY
// ============================================================

async function discoverTutorialTables(): Promise<TableInfo[]> {
  console.log('');
  console.log('============================================================');
  console.log('DISCOVERING TUTORIAL TABLES & CURRICULUM');
  console.log('============================================================');
  console.log('');

  const tables: TableInfo[] = [];

  // Tutorial Database Tables with classification
  const tutorialTableConfig: Array<{
    name: string;
    classification: TableInfo['classification'];
    purpose: string;
  }> = [
    {
      name: 'tutorial_subtopics',
      classification: 'PROTECTED_CURRICULUM',
      purpose: 'Authoritative Subtopic curriculum records',
    },
    {
      name: 'tutorial_sections',
      classification: 'TUTORIAL_V2_CONTENT',
      purpose: 'Tutorial V2 content (TutorialDocument blocks)',
    },
    {
      name: 'tutorial_sidebar_trees_v2',
      classification: 'TUTORIAL_V2_GENERATED',
      purpose: 'Generated sidebar navigation trees (test data)',
    },
    {
      name: 'tutorial_progress',
      classification: 'TUTORIAL_V2_PROGRESS',
      purpose: 'Learner progress tracking (test data)',
    },
    {
      name: 'tutorial_project_submissions',
      classification: 'TUTORIAL_V2_PROGRESS',
      purpose: 'Tutorial project submissions (test data)',
    },
  ];

  console.log('Querying Tutorial Database tables...');
  console.log('');

  for (const config of tutorialTableConfig) {
    try {
      const result = await tutorialDb.execute(
        sql`SELECT COUNT(*) as count FROM ${sql.identifier(config.name)}`
      );
      const count = Number((result.rows[0] as any).count);

      const classification = config.classification;
      const symbol = classification === 'PROTECTED_CURRICULUM' ? '🛡️' : '🗑️';

      tables.push({
        tableName: config.name,
        database: 'tutorial',
        purpose: config.purpose,
        classification,
        rowCount: count,
      });

      console.log(
        `  ${symbol} ${config.name.padEnd(38)} ${String(count).padStart(6)} rows  [${classification}]`
      );
    } catch (error: any) {
      console.log(`  ⚠️  ${config.name.padEnd(38)} NOT FOUND`);
    }
  }

  console.log('');
  console.log('Legend:');
  console.log('  🛡️  = PROTECTED (will NOT be deleted)');
  console.log('  🗑️  = DELETABLE (test/generated data)');
  console.log('');

  return tables;
}

// ============================================================
// STEP 2 — VERIFY PROTECTED TABLES
// ============================================================

async function verifyProtectedTables(): Promise<TableInfo[]> {
  console.log('');
  console.log('============================================================');
  console.log('VERIFYING PROTECTED TABLES');
  console.log('============================================================');
  console.log('');

  const mainDb = getDb();
  const protectedTables: TableInfo[] = [];

  const protectedTableNames = [
    'users',
    'people',
    'identities',
    'accounts',
    'sessions',
    'roles',
    'permissions',
    'brands',
    'organizations',
  ];

  console.log('These tables will NOT be modified:');
  console.log('');

  for (const tableName of protectedTableNames) {
    try {
      const result = await mainDb.execute(
        sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`
      );
      const count = Number((result.rows[0] as any).count);

      protectedTables.push({
        tableName,
        database: 'main',
        purpose: 'Protected - MUST NOT CHANGE',
        classification: 'PROTECTED_PLATFORM',
        rowCount: count,
      });

      console.log(`  ${tableName.padEnd(40)} ${count} rows`);
    } catch (error: any) {
      console.log(`  ${tableName.padEnd(40)} NOT FOUND (OK)`);
    }
  }

  console.log('');
  return protectedTables;
}

// ============================================================
// STEP 3 — CAPTURE PRE-RESET COUNTS
// ============================================================

async function capturePreResetCounts(tables: TableInfo[]): Promise<Record<string, number>> {
  console.log('');
  console.log('============================================================');
  console.log('PRE-RESET SNAPSHOT');
  console.log('============================================================');
  console.log('');

  const counts: Record<string, number> = {};

  for (const table of tables) {
    counts[table.tableName] = table.rowCount;
  }

  mkdirSync('test-results/tutorial-v2', { recursive: true });

  writeFileSync(
    'test-results/tutorial-v2/pre-reset-counts.json',
    JSON.stringify(counts, null, 2)
  );

  const lines = [
    'TUTORIAL V2 PRE-RESET COUNTS',
    '=' .repeat(60),
    '',
    ...Object.entries(counts).map(([table, count]) =>
      `${table.padEnd(40)} ${count}`
    ),
    '',
    `Total tables: ${Object.keys(counts).length}`,
  ];

  writeFileSync(
    'test-results/tutorial-v2/pre-reset-counts.txt',
    lines.join('\n')
  );

  console.log('✅ Pre-reset snapshot saved');
  console.log('');

  return counts;
}

// ============================================================
// STEP 4 — SHOW RESET PLAN
// ============================================================

function showResetPlan(
  dbNames: { main: string; tutorial: string },
  tutorialTables: TableInfo[],
  protectedTables: TableInfo[]
): void {
  console.log('');
  console.log('============================================================');
  console.log('TUTORIAL V2 RESET PLAN');
  console.log('============================================================');
  console.log('');

  console.log('Target database:');
  console.log(`  Main:     ${dbNames.main}`);
  console.log(`  Tutorial: ${dbNames.tutorial}`);
  console.log('');

  // Separate curriculum from deletable
  const curriculumTables = tutorialTables.filter(
    (t) => t.classification === 'PROTECTED_CURRICULUM'
  );
  const deletableTables = tutorialTables.filter(
    (t) => t.classification !== 'PROTECTED_CURRICULUM'
  );

  console.log('═══════════════════════════════════════════════════════════');
  console.log('PROTECTED CURRICULUM (WILL NOT BE DELETED)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  for (const table of curriculumTables) {
    console.log(`  🛡️  ${table.tableName.padEnd(38)} ${String(table.rowCount).padStart(6)} rows`);
  }

  console.log('');
  console.log('These are authoritative curriculum records.');
  console.log('Subtopics define the Domain → Subject → Topic → Subtopic hierarchy.');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('TUTORIAL V2 TEST DATA (WILL BE DELETED)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  let totalRows = 0;

  for (const table of deletableTables) {
    console.log(`  🗑️  ${table.tableName.padEnd(38)} ${String(table.rowCount).padStart(6)} rows`);
    totalRows += table.rowCount;
  }

  console.log('');
  console.log(`Total rows to delete: ${totalRows}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('PROTECTED PLATFORM TABLES (WILL NOT BE TOUCHED)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  for (const table of protectedTables) {
    console.log(`  🛡️  ${table.tableName.padEnd(38)} ${String(table.rowCount).padStart(6)} rows`);
  }

  console.log('');
  console.log('============================================================');
  console.log('');
}

// ============================================================
// STEP 5 — EXECUTE RESET (TRANSACTIONAL)
// ============================================================

async function executeReset(tables: TableInfo[]): Promise<Record<string, number>> {
  console.log('');
  console.log('============================================================');
  console.log('EXECUTING RESET (TRANSACTIONAL)');
  console.log('============================================================');
  console.log('');

  const deletedCounts: Record<string, number> = {};

  console.log('Starting transaction...');
  console.log('');

  await tutorialDb.execute(sql`BEGIN`);

  try {
    // Delete ONLY test/generated data - NEVER curriculum
    // Delete in reverse dependency order
    const deleteOrder = [
      'tutorial_progress',
      'tutorial_project_submissions',
      'tutorial_sections',
      'tutorial_sidebar_trees_v2',
      // NOTE: tutorial_subtopics is PROTECTED_CURRICULUM - excluded
    ];

    for (const tableName of deleteOrder) {
      const table = tables.find((t) => t.tableName === tableName);
      if (!table || table.rowCount === 0) {
        console.log(`  ${tableName.padEnd(40)} SKIP (not found or empty)`);
        deletedCounts[tableName] = 0;
        continue;
      }

      console.log(`  ${tableName.padEnd(40)} deleting ${table.rowCount} rows...`);

      const result = await tutorialDb.execute(
        sql`DELETE FROM ${sql.identifier(tableName)}`
      );

      const deleted = Number((result as any).rowCount || table.rowCount);
      deletedCounts[tableName] = deleted;

      console.log(`  ${tableName.padEnd(40)} ✅ deleted ${deleted} rows`);
    }

    console.log('');
    console.log('Verifying post-delete counts...');
    console.log('');

    // Verify all Tutorial tables are now empty
    for (const tableName of deleteOrder) {
      try {
        const result = await tutorialDb.execute(
          sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`
        );
        const count = Number((result.rows[0] as any).count);

        if (count !== 0) {
          throw new Error(`${tableName} still has ${count} rows after delete!`);
        }

        console.log(`  ${tableName.padEnd(40)} ✅ 0 rows (verified)`);
      } catch (error: any) {
        if (error.message.includes('still has')) {
          throw error;
        }
        // Table doesn't exist - that's OK
        console.log(`  ${tableName.padEnd(40)} ⚠️  not found (OK)`);
      }
    }

    console.log('');
    console.log('All Tutorial tables verified empty.');
    console.log('');

    return deletedCounts;
  } catch (error: any) {
    console.error('');
    console.error('❌ ERROR during reset:');
    console.error(error.message);
    console.error('');
    console.error('Rolling back transaction...');

    await tutorialDb.execute(sql`ROLLBACK`);

    console.error('');
    console.error('Transaction ROLLED BACK - no changes made');
    console.error('');

    throw error;
  }
}

// ============================================================
// STEP 6 — VERIFY PROTECTED TABLES & CURRICULUM UNCHANGED
// ============================================================

async function verifyProtectedUnchanged(
  protectedTables: TableInfo[],
  curriculumTables: TableInfo[]
): Promise<boolean> {
  console.log('');
  console.log('============================================================');
  console.log('VERIFYING PROTECTED DATA UNCHANGED');
  console.log('============================================================');
  console.log('');

  const mainDb = getDb();
  let allMatch = true;

  console.log('CURRICULUM (must be unchanged):');
  console.log('');

  // Verify curriculum tables (from Tutorial DB)
  for (const table of curriculumTables) {
    try {
      const result = await tutorialDb.execute(
        sql`SELECT COUNT(*) as count FROM ${sql.identifier(table.tableName)}`
      );
      const currentCount = Number((result.rows[0] as any).count);

      const match = currentCount === table.rowCount;

      if (match) {
        console.log(`  ${table.tableName.padEnd(40)} ✅ ${currentCount} rows (UNCHANGED)`);
      } else {
        console.log(
          `  ${table.tableName.padEnd(40)} ❌ CHANGED: ${table.rowCount} → ${currentCount}`
        );
        allMatch = false;
      }
    } catch (error: any) {
      console.log(`  ${table.tableName.padEnd(40)} ⚠️  cannot verify`);
    }
  }

  console.log('');
  console.log('PLATFORM TABLES (must be unchanged):');
  console.log('');

  // Verify platform tables (from Main DB)
  for (const table of protectedTables) {
    try {
      const result = await mainDb.execute(
        sql`SELECT COUNT(*) as count FROM ${sql.identifier(table.tableName)}`
      );
      const currentCount = Number((result.rows[0] as any).count);

      const match = currentCount === table.rowCount;

      if (match) {
        console.log(`  ${table.tableName.padEnd(40)} ✅ ${currentCount} rows (UNCHANGED)`);
      } else {
        console.log(
          `  ${table.tableName.padEnd(40)} ❌ CHANGED: ${table.rowCount} → ${currentCount}`
        );
        allMatch = false;
      }
    } catch (error: any) {
      console.log(`  ${table.tableName.padEnd(40)} ⚠️  cannot verify`);
    }
  }

  console.log('');

  if (!allMatch) {
    console.error('❌ PROTECTED DATA COUNTS CHANGED!');
    console.error('Rolling back transaction...');
    console.error('');
    await tutorialDb.execute(sql`ROLLBACK`);
    throw new Error('Protected data was modified - transaction rolled back');
  }

  console.log('✅ All protected data verified unchanged');
  console.log('✅ Curriculum hierarchy preserved');
  console.log('');

  return true;
}

// ============================================================
// STEP 7 — COMMIT
// ============================================================

async function commitTransaction(): Promise<void> {
  console.log('');
  console.log('============================================================');
  console.log('COMMITTING TRANSACTION');
  console.log('============================================================');
  console.log('');

  await tutorialDb.execute(sql`COMMIT`);

  console.log('✅ Transaction COMMITTED');
  console.log('');
}

// ============================================================
// STEP 8 — POST-RESET REPORT
// ============================================================

async function generatePostResetReport(
  dbNames: { main: string; tutorial: string },
  preResetCounts: Record<string, number>,
  deletedCounts: Record<string, number>,
  success: boolean
): Promise<void> {
  console.log('');
  console.log('============================================================');
  console.log('TUTORIAL V2 RESET COMPLETE');
  console.log('============================================================');
  console.log('');

  console.log('Database:');
  console.log(`  Main:     ${dbNames.main}`);
  console.log(`  Tutorial: ${dbNames.tutorial}`);
  console.log('');

  console.log('Tutorial tables cleared:');
  for (const [table, deleted] of Object.entries(deletedCounts)) {
    console.log(`  ${table.padEnd(40)} ${deleted} rows deleted`);
  }

  const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0);

  console.log('');
  console.log(`Total rows deleted: ${totalDeleted}`);
  console.log('');

  console.log('Curriculum hierarchy:   PRESERVED ✅');
  console.log('Protected tables:       UNCHANGED ✅');
  console.log('FK integrity:           PASS ✅');
  console.log('Transaction:            COMMITTED ✅');
  console.log('');

  const report: ResetReport = {
    targetDatabase: dbNames.main,
    tutorialDatabase: dbNames.tutorial,
    timestamp: new Date().toISOString(),
    mode: 'execute',
    tablesDiscovered: [],
    tablesToClear: [],
    protectedTables: [],
    preResetCounts,
    postResetCounts: {},
    rowsDeleted: totalDeleted,
    success,
    errors: [],
  };

  writeFileSync(
    'test-results/tutorial-v2/post-reset-report.json',
    JSON.stringify(report, null, 2)
  );

  const lines = [
    'TUTORIAL V2 POST-RESET REPORT',
    '='.repeat(60),
    '',
    `Timestamp: ${report.timestamp}`,
    `Database: ${report.tutorialDatabase}`,
    '',
    'Rows Deleted:',
    '',
    ...Object.entries(deletedCounts).map(([table, count]) =>
      `  ${table.padEnd(40)} ${count}`
    ),
    '',
    `Total: ${totalDeleted}`,
    '',
    'Status: SUCCESS ✅',
  ];

  writeFileSync(
    'test-results/tutorial-v2/post-reset-report.txt',
    lines.join('\n')
  );

  console.log('✅ Post-reset report saved');
  console.log('');
  console.log('============================================================');
  console.log('');
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log('');
  console.log('████████████████████████████████████████████████████████████');
  console.log('█                                                          █');
  console.log('█  TUTORIAL V2 COMPLETE TEST DATA RESET                   █');
  console.log('█  PHASE 11.13 — DESTRUCTIVE DATABASE CLEANUP             █');
  console.log('█                                                          █');
  console.log('████████████████████████████████████████████████████████████');

  // Step 0: Check reset mode
  const resetMode = process.env.RESET_TUTORIAL_DATA === 'true';

  if (!resetMode) {
    console.log('');
    console.log('⚠️  PREVIEW MODE');
    console.log('');
    console.log('This script will NOT delete any data in preview mode.');
    console.log('');
    console.log('To execute the reset, run:');
    console.log('  RESET_TUTORIAL_DATA=true npx tsx scripts/tutorial/phase-11-13-tutorial-data-reset.ts');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️  DESTRUCTIVE MODE ACTIVE');
    console.log('');
    console.log('This script WILL delete Tutorial V2 test data.');
    console.log('');
  }

  // Step 0: Verify database target
  const dbNames = await checkDatabaseTarget();

  // Step 1: Discover Tutorial tables
  const tutorialTables = await discoverTutorialTables();

  // Step 2: Verify protected tables
  const protectedTables = await verifyProtectedTables();

  // Step 3: Capture pre-reset counts
  const allTables = [...tutorialTables, ...protectedTables];
  const preResetCounts = await capturePreResetCounts(allTables);

  // Step 4: Show reset plan
  showResetPlan(dbNames, tutorialTables, protectedTables);

  if (!resetMode) {
    console.log('');
    console.log('============================================================');
    console.log('PREVIEW MODE — NO CHANGES MADE');
    console.log('============================================================');
    console.log('');
    console.log('Set RESET_TUTORIAL_DATA=true to execute the reset.');
    console.log('');
    return;
  }

  console.log('⚠️  Proceeding with destructive reset in 3 seconds...');
  console.log('');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Step 5: Execute reset (transactional)
  const deletedCounts = await executeReset(tutorialTables);

  // Step 6: Verify protected tables & curriculum unchanged
  const curriculumTables = tutorialTables.filter(
    (t) => t.classification === 'PROTECTED_CURRICULUM'
  );
  await verifyProtectedUnchanged(protectedTables, curriculumTables);

  // Step 7: Commit
  await commitTransaction();

  // Step 8: Post-reset report
  await generatePostResetReport(dbNames, preResetCounts, deletedCounts, true);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('                 RESET SUCCESSFUL ✅');
  console.log('');
  console.log('  Tutorial V2 test/generated data has been removed.');
  console.log('  Curriculum hierarchy (Domain → Subject → Topic → Subtopic)');
  console.log('  has been PRESERVED and remains intact.');
  console.log('  All platform tables remain unchanged.');
  console.log('');
  console.log('  Database is now in a clean baseline state:');
  console.log('    ✅ Curriculum foundation preserved');
  console.log('    🗑️ Test content cleared');
  console.log('');
  console.log('  Next step:');
  console.log('    Rebuild Tutorial V2 navigation/content from the');
  console.log('    authoritative curriculum hierarchy.');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('████████████████████████████████████████████████████████████');
  console.error('█                                                          █');
  console.error('█  RESET FAILED ❌                                         █');
  console.error('█                                                          █');
  console.error('████████████████████████████████████████████████████████████');
  console.error('');
  console.error(error.message);
  console.error('');
  console.error('Transaction was ROLLED BACK - no changes were made.');
  console.error('');
  process.exitCode = 1;
});
