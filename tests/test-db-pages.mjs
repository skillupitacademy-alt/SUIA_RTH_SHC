import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
  select domain_slug, subject_slug, topic_slug, subtopic_slug, id as navigation_node_id, title 
  from sidebar_navigation 
  where subtopic_slug='whatisjava' and type='page' 
  limit 5
`;

pool.query(sql)
  .then(r => {
    console.log('Pages in whatisjava subtopic:');
    console.log(r.rows);
    return pool.end();
  })
  .catch(e => {
    console.error('Query failed:', e.message);
    process.exit(1);
  });
