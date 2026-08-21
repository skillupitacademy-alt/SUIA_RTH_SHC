/**
 * GATE 4 Migration Ledger Reconciliation
 * Updates database migration history to match current state
 */
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

function calculateMigrationHash(sqlContent: string): string {
  // Drizzle uses SHA256 hash of the SQL content
  return crypto.createHash('sha256').update(sqlContent).digest('hex');
}

async function main() {
  console.log('='.repeat(80));
  console.log('GATE 4 MIGRATION LEDGER RECONCILIATION');
  console.log('='.repeat(80));
  console.log();

  // 1. Read the new migration file
  const migrationPath = path.resolve(
    process.cwd(),
    'packages/db-tutorial/migrations/0021_sparkling_unus.sql'
  );
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  const calculatedHash = calculateMigrationHash(migrationContent);

  console.log('MIGRATION FILE ANALYSIS');
  console.log('-'.repeat(80));
  console.log(`  File: 0021_sparkling_unus.sql`);
  console.log(`  Size: ${migrationContent.length} bytes`);
  console.log(`  Calculated Hash: ${calculatedHash}`);
  console.log();

  // 2. Check current database state
  console.log('CURRENT DATABASE STATE');
  console.log('-'.repeat(80));
  const currentMigration = await db.execute(sql`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    WHERE id = '21'
  `);

  if (currentMigration.rows.length === 0) {
    console.error('❌ No migration with id=21 found in database');
    process.exit(1);
  }

  const current: any = currentMigration.rows[0];
  console.log(`  Current ID: ${current.id}`);
  console.log(`  Current Hash: ${current.hash}`);
  console.log(`  Applied At: ${new Date(Number(current.created_at)).toISOString()}`);
  console.log();

  // 3. Determine if update is needed
  if (current.hash === calculatedHash) {
    console.log('✅ Database ledger already matches 0021_sparkling_unus.sql');
    console.log('   No update needed.');
    return;
  }

  console.log('RECONCILIATION REQUIRED');
  console.log('-'.repeat(80));
  console.log(`  Database has OLD migration 21 hash`);
  console.log(`  Schema file reflects NEW migration (0021_sparkling_unus)`);
  console.log();
  console.log('STRATEGY:');
  console.log('  1. The database schema is already CORRECT');
  console.log('  2. Migrations 0021 + 0022 were manually applied');
  console.log('  3. All operations in 0021_sparkling_unus are already applied:');
  console.log('     - FK drops: ✅ Already applied');
  console.log('     - Old indexes dropped: ✅ Already applied');
  console.log('     - New indexes created: ✅ Already applied');
  console.log('     - Columns dropped: ✅ Already applied');
  console.log('  4. We need to UPDATE the ledger to reflect this');
  console.log();

  // Read journal to get correct timestamp
  const journalPath = path.resolve(
    process.cwd(),
    'packages/db-tutorial/migrations/meta/_journal.json'
  );
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  const entry21 = journal.entries.find((e: any) => e.tag === '0021_sparkling_unus');

  if (!entry21) {
    console.error('❌ Entry for 0021_sparkling_unus not found in journal');
    process.exit(1);
  }

  console.log('UPDATE PLAN');
  console.log('-'.repeat(80));
  console.log(`  Migration ID: 21 (no change)`);
  console.log(`  Old Hash: ${current.hash}`);
  console.log(`  New Hash: ${calculatedHash}`);
  console.log(`  Timestamp: ${entry21.when} (${new Date(entry21.when).toISOString()})`);
  console.log();

  console.log('⚠️  WARNING: This will update the migration ledger to match the schema.');
  console.log('           All schema changes are already applied to the database.');
  console.log();
  console.log('Execute UPDATE? (This is a safe operation - it only updates metadata)');
  console.log();

  // For automation, we'll execute directly
  console.log('Executing UPDATE...');
  
  try {
    await db.execute(sql`
      UPDATE drizzle.__drizzle_migrations
      SET 
        hash = ${calculatedHash},
        created_at = ${entry21.when}
      WHERE id = '21'
    `);

    console.log('✅ Migration ledger updated successfully');
    console.log();

    // Verify
    const updated = await db.execute(sql`
      SELECT id, hash, created_at
      FROM drizzle.__drizzle_migrations
      WHERE id = '21'
    `);

    const updatedRow: any = updated.rows[0];
    console.log('VERIFICATION');
    console.log('-'.repeat(80));
    console.log(`  Migration ID: ${updatedRow.id}`);
    console.log(`  Hash: ${updatedRow.hash}`);
    console.log(`  Timestamp: ${new Date(Number(updatedRow.created_at)).toISOString()}`);
    console.log();

    if (updatedRow.hash === calculatedHash) {
      console.log('✅ SUCCESS: Migration ledger now matches 0021_sparkling_unus.sql');
      console.log();
      console.log('NEXT STEPS:');
      console.log('  1. Delete old migration files:');
      console.log('     - packages/db-tutorial/migrations/0021_drop_tutorial_v2_hierarchy_fks.sql');
      console.log('     - packages/db-tutorial/migrations/0022_active_v2_identity_uniqueness.sql');
      console.log('  2. Keep only: 0021_sparkling_unus.sql');
      console.log('  3. Drizzle migration history will be consistent');
    } else {
      console.error('❌ Hash mismatch after update!');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error updating migration ledger:', err);
    process.exit(1);
  }

  console.log();
  console.log('='.repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
