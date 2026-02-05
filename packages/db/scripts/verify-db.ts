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
  
  console.log('\n--- DATABASE VERIFICATION REPORT ---');

  // 1) table exists
  const tableCheck = await sql`select to_regclass('public.idempotency_keys') as idempotency_keys_table;`;
  console.log('1) Idempotency Keys Table:', tableCheck[0].idempotency_keys_table || 'MISSING');

  // 2) column exists
  const columnCheck = await sql`
    select column_name
    from information_schema.columns
    where table_name='exams' and column_name='duration_seconds';
  `;
  console.log('2) duration_seconds in exams:', columnCheck.length > 0 ? 'EXISTS' : 'MISSING');

  // 3) indexes exist
  const indexCheck = await sql`
    select indexname
    from pg_indexes
    where tablename in ('exam_questions','idempotency_keys')
      and indexname in ('unq_exam_question','unq_exam_order','unq_user_key');
  `;
  console.log('3) Indexes Found:', indexCheck.map(i => i.indexname).join(', ') || 'NONE');

  // 4) drizzle migration proof
  console.log('4) Drizzle Tracking:');
  const drizzleTables = await sql`
    select table_name, table_schema
    from information_schema.tables
    where table_name like '%drizzle%';
  `;
  if (drizzleTables.length === 0) {
    console.log('   - No Drizzle tables found.');
  } else {
    for (const t of drizzleTables) {
      console.log(`   - Found: ${t.table_schema}.${t.table_name}`);
      try {
        const logs = await sql(`select id, hash, created_at from "${t.table_schema}"."${t.table_name}" order by created_at desc limit 5`);
        logs.forEach((m: any) => console.log(`     - ID: ${m.id} | Created: ${new Date(m.created_at).toLocaleString()}`));
      } catch (e: any) {
        console.log(`     - Error reading ${t.table_name}: ${e.message}`);
      }
    }
  }
  
  console.log('------------------------------------\n');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
