/**
 * GATE 1: Database Schema Verification
 * 
 * Verifies actual PostgreSQL schema state before merging V2 branch
 * 
 * Success Criteria:
 * - tutorial_sections table exists
 * - section_type column: SHOULD NOT EXIST (V2)
 * - difficulty column: SHOULD NOT EXIST (V2)
 * - subtopic_id column: MUST EXIST
 * - brand_id column: MUST EXIST
 * - UNIQUE constraint on (subtopic_id, brand_id): MUST EXIST
 * - Old UNIQUE constraint on (subtopic_id, section_type, difficulty, brand_id): SHOULD NOT EXIST
 * - V2 indexes: SHOULD EXIST
 */

import { sql } from 'drizzle-orm';
import { db } from '../packages/db-tutorial/src/db';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  column_names: string;
}

interface IndexInfo {
  indexname: string;
  indexdef: string;
}

async function verifyDatabaseSchema() {
  console.log('\n🔍 GATE 1: DATABASE SCHEMA VERIFICATION\n');
  console.log('=' .repeat(80));

  const results: Record<string, any> = {
    passed: [],
    failed: [],
    warnings: [],
  };

  try {
    // 1. Check if tutorial_sections table exists
    console.log('\n1. Checking tutorial_sections table exists...');
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      );
    `);
    
    const tableExists = (tableCheck.rows[0] as any)?.exists;
    if (tableExists) {
      console.log('   ✅ tutorial_sections table EXISTS');
      results.passed.push('Table tutorial_sections exists');
    } else {
      console.log('   ❌ tutorial_sections table DOES NOT EXIST');
      results.failed.push('Table tutorial_sections missing');
      return results;
    }

    // 2. Get all columns
    console.log('\n2. Checking table columns...');
    const columns = await db.execute<ColumnInfo>(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'tutorial_sections'
      ORDER BY ordinal_position;
    `);

    const columnNames = columns.rows.map(c => c.column_name);
    console.log(`   Found ${columnNames.length} columns: ${columnNames.join(', ')}`);

    // 3. Check for V2 required columns
    console.log('\n3. Verifying V2 required columns...');
    
    const requiredColumns = ['subtopic_id', 'brand_id', 'content', 'status', 'version'];
    for (const col of requiredColumns) {
      if (columnNames.includes(col)) {
        console.log(`   ✅ ${col} column EXISTS`);
        results.passed.push(`Column ${col} exists`);
      } else {
        console.log(`   ❌ ${col} column MISSING`);
        results.failed.push(`Column ${col} missing`);
      }
    }

    // 4. Check for legacy columns (should NOT exist in V2)
    console.log('\n4. Checking for legacy columns (should NOT exist)...');
    
    const legacyColumns = ['section_type', 'difficulty'];
    for (const col of legacyColumns) {
      if (columnNames.includes(col)) {
        console.log(`   ⚠️  ${col} column STILL EXISTS (should be removed in V2)`);
        results.warnings.push(`Legacy column ${col} still exists`);
      } else {
        console.log(`   ✅ ${col} column REMOVED (V2 compliant)`);
        results.passed.push(`Legacy column ${col} removed`);
      }
    }

    // 5. Check unique constraints
    console.log('\n5. Checking unique constraints...');
    const constraints = await db.execute<ConstraintInfo>(sql`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as column_names
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'tutorial_sections'
        AND tc.constraint_type = 'UNIQUE'
      GROUP BY tc.constraint_name, tc.constraint_type;
    `);

    console.log(`   Found ${constraints.rows.length} unique constraint(s):`);
    for (const constraint of constraints.rows) {
      console.log(`   - ${constraint.constraint_name}: (${constraint.column_names})`);
      
      // Check for V2 identity constraint
      if (constraint.constraint_name === 'uq_tutorial_v2_identity' || 
          constraint.column_names === 'subtopic_id, brand_id') {
        console.log('     ✅ V2 IDENTITY CONSTRAINT FOUND: (subtopic_id, brand_id)');
        results.passed.push('V2 unique constraint exists');
      }
      
      // Check for old legacy constraint
      if (constraint.constraint_name === 'uq_section_subtopic_type_difficulty_brand' ||
          constraint.column_names.includes('section_type')) {
        console.log('     ⚠️  LEGACY CONSTRAINT STILL EXISTS (should be removed)');
        results.warnings.push('Legacy unique constraint still exists');
      }
    }

    // 6. Check indexes
    console.log('\n6. Checking indexes...');
    const indexes = await db.execute<IndexInfo>(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
      ORDER BY indexname;
    `);

    console.log(`   Found ${indexes.rows.length} index(es):`);
    const v2Indexes = [
      'idx_tutorial_v2_delivery',
      'idx_tutorial_v2_by_brand',
      'idx_tutorial_v2_by_status',
      'idx_tutorial_v2_subtopic_status'
    ];

    for (const index of indexes.rows) {
      console.log(`   - ${index.indexname}`);
      
      if (v2Indexes.includes(index.indexname)) {
        console.log('     ✅ V2 INDEX');
        results.passed.push(`V2 index ${index.indexname} exists`);
      } else if (index.indexname.includes('section_type') || index.indexname.includes('difficulty')) {
        console.log('     ⚠️  LEGACY INDEX (references removed columns)');
        results.warnings.push(`Legacy index ${index.indexname} still exists`);
      }
    }

    // 7. Count existing data
    console.log('\n7. Checking existing data...');
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM tutorial_sections;
    `);
    const rowCount = (countResult.rows[0] as any)?.count || 0;
    console.log(`   Total rows in tutorial_sections: ${rowCount}`);

    // 8. Check for V2 identity violations
    if (!columnNames.includes('section_type') && !columnNames.includes('difficulty')) {
      console.log('\n8. Checking for duplicate (subtopic_id, brand_id) combinations...');
      const duplicates = await db.execute(sql`
        SELECT subtopic_id, brand_id, COUNT(*) as count
        FROM tutorial_sections
        GROUP BY subtopic_id, brand_id
        HAVING COUNT(*) > 1;
      `);

      if (duplicates.rows.length === 0) {
        console.log('   ✅ No duplicate (subtopic_id, brand_id) combinations found');
        results.passed.push('No V2 identity violations');
      } else {
        console.log(`   ⚠️  Found ${duplicates.rows.length} duplicate combinations`);
        results.warnings.push(`${duplicates.rows.length} duplicate (subtopic_id, brand_id) combinations`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    results.failed.push(`Database error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Final report
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 FINAL VERDICT:');
  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   ⚠️  Warnings: ${results.warnings.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach((w: string) => console.log(`   - ${w}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILURES:');
    results.failed.forEach((f: string) => console.log(`   - ${f}`));
  }

  console.log('\n' + '='.repeat(80));

  // Determine if gate passes
  const legacyColumnsExist = results.warnings.some((w: string) => 
    w.includes('section_type') || w.includes('difficulty')
  );
  const v2ConstraintExists = results.passed.some((p: string) => 
    p.includes('V2 unique constraint')
  );

  if (results.failed.length > 0) {
    console.log('\n🚫 GATE 1: FAILED');
    console.log('   Database schema is not ready for V2 merge.');
    console.log('   Action required: Fix failures above before merging.');
    return { status: 'FAILED', results };
  } else if (legacyColumnsExist) {
    console.log('\n⚠️  GATE 1: MIGRATION REQUIRED');
    console.log('   Database still has legacy schema.');
    console.log('   Action required: Run V2 migration to remove section_type and difficulty.');
    return { status: 'MIGRATION_REQUIRED', results };
  } else if (v2ConstraintExists) {
    console.log('\n✅ GATE 1: PASSED');
    console.log('   Database schema is V2-compliant.');
    console.log('   Safe to merge feature/tutorial-v2-phase-1h-migration into main.');
    return { status: 'PASSED', results };
  } else {
    console.log('\n⚠️  GATE 1: UNCLEAR');
    console.log('   Database state cannot be determined conclusively.');
    return { status: 'UNCLEAR', results };
  }
}

// Run verification
verifyDatabaseSchema()
  .then((result) => {
    process.exit(result.status === 'PASSED' ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
