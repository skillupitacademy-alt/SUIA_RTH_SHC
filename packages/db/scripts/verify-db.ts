import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  
  console.log('\n--- EXTENDED METADATA AUDIT ---');
  try {
    // List all drizzle tables
    const tables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%drizzle%';
    `;
    
    for (const t of tables) {
      const result = await sql(`SELECT count(*) as total FROM "${t.table_schema}"."${t.table_name}"`);
      const total = result[0].total;
      console.log(`Table: ${t.table_schema}.${t.table_name} | Rows: ${total}`);
      
      if (Number(total) > 0) {
        console.log(`Contents of ${t.table_schema}.${t.table_name}:`);
        const rows = await sql(`SELECT * FROM "${t.table_schema}"."${t.table_name}" LIMIT 5`);
        console.table(rows);
      }
    }
  } catch (e: any) {
    console.error('Audit Investigation Failed:', e.message);
  }
  console.log('-------------------------------------\n');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
