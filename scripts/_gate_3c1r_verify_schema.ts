/**
 * Schema Reconciliation Query
 * Returns exact PostgreSQL column definitions for comparison
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

async function main() {
  // Get column details
  const columns = await db.execute(sql`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'block_learning_state'
    ORDER BY ordinal_position;
  `);

  console.log('block_learning_state columns:');
  console.log(JSON.stringify(columns.rows, null, 2));
}

main();
