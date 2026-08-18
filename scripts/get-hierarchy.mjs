import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const domains = await pool.query('SELECT id, name FROM domains WHERE deleted_at IS NULL ORDER BY name LIMIT 1');
  const domain = domains.rows[0];
  
  const subjects = await pool.query('SELECT id, name FROM subjects WHERE domain_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [domain.id]);
  const subject = subjects.rows[0];
  
  const topics = await pool.query('SELECT id, name FROM topics WHERE subject_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [subject.id]);
  const topic = topics.rows[0];
  
  const subtopics = await pool.query('SELECT id, name FROM subtopics WHERE topic_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [topic.id]);
  const subtopic = subtopics.rows[0];
  
  console.log(JSON.stringify({
    domain: { id: domain.id, name: domain.name },
    subject: { id: subject.id, name: subject.name },
    topic: { id: topic.id, name: topic.name },
    subtopic: { id: subtopic.id, name: subtopic.name }
  }, null, 2));
  
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
