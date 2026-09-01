#!/usr/bin/env node
/**
 * Diagnose subtopic ID mismatch
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

  // Check tutorial_subtopics
  const tutorialSubtopic = await client.query(`
    SELECT id, external_id, name, slug
    FROM tutorial_subtopics
    WHERE slug = 'what-is-java-12efacf1'
    AND deleted_at IS NULL
  `);

  console.log('tutorial_subtopics record:');
  console.log(tutorialSubtopic.rows[0]);
  console.log();

  if (tutorialSubtopic.rows[0]) {
    const externalId = tutorialSubtopic.rows[0].external_id;
    console.log(`Looking for curriculum subtopic with id='${externalId}'...\n`);

    // Check curriculum subtopics
    const curriculumSubtopic = await client.query(`
      SELECT id, name, topic_id
      FROM subtopics
      WHERE id = $1
      AND deleted_at IS NULL
    `, [externalId]);

    console.log('curriculum subtopics record:');
    if (curriculumSubtopic.rows[0]) {
      console.log(curriculumSubtopic.rows[0]);
    } else {
      console.log('❌ NOT FOUND');
      
      // Check if the record exists but is deleted
      const deletedCheck = await client.query(`
        SELECT id, name, topic_id, deleted_at
        FROM subtopics
        WHERE id = $1
      `, [externalId]);
      
      if (deletedCheck.rows[0]) {
        console.log('\n⚠️  Record exists but is DELETED:');
        console.log(deletedCheck.rows[0]);
      }
    }
  }

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
