/**
 * PHASE 11.19 STEP 11 — Verify TutorialDB Content
 * Check if tutorial content exists for the Java subtopic
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL_TUTORIAL = process.env.DATABASE_URL_TUTORIAL;

if (!DATABASE_URL_TUTORIAL) {
  console.error('❌ DATABASE_URL_TUTORIAL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL_TUTORIAL);

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('PHASE 11.19 STEP 11 — VERIFY TUTORIALDB CONTENT');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Check subtopic
  console.log('1. Subtopic check:');
  const subtopics = await sql`
    SELECT id, external_id, slug, name
    FROM tutorial_subtopics
    WHERE external_id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
  `;
  
  if (subtopics.length === 0) {
    console.log('❌ No subtopic found with external_id=12efacf1-b5ad-4b43-9fe4-17ba1cf249e4');
    process.exit(1);
  }
  
  const subtopic = subtopics[0];
  console.log(`✅ Subtopic found:`);
  console.log(`   id: ${subtopic.id}`);
  console.log(`   external_id: ${subtopic.external_id}`);
  console.log(`   slug: ${subtopic.slug}`);
  console.log(`   name: ${subtopic.name}\n`);

  // Check tutorial
  console.log('2. Tutorial check:');
  const tutorials = await sql`
    SELECT id, subtopic_id, brand_id, status, version
    FROM tutorials
    WHERE subtopic_id = ${subtopic.id}
  `;
  
  console.log(`   Found ${tutorials.length} tutorial(s)`);
  
  if (tutorials.length === 0) {
    console.log('⚠️  No tutorial found for this subtopic');
    console.log('   This explains hasTutorial=false\n');
  } else {
    for (const tutorial of tutorials) {
      console.log(`   - id: ${tutorial.id}`);
      console.log(`     brand_id: ${tutorial.brand_id || 'NULL'}`);
      console.log(`     status: ${tutorial.status}`);
      console.log(`     version: ${tutorial.version}`);
    }
    console.log('');
  }

  // Check sections
  console.log('3. Section check:');
  if (tutorials.length > 0) {
    const tutorialIds = tutorials.map(t => t.id);
    const sections = await sql`
      SELECT id, tutorial_id, section_type, content_length
      FROM tutorial_sections
      WHERE tutorial_id = ANY(${tutorialIds})
    `;
    
    console.log(`   Found ${sections.length} section(s)`);
    for (const section of sections) {
      console.log(`   - section_type: ${section.section_type}, content_length: ${section.content_length}`);
    }
  } else {
    console.log('   No sections (no tutorial exists)');
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  if (tutorials.length === 0) {
    console.log('DIAGNOSIS: Tutorial content was never synced to TutorialDB');
    console.log('The Composer Publish likely only synced hierarchy, not content');
  } else {
    console.log('Tutorial content exists in TutorialDB');
  }
  console.log('══════════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
