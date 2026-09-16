#!/usr/bin/env node
/**
 * Check FK Constraints for tutorial_progress and tutorial_navigation_progress
 * 
 * Phase 1 Contract Verification: Task #2 and #5
 * 
 * Verifies:
 * 1. tutorial_progress.subtopic_id FK constraint (if any)
 * 2. tutorial_navigation_progress.subtopic_id FK constraint (if any)
 * 3. What identifier type is stored in each table
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use tsx to load TypeScript modules
const { db } = await import('../packages/db-tutorial/src/db.ts');
const { sql } = await import('drizzle-orm');

console.log('='.repeat(80));
console.log('FK CONSTRAINT VERIFICATION');
console.log('='.repeat(80));
console.log();

// Query PostgreSQL system catalog for FK constraints
const fkQuery = sql`
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('tutorial_progress', 'tutorial_navigation_progress')
  AND kcu.column_name = 'subtopic_id'
ORDER BY tc.table_name;
`;

const fkResults = await db.execute(fkQuery);

console.log('FOREIGN KEY CONSTRAINTS ON subtopic_id:');
console.log('-'.repeat(80));

if (fkResults.rows.length === 0) {
  console.log('❌ NO FOREIGN KEY CONSTRAINTS FOUND');
  console.log();
  console.log('This means:');
  console.log('- tutorial_progress.subtopic_id: NO FK constraint (stores UUID without validation)');
  console.log('- tutorial_navigation_progress.subtopic_id: NO FK constraint (stores UUID without validation)');
  console.log('- Database does NOT enforce referential integrity for subtopic_id');
  console.log('- Application layer is responsible for identifier validation');
} else {
  for (const row of fkResults.rows) {
    console.log(`✅ ${row.table_name}.${row.column_name}`);
    console.log(`   → REFERENCES ${row.foreign_table_name}(${row.foreign_column_name})`);
    console.log(`   → Constraint: ${row.constraint_name}`);
    console.log();
  }
}

console.log();
console.log('='.repeat(80));
console.log('SAMPLE DATA VERIFICATION');
console.log('='.repeat(80));
console.log();

// Get a sample subtopic with both IDs
const subtopicQuery = sql`
SELECT id, external_id, name, slug
FROM tutorial_subtopics
WHERE status = 'active'
LIMIT 1;
`;

const subtopicResult = await db.execute(subtopicQuery);

if (subtopicResult.rows.length === 0) {
  console.log('⚠️  No active subtopics found');
  process.exit(0);
}

const subtopic = subtopicResult.rows[0];
console.log('Sample Subtopic:');
console.log(`  Name: ${subtopic.name}`);
console.log(`  Internal ID: ${subtopic.id}`);
console.log(`  External ID: ${subtopic.external_id}`);
console.log();

// Check tutorial_progress for this subtopic
const progressInternalQuery = sql`
SELECT COUNT(*) as count
FROM tutorial_progress
WHERE subtopic_id = ${subtopic.id}
  AND deleted_at IS NULL;
`;

const progressExternalQuery = sql`
SELECT COUNT(*) as count
FROM tutorial_progress
WHERE subtopic_id = ${subtopic.external_id}
  AND deleted_at IS NULL;
`;

const progressInternal = await db.execute(progressInternalQuery);
const progressExternal = await db.execute(progressExternalQuery);

console.log('tutorial_progress lookups:');
console.log(`  WHERE subtopic_id = internal_id: ${progressInternal.rows[0].count} rows`);
console.log(`  WHERE subtopic_id = external_id: ${progressExternal.rows[0].count} rows`);
console.log();

// Check tutorial_navigation_progress for this subtopic
const navProgressInternalQuery = sql`
SELECT COUNT(*) as count
FROM tutorial_navigation_progress
WHERE subtopic_id = ${subtopic.id}
  AND deleted_at IS NULL;
`;

const navProgressExternalQuery = sql`
SELECT COUNT(*) as count
FROM tutorial_navigation_progress
WHERE subtopic_id = ${subtopic.external_id}
  AND deleted_at IS NULL;
`;

const navProgressInternal = await db.execute(navProgressInternalQuery);
const navProgressExternal = await db.execute(navProgressExternalQuery);

console.log('tutorial_navigation_progress lookups:');
console.log(`  WHERE subtopic_id = internal_id: ${navProgressInternal.rows[0].count} rows`);
console.log(`  WHERE subtopic_id = external_id: ${navProgressExternal.rows[0].count} rows`);
console.log();

console.log('='.repeat(80));
console.log('CONCLUSION');
console.log('='.repeat(80));
console.log();

if (fkResults.rows.length === 0) {
  console.log('1. NO FK CONSTRAINTS on subtopic_id columns');
  console.log('2. Database allows storing ANY UUID (internal or external)');
  console.log('3. Application code determines which ID type to use');
  console.log('4. Actual usage must be verified by inspecting stored data patterns');
  console.log();
  
  if (progressInternal.rows[0].count > 0 && progressExternal.rows[0].count === 0) {
    console.log('   tutorial_progress appears to use INTERNAL ID (based on sample data)');
  } else if (progressExternal.rows[0].count > 0 && progressInternal.rows[0].count === 0) {
    console.log('   tutorial_progress appears to use EXTERNAL ID (based on sample data)');
  } else {
    console.log('   tutorial_progress usage pattern unclear (need more data samples)');
  }
  
  if (navProgressInternal.rows[0].count > 0 && navProgressExternal.rows[0].count === 0) {
    console.log('   tutorial_navigation_progress appears to use INTERNAL ID (based on sample data)');
  } else if (navProgressExternal.rows[0].count > 0 && navProgressInternal.rows[0].count === 0) {
    console.log('   tutorial_navigation_progress appears to use EXTERNAL ID (based on sample data)');
  } else {
    console.log('   tutorial_navigation_progress usage pattern unclear (need more data samples)');
  }
} else {
  console.log('FK constraints found - referential integrity is enforced by database');
}

console.log();
process.exit(0);
