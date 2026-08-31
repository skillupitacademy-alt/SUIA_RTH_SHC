import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\nMIGRATION TRACKING TABLE VERIFICATION\n');

try {
  // Check for Drizzle migrations table
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = '__drizzle_migrations'
    ) as exists
  `);
  
  if (!tableCheck.rows[0].exists) {
    console.log('❌ __drizzle_migrations table NOT FOUND');
    console.log('   Migrations may not have been applied');
  } else {
    console.log('✅ __drizzle_migrations table exists\n');
    
    const migrations = await pool.query(`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`Latest ${migrations.rows.length} migrations:\n`);
    migrations.rows.forEach((m, i) => {
      console.log(`${migrations.rows.length - i}. ${m.hash}`);
      console.log(`   Created: ${m.created_at}`);
      console.log(`   ID: ${m.id}`);
    });
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
