import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('=== POSTGRESQL VERSION CHECK ===\n');

try {
  const result = await pool.query('SELECT version()');
  console.log('PostgreSQL Version:');
  console.log(result.rows[0].version);
  console.log('\n');
  
  // Also check server version number
  const versionNum = await pool.query('SHOW server_version');
  console.log('Server Version Number:', versionNum.rows[0].server_version);
  
} catch (error) {
  console.error('ERROR:', error.message);
} finally {
  await pool.end();
}
