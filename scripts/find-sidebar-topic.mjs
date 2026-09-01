#!/usr/bin/env node
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
  
  const sidebarTopicId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
  
  // Get topic details
  const topic = await client.query(`
    SELECT tp.id, tp.name, tp.slug, s.name as subject_name, d.name as domain_name
    FROM tutorial_topics tp
    JOIN tutorial_subjects s ON s.id = tp.subject_id
    JOIN tutorial_domains d ON d.id = s.domain_id
    WHERE tp.id = $1
  `, [sidebarTopicId]);
  
  if (topic.rows.length > 0) {
    const t = topic.rows[0];
    console.log('Published sidebar belongs to:');
    console.log(`  Domain: ${t.domain_name}`);
    console.log(`  Subject: ${t.subject_name}`);
    console.log(`  Topic: ${t.name}`);
    console.log(`  Topic slug: ${t.slug}`);
    console.log(`  Topic ID: ${t.id}\n`);
    
    // Check if there are any published sections for this topic
    const sections = await client.query(`
      SELECT ts.id, ts.navigation_node_id, ts.status, tst.name as subtopic_name, tst.slug as subtopic_slug
      FROM tutorial_sections ts
      JOIN tutorial_subtopics tst ON tst.id = ts.subtopic_id
      WHERE tst.topic_id = $1
      AND ts.status = 'deployed'
      AND ts.deleted_at IS NULL
      LIMIT 5
    `, [sidebarTopicId]);
    
    console.log(`Found ${sections.rows.length} deployed sections for this topic:`);
    sections.rows.forEach(s => {
      console.log(`  - Subtopic: ${s.subtopic_name} (${s.subtopic_slug})`);
      console.log(`    Navigation: ${s.navigation_node_id}`);
    });
  } else {
    console.log('Topic not found!');
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
