#!/usr/bin/env node
/**
 * STEP 2 - Get Tutorial Slugs for whatisjava
 * 
 * Purpose: Get the actual domain/subject/topic/subtopic slugs
 * for the deployed whatisjava tutorial from the database.
 * 
 * NO MODIFICATIONS. EVIDENCE GATHERING ONLY.
 */
import 'dotenv/config';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });

const { Client } = pkg;

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('STEP 2: GET ACTUAL TUTORIAL SLUGS FROM DATABASE');
  console.log('═══════════════════════════════════════════════════════\n');

  const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  await client.connect();

  try {
    const result = await client.query(`
      SELECT 
        d.id as domain_id,
        d.name as domain_name,
        d.slug as domain_slug,
        s.id as subject_id,
        s.name as subject_name,
        s.slug as subject_slug,
        t.id as topic_id,
        t.name as topic_name,
        t.slug as topic_slug,
        st.id as subtopic_id,
        st.name as subtopic_name,
        st.slug as subtopic_slug,
        ts.navigation_node_id,
        ts.id as section_id,
        ts.status,
        ts.brand_id
      FROM tutorial_sections ts
      JOIN tutorial_subtopics st ON st.id = ts.subtopic_id
      JOIN tutorial_topics t ON t.id = st.topic_id
      JOIN tutorial_subjects s ON s.id = t.subject_id
      JOIN tutorial_domains d ON d.id = s.domain_id
      WHERE ts.navigation_node_id = 'whatisjava'
        AND ts.status = 'deployed'
        AND ts.deleted_at IS NULL
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ No deployed tutorial found with navigationNodeId = whatisjava\n');
      process.exit(1);
    }

    const tutorial = result.rows[0];

    console.log('✓ Found deployed tutorial:\n');
    console.log('HIERARCHY:');
    console.log(`  Domain:   ${tutorial.domain_name}`);
    console.log(`            slug: ${tutorial.domain_slug}`);
    console.log(`            id:   ${tutorial.domain_id}`);
    console.log();
    console.log(`  Subject:  ${tutorial.subject_name}`);
    console.log(`            slug: ${tutorial.subject_slug}`);
    console.log(`            id:   ${tutorial.subject_id}`);
    console.log();
    console.log(`  Topic:    ${tutorial.topic_name}`);
    console.log(`            slug: ${tutorial.topic_slug}`);
    console.log(`            id:   ${tutorial.topic_id}`);
    console.log();
    console.log(`  Subtopic: ${tutorial.subtopic_name}`);
    console.log(`            slug: ${tutorial.subtopic_slug}`);
    console.log(`            id:   ${tutorial.subtopic_id}`);
    console.log();
    console.log('TUTORIAL SECTION:');
    console.log(`  Navigation Node ID: ${tutorial.navigation_node_id}`);
    console.log(`  Section ID:         ${tutorial.section_id}`);
    console.log(`  Status:             ${tutorial.status}`);
    console.log(`  Brand:              ${tutorial.brand_id}`);
    console.log();

    console.log('═══════════════════════════════════════════════════════');
    console.log('ROUTE CONSTRUCTION:');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Route Pattern:');
    console.log('  /learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]\n');

    console.log('Actual URL:');
    const url = `/learn/${tutorial.domain_slug}/${tutorial.subject_slug}/${tutorial.topic_slug}/${tutorial.subtopic_slug}`;
    console.log(`  ${url}\n`);

    console.log('Full URL (realtutorialhub-web on port 3003):');
    console.log(`  http://localhost:3003${url}`);
    console.log(`  http://realtutorialhub.localhost:3003${url}\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 2 COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('NEXT: Step 3 - Determine which hostname is actually configured\n');

  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
});
