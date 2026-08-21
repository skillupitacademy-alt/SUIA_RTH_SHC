import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  // Check for tables with 'prompt' in the name
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE '%prompt%'
    ORDER BY table_name
  `);
  
  console.log('Tables with "prompt" in name:');
  console.log(JSON.stringify(tables.rows, null, 2));
  
  // Check all columns that use section_type enum
  const sectionTypeUsers = await db.execute(sql`
    SELECT t.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.udt_name = 'section_type'
      AND t.table_schema = 'public'
    ORDER BY t.table_name
  `);
  
  console.log('\nTables using section_type enum:');
  console.log(JSON.stringify(sectionTypeUsers.rows, null, 2));
  
  // Check all columns that use subsection_type enum
  const subsectionTypeUsers = await db.execute(sql`
    SELECT t.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.udt_name = 'subsection_type'
      AND t.table_schema = 'public'
    ORDER BY t.table_name
  `);
  
  console.log('\nTables using subsection_type enum:');
  console.log(JSON.stringify(subsectionTypeUsers.rows, null, 2));
}

main().catch(console.error);
