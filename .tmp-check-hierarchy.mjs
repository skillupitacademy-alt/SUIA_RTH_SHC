#!/usr/bin/env node
import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n=== TUTORIAL HIERARCHY VERIFICATION ===\n');

try {
  // Check row counts
  const domains = await pool.query('SELECT COUNT(*) as count FROM tutorial_domains');
  const subjects = await pool.query('SELECT COUNT(*) as count FROM tutorial_subjects');
  const topics = await pool.query('SELECT COUNT(*) as count FROM tutorial_topics');
  const subtopics = await pool.query('SELECT COUNT(*) as count FROM tutorial_subtopics');
  const sections = await pool.query('SELECT COUNT(*) as count FROM tutorial_sections');
  
  console.log('Row Counts:');
  console.log('  tutorial_domains:', domains.rows[0].count);
  console.log('  tutorial_subjects:', subjects.rows[0].count);
  console.log('  tutorial_topics:', topics.rows[0].count);
  console.log('  tutorial_subtopics:', subtopics.rows[0].count);
  console.log('  tutorial_sections:', sections.rows[0].count);
  console.log('');
  
  // Check actual subtopic data
  const subtopicData = await pool.query('SELECT id, external_id, slug FROM tutorial_subtopics LIMIT 5');
  console.log('Subtopics in database:');
  subtopicData.rows.forEach(row => {
    console.log(`  - ID: ${row.id}`);
    console.log(`    External ID: ${row.external_id}`);
    console.log(`    Slug: ${row.slug}`);
  });
  console.log('');
  
  // Check if sections exist
  const sectionData = await pool.query('SELECT id, navigation_node_id, subtopic_id, brand_id FROM tutorial_sections LIMIT 3');
  console.log('Tutorial Sections:', sectionData.rows.length);
  sectionData.rows.forEach(row => {
    console.log(`  - Section ID: ${row.id}`);
    console.log(`    Node: ${row.navigation_node_id}`);
    console.log(`    Subtopic: ${row.subtopic_id}`);
    console.log(`    Brand: ${row.brand_id}`);
  });
  
} catch (error) {
  console.error('ERROR:', error.message);
  console.error(error);
} finally {
  await pool.end();
}
