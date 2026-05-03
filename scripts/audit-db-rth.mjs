import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_RTH });

try {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('\n=== RTH BRAND DATABASE (rth_prod) ===');
  console.log(`Total tables: ${result.rows.length}\n`);
  result.rows.forEach(r => console.log(`  - ${r.table_name}`));
  
} catch (err) {
  console.error('ERROR:', err.message);
} finally {
  await pool.end();
}
