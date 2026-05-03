#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_TUTORIAL);

const content = await sql`
  SELECT 
    c.id,
    c.subtopic_id,
    s.id as subtopic_db_id,
    s.name as subtopic_name,
    t.name as topic_name,
    c.difficulty,
    c.generated_by_ai
  FROM tutorial_content c
  JOIN tutorial_subtopics s ON c.subtopic_id = s.id
  JOIN tutorial_topics t ON s.topic_id = t.id
  WHERE c.deleted_at IS NULL
  ORDER BY c.created_at;
`;

console.log('Content Items and their Subtopics:\n');
content.forEach((item, i) => {
  console.log(`${i + 1}. Content ID: ${item.id}`);
  console.log(`   Subtopic ID: ${item.subtopic_id}`);
  console.log(`   Subtopic DB ID: ${item.subtopic_db_id}`);
  console.log(`   Topic: ${item.topic_name}`);
  console.log(`   Subtopic: ${item.subtopic_name}`);
  console.log(`   Difficulty: ${item.difficulty}`);
  console.log(`   AI Generated: ${item.generated_by_ai}\n`);
});

const sections = await sql`
  SELECT 
    subtopic_id,
    COUNT(*) as section_count
  FROM tutorial_sections
  GROUP BY subtopic_id;
`;

console.log('Sections by Subtopic:\n');
sections.forEach(s => {
  console.log(`Subtopic ${s.subtopic_id}: ${s.section_count} sections`);
});
