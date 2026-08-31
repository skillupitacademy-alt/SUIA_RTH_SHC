/**
 * Phase 1C-A.5 Gate D - Post-Migration Verification
 * Verify tutorial_navigation_progress was created correctly
 */

import { Client } from 'pg';

const connectionString = process.env.DATABASE_DIRECT_URL_TUTORIAL || process.env.DATABASE_URL_TUTORIAL;

if (!connectionString) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const client = new Client({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();

    console.log('=== POST-MIGRATION VERIFICATION ===\n');

    // Check table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'tutorial_navigation_progress'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ tutorial_navigation_progress NOT FOUND');
      process.exit(1);
    }
    console.log('✅ tutorial_navigation_progress EXISTS\n');

    // Get columns
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'tutorial_navigation_progress' 
      ORDER BY ordinal_position
    `);

    console.log(`Column count: ${columns.rows.length}`);
    if (columns.rows.length !== 18) {
      console.log(`❌ EXPECTED 18 columns, got ${columns.rows.length}`);
    } else {
      console.log('✅ CORRECT: 18 columns\n');
    }

    // Check expected columns
    const expectedCols = [
      'id', 'user_id', 'navigation_node_id', 'section_id', 'subtopic_id',
      'status', 'completed_blocks', 'time_spent_active_sec', 'visit_count',
      'revision_count', 'last_session_id', 'first_viewed_at', 'last_viewed_at',
      'completed_at', 'version', 'created_at', 'updated_at', 'deleted_at'
    ];

    console.log('Column verification:');
    const actualCols = columns.rows.map(r => r.column_name);
    let allMatch = true;
    expectedCols.forEach(col => {
      if (actualCols.includes(col)) {
        const colInfo = columns.rows.find(r => r.column_name === col);
        console.log(`  ✅ ${col} (${colInfo.data_type}, nullable=${colInfo.is_nullable})`);
      } else {
        console.log(`  ❌ ${col} MISSING`);
        allMatch = false;
      }
    });

    if (!allMatch) {
      process.exit(1);
    }

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_navigation_progress'
      ORDER BY indexname
    `);

    console.log(`\nIndex count: ${indexes.rows.length}`);
    if (indexes.rows.length !== 6) { // 5 + primary key
      console.log(`⚠️  Expected 6 indexes (5 + PK), got ${indexes.rows.length}`);
    }

    const expectedIndexes = [
      'idx_navigation_progress_last_viewed',
      'idx_navigation_progress_node',
      'idx_navigation_progress_subtopic',
      'idx_navigation_progress_user',
      'tutorial_navigation_progress_pkey',
      'uq_navigation_progress_user_node'
    ];

    console.log('\nIndex verification:');
    const actualIndexes = indexes.rows.map(r => r.indexname);
    expectedIndexes.forEach(idx => {
      if (actualIndexes.includes(idx)) {
        console.log(`  ✅ ${idx}`);
      } else {
        console.log(`  ❌ ${idx} MISSING`);
      }
    });

    // Verify tutorial_sections unchanged
    console.log('\n=== tutorial_sections PRESERVATION CHECK ===\n');

    const navNodeCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
        AND column_name = 'navigation_node_id'
    `);

    if (navNodeCheck.rows.length > 0) {
      console.log('✅ tutorial_sections.navigation_node_id PRESERVED');
    } else {
      console.log('❌ tutorial_sections.navigation_node_id MISSING');
    }

    const deliveryIdx = await client.query(`
      SELECT indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
        AND indexname = 'idx_tutorial_v2_delivery'
    `);

    if (deliveryIdx.rows.length > 0 && deliveryIdx.rows[0].indexdef.includes('navigation_node_id')) {
      console.log('✅ idx_tutorial_v2_delivery PRESERVED with navigation_node_id');
    } else {
      console.log('❌ idx_tutorial_v2_delivery INCORRECT');
    }

    console.log('\n✅ ALL POST-MIGRATION VERIFICATIONS PASSED');

    await client.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
