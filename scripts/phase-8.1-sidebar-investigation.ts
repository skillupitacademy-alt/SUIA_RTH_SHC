/**
 * Phase 8.1 — Sidebar Multi-Brand Investigation (Read-Only)
 * 
 * Queries tutorial_sidebar_trees_v2 to determine:
 * 1. Which topics have sidebars for both realtutorialhub AND skillup
 * 2. Brand distribution across topics
 * 3. Java topic brand coverage
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../packages/db-tutorial/src/db';
import { tutorialSidebarTreesV2 } from '../packages/db-tutorial/src/schema/tutorial-sidebar-v2';
import { tutorialTopics } from '../packages/db-tutorial/src/schema/tutorial-topics';
import { tutorialSubtopics } from '../packages/db-tutorial/src/schema/tutorial-subtopics';
import { sql, eq, and, inArray } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 PHASE 8.1 — SIDEBAR MULTI-BRAND INVESTIGATION\n');
console.log('📍 Database: tutorial_sidebar_trees_v2\n');

async function investigate() {
  try {
    // Query 1: Topics with BOTH realtutorialhub AND skillup sidebars
    console.log('=' .repeat(70));
    console.log('QUERY 1: Topics with BOTH realtutorialhub AND skillup');
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
        AND t.deleted_at IS NULL
      GROUP BY t.external_id, t.name
      HAVING COUNT(DISTINCT s.brand_id) = 2
      ORDER BY t.name
      LIMIT 10
    `);

    const multibrandRows = Array.isArray(multibrands) ? multibrands : (multibrands as any).rows || [];

    if (multibrandRows.length === 0) {
      console.log('❌ NO TOPICS FOUND with both realtutorialhub AND skillup sidebars\n');
    } else {
      console.log(`✅ Found ${multibrandRows.length} topic(s) with BOTH brands:\n`);
      for (const row of multibrandRows) {
        console.log(`📌 ${row.topic_name}`);
        console.log(`   Topic ID: ${row.topic_id}`);
        console.log(`   Brands: ${row.brands}`);
        console.log('');
      }
    }

    // Query 2: ALL multi-brand topics (any 2+ brands)
    console.log('='.repeat(70));
    console.log('QUERY 2: Topics with 2+ brand sidebars (any brands)');
    console.log('='.repeat(70) + '\n');

    const anyMultibrand = await db.execute(sql`
      SELECT 
        t.external_id as topic_id,
        t.name as topic_name,
        STRING_AGG(DISTINCT s.brand_id, ', ' ORDER BY s.brand_id) as brands,
        COUNT(DISTINCT s.brand_id) as brand_count
      FROM tutorial_topics t
      JOIN tutorial_sidebar_trees_v2 s ON s.topic_id = t.external_id
      WHERE t.deleted_at IS NULL
      GROUP BY t.external_id, t.name
      HAVING COUNT(DISTINCT s.brand_id) >= 2
      ORDER BY brand_count DESC, t.name
      LIMIT 10
    `);

    const anyMultibrandRows = Array.isArray(anyMultibrand) ? anyMultibrand : (anyMultibrand as any).rows || [];

    if (anyMultibrandRows.length === 0) {
      console.log('❌ NO TOPICS FOUND with multiple brand sidebars\n');
      console.log('ℹ️  Platform uses single-brand or shared-brand strategy\n');
    } else {
      console.log(`✅ Found ${anyMultibrandRows.length} multi-brand topic(s):\n`);
      for (const row of anyMultibrandRows) {
        console.log(`📌 ${row.topic_name} (${row.brand_count} brands)`);
        console.log(`   Topic ID: ${row.topic_id}`);
        console.log(`   Brands: ${row.brands}`);
        console.log('');
      }
    }

    // Query 3: Brand distribution across ALL topics
    console.log('='.repeat(70));
    console.log('QUERY 3: Brand distribution summary');
    console.log('='.repeat(70) + '\n');

    const brandDist = await db.execute(sql`
      SELECT 
        s.brand_id,
        COUNT(DISTINCT s.topic_id) as topic_count,
        COUNT(*) as sidebar_count
      FROM tutorial_sidebar_trees_v2 s
      GROUP BY s.brand_id
      ORDER BY topic_count DESC
    `);

    const brandDistRows = Array.isArray(brandDist) ? brandDist : (brandDist as any).rows || [];

    console.log('Brand coverage:\n');
    for (const row of brandDistRows) {
      const brandName = String(row.brand_id).padEnd(20);
      console.log(`   ${brandName} → ${row.topic_count} topics, ${row.sidebar_count} sidebars`);
    }
    console.log('');

    // Query 4: Java topic brands (specific check)
    console.log('='.repeat(70));
    console.log('QUERY 4: Java topic brand coverage');
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
        AND t.deleted_at IS NULL
      ORDER BY s.brand_id
    `);

    const javaBrandRows = Array.isArray(javaBrands) ? javaBrands : (javaBrands as any).rows || [];

    if (javaBrandRows.length === 0) {
      console.log('❌ NO SIDEBARS FOUND for Java topic\n');
    } else {
      console.log(`✅ Java topic has ${javaBrandRows.length} sidebar(s):\n`);
      for (const row of javaBrandRows) {
        console.log(`   • Brand: ${row.brand_id}`);
        console.log(`     Sidebar ID: ${row.sidebar_id}`);
        console.log('');
      }
    }

    // Query 5: Sample subtopics from multi-brand topics (for Gate 4 fixture candidates)
    if (multibrandRows.length > 0) {
      console.log('='.repeat(70));
      console.log('QUERY 5: Sample subtopics from multi-brand topics');
      console.log('='.repeat(70) + '\n');

      const topicIds = multibrandRows.map((r: any) => r.topic_id);
      
      const subtopics = await db
        .select({
          topicName: tutorialTopics.name,
          subtopicId: tutorialSubtopics.externalId,
          subtopicName: tutorialSubtopics.name,
          subtopicSlug: tutorialSubtopics.slug,
        })
        .from(tutorialSubtopics)
        .innerJoin(tutorialTopics, eq(tutorialTopics.id, tutorialSubtopics.topicId))
        .where(
          inArray(tutorialTopics.externalId, topicIds)
        )
        .limit(5);

      if (subtopics.length > 0) {
        console.log('Sample subtopics suitable for Gate 4:\n');
        for (const sub of subtopics) {
          console.log(`   📄 ${sub.topicName} → ${sub.subtopicName}`);
          console.log(`      Subtopic ID: ${sub.subtopicId}`);
          console.log(`      Slug: ${sub.subtopicSlug}`);
          console.log('');
        }
      }
    }

    // Final assessment
    console.log('='.repeat(70));
    console.log('ASSESSMENT');
    console.log('='.repeat(70) + '\n');

    if (multibrandRows.length > 0) {
      console.log('✅ RESULT: VALID MULTI-BRAND FIXTURE FOUND\n');
      console.log('   Gate 4 Test #2 can be rewritten to use one of the topics above.');
      console.log('   Both realtutorialhub and skillup have sidebars for these topics.\n');
    } else if (anyMultibrandRows.length > 0) {
      console.log('⚠️  RESULT: MULTI-BRAND EXISTS (different brands)\n');
      console.log('   Multi-brand topics exist but NOT for realtutorialhub + skillup combo.');
      console.log('   Gate 4 must either:');
      console.log('   A. Use the brands found in Query 2');
      console.log('   B. Skip Test #2 (multi-brand test)\n');
    } else {
      console.log('❌ RESULT: NO MULTI-BRAND FIXTURES FOUND\n');
      console.log('   Platform uses single-brand or shared-brand strategy.');
      console.log('   Gate 4 Test #2 (multi-brand isolation) should be skipped.');
      console.log('   Tests #1, #3, #4 can use Java + shared brand.\n');
    }

  } catch (error) {
    console.error('❌ Investigation error:', error);
    throw error;
  }
}

investigate()
  .then(() => {
    console.log('✅ Investigation complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
