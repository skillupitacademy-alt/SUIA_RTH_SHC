import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  // Check section_status enum
  const statusEnum = await pool.query(`
    SELECT unnest(enum_range(NULL::section_status)) as status_value
  `);
  
  console.log('\nsection_status enum values:');
  statusEnum.rows.forEach(row => console.log(`  - ${row.status_value}`));
  
  // Check actual status values in table
  const actualStatus = await pool.query(`
    SELECT DISTINCT status FROM tutorial_sections ORDER BY status
  `);
  
  console.log('\nActual status values in tutorial_sections:');
  actualStatus.rows.forEach(row => console.log(`  - ${row.status}`));
  
  // Check sample rows
  const sample = await pool.query(`
    SELECT status, COUNT(*) as count 
    FROM tutorial_sections 
    GROUP BY status
  `);
  
  console.log('\nStatus distribution:');
  sample.rows.forEach(row => console.log(`  ${row.status}: ${row.count}`));
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
