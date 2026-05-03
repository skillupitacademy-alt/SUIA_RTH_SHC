/**
 * Check Tutorial Sections Schema
 * ===============================
 * Checks the tutorial_sections table structure
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkTutorialSectionsSchema() {
  console.log('[CHECK] Checking tutorial_sections table schema...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Get all columns
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'tutorial_sections'
      ORDER BY ordinal_position;
    `);

    if (columns.rows.length === 0) {
      console.log('[FAIL] tutorial_sections table does NOT exist\n');
      return;
    }

    console.log('[PASS] tutorial_sections table exists\n');
    console.log('Columns:');
    console.log('----------------------------------------------------------------');
    
    columns.rows.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
    });

    console.log('');

    // Check for status column specifically
    const statusCol = columns.rows.find((c: any) => c.column_name === 'status');
    if (statusCol) {
      console.log('[INFO] Status column details:');
      console.log(`  Type: ${statusCol.data_type}`);
      console.log(`  UDT Name: ${statusCol.udt_name}`);
      console.log('');

      // If it's an enum, get the values
      if (statusCol.data_type === 'USER-DEFINED') {
        const enumValues = await pool.query(`
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (
            SELECT oid FROM pg_type WHERE typname = $1
          )
          ORDER BY enumsortorder;
        `, [statusCol.udt_name]);

        console.log(`[INFO] Enum '${statusCol.udt_name}' values:`);
        enumValues.rows.forEach((e: any) => console.log(`  - ${e.enumlabel}`));
        console.log('');
      }
    } else {
      console.log('[WARNING] No status column found in tutorial_sections\n');
    }

  } catch (error) {
    console.log('[FAIL] Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkTutorialSectionsSchema();
