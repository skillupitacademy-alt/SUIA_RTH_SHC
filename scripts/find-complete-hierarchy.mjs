import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('\nFinding complete hierarchy chain...\n');

try {
  // Find a complete chain
  const result = await pool.query(`
    SELECT 
      d.id as domain_id, d.name as domain_name,
      sub.id as subject_id, sub.name as subject_name,
      t.id as topic_id, t.name as topic_name
    FROM domains d
    INNER JOIN subjects sub ON sub.domain_id = d.id
    INNER JOIN topics t ON t.subject_id = sub.id
    WHERE d.deleted_at IS NULL 
      AND sub.deleted_at IS NULL
      AND t.deleted_at IS NULL
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    console.log('No complete hierarchy found (domain → subject → topic)');
    process.exit(1);
  }
  
  const hierarchy = result.rows[0];
  
  console.log('Found complete hierarchy:');
  console.log(`Domain:  ${hierarchy.domain_name}`);
  console.log(`         ${hierarchy.domain_id}\n`);
  console.log(`Subject: ${hierarchy.subject_name}`);
  console.log(`         ${hierarchy.subject_id}\n`);
  console.log(`Topic:   ${hierarchy.topic_name}`);
  console.log(`         ${hierarchy.topic_id}\n`);
  
  // Check for subtopic
  const subtopicResult = await pool.query(`
    SELECT id, name 
    FROM subtopics 
    WHERE topic_id = $1 AND deleted_at IS NULL 
    LIMIT 1
  `, [hierarchy.topic_id]);
  
  if (subtopicResult.rows.length > 0) {
    const subtopic = subtopicResult.rows[0];
    console.log(`Subtopic: ${subtopic.name}`);
    console.log(`          ${subtopic.id}\n`);
  } else {
    console.log('Subtopic: (none - optional)\n');
  }
  
  console.log('Use these IDs for testing.\n');
  
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
