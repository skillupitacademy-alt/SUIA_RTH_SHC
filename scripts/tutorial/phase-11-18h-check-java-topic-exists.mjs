import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
console.log('Using DATABASE_URL (quiz_platform_prod)');
console.log('');

const JAVA_TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
const BACKEND_SUBJECT_ID = '3a706051-9d9d-4bdf-af48-331a5acd557e';

console.log('');
console.log('Checking MainDB for Java topic...');
console.log('Target topic ID:', JAVA_TOPIC_ID);
console.log('');

// Check by exact ID
const byId = await pool.query(`
  SELECT t.*, s.name as subject_name, d.name as domain_name
  FROM topics t
  LEFT JOIN subjects s ON t.subject_id = s.id
  LEFT JOIN domains d ON s.domain_id = d.id
  WHERE t.id = $1
`, [JAVA_TOPIC_ID]);

console.log('Query by ID result:', byId.rows.length, 'rows');
if (byId.rows.length > 0) {
  console.log(JSON.stringify(byId.rows, null, 2));
} else {
  console.log('❌ Topic ID not found in MainDB');
}

console.log('');
console.log('Checking all topics under Backend Development subject...');
console.log('Backend subject ID:', BACKEND_SUBJECT_ID);
console.log('');

const bySubject = await pool.query(`
  SELECT t.id, t.name, t.subject_id, t.deleted_at,
         s.name as subject_name
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE t.subject_id = $1
  ORDER BY t.name
`, [BACKEND_SUBJECT_ID]);

console.log('Topics under Backend Development:', bySubject.rows.length);
if (bySubject.rows.length > 0) {
  console.log(JSON.stringify(bySubject.rows, null, 2));
} else {
  console.log('❌ No topics found under Backend Development');
}

console.log('');
console.log('Searching for any topic named "Java" (case-insensitive)...');
console.log('');

const byName = await pool.query(`
  SELECT t.id, t.name, t.subject_id, t.deleted_at,
         s.name as subject_name, d.name as domain_name
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  JOIN domains d ON s.domain_id = d.id
  WHERE t.name ILIKE 'Java'
  ORDER BY t.name
`);

console.log('Topics named "Java":', byName.rows.length);
if (byName.rows.length > 0) {
  console.log(JSON.stringify(byName.rows, null, 2));
} else {
  console.log('❌ No topic named "Java" found in MainDB');
}

console.log('');
console.log('Checking subtopic...');
const JAVA_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const subtopic = await pool.query(`
  SELECT st.*, t.name as topic_name, s.name as subject_name
  FROM subtopics st
  LEFT JOIN topics t ON st.topic_id = t.id
  LEFT JOIN subjects s ON t.subject_id = s.id
  WHERE st.id = $1
`, [JAVA_SUBTOPIC_ID]);

console.log('Subtopic "What is Java?" (', JAVA_SUBTOPIC_ID, '):', subtopic.rows.length, 'rows');
if (subtopic.rows.length > 0) {
  console.log(JSON.stringify(subtopic.rows, null, 2));
} else {
  console.log('❌ Subtopic not found in MainDB');
}

await pool.end();
