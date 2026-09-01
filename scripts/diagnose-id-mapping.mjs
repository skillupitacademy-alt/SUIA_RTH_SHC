#!/usr/bin/env node
/**
 * Diagnose internal vs external ID mapping
 */

import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;

config({ path: '.env.local', override: true });

let connString = process.env.DATABASE_URL_TUTORIAL;
if (connString && connString.startsWith('"') && connString.endsWith('"')) {
  connString = connString.slice(1, -1);
}

const client = new Client({ connectionString: connString });

try {
  await client.connect();
  console.log('Connected to Tutorial database\n');

  const topicId = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07'; // Java topic

  // Get all curriculum subtopics for Java topic
  console.log('=== CURRICULUM SUBTOPICS (subtopics table) ===');
  const curriculumSubtopics = await client.query(`
    SELECT id, name, topic_id
    FROM subtopics
    WHERE topic_id = $1
    AND deleted_at IS NULL
    ORDER BY name
  `, [topicId]);

  console.log(`Found ${curriculumSubtopics.rows.length} curriculum subtopics:\n`);
  curriculumSubtopics.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.name}`);
    console.log(`   curriculum id: ${row.id}`);
  });

  console.log('\n=== TUTORIAL SUBTOPICS (tutorial_subtopics table) ===');
  const tutorialSubtopics = await client.query(`
    SELECT id, external_id, name, slug
    FROM tutorial_subtopics
    WHERE slug = 'what-is-java-12efacf1'
    AND deleted_at IS NULL
  `);

  console.log(`Found ${tutorialSubtopics.rows.length} tutorial subtopics:\n`);
  tutorialSubtopics.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.name}`);
    console.log(`   internal id (tutorial_subtopics.id): ${row.id}`);
    console.log(`   external id (tutorial_subtopics.external_id): ${row.external_id}`);
    console.log(`   slug: ${row.slug}`);
  });

  console.log('\n=== CHECKING MAPPING ===');
  if (tutorialSubtopics.rows[0]) {
    const tutRow = tutorialSubtopics.rows[0];
    
    // Check if external_id matches any curriculum subtopic
    const matchByExternal = curriculumSubtopics.rows.find(c => c.id === tutRow.external_id);
    console.log(`\nDoes external_id match a curriculum subtopic? ${matchByExternal ? '✓ YES' : '✗ NO'}`);
    
    if (matchByExternal) {
      console.log(`  Matched: ${matchByExternal.name} (${matchByExternal.id})`);
    } else {
      console.log(`  Looking for curriculum id: ${tutRow.external_id}`);
      console.log(`  Available curriculum ids:`);
      curriculumSubtopics.rows.forEach(c => {
        console.log(`    - ${c.id} (${c.name})`);
      });
    }

    // Check if internal id matches
    const matchByInternal = curriculumSubtopics.rows.find(c => c.id === tutRow.id);
    console.log(`\nDoes internal_id match a curriculum subtopic? ${matchByInternal ? '✓ YES' : '✗ NO'}`);
    
    if (matchByInternal) {
      console.log(`  Matched: ${matchByInternal.name} (${matchByInternal.id})`);
    }
  }

  // Check what the code is actually looking for
  console.log('\n=== WHAT THE CODE DOES ===');
  console.log('1. Finds tutorial_subtopics record by slug');
  console.log('2. Gets external_id from that record');
  console.log('3. Searches subtopics table for: id = external_id');
  console.log('4. Uses that to build subtopicRows array');
  console.log('5. Calls: subtopicRows.find((row) => row.id === external_id)');
  console.log('');
  console.log('The issue: external_id doesn\'t match any subtopics.id!');

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
} finally {
  await client.end();
}
