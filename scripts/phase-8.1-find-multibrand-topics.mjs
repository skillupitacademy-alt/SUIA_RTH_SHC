#!/usr/bin/env node
/**
 * Phase 8.1 — Multi-Brand Topic Investigation
 * 
 * Searches for topics that have sidebars for BOTH realtutorialhub AND skillup brands.
 * This determines whether gate-4-concurrency test can be fixed with real fixtures.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../packages/db-tutorial/src/db.js';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 PHASE 8.1 — MULTI-BRAND TOPIC INVESTIGATION\n');

try {
  // Query 1: Topics with BOTH realtutorialhub AND skillup
  console.log('📊 Query 1: Topics with BOTH realtutorialhub AND skillup sidebars\n');
  
  const multibrands = await db.execute`
    SELECT 
      ts.external_id as topic_id,
      ts.name as topic_name,
      STRING_AGG(DISTINCT s.brand_id, ', ') as brands,
      COUNT(DISTINCT s.brand_id) as brand_count,
      STRING_AGG(DISTINCT tst.external_id, ', ') as sample_subtopics
    FROM tutorial_topics ts
    JOIN sidebars s ON s.topic_external_id = ts.external_id
    LEFT JOIN tutorial_subtopics tst ON tst.topic_id = ts.id AND tst.deleted_at IS NULL
    WHERE s.deleted_at IS NULL
      AND ts.deleted_at IS NULL
      AND s.brand_id IN ('realtutorialhub', 'skillup')
    GROUP BY ts.external_id, ts.name
    HAVING COUNT(DISTINCT s.brand_id) = 2
    LIMIT 10
  `;

  if (multibrands.length === 0) {
    console.log('   ❌ NO TOPICS FOUND with both realtutorialhub and skillup sidebars\n');
  } else {
    console.log(`   ✅ Found ${multibrands.length} topic(s):\n`);
    multibrands.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.topic_name}`);
      console.log(`      Topic ID: ${row.topic_id}`);
      console.log(`      Brands: ${row.brands}`);
      console.log(`      Sample Subtopics: ${row.sample_subtopics || 'none'}`);
      console.log('');
    });
  }

  // Query 2: Topics with ANY multi-brand sidebars
  console.log('📊 Query 2: Topics with 2+ brand sidebars (any brands)\n');
  
  const anyMultibrand = await db.execute`
    SELECT 
      ts.external_id as topic_id,
      ts.name as topic_name,
      STRING_AGG(DISTINCT s.brand_id, ', ') as brands,
      COUNT(DISTINCT s.brand_id) as brand_count
    FROM tutorial_topics ts
    JOIN sidebars s ON s.topic_external_id = ts.external_id
    WHERE s.deleted_at IS NULL
      AND ts.deleted_at IS NULL
    GROUP BY ts.external_id, ts.name
    HAVING COUNT(DISTINCT s.brand_id) >= 2
    ORDER BY brand_count DESC, ts.name
    LIMIT 10
  `;

  if (anyMultibrand.length === 0) {
    console.log('   ❌ NO TOPICS FOUND with multiple brand sidebars\n');
    console.log('   ℹ️  This suggests the platform uses single-brand or shared-brand strategy\n');
  } else {
    console.log(`   ✅ Found ${anyMultibrand.length} topic(s) with multi-brand sidebars:\n`);
    anyMultibrand.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.topic_name} (${row.brand_count} brands)`);
      console.log(`      Topic ID: ${row.topic_id}`);
      console.log(`      Brands: ${row.brands}`);
      console.log('');
    });
  }

  // Query 3: Brand distribution across topics
  console.log('📊 Query 3: Brand distribution summary\n');
  
  const brandDist = await db.execute`
    SELECT 
      s.brand_id,
      COUNT(DISTINCT s.topic_external_id) as topic_count,
      COUNT(DISTINCT s.id) as sidebar_count
    FROM sidebars s
    WHERE s.deleted_at IS NULL
    GROUP BY s.brand_id
    ORDER BY topic_count DESC
  `;

  console.log('   Brand usage across topics:\n');
  brandDist.forEach(row => {
    console.log(`   • ${row.brand_id.padEnd(20)} — ${row.topic_count} topics, ${row.sidebar_count} sidebars`);
  });
  console.log('');

  // Query 4: Check specific brands for Java topic
  console.log('📊 Query 4: Java topic sidebar brands\n');
  
  const javaBrands = await db.execute`
    SELECT 
      s.brand_id,
      s.id as sidebar_id,
      ts.name as topic_name,
      ts.external_id as topic_id
    FROM sidebars s
    JOIN tutorial_topics ts ON ts.external_id = s.topic_external_id
    WHERE ts.name = 'Java'
      AND s.deleted_at IS NULL
      AND ts.deleted_at IS NULL
  `;

  if (javaBrands.length === 0) {
    console.log('   ❌ NO SIDEBARS FOUND for Java topic\n');
  } else {
    console.log(`   ✅ Java topic has ${javaBrands.length} sidebar(s):\n`);
    javaBrands.forEach(row => {
      console.log(`   • Brand: ${row.brand_id}`);
      console.log(`     Topic ID: ${row.topic_id}`);
      console.log(`     Sidebar ID: ${row.sidebar_id}`);
      console.log('');
    });
  }

  console.log('✅ INVESTIGATION COMPLETE\n');

  // Recommendation
  console.log('📋 RECOMMENDATION:\n');
  if (multibrands.length > 0) {
    console.log('   ✅ OPTION A: Use real multi-brand topic');
    console.log('      Rewrite gate-4 test to use one of the topics found in Query 1');
    console.log('');
  } else if (anyMultibrand.length > 0) {
    console.log('   ⚠️  OPTION B: Use different brand combination');
    console.log('      Multi-brand topics exist but not for realtutorialhub+skillup');
    console.log('      Rewrite gate-4 test to use brands found in Query 2');
    console.log('');
  } else {
    console.log('   ❌ OPTION C: Skip multi-brand test');
    console.log('      No multi-brand topics found — platform uses single-brand strategy');
    console.log('      Test #2 in gate-4 should be skipped with architectural note');
    console.log('      Tests #1, #3, #4 can use Java + shared brand');
    console.log('');
  }

} catch (error) {
  console.error('❌ Error during investigation:', error);
  process.exit(1);
}

process.exit(0);
