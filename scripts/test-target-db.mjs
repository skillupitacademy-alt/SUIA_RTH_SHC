/**
 * Test target database connection and check table structure
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const targetDatabaseUrl = process.env.SKILLHUBCORE_DATABASE_URL || process.env.DATABASE_URL_TUTORIAL;

console.log('Testing target database connection...\n');
console.log('URL:', targetDatabaseUrl.replace(/:[^:]*@/, ':****@'));
console.log('');

const pool = new Pool({
  connectionString: targetDatabaseUrl,
  max: 1,
});

async function test() {
  try {
    const dbName = await pool.query('SELECT current_database()');
    console.log('✅ Connected to database:', dbName.rows[0].current_database);
    
    // List all tables
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
    
    // Check for hierarchy tables
    const hierarchyTables = ['domains', 'subjects', 'topics', 'subtopics', 'skills', 'topic_skills'];
    console.log('\n🔍 Checking for hierarchy tables:\n');
    
    for (const table of hierarchyTables) {
      const exists = tables.rows.some(r => r.tablename === table);
      if (exists) {
        // Check columns
        const columns = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`  ✅ ${table}:`);
        console.log(`     Columns: ${columns.rows.map(c => c.column_name).join(', ')}`);
        
        // Try to count
        try {
          const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`     Records: ${count.rows[0].count}`);
        } catch (error) {
          console.log(`     Error counting: ${error.message}`);
        }
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
