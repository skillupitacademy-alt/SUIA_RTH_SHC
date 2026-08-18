import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('\nChecking hierarchy database...\n');

try {
  const domains = await pool.query('SELECT COUNT(*) FROM domains WHERE deleted_at IS NULL');
  const subjects = await pool.query('SELECT COUNT(*) FROM subjects WHERE deleted_at IS NULL');
  const topics = await pool.query('SELECT COUNT(*) FROM topics WHERE deleted_at IS NULL');
  const subtopics = await pool.query('SELECT COUNT(*) FROM subtopics WHERE deleted_at IS NULL');
  
  console.log(`Domains: ${domains.rows[0].count}`);
  console.log(`Subjects: ${subjects.rows[0].count}`);
  console.log(`Topics: ${topics.rows[0].count}`);
  console.log(`Subtopics: ${subtopics.rows[0].count}\n`);
  
  if (parseInt(domains.rows[0].count) > 0) {
    const domainSample = await pool.query('SELECT id, name FROM domains WHERE deleted_at IS NULL LIMIT 3');
    console.log('Sample domains:');
    domainSample.rows.forEach(d => console.log(`  - ${d.name} (${d.id.slice(0, 8)}...)`));
    console.log('');
  }
  
  if (parseInt(subjects.rows[0].count) > 0) {
    const subjectSample = await pool.query('SELECT id, name, domain_id FROM subjects WHERE deleted_at IS NULL LIMIT 3');
    console.log('Sample subjects:');
    subjectSample.rows.forEach(s => console.log(`  - ${s.name} (${s.id.slice(0, 8)}..., domain: ${s.domain_id.slice(0, 8)}...)`));
    console.log('');
  }
  
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
