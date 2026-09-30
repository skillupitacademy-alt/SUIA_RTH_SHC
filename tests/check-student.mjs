import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query(`
  SELECT email, roles, created_at 
  FROM users 
  WHERE email = 'student@skillupitacademy.com'
`);

console.log('Student account check:');
console.log(JSON.stringify(result.rows, null, 2));

await pool.end();
