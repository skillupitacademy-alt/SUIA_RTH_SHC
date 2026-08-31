/**
 * PHASE 1C — PRE-MIGRATION VERIFICATION
 * Verify database state before migration
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n' + '='.repeat(80));
console.log('PHASE 1C — PRE-MIGRATION VERIFICATION');
console.log('='.repeat(80));

try {
  // 1. Check if table already exists
  console.log('\n## 1. TABLE EXISTENCE CHECK');
  console.log('-'.repeat(80));
  
  const tableCheck = await pool.query(`
    SELECT to_regclass('public.tutorial_navigation_progress') as table_exists
  `);
  
  const exists = tableCheck.rows[0].table_exists;
  
  if (exists) {
    console.log(`\n❌ BLOCKING: tutorial_navigation_progress ALREADY EXISTS`);
    console.log('   Migration should NOT be executed');
    process.exit(1);
  } else {
    console.log(`\n✅ tutorial_navigation_progress does NOT exist (safe to create)`);
  }
  
  // 2. Verify enum exists
  console.log('\n## 2. ENUM VERIFICATION');
  console.log('-'.repeat(80));
  
  const enumCheck = await pool.query(`
    SELECT typname
    FROM pg_type
    WHERE typname = 'tutorial_progress_status'
  `);
  
  if (enumCheck.rows.length === 0) {
    console.log(`\n❌ BLOCKING: tutorial_progress_status enum MISSING`);
    process.exit(1);
  } else {
    console.log(`\n✅ tutorial_progress_status enum EXISTS`);
  }
  
  // 3. Verify enum values
  const enumValues = await pool.query(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'tutorial_progress_status'
    ORDER BY e.enumsortorder
  `);
  
  const values = enumValues.rows.map(r => r.enumlabel);
  console.log(`   Values: ${values.join(', ')}`);
  
  const expectedValues = ['not_started', 'in_progress', 'completed'];
  const valuesMatch = JSON.stringify(values) === JSON.stringify(expectedValues);
  
  if (!valuesMatch) {
    console.log(`\n⚠️  WARNING: enum values differ from expected`);
    console.log(`   Expected: ${expectedValues.join(', ')}`);
    console.log(`   Actual: ${values.join(', ')}`);
  } else {
    console.log(`   ✅ EXACT MATCH to source schema`);
  }
  
  // 4. Verify UUID function
  console.log('\n## 3. UUID GENERATION VERIFICATION');
  console.log('-'.repeat(80));
  
  try {
    const uuidTest = await pool.query(`SELECT gen_random_uuid() as test_uuid`);
    console.log(`\n✅ gen_random_uuid() AVAILABLE`);
    console.log(`   Sample: ${uuidTest.rows[0].test_uuid}`);
  } catch (error) {
    console.log(`\n❌ BLOCKING: gen_random_uuid() NOT AVAILABLE`);
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // 5. Verify JSONB support
  console.log('\n## 4. JSONB VERIFICATION');
  console.log('-'.repeat(80));
  
  try {
    await pool.query(`SELECT '[]'::jsonb as test_jsonb`);
    console.log(`\n✅ JSONB type AVAILABLE`);
  } catch (error) {
    console.log(`\n❌ BLOCKING: JSONB NOT AVAILABLE`);
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('PRE-MIGRATION VERIFICATION: PASS');
  console.log('='.repeat(80));
  console.log('\n✅ Safe to generate migration for tutorial_navigation_progress\n');
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
