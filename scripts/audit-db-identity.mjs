import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const sql = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  const identity = await sql.query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      version() AS version
  `);

  console.log('\n=== LOCAL DATABASE IDENTITY ===');
  console.log('Database:', identity.rows[0].database_name);
  console.log('Schema:', identity.rows[0].schema_name);
  console.log('Version:', identity.rows[0].version.substring(0, 50) + '...');

  const sidebarCount = await sql.query(`
    SELECT COUNT(*) AS count
    FROM tutorial_sidebar_trees_v2
    WHERE status = 'published'
  `);

  console.log('\n=== PUBLISHED SIDEBAR COUNT ===');
  console.log('Count:', sidebarCount.rows[0].count);

  await sql.end();
} catch (error) {
  console.error('Error:', error.message);
  await sql.end();
  process.exit(1);
}
