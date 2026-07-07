/**
 * Check quiz_platform_prod database schema
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

async function checkSchema() {
  try {
    console.log('\n📊 Checking quiz_platform_prod schema...\n');
    
    // Get all tables
    const tables = await pool.query(`
      SELECT tablename, schemaname
      FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);
    
    console.log(`Found ${tables.rows.length} tables:\n`);
    
    // Group by schema
    const schemas = {};
    tables.rows.forEach(row => {
      if (!schemas[row.schemaname]) {
        schemas[row.schemaname] = [];
      }
      schemas[row.schemaname].push(row.tablename);
    });
    
    // Print tables by schema
    Object.keys(schemas).forEach(schema => {
      console.log(`Schema: ${schema}`);
      schemas[schema].forEach(table => {
        console.log(`  - ${table}`);
      });
      console.log('');
    });
    
    // Check for hierarchy-related tables specifically
    const hierarchyTables = await pool.query(`
      SELECT tablename, schemaname
      FROM pg_tables 
      WHERE (
        tablename LIKE '%domain%' OR
        tablename LIKE '%subject%' OR
        tablename LIKE '%topic%' OR
        tablename LIKE '%skill%'
      )
      AND schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY tablename
    `);
    
    if (hierarchyTables.rows.length > 0) {
      console.log('\n📋 Hierarchy-related tables:\n');
      hierarchyTables.rows.forEach(row => {
        console.log(`  ${row.schemaname}.${row.tablename}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
