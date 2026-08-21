/**
 * GATE 4 POST-MIGRATION VERIFICATION
 * 
 * Verifies Design B implementation: Active V2 Identity Uniqueness
 * Migration: 0022_active_v2_identity_uniqueness.sql
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment the same way drizzle.config.ts does
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
  console.log('='.repeat(70));
  console.log('GATE 4 POST-MIGRATION DATABASE VERIFICATION');
  console.log('Migration: 0022_active_v2_identity_uniqueness.sql');
  console.log('Design B: Active V2 Identity Uniqueness');
  console.log('='.repeat(70));
  console.log();

  const results: Record<string, 'PASS' | 'FAIL'> = {};

  // PHASE A: Environment
  console.log('PHASE A — ENVIRONMENT');
  if (process.env.DATABASE_URL_TUTORIAL) {
    console.log('✅ DATABASE_URL_TUTORIAL loaded');
    results['Environment'] = 'PASS';
  } else {
    console.log('❌ DATABASE_URL_TUTORIAL not loaded');
    results['Environment'] = 'FAIL';
    return;
  }
  console.log();

  // PHASE B: Verify Database Object
  console.log('PHASE B — DATABASE OBJECT VERIFICATION');
  console.log();

  // B1: Old constraint removed
  console.log('B1. Old constraint removed:');
  const oldConstraint = await db.execute(sql`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'tutorial_sections'::regclass
      AND conname = 'uq_tutorial_v2_identity'
  `);
  
  if (oldConstraint.rows.length === 0) {
    console.log('    ✅ uq_tutorial_v2_identity constraint REMOVED');
    results['Old constraint removed'] = 'PASS';
  } else {
    console.log('    ❌ uq_tutorial_v2_identity constraint STILL EXISTS');
    results['Old constraint removed'] = 'FAIL';
  }
  console.log();

  // B2: New partial unique index exists
  console.log('B2. New partial unique index exists:');
  const newIndex = await db.execute(sql`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'tutorial_sections'
      AND indexname = 'uq_tutorial_v2_identity_active'
  `);
  
  if (newIndex.rows.length > 0) {
    console.log('    ✅ uq_tutorial_v2_identity_active EXISTS');
    results['New partial unique index exists'] = 'PASS';
    
    const indexDef = String(newIndex.rows[0]?.indexdef || '');
    console.log(`    Definition: ${indexDef}`);
    console.log();
    
    // B3: Index uniqueness
    console.log('B3. Index uniqueness:');
    if (indexDef.toUpperCase().includes('UNIQUE')) {
      console.log('    ✅ Index is UNIQUE');
      results['Index uniqueness'] = 'PASS';
    } else {
      console.log('    ❌ Index is NOT UNIQUE');
      results['Index uniqueness'] = 'FAIL';
    }
    console.log();
    
    // B4: Index columns
    console.log('B4. Index columns:');
    if (indexDef.includes('subtopic_id') && indexDef.includes('brand_id')) {
      console.log('    ✅ Columns: subtopic_id, brand_id');
      results['Index columns'] = 'PASS';
    } else {
      console.log('    ❌ Columns incorrect');
      results['Index columns'] = 'FAIL';
    }
    console.log();
    
    // B5: Index predicate
    console.log('B5. Index predicate:');
    if (indexDef.includes('deleted_at IS NULL')) {
      console.log('    ✅ Predicate: WHERE deleted_at IS NULL');
      results['Index predicate'] = 'PASS';
    } else {
      console.log('    ❌ Predicate MISSING or INCORRECT');
      results['Index predicate'] = 'FAIL';
    }
    console.log();
  } else {
    console.log('    ❌ uq_tutorial_v2_identity_active NOT FOUND');
    results['New partial unique index exists'] = 'FAIL';
    results['Index uniqueness'] = 'FAIL';
    results['Index columns'] = 'FAIL';
    results['Index predicate'] = 'FAIL';
  }

  // B6: No conflicting uniqueness
  console.log('B6. No conflicting uniqueness:');
  const allUnique = await db.execute(sql`
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'tutorial_sections'
      AND indexdef LIKE '%UNIQUE%'
      AND (indexdef LIKE '%subtopic_id%' AND indexdef LIKE '%brand_id%')
  `);
  
  if (allUnique.rows.length === 1 && allUnique.rows[0]?.indexname === 'uq_tutorial_v2_identity_active') {
    console.log('    ✅ Only ONE unique index on (subtopic_id, brand_id)');
    results['No conflicting uniqueness'] = 'PASS';
  } else if (allUnique.rows.length > 1) {
    console.log('    ❌ MULTIPLE unique indexes found:');
    allUnique.rows.forEach((row: any) => {
      console.log(`       - ${row.indexname}`);
    });
    results['No conflicting uniqueness'] = 'FAIL';
  } else {
    console.log('    ❌ Expected unique index not found');
    results['No conflicting uniqueness'] = 'FAIL';
  }
  console.log();

  // PHASE C: Data Safety
  console.log('PHASE C — DATA SAFETY');
  console.log();

  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) AS total_tutorials,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_tutorials,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS archived_tutorials
    FROM tutorial_sections
  `);
  
  const totalTutorials = Number(stats.rows[0]?.total_tutorials || 0);
  const activeTutorials = Number(stats.rows[0]?.active_tutorials || 0);
  const archivedTutorials = Number(stats.rows[0]?.archived_tutorials || 0);
  
  console.log(`Total tutorials:    ${totalTutorials}`);
  console.log(`Active tutorials:   ${activeTutorials}`);
  console.log(`Archived tutorials: ${archivedTutorials}`);
  console.log();

  // Check for multiple active with same identity
  const activeDuplicates = await db.execute(sql`
    SELECT 
      subtopic_id,
      brand_id,
      COUNT(*) as count
    FROM tutorial_sections
    WHERE deleted_at IS NULL
    GROUP BY subtopic_id, brand_id
    HAVING COUNT(*) > 1
  `);
  
  if (activeDuplicates.rows.length === 0) {
    console.log('✅ No duplicate active tutorials for same identity');
    results['Data safety'] = 'PASS';
  } else {
    console.log(`❌ ${activeDuplicates.rows.length} duplicate active identities found!`);
    results['Data safety'] = 'FAIL';
  }
  console.log();

  // PHASE D: Drizzle Schema Consistency
  console.log('PHASE D — DRIZZLE SCHEMA CONSISTENCY');
  console.log();

  const schemaPath = path.join(process.cwd(), 'packages/db-tutorial/src/schema/tutorial-sections.ts');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    
    if (schemaContent.includes('uqTutorialV2IdentityActive') && 
        schemaContent.includes('uq_tutorial_v2_identity_active') &&
        schemaContent.includes('deletedAt') &&
        schemaContent.includes('IS NULL')) {
      console.log('✅ Schema contains partial unique index definition');
      results['Drizzle schema consistency'] = 'PASS';
    } else {
      console.log('❌ Schema missing or incomplete partial index definition');
      results['Drizzle schema consistency'] = 'FAIL';
    }
    
    if (schemaContent.includes('uqTutorialV2Identity:') && !schemaContent.includes('uqTutorialV2IdentityActive')) {
      console.log('❌ Schema still contains old uqTutorialV2Identity');
      results['Drizzle schema consistency'] = 'FAIL';
    }
  } else {
    console.log('❌ Schema file not found');
    results['Drizzle schema consistency'] = 'FAIL';
  }
  console.log();

  // PHASE E: Migration History
  console.log('PHASE E — MIGRATION HISTORY');
  console.log();

  const migrationPath = path.join(process.cwd(), 'packages/db-tutorial/migrations/0022_active_v2_identity_uniqueness.sql');
  if (fs.existsSync(migrationPath)) {
    console.log('✅ Migration file 0022_active_v2_identity_uniqueness.sql exists');
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    if (migrationContent.includes('DROP CONSTRAINT') && 
        migrationContent.includes('CREATE UNIQUE INDEX') &&
        migrationContent.includes('uq_tutorial_v2_identity_active') &&
        migrationContent.includes('WHERE') &&
        migrationContent.includes('deleted_at IS NULL')) {
      console.log('✅ Migration contains correct transformation');
      results['Migration recorded'] = 'PASS';
    } else {
      console.log('❌ Migration content incorrect');
      results['Migration recorded'] = 'FAIL';
    }
  } else {
    console.log('❌ Migration file not found');
    results['Migration recorded'] = 'FAIL';
  }
  console.log();

  // FINAL REPORT
  console.log('='.repeat(70));
  console.log('FINAL VERIFICATION REPORT');
  console.log('='.repeat(70));
  console.log();

  Object.entries(results).forEach(([check, status]) => {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${check.padEnd(40)} ${status}`);
  });
  console.log();

  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(r => r === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;

  console.log(`Total checks:  ${totalChecks}`);
  console.log(`Passed:        ${passedChecks}`);
  console.log(`Failed:        ${failedChecks}`);
  console.log();

  if (failedChecks === 0) {
    console.log('🎉 ALL VERIFICATION CHECKS PASSED');
    console.log('✅ Design B implementation successful');
    console.log('✅ Ready to proceed with concurrency testing');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('⚠️  Do not proceed to concurrency testing');
  }
  console.log();
  console.log('='.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
