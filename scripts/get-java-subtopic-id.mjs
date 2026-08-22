#!/usr/bin/env node
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

try {
  // Query for "What Is Java?" subtopic
  const result = await db.execute(sql`
    SELECT s.id, s.name, t.name as topic_name, sub.name as subject_name, d.name as domain_name
    FROM subtopics s
    JOIN topics t ON s.topic_id = t.id
    JOIN subjects sub ON t.subject_id = sub.id
    JOIN domains d ON sub.domain_id = d.id
    WHERE s.name ILIKE '%What Is Java%'
    OR s.name ILIKE '%Java%'
    LIMIT 10
  `);
  
  if (result.rows && result.rows.length > 0) {
    console.log('Found Java-related subtopics:\n');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.name}`);
      console.log(`   Path: ${row.domain_name} > ${row.subject_name} > ${row.topic_name}`);
      console.log(`   ID: ${row.id}\n`);
    });
    
    console.log('To use the first one:');
    console.log(`$env:TEST_SUBTOPIC_ID="${result.rows[0].id}"`);
  } else {
    console.log('No Java subtopics found');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
