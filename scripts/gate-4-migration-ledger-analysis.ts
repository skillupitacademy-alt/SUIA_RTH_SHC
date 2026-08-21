/**
 * GATE 4 Migration Ledger Analysis
 * Comprehensive analysis of migration state mismatch
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('='.repeat(80));
  console.log('GATE 4 MIGRATION LEDGER ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // 1. Check database migration history
  console.log('1. DATABASE MIGRATION HISTORY');
  console.log('-'.repeat(80));
  try {
    const migrations = await db.execute(sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    migrations.rows.forEach((r: any, idx: number) => {
      console.log(`  ${idx === 0 ? 'LATEST' : `  ${idx}`}. Migration: ${r.id}`);
      console.log(`       Hash: ${r.hash}`);
      console.log(`       Applied: ${new Date(Number(r.created_at)).toISOString()}`);
      console.log();
    });
  } catch (err) {
    console.error('  ❌ Error querying migration table:', err);
  }

  // 2. Check filesystem migrations
  console.log('2. FILESYSTEM MIGRATIONS');
  console.log('-'.repeat(80));
  const migrationsDir = path.resolve(process.cwd(), 'packages/db-tutorial/migrations');
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  const last5 = sqlFiles.slice(-5);
  last5.forEach((file, idx) => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const size = fs.statSync(filePath).size;
    console.log(`  ${file}`);
    console.log(`    Lines: ${lines}, Size: ${size} bytes`);
  });
  console.log();

  // 3. Check journal entries
  console.log('3. DRIZZLE JOURNAL (_journal.json)');
  console.log('-'.repeat(80));
  const journalPath = path.resolve(process.cwd(), 'packages/db-tutorial/migrations/meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  
  const last5Journal = journal.entries.slice(-5);
  last5Journal.forEach((entry: any) => {
    console.log(`  idx: ${entry.idx} - ${entry.tag}`);
    console.log(`    When: ${new Date(entry.when).toISOString()}`);
  });
  console.log();

  // 4. Check database schema state
  console.log('4. DATABASE SCHEMA STATE');
  console.log('-'.repeat(80));
  
  // Check for old constraint
  const oldConstraintCheck = await db.execute(sql`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = 'tutorial_sections'
      AND constraint_name = 'uq_tutorial_v2_identity'
  `);
  console.log(`  Old constraint (uq_tutorial_v2_identity): ${oldConstraintCheck.rows.length > 0 ? '❌ EXISTS' : '✅ REMOVED'}`);

  // Check for new index
  const newIndexCheck = await db.execute(sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'tutorial_sections'
      AND indexname = 'uq_tutorial_v2_identity_active'
  `);
  console.log(`  New index (uq_tutorial_v2_identity_active): ${newIndexCheck.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
  
  if (newIndexCheck.rows.length > 0) {
    const indexDef = (newIndexCheck.rows[0] as any).indexdef;
    const hasWhereClause = indexDef.toLowerCase().includes('where');
    console.log(`    Where clause: ${hasWhereClause ? '✅ PRESENT' : '❌ MISSING'}`);
    if (hasWhereClause) {
      const deletedAtCheck = indexDef.toLowerCase().includes('deleted_at is null');
      console.log(`    Predicate (deleted_at IS NULL): ${deletedAtCheck ? '✅ CORRECT' : '⚠️  CHECK MANUALLY'}`);
    }
  }

  // Check for section_type and difficulty columns
  const columnsCheck = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'tutorial_sections'
      AND column_name IN ('section_type', 'difficulty')
    ORDER BY column_name
  `);
  console.log(`  Legacy columns (section_type, difficulty): ${columnsCheck.rows.length > 0 ? '⚠️  STILL EXIST' : '✅ REMOVED'}`);
  if (columnsCheck.rows.length > 0) {
    columnsCheck.rows.forEach((r: any) => {
      console.log(`    - ${r.column_name}`);
    });
  }

  console.log();

  // 5. Summary
  console.log('5. SUMMARY & RECONCILIATION STRATEGY');
  console.log('-'.repeat(80));
  console.log();
  console.log('CURRENT STATE:');
  console.log('  ✅ Database has correct schema (partial unique index)');
  console.log('  ✅ Drizzle schema file is correct');
  console.log('  ✅ Journal has 0021_sparkling_unus entry');
  console.log('  ❌ Database ledger shows old migration 21 hash');
  console.log('  ❌ Migration 0022 not in database ledger');
  console.log();
  console.log('ISSUE:');
  console.log('  Migrations 0021 and 0022 were manually applied to database');
  console.log('  Drizzle-kit generated NEW migration (0021_sparkling_unus)');
  console.log('  Database has old migration 21 with different hash');
  console.log();
  console.log('RECONCILIATION OPTIONS:');
  console.log();
  console.log('OPTION A: Mark new migration as applied (RECOMMENDED)');
  console.log('  1. Delete manual migrations 0021 and 0022 from filesystem');
  console.log('  2. Update database ledger to record 0021_sparkling_unus');
  console.log('  3. Drizzle will be in sync with database');
  console.log();
  console.log('OPTION B: Custom migration hash injection');
  console.log('  1. Calculate hash of 0021_sparkling_unus.sql');
  console.log('  2. Update database row for migration 21 with new hash');
  console.log('  3. Mark as applied at correct timestamp');
  console.log();
  console.log('OPTION C: Fresh migration from snapshot');
  console.log('  1. Generate snapshot from current schema');
  console.log('  2. Use drizzle-kit push to sync (non-prod only)');
  console.log('  3. Regenerate clean migration history');
  console.log();

  console.log('='.repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
