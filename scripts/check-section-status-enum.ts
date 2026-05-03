/**
 * Check Section Status Enum
 * ==========================
 * Verifies section_status_enum has required values
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkSectionStatusEnum() {
  console.log('[CHECK] Checking section_status_enum in tutorial database...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if enum exists
    const enumCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'section_status_enum'
      ) as exists;
    `);

    if (!enumCheck.rows[0].exists) {
      console.log('[FAIL] section_status_enum does NOT exist');
      console.log('   Need to create this enum in migration\n');
      return;
    }

    console.log('[PASS] section_status_enum exists\n');

    // Get current values
    const values = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'section_status_enum'
      )
      ORDER BY enumsortorder;
    `);

    const currentValues = values.rows.map((r: any) => r.enumlabel);
    const requiredValues = ['draft', 'in_review', 'published', 'archived'];
    const missingValues = requiredValues.filter(v => !currentValues.includes(v));

    console.log('Current enum values:', currentValues.join(', ') || 'none');
    console.log('Required values:', requiredValues.join(', '));
    console.log('');

    if (missingValues.length === 0) {
      console.log('[PASS] All required values present\n');
    } else {
      console.log('[FAIL] Missing values:', missingValues.join(', '));
      console.log('');
      console.log('To fix, run SQL:');
      missingValues.forEach(value => {
        console.log(`ALTER TYPE section_status_enum ADD VALUE IF NOT EXISTS '${value}';`);
      });
      console.log('');
    }

  } catch (error) {
    console.log('[FAIL] Error checking enum:', error);
  } finally {
    await pool.end();
  }
}

checkSectionStatusEnum();
