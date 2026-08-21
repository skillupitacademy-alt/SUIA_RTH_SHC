/**
 * Manually apply migration 0022
 */
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

async function main() {
  console.log('='.repeat(60));
  console.log('MANUALLY APPLYING MIGRATION 0022');
  console.log('='.repeat(60));
  console.log();

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'packages/db-tutorial/migrations/0022_active_v2_identity_uniqueness.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Migration SQL:');
  console.log(migrationSQL);
  console.log();
  console.log('Applying...');
  console.log();

  try {
    // Step 1: Drop old constraint
    console.log('Step 1: Dropping old constraint...');
    await db.execute(sql.raw(`
      ALTER TABLE "tutorial_sections" DROP CONSTRAINT IF EXISTS "uq_tutorial_v2_identity";
    `));
    console.log('✅ Old constraint dropped');
    console.log();

    // Step 2: Create new partial unique index
    console.log('Step 2: Creating partial unique index...');
    await db.execute(sql.raw(`
      CREATE UNIQUE INDEX "uq_tutorial_v2_identity_active" 
        ON "tutorial_sections" ("subtopic_id", "brand_id") 
        WHERE "deleted_at" IS NULL;
    `));
    console.log('✅ Partial unique index created');
    console.log();

    console.log('='.repeat(60));
    console.log('✅ MIGRATION 0022 APPLIED SUCCESSFULLY');
    console.log('='.repeat(60));
  } catch (err: any) {
    console.error('❌ Migration failed:');
    console.error(err.message);
    throw err;
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
