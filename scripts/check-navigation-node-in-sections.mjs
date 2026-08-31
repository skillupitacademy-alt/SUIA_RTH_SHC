import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  const check = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'tutorial_sections'
      AND column_name = 'navigation_node_id'
  `);
  
  if (check.rows.length > 0) {
    console.log('✅ navigation_node_id EXISTS in tutorial_sections');
    console.log(`   Type: ${check.rows[0].data_type}`);
    console.log(`   Nullable: ${check.rows[0].is_nullable}`);
  } else {
    console.log('❌ navigation_node_id MISSING from tutorial_sections');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
