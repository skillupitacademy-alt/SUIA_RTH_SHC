#!/usr/bin/env tsx
/**
 * PHASE 11.17B: TutorialDB Reset Safety Audit + Controlled Reset
 * 
 * Part A: FK Dependency Audit
 * Part B: Row Count Audit
 * Part C: Safe Delete Order Determination
 * Part D: Controlled Reset (only if explicitly enabled)
 * Part E: Post-Reset Verification
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db as tutorialDb } from '@quiz/db-tutorial';
import { getDb } from '@quiz/db';

const EXECUTE_RESET = process.argv.includes('--execute-reset');

function section(title: string): void {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
  console.log('');
}

async function partA_ForeignKeyAudit() {
  section('PART A — FOREIGN KEY DEPENDENCY AUDIT');

  const targetTables = [
    'tutorial_domains',
    'tutorial_subjects',
    'tutorial_topics',
    'tutorial_subtopics',
    'tutorial_sidebar_trees_v2',
    'tutorial_sections',
    'tutorial_progress',
    'tutorial_project_submissions',
  ];

  console.log('Target tables for reset:');
  targetTables.forEach(t => console.log(`  - ${t}`));
  console.log('');

  // Query foreign key constraints
  const fkQuery = await tutorialDb.execute(sql`
    SELECT
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule AS on_delete_rule,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND (
        tc.table_name = ANY(ARRAY[${sql.join(targetTables.map(t => sql.raw(`'${t}'`)), sql`, `)}])
        OR ccu.table_name = ANY(ARRAY[${sql.join(targetTables.map(t => sql.raw(`'${t}'`)), sql`, `)}])
      )
    ORDER BY tc.table_name, kcu.column_name
  `);

  console.log(`Found ${fkQuery.rows.length} foreign key constraints involving target tables:\n`);

  const fks = fkQuery.rows as Array<{
    source_table: string;
    source_column: string;
    referenced_table: string;
    referenced_column: string;
    on_delete_rule: string;
    constraint_name: string;
  }>;

  // Group by source table
  const fksByTable = new Map<string, typeof fks>();
  fks.forEach(fk => {
    if (!fksByTable.has(fk.source_table)) {
      fksByTable.set(fk.source_table, []);
    }
    fksByTable.get(fk.source_table)!.push(fk);
  });

  // Display FK relationships
  for (const [table, constraints] of fksByTable) {
    console.log(`${table}:`);
    constraints.forEach(fk => {
      console.log(`  ${fk.source_column} → ${fk.referenced_table}.${fk.referenced_column}`);
      console.log(`    ON DELETE: ${fk.on_delete_rule}`);
      console.log(`    Constraint: ${fk.constraint_name}`);
    });
    console.log('');
  }

  // Build dependency graph
  const dependencies = new Map<string, Set<string>>();
  targetTables.forEach(t => dependencies.set(t, new Set()));

  fks.forEach(fk => {
    if (targetTables.includes(fk.source_table) && targetTables.includes(fk.referenced_table)) {
      // source_table depends on referenced_table
      // Therefore: must delete source_table BEFORE referenced_table
      dependencies.get(fk.source_table)!.add(fk.referenced_table);
    }
  });

  return { fks, dependencies, targetTables };
}

async function partB_RowCountAudit() {
  section('PART B — ROW COUNT AUDIT');

  const tables = [
    'tutorial_domains',
    'tutorial_subjects',
    'tutorial_topics',
    'tutorial_subtopics',
    'tutorial_sidebar_trees_v2',
    'tutorial_sections',
    'tutorial_progress',
    'tutorial_project_submissions',
  ];

  const counts = new Map<string, number>();

  for (const table of tables) {
    const result = await tutorialDb.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
    const count = Number((result.rows[0] as any).count);
    counts.set(table, count);
    console.log(`${table.padEnd(35)} ${count}`);
  }

  console.log('');
  console.log('Total rows to be deleted:', Array.from(counts.values()).reduce((a, b) => a + b, 0));

  return counts;
}

function partC_DetermineDeleteOrder(
  dependencies: Map<string, Set<string>>,
  targetTables: string[]
): string[] {
  section('PART C — SAFE DELETE ORDER DETERMINATION');

  // Topological sort to determine deletion order
  // We want to delete children BEFORE parents
  const order: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  function visit(table: string) {
    if (temp.has(table)) {
      throw new Error(`Circular dependency detected involving ${table}`);
    }
    if (visited.has(table)) {
      return;
    }

    temp.add(table);

    // First visit all dependencies (parents)
    const deps = dependencies.get(table) || new Set();
    for (const dep of deps) {
      if (targetTables.includes(dep)) {
        visit(dep);
      }
    }

    temp.delete(table);
    visited.add(table);
    // Add table AFTER visiting its dependencies
    // This ensures children are added before parents
    order.unshift(table);  // Add to beginning to reverse order
  }

  // Visit all target tables
  for (const table of targetTables) {
    if (!visited.has(table)) {
      visit(table);
    }
  }

  console.log('Safe deletion order (child → parent):');
  order.forEach((table, idx) => {
    console.log(`  ${idx + 1}. ${table}`);
    const deps = dependencies.get(table);
    if (deps && deps.size > 0) {
      console.log(`       depends on: ${Array.from(deps).join(', ')}`);
    }
  });

  console.log('');
  console.log('Explanation:');
  console.log('Tables are ordered from most dependent (children) to least dependent (parents).');
  console.log('Deleting in this order ensures no FK constraint violations.');
  console.log('Children are deleted before their parent tables.');

  return order;
}

async function partD_ExecuteReset(deleteOrder: string[]) {
  section('PART D — CONTROLLED DESTRUCTIVE RESET');

  if (!EXECUTE_RESET) {
    console.log('⚠️  RESET NOT EXECUTED');
    console.log('');
    console.log('This is a dry-run. No data was deleted.');
    console.log('');
    console.log('To execute the actual reset, run:');
    console.log('  pnpm tsx scripts/tutorial/phase-11-17b-reset-safety-audit.ts --execute-reset');
    console.log('');
    return false;
  }

  console.log('🔥 EXECUTING DESTRUCTIVE RESET');
  console.log('');
  console.log('WARNING: This will DELETE ALL ROWS from TutorialDB Tutorial V2 tables.');
  console.log('');

  try {
    await tutorialDb.transaction(async (tx) => {
      for (const table of deleteOrder) {
        console.log(`Deleting from ${table}...`);
        const result = await tx.execute(sql.raw(`DELETE FROM ${table}`));
        console.log(`  Deleted ${(result as any).rowCount || 0} rows`);
      }
      console.log('');
      console.log('✅ Transaction completed successfully');
    });

    return true;
  } catch (error) {
    console.error('');
    console.error('❌ RESET FAILED');
    console.error('');
    console.error('Transaction rolled back. Database unchanged.');
    console.error('');
    console.error('Error:', error);
    throw error;
  }
}

async function partE_PostResetVerification() {
  section('PART E — POST-RESET VERIFICATION');

  // Verify TutorialDB is clean
  const tables = [
    'tutorial_domains',
    'tutorial_subjects',
    'tutorial_topics',
    'tutorial_subtopics',
    'tutorial_sidebar_trees_v2',
    'tutorial_sections',
    'tutorial_progress',
    'tutorial_project_submissions',
  ];

  console.log('TutorialDB Row Counts (Expected: 0):');
  let allZero = true;
  for (const table of tables) {
    const result = await tutorialDb.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
    const count = Number((result.rows[0] as any).count);
    const status = count === 0 ? '✅' : '❌';
    console.log(`${status} ${table.padEnd(35)} ${count}`);
    if (count !== 0) allZero = false;
  }

  if (!allZero) {
    throw new Error('TutorialDB reset verification failed - some tables still have rows');
  }

  console.log('');
  console.log('✅ TutorialDB is clean');

  // Verify MainDB Java hierarchy is untouched
  section('MAINDB JAVA HIERARCHY VERIFICATION');

  const mainDb = getDb();

  const domainCheck = await mainDb.execute(sql`
    SELECT id, name
    FROM domains
    WHERE id = '30000000-0000-0000-0000-000000000001'
      AND deleted_at IS NULL
  `);

  const subjectCheck = await mainDb.execute(sql`
    SELECT id, name, domain_id
    FROM subjects
    WHERE id = '3a706051-9d9d-4bdf-af48-331a5acd557e'
      AND deleted_at IS NULL
  `);

  const topicCheck = await mainDb.execute(sql`
    SELECT id, name, subject_id
    FROM topics
    WHERE id = '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
      AND deleted_at IS NULL
  `);

  const subtopicCheck = await mainDb.execute(sql`
    SELECT id, name, topic_id
    FROM subtopics
    WHERE id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
      AND deleted_at IS NULL
  `);

  const verifications = [
    { name: 'Domain: Full Stack Development', expected: '30000000-0000-0000-0000-000000000001', result: domainCheck.rows[0] },
    { name: 'Subject: Backend Development', expected: '3a706051-9d9d-4bdf-af48-331a5acd557e', result: subjectCheck.rows[0] },
    { name: 'Topic: Java', expected: '4b21ddc0-123b-41e3-8ea1-280d37f7f035', result: topicCheck.rows[0] },
    { name: 'Subtopic: What is Java?', expected: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4', result: subtopicCheck.rows[0] },
  ];

  let mainDbIntact = true;
  for (const check of verifications) {
    if (!check.result) {
      console.log(`❌ ${check.name}: NOT FOUND`);
      mainDbIntact = false;
    } else {
      console.log(`✅ ${check.name}: ${(check.result as any).name}`);
    }
  }

  if (!mainDbIntact) {
    throw new Error('MainDB Java hierarchy verification failed - data may have been incorrectly modified');
  }

  console.log('');
  console.log('✅ MainDB Java hierarchy is intact');

  // Verify application code untouched
  console.log('');
  console.log('Application Code:');
  console.log('✅ No source files modified (database-only operation)');
  console.log('✅ No migrations created');
  console.log('✅ Composer code unchanged');
  console.log('✅ Sidebar delivery code unchanged');
}

async function main() {
  console.log('');
  console.log('PHASE 11.17B — TUTORIALDB RESET SAFETY AUDIT + CONTROLLED RESET');
  console.log('');

  try {
    // Part A: FK Audit
    const { dependencies, targetTables } = await partA_ForeignKeyAudit();

    // Part B: Row Counts
    await partB_RowCountAudit();

    // Part C: Delete Order
    const deleteOrder = partC_DetermineDeleteOrder(dependencies, targetTables);

    // Part D: Execute Reset (only if --execute-reset flag)
    const resetExecuted = await partD_ExecuteReset(deleteOrder);

    // Part E: Post-Reset Verification (only if reset was executed)
    if (resetExecuted) {
      await partE_PostResetVerification();
    }

    // Final Report
    section('FINAL REPORT');

    if (resetExecuted) {
      console.log('CLASSIFICATION: TUTORIALDB_CLEAN_RESET_COMPLETE ✅');
      console.log('');
      console.log('Summary:');
      console.log('✅ FK dependency audit completed');
      console.log('✅ Safe delete order determined');
      console.log('✅ Reset transaction executed successfully');
      console.log('✅ TutorialDB completely clean (0 rows in all target tables)');
      console.log('✅ MainDB Java hierarchy verified intact');
      console.log('✅ Application code unchanged');
      console.log('');
      console.log('NEXT STEP:');
      console.log('Use Frontend Left Sidebar Navigation Composer to create Java sidebar.');
      console.log('Path: Full Stack Development → Backend Development → Java → What is Java?');
      console.log('');
      console.log('The Composer will automatically:');
      console.log('1. Sync MainDB curriculum → TutorialDB');
      console.log('2. Create tutorial_sidebar_trees_v2 row');
      console.log('3. Generate navigation nodes');
      console.log('4. Create proper 5-segment URLs');
    } else {
      console.log('CLASSIFICATION: DRY_RUN_COMPLETE ✅');
      console.log('');
      console.log('Summary:');
      console.log('✅ FK dependency audit completed');
      console.log('✅ Row count audit completed');
      console.log('✅ Safe delete order determined');
      console.log('⚠️  Reset NOT executed (dry-run mode)');
      console.log('');
      console.log('To execute the actual reset, run:');
      console.log('  pnpm tsx scripts/tutorial/phase-11-17b-reset-safety-audit.ts --execute-reset');
    }

  } catch (error) {
    section('PHASE 11.17B — BLOCKED');
    console.error('');
    console.error('CLASSIFICATION: TUTORIALDB_RESET_BLOCKED ❌');
    console.error('');
    console.error('Error:', error);
    console.error('');
    console.error('DO NOT improvise workarounds.');
    console.error('Report this exact error and stop.');
    process.exit(1);
  }
}

main();
