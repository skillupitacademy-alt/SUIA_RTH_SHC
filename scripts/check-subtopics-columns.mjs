/**
 * Check column structure of subtopics table in source database
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sourceDatabaseUrl = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: sourceDatabaseUrl,
  max: 1,
});

async function test() {
  try {
    const dbName = await pool.query('SELECT current_database()');
    console.log('✅ Connected to database:', dbName.rows[0].current_database);
    console.log('');
    
    // Get column information for subtopics table
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'subtopics'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columns in subtopics table:\n');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get a sample record
    console.log('\n📄 Sample subtopic record:\n');
    const sample = await pool.query('SELECT * FROM subtopics LIMIT 1');
    if (sample.rows.length > 0) {
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    
    // Get column information for skills table
    console.log('\n\n📋 Columns in skills table:\n');
    const skillColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'skills'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    skillColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get a sample skills record
    console.log('\n📄 Sample skill record:\n');
    const skillSample = await pool.query('SELECT * FROM skills LIMIT 1');
    if (skillSample.rows.length > 0) {
      console.log(JSON.stringify(skillSample.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();
