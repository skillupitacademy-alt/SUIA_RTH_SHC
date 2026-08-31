/**
 * Phase 1C-A.5 B.5.4 — Database Schema Verification
 * Directly query PostgreSQL metadata for tutorial_sections
 */

import { Client } from 'pg';

const connectionString = process.env.DATABASE_DIRECT_URL_TUTORIAL || process.env.DATABASE_URL_TUTORIAL;

if (!connectionString) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const pool = new Client({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.connect();
    
    // Check navigation_node_id exists
    const navNodeCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
        AND column_name = 'navigation_node_id'
    `);

    console.log('=== VERIFICATION: navigation_node_id ===');
    if (navNodeCheck.rows.length === 0) {
      console.log('❌ UNEXPECTED: navigation_node_id NOT FOUND');
      process.exit(1);
    }
    console.log('✅ navigation_node_id EXISTS');
    console.log(`   Type: ${navNodeCheck.rows[0].data_type}`);
    console.log(`   Nullable: ${navNodeCheck.rows[0].is_nullable}`);

    // Check idx_tutorial_v2_delivery
    const deliveryIndex = await pool.query(`
      SELECT indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
        AND indexname = 'idx_tutorial_v2_delivery'
    `);

    console.log('\n=== VERIFICATION: idx_tutorial_v2_delivery ===');
    if (deliveryIndex.rows.length === 0) {
      console.log('❌ UNEXPECTED: Index NOT FOUND');
      process.exit(1);
    }
    const deliveryDef = deliveryIndex.rows[0].indexdef;
    console.log(`✅ Index EXISTS`);
    console.log(`   ${deliveryDef}`);
    if (!deliveryDef.includes('navigation_node_id')) {
      console.log('❌ UNEXPECTED: navigation_node_id NOT in index');
      process.exit(1);
    }
    console.log('✅ navigation_node_id included in index');

    // Check uq_tutorial_v2_identity_active
    const identityIndex = await pool.query(`
      SELECT indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
        AND indexname = 'uq_tutorial_v2_identity_active'
    `);

    console.log('\n=== VERIFICATION: uq_tutorial_v2_identity_active ===');
    if (identityIndex.rows.length === 0) {
      console.log('❌ UNEXPECTED: Index NOT FOUND');
      process.exit(1);
    }
    const identityDef = identityIndex.rows[0].indexdef;
    console.log(`✅ Index EXISTS`);
    console.log(`   ${identityDef}`);
    if (!identityDef.includes('navigation_node_id')) {
      console.log('❌ UNEXPECTED: navigation_node_id NOT in index');
      process.exit(1);
    }
    console.log('✅ navigation_node_id included in index');

    // Check tutorial_navigation_progress does NOT exist
    const ilsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'tutorial_navigation_progress'
      ) as exists
    `);

    console.log('\n=== VERIFICATION: tutorial_navigation_progress ===');
    if (ilsCheck.rows[0].exists) {
      console.log('❌ UNEXPECTED: Table already exists');
      process.exit(1);
    }
    console.log('✅ Table does NOT exist (expected)');

    console.log('\n✅ ALL VERIFICATIONS PASSED');
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
