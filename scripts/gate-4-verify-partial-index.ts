/**
 * Verify partial unique index was created correctly
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment the same way drizzle.config.ts does
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
  console.log('GATE 4 — VERIFY PARTIAL UNIQUE INDEX');
  console.log('='.repeat(60));
  console.log();

  // Check old constraint is gone
  console.log('1. Verify old constraint is removed:');
  const oldConstraint = await db.execute(sql`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'tutorial_sections'::regclass
      AND conname = 'uq_tutorial_v2_identity'
  `);
  
  if (oldConstraint.rows.length === 0) {
    console.log('   ✅ uq_tutorial_v2_identity constraint REMOVED');
  } else {
    console.log('   ❌ uq_tutorial_v2_identity constraint STILL EXISTS!');
  }
  console.log();

  // Check new partial index exists
  console.log('2. Verify new partial index exists:');
  const newIndex = await db.execute(sql`
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'tutorial_sections'
      AND indexname = 'uq_tutorial_v2_identity_active'
  `);
  
  if (newIndex.rows.length > 0) {
    console.log('   ✅ uq_tutorial_v2_identity_active index EXISTS');
    console.log(`   Definition: ${newIndex.rows[0]?.indexdef}`);
    
    const indexDef = String(newIndex.rows[0]?.indexdef || '');
    if (indexDef.includes('deleted_at IS NULL')) {
      console.log('   ✅ Index includes WHERE deleted_at IS NULL predicate');
    } else {
      console.log('   ❌ Index MISSING WHERE deleted_at IS NULL predicate!');
    }
    
    if (indexDef.includes('UNIQUE')) {
      console.log('   ✅ Index is UNIQUE');
    } else {
      console.log('   ❌ Index is NOT UNIQUE!');
    }
  } else {
    console.log('   ❌ uq_tutorial_v2_identity_active index NOT FOUND!');
  }
  console.log();

  console.log('='.repeat(60));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
