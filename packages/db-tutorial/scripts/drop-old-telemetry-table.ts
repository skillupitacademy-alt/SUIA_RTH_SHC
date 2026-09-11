/**
 * Phase D-2: Drop old incorrect block_telemetry_events table
 * 
 * REASON: Migration 0026 contains ALTER statements, indicating an incorrect
 * table exists from earlier pause with wrong types (TEXT user_id, UUID navigation_node_id).
 * 
 * Must drop and regenerate with correct types (UUID user_id, TEXT navigation_node_id).
 * 
 * This follows the established packages/db-tutorial/scripts pattern.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { db } from '../src/db';

// Load environment variables (same pattern as drizzle.config.ts)
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

async function dropOldTable() {
  console.log('========================================');
  console.log('Phase D-2: Drop Incorrect Telemetry Table');
  console.log('========================================\n');

  try {
    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'block_telemetry_events'
      );
    `);

    const tableExists = tableCheck.rows[0]?.exists;
    console.log(`block_telemetry_events table exists: ${tableExists}\n`);

    if (!tableExists) {
      console.log('✅ Table does not exist - nothing to drop');
      console.log('\nReady to regenerate migration with correct schema.\n');
      console.log('========================================');
      console.log('Drop Complete');
      console.log('========================================');
      return;
    }

    // Verify table has wrong types (diagnostic)
    console.log('Checking current table structure...\n');
    const columnInfo = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'block_telemetry_events'
      ORDER BY ordinal_position;
    `);

    console.log('Current columns:');
    for (const row of columnInfo.rows) {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    }
    console.log('');

    // Drop the table
    console.log('Dropping block_telemetry_events...\n');
    await db.execute(sql`DROP TABLE IF EXISTS block_telemetry_events CASCADE;`);
    
    // Verify it's gone
    const verifyDrop = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'block_telemetry_events'
      );
    `);

    if (!verifyDrop.rows[0]?.exists) {
      console.log('✅ Table dropped successfully\n');
    } else {
      console.log('❌ Table still exists after drop attempt\n');
      process.exit(1);
    }

    console.log('Next steps:');
    console.log('1. Delete migration 0026_gigantic_blue_marvel.sql');
    console.log('2. Run: pnpm drizzle-kit generate');
    console.log('3. Verify new migration creates table with correct types:\n');
    console.log('   ✓ user_id UUID (not TEXT)');
    console.log('   ✓ navigation_node_id TEXT (not UUID)');
    console.log('   ✓ event_id TEXT UNIQUE');
    console.log('   ✓ active_time_sec INTEGER');
    console.log('   ✓ timestamps TIMESTAMP (not TIMESTAMPTZ)\n');

    console.log('========================================');
    console.log('Drop Complete');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Error dropping table:');
    console.error(error);
    process.exit(1);
  }
}

dropOldTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
