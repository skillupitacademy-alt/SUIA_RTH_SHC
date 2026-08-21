/**
 * Check which migrations have been applied
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
  console.log('Checking Drizzle migration history...\n');

  try {
    const result = await db.execute(sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log('Recent migrations:');
    result.rows.forEach((r: any, idx: number) => {
      console.log(`  ${idx + 1}. ${r.id}`);
      console.log(`     Hash: ${r.hash}`);
      console.log(`     Applied: ${r.created_at}`);
      console.log();
    });

    const migration0022 = result.rows.find((r: any) => String(r.id).includes('0022'));
    if (migration0022) {
      console.log('✅ Migration 0022 HAS BEEN APPLIED');
    } else {
      console.log('❌ Migration 0022 NOT FOUND in migration history');
      console.log('⚠️  The migration may not have been applied to this database');
    }
  } catch (err) {
    console.error('Error querying migration table:', err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
