/**
 * Phase D-2: Verify Actual PostgreSQL Schema
 * 
 * CRITICAL: Do not rely on migration exit code alone.
 * Must inspect actual PostgreSQL catalog to verify:
 * - Table exists
 * - Column types match design
 * - Constraints/indexes exist
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { db } from '../src/db';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded env from: ${envPath}\n`);
    break;
  }
}

async function verifyMigration() {
  console.log('========================================');
  console.log('Phase D-2: PostgreSQL Schema Verification');
  console.log('========================================\n');

  try {
    // 1. Verify table exists
    console.log('## 1. TABLE EXISTENCE\n');
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'block_telemetry_events'
      );
    `);

    const tableExists = tableCheck.rows[0]?.exists;
    console.log(`block_telemetry_events exists: ${tableExists ? '✅ YES' : '❌ NO'}\n`);

    if (!tableExists) {
      console.log('❌ FAIL: Table does not exist\n');
      process.exit(1);
    }

    // 2. Verify columns and types
    console.log('## 2. COLUMN TYPES\n');
    const columnInfo = await db.execute(sql`
      SELECT 
        column_name, 
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'block_telemetry_events'
      ORDER BY ordinal_position;
    `);

    const expectedColumns = {
      id: { type: 'uuid', nullable: 'NO' },
      event_id: { type: 'text', nullable: 'NO' },
      user_id: { type: 'uuid', nullable: 'NO' },
      navigation_node_id: { type: 'text', nullable: 'NO' },
      block_id: { type: 'text', nullable: 'NO' },
      block_version: { type: 'text', nullable: 'NO' },
      active_time_sec: { type: 'int4', nullable: 'NO' },
      processed_at: { type: 'timestamp', nullable: 'NO' },
      created_at: { type: 'timestamp', nullable: 'NO' },
    };

    console.log('| Column | Expected | Actual | Status |');
    console.log('|--------|----------|--------|--------|');

    let columnCheckPassed = true;
    for (const row of columnInfo.rows) {
      const colName = row.column_name as string;
      const expected = expectedColumns[colName as keyof typeof expectedColumns];
      
      if (!expected) {
        console.log(`| ${colName} | - | ${row.udt_name} | ⚠️ UNEXPECTED |`);
        columnCheckPassed = false;
        continue;
      }

      const typeMatch = row.udt_name === expected.type;
      const nullMatch = row.is_nullable === expected.nullable;
      const status = (typeMatch && nullMatch) ? '✅ PASS' : '❌ FAIL';
      
      if (!typeMatch || !nullMatch) {
        columnCheckPassed = false;
      }

      console.log(`| ${colName} | ${expected.type} | ${row.udt_name} | ${status} |`);
    }

    // Check for missing columns
    for (const [colName, expected] of Object.entries(expectedColumns)) {
      const found = columnInfo.rows.some((r: any) => r.column_name === colName);
      if (!found) {
        console.log(`| ${colName} | ${expected.type} | MISSING | ❌ FAIL |`);
        columnCheckPassed = false;
      }
    }

    console.log('');

    // 3. Verify PRIMARY KEY
    console.log('## 3. PRIMARY KEY\n');
    const pkCheck = await db.execute(sql`
      SELECT 
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'block_telemetry_events'
        AND tc.constraint_type = 'PRIMARY KEY';
    `);

    const hasPK = pkCheck.rows.length > 0;
    const pkColumn = pkCheck.rows[0]?.column_name;
    const pkCorrect = pkColumn === 'id';

    console.log(`Primary key exists: ${hasPK ? '✅ YES' : '❌ NO'}`);
    console.log(`Primary key column: ${pkColumn} ${pkCorrect ? '✅ (correct)' : '❌ (expected: id)'}\n`);

    // 4. Verify UNIQUE constraint on event_id
    console.log('## 4. UNIQUE CONSTRAINT\n');
    const uniqueCheck = await db.execute(sql`
      SELECT 
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'block_telemetry_events'
        AND ix.indisunique = true
        AND i.relname != t.relname || '_pkey';
    `);

    const eventIdUnique = uniqueCheck.rows.some((r: any) => 
      r.column_name === 'event_id' && r.is_unique
    );

    console.log(`UNIQUE(event_id): ${eventIdUnique ? '✅ YES' : '❌ NO'}\n`);

    // 5. Verify indexes
    console.log('## 5. INDEXES\n');
    const indexCheck = await db.execute(sql`
      SELECT 
        i.relname as index_name,
        array_agg(a.attname ORDER BY a.attnum) as columns
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'block_telemetry_events'
      GROUP BY i.relname;
    `);

    const expectedIndexes = [
      'uq_block_telemetry_event_id',
      'idx_block_telemetry_events_block_lookup',
      'idx_block_telemetry_events_cleanup',
    ];

    console.log('| Index | Status |');
    console.log('|-------|--------|');
    
    let indexCheckPassed = true;
    for (const expectedIdx of expectedIndexes) {
      const found = indexCheck.rows.some((r: any) => r.index_name === expectedIdx);
      console.log(`| ${expectedIdx} | ${found ? '✅ EXISTS' : '❌ MISSING'} |`);
      if (!found) indexCheckPassed = false;
    }

    console.log('');

    // 6. Verify timestamp type details
    console.log('## 6. TIMESTAMP DETAILS\n');
    const timestampCheck = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        datetime_precision
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'block_telemetry_events'
      AND column_name IN ('processed_at', 'created_at');
    `);

    console.log('| Column | Type | Status |');
    console.log('|--------|------|--------|');
    
    let timestampCheckPassed = true;
    for (const row of timestampCheck.rows) {
      const isCorrect = row.data_type === 'timestamp without time zone';
      const status = isCorrect ? '✅ correct (no timezone)' : '❌ wrong (has timezone)';
      console.log(`| ${row.column_name} | ${row.data_type} | ${status} |`);
      if (!isCorrect) timestampCheckPassed = false;
    }

    console.log('');

    // 7. Final verdict
    console.log('## 7. FINAL VERDICT\n');
    
    const allChecks = {
      'Table exists': tableExists,
      'Column types correct': columnCheckPassed,
      'Primary key correct': hasPK && pkCorrect,
      'UNIQUE(event_id) exists': eventIdUnique,
      'Required indexes exist': indexCheckPassed,
      'Timestamps without timezone': timestampCheckPassed,
    };

    console.log('| Check | Status |');
    console.log('|-------|--------|');
    for (const [check, passed] of Object.entries(allChecks)) {
      console.log(`| ${check} | ${passed ? '✅ PASS' : '❌ FAIL'} |`);
    }

    console.log('');

    const allPassed = Object.values(allChecks).every(v => v === true);

    if (allPassed) {
      console.log('✅ MIGRATION VERIFICATION: PASS\n');
      console.log('PostgreSQL schema matches D-2 design specification.');
      console.log('Ready to proceed with repository/service implementation.\n');
    } else {
      console.log('❌ MIGRATION VERIFICATION: FAIL\n');
      console.log('Schema mismatch detected. Review failed checks above.\n');
      process.exit(1);
    }

    console.log('========================================');
    console.log('Verification Complete');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Verification failed with error:');
    console.error(error);
    process.exit(1);
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
