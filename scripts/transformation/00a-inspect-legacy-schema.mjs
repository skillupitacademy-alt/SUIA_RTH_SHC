#!/usr/bin/env node
/**
 * Inspect actual schema of legacy tables
 */

import { neon } from '@neondatabase/serverless';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;
const sql = neon(TUTORIAL_DB_URL);

async function inspectSchema() {
  console.log('🔍 Inspecting Legacy Table Schemas\n');

  // Inspect tutorial_topics
  console.log('📊 tutorial_topics columns:');
  const topicColumns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'tutorial_topics'
    ORDER BY ordinal_position;
  `;
  topicColumns.forEach(c => {
    console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });

  // Inspect tutorial_subtopics
  console.log('\n📊 tutorial_subtopics columns:');
  const subtopicColumns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'tutorial_subtopics'
    ORDER BY ordinal_position;
  `;
  subtopicColumns.forEach(c => {
    console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });

  // Inspect tutorial_content
  console.log('\n📊 tutorial_content columns:');
  const contentColumns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'tutorial_content'
    ORDER BY ordinal_position;
  `;
  contentColumns.forEach(c => {
    console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });

  // Sample data
  console.log('\n📊 Sample data from tutorial_topics:');
  const sampleTopics = await sql`SELECT * FROM tutorial_topics LIMIT 2`;
  console.log(JSON.stringify(sampleTopics, null, 2));

  console.log('\n📊 Sample data from tutorial_subtopics:');
  const sampleSubtopics = await sql`SELECT * FROM tutorial_subtopics LIMIT 2`;
  console.log(JSON.stringify(sampleSubtopics, null, 2));

  console.log('\n📊 Sample data from tutorial_content:');
  const sampleContent = await sql`SELECT * FROM tutorial_content LIMIT 1`;
  console.log(JSON.stringify(sampleContent, null, 2));
}

inspectSchema().catch(console.error);
