/**
 * GATE 4 — Check for Multiple Archived Tutorials
 * READ-ONLY database audit to determine archive semantics
 */

import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('='.repeat(60));
  console.log('GATE 4 ARCHITECTURAL REVIEW — ARCHIVE SEMANTICS');
  console.log('='.repeat(60));
  console.log();

  // Check for multiple active rows for same identity (should be 0)
  console.log('Query 1: Multiple ACTIVE rows for same (subtopic_id, brand_id)?');
  console.log('Expected: 0 rows (unique constraint should prevent this)');
  const activeMultiple = await db.execute(sql`
    SELECT 
      subtopic_id,
      brand_id,
      COUNT(*) AS total_rows,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_rows,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS archived_rows
    FROM tutorial_sections
    GROUP BY subtopic_id, brand_id
    HAVING COUNT(*) FILTER (WHERE deleted_at IS NULL) > 1
  `);
  
  if (activeMultiple.rows.length === 0) {
    console.log('✅ Result: 0 rows (constraint is working for active rows)');
  } else {
    console.log('❌ Result: ' + activeMultiple.rows.length + ' violations found!');
    console.log(activeMultiple.rows);
  }
  console.log();

  // Check for multiple archived rows for same identity
  console.log('Query 2: Multiple ARCHIVED rows for same (subtopic_id, brand_id)?');
  console.log('This indicates whether the system allows identity reuse after archival.');
  const archivedMultiple = await db.execute(sql`
    SELECT 
      subtopic_id,
      brand_id,
      COUNT(*) AS archived_count,
      ARRAY_AGG(id ORDER BY deleted_at) AS tutorial_ids,
      ARRAY_AGG(deleted_at ORDER BY deleted_at) AS deleted_timestamps
    FROM tutorial_sections
    WHERE deleted_at IS NOT NULL
    GROUP BY subtopic_id, brand_id
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  
  if (archivedMultiple.rows.length === 0) {
    console.log('✅ Result: 0 rows (no historical identity reuse has occurred)');
    console.log('   Interpretation: Archive semantics have not yet been tested in production.');
  } else {
    console.log('✅ Result: ' + archivedMultiple.rows.length + ' identities with multiple archives');
    console.log('   Interpretation: System DOES allow identity reuse after archival.');
    console.log();
    console.log('Sample data:');
    archivedMultiple.rows.slice(0, 3).forEach((row: any) => {
      console.log(`  - (${row.subtopic_id.slice(0, 8)}..., ${row.brand_id}): ${row.archived_count} archived versions`);
    });
  }
  console.log();

  // Check overall archive statistics
  console.log('Query 3: Overall statistics');
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) AS total_tutorials,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_tutorials,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS archived_tutorials,
      COUNT(DISTINCT (subtopic_id, brand_id)) AS unique_identities
    FROM tutorial_sections
  `);
  
  console.log('Statistics:');
  console.log(`  Total tutorials: ${stats.rows[0]?.total_tutorials}`);
  console.log(`  Active tutorials: ${stats.rows[0]?.active_tutorials}`);
  console.log(`  Archived tutorials: ${stats.rows[0]?.archived_tutorials}`);
  console.log(`  Unique (subtopic, brand) identities: ${stats.rows[0]?.unique_identities}`);
  console.log();

  // Check if constraint includes deleted_at
  console.log('Query 4: Inspect V2 identity constraint definition');
  const constraintInfo = await db.execute(sql`
    SELECT 
      conname AS constraint_name,
      pg_get_constraintdef(oid) AS constraint_definition
    FROM pg_constraint
    WHERE conrelid = 'tutorial_sections'::regclass
      AND conname = 'uq_tutorial_v2_identity'
  `);
  
  if (constraintInfo.rows.length > 0) {
    console.log('Constraint found:');
    console.log(`  Name: ${constraintInfo.rows[0]?.constraint_name}`);
    console.log(`  Definition: ${constraintInfo.rows[0]?.constraint_definition}`);
    
    const def = String(constraintInfo.rows[0]?.constraint_definition || '');
    if (def.includes('deleted_at')) {
      console.log('  ✅ Constraint includes deleted_at (partial index)');
    } else {
      console.log('  ❌ Constraint does NOT include deleted_at (applies to all rows)');
      console.log('     This means archived tutorials still block identity reuse.');
    }
  } else {
    console.log('❌ Constraint not found!');
  }
  console.log();

  console.log('='.repeat(60));
  console.log('END OF AUDIT');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
