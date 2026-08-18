#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL_TUTORIAL);

console.log('\n🔍 JAVA SIDEBAR STATUS CHECK\n');
console.log('Topic: Java (Backend Development)');
console.log('Expected: Published sidebar for learner delivery\n');

const rows = await sql`
  SELECT 
    id,
    brand_id,
    status,
    version,
    published_at,
    created_at,
    updated_at,
    (tree->'topics') IS NOT NULL as has_topics,
    (tree->'brand') IS NOT NULL as has_brand,
    (tree->'theme') IS NOT NULL as has_theme
  FROM tutorial_sidebar_trees_v2
  WHERE brand_id = 'shared'
    AND topic_id = '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
  ORDER BY version DESC
`;

if (rows.length === 0) {
  console.log('❌ NO SIDEBAR FOUND\n');
  console.log('The Java sidebar does not exist in tutorial_sidebar_trees_v2.\n');
} else {
  console.log('📊 SIDEBAR RECORD:\n');
  console.table(rows);
  
  const row = rows[0];
  
  console.log('\n🔍 ANALYSIS:\n');
  
  if (row.status === 'draft') {
    console.log('❌ STATUS: DRAFT\n');
    console.log('CRITICAL: The sidebar is not published!');
    console.log('');
    console.log('Learner delivery queries require:');
    console.log('  WHERE status = \'published\'');
    console.log('');
    console.log('Current query will return:');
    console.log('  0 rows (published sidebar not found)');
    console.log('');
    console.log('Expected behavior:');
    console.log('  - 404 or empty content page');
    console.log('  - NOT 503 server exception');
    console.log('');
    console.log('If SkillUp shows 503, the application is not handling');
    console.log('missing published sidebar gracefully.');
  } else if (row.status === 'published') {
    console.log('✅ STATUS: PUBLISHED\n');
    console.log('Sidebar is eligible for learner delivery.');
    console.log(`Published at: ${row.published_at}`);
  }
  
  console.log('');
  console.log('Tree structure:');
  console.log(`  has_topics: ${row.has_topics}`);
  console.log(`  has_brand: ${row.has_brand}`);
  console.log(`  has_theme: ${row.has_theme}`);
  
  if (!row.has_topics) {
    console.log('  ❌ Tree missing topics array!');
  }
  
  if (row.has_brand || row.has_theme) {
    console.log('  ⚠️  Tree contains presentation data (should be runtime-only)');
  }
}

console.log('\n');
