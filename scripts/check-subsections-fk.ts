import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const result = await db.execute(sql`
    SELECT 
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'tutorial_subsections'
  `);
  
  console.log('FKs to tutorial_subsections:');
  console.log(JSON.stringify(result.rows, null, 2));
}

main();
