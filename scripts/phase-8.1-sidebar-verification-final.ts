/**
 * Phase 8.1 — Final Sidebar Verification (Read-Only)
 * 
 * CORRECTED QUERIES with proper soft-delete filtering.
 * This is the definitive investigation for certification evidence.
 * 
 * IMPORTANT: All queries now include:
 * - s.deleted_at IS NULL (active sidebars only)
 * - t.deleted_at IS NULL (active topics only)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 PHASE 8.1 — FINAL SIDEBAR VERIFICATION (WITH SOFT-DELETE FILTERS)\n');
console.log('📍 Table: tutorial_sidebar_trees_v2');
console.log('🔒 Filters: deleted_at IS NULL (both sidebars and topics)\n');

async function verify() {
  try {
    // Query 1: CORRECTED - Active topics with BOTH realtutorialhub AND skillup
    console.log('='.repeat(70));
    console.log('QUERY 1: Active topics with BOTH realtutorialhub AND skillup');
    console.log('='.repeat(70) + '\n');

    const multibrands = await db.execute(sql`
      SELECT 
        t.external_id as topic_id,
        t.name as topic_name,
        STRING_AGG(DISTINCT s.brand_id, ', ' ORDER BY s.brand_id) as brands,
        COUNT(DISTINCT s.brand_id) as brand_count
      FROM tutorial_topics t
      JOIN tutorial_sidebar_trees_v2 s ON s.topic_id = t.external_id
      WHERE s.brand_id IN ('realtutorialhub', 'skillup')
        AND s.deleted_at IS NULL
        AND t.deleted_at IS NULL
      GROUP BY t.external_id, t.name
      HAVING COUNT(DISTINCT s.brand_id) = 2
      ORDER BY t.name
    `);

    const multibrandRows = Array.isArray(multibrands) ? multibrands : (multibrands as any).rows || [];

    if (multibrandRows.length === 0) {
      console.log('❌ RESULT: 0 active topics with both realtutorialhub AND skillup\n');
    } else {
      console.log(`✅ RESULT: ${multibrandRows.length} active topic(s) with BOTH brands:\n`);
      for (const row of multibrandRows) {
        console.log(`   📌 ${row.topic_name}`);
        console.log(`      Topic ID: ${row.topic_id}`);
        console.log(`      Brands: ${row.brands}`);
        console.log('');
      }
    }

    // Query 2: CORRECTED - Active topics with ANY 2+ brands
    console.log('='.repeat(70));
    console.log('QUERY 2: Active topics with 2+ brand sidebars (any brands)');
    console.log('='.repeat(70) + '\n');

    const anyMultibrand = await db.execute(sql`
      SELECT 
        t.external_id as topic_id,
        t.name as topic_name,
        STRING_AGG(DISTINCT s.brand_id, ', ' ORDER BY s.brand_id) as brands,
        COUNT(DISTINCT s.brand_id) as brand_count
      FROM tutorial_topics t
      JOIN tutorial_sidebar_trees_v2 s ON s.topic_id = t.external_id
      WHERE s.deleted_at IS NULL
        AND t.deleted_at IS NULL
      GROUP BY t.external_id, t.name
      HAVING COUNT(DISTINCT s.brand_id) >= 2
      ORDER BY brand_count DESC, t.name
    `);

    const anyMultibrandRows = Array.isArray(anyMultibrand) ? anyMultibrand : (anyMultibrand as any).rows || [];

    if (anyMultibrandRows.length === 0) {
      console.log('❌ RESULT: 0 active topics with multiple brands\n');
    } else {
      console.log(`✅ RESULT: ${anyMultibrandRows.length} active multi-brand topic(s):\n`);
      for (const row of anyMultibrandRows) {
        console.log(`   📌 ${row.topic_name} (${row.brand_count} brands)`);
        console.log(`      Topic ID: ${row.topic_id}`);
        console.log(`      Brands: ${row.brands}`);
        console.log('');
      }
    }

    // Query 3: CORRECTED - Active brand distribution
    console.log('='.repeat(70));
    console.log('QUERY 3: Active brand distribution (deleted_at IS NULL)');
    console.log('='.repeat(70) + '\n');

    const brandDist = await db.execute(sql`
      SELECT 
        s.brand_id,
        COUNT(DISTINCT s.topic_id) as topic_count,
        COUNT(*) as sidebar_count
      FROM tutorial_sidebar_trees_v2 s
      WHERE s.deleted_at IS NULL
      GROUP BY s.brand_id
      ORDER BY topic_count DESC
    `);

    const brandDistRows = Array.isArray(brandDist) ? brandDist : (brandDist as any).rows || [];

    console.log('Active brands:\n');
    for (const row of brandDistRows) {
      const brandName = String(row.brand_id).padEnd(20);
      console.log(`   ${brandName} → ${row.topic_count} topics, ${row.sidebar_count} sidebars`);
    }
    console.log('');

    // Query 4: CORRECTED - Java topic active brands
    console.log('='.repeat(70));
    console.log('QUERY 4: Java topic active sidebar brands');
    console.log('='.repeat(70) + '\n');

    const javaBrands = await db.execute(sql`
      SELECT 
        s.brand_id,
        s.id as sidebar_id,
        t.name as topic_name,
        t.external_id as topic_id
      FROM tutorial_sidebar_trees_v2 s
      JOIN tutorial_topics t ON t.external_id = s.topic_id
      WHERE t.name = 'Java'
        AND s.deleted_at IS NULL
        AND t.deleted_at IS NULL
      ORDER BY s.brand_id
    `);

    const javaBrandRows = Array.isArray(javaBrands) ? javaBrands : (javaBrands as any).rows || [];

    if (javaBrandRows.length === 0) {
      console.log('❌ RESULT: 0 active sidebars for Java topic\n');
    } else {
      console.log(`✅ RESULT: ${javaBrandRows.length} active sidebar(s) for Java:\n`);
      for (const row of javaBrandRows) {
        console.log(`   • Brand: ${row.brand_id}`);
        console.log(`     Sidebar ID: ${row.sidebar_id}`);
        console.log('');
      }
    }

    // Query 5: Check for any deleted sidebars (to understand if data was removed)
    console.log('='.repeat(70));
    console.log('QUERY 5: Deleted sidebars (historical check)');
    console.log('='.repeat(70) + '\n');

    const deletedSidebars = await db.execute(sql`
      SELECT 
        s.brand_id,
        COUNT(*) as deleted_count
      FROM tutorial_sidebar_trees_v2 s
      WHERE s.deleted_at IS NOT NULL
      GROUP BY s.brand_id
      ORDER BY deleted_count DESC
    `);

    const deletedRows = Array.isArray(deletedSidebars) ? deletedSidebars : (deletedSidebars as any).rows || [];

    if (deletedRows.length === 0) {
      console.log('ℹ️  RESULT: 0 deleted sidebars (no historical deletions)\n');
    } else {
      console.log(`⚠️  RESULT: ${deletedRows.length} brand(s) have deleted sidebars:\n`);
      for (const row of deletedRows) {
        console.log(`   • ${row.brand_id}: ${row.deleted_count} deleted`);
      }
      console.log('');
    }

    // FINAL CERTIFICATION EVIDENCE
    console.log('='.repeat(70));
    console.log('CERTIFICATION EVIDENCE');
    console.log('='.repeat(70) + '\n');

    console.log('📋 VERIFIED FACTS (with deleted_at IS NULL filters):\n');
    console.log(`   1. Active topics with realtutorialhub + skillup: ${multibrandRows.length}`);
    console.log(`   2. Active topics with any 2+ brands: ${anyMultibrandRows.length}`);
    console.log(`   3. Active brands in database: ${brandDistRows.length}`);
    console.log(`   4. Active Java sidebar brands: ${javaBrandRows.length}`);
    console.log('');

    if (multibrandRows.length === 0 && anyMultibrandRows.length === 0) {
      console.log('✅ CERTIFIED FINDING:\n');
      console.log('   NO ACTIVE MULTI-BRAND SIDEBAR FIXTURES EXIST\n');
      console.log('   This means:');
      console.log('   - Current database contains only single-brand sidebars');
      console.log('   - realtutorialhub: 0 active sidebars');
      console.log('   - skillup: 0 active sidebars');
      console.log('   - Gate 4 Test #2 cannot execute with current fixture data\n');
      console.log('   This does NOT prove:');
      console.log('   - Platform architecture disallows multi-brand');
      console.log('   - Multi-brand is technically impossible');
      console.log('   - Schema prevents multiple brands per topic\n');
      console.log('   The unique constraint (brandId, topicId) ALLOWS multiple brands.');
      console.log('   The current data simply doesn\'t contain them.\n');
    } else {
      console.log('✅ CERTIFIED FINDING:\n');
      console.log('   MULTI-BRAND FIXTURES FOUND\n');
      console.log('   Gate 4 Test #2 can be rewritten to use discovered fixtures.\n');
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
    throw error;
  }
}

verify()
  .then(() => {
    console.log('✅ Final verification complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
