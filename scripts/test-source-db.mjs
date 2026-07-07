/**
 * Test source database connection and list tables
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sourceDatabaseUrl = process.env.DATABASE_URL;

console.log('Testing source database connection...\n');
console.log('URL:', sourceDatabaseUrl.replace(/:[^:]*@/, ':****@'));
console.log('');

const pool = new Pool({
  connectionString: sourceDatabaseUrl,
  max: 1,
});

async function test() {
  try {
    // Check which database we're connected to
    const dbName = await pool.query('SELECT current_database()');
    console.log('✅ Connected to database:', dbName.rows[0].current_database);
    
    // List all tables in public schema
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log(`\n📋 Found ${tables.rows.length} tables:\n`);
    tables.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Check specifically for hierarchy tables
    const hierarchyTables = ['domains', 'subjects', 'topics', 'subtopics', 'skills', 'topic_skills'];
    console.log('\n🔍 Checking for hierarchy tables:\n');
    
    for (const table of hierarchyTables) {
      const exists = tables.rows.some(r => r.tablename === table);
      if (exists) {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✅ ${table}: ${count.rows[0].count} records`);
      } else {
        console.log(`  ❌ ${table}: NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();
