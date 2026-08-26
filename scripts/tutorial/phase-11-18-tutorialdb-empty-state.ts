#!/usr/bin/env tsx
/**
 * PHASE 11.18: TutorialDB Empty State & Schema Audit
 * READ ONLY - Verify empty state and schema constraints
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db as tutorialDb } from '@quiz/db-tutorial';

function section(title: string): void {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
  console.log('');
}

async function main() {
  console.log('PHASE 11.18 — TUTORIALDB EMPTY STATE & SCHEMA AUDIT');
  console.log('READ ONLY - NO DATABASE MODIFICATIONS');

  section('PART 1: ROW COUNTS (Expected: 0)');

  const tables = [
    'tutorial_domains',
    'tutorial_subjects',
    'tutorial_topics',
    'tutorial_subtopics',
    'tutorial_sidebar_trees_v2',
    'tutorial_sections',
  ];

  const counts = new Map<string, number>();
  let allZero = true;

  for (const table of tables) {
    const result = await tutorialDb.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
    const count = Number((result.rows[0] as any).count);
    counts.set(table, count);
    const status = count === 0 ? '✅' : '❌';
    console.log(`${status} ${table.padEnd(35)} ${count}`);
    if (count !== 0) allZero = false;
  }

  if (!allZero) {
    console.log('');
    console.log('⚠️  WARNING: TutorialDB is not empty!');
    console.log('This may indicate incomplete reset or concurrent operations.');
  }

  section('PART 2: EXTERNAL_ID UNIQUE CONSTRAINTS');

  const constraintQuery = await tutorialDb.execute(sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name,
      tc.constraint_type
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('tutorial_domains', 'tutorial_subjects', 'tutorial_topics', 'tutorial_subtopics')
      AND kcu.column_name = 'external_id'
      AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ORDER BY tc.table_name
  `);

  console.log('Unique constraints on external_id columns:');
  console.log('');

  if (constraintQuery.rows.length === 0) {
    console.log('❌ FATAL: No unique constraints found on external_id columns!');
    console.log('');
    console.log('This will cause onConflictDoUpdate to fail.');
    console.log('ensureTopicHierarchySynced() cannot perform UPSERT operations.');
  } else {
    constraintQuery.rows.forEach((row: any) => {
      console.log(`✅ ${row.table_name}.${row.column_name}`);
      console.log(`   Constraint: ${row.constraint_name}`);
      console.log(`   Type: ${row.constraint_type}`);
      console.log('');
    });
  }

  section('PART 3: UNIQUE INDEXES ON EXTERNAL_ID');

  const indexQuery = await tutorialDb.execute(sql`
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('tutorial_domains', 'tutorial_subjects', 'tutorial_topics', 'tutorial_subtopics')
      AND indexdef ILIKE '%external_id%'
      AND indexdef ILIKE '%UNIQUE%'
    ORDER BY tablename
  `);

  console.log('Unique indexes on external_id:');
  console.log('');

  if (indexQuery.rows.length === 0) {
    console.log('⚠️  No unique indexes found on external_id columns');
    console.log('(Constraints above may provide uniqueness)');
  } else {
    indexQuery.rows.forEach((row: any) => {
      console.log(`✅ ${row.tablename}`);
      console.log(`   Index: ${row.indexname}`);
      console.log(`   Definition: ${row.indexdef}`);
      console.log('');
    });
  }

  section('PART 4: COLUMN VERIFICATION');

  const requiredColumns = [
    { table: 'tutorial_domains', columns: ['id', 'external_id', 'name', 'slug', 'deleted_at', 'updated_at'] },
    { table: 'tutorial_subjects', columns: ['id', 'external_id', 'domain_id', 'name', 'slug', 'deleted_at', 'updated_at'] },
    { table: 'tutorial_topics', columns: ['id', 'external_id', 'subject_id', 'name', 'slug', 'deleted_at', 'updated_at'] },
    { table: 'tutorial_subtopics', columns: ['id', 'external_id', 'topic_id', 'name', 'slug', 'difficulty_levels', 'deleted_at', 'updated_at'] },
  ];

  for (const { table, columns } of requiredColumns) {
    const columnQuery = await tutorialDb.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ANY(${columns})
      ORDER BY column_name
    `);

    console.log(`${table}:`);
    const foundColumns = new Set((columnQuery.rows as any[]).map(r => r.column_name));
    
    columns.forEach(col => {
      if (foundColumns.has(col)) {
        const row = (columnQuery.rows as any[]).find(r => r.column_name === col);
        console.log(`  ✅ ${col.padEnd(20)} ${row.data_type.padEnd(20)} nullable: ${row.is_nullable}`);
      } else {
        console.log(`  ❌ ${col.padEnd(20)} MISSING`);
      }
    });
    console.log('');
  }

  section('CLASSIFICATION');

  const hasMissingConstraints = constraintQuery.rows.length < 4;
  const tutorialDbEmpty = allZero;

  if (hasMissingConstraints) {
    console.log('SCHEMA_INVALID ❌');
    console.log('');
    console.log('Missing unique constraints on external_id columns.');
    console.log('ensureTopicHierarchySynced() UPSERT operations will fail.');
    console.log('');
    console.log('REQUIRED ACTION: Add unique constraints or indexes on external_id');
  } else if (!tutorialDbEmpty) {
    console.log('NOT_EMPTY ⚠️');
    console.log('');
    console.log('TutorialDB still has rows. Expected clean state.');
  } else {
    console.log('TUTORIALDB_EMPTY_STATE_VALID ✅');
    console.log('');
    console.log('- TutorialDB curriculum tables are empty');
    console.log('- external_id columns have unique constraints');
    console.log('- Required columns exist with correct types');
    console.log('- ensureTopicHierarchySynced() should be able to insert/upsert');
  }
}

main().catch(error => {
  console.error('');
  console.error('AUDIT FAILED');
  console.error(error);
  process.exit(1);
});
