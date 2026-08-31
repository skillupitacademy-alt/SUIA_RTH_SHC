import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\nACTUAL DATABASE TABLE INVENTORY\n');

try {
  const tables = await pool.query(`
    SELECT 
      table_schema,
      table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  console.log(`Total physical tables: ${tables.rows.length}\n`);
  
  tables.rows.forEach((row, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${row.table_name}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
