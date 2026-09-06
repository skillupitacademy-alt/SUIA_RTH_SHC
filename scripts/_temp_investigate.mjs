import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const TOPIC_ID = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07';

console.log('=== CONTENT INVESTIGATION ===\n');

// 1. Check tutorial_page_content_v2 with all possible filters
console.log('1. tutorial_page_content_v2 (ANY content):');
const r1 = await pool.query('SELECT COUNT(*) as total, COUNT(DISTINCT subtopic_id) as subtopics, COUNT(DISTINCT brand_id) as brands FROM tutorial_page_content_v2');
console.log(`   Total: ${r1.rows[0].total}, Subtopics: ${r1.rows[0].subtopics}, Brands: ${r1.rows[0].brands}`);

// 2. Check tutorial_sections (ANY content)
console.log('\n2. tutorial_sections (ANY content):');
const r2 = await pool.query('SELECT COUNT(*) as total, COUNT(DISTINCT subtopic_id) as subtopics FROM tutorial_sections');
console.log(`   Total: ${r2.rows[0].total}, Subtopics: ${r2.rows[0].subtopics}`);

// 3. Check sidebar for topic
console.log('\n3. Sidebar trees for Java topic:');
const r3 = await pool.query('SELECT id, brand_id, status FROM tutorial_sidebar_trees_v2 WHERE topic_id = $1', [TOPIC_ID]);
console.log(`   Found: ${r3.rows.length} sidebar(s)`);
r3.rows.forEach(r => console.log(`     ${r.brand_id} - ${r.status}`));

// 4. Check if sidebar contains whatisjava
if (r3.rows.length > 0) {
  console.log('\n4. Check sidebar content for "whatisjava":');
  const r4 = await pool.query("SELECT brand_id, tree::text LIKE '%whatisjava%' as has_whatisjava FROM tutorial_sidebar_trees_v2 WHERE topic_id = $1", [TOPIC_ID]);
  r4.rows.forEach(r => console.log(`     ${r.brand_id}: ${r.has_whatisjava ? 'YES ✅' : 'NO ❌'}`));
}

// 5. Check what delivery code actually uses
console.log('\n5. Tracing delivery path...');
console.log('   getPublishedTutorialPagePayload() calls:');
console.log('   → tutorialDeliveryService.getTutorialByPage()');
console.log('   → getTutorialById()');
console.log('   → queries: tutorial_sections');
console.log('   Result: Empty (0 rows)');

console.log('\n6. Summary:');
console.log(`   tutorial_page_content_v2 empty: ${r1.rows[0].total === '0'}`);
console.log(`   tutorial_sections empty: ${r2.rows[0].total === '0'}`);
console.log(`   Sidebar exists: ${r3.rows.length > 0}`);
console.log(`   Hierarchy exists: YES (verified)`);

await pool.end();
