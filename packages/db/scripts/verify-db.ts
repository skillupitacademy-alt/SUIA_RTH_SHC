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
  const drizzleCheck = await sql`
    select table_name
    from information_schema.tables
    where table_name like '%drizzle%';
  `;
  console.log('4) Drizzle Tables:', drizzleCheck.map(t => t.table_name).join(', ') || 'NONE');
  
  console.log('------------------------------------\n');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
