import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.SKILLHUBCORE_DATABASE_URL });

const result = await pool.query(`
  SELECT d.id as domain_id, d.name as domain_name,
         s.id as subject_id, s.name as subject_name,
         COUNT(t.id) as topic_count
  FROM domains d
  JOIN subjects s ON s.domain_id = d.id
  LEFT JOIN topics t ON t.subject_id = s.id AND t.deleted_at IS NULL
  WHERE d.deleted_at IS NULL AND s.deleted_at IS NULL
  GROUP BY d.id, d.name, s.id, s.name
  ORDER BY d.name, s.name
`);

console.log('MainDB Domain/Subject/Topic structure:');
console.log(JSON.stringify(result.rows, null, 2));

await pool.end();
