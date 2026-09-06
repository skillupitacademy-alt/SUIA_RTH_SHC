#!/usr/bin/env node
import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  
  try {
    await client.connect();
    console.log('Connected to tutorial database\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Step 1: Find subtopic by slug
    console.log('STEP 1: Find subtopic "what-is-java" by slug\n');
    const subtopicResult = await client.query(`
      SELECT id, slug, name, topic_id
      FROM tutorial_subtopics
      WHERE slug LIKE '%what-is-java%'
      ORDER BY slug
    `);
    
    console.log(`Found ${subtopicResult.rows.length} subtopic(s):\n`);
    subtopicResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}`);
      console.log(`  Slug: ${row.slug}`);
      console.log(`  Name: ${row.name}`);
      console.log(`  Topic ID: ${row.topic_id}`);
      console.log();
    });
    
    if (subtopicResult.rows.length === 0) {
      console.log('❌ No subtopic found with "what-is-java" in slug\n');
      return;
    }
    
    const subtopic = subtopicResult.rows[0];
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Step 2: Find tutorial sections for this subtopic
    console.log('STEP 2: Find tutorial sections for this subtopic\n');
    const sectionsResult = await client.query(`
      SELECT 
        id as section_id,
        navigation_node_id,
        subtopic_id,
        brand_id,
        status
      FROM tutorial_sections
      WHERE subtopic_id = $1
        AND deleted_at IS NULL
      ORDER BY brand_id
    `, [subtopic.id]);
    
    console.log(`Found ${sectionsResult.rows.length} section(s):\n`);
    sectionsResult.rows.forEach(row => {
      console.log(`  Section ID: ${row.section_id}`);
      console.log(`  Navigation Node ID: ${row.navigation_node_id || 'NULL'}`);
      console.log(`  Subtopic ID: ${row.subtopic_id}`);
      console.log(`  Brand: ${row.brand_id}`);
      console.log(`  Status: ${row.status}`);
      console.log();
    });
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Step 3: Summary for Gate 4K
    console.log('GATE 4K TEST DATA:\n');
    console.log('Use these values for block API test:\n');
    console.log(`  subtopicId: "${subtopic.id}"  ← UUID (REQUIRED)`);
    console.log(`  subtopicSlug: "${subtopic.slug}"`);
    console.log(`  navigationNodeId: ??? (see sections above)`);
    console.log();
    
    if (sectionsResult.rows.length > 0) {
      const sectionWithNode = sectionsResult.rows.find(r => r.navigation_node_id);
      if (sectionWithNode) {
        console.log('✅ Found section with navigation_node_id:\n');
        console.log(`  navigationNodeId: "${sectionWithNode.navigation_node_id}"`);
        console.log(`  brand: "${sectionWithNode.brand_id}"`);
        console.log();
      } else {
        console.log('⚠️  No sections have navigation_node_id set\n');
        console.log('This may be why hierarchy validation fails.\n');
      }
    } else {
      console.log('⚠️  No tutorial sections found for this subtopic\n');
    }
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
